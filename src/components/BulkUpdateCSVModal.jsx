import React, { useState } from 'react';
import ModernModal from './ModernModal';
import { bulkUpdateEmployees } from '../services/api';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Loader2, 
  FileText,
  XCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

const VALID_HEADERS = [
  'cedula',
  'nombre_completo',
  'area',
  'cargo',
  'jefe_inmediato',
  'tipo_contrato',
  'estado',
  'ciudad',
  'localidad',
  'fecha_ingreso',
  'fecha_nacimiento',
  'genero',
  'direccion_residencia',
  'eps',
  'fondo_pensiones',
  'arl',
  'celular',
  'correo_personal',
  'contacto_emergencia_nombre',
  'contacto_emergencia_telefono',
  'cantidad_hijos',
  'temporal',
  'fecha_fin_contrato_temporal',
  'adminfo',
  'correo_renovar'
];

const BulkUpdateCSVModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Solo se permiten archivos con extensión .csv');
        return;
      }
      setFile(selectedFile);
      setUploadError(null);
      setResults(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.csv')) {
        toast.error('Solo se permiten archivos con extensión .csv');
        return;
      }
      setFile(droppedFile);
      setUploadError(null);
      setResults(null);
    }
  };

  const handleDownloadTemplate = () => {
    const headerRow = VALID_HEADERS.join(',') + '\n';
    const sampleRow = '123456789,JUAN PEREZ,TI,ANALISTA TI,10987654,PLANTA,ACTIVO,BOGOTA,TEUSAQUILLO,01/01/2024,15/05/1990,MASCULINO,CALLE 123 # 45-67,SANITAS,PORVENIR,POSITIVA,3001234567,juan.perez@email.com,MARIA PEREZ,3009876543,0,,,,,juan.perez@renovar.com\n';
    
    const blob = new Blob([headerRow + sampleRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_carga_masiva_empleados.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Plantilla CSV descargada exitosamente');
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Selecciona un archivo CSV antes de enviar');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setResults(null);

    try {
      const response = await bulkUpdateEmployees(file);
      setResults(response);
      toast.success(`Carga completada: ${response.created} creados, ${response.updated} actualizados`);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error al procesar carga masiva:', err);
      const errMsg = err.message || 'Error al procesar el archivo CSV';
      setUploadError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResults(null);
    setUploadError(null);
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Carga Masiva de Empleados (CSV)"
      subtitle="Crea o actualiza datos de empleados parcialmente mediante archivo CSV"
      maxWidth="max-w-3xl"
    >
      <div className="space-[#5] space-y-6">
        {/* Alertas e Instrucciones */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800 space-y-2">
              <p className="font-semibold text-blue-900">
                Instrucciones y Condiciones de la Carga Masiva:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>
                  <strong className="text-blue-900">Cédula requerida:</strong> Toda fila debe contener la columna <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-mono">cedula</code>.
                </li>
                <li>
                  <strong className="text-blue-900">Actualización parcial:</strong> Solo incluye las columnas que desees modificar. Las celdas/columnas vacías se ignoran y conservan los datos actuales.
                </li>
                <li>
                  <strong className="text-blue-900">Formato de fechas:</strong> Usar <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-mono">DD/MM/YYYY</code> o <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-mono">YYYY-MM-DD</code> (ej: 01/01/2024).
                </li>
                <li>
                  <strong className="text-blue-900">Formato del archivo:</strong> Debe ser un archivo <strong>.csv</strong> delimitado por comas (<code className="bg-blue-100 px-1 py-0.5 rounded font-bold font-mono">,</code>).
                </li>
                <li>
                  <strong className="text-blue-900">Limpieza automática:</strong> El servidor convierte textos a mayúsculas y quita espacios innecesarios.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botón Descargar Plantilla */}
        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div>
            <h4 className="text-sm font-semibold text-gray-800">Plantilla Oficial de Columnas</h4>
            <p className="text-xs text-gray-500">Descarga el formato CSV con los nombres exactos de encabezados válidos.</p>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
          >
            <Download className="h-4 w-4 text-blue-600" />
            Descargar Plantilla CSV
          </button>
        </div>

        {/* Selección / Arrastre de Archivo */}
        {!results && (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              file ? 'border-green-400 bg-green-50/50' : 'border-gray-300 hover:border-blue-400 bg-gray-50/30'
            }`}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csvFileInput"
              disabled={isUploading}
            />

            {file ? (
              <div className="flex flex-col items-center">
                <FileSpreadsheet className="h-12 w-12 text-green-600 mb-2" />
                <p className="font-semibold text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <div className="flex gap-3 mt-4">
                  <label
                    htmlFor="csvFileInput"
                    className="cursor-pointer text-xs text-blue-600 hover:underline font-medium"
                  >
                    Cambiar archivo
                  </label>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-red-600 hover:underline font-medium"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <label htmlFor="csvFileInput" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="h-12 w-12 text-gray-400 mb-2 hover:text-blue-600 transition-colors" />
                <p className="text-sm font-semibold text-gray-700">
                  Haz clic para seleccionar o arrastra aquí tu archivo <span className="text-blue-600">.CSV</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Archivo delimitado por comas (máx. 10 MB)
                </p>
              </label>
            )}
          </div>
        )}

        {/* Mensaje de Error de Carga */}
        {uploadError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Error al procesar la carga:</p>
              <p className="text-xs text-red-700 mt-1">{uploadError}</p>
            </div>
          </div>
        )}

        {/* Resumen de Resultados */}
        {results && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h4 className="font-semibold text-emerald-900 text-sm">
                  Carga Masiva Procesada Exitosamente
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                  <p className="text-2xl font-bold text-green-600">{results.created || 0}</p>
                  <p className="text-xs text-gray-600 font-medium mt-1">Creados</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                  <p className="text-2xl font-bold text-blue-600">{results.updated || 0}</p>
                  <p className="text-xs text-gray-600 font-medium mt-1">Actualizados</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                  <p className="text-2xl font-bold text-gray-700">{results.total || 0}</p>
                  <p className="text-xs text-gray-600 font-medium mt-1">Total Filas</p>
                </div>
              </div>
            </div>

            {/* Lista de Errores / Advertencias por Fila */}
            {results.errors && results.errors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <h5 className="font-semibold text-amber-900 text-sm">
                    Observaciones / Errores en Filas ({results.errors.length}):
                  </h5>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 text-xs text-amber-800 bg-amber-100/50 p-3 rounded border border-amber-200 font-mono">
                  {results.errors.map((err, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span className="font-bold">•</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Acciones Modal */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          {results ? (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Cargar Otro Archivo
              </button>
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cerrar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleModalClose}
                disabled={isUploading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando CSV...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    Procesar y Cargar CSV
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </ModernModal>
  );
};

export default BulkUpdateCSVModal;
