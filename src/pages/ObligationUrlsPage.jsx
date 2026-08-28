import React, { useState, useEffect, useRef, useTransition } from 'react';
import { 
  UploadCloud, 
  Link as LinkIcon, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  FileSpreadsheet, 
  ArrowRight,
  Database,
  Zap,
  Info,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import obligationUrlService from '../services/obligationUrlService';

const normalizeHeader = (header) => {
  if (!header) return '';
  let h = String(header).trim().toLowerCase();
  if (h.startsWith('\ufeff')) h = h.slice(1);
  h = h.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  h = h.replace(/[-/().]/g, ' ').replace(/\s+/g, '_');

  const aliases = {
    obligacion: 'obligacion',
    obligaciones: 'obligacion',
    codigo: 'obligacion',
    codigo_obligacion: 'obligacion',
    codigo_de_obligacion: 'obligacion',
    num_obligacion: 'obligacion',
    numero_obligacion: 'obligacion',
    no_obligacion: 'obligacion',
    cuenta: 'obligacion',
    referencia: 'obligacion',
    contrato: 'obligacion',
    url: 'url',
    link: 'url',
    link_pago: 'url',
    link_de_pago: 'url',
    url_pago: 'url',
    enlace: 'url',
    enlace_pago: 'url',
    token: 'url',
    short_url: 'url',
  };
  return aliases[h] || h;
};

export default function ObligationUrlsPage() {
  const [stats, setStats] = useState({
    total_obligations_master: 0,
    total_with_url: 0,
    coverage_percentage: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Table state
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingTable, setLoadingTable] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Uploader state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // { currentBatch, totalBatches, percent, totalRows, processedRows, inserted, updated, invalidCount }
  const [uploadResult, setUploadResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Manual modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ obligacion: '', url: '' });
  const [savingManual, setSavingManual] = useState(false);

  useEffect(() => {
    loadStats();
    loadTableData(1, '');
  }, []);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const data = await obligationUrlService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('No se pudieron cargar las estadísticas de URLs');
    } finally {
      setLoadingStats(false);
    }
  };

  const loadTableData = async (page = 1, search = '') => {
    try {
      setLoadingTable(true);
      const res = await obligationUrlService.getPaginated({ page, size: 20, search });
      setItems(res.items || []);
      setTotalPages(res.pages || 1);
      setTotalItems(res.total || 0);
      setCurrentPage(res.page || 1);
    } catch (error) {
      console.error('Error loading obligation URLs:', error);
      toast.error('Error al cargar la lista de URLs');
    } finally {
      setLoadingTable(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadTableData(1, searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    loadTableData(1, '');
  };

  // Upload handlers
  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    const validExts = ['.csv', '.xlsx', '.xls', '.txt', '.tsv'];
    const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      toast.error('Formato no soportado. Sube un archivo CSV, XLSX o TXT');
      return;
    }
    setSelectedFile(file);
    setUploadResult(null);
    setUploadProgress(null);
  };

  /**
   * Extrae los registros [{obligacion, url}] del archivo en el navegador
   */
  const parseFileClientSide = async (file) => {
    const ext = file.name.toLowerCase().split('.').pop();

    if (ext === 'xlsx' || ext === 'xls') {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error('El archivo Excel no tiene hojas válidas');

      const rows = [];
      let headerMap = {};

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell, colNumber) => {
            const val = cell.value ? String(cell.value) : '';
            headerMap[colNumber] = normalizeHeader(val);
          });
        } else {
          let obl = '';
          let url = '';
          row.eachCell((cell, colNumber) => {
            const key = headerMap[colNumber];
            const val = cell.value !== null && cell.value !== undefined ? String(cell.value).trim() : '';
            if (key === 'obligacion') obl = val;
            if (key === 'url') url = val;
          });
          if (obl && obl.toLowerCase() !== 'nan') {
            rows.push({
              obligacion: obl,
              url: url && url.toLowerCase() !== 'nan' ? url : null
            });
          }
        }
      });
      return rows;
    }

    // CSV / TSV / TXT con PapaParse
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => normalizeHeader(h),
        complete: (results) => {
          const rows = [];
          (results.data || []).forEach((r) => {
            const obl = String(r.obligacion || r.codigo || r.cuenta || '').trim();
            const urlVal = String(r.url || r.link || r.token || '').trim();
            if (obl) {
              rows.push({
                obligacion: obl,
                url: urlVal ? urlVal : null
              });
            }
          });
          resolve(rows);
        },
        error: (err) => reject(err),
      });
    });
  };

  /**
   * Carga masiva por lotes (Chunked Batch Engine)
   */
  const handleStartUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadResult(null);

    try {
      toast.info('Leyendo archivo y estructurando lotes de alta velocidad...', { duration: 3000 });
      const parsedRows = await parseFileClientSide(selectedFile);

      if (!parsedRows || parsedRows.length === 0) {
        throw new Error('No se encontraron filas con datos válidos de obligación');
      }

      const totalRows = parsedRows.length;
      const CHUNK_SIZE = 5000;
      const totalBatches = Math.ceil(totalRows / CHUNK_SIZE);

      let accumulatedInserted = 0;
      let accumulatedUpdated = 0;
      let accumulatedValid = 0;
      let accumulatedInvalidCount = 0;
      let sampleInvalid = [];

      setUploadProgress({
        currentBatch: 0,
        totalBatches,
        percent: 0,
        totalRows,
        processedRows: 0,
        inserted: 0,
        updated: 0,
        invalidCount: 0,
      });

      for (let i = 0; i < totalBatches; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, totalRows);
        const batchItems = parsedRows.slice(start, end);

        const res = await obligationUrlService.ingestBatch(batchItems);

        accumulatedInserted += (res.inserted || 0);
        accumulatedUpdated += (res.updated || 0);
        accumulatedValid += (res.valid_rows || 0);
        accumulatedInvalidCount += (res.invalid_obligations_count || 0);
        if (res.sample_invalid && sampleInvalid.length < 10) {
          sampleInvalid.push(...res.sample_invalid);
        }

        const processed = end;
        const percent = Math.round((processed / totalRows) * 100);

        setUploadProgress({
          currentBatch: i + 1,
          totalBatches,
          percent,
          totalRows,
          processedRows: processed,
          inserted: accumulatedInserted,
          updated: accumulatedUpdated,
          invalidCount: accumulatedInvalidCount,
        });
      }

      const finalResult = {
        total_rows: totalRows,
        valid_rows: accumulatedValid,
        inserted: accumulatedInserted,
        updated: accumulatedUpdated,
        invalid_obligations_count: accumulatedInvalidCount,
        sample_invalid: sampleInvalid.slice(0, 10),
        affected: accumulatedInserted + accumulatedUpdated,
      };

      setUploadResult(finalResult);
      toast.success(`Carga masiva completada: ${finalResult.affected.toLocaleString('es-CO')} registros procesados con éxito!`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadStats();
      loadTableData(1, searchTerm);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Error durante la carga por lotes');
    } finally {
      setUploading(false);
    }
  };

  // Copy helper
  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Enlace copiado al portapapeles');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Manual save handler
  const handleManualSave = async (e) => {
    e.preventDefault();
    if (!manualForm.obligacion.trim() || !manualForm.url.trim()) {
      toast.error('Todos los campos son obligatorios');
      return;
    }
    setSavingManual(true);
    try {
      await obligationUrlService.saveManual(manualForm.obligacion.trim(), manualForm.url.trim());
      toast.success('Token/URL guardado correctamente');
      setIsManualModalOpen(false);
      setManualForm({ obligacion: '', url: '' });
      loadStats();
      loadTableData(currentPage, searchTerm);
    } catch (error) {
      console.error('Manual save error:', error);
      toast.error(error.message || 'Error al guardar el token');
    } finally {
      setSavingManual(false);
    }
  };

  // Delete handler
  const handleDelete = async (obligacion) => {
    if (!window.confirm(`¿Estás seguro de eliminar el token/URL de la obligación ${obligacion}?`)) return;
    try {
      await obligationUrlService.deleteUrl(obligacion);
      toast.success(`URL eliminada para la obligación ${obligacion}`);
      loadStats();
      loadTableData(currentPage, searchTerm);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Error al eliminar');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-semibold text-blue-200 backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            Motor de Ingesta Masiva por Lotes (Batch Engine)
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Tokens y URLs de Pago</h1>
          <p className="text-sm text-blue-200/90 max-w-2xl leading-relaxed">
            Administra y carga masivamente los enlaces seguros de pago de las obligaciones para su reemplazo dinámico 
            en campañas y plantillas mediante la variable <code className="bg-blue-950/60 px-2 py-0.5 rounded text-yellow-300 font-mono text-xs border border-blue-800">{'{{link_pago_seguro}}'}</code>.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="inline-flex items-center gap-2 bg-white text-blue-950 font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-all shadow-md text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            Nuevo Enlace Manual
          </button>
          <button
            onClick={() => { loadStats(); loadTableData(currentPage, searchTerm); }}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-all cursor-pointer"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loadingTable || loadingStats ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Obligaciones en Maestro</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {stats.total_obligations_master.toLocaleString('es-CO')}
              </h3>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
              <Database className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Total</span> de contratos registrados en cartera
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Con Token / URL Activa</p>
              <h3 className="text-3xl font-bold text-emerald-600 mt-2">
                {stats.total_with_url.toLocaleString('es-CO')}
              </h3>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-emerald-700">Listos</span> para reemplazar en tag {'{{link_pago_seguro}}'}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cobertura de Cartera</p>
              <h3 className="text-3xl font-bold text-indigo-600 mt-2">
                {stats.coverage_percentage}%
              </h3>
            </div>
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Zap className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.coverage_percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ingestion & Batch Uploader Section */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              Carga Masiva por Lotes (Batch Engine)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Procesa archivos CSV o Excel de cualquier tamaño dividiéndolos automáticamente en lotes para máxima velocidad
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border">
            <span>Columnas admitidas:</span>
            <code className="bg-white px-1.5 py-0.5 rounded text-blue-700 font-bold border">obligacion</code>
            <code className="bg-white px-1.5 py-0.5 rounded text-blue-700 font-bold border">url</code>
          </div>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
            dragOver 
              ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' 
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
          } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.xlsx,.xls,.txt,.tsv"
            disabled={uploading}
            className="hidden"
          />

          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 text-blue-600">
            {selectedFile ? (
              <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          {selectedFile ? (
            <div className="space-y-1">
              <p className="font-semibold text-slate-800 text-sm">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB — Listo para procesar por lotes</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-semibold text-slate-800 text-sm">
                Haz clic para seleccionar o arrastra tu archivo aquí
              </p>
              <p className="text-xs text-slate-500">
                Soporta archivos .CSV, .XLSX, .XLS, .TSV o .TXT de cualquier tamaño
              </p>
            </div>
          )}
        </div>

        {/* Live Progress Bar during Batch Ingestion */}
        {uploading && uploadProgress && (
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <h4 className="text-sm font-bold text-blue-950">
                    Procesando Lote {uploadProgress.currentBatch} de {uploadProgress.totalBatches} ({uploadProgress.percent}%)
                  </h4>
                  <p className="text-xs text-blue-800/80">
                    {uploadProgress.processedRows.toLocaleString('es-CO')} de {uploadProgress.totalRows.toLocaleString('es-CO')} registros enviados
                  </p>
                </div>
              </div>
              <span className="text-lg font-extrabold text-blue-700">{uploadProgress.percent}%</span>
            </div>

            <div className="w-full bg-blue-200/80 rounded-full h-3.5 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${uploadProgress.percent}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">Nuevos Insertados</span>
                <span className="font-bold text-emerald-600 text-sm">{uploadProgress.inserted.toLocaleString('es-CO')}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">Actualizados</span>
                <span className="font-bold text-blue-600 text-sm">{uploadProgress.updated.toLocaleString('es-CO')}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">No en Maestro</span>
                <span className="font-bold text-amber-600 text-sm">{uploadProgress.invalidCount.toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Upload Action */}
        {selectedFile && !uploading && (
          <div className="flex items-center justify-between bg-blue-50/80 p-4 rounded-2xl border border-blue-100 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-blue-950">Motor de Batches preparado</h4>
                <p className="text-xs text-blue-800/80">Procesará bloques de 5.000 filas con deduplicación y upsert automático.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleStartUpload}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Iniciar Carga Masiva
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Upload Result Feedback */}
        {uploadResult && (
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Resumen de la Última Ingesta
              </div>
              <button 
                onClick={() => setUploadResult(null)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Leídas en archivo</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{uploadResult.total_rows.toLocaleString('es-CO')}</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <p className="text-[11px] font-semibold text-emerald-600 uppercase">Nuevas Insertadas</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">{uploadResult.inserted.toLocaleString('es-CO')}</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <p className="text-[11px] font-semibold text-blue-600 uppercase">Actualizadas</p>
                <p className="text-xl font-bold text-blue-600 mt-1">{uploadResult.updated.toLocaleString('es-CO')}</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <p className="text-[11px] font-semibold text-amber-600 uppercase">No en Maestro</p>
                <p className="text-xl font-bold text-amber-600 mt-1">{uploadResult.invalid_obligations_count.toLocaleString('es-CO')}</p>
              </div>
            </div>

            {uploadResult.invalid_obligations_count > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>{uploadResult.invalid_obligations_count} obligaciones no existen en el maestro de obligaciones:</span>
                </div>
                <p className="text-amber-800 font-mono text-[11px] break-all">
                  Muestra: {uploadResult.sample_invalid.join(', ')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explorer / Token Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-indigo-600" />
              Explorador de Tokens y URLs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulta, copia o ajusta individualmente los enlaces asignados a cada obligación
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por obligación o URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-xl w-64 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-y border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Código Obligación</th>
                <th className="py-3 px-4">Token / URL de Pago</th>
                <th className="py-3 px-4 text-center">Enlace Directo</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingTable ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                    Cargando tokens de obligaciones...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Info className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                    No se encontraron registros de tokens o URLs
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id || item.obligacion} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {(currentPage - 1) * 20 + idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      {item.obligacion}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 max-w-md">
                        <span className="font-mono text-slate-700 truncate text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200" title={item.url}>
                          {item.url || <span className="text-slate-400 italic">Sin URL</span>}
                        </span>
                        {item.url && (
                          <button
                            onClick={() => handleCopy(item.url, item.id)}
                            className="p-1 hover:bg-slate-200 text-slate-500 rounded transition-colors cursor-pointer"
                            title="Copiar URL"
                          >
                            {copiedId === item.id ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.url ? (
                        <a
                          href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-[11px]"
                        >
                          Abrir <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-300 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(item.obligacion)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <p>
            Mostrando <span className="font-bold text-slate-800">{items.length}</span> de <span className="font-bold text-slate-800">{totalItems.toLocaleString('es-CO')}</span> registros
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentPage > 1) {
                  setCurrentPage(currentPage - 1);
                  loadTableData(currentPage - 1, searchTerm);
                }
              }}
              disabled={currentPage <= 1 || loadingTable}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              Anterior
            </button>
            <span className="font-medium px-2">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => {
                if (currentPage < totalPages) {
                  setCurrentPage(currentPage + 1);
                  loadTableData(currentPage + 1, searchTerm);
                }
              }}
              disabled={currentPage >= totalPages || loadingTable}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Manual Token Creation Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Registrar Token Manualmente
              </h3>
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código de Obligación <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 100234567"
                  value={manualForm.obligacion}
                  onChange={(e) => setManualForm({ ...manualForm, obligacion: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Token o URL de Pago <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://pago.renovar.com/tok/xyz123 o xyz123"
                  value={manualForm.url}
                  onChange={(e) => setManualForm({ ...manualForm, url: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingManual ? 'Guardando...' : 'Guardar Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
