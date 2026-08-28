import React, { useState, useEffect, useRef } from 'react';
import { 
  Link2, UploadCloud, Search, CheckCircle2, AlertTriangle, RefreshCw, 
  Trash2, Edit3, Plus, ExternalLink, Copy, Check, FileSpreadsheet, 
  FileText, Database, ShieldCheck, Zap, HelpCircle, X, Loader2, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import obligationUrlService from '../services/obligationUrlService';

const ObligationUrlsPage = () => {
  // Stats state
  const [stats, setStats] = useState({
    total_obligations_master: 0,
    total_with_url: 0,
    coverage_percentage: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Table & pagination state
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingTable, setLoadingTable] = useState(false);

  // Upload state
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  // Manual Modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ obligacion: '', url: '' });
  const [savingManual, setSavingManual] = useState(false);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadStats();
    loadTableData(1, searchTerm);
  }, []);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const data = await obligationUrlService.getStats();
      setStats(data || { total_obligations_master: 0, total_with_url: 0, coverage_percentage: 0 });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadTableData = async (page = 1, search = searchTerm) => {
    setLoadingTable(true);
    try {
      const data = await obligationUrlService.getPaginated({ page, size: pageSize, search });
      setItems(data.items || []);
      setTotalItems(data.total || 0);
      setCurrentPage(data.page || 1);
      setTotalPages(data.pages || 1);
    } catch (error) {
      console.error('Error loading obligation URLs:', error);
      toast.error('Error al cargar la lista de tokens/URLs');
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
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const result = await obligationUrlService.uploadFile(selectedFile);
      setUploadResult(result);
      toast.success(`Carga completada: ${result.affected || (result.inserted + result.updated)} registros procesados`);
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
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <Link2 className="w-7 h-7 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tokens y Enlaces de Pago</h1>
              <p className="text-blue-200/80 text-sm mt-1">
                Carga masiva por lotes (batches) de enlaces cortos y tokens para plantillas de SMS, WhatsApp y Email
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setManualForm({ obligacion: '', url: '' });
              setIsManualModalOpen(true);
            }}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium border border-white/20 backdrop-blur-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Token Individual
          </button>
          <button
            onClick={() => {
              loadStats();
              loadTableData(currentPage, searchTerm);
            }}
            disabled={loadingStats || loadingTable}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg transition-all"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStats || loadingTable ? 'animate-spin' : ''}`} />
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
            <span className="font-semibold text-slate-700">Fuente:</span> Base de datos central (master_obligations)
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
              Arrastra o selecciona un archivo para procesar inserciones y actualizaciones automáticas a alta velocidad
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
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
            dragOver 
              ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' 
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.xlsx,.xls,.txt,.tsv"
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
              <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB — Listo para procesar</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-semibold text-slate-800 text-sm">
                Haz clic para seleccionar o arrastra tu archivo aquí
              </p>
              <p className="text-xs text-slate-500">
                Soporta archivos .CSV, .XLSX, .XLS, .TSV o .TXT delimitados por coma, punto y coma o tabulación
              </p>
            </div>
          )}
        </div>

        {/* Upload Action */}
        {selectedFile && (
          <div className="flex items-center justify-between bg-blue-50/80 p-4 rounded-2xl border border-blue-100 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-blue-950">Motor de Batches preparado</h4>
                <p className="text-xs text-blue-800/80">Procesará bloques de 2.000 filas con deduplicación y upsert automático.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={(e) => { e.stopPropagation(); handleStartUpload(); }}
                className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando por lotes...
                  </>
                ) : (
                  <>
                    Iniciar Carga Masiva
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Upload Results Summary Card */}
        {uploadResult && (
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Resumen de la Ingesta por Lotes</h3>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                Completado Exitosamente
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">Total Filas Leídas</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{uploadResult.total_rows?.toLocaleString('es-CO')}</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">Nuevas Insertadas</p>
                <p className="text-lg font-bold text-emerald-600 mt-1">+{uploadResult.inserted?.toLocaleString('es-CO')}</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">Actualizadas</p>
                <p className="text-lg font-bold text-blue-600 mt-1">{uploadResult.updated?.toLocaleString('es-CO')}</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">No Encontradas en BD</p>
                <p className="text-lg font-bold text-amber-600 mt-1">{uploadResult.invalid_obligations_count?.toLocaleString('es-CO')}</p>
              </div>
            </div>

            {uploadResult.invalid_obligations_count > 0 && uploadResult.sample_invalid?.length > 0 && (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Muestra de obligaciones en el archivo que no existen en el maestro:
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {uploadResult.sample_invalid.map((obl, idx) => (
                    <span key={idx} className="bg-white font-mono px-2 py-0.5 rounded border border-amber-300 text-amber-800">
                      {obl}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explorer & Table Section */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Explorador de Tokens y Enlaces de Pago
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulta y administra los enlaces asignados a cada número de obligación ({totalItems.toLocaleString('es-CO')} registros)
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por obligación o URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 rounded-tl-2xl">Obligación</th>
                <th className="px-6 py-4">URL / Token de Pago</th>
                <th className="px-6 py-4 text-right rounded-tr-2xl">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingTable ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Cargando tokens de obligaciones...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No se encontraron registros de tokens o enlaces de pago
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 font-mono font-bold text-blue-700">
                      <span className="bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        {row.obligacion}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {row.url ? (
                        <div className="flex items-center gap-2 max-w-xl">
                          <span className="font-mono text-xs text-slate-700 truncate select-all bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                            {row.url}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin URL</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {row.url && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCopy(row.url, row.id)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Copiar URL"
                            >
                              {copiedId === row.id ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            {row.url.startsWith('http') && (
                              <a
                                href={row.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Abrir enlace"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setManualForm({ obligacion: row.obligacion, url: row.url || '' });
                            setIsManualModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar Token/URL"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.obligacion)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-slate-500">
              Mostrando página <span className="font-semibold text-slate-800">{currentPage}</span> de{' '}
              <span className="font-semibold text-slate-800">{totalPages}</span> ({totalItems.toLocaleString('es-CO')} registros)
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1 || loadingTable}
                onClick={() => loadTableData(currentPage - 1, searchTerm)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Anterior
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  if (pageNum < 1 || pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => loadTableData(pageNum, searchTerm)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages || loadingTable}
                onClick={() => loadTableData(currentPage + 1, searchTerm)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Link2 className="w-5 h-5 text-blue-600" />
                {manualForm.obligacion ? 'Gestionar Token / URL' : 'Nuevo Token de Obligación'}
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSave} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Código de Obligación *
                </label>
                <input
                  type="text"
                  placeholder="Ej: OBL-123456"
                  value={manualForm.obligacion}
                  onChange={(e) => setManualForm({ ...manualForm, obligacion: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500">Debe existir previamente en el maestro de datos.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  URL / Token de Pago *
                </label>
                <input
                  type="text"
                  placeholder="Ej: https://pagos.renovar.co/p/a8f9c2 o token..."
                  value={manualForm.url}
                  onChange={(e) => setManualForm({ ...manualForm, url: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {savingManual && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObligationUrlsPage;
