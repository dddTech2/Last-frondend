import React, { useState, useRef } from 'react';
import { getSignedUploadUrl } from '../../../services/api';

const HeaderEditor = ({ template, setTemplate }) => {
  const header = template.components?.header || { format: 'NONE' };
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const setHeader = (newHeader) => {
    setTemplate(prev => ({
      ...prev,
      components: {
        ...prev.components,
        header: newHeader
      }
    }));
  };

  const handleFormatChange = (e) => {
    const format = e.target.value;
    setUploadStatus('idle');
    setSelectedFile(null);
    setError(null);
    if (format === 'NONE') {
      const newComponents = { ...template.components };
      delete newComponents.header;
      setTemplate(prev => ({ ...prev, components: newComponents }));
    } else {
      setHeader({ format });
    }
  };

  const MAX_FILE_SIZE_MB = 15;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`El archivo supera el límite de ${MAX_FILE_SIZE_MB} MB. Peso del archivo: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`);
      setUploadStatus('error');
      setSelectedFile(null);
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    handleUpload(file);
  };

  const handleUpload = async (file) => {
    if (!file) return;

    setUploadStatus('uploading');
    setError(null);

    try {
      // Paso 1: Obtener URL firmada
      const signedUrlResponse = await getSignedUploadUrl(
        9999, // conversation_id is fixed for template creation
        file.type,
        file.name
      );

      const { signed_url, gcs_object_name, content_type } = signedUrlResponse;

      // Paso 2: Subir archivo a GCS
      const uploadResponse = await fetch(signed_url, {
        method: 'PUT',
        headers: { 'Content-Type': content_type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Error al subir el archivo a GCS.');
      }

      // Paso 3: Actualizar estado de la plantilla
      const previewUrl = URL.createObjectURL(file);
      const newHeader = { ...header, gcs_object_name, localPreviewUrl: previewUrl };
      if (header.format === 'DOCUMENT' || header.format === 'VIDEO') {
        newHeader.file_name = file.name;
        newHeader.mime_type = file.type;
      }
      setHeader(newHeader);
      setUploadStatus('success');

    } catch (err) {
      console.error("Error en el proceso de subida:", err);
      setError(err.message || "Ocurrió un error desconocido.");
      setUploadStatus('error');
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="p-4 border rounded-md bg-white mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">Encabezado (Opcional)</label>
      <select
        className="w-full p-2 border rounded-md mb-2"
        value={header.format}
        onChange={handleFormatChange}
      >
        <option value="NONE">Sin Encabezado</option>
        <option value="TEXT">Texto</option>
        <option value="IMAGE">Imagen</option>
        <option value="DOCUMENT">Documento</option>
        <option value="VIDEO">Video</option>
      </select>

      {header.format === 'TEXT' && (
        <input
          type="text"
          className="w-full p-2 border rounded-md"
          placeholder="Texto del encabezado (máx 60 caracteres)"
          value={header.text || ''}
          onChange={(e) => setHeader({ ...header, text: e.target.value })}
          maxLength="60"
        />
      )}
      {['IMAGE', 'DOCUMENT', 'VIDEO'].includes(header.format) && (
        <div className="mt-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={header.format === 'IMAGE' ? 'image/*' : (header.format === 'VIDEO' ? 'video/*' : '.pdf')}
          />
          <button
            type="button"
            onClick={triggerFileSelect}
            disabled={uploadStatus === 'uploading'}
            className="w-full p-2 border rounded-md bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300"
          >
            {uploadStatus === 'uploading' ? 'Subiendo...' : 'Seleccionar Archivo'}
          </button>
          
          {uploadStatus === 'success' && (
            <p className="text-green-600 text-xs mt-1">
              Archivo subido: {selectedFile.name}
            </p>
          )}
          {uploadStatus === 'error' && (
            <p className="text-red-600 text-xs mt-1">
              Error: {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default HeaderEditor;
