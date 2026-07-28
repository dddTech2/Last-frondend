import React, { useState, useRef } from 'react';
import { Sliders, Info, Paperclip, UploadCloud, X, Link, CheckCircle2, Loader2, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { getSignedUploadUrl } from '../services/api';
import { toast } from 'sonner';

const READONLY_SYSTEM_VARS = [
  'nombre_cliente',
  'cedula',
  'cliente',
  'obligacion',
  'asesor',
  'nombre_gestor',
];

const MEDIA_VARS = ['document_link', 'document_filename', 'header_link'];

export const isVariableEditable = (varName) => {
  if (!varName) return false;
  const cleanName = varName.replace(/^SPECIAL:/i, '').toLowerCase();
  return !READONLY_SYSTEM_VARS.includes(cleanName);
};

export const formatVariableLabel = (varName) => {
  if (!varName) return '';
  let isSpecial = false;
  let raw = varName;
  if (varName.toUpperCase().startsWith('SPECIAL:')) {
    isSpecial = true;
    raw = varName.substring(8);
  }
  const formatted = raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return isSpecial ? `${formatted} (Especial)` : formatted;
};

const TemplateVariableForm = ({
  template = null,
  detectedVariables = [],
  formValues = {},
  onChange,
  disabled = false,
}) => {
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Extraer el formato de header de cualquier estructura devuelta por la API
  let headerFormat = '';
  if (template?.components?.header?.format) {
    headerFormat = template.components.header.format;
  } else if (Array.isArray(template?.components)) {
    const headerComp = template.components.find(
      (c) => (c.type || c.component_type || '').toUpperCase() === 'HEADER'
    );
    if (headerComp?.format) {
      headerFormat = headerComp.format;
    }
  } else if (template?.header_format) {
    headerFormat = template.header_format;
  } else if (template?.header?.format) {
    headerFormat = template.header.format;
  } else if (template?.format) {
    headerFormat = template.format;
  }

  headerFormat = (headerFormat || '').toUpperCase();

  const hasMediaHeader = ['DOCUMENT', 'IMAGE', 'VIDEO'].includes(headerFormat);

  const hasAttachmentVars = detectedVariables.some((v) =>
    MEDIA_VARS.includes(v.toLowerCase())
  );

  const isMediaTemplate = hasMediaHeader || hasAttachmentVars;

  // Filtrar variables de texto
  const regularEditableVars = detectedVariables.filter(
    (v) => isVariableEditable(v) && !MEDIA_VARS.includes(v.toLowerCase())
  );
  const readonlyVars = detectedVariables.filter((v) => !isVariableEditable(v));

  const currentDocumentLink = formValues.document_link || formValues.header_link || '';
  const currentDocumentFilename = formValues.document_filename || '';

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Solicitar URL firmada de subida a GCS
      const signedUrlRes = await getSignedUploadUrl(
        9999,
        file.type || 'application/octet-stream',
        file.name
      );

      const { signed_url, gcs_object_name, public_url, content_type } = signedUrlRes;

      // 2. Subir archivo a GCS vía PUT
      const uploadRes = await fetch(signed_url, {
        method: 'PUT',
        headers: { 'Content-Type': content_type || file.type || 'application/octet-stream' },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Error al cargar el archivo en el servidor de almacenamiento.');
      }

      // 3. Determinar la URL pública del archivo subido
      let fileUrl = public_url;
      if (!fileUrl && signed_url) {
        fileUrl = signed_url.split('?')[0];
      }
      if (!fileUrl && gcs_object_name) {
        fileUrl = `https://storage.googleapis.com/${gcs_object_name}`;
      }

      onChange('document_link', fileUrl);
      onChange('document_filename', file.name);
      toast.success(`Archivo "${file.name}" cargado correctamente`);
    } catch (err) {
      console.error('Error al subir adjunto:', err);
      const msg = err?.message || 'Error al subir el archivo adjunto';
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const removeAttachment = () => {
    onChange('document_link', '');
    onChange('document_filename', '');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Renderizar ícono y título específico para el formato
  const renderHeaderBadgeInfo = () => {
    switch (headerFormat) {
      case 'IMAGE':
        return {
          icon: <ImageIcon className="w-4 h-4 text-emerald-600" />,
          title: 'Imagen Adjunta para la Plantilla (Meta Header)',
          accept: 'image/jpeg,image/png',
          desc: 'Soporta archivos de imagen en formato JPG o PNG'
        };
      case 'VIDEO':
        return {
          icon: <Video className="w-4 h-4 text-purple-600" />,
          title: 'Video Adjunto para la Plantilla (Meta Header)',
          accept: 'video/mp4',
          desc: 'Soporta archivos de video en formato MP4'
        };
      case 'DOCUMENT':
      default:
        return {
          icon: <FileText className="w-4 h-4 text-blue-600" />,
          title: 'Documento Adjunto para la Plantilla (Meta Header)',
          accept: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          desc: 'Soporta documentos PDF, DOCX, XLSX, etc.'
        };
    }
  };

  const badgeInfo = renderHeaderBadgeInfo();

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-3 text-sm space-y-4">
      {/* SECCIÓN 1: ADJUNTO MULTIMEDIA (SI LA PLANTILLA ES DOCUMENT, IMAGE, VIDEO O TIENE VARIABLES DE ADJUNTO) */}
      {isMediaTemplate && (
        <div className="bg-white border border-blue-200 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-xs">
              {badgeInfo.icon}
              <span>{badgeInfo.title}</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              {headerFormat || 'MULTIMEDIA'}
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-3">
            {badgeInfo.desc}. Meta requiere enviar un archivo adjunto para esta plantilla.
          </p>

          {/* Selector de Modos: Subir Archivo vs URL Pública */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1.5 ${
                uploadMode === 'file'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Subir Archivo Local</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('url')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1.5 ${
                uploadMode === 'url'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              <span>Ingresar URL Pública</span>
            </button>
          </div>

          {/* VISTA 1: SUBIR ARCHIVO LOCAL (DRAG & DROP) */}
          {uploadMode === 'file' && (
            <div>
              {currentDocumentLink ? (
                <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200 rounded-lg p-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {currentDocumentFilename || 'Archivo Adjunto Cargado'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {currentDocumentLink}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    disabled={disabled || isUploading}
                    className="p-1 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition"
                    title="Eliminar adjunto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                  } ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={badgeInfo.accept}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={disabled || isUploading}
                  />

                  {isUploading ? (
                    <div className="flex items-center gap-2 text-blue-600 text-xs py-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Subiendo archivo a Google Cloud Storage...</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-6 h-6 text-blue-500" />
                      <p className="text-xs font-medium text-slate-700">
                        Arrastra el archivo aquí o <span className="text-blue-600 underline">haz clic para examinar</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {badgeInfo.desc}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VISTA 2: INGRESAR URL PÚBLICA */}
          {uploadMode === 'url' && (
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  URL pública del archivo (`document_link`)
                </label>
                <input
                  type="url"
                  disabled={disabled || isUploading}
                  value={currentDocumentLink}
                  onChange={(e) => onChange('document_link', e.target.value)}
                  placeholder="https://ejemplo.com/archivos/acuerdo_123.pdf"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Nombre visible del archivo (`document_filename`) - Opcional
                </label>
                <input
                  type="text"
                  disabled={disabled || isUploading}
                  value={currentDocumentFilename}
                  onChange={(e) => onChange('document_filename', e.target.value)}
                  placeholder="Acuerdo_de_Pago.pdf"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          {uploadError && (
            <p className="text-xs text-red-600 mt-2 font-medium">{uploadError}</p>
          )}
        </div>
      )}

      {/* SECCIÓN 2: VARIABLES DE TEXTO EDITABLES */}
      <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold">
        <Sliders className="w-4 h-4 text-blue-600" />
        <span>Variables Personalizadas de Texto (Opcional)</span>
      </div>

      {regularEditableVars.length === 0 ? (
        <p className="text-xs text-slate-500 italic">
          Esta plantilla no contiene variables de texto adicionales negociables.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 mb-2">
            Puedes ajustar manualmente los valores de las siguientes variables si deseas personalizar este envío:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {regularEditableVars.map((varName) => {
              const label = formatVariableLabel(varName);
              const val = formValues[varName] !== undefined ? formValues[varName] : '';

              return (
                <div key={varName} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-700 flex items-center justify-between">
                    <span>{label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{varName}</span>
                  </label>
                  <input
                    type="text"
                    disabled={disabled}
                    value={val}
                    onChange={(e) => onChange(varName, e.target.value)}
                    placeholder="Valor por defecto de BD"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {readonlyVars.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>
            Variables autocompletadas automáticamente por BD: {readonlyVars.map(formatVariableLabel).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};

export default TemplateVariableForm;
