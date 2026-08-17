import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import Select from 'react-select';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, BarChart, Bar, ComposedChart, Line
} from 'recharts';
import { 
  ArrowLeft, Calendar, Upload, AlertCircle, Trash2, Plus, Search, 
  FileSpreadsheet, TrendingUp, BarChart3, Award, Clock, User, Download, 
  CheckCircle2, Activity, FileText, Users, ShieldAlert, Loader2, CalendarCheck
} from 'lucide-react';
import * as api from '../../services/api';
import ModernModal from '../../components/ModernModal';
import { exportToCSV } from '../../utils/exportToCSV';

const ProductivityReportPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Auth & Roles Check
  const resolvedRoles = useMemo(() => {
    if (Array.isArray(user?.decoded?.roles)) return user.decoded.roles;
    return user?.decoded?.role ? [user.decoded.role] : [];
  }, [user]);

  const isAuthorized = useMemo(() => {
    return resolvedRoles.some(role => 
      ['Admin', 'Super Administrador', 'Coordinador', 'Directora de Operaciones'].includes(role)
    );
  }, [resolvedRoles]);

  // Tab State
  const [activeTab, setActiveTab] = useState('ranking'); // 'ranking', 'trends', 'admin'

  // Loading States
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingAbsences, setLoadingAbsences] = useState(false);
  const [uploadingPayments, setUploadingPayments] = useState(false);
  const [uploadingInasistencias, setUploadingInasistencias] = useState(false);
  const [inasistenciasSeparator, setInasistenciasSeparator] = useState(';');
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [savingAbsence, setSavingAbsence] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // Date Filters (Default to current month range)
  const defaultDates = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      start: firstDay.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  }, []);

  const [dateRange, setDateRange] = useState({
    start_date: defaultDates.start,
    end_date: defaultDates.end
  });

  // Data States
  const [rankingData, setRankingData] = useState([]);
  const [dayToDayData, setDayToDayData] = useState([]);
  const [absencesData, setAbsencesData] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);

  // Local Filters (Ranking)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoordFilter, setSelectedCoordFilter] = useState(null);
  const [selectedContractFilter, setSelectedContractFilter] = useState(null);

  // Selected Gestor for Individual Chart (Trends Tab)
  const [selectedGestorChart, setSelectedGestorChart] = useState(null);

  // Register Absence Form State
  const [absenceForm, setAbsenceForm] = useState({
    selectedEmployee: null,
    fecha_inicio: '',
    fecha_fin: '',
    razon: 'INCAPACIDAD',
    observacion: ''
  });

  // Delete Absence Confirmation State
  const [absenceToDelete, setAbsenceToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // --- API Fetches ---

  const fetchRanking = useCallback(async () => {
    setLoadingRanking(true);
    try {
      const response = await api.getProductividadDinamica({
        fecha_inicio: dateRange.start_date,
        fecha_fin: dateRange.end_date
      });
      if (response && response.status === 'success') {
        setRankingData(response.data || []);
      } else {
        setRankingData([]);
      }
    } catch (error) {
      toast.error('Error al cargar ranking de productividad: ' + error.message);
    } finally {
      setLoadingRanking(false);
    }
  }, [dateRange]);

  const fetchDayToDay = useCallback(async () => {
    setLoadingTrends(true);
    try {
      const response = await api.getProductividadDiaADia({
        fecha_inicio: dateRange.start_date,
        fecha_fin: dateRange.end_date
      });
      if (response && response.status === 'success') {
        setDayToDayData(response.data || []);
      } else {
        setDayToDayData([]);
      }
    } catch (error) {
      toast.error('Error al cargar histórico día a día: ' + error.message);
    } finally {
      setLoadingTrends(false);
    }
  }, [dateRange]);

  const fetchAbsences = useCallback(async () => {
    setLoadingAbsences(true);
    try {
      const response = await api.getInasistencias();
      if (response && response.status === 'success') {
        setAbsencesData(response.data || []);
      } else {
        setAbsencesData([]);
      }
    } catch (error) {
      toast.error('Error al obtener inasistencias: ' + error.message);
    } finally {
      setLoadingAbsences(false);
    }
  }, []);

  const searchTimeoutRef = useRef(null);

  const fetchEmployees = useCallback(async (searchQuery = '') => {
    setLoadingEmployees(true);
    try {
      if (searchQuery && searchQuery.trim().length >= 2) {
        const response = await api.getEmployees({ search: searchQuery.trim(), size: 100 });
        const list = Array.isArray(response)
          ? response
          : response?.items
            ? response.items
            : response?.data
              ? response.data
              : [];
        
        const searchOpts = list
          .filter(emp => emp && emp.nombre && emp.cedula)
          .map(emp => ({
            value: emp.cedula,
            label: `${emp.nombre} (${emp.adminfo || 'Sin código'}) - ${emp.cargo || 'Sin cargo'}`,
            cedula: emp.cedula,
            adminfo: emp.adminfo,
            nombre: emp.nombre
          }));
        
        setEmployeesList(prev => {
          const map = new Map(prev.map(item => [item.value, item]));
          searchOpts.forEach(item => map.set(item.value, item));
          return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
        });
      } else {
        // Carga paginada completa para tener a todos los empleados en el selector
        let allEmps = [];
        let page = 1;
        let hasMore = true;
        while (hasMore && page <= 20) {
          const response = await api.getEmployees({ page, size: 100 });
          const items = response?.items || response?.data || (Array.isArray(response) ? response : []);
          if (Array.isArray(items) && items.length > 0) {
            allEmps = [...allEmps, ...items];
          }
          if (response?.page && response?.totalPages && response.page >= response.totalPages) {
            hasMore = false;
          } else if (!Array.isArray(items) || items.length < 100) {
            hasMore = false;
          }
          page++;
        }

        const opts = allEmps
          .filter(emp => emp && emp.nombre && emp.cedula)
          .map(emp => ({
            value: emp.cedula,
            label: `${emp.nombre} (${emp.adminfo || 'Sin código'}) - ${emp.cargo || 'Sin cargo'}`,
            cedula: emp.cedula,
            adminfo: emp.adminfo,
            nombre: emp.nombre
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setEmployeesList(opts);
      }
    } catch (error) {
      console.error('Error al cargar lista de empleados:', error);
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  // Run initial queries based on active tab
  useEffect(() => {
    if (!isAuthorized) return;
    if (activeTab === 'ranking') {
      fetchRanking();
    } else if (activeTab === 'trends') {
      fetchDayToDay();
    } else if (activeTab === 'admin') {
      fetchAbsences();
      fetchEmployees();
    }
  }, [activeTab, fetchRanking, fetchDayToDay, fetchAbsences, fetchEmployees, isAuthorized]);

  // --- Handlers ---

  const handleQuery = () => {
    if (activeTab === 'ranking') {
      fetchRanking();
    } else if (activeTab === 'trends') {
      fetchDayToDay();
    }
  };

  const handlePaymentsUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('El archivo debe tener extensión .csv');
      return;
    }

    setUploadingPayments(true);
    try {
      const response = await api.uploadProductividadPagos(file);
      if (response && response.status === 'success') {
        toast.success(response.message || 'Archivo de pagos procesado exitosamente.');
        // If we are currently showing rankings, refresh them
        if (rankingData.length > 0) fetchRanking();
      } else {
        toast.error('Error al procesar el archivo.');
      }
    } catch (error) {
      toast.error('Error al subir archivo de pagos: ' + error.message);
    } finally {
      setUploadingPayments(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleInasistenciasUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const filename = file.name.toLowerCase();
    const validExts = ['.csv', '.txt', '.tsv', '.xlsx', '.xls'];
    if (!validExts.some(ext => filename.endsWith(ext))) {
      toast.error('Formato no compatible. Suba un archivo .csv, .txt, .tsv, .xlsx o .xls');
      return;
    }

    setUploadingInasistencias(true);
    try {
      const registradoPor = user?.name || user?.decoded?.full_name || user?.email || 'Sistema';
      const response = await api.uploadInasistenciasFile(file, inasistenciasSeparator, registradoPor);
      if (response && (response.status === 'success' || response.message)) {
        toast.success(response.message || 'Inasistencias cargadas exitosamente y recálculo iniciado.');
        fetchAbsences();
        if (rankingData.length > 0) fetchRanking();
      } else {
        toast.error('Error al procesar el archivo de inasistencias.');
      }
    } catch (error) {
      toast.error('Error al subir inasistencias: ' + error.message);
    } finally {
      setUploadingInasistencias(false);
      e.target.value = '';
    }
  };

  const handleRegisterAbsence = async (e) => {
    e.preventDefault();
    const { selectedEmployee, fecha_inicio, fecha_fin, razon, observacion } = absenceForm;

    if (!selectedEmployee) {
      toast.error('Debe seleccionar un empleado.');
      return;
    }
    if (!fecha_inicio || !fecha_fin) {
      toast.error('Las fechas de inicio y fin son requeridas.');
      return;
    }
    if (new Date(fecha_inicio) > new Date(fecha_fin)) {
      toast.error('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    setSavingAbsence(true);
    try {
      const payload = {
        cedula: selectedEmployee.cedula,
        adminfo: selectedEmployee.adminfo || 'SIN_CODIGO',
        fecha_inicio,
        fecha_fin,
        razon,
        observacion: observacion || null,
        registrado_por: user?.name || user?.decoded?.full_name || 'Sistema'
      };

      const response = await api.createInasistencia(payload);
      if (response && response.status === 'success') {
        toast.success('Inasistencia registrada exitosamente y recálculo de productividad encolado.');
        setAbsenceForm({
          selectedEmployee: null,
          fecha_inicio: '',
          fecha_fin: '',
          razon: 'INCAPACIDAD',
          observacion: ''
        });
        fetchAbsences();
      } else {
        toast.error('Error al registrar inasistencia.');
      }
    } catch (error) {
      toast.error('Error al registrar inasistencia: ' + error.message);
    } finally {
      setSavingAbsence(false);
    }
  };

  const handleDeleteAbsenceClick = (absence) => {
    setAbsenceToDelete(absence);
    setShowDeleteModal(true);
  };

  const confirmDeleteAbsence = async () => {
    if (!absenceToDelete) return;
    try {
      const response = await api.deleteInasistencia(absenceToDelete.id);
      if (response && response.status === 'success') {
        toast.success('Inasistencia eliminada y recálculo de productividad encolado.');
        fetchAbsences();
      } else {
        toast.error('Error al eliminar la inasistencia.');
      }
    } catch (error) {
      toast.error('Error al eliminar la inasistencia: ' + error.message);
    } finally {
      setShowDeleteModal(false);
      setAbsenceToDelete(null);
    }
  };

  const handleExportRanking = () => {
    if (processedRanking.length === 0) {
      toast.error('No hay datos para exportar.');
      return;
    }

    const exportRows = processedRanking.map((item, index) => ({
      'Puesto': index + 1,
      'Código Gestor': item.adminfo,
      'Nombre Gestor': item.nombre_gestor,
      'Coordinador': item.codigo_coordinador || 'N/A',
      'Contrato': item.tipo_contrato,
      'Antigüedad (días)': item.antiguedad_dias,
      'Días Hábiles Mes': item.dias_habiles_mes,
      'Días Incapacidad': item.dias_incapacidad,
      'Periodo Gracia': item.en_periodo_gracia ? 'SÍ' : 'NO',
      'Gestiones Totales': item.total_gestiones,
      'Llamadas Efectivas': item.llamadas_efectivas,
      'Clientes Únicos': item.clientes_unicos,
      'Acuerdos': item.total_acuerdos,
      'Pagos': item.total_pagos,
      'Recaudo COP': item.valor_total_pagos,
      'Ind. Gestión/Llamadas (max 0.25)': item.ind_g_ll,
      'Ind. Clientes (max 0.25)': item.ind_c,
      'Ind. Acuerdos (max 0.25)': item.ind_a,
      'Ind. Pagos (max 0.25)': item.ind_p,
      'Productividad Final (0-1)': item.productividad
    }));

    exportToCSV(exportRows, `ranking-productividad-${dateRange.start_date}-a-${dateRange.end_date}.csv`);
    toast.success('Ranking exportado a CSV.');
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      const blob = await api.downloadProductividadDesagregadoExcel({
        fecha_inicio: dateRange.start_date,
        fecha_fin: dateRange.end_date
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Productividad_Desagregada_${dateRange.start_date}_a_${dateRange.end_date}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Archivo descargado con éxito.');
    } catch (error) {
      toast.error('Error al descargar Excel: ' + error.message);
    } finally {
      setDownloadingExcel(false);
    }
  };

  // --- Derived Calculations & Memoized Filters ---

  // Filters setup for dropdowns
  const uniqueCoordinators = useMemo(() => {
    return [...new Set(rankingData.map(d => d.codigo_coordinador).filter(Boolean))].sort().map(c => ({
      value: c, label: `Coordinador: ${c}`
    }));
  }, [rankingData]);

  const uniqueContracts = useMemo(() => {
    return [...new Set(rankingData.map(d => d.tipo_contrato).filter(Boolean))].sort().map(c => ({
      value: c, label: `Contrato: ${c}`
    }));
  }, [rankingData]);

  // Ranking Filtering & Sorting (Productivity desc)
  const processedRanking = useMemo(() => {
    return rankingData
      .filter(item => {
        const matchesSearch = !searchQuery || 
          (item.nombre_gestor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.adminfo || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCoord = !selectedCoordFilter || item.codigo_coordinador === selectedCoordFilter.value;
        const matchesContract = !selectedContractFilter || item.tipo_contrato === selectedContractFilter.value;

        return matchesSearch && matchesCoord && matchesContract;
      })
      .sort((a, b) => (b.productividad || 0) - (a.productividad || 0));
  }, [rankingData, searchQuery, selectedCoordFilter, selectedContractFilter]);

  // Global KPIs from filtered ranking
  const kpis = useMemo(() => {
    if (processedRanking.length === 0) {
      return { avgProductivity: 0, totalCollected: 0, totalAgreements: 0, totalGestiones: 0 };
    }
    const sumProd = processedRanking.reduce((acc, curr) => acc + (curr.productividad || 0), 0);
    const avgProductivity = (sumProd / processedRanking.length) * 100;
    const totalCollected = processedRanking.reduce((acc, curr) => acc + (curr.valor_total_pagos || 0), 0);
    const totalAgreements = processedRanking.reduce((acc, curr) => acc + (curr.total_acuerdos || 0), 0);
    const totalGestiones = processedRanking.reduce((acc, curr) => acc + (curr.total_gestiones || 0), 0);

    return { avgProductivity, totalCollected, totalAgreements, totalGestiones };
  }, [processedRanking]);

  // Daily Trend Charts Data aggregation
  const trendChartsData = useMemo(() => {
    const dailyMap = {};
    dayToDayData.forEach(row => {
      const dateKey = row.Fecha;
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          Gestiones: 0,
          Llamadas: 0,
          Clientes: 0,
          Acuerdos: 0,
          Pagos: 0
        };
      }
      dailyMap[dateKey].Gestiones += Number(row.Gestiones) || 0;
      dailyMap[dateKey].Llamadas += Number(row["Llamadas Efectivas"]) || 0;
      dailyMap[dateKey].Clientes += Number(row["Clientes Únicos"]) || 0;
      dailyMap[dateKey].Acuerdos += Number(row.Acuerdos) || 0;
      dailyMap[dateKey].Pagos += Number(row.Pagos) || 0;
    });

    return Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [dayToDayData]);

  // Active Gestores for selector in charts
  const activeGestoresList = useMemo(() => {
    const codes = [...new Set(dayToDayData.map(d => d["Código Gestor"]).filter(Boolean))].sort();
    return codes.map(c => ({ value: c, label: `Gestor: ${c}` }));
  }, [dayToDayData]);

  // Individual Gestor Daily Trend
  const gestorTrendData = useMemo(() => {
    if (!selectedGestorChart) return [];
    return dayToDayData
      .filter(row => row["Código Gestor"] === selectedGestorChart.value)
      .map(row => ({
        date: row.Fecha,
        Gestiones: row.Gestiones || 0,
        Llamadas: row["Llamadas Efectivas"] || 0,
        Clientes: row["Clientes Únicos"] || 0,
        Acuerdos: row.Acuerdos || 0,
        Pagos: row.Pagos || 0
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [dayToDayData, selectedGestorChart]);

  // Attendance Report (calculated working days per agent)
  const attendanceReport = useMemo(() => {
    const map = {};
    dayToDayData.forEach(row => {
      const gCode = row["Código Gestor"] || 'N/A';
      if (!map[gCode]) {
        map[gCode] = {
          gestor: gCode,
          coordinador: row["Código Coordinador"] || 'N/A',
          contrato: row["Tipo de Contrato"] || 'N/A',
          diasEfectivos: 0,
          diasList: new Set()
        };
      }
      map[gCode].diasList.add(row.Fecha);
    });

    return Object.values(map)
      .map(item => ({
        ...item,
        diasEfectivos: item.diasList.size
      }))
      .sort((a, b) => b.diasEfectivos - a.diasEfectivos);
  }, [dayToDayData]);

  // --- Render Helpers ---

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center space-y-6">
        <div className="p-4 bg-red-50 rounded-full border border-red-200">
          <ShieldAlert className="h-16 w-16 text-red-600 animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Acceso No Autorizado</h1>
        <p className="text-gray-500 max-w-md">
          Este módulo está restringido para coordinadores, administradores y dirección de operaciones.
        </p>
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al Centro de Reportes
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/reports')} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 shadow-sm bg-white"
            title="Volver"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <Award className="h-8 w-8 text-blue-600" />
              Reporte de Productividad Dinámica
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Indicadores consolidados, metas de referencia y gestión de asistencia.</p>
          </div>
        </div>

        {/* Global Date Picker Filters */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          <Calendar className="h-4 w-4 text-blue-500 ml-1" />
          <input 
            type="date" 
            value={dateRange.start_date}
            onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
            className="border-none text-xs p-1 focus:ring-0 w-28 text-gray-700 bg-transparent font-medium" 
          />
          <span className="text-gray-400 text-xs font-semibold">al</span>
          <input 
            type="date" 
            value={dateRange.end_date}
            onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
            className="border-none text-xs p-1 focus:ring-0 w-28 text-gray-700 bg-transparent font-medium" 
          />
          <button
            onClick={handleQuery}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            Consultar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-xl shadow-sm border p-1 gap-1">
        <button
          onClick={() => setActiveTab('ranking')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200
            ${activeTab === 'ranking' 
              ? 'bg-blue-50 text-blue-700 shadow-sm border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          <BarChart3 className="h-4 w-4" /> 📊 Vista General & Ranking
        </button>
        
        <button
          onClick={() => setActiveTab('trends')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200
            ${activeTab === 'trends' 
              ? 'bg-blue-50 text-blue-700 shadow-sm border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          <Activity className="h-4 w-4" /> 📈 Tendencias & Histórico
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200
            ${activeTab === 'admin' 
              ? 'bg-blue-50 text-blue-700 shadow-sm border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          <Clock className="h-4 w-4" /> ⚙️ Administración
        </button>
      </div>

      {/* ── TAB CONTENT: VISTA GENERAL / RANKINGS ──────────────────────────── */}
      {activeTab === 'ranking' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por gestor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 w-full text-sm border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <Select
                options={uniqueCoordinators}
                value={selectedCoordFilter}
                onChange={setSelectedCoordFilter}
                placeholder="Filtrar por Coordinador"
                isClearable
                className="text-sm"
              />
            </div>

            <div>
              <Select
                options={uniqueContracts}
                value={selectedContractFilter}
                onChange={setSelectedContractFilter}
                placeholder="Filtrar por Contrato"
                isClearable
                className="text-sm"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleExportRanking}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm w-full md:w-auto justify-center"
              >
                <FileSpreadsheet className="h-4 w-4" /> Exportar CSV
              </button>
              <button
                onClick={handleDownloadExcel}
                disabled={downloadingExcel}
                className={`flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm w-full md:w-auto justify-center ${downloadingExcel ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {downloadingExcel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} 
                Descargar Desagregado
              </button>
            </div>
          </div>

          {/* KPIs Global Cards */}
          {loadingRanking ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-8 w-32 bg-gray-300 rounded"></div>
                  </div>
                  <div className="h-12 w-12 bg-gray-100 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform duration-200">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Productividad Equipo</p>
                  <p className="text-3xl font-extrabold text-blue-900">{kpis.avgProductivity.toFixed(1)}%</p>
                  <p className="text-xs text-blue-600">Promedio de indicadores de meta</p>
                </div>
                <div className="p-3 bg-blue-500 rounded-full shadow text-white">
                  <Award className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform duration-200">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Recaudo Confirmado</p>
                  <p className="text-3xl font-extrabold text-emerald-900">{formatCurrency(kpis.totalCollected)}</p>
                  <p className="text-xs text-emerald-600">Suma total del valor de pagos</p>
                </div>
                <div className="p-3 bg-emerald-500 rounded-full shadow text-white">
                  <Activity className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform duration-200">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">Acuerdos Registrados</p>
                  <p className="text-3xl font-extrabold text-purple-900">{kpis.totalAgreements.toLocaleString()}</p>
                  <p className="text-xs text-purple-600">Total acuerdos en rango</p>
                </div>
                <div className="p-3 bg-purple-500 rounded-full shadow text-white">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between hover:scale-[1.01] transition-transform duration-200">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Volumen de Gestiones</p>
                  <p className="text-3xl font-extrabold text-amber-900">{kpis.totalGestiones.toLocaleString()}</p>
                  <p className="text-xs text-amber-600">Total gestiones registradas</p>
                </div>
                <div className="p-3 bg-amber-500 rounded-full shadow text-white">
                  <Users className="h-6 w-6" />
                </div>
              </div>

            </div>
          )}

          {/* Ranking Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Clasificación de Productividad por Gestores
              </h3>
              <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                {processedRanking.length} Gestores en Rango
              </span>
            </div>

            {loadingRanking ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-500 font-medium">Calculando indicadores y cargando ranking...</p>
              </div>
            ) : processedRanking.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="font-semibold text-sm">No se encontraron registros de productividad.</p>
                <p className="text-xs text-gray-400">Verifique las fechas consultadas o los filtros locales.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                      <th className="px-6 py-3 w-16 text-center">Pos</th>
                      <th className="px-6 py-3">Gestor / Código</th>
                      <th className="px-6 py-3">Coordinador</th>
                      <th className="px-6 py-3">Contrato</th>
                      <th className="px-6 py-3 text-center">Días Hábiles</th>
                      <th className="px-6 py-3 text-right">Recaudo Confirmado</th>
                      <th className="px-6 py-3">Desglose de Indicadores (Cumplimiento)</th>
                      <th className="px-6 py-3 text-center">Prod. Final</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedRanking.map((row, idx) => {
                      const posColor = idx === 0 
                        ? 'bg-amber-100 text-amber-800 border-amber-300' 
                        : idx === 1 
                          ? 'bg-slate-100 text-slate-800 border-slate-300' 
                          : idx === 2 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-gray-50 text-gray-600 border-gray-200';

                      // Format indicators to percentage of contribution (max 25% each)
                      const pctGestiones = ((row.ind_g_ll || 0) * 100).toFixed(1);
                      const pctClientes = ((row.ind_c || 0) * 100).toFixed(1);
                      const pctAcuerdos = ((row.ind_a || 0) * 100).toFixed(1);
                      const pctPagos = ((row.ind_p || 0) * 100).toFixed(1);
                      
                      const prodPct = ((row.productividad || 0) * 100).toFixed(0);

                      return (
                        <tr key={row.adminfo} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border font-bold text-sm ${posColor}`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{row.nombre_gestor}</div>
                            <div className="text-xs text-gray-500 font-mono">Código: {row.adminfo}</div>
                            <div className="flex gap-1.5 mt-1.5">
                              {row.en_periodo_gracia && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  Periodo de Gracia
                                </span>
                              )}
                              {row.dias_incapacidad > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Incapacidad: {row.dias_incapacidad}d
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700 font-medium">{row.codigo_coordinador || '—'}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                              {row.tipo_contrato}
                            </span>
                            {row.fecha_ingreso && (
                              <div className="mt-1 text-[10px] text-gray-500 whitespace-nowrap">
                                <b>Ingreso:</b> {row.fecha_ingreso}
                              </div>
                            )}
                            {row.fecha_retiro && (
                              <div className="mt-0.5 text-[10px] text-red-500 whitespace-nowrap">
                                <b>Retiro:</b> {row.fecha_retiro}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-600 font-medium">{row.dias_habiles_mes}</td>
                          <td className="px-6 py-4 text-right text-gray-950 font-bold">{formatCurrency(row.valor_total_pagos)}</td>
                          <td className="px-6 py-4">
                            <div className="space-y-2 max-w-[280px]">
                              
                              {/* Gestiones / Llamadas bar */}
                              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-blue-500" /> Gestiones/Llamadas</span>
                                <span className="text-blue-700">{pctGestiones}% <span className="text-[10px] text-gray-400 font-normal ml-1">({Math.max(row.total_gestiones || 0, row.llamadas_efectivas || 0)} de {Math.round(row.meta_gestiones_ref || 0)})</span></span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(row.ind_g_ll / 0.25) * 100}%` }}></div>
                              </div>

                              {/* Clientes Únicos bar */}
                              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
                                <span className="flex items-center gap-1"><User className="h-3 w-3 text-purple-500" /> Clientes Únicos</span>
                                <span className="text-purple-700">{pctClientes}% <span className="text-[10px] text-gray-400 font-normal ml-1">({row.clientes_unicos || 0} de {Math.round(row.meta_clientes_ref || 0)})</span></span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(row.ind_c / 0.25) * 100}%` }}></div>
                              </div>

                              {/* Acuerdos bar */}
                              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
                                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-orange-500" /> Acuerdos</span>
                                <span className="text-orange-700">{pctAcuerdos}% <span className="text-[10px] text-gray-400 font-normal ml-1">({row.total_acuerdos || 0} de {Math.round(row.meta_acuerdos_ref || 0)})</span></span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(row.ind_a / 0.25) * 100}%` }}></div>
                              </div>

                              {/* Pagos bar */}
                              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
                                <span className="flex items-center gap-1"><Activity className="h-3 w-3 text-emerald-500" /> Pagos</span>
                                <span className="text-emerald-700">{pctPagos}% <span className="text-[10px] text-gray-400 font-normal ml-1">({row.total_pagos || 0} de {Math.round(row.meta_pagos_ref || 0)})</span></span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(row.ind_p / 0.25) * 100}%` }}></div>
                              </div>

                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`inline-flex px-3 py-1.5 rounded-xl text-sm font-black shadow-sm border
                                ${Number(row.productividad) >= 0.8 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                  : Number(row.productividad) >= 0.5 
                                    ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                    : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                                {prodPct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: GRÁFICAS & TENDENCIAS ────────────────────────────────── */}
      {activeTab === 'trends' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {loadingTrends ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-3 bg-white rounded-xl border border-gray-200 shadow-sm min-h-[400px]">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-500 font-medium">Cargando desglose día a día e información histórica...</p>
            </div>
          ) : dayToDayData.length === 0 ? (
            <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
              <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="font-semibold text-sm">No hay registros detallados día a día.</p>
              <p className="text-xs text-gray-400">Verifique las fechas consultadas.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Daily Trend Chart (Area Chart) */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-[400px]">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    Tendencia de Rendimiento del Equipo
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Volumen consolidado diario de gestiones, llamadas, clientes, acuerdos y pagos.</p>
                </div>
                <div className="flex-1 w-full min-h-0 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendChartsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorGestiones" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorLlamadas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorClientes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" fontSize={11} stroke="#9ca3af" tickFormatter={(str) => str?.slice(5) || ''} />
                      <YAxis fontSize={11} stroke="#9ca3af" />
                      <RechartsTooltip />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="Gestiones" stroke="#3b82f6" fill="url(#colorGestiones)" strokeWidth={2} name="Gestiones" />
                      <Area type="monotone" dataKey="Llamadas" stroke="#8b5cf6" fill="url(#colorLlamadas)" strokeWidth={2} name="Llamadas Efectivas" />
                      <Area type="monotone" dataKey="Clientes" stroke="#ec4899" fill="url(#colorClientes)" strokeWidth={2} name="Clientes Únicos" />
                      <Area type="monotone" dataKey="Acuerdos" stroke="#f59e0b" fill="none" strokeWidth={2} name="Acuerdos" />
                      <Area type="monotone" dataKey="Pagos" stroke="#10b981" fill="none" strokeWidth={2} name="Pagos" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Individual Gestor Performance */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2 flex flex-col h-[400px]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Rendimiento Diario Individual
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">Selecciona un gestor para ver sus métricas granulares diarias.</p>
                    </div>
                    <div className="w-56">
                      <Select
                        options={activeGestoresList}
                        value={selectedGestorChart}
                        onChange={setSelectedGestorChart}
                        placeholder="Seleccionar Gestor..."
                        isClearable
                      />
                    </div>
                  </div>

                  <div className="flex-1 w-full min-h-0 mt-4">
                    {!selectedGestorChart ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl p-6">
                        <User className="h-10 w-10 opacity-40 mb-2" />
                        <p className="text-sm font-semibold">Seleccione un gestor del menú desplegable.</p>
                      </div>
                    ) : gestorTrendData.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 border border-gray-200 rounded-xl p-6">
                        <AlertCircle className="h-10 w-10 opacity-40 mb-2" />
                        <p className="text-sm font-semibold">No hay datos disponibles para el gestor seleccionado.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={gestorTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" fontSize={11} stroke="#9ca3af" tickFormatter={(str) => str?.slice(5) || ''} />
                          <YAxis fontSize={11} stroke="#9ca3af" />
                          <RechartsTooltip />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Gestiones" name="Gestiones" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Llamadas" name="Llamadas Efec." fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Acuerdos" name="Acuerdos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Pagos" name="Pagos" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Attendance Counter */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col h-[400px]">
                  <div>
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                      <CalendarCheck className="h-5 w-5 text-emerald-600" />
                      Reporte de Asistencia Efectiva
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Días laborados reales en el rango de fechas seleccionado.</p>
                  </div>
                  <div className="flex-1 overflow-y-auto mt-4 pr-1">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Gestor</th>
                          <th className="px-3 py-2 text-left font-semibold">Coordinador</th>
                          <th className="px-3 py-2 text-center font-semibold">Días Trabajados</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {attendanceReport.map(item => (
                          <tr key={item.gestor} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2.5 font-semibold text-gray-900">{item.gestor}</td>
                            <td className="px-3 py-2.5 text-gray-500">{item.coordinador}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className="inline-flex px-2 py-0.5 rounded-full font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {item.diasEfectivos} días
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* ── TAB CONTENT: ADMINISTRACIÓN ───────────────────────────────────────── */}
      {activeTab === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          
          {/* Column Left: Upload Files (Inasistencias Masivo & Pagos CSV) */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Card 1: Carga Masiva de Inasistencias */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-gray-800">Carga Masiva Inasistencias</h3>
              </div>
              
              <p className="text-xs text-gray-500 leading-relaxed">
                Cargue archivos CSV, TXT o Excel con licencias e incapacidades para registrar novedades en bloque y recalcular factores de meta.
              </p>

              {/* Separator selector for CSV/TXT */}
              <div className="flex items-center justify-between text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-600 font-medium">Separador (CSV/TXT):</span>
                <select
                  value={inasistenciasSeparator}
                  onChange={(e) => setInasistenciasSeparator(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 text-xs focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  disabled={uploadingInasistencias}
                >
                  <option value=";">Punto y coma (;)</option>
                  <option value=",">Coma (,)</option>
                  <option value="	">Tabulación (\t)</option>
                  <option value="|">Barra (|)</option>
                </select>
              </div>

              {/* Drag and Drop / file area */}
              <div className="flex items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-200
                  ${uploadingInasistencias 
                    ? 'border-indigo-400 bg-indigo-50/20 pointer-events-none' 
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                  
                  <div className="flex flex-col items-center justify-center pt-4 pb-5 text-center px-4">
                    {uploadingInasistencias ? (
                      <>
                        <Loader2 className="h-9 w-9 text-indigo-500 animate-spin mb-2" />
                        <p className="text-xs font-semibold text-indigo-600">Procesando inasistencias...</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Guardando y recalculando datos</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-9 w-9 text-gray-400 mb-2" />
                        <p className="text-xs font-semibold text-gray-700">Subir archivo de inasistencias</p>
                        <p className="text-[10px] text-gray-400 mt-1">CSV, Excel (.xlsx, .xls), TXT</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept=".csv,.txt,.tsv,.xlsx,.xls" 
                    onChange={handleInasistenciasUpload} 
                    className="hidden" 
                    disabled={uploadingInasistencias}
                  />
                </label>
              </div>

              <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-100 flex gap-2">
                <AlertCircle className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  Columnas: <code>cedula</code> o <code>adminfo</code>, <code>fecha_inicio</code>, <code>fecha_fin</code>, <code>razon</code>, <code>observacion</code>.
                </p>
              </div>
            </div>

            {/* Card 2: Upload CSV Payments */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Upload className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">Cargar Archivo de Pagos</h3>
              </div>
              
              <p className="text-xs text-gray-500 leading-relaxed">
                Suba el reporte CSV del sistema de conciliación para registrar los pagos manuales de los gestores y disparar de forma automática el recálculo de la productividad.
              </p>

              {/* Drag and Drop area */}
              <div className="flex items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-200
                  ${uploadingPayments 
                    ? 'border-blue-400 bg-blue-50/20 pointer-events-none' 
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                  
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    {uploadingPayments ? (
                      <>
                        <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-3" />
                        <p className="text-xs font-semibold text-blue-600">Subiendo y recalculando datos...</p>
                        <p className="text-[10px] text-gray-400 mt-1">Esto puede demorar unos segundos</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-gray-400 mb-3" />
                        <p className="text-sm font-semibold text-gray-700">Haz clic para cargar el archivo</p>
                        <p className="text-xs text-gray-400 mt-1">Formatos permitidos: .CSV</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handlePaymentsUpload} 
                    className="hidden" 
                    disabled={uploadingPayments}
                  />
                </label>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  <strong>Importante:</strong> El CSV debe contener obligatoriamente la columna <code>consecutivo_de_pago</code> para realizar el UPSERT de forma correcta.
                </p>
              </div>
            </div>
          </div>

          {/* Column Right: Absences Management (Inasistencias) - Spans 2 */}
          <div className="space-y-6 lg:col-span-2">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <CalendarCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-gray-800">Registrar Licencia o Incapacidad</h3>
              </div>

              {/* Form Absence */}
              <form onSubmit={handleRegisterAbsence} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Buscar Gestor/Empleado <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={employeesList}
                    value={absenceForm.selectedEmployee}
                    onChange={(opt) => setAbsenceForm(prev => ({ ...prev, selectedEmployee: opt }))}
                    onInputChange={(inputValue, { action }) => {
                      if (action === 'input-change') {
                        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                        if (inputValue.length >= 2) {
                          searchTimeoutRef.current = setTimeout(() => {
                            fetchEmployees(inputValue);
                          }, 300);
                        }
                      }
                    }}
                    isLoading={loadingEmployees}
                    placeholder="Escribe el nombre o cédula para buscar..."
                    isClearable
                    isSearchable
                    noOptionsMessage={() => "No se encontraron empleados"}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Fecha de Inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={absenceForm.fecha_inicio}
                    onChange={(e) => setAbsenceForm(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Fecha de Fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={absenceForm.fecha_fin}
                    onChange={(e) => setAbsenceForm(prev => ({ ...prev, fecha_fin: e.target.value }))}
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tipo de Inasistencia <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={absenceForm.razon}
                    onChange={(e) => setAbsenceForm(prev => ({ ...prev, razon: e.target.value }))}
                    className="w-full py-2.5 px-3 border border-gray-300 rounded-lg text-xs focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-white"
                  >
                    <option value="INCAPACIDAD">Incapacidad Médica</option>
                    <option value="LICENCIA">Licencia de Trabajo</option>
                    <option value="VACACIONES">Vacaciones</option>
                    <option value="PENSION">Pensión</option>
                    <option value="INASISTENCIA_INJUSTIFICADA">Inasistencia Injustificada</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Observaciones (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Detalles o justificación"
                    value={absenceForm.observacion}
                    onChange={(e) => setAbsenceForm(prev => ({ ...prev, observacion: e.target.value }))}
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingAbsence}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-55"
                  >
                    {savingAbsence ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" /> Registrar Inasistencia
                      </>
                    )}
                  </button>
                </div>

              </form>

              {/* Absences List Table */}
              <div className="border-t border-gray-100 pt-5">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Listado de Inasistencias Registradas
                </h4>

                {loadingAbsences ? (
                  <div className="p-8 flex items-center justify-center"><Loader2 className="h-6 w-6 text-indigo-500 animate-spin" /></div>
                ) : absencesData.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    No se han registrado inasistencias en el sistema.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[300px] overflow-y-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Gestor</th>
                          <th className="px-3 py-2 text-left font-semibold">Cédula</th>
                          <th className="px-3 py-2 text-center font-semibold">Desde</th>
                          <th className="px-3 py-2 text-center font-semibold">Hasta</th>
                          <th className="px-3 py-2 text-left font-semibold">Razón</th>
                          <th className="px-3 py-2 text-left font-semibold">Registrado Por</th>
                          <th className="px-3 py-2 text-center font-semibold">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {absencesData.map(absence => (
                          <tr key={absence.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-3 py-2 font-semibold text-gray-900">{absence.adminfo}</td>
                            <td className="px-3 py-2 text-gray-500 font-mono">{absence.cedula}</td>
                            <td className="px-3 py-2 text-center font-medium text-gray-600">{absence.fecha_inicio}</td>
                            <td className="px-3 py-2 text-center font-medium text-gray-600">{absence.fecha_fin}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold
                                ${absence.razon === 'INCAPACIDAD' 
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                  : absence.razon === 'LICENCIA' 
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                {absence.razon}
                              </span>
                              {absence.observacion && (
                                <p className="text-[10px] text-gray-400 mt-0.5 italic">{absence.observacion}</p>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-500">{absence.registrado_por || 'N/A'}</td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteAbsenceClick(absence)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Eliminar Registro"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── MODERN MODAL FOR DELETING CONFIRMATION ────────────────────────────── */}
      <ModernModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAbsenceToDelete(null);
        }}
        title="Confirmar Eliminación"
        icon={<AlertCircle className="h-6 w-6 text-rose-600" />}
        size="md"
        actions={
          <div className="flex gap-2 justify-end w-full">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setAbsenceToDelete(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDeleteAbsence}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
            >
              Eliminar Registro
            </button>
          </div>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            ¿Está seguro de que desea eliminar esta inasistencia del gestor <strong>{absenceToDelete?.adminfo}</strong>?
          </p>
          <p className="text-xs text-gray-400">
            Esta acción es irreversible y recalculará automáticamente la productividad diaria, reincorporando estos días hábiles al cálculo.
          </p>
        </div>
      </ModernModal>

    </div>
  );
};

export default ProductivityReportPage;
