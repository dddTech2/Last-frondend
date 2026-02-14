import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadDocument } from '../../services/ragService';
import { toast } from 'sonner';

const DocumentUpload = ({ onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [category, setCategory] = useState('General');

  const onDrop = useCallback((acceptedFiles) => {
    setFiles((prev) => [...prev, ...acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }))]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    }
  });

  const removeFile = (name) => {
    setFiles(files.filter(f => f.name !== name));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);
    let successCount = 0;
    let failCount = 0;

    // Simulate progress since fetch doesn't support it natively easily
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 500);

    try {
      for (const file of files) {
        try {
          await uploadDocument(file, { category });
          successCount++;
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          failCount++;
          toast.error(`Error al subir ${file.name}`);
        }
      }

      clearInterval(interval);
      setProgress(100);

      if (successCount > 0) {
        toast.success(`${successCount} documentos subidos correctamente`);
        setFiles([]); // Clear files on success
        if (onUploadSuccess) onUploadSuccess();
      }
      
      if (failCount > 0) {
        toast.warning(`${failCount} documentos fallaron al subir`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error general en la carga');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <UploadCloud className="h-5 w-5 text-indigo-600" />
        Subir Documentos
      </h3>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
          ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className={`h-12 w-12 mx-auto mb-4 ${isDragActive ? 'text-indigo-600' : 'text-gray-400'}`} />
        {isDragActive ? (
          <p className="text-indigo-600 font-medium">Suelta los archivos aquí...</p>
        ) : (
          <div>
            <p className="text-gray-700 font-medium">Arrastra archivos aquí o haz clic para seleccionar</p>
            <p className="text-sm text-gray-500 mt-2">Soporta PDF, DOCX, TXT</p>
          </div>
        )}
      </div>

      {/* Options */}
      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="General">General</option>
                <option value="Legal">Legal</option>
                <option value="Manuales">Manuales</option>
                <option value="Políticas">Políticas</option>
                <option value="Financiero">Financiero</option>
              </select>
            </div>
            
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Subiendo... {progress}%
                </>
              ) : (
                <>
                  <UploadCloud className="-ml-1 mr-2 h-4 w-4" />
                  Subir {files.length} archivos
                </>
              )}
            </button>
          </div>

          {/* File List */}
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {files.map((file) => (
              <li key={file.name} className="px-4 py-3 flex items-center justify-between bg-gray-50">
                <div className="flex items-center overflow-hidden">
                  <File className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                {!uploading && (
                  <button
                    onClick={() => removeFile(file.name)}
                    className="ml-4 text-gray-400 hover:text-red-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
