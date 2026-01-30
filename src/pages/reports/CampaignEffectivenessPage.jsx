import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ArrowLeft, RefreshCw, Search, Filter, Calendar, Bell, 
  DollarSign, Send, MessageCircle, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import * as api from '../../services/api';
import { formatCurrency, formatNumber, formatMonthLabel } from '../../utils/campaignUtils';
import CampaignStatsCard from '../../components/reports/CampaignStatsCard';
import {
  RecoveryByChannelChart,
  ChannelDistributionChart,
  PerformanceOverTimeChart,
  MonthlyTrendsChart,
  ReminderComparisonChart
} from '../../components/reports/CampaignCharts';

const CampaignEffectivenessPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [reminderFilter, setReminderFilter] = useState('ALL');
  
  // Ordenamiento
  const [sortField, setSortField] = useState('campaign_send_date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Filtros de fecha para API
  const [dateFilters, setDateFilters] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  // Cargar datos de campañas
  const fetchCampaignData = async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(dateFilters).filter(([_, v]) => v !== '')
      );
      const response = await api.getCampaignEffectivenessReport(activeFilters);
      setReportData(response);
    } catch (error) {
      toast.error('Error cargando el reporte: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos de actividad diaria
  const fetchDailyData = async () => {
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(dateFilters).filter(([_, v]) => v !== '')
      );
      const response = await api.getDailyActivityReport(activeFilters);
      setDailyData(response.data || []);
    } catch (error) {
      console.error('Error cargando datos diarios:', error);
    }
  };

  useEffect(() => {
    fetchCampaignData();
    fetchDailyData();
  }, [dateFilters]);

  // Refrescar vistas materializadas
  const handleRefreshViews = async () => {
    setRefreshing(true);
    try {
      await api.refreshEffectivenessViews();
      toast.success('Actualización iniciada. Los datos se reflejarán en breve.');
      setTimeout(() => {
        fetchCampaignData();
        fetchDailyData();
      }, 3000);
    } catch (error) {
      toast.error('Error al solicitar actualización');
    } finally {
      setRefreshing(false);
    }
  };

  // Obtener campañas del reporte
  const campaigns = reportData?.campaigns || [];

  // Meses únicos para el filtro
  const uniqueMonths = useMemo(() => {
    const months = new Set(campaigns.map(c => c.campaign_send_date?.substring(0, 7)).filter(Boolean));
    return Array.from(months).sort().reverse();
  }, [campaigns]);

  // Canales únicos para el filtro
  const uniqueChannels = useMemo(() => {
    const channels = new Set(campaigns.map(c => c.channel_type).filter(Boolean));
    return Array.from(channels);
  }, [campaigns]);

  // Campañas filtradas (filtros locales)
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesSearch = 
        !searchTerm || 
        c.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.campaign_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesChannel = channelFilter === 'ALL' || c.channel_type === channelFilter;
      const matchesMonth = monthFilter === 'ALL' || c.campaign_send_date?.startsWith(monthFilter);
      const matchesReminder = reminderFilter === 'ALL' || 
        (reminderFilter === 'REMINDER' ? c.is_reminder_campaign : !c.is_reminder_campaign);
      
      return matchesSearch && matchesChannel && matchesMonth && matchesReminder;
    });
  }, [campaigns, searchTerm, channelFilter, monthFilter, reminderFilter]);

  // Función para manejar el ordenamiento
  const handleSort = (field) => {
    if (sortField === field) {
      // Si ya está ordenado por este campo, invertir la dirección
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nuevo campo, ordenar descendente por defecto
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Campañas ordenadas
  const sortedCampaigns = useMemo(() => {
    const sorted = [...filteredCampaigns];
    
    sorted.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Manejar valores null/undefined
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      // Comparar
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [filteredCampaigns, sortField, sortDirection]);

  // Icono de ordenamiento
  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  // Métricas calculadas
  const metrics = useMemo(() => {
    const totalSent = filteredCampaigns.reduce((sum, c) => sum + (c.total_messages_sent || 0), 0);
    const totalRecovered = filteredCampaigns.reduce((sum, c) => sum + (c.attributed_recovered_amount || 0), 0);
    const totalPayments = filteredCampaigns.reduce((sum, c) => sum + (c.attributed_payments_count || 0), 0);
    const avgPayment = totalPayments > 0 ? totalRecovered / totalPayments : 0;

    return {
      totalSent,
      totalRecovered,
      totalPayments,
      avgPayment
    };
  }, [filteredCampaigns]);

  if (loading && !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando reporte de campañas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <button 
          onClick={() => navigate('/reports')} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Efectividad de Campañas Masivas</h1>
          <p className="text-sm text-gray-500">
            Analizando {filteredCampaigns.length} campañas con atribución de pagos
          </p>
        </div>
      </div>

      {/* Toolbar - Filtros */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-4">
        
        {/* Row 1: Fechas + Refresh */}
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
                placeholder="Buscar por nombre de campaña..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-10"
              />
            </div>
          </div>

          {/* Date Range + Refresh */}
          <div className="md:col-span-6 lg:col-span-7 flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="startDate" className="block text-xs font-medium text-gray-700 mb-1">
                Fecha Inicial
              </label>
              <input
                id="startDate"
                type="date"
                value={dateFilters.start_date}
                onChange={e => setDateFilters(prev => ({ ...prev, start_date: e.target.value }))}
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
                value={dateFilters.end_date}
                onChange={e => setDateFilters(prev => ({ ...prev, end_date: e.target.value }))}
                className="block w-full border-gray-300 rounded-md shadow-sm text-sm h-10 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleRefreshViews}
              disabled={refreshing}
              className="flex-none flex items-center justify-center w-10 h-10 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 hover:bg-white hover:text-blue-600 transition-colors"
              title="Actualizar Datos"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Row 2: Filtros Categóricos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Tipo de Campaña */}
          <div>
            <label htmlFor="reminderFilter" className="block text-xs font-medium text-gray-700 mb-1">
              Tipo de Campaña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Bell className="h-4 w-4 text-gray-400" />
              </div>
              <select
                id="reminderFilter"
                value={reminderFilter}
                onChange={(e) => setReminderFilter(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm text-sm h-10 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="REMINDER">Solo Recordatorios</option>
                <option value="REGULAR">Solo Regulares</option>
              </select>
            </div>
          </div>

          {/* Canal */}
          <div>
            <label htmlFor="channelFilter" className="block text-xs font-medium text-gray-700 mb-1">
              Canal
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                id="channelFilter"
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm text-sm h-10 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">Todos los Canales</option>
                {uniqueChannels.map(ch => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mes */}
          <div>
            <label htmlFor="monthFilter" className="block text-xs font-medium text-gray-700 mb-1">
              Mes
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <select
                id="monthFilter"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm text-sm h-10 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">Todos los Meses</option>
                {uniqueMonths.map(month => (
                  <option key={month} value={month}>{formatMonthLabel(month)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Placeholder para simetría */}
          <div></div>

        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CampaignStatsCard 
          title="Total Recuperado" 
          value={formatCurrency(metrics.totalRecovered)} 
          icon={DollarSign}
          color="green"
          trend="Monto Atribuido"
        />
        <CampaignStatsCard 
          title="Mensajes Enviados" 
          value={formatNumber(metrics.totalSent)} 
          icon={Send}
          color="blue"
          trend={`${filteredCampaigns.length} Campañas`}
        />
        <CampaignStatsCard 
          title="Total Pagos" 
          value={formatNumber(metrics.totalPayments)} 
          icon={MessageCircle}
          color="purple"
          trend="Transacciones"
        />
        <CampaignStatsCard 
          title="Pago Promedio" 
          value={formatCurrency(metrics.avgPayment)} 
          icon={TrendingUp}
          color="orange"
          trend="Por Transacción"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyTrendsChart campaigns={filteredCampaigns} />
        <ReminderComparisonChart campaigns={filteredCampaigns} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecoveryByChannelChart campaigns={filteredCampaigns} />
        <ChannelDistributionChart campaigns={filteredCampaigns} />
      </div>
      
      {dailyData.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          <PerformanceOverTimeChart data={dailyData} />
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Detalles de Campañas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('campaign_name')}
                >
                  <div className="flex items-center gap-2">
                    Nombre de la Campaña
                    <SortIcon field="campaign_name" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('channel_type')}
                >
                  <div className="flex items-center gap-2">
                    Canal
                    <SortIcon field="channel_type" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('campaign_send_date')}
                >
                  <div className="flex items-center gap-2">
                    Fecha
                    <SortIcon field="campaign_send_date" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 font-medium text-right cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('total_messages_sent')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Enviados
                    <SortIcon field="total_messages_sent" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 font-medium text-right cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('attributed_recovered_amount')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Recuperado
                    <SortIcon field="attributed_recovered_amount" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 font-medium text-center cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Estado
                    <SortIcon field="status" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">Cargando datos...</td>
                </tr>
              ) : sortedCampaigns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No se encontraron campañas que coincidan con sus criterios.
                  </td>
                </tr>
              ) : (
                sortedCampaigns.slice(0, 50).map((campaign) => (
                  <tr key={campaign.campaign_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 truncate max-w-xs" title={campaign.campaign_name}>
                      {campaign.campaign_name}
                      {campaign.is_reminder_campaign && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Recordatorio
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${campaign.channel_type === 'SMS' ? 'bg-blue-100 text-blue-800' : 
                          campaign.channel_type === 'WHATSAPP' ? 'bg-green-100 text-green-800' : 
                          'bg-purple-100 text-purple-800'}`}>
                        {campaign.channel_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{campaign.campaign_send_date}</td>
                    <td className="px-6 py-4 text-gray-500 text-right">{formatNumber(campaign.total_messages_sent)}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 text-right">{formatCurrency(campaign.attributed_recovered_amount)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {campaign.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {sortedCampaigns.length > 50 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center text-sm text-gray-500">
            Mostrando los primeros 50 resultados de {sortedCampaigns.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignEffectivenessPage;
