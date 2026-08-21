import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Layers, 
  History, 
  Activity, 
  Phone, 
  Mail, 
  MapPin, 
  Shield, 
  Car, 
  Play, 
  RefreshCw, 
  Database,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Eye,
  Copy,
  Check,
  FileJson,
  LayoutGrid,
  Info,
  Calendar,
  User,
  Building,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import localizacionService from '../services/localizacionService';

const AVAILABLE_SOURCES = [
  { id: 'ADRES', label: 'ADRES (BDUA)', category: 'Salud', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'RUAF', label: 'RUAF SISPRO', category: 'Seguridad Social', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'EMSANAR', label: 'Emsanar EPS', category: 'EPS', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'SALUD_TOTAL', label: 'Salud Total EPS', category: 'EPS', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { id: 'VIVA1A', label: 'Viva 1A IPS', category: 'EPS', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'ASMET', label: 'Asmet Salud', category: 'EPS', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'NUEVA_EPS', label: 'Nueva EPS', category: 'EPS', color: 'bg-blue-50 text-blue-800 border-blue-300' },
  { id: 'SENA', label: 'SENA (APE)', category: 'Laboral', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'SERVICIO_EMPLEO', label: 'Servicio de Empleo', category: 'Laboral', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'MI_VACUNA', label: 'Mi Vacuna SISPRO', category: 'Salud', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'RUES', label: 'RUES Cámaras', category: 'Empresarial', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  { id: 'SIMIT', label: 'SIMIT Multas', category: 'Vehículos', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

/**
 * Función para formatear las claves del diccionario a nombres legibles en español.
 */
function humanizeKey(key) {
  if (!key) return '';
  const dictionary = {
    cedula: 'Cédula',
    nombres: 'Nombres',
    apellidos: 'Apellidos',
    nombre_completo: 'Nombre Completo',
    primer_nombre: 'Primer Nombre',
    segundo_nombre: 'Segundo Nombre',
    primer_apellido: 'Primer Apellido',
    segundo_apellido: 'Segundo Apellido',
    email: 'Correo Electrónico',
    correo: 'Correo Electrónico',
    telefono: 'Teléfono',
    celular: 'Celular',
    direccion: 'Dirección',
    barrio: 'Barrio',
    municipio: 'Municipio / Ciudad',
    departamento: 'Departamento',
    zona: 'Zona',
    genero: 'Género',
    sexo: 'Sexo',
    fecha_nacimiento: 'Fecha de Nacimiento',
    fecha_expedicion: 'Fecha de Expedición',
    fecha_afiliacion: 'Fecha de Afiliación',
    eps: 'EPS',
    eps_nombre: 'Nombre de EPS',
    estado: 'Estado',
    estado_afiliacion: 'Estado de Afiliación',
    regimen: 'Régimen',
    tipo_afiliado: 'Tipo de Afiliado',
    ips: 'IPS Primaria',
    sede: 'Sede IPS',
    placas: 'Placas de Vehículos',
    tiene_multas: 'Tiene Multas Registradas',
    multas: 'Multas Detalladas',
    matricula: 'Matrícula Mercantil',
    organizacion: 'Organización Jurídica',
    razon_social: 'Razón Social',
    actividad_economica: 'Actividad Económica',
    error_message: 'Mensaje de Error',
    source: 'Fuente de Consulta',
    scraped_at: 'Fecha de Scraping',
    status: 'Estado del Scraping',
    run_id: 'ID de Ejecución',
    info_basica: 'Información Básica',
    afiliacion_salud: 'Afiliación en Salud',
    afiliacion_pensiones: 'Afiliación en Pensiones',
    afiliacion_riesgos_laborales: 'Riesgos Laborales (ARL)',
    afiliacion_compensacion_familiar: 'Caja de Compensación',
    afiliacion_cesantias: 'Cesantías',
  };

  if (dictionary[key.toLowerCase()]) {
    return dictionary[key.toLowerCase()];
  }

  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Componente recursivo para renderizar campos dinámicos de diccionarios JSON.
 */
function DynamicValueRenderer({ value, depth = 0 }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (textToCopy) => {
    navigator.clipboard.writeText(String(textToCopy));
    setCopied(true);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400 italic text-xs">No registrado</span>;
  }

  // Booleano
  if (typeof value === 'boolean') {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
        value ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
      }`}>
        {value ? 'SÍ' : 'NO'}
      </span>
    );
  }

  // Arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-slate-400 italic text-xs">Lista vacía (0 elementos)</span>;
    }

    const isPrimitiveArray = value.every(item => typeof item !== 'object' || item === null);
    if (isPrimitiveArray) {
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {value.map((item, idx) => (
            <span key={idx} className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-800">
              {String(item)}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3 mt-2">
        {value.map((item, idx) => (
          <div key={idx} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs">
            <div className="font-bold text-slate-500 mb-2 text-[11px] uppercase tracking-wider">
              Elemento #{idx + 1}
            </div>
            <DynamicDictionaryViewer data={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  // Objetos anidados
  if (typeof value === 'object') {
    return (
      <div className="mt-1 p-3 bg-slate-50/90 rounded-xl border border-slate-200">
        <DynamicDictionaryViewer data={value} depth={depth + 1} />
      </div>
    );
  }

  // Strings / Números
  const strVal = String(value);
  const isPhone = /^[0-9+() -]{7,15}$/.test(strVal) && strVal.length >= 7;

  return (
    <div className="flex items-center justify-between gap-2 group">
      <span className={`text-sm text-slate-800 font-medium break-all ${isPhone ? 'font-mono text-blue-700 font-bold' : ''}`}>
        {strVal}
      </span>
      <button
        type="button"
        onClick={() => handleCopy(strVal)}
        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded transition-all"
        title="Copiar valor"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

/**
 * Visor en cuadrícula dinámica de todos los pares clave-valor de un diccionario.
 */
function DynamicDictionaryViewer({ data, depth = 0 }) {
  if (!data || typeof data !== 'object') {
    return <p className="text-slate-400 italic text-xs">Sin información estructurada.</p>;
  }

  let parsedData = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch {
      return <p className="text-slate-800 text-sm font-mono whitespace-pre-wrap">{data}</p>;
    }
  }

  const entries = Object.entries(parsedData);
  if (entries.length === 0) {
    return <p className="text-slate-400 italic text-xs">Diccionario vacío.</p>;
  }

  return (
    <div className={`grid grid-cols-1 ${depth === 0 ? 'sm:grid-cols-2 md:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
      {entries.map(([key, val]) => {
        const isComplex = typeof val === 'object' && val !== null;
        return (
          <div
            key={key}
            className={`p-3 rounded-xl border border-slate-200/90 bg-white shadow-xs ${
              isComplex ? 'col-span-full' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {humanizeKey(key)}
              </span>
              <span className="text-[10px] font-mono text-slate-300">
                {key}
              </span>
            </div>
            <div className="mt-0.5">
              <DynamicValueRenderer value={val} depth={depth} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Modal de Detalle Completo del Historial de Scraping.
 */
function HistorialDetailModal({ item, onClose }) {
  const [activeTab, setActiveTab] = useState('dynamic'); // 'dynamic' | 'json'
  const [copiedJson, setCopiedJson] = useState(false);

  if (!item) return null;

  let parsedData = item.data;
  if (typeof item.data === 'string') {
    try {
      parsedData = JSON.parse(item.data);
    } catch {
      parsedData = { raw: item.data };
    }
  }

  const handleCopyJson = () => {
    const payload = {
      fuente: item.fuente,
      cedula: item.cedula,
      estado: item.status,
      fecha_scraping: item.scraped_at,
      error_message: item.error_message,
      datos: parsedData,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedJson(true);
    toast.success('JSON completo copiado al portapapeles');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 border border-slate-200 text-slate-800">
                  {item.fuente}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Detalles del Scraping
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                  item.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  item.status === 'ERROR' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {item.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                  {item.status === 'ERROR' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span className="font-mono font-semibold text-slate-700">Cédula: {item.cedula}</span>
                <span>•</span>
                <span>Fecha: {item.scraped_at ? new Date(item.scraped_at).toLocaleString('es-CO') : 'N/A'}</span>
                {item.run_id && (
                  <>
                    <span>•</span>
                    <span>Run ID: {item.run_id}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedJson ? 'Copiado' : 'Copiar JSON'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-2 border-b border-slate-100 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('dynamic')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'dynamic'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Vista Dinámica de Campos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'json'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            Estructura JSON Completa
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/40">
          {item.error_message && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Mensaje de Error del Scraper:</span>
                <p className="font-mono text-rose-700">{item.error_message}</p>
              </div>
            </div>
          )}

          {activeTab === 'dynamic' ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  Campos Extraídos por el Portal ({Object.keys(parsedData || {}).length} campos)
                </span>
                <span className="text-xs text-slate-400">
                  Renderizado dinámico de clave-valor
                </span>
              </div>

              <DynamicDictionaryViewer data={parsedData} />
            </div>
          ) : (
            <div className="relative">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-[500px]">
                {JSON.stringify(parsedData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Registro inmutable auditado en PostgreSQL
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LocalizacionPage() {
  const [activeTab, setActiveTab] = useState('history');

  // ==========================================
  // TAB 1: HISTORIAL Y AUDITORÍA (VISTA PRINCIPAL)
  // ==========================================
  const [historialList, setHistorialList] = useState([]);
  const [historialTotal, setHistorialTotal] = useState(0);
  const [historialFilterFuente, setHistorialFilterFuente] = useState('');
  const [historialFilterStatus, setHistorialFilterStatus] = useState('SUCCESS');
  const [historialInputCedula, setHistorialInputCedula] = useState('');
  const [historialSearchCedula, setHistorialSearchCedula] = useState('');
  const [historialPage, setHistorialPage] = useState(1);
  const [historialLimit, setHistorialLimit] = useState(25);
  const [isHistorialLoading, setIsHistorialLoading] = useState(false);
  const [selectedHistorialItem, setSelectedHistorialItem] = useState(null);

  const debounceTimerRef = useRef(null);
  const handleCedulaInputChange = (val) => {
    setHistorialInputCedula(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setHistorialPage(1);
      setHistorialSearchCedula(val.trim());
    }, 300);
  };

  const loadHistorial = async (page = historialPage, limit = historialLimit, cedula = historialSearchCedula, fuente = historialFilterFuente, status = historialFilterStatus) => {
    setIsHistorialLoading(true);
    try {
      const offset = (page - 1) * limit;
      const params = { limit, offset };
      if (fuente) params.fuente = fuente;
      if (status) params.status = status;
      if (cedula && cedula.trim()) params.cedula = cedula.trim();

      const res = await localizacionService.getHistorialGlobal(params);
      setHistorialList(res.items || []);
      setHistorialTotal(res.total || 0);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar historial de auditoría.');
    } finally {
      setIsHistorialLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistorial(historialPage, historialLimit, historialSearchCedula, historialFilterFuente, historialFilterStatus);
    }
  }, [activeTab, historialPage, historialLimit, historialSearchCedula, historialFilterFuente, historialFilterStatus]);

  const handleSearchCedulaSubmit = (e) => {
    if (e) e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setHistorialPage(1);
    setHistorialSearchCedula(historialInputCedula.trim());
  };

  const handleClearCedulaSearch = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setHistorialInputCedula('');
    setHistorialSearchCedula('');
    setHistorialPage(1);
  };

  // Filtrado de seguridad en frontend por cédula
  const displayedHistorialList = useMemo(() => {
    if (!historialSearchCedula || !historialSearchCedula.trim()) {
      return historialList;
    }
    const q = historialSearchCedula.trim().toLowerCase();
    return historialList.filter(item => item.cedula && String(item.cedula).toLowerCase().includes(q));
  }, [historialList, historialSearchCedula]);

  const totalPages = Math.max(1, Math.ceil((historialSearchCedula ? displayedHistorialList.length : historialTotal) / historialLimit));

  // ==========================================
  // TAB 2: CONSULTA RÁPIDA (1 CÉDULA)
  // ==========================================
  const [singleCedula, setSingleCedula] = useState('');
  const [selectedSingleSources, setSelectedSingleSources] = useState(['ADRES', 'EMSANAR', 'SALUD_TOTAL', 'VIVA1A']);
  const [isSingleLoading, setIsSingleLoading] = useState(false);
  const [singleProgressStatus, setSingleProgressStatus] = useState('');
  const [singleProfile, setSingleProfile] = useState(null);

  const toggleSourceSelection = (sourceId) => {
    if (selectedSingleSources.includes(sourceId)) {
      setSelectedSingleSources(selectedSingleSources.filter(s => s !== sourceId));
    } else {
      setSelectedSingleSources([...selectedSingleSources, sourceId]);
    }
  };

  const handleSelectAllSources = () => {
    if (selectedSingleSources.length === AVAILABLE_SOURCES.length) {
      setSelectedSingleSources(['ADRES', 'EMSANAR']);
    } else {
      setSelectedSingleSources(AVAILABLE_SOURCES.map(s => s.id));
    }
  };

  const handleConsultarInmediato = async (e) => {
    if (e) e.preventDefault();
    const cleanCedula = singleCedula.trim();
    if (!cleanCedula) {
      toast.error('Por favor ingrese un número de cédula válido.');
      return;
    }
    if (selectedSingleSources.length === 0) {
      toast.error('Seleccione al menos una fuente para consultar.');
      return;
    }

    setIsSingleLoading(true);
    setSingleProgressStatus('Consultando base de datos...');

    try {
      try {
        const cached = await localizacionService.getPerfilPersona(cleanCedula);
        if (cached && (cached.telefonos?.length > 0 || cached.nombre_completo)) {
          setSingleProfile(cached);
        }
      } catch (e_cached) {
        console.debug('No cached profile', e_cached);
      }

      setSingleProgressStatus('Encolando tarea en Celery...');
      const enqueueRes = await localizacionService.consultarInmediato(
        cleanCedula,
        selectedSingleSources
      );

      const taskId = enqueueRes.task_id;
      if (!taskId) {
        throw new Error('No se recibió ID de tarea desde el backend.');
      }

      let attempts = 0;
      const maxAttempts = 120;
      
      const poll = async () => {
        attempts++;
        const state = await localizacionService.getEstadoTarea(taskId);

        if (state.status === 'PROGRESS') {
          const currentFuente = state.progreso?.actual_fuente || 'Scraping';
          setSingleProgressStatus(`Procesando ${currentFuente} (${state.progreso?.porcentaje || 0}%)...`);
        }

        if (state.status === 'SUCCESS') {
          setSingleProgressStatus('Consolidando resultados...');
          const freshProfile = await localizacionService.getPerfilPersona(cleanCedula);
          setSingleProfile(freshProfile);
          toast.success('¡Consulta completada con éxito!');
          setIsSingleLoading(false);
          setSingleProgressStatus('');
          return;
        }

        if (state.status === 'FAILURE' || state.status === 'REVOKED') {
          toast.error(`La tarea finalizó con error: ${state.error || state.status}`);
          setIsSingleLoading(false);
          setSingleProgressStatus('');
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 1500);
        } else {
          toast.warning('La consulta sigue procesándose en segundo plano.');
          setIsSingleLoading(false);
          setSingleProgressStatus('');
        }
      };

      setTimeout(poll, 1000);

    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error al ejecutar la consulta.');
      setIsSingleLoading(false);
      setSingleProgressStatus('');
    }
  };

  // ==========================================
  // TAB 3: CONSULTA MASIVA (CELERY BATCH)
  // ==========================================
  const [batchInput, setBatchInput] = useState('');
  const [batchSources, setBatchSources] = useState(['ADRES', 'EMSANAR', 'SALUD_TOTAL', 'VIVA1A', 'SENA', 'SERVICIO_EMPLEO']);
  const [batchPriority, setBatchPriority] = useState('NORMAL');
  const [activeTask, setActiveTask] = useState(null);
  const [taskProgress, setTaskProgress] = useState(null);
  const [isEnqueueing, setIsEnqueueing] = useState(false);
  const pollIntervalRef = useRef(null);

  const parseBatchCedulas = () => {
    const raw = batchInput.split(/[\n,; \t]+/).map(c => c.trim()).filter(c => c.length >= 4);
    return Array.from(new Set(raw));
  };

  const parsedCedulas = parseBatchCedulas();

  const handleEncolarLote = async () => {
    if (parsedCedulas.length === 0) {
      toast.error('Ingrese al menos una cédula para procesar.');
      return;
    }
    if (parsedCedulas.length > 500) {
      toast.error(`El límite máximo por lote es de 500 cédulas (ingresó ${parsedCedulas.length}).`);
      return;
    }

    setIsEnqueueing(true);
    try {
      const resp = await localizacionService.encolarConsulta(
        parsedCedulas,
        batchSources,
        true,
        batchPriority
      );
      setActiveTask(resp.task_id);
      toast.success(`Lote de ${resp.total_cedulas} cédulas encolado con éxito. ID de Tarea: ${resp.task_id.slice(0, 8)}...`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error al encolar el lote de localización.');
    } finally {
      setIsEnqueueing(false);
    }
  };

  useEffect(() => {
    if (!activeTask) return;

    const checkStatus = async () => {
      try {
        const data = await localizacionService.getEstadoTarea(activeTask);
        setTaskProgress(data);

        if (data.status === 'SUCCESS' || data.status === 'FAILURE' || data.status === 'REVOKED') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (data.status === 'SUCCESS') {
            toast.success('¡Procesamiento del lote completado con éxito!');
          } else {
            toast.error(`La tarea finalizó con estado: ${data.status}`);
          }
        }
      } catch (err) {
        console.error('Error polling task status:', err);
      }
    };

    checkStatus();
    pollIntervalRef.current = setInterval(checkStatus, 2000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [activeTask]);

  // ==========================================
  // TAB 4: SALUD Y DISPONIBILIDAD (HEALTH)
  // ==========================================
  const [healthData, setHealthData] = useState(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);

  const loadHealth = async () => {
    setIsHealthLoading(true);
    try {
      const h = await localizacionService.getHealth();
      setHealthData(h);
    } catch (err) {
      console.error(err);
      toast.error('Error al consultar estado de salud de scrapers.');
    } finally {
      setIsHealthLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'health') {
      loadHealth();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 md:p-8">
      {/* Header Principal */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Módulo de Localización y Scraping
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Consulta y enriquecimiento de datos de contacto, salud, seguridad social y vehículos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Conexión Directa (Sin Tor)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Database className="w-3.5 h-3.5" />
              13 Portales Integrados
            </span>
          </div>
        </div>

        {/* Barra de Pestañas */}
        <div className="flex flex-wrap gap-2 mt-6 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            Historial de Auditoría
          </button>

          <button
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'single'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Search className="w-4 h-4" />
            Consulta Rápida (1 Cédula)
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'batch'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            Consulta Masiva (En Lote)
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'health'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4" />
            Disponibilidad Scrapers
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HISTORIAL & AUDITORÍA (VISTA PRINCIPAL CON OJO Y MODAL DINÁMICO) */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Historial Inmutable de Auditoría</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registro completo de cada intento de scraping capturado por triggers en PostgreSQL.
                </p>
              </div>

              {/* Filtros y Buscador */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Buscador por Cédula con búsqueda instantánea */}
                <form onSubmit={handleSearchCedulaSubmit} className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Buscar por cédula..."
                    value={historialInputCedula}
                    onChange={(e) => handleCedulaInputChange(e.target.value)}
                    className="w-44 sm:w-56 pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                  {historialInputCedula && (
                    <button
                      type="button"
                      onClick={handleClearCedulaSearch}
                      className="absolute right-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>

                {/* Filtro Fuente */}
                <select
                  value={historialFilterFuente}
                  onChange={(e) => {
                    setHistorialFilterFuente(e.target.value);
                    setHistorialPage(1);
                  }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las Fuentes</option>
                  {AVAILABLE_SOURCES.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
                </select>

                {/* Filtro Estado (Default SUCCESS) */}
                <select
                  value={historialFilterStatus}
                  onChange={(e) => {
                    setHistorialFilterStatus(e.target.value);
                    setHistorialPage(1);
                  }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los Estados</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="ERROR">ERROR</option>
                  <option value="NOT_FOUND">NOT_FOUND</option>
                </select>

                {/* Límite por página */}
                <select
                  value={historialLimit}
                  onChange={(e) => {
                    setHistorialLimit(Number(e.target.value));
                    setHistorialPage(1);
                  }}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="10">10 / pág</option>
                  <option value="25">25 / pág</option>
                  <option value="50">50 / pág</option>
                  <option value="100">100 / pág</option>
                </select>

                <button
                  type="button"
                  title="Recargar historial"
                  onClick={() => loadHistorial(historialPage, historialLimit, historialSearchCedula, historialFilterFuente, historialFilterStatus)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isHistorialLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Tabla de Historial con Ojo de Ver */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Fuente</th>
                    <th className="py-3 px-4">Cédula</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Fecha Scraping</th>
                    <th className="py-3 px-4">Resumen de Datos Extraídos</th>
                    <th className="py-3 px-4 text-center">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isHistorialLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Cargando registros del historial...</span>
                        </div>
                      </td>
                    </tr>
                  ) : displayedHistorialList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                        No se encontraron registros para {historialSearchCedula ? `la cédula "${historialSearchCedula}"` : 'los filtros aplicados'}.
                      </td>
                    </tr>
                  ) : (
                    displayedHistorialList.map((item) => {
                      let itemData = item.data;
                      if (typeof item.data === 'string') {
                        try { itemData = JSON.parse(item.data); } catch { itemData = {}; }
                      }
                      itemData = itemData || {};

                      const summaryEmail = itemData.email || itemData.correo;
                      const summaryPhone = itemData.telefono || itemData.celular;
                      const summaryDir = itemData.direccion;
                      const summaryEps = itemData.eps || itemData.eps_nombre;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="py-3 px-4 font-bold text-xs text-slate-700">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {item.fuente}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-800">{item.cedula}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold ${
                              item.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              item.status === 'ERROR' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {item.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {item.status === 'ERROR' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                            {item.scraped_at ? new Date(item.scraped_at).toLocaleString('es-CO') : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600 max-w-sm">
                            {item.error_message ? (
                              <span className="text-rose-600 font-mono text-[11px] truncate block">
                                ⚠️ {item.error_message}
                              </span>
                            ) : (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {summaryEmail && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-medium truncate max-w-[180px]">
                                    <Mail className="w-3 h-3 shrink-0" />
                                    {summaryEmail}
                                  </span>
                                )}
                                {summaryPhone && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-mono font-medium">
                                    <Phone className="w-3 h-3 shrink-0" />
                                    {summaryPhone}
                                  </span>
                                )}
                                {summaryDir && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-medium truncate max-w-[180px]">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    {summaryDir}
                                  </span>
                                )}
                                {summaryEps && !summaryEmail && !summaryPhone && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100 text-[11px] font-medium">
                                    <Shield className="w-3 h-3 shrink-0" />
                                    {summaryEps}
                                  </span>
                                )}
                                {!summaryEmail && !summaryPhone && !summaryDir && !summaryEps && (
                                  <span className="text-slate-400 font-mono text-[11px] truncate">
                                    {JSON.stringify(itemData).slice(0, 45)}...
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedHistorialItem(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-lg text-xs font-bold transition-all shadow-2xs group-hover:scale-105"
                              title="Ver información completa extraída"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Ver</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Barra de Paginación */}
            {(historialSearchCedula ? displayedHistorialList.length : historialTotal) > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <div>
                  Mostrando <span className="font-semibold text-slate-800">{Math.min((historialPage - 1) * historialLimit + 1, historialSearchCedula ? displayedHistorialList.length : historialTotal)}</span> a <span className="font-semibold text-slate-800">{Math.min(historialPage * historialLimit, historialSearchCedula ? displayedHistorialList.length : historialTotal)}</span> de <span className="font-semibold text-slate-800">{historialSearchCedula ? displayedHistorialList.length : historialTotal}</span> registros
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setHistorialPage(1)}
                    disabled={historialPage === 1 || isHistorialLoading}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Primera página"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setHistorialPage(prev => Math.max(1, prev - 1))}
                    disabled={historialPage === 1 || isHistorialLoading}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="px-3 py-1 font-semibold text-slate-700">
                    Página {historialPage} de {totalPages}
                  </div>

                  <button
                    type="button"
                    onClick={() => setHistorialPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={historialPage >= totalPages || isHistorialLoading}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Página siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setHistorialPage(totalPages)}
                    disabled={historialPage >= totalPages || isHistorialLoading}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Última página"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONSULTA RÁPIDA (1 CÉDULA) */}
      {/* ========================================================================= */}
      {activeTab === 'single' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <form onSubmit={handleConsultarInmediato} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Número de Cédula de Ciudadanía
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ej: 1064438082, 1024511109, 80188977..."
                      value={singleCedula}
                      onChange={(e) => setSingleCedula(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 font-mono text-base"
                    />
                    <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSingleLoading || !singleCedula.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 min-w-[220px] transition-all"
                >
                  {isSingleLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{singleProgressStatus || 'Consultando...'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      Consultar Ahora
                    </>
                  )}
                </button>
              </div>

              {/* Selector de Fuentes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Fuentes a Consultar ({selectedSingleSources.length}/{AVAILABLE_SOURCES.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllSources}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    {selectedSingleSources.length === AVAILABLE_SOURCES.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {AVAILABLE_SOURCES.map((src) => {
                    const isSelected = selectedSingleSources.includes(src.id);
                    return (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => toggleSourceSelection(src.id)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? `${src.color} border-current shadow-xs`
                            : 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-bold">{src.id}</span>
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-current' : 'bg-slate-300'}`} />
                        </div>
                        <span className="text-[11px] truncate">{src.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>
          </div>

          {/* Resultados Consolidados */}
          {singleProfile && (
            <div className="space-y-6 animate-fadeIn">
              {/* Tarjeta de Encabezado de Persona */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-blue-500/20">
                      {singleProfile.nombre_completo ? singleProfile.nombre_completo.slice(0, 2).toUpperCase() : 'CC'}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {singleProfile.nombre_completo || 'Nombre no registrado'}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-1">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          CC: {singleProfile.cedula}
                        </span>
                        {singleProfile.fecha_nacimiento && (
                          <span>• Nacimiento: {singleProfile.fecha_nacimiento}</span>
                        )}
                        {singleProfile.fecha_expedicion && (
                          <span>• Expedición: {singleProfile.fecha_expedicion}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {singleProfile.total_fuentes_exitosas} Fuentes con Datos
                    </span>
                  </div>
                </div>

                {/* Grid 360° de Datos de Contacto y Seguridad Social */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                  {/* Teléfonos y Celulares */}
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                      <Phone className="w-4 h-4 text-blue-600" />
                      Teléfonos & Celulares ({singleProfile.telefonos?.length || 0})
                    </div>
                    {(!singleProfile.telefonos || singleProfile.telefonos.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No se encontraron teléfonos.</p>
                    ) : (
                      <div className="space-y-2">
                        {singleProfile.telefonos.map((t, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 text-sm">
                            <span className="font-mono font-semibold text-slate-800">{t.numero}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                              {t.fuente}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Correos */}
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                      <Mail className="w-4 h-4 text-indigo-600" />
                      Correos Electrónicos ({singleProfile.correos?.length || 0})
                    </div>
                    {(!singleProfile.correos || singleProfile.correos.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No se encontraron correos.</p>
                    ) : (
                      <div className="space-y-2">
                        {singleProfile.correos.map((c, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 text-sm">
                            <span className="text-slate-800 truncate mr-2">{c.email}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {c.fuente}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Direcciones */}
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      Direcciones ({singleProfile.direcciones?.length || 0})
                    </div>
                    {(!singleProfile.direcciones || singleProfile.direcciones.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No se encontraron direcciones.</p>
                    ) : (
                      <div className="space-y-2">
                        {singleProfile.direcciones.map((d, idx) => (
                          <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 text-sm">
                            <p className="font-medium text-slate-800">{d.direccion}</p>
                            <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                              <span>{d.ciudad ? `${d.ciudad}, ${d.departamento || ''}` : 'Ciudad N/A'}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                {d.fuente}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Fila Seguridad Social & Vehículos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 mt-6">
                  {/* Seguridad Social */}
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                      <Shield className="w-4 h-4 text-teal-600" />
                      Seguridad Social & Afiliaciones
                    </div>
                    {singleProfile.seguridad_social ? (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <span className="text-xs text-slate-400 block">EPS / Administradora</span>
                          <span className="font-semibold text-slate-800">{singleProfile.seguridad_social.eps_nombre || 'N/A'}</span>
                          <span className="text-[10px] text-emerald-600 block font-bold">{singleProfile.seguridad_social.eps_estado || ''}</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <span className="text-xs text-slate-400 block">Fondo de Pensión</span>
                          <span className="font-semibold text-slate-800">{singleProfile.seguridad_social.pension_nombre || 'N/A'}</span>
                          <span className="text-[10px] text-blue-600 block">{singleProfile.seguridad_social.pension_estado || ''}</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <span className="text-xs text-slate-400 block">ARL / Riesgos</span>
                          <span className="font-semibold text-slate-800">{singleProfile.seguridad_social.arl_nombre || 'N/A'}</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <span className="text-xs text-slate-400 block">Régimen</span>
                          <span className="font-semibold text-slate-800">{singleProfile.seguridad_social.eps_regimen || 'N/A'}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Sin datos de seguridad social.</p>
                    )}
                  </div>

                  {/* Vehículos & Tránsito */}
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                      <Car className="w-4 h-4 text-rose-600" />
                      Vehículos & Tránsito (SIMIT)
                    </div>
                    {singleProfile.vehiculos ? (
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500">Multas Registradas:</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            singleProfile.vehiculos.tiene_multas
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {singleProfile.vehiculos.tiene_multas ? 'Con Multas Pendientes' : 'Al Día / Sin Multas'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Placas Asociadas: {singleProfile.vehiculos.placas?.length > 0 ? singleProfile.vehiculos.placas.join(', ') : 'Ninguna'}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Sin registros de vehículos.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CONSULTA MASIVA (EN LOTE CON CELERY) */}
      {/* ========================================================================= */}
      {activeTab === 'batch' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Encolar Lote de Cédulas</h3>
                <p className="text-xs text-slate-500">
                  Pegue hasta 500 números de cédula separados por saltos de línea, comas o espacios.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-100 rounded-lg text-slate-700">
                {parsedCedulas.length} Cédulas Detectadas
              </span>
            </div>

            <textarea
              rows={6}
              placeholder="1064438082&#10;1024511109&#10;80188977&#10;55059598..."
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />

            {/* Selector de Prioridad y Fuentes para Lote */}
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600">Prioridad:</span>
                <div className="flex gap-2">
                  {['NORMAL', 'ALTA'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBatchPriority(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        batchPriority === p
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleEncolarLote}
                disabled={isEnqueueing || parsedCedulas.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
              >
                {isEnqueueing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                Encolar {parsedCedulas.length} Cédulas en Celery
              </button>
            </div>
          </div>

          {/* Progreso en Tiempo Real del Lote */}
          {taskProgress && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Progreso de la Tarea en Celery</h4>
                  <p className="text-xs text-slate-500 font-mono">ID: {taskProgress.task_id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  taskProgress.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  taskProgress.status === 'FAILURE' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                }`}>
                  {taskProgress.status}
                </span>
              </div>

              {/* Barra de Progreso */}
              <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${taskProgress.progreso?.porcentaje || 0}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block">Procesadas</span>
                  <span className="text-base font-bold text-slate-800">
                    {taskProgress.progreso?.procesadas || 0} / {taskProgress.progreso?.total || 0}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block">Porcentaje</span>
                  <span className="text-base font-bold text-blue-600">
                    {taskProgress.progreso?.porcentaje || 0}%
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
                  <span className="text-emerald-500 block">Exitosas</span>
                  <span className="text-base font-bold">
                    {taskProgress.progreso?.exitosas || 0}
                  </span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl text-rose-700">
                  <span className="text-rose-500 block">Fallidas / Sin Datos</span>
                  <span className="text-base font-bold">
                    {taskProgress.progreso?.fallidas || 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DISPONIBILIDAD & SALUD (HEALTH) */}
      {/* ========================================================================= */}
      {activeTab === 'health' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Estado en Vivo de Scrapers</h3>
                <p className="text-xs text-slate-500">
                  Pruebas HTTP y disponibilidad de portales en tiempo real.
                </p>
              </div>

              <button
                type="button"
                onClick={loadHealth}
                disabled={isHealthLoading}
                className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isHealthLoading ? 'animate-spin' : ''}`} />
                Actualizar Diagnóstico
              </button>
            </div>

            {healthData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(healthData.fuentes || {}).map(([fuente, info]) => (
                  <div key={fuente} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-800">{fuente}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${info.disponible ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="text-slate-500 flex justify-between">
                        <span>Latencia:</span>
                        <span className="font-mono font-semibold text-slate-700">
                          {info.tiempo_respuesta_ms ? `${Math.round(info.tiempo_respuesta_ms)} ms` : 'N/A'}
                        </span>
                      </div>
                      <div className="text-slate-500 flex justify-between">
                        <span>Conexión:</span>
                        <span className="font-semibold text-slate-700">{info.tipo_conexion}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE DEL HISTORIAL (OJO DE VER) */}
      {selectedHistorialItem && (
        <HistorialDetailModal
          item={selectedHistorialItem}
          onClose={() => setSelectedHistorialItem(null)}
        />
      )}
    </div>
  );
}
