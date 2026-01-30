import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ArrowLeft, RefreshCw, Search, ChevronLeft, ChevronRight, FileDown 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import * as api from '../../services/api';

const EffectivenessReportPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [data, setData] = useState([]);
  
  // API Filters (Initial Date Range)
  const [apiFilters, setApiFilters] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    coordinator_code: '',
  });

  // Local Filters
  const [localFilters, setLocalFilters] = useState({
    search: '',
    gestor: '',
    coordinator: '',
    channel: '',
    status: '',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const fetchData = async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(apiFilters).filter(([_, v]) => v !== '')
      );
      const response = await api.getEffectivenessReport(activeFilters);
      setData(response || []);
      setCurrentPage(1); 
    } catch (error) {
      toast.error('Error cargando el reporte: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiFilters]);

  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      await api.refreshEffectivenessReport();
      toast.success('Actualización iniciada. Los datos se reflejarán en breve.');
      setTimeout(fetchData, 3000);
    } catch (error) {
      toast.error('Error al solicitar actualización');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownload = async (commId, filename) => {
    setDownloadingId(commId);
    try {
      const response = await api.getCommunicationPreview(commId);
      
      let blob;
      if (response instanceof Blob) {
        blob = response;
      } else if (typeof response === 'string') {
        blob = new Blob([response], { type: 'text/plain' });
      } else {
        blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `comunicado-${commId}.pdf`; 
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Descarga iniciada');
    } catch (error) {
      console.error(error);
      toast.error('Error al descargar el archivo');
    } finally {
      setDownloadingId(null);
    }
  };

  // --- Derived Data for Dropdowns ---
  const uniqueCoordinators = useMemo(() => 
    [...new Set(data.map(d => d.nombre_coordinador).filter(Boolean))].sort(), 
  [data]);

  const uniqueGestores = useMemo(() => 
    [...new Set(data.map(d => d.nombre_gestor).filter(Boolean))].sort(), 
  [data]);

  const uniqueChannels = useMemo(() => 
    [...new Set(data.map(d => d.canal).filter(Boolean))].sort(), 
  [data]);
  
  const uniqueStatuses = useMemo(() => 
    [...new Set(data.map(d => d.estado).filter(Boolean))].sort(), 
  [data]);

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search
      const searchLower = localFilters.search.toLowerCase();
      const matchesSearch = 
        !localFilters.search || 
        item.client_id?.toLowerCase().includes(searchLower) ||
        item.nombre_gestor?.toLowerCase().includes(searchLower) ||
        item.nombre_comunicacion?.toLowerCase().includes(searchLower) ||
        (item.codigo_gestor && item.codigo_gestor.toLowerCase().includes(searchLower));

      // Dropdown Filters
      const matchesGestor = !localFilters.gestor || item.nombre_gestor === localFilters.gestor;
      const matchesCoordinator = !localFilters.coordinator || item.nombre_coordinador === localFilters.coordinator;
      const matchesChannel = !localFilters.channel || item.canal === localFilters.channel;
      const matchesStatus = !localFilters.status || item.estado === localFilters.status;

      return matchesSearch && matchesGestor && matchesCoordinator && matchesChannel && matchesStatus;
    });
  }, [data, localFilters]);

  // --- Pagination Logic ---
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // --- KPIs Calculations ---
  const kpis = useMemo(() => {
    const totalSent = filteredData.length;
    
    const withPayment = filteredData.filter(d => d.hubo_pago).length;
    const totalCollected = filteredData.reduce((acc, curr) => acc + (Number(curr.valor_pago) || 0), 0);
    const paymentRate = totalSent > 0 ? ((withPayment / totalSent) * 100).toFixed(1) : 0;
    
    const withAgreement = filteredData.filter(d => d.hubo_acuerdo).length;
    const totalAgreed = filteredData.reduce((acc, curr) => acc + (Number(curr.valor_acuerdo) || 0), 0);
    const agreementRate = totalSent > 0 ? ((withAgreement / totalSent) * 100).toFixed(1) : 0;

    const totalDrafts = filteredData.filter(d => d.estado === 'DRAFT').length;

    return { 
      totalSent, 
      withPayment, 
      totalCollected, 
      paymentRate,
      withAgreement,
      totalAgreed,
      agreementRate,
      totalDrafts
    };
  }, [filteredData]);

  // --- Charts Data Preparation ---

  // 1. Chart Data by Gestor (Adminfo Code)
  // Includes: Sent, Drafts, Agreements, Payments
  const chartDataByGestor = useMemo(() => {
    const grouped = filteredData.reduce((acc, curr) => {
      const key = curr.codigo_gestor || 'N/A';
      if (!acc[key]) acc[key] = { 
        name: key, 
        fullName: curr.nombre_gestor, 
        enviados: 0, 
        drafts: 0, 
        con_pago: 0, 
        con_acuerdo: 0 
      };
      
      if (curr.estado === 'DRAFT') {
        acc[key].drafts += 1;
      } else {
        // Only count as 'enviados' if not draft (or count all? Usually 'enviados' means sent)
        acc[key].enviados += 1;
        if (curr.hubo_pago) acc[key].con_pago += 1;
        if (curr.hubo_acuerdo) acc[key].con_acuerdo += 1;
      }
      return acc;
    }, {});
    
    // Sort by total volume (Sent + Drafts) descending
    return Object.values(grouped)
      .sort((a, b) => (b.enviados + b.drafts) - (a.enviados + a.drafts))
      .slice(0, 30); 
  }, [filteredData]);

  // 2. Chart Data by Coordinator
  const chartDataByCoordinator = useMemo(() => {
    const grouped = filteredData.reduce((acc, curr) => {
      const key = curr.nombre_coordinador || 'Sin Asignar';
      if (!acc[key]) acc[key] = { name: key, total: 0 };
      acc[key].total += 1;
      return acc;
    }, {});
    
    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // 3. Top Drafts Table Data
  const topDraftsGestors = useMemo(() => {
    const grouped = filteredData
      .filter(d => d.estado === 'DRAFT')
      .reduce((acc, curr) => {
        const key = curr.nombre_gestor || 'Desconocido';
        if (!acc[key]) acc[key] = 0;
        acc[key] += 1;
        return acc;
      }, {});
      
    return Object.entries(grouped)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredData]);

  // 4. Chart Data by Template Name (Top 10)
  const chartDataByTemplateName = useMemo(() => {
    const grouped = filteredData.reduce((acc, curr) => {
      const key = curr.nombre_comunicacion || 'Desconocido';
      if (!acc[key]) acc[key] = { name: key, count: 0 };
      acc[key].count += 1;
      return acc;
    }, {});
    
    return Object.values(grouped).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredData]);

  // 5. Chart Data by Channel (Pie)
  const chartDataByChannel = useMemo(() => {
    const grouped = filteredData.reduce((acc, curr) => {
      const key = curr.canal || 'Sin Canal';
      if (!acc[key]) acc[key] = { name: key, value: 0 };
      acc[key].value += 1;
      return acc;
    }, {});
    return Object.values(grouped);
  }, [filteredData]);

  const COLORS_PIE = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  // --- Helper Functions for Colors ---
  const getStatusColor = (status) => {
    switch (status) {
      case 'SENT': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'READY_FOR_SENDING': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getChannelColor = (channel) => {
    switch (channel) {
      case 'SMS': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'EMAIL': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'WHATSAPP': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/reports')} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Reporte de Efectividad</h1>
            <p className="text-sm text-gray-500">Analizando {filteredData.length} registros</p>
        </div>
      </div>

      {/* Unified Toolbar - Refactored */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-4">
        
        {/* Row 1: Primary Search & Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Search Input */}
          <div className="md:col-span-6 lg:col-span-5">
            <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
              Búsqueda General
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="search"
                type="text"
                placeholder="Buscar por cédula, gestor, campaña..."
                value={localFilters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10"
              />
            </div>
          </div>

          {/* Date Range & Refresh */}
          <div className="md:col-span-6 lg:col-span-7 flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="startDate" className="block text-xs font-medium text-gray-700 mb-1">
                Fecha Inicial
              </label>
              <input
                id="startDate"
                type="date"
                value={apiFilters.start_date}
                onChange={e => setApiFilters(prev => ({ ...prev, start_date: e.target.value }))}
                className="block w-full border-gray-300 rounded-md shadow-sm text-sm h-10 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="endDate" className="block text-xs font-medium text-gray-700 mb-1">
                Fecha Final
              </label>
              <input
                id="endDate"
                type="date"
                value={apiFilters.end_date}
                onChange={e => setApiFilters(prev => ({ ...prev, end_date: e.target.value }))}
                className="block w-full border-gray-300 rounded-md shadow-sm text-sm h-10 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleRefreshData}
              disabled={refreshing}
              className="flex-none flex items-center justify-center w-10 h-10 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 hover:bg-white hover:text-blue-600 transition-colors"
              title="Actualizar Datos"
              aria-label="Actualizar datos"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Separator */}
        <hr className="border-gray-100" />

        {/* Row 2: Categorical Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div>
            <label htmlFor="coordinator" className="block text-xs font-medium text-gray-700 mb-1">
              Coordinador
            </label>
            <select
              id="coordinator"
              value={localFilters.coordinator}
              onChange={(e) => handleFilterChange('coordinator', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm text-sm h-10 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              {uniqueCoordinators.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="gestor" className="block text-xs font-medium text-gray-700 mb-1">
              Gestor
            </label>
            <select
              id="gestor"
              value={localFilters.gestor}
              onChange={(e) => handleFilterChange('gestor', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm text-sm h-10 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              {uniqueGestores.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="channel" className="block text-xs font-medium text-gray-700 mb-1">
              Canal
            </label>
            <select
              id="channel"
              value={localFilters.channel}
              onChange={(e) => handleFilterChange('channel', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm text-sm h-10 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              {uniqueChannels.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-xs font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              id="status"
              value={localFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm text-sm h-10 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Sent */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <p className="text-xs font-medium text-gray-500 uppercase">Enviados</p>
          <p className="text-2xl font-bold text-gray-900">{kpis.totalSent.toLocaleString()}</p>
          <p className="text-xs text-blue-600 mt-1">Total Gestionado</p>
        </div>

        {/* Drafts - NEW */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-gray-400">
          <p className="text-xs font-medium text-gray-500 uppercase">Borradores</p>
          <p className="text-2xl font-bold text-gray-700">{kpis.totalDrafts.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Pendientes de envío</p>
        </div>

        {/* Agreements */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-indigo-500 col-span-2">
          <p className="text-xs font-medium text-gray-500 uppercase">Acuerdos Generados</p>
          <div className="flex justify-between items-baseline mt-1">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{kpis.withAgreement.toLocaleString()}</p>
              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {kpis.agreementRate}% Efic.
              </span>
            </div>
            <p className="text-lg font-semibold text-indigo-600">{formatCurrency(kpis.totalAgreed)}</p>
          </div>
        </div>

        {/* Payments */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500 col-span-2">
          <p className="text-xs font-medium text-gray-500 uppercase">Recaudos Confirmados</p>
          <div className="flex justify-between items-baseline mt-1">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{kpis.withPayment.toLocaleString()}</p>
              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {kpis.paymentRate}% Efic.
              </span>
            </div>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(kpis.totalCollected)}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart: Gestor Performance (Span 2) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-2 flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Efectividad por Gestor (Código Adminfo)</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataByGestor} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis fontSize={11} />
                <Tooltip 
                   cursor={{ fill: 'transparent' }}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   labelFormatter={(value, payload) => {
                      if (payload && payload.length > 0) {
                        return `${value} - ${payload[0].payload.fullName}`;
                      }
                      return value;
                   }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="drafts" name="Borradores" stackId="a" fill="#cbd5e1" />
                <Bar dataKey="enviados" name="Enviados" stackId="a" fill="#94a3b8" />
                <Bar dataKey="con_acuerdo" name="Con Acuerdo" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="con_pago" name="Con Pago" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Coordinator Chart (Span 1) */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 lg:col-span-1 h-[400px] flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Por Coordinador</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataByCoordinator} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={10} hide />
                <YAxis dataKey="name" type="category" width={80} fontSize={10} />
                <Tooltip />
                <Bar dataKey="total" name="Total Gestión" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Three columns for details */}
        
        {/* Channel Chart */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 h-[320px] flex flex-col">
           <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Distribución por Canal</h3>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={chartDataByChannel}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   fill="#8884d8"
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {chartDataByChannel.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                   ))}
                 </Pie>
                 <Tooltip />
                 <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} verticalAlign="bottom" height={36} />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Template Frequency List */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 h-[320px] flex flex-col">
            <h3 className="text-xs font-semibold text-gray-700 mb-4 uppercase tracking-wide">Top Plantillas</h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
               {chartDataByTemplateName.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs italic">Sin datos</div>
               ) : (
                  <ul className="space-y-3">
                    {chartDataByTemplateName.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center text-xs group">
                        <span className="truncate w-32 text-gray-600 group-hover:text-blue-600 transition-colors" title={item.name}>{item.name}</span>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                           <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-blue-500 h-full rounded-full" 
                                style={{ width: `${(item.count / chartDataByTemplateName[0].count) * 100}%` }}
                              ></div>
                           </div>
                           <span className="font-bold text-gray-700 w-8 text-right">{item.count}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
               )}
            </div>
        </div>

        {/* Top Drafts Table */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 h-[320px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Top Borradores</h3>
            <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-medium">Pendientes</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <table className="min-w-full text-xs">
              <tbody className="divide-y divide-gray-50">
                {topDraftsGestors.length === 0 ? (
                  <tr><td className="py-12 text-center text-gray-400 italic">No hay borradores</td></tr>
                ) : (
                  topDraftsGestors.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 text-gray-600 font-medium truncate max-w-[140px]">{item.name}</td>
                      <td className="py-2.5 text-right">
                        <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded-md font-bold">
                          {item.count}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>


      {/* Detail Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gestor / Coord</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acuerdo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recaudo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">PDF</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">Cargando datos...</td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">No se encontraron registros con los filtros actuales.</td></tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.communication_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.fecha_envio || row.fecha_creacion}
                      {!row.fecha_envio && <span className="block text-xs text-gray-400 italic">Creado</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">{row.nombre_gestor}</span>
                        <span className="text-xs text-gray-400">{row.nombre_coordinador}</span>
                      </div>
                    </td>
                    
                    {/* Visual Badges for Channel and Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        {row.canal ? (
                          <span className={`px-2 py-0.5 inline-flex text-[10px] uppercase font-bold tracking-wide rounded border ${getChannelColor(row.canal)}`}>
                            {row.canal}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide border border-dashed border-gray-300 px-2 py-0.5 rounded">
                            Sin Canal
                          </span>
                        )}
                        <span className={`px-2 py-0.5 inline-flex text-[10px] uppercase font-bold tracking-wide rounded ${getStatusColor(row.estado)}`}>
                          {row.estado}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{row.client_id}</span>
                        <span className="text-xs text-gray-400 truncate max-w-[150px]" title={row.nombre_comunicacion}>
                          {row.nombre_comunicacion}
                        </span>
                      </div>
                    </td>
                    
                    {/* Acuerdo */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {row.hubo_acuerdo ? (
                        <div className="flex flex-col">
                          <span className="text-indigo-600 font-bold">{formatCurrency(row.valor_acuerdo)}</span>
                          <span className="text-[10px] text-indigo-400 uppercase font-semibold">Sí</span>
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>

                    {/* Recaudo */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {row.hubo_pago ? (
                        <div className="flex flex-col">
                          <span className="text-green-600 font-bold">{formatCurrency(row.valor_pago)}</span>
                          <span className="text-[10px] text-green-400 uppercase font-semibold">Sí</span>
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {row.ruta_pdf && (
                        <button
                          onClick={() => handleDownload(row.communication_id, `evidencia_${row.client_id}.pdf`)}
                          disabled={downloadingId === row.communication_id}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                          title="Descargar Evidencia PDF"
                        >
                          {downloadingId === row.communication_id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> de <span className="font-medium">{filteredData.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="sr-only">Siguiente</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EffectivenessReportPage;
