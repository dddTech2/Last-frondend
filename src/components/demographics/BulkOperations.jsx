import React, { useState } from 'react';
import { Upload, Download, FileText, AlertCircle } from 'lucide-react';
import * as api from '../../services/api';
import { toast } from 'sonner';

const BulkOperations = () => {
  const [operation, setOperation] = useState('contacts-to-cedulas');
  const [selectedFile, setSelectedFile] = useState(null);
  const [channelType, setChannelType] = useState('WHATSAPP');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea CSV
      if (!file.name.endsWith('.csv')) {
        toast.error('Por favor selecciona un archivo CSV');
        return;
      }
      setSelectedFile(file);
      toast.success(`Archivo "${file.name}" seleccionado`);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo CSV');
      return;
    }

    setIsProcessing(true);

    try {
      let blob;
      let filename;

      if (operation === 'contacts-to-cedulas') {
        // Buscar cédulas a partir de contactos
        blob = await api.bulkSearchContacts(selectedFile);
        filename = 'cedulas_encontradas.csv';
        toast.success('Procesamiento completado. Descargando resultados...');
      } else {
        // Buscar contactos a partir de cédulas
        blob = await api.bulkGetActiveChannels(selectedFile, channelType);
        filename = `contactos_${channelType.toLowerCase()}.csv`;
        toast.success('Procesamiento completado. Descargando resultados...');
      }

      // Descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Limpiar el formulario
      setSelectedFile(null);
      document.getElementById('fileInput').value = '';
    } catch (error) {
      console.error('Error en procesamiento masivo:', error);
      toast.error(error.message || 'Error al procesar el archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    let csvContent;
    let filename;

    if (operation === 'contacts-to-cedulas') {
      csvContent = 'contact\n3001234567\ncliente@email.com\n3007654321';
      filename = 'plantilla_contactos.csv';
    } else {
      csvContent = 'cedula\n1234567890\n9876543210\n1122334455';
      filename = 'plantilla_cedulas.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success('Plantilla descargada');
  };

  return (
    <div className="space-y-6">
      {/* Selector de Operación */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Operación
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setOperation('contacts-to-cedulas')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              operation === 'contacts-to-cedulas'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <FileText className={`h-6 w-6 mt-1 ${operation === 'contacts-to-cedulas' ? 'text-blue-600' : 'text-gray-400'}`} />
              <div>
                <h3 className="font-semibold text-gray-900">Encontrar Cédulas</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Sube un CSV con teléfonos o emails para obtener las cédulas asociadas
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <strong>Entrada:</strong> contact (teléfono o email)
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setOperation('cedulas-to-contacts')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              operation === 'cedulas-to-contacts'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <FileText className={`h-6 w-6 mt-1 ${operation === 'cedulas-to-contacts' ? 'text-blue-600' : 'text-gray-400'}`} />
              <div>
                <h3 className="font-semibold text-gray-900">Encontrar Contactos</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Sube un CSV con cédulas para obtener los contactos activos por canal
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <strong>Entrada:</strong> cedula
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Selector de Canal (solo para cedulas-to-contacts) */}
      {operation === 'cedulas-to-contacts' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Canal a Consultar
          </label>
          <select
            value={channelType}
            onChange={(e) => setChannelType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="WHATSAPP">WhatsApp</option>
            <option value="SMS">SMS</option>
            <option value="EMAIL">Email</option>
            <option value="CALL">Llamadas</option>
          </select>
        </div>
      )}

      {/* Área de Carga de Archivo */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
        <div className="text-center">
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <div className="mb-4">
            <label
              htmlFor="fileInput"
              className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-5 w-5 mr-2" />
              Seleccionar Archivo CSV
            </label>
            <input
              id="fileInput"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          {selectedFile && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
              <FileText className="h-5 w-5" />
              <span className="font-medium">{selectedFile.name}</span>
            </div>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Formatos aceptados: .csv
          </p>
        </div>
      </div>

      {/* Información sobre el formato */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Formato del archivo CSV:</p>
            {operation === 'contacts-to-cedulas' ? (
              <ul className="list-disc list-inside space-y-1">
                <li>El archivo debe tener una columna llamada <code className="bg-blue-100 px-1 rounded">contact</code></li>
                <li>Puede contener teléfonos (ej: 3001234567) o emails (ej: cliente@email.com)</li>
                <li>Los números pueden estar con o sin prefijo 57</li>
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                <li>El archivo debe tener una columna llamada <code className="bg-blue-100 px-1 rounded">cedula</code></li>
                <li>Cada fila debe contener un número de cédula</li>
                <li>El resultado incluirá todos los contactos activos para el canal seleccionado</li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-3">
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <Download className="h-5 w-5" />
          Descargar Plantilla
        </button>
        <button
          onClick={handleProcess}
          disabled={!selectedFile || isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Procesando...
            </>
          ) : (
            <>
              <FileText className="h-5 w-5" />
              Procesar Archivo
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BulkOperations;
