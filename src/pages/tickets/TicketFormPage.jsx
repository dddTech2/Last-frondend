import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../services/api";
import { toast } from "sonner";
import { Bug, Star, UploadCloud, X, FileArchive, Loader2, ArrowLeft } from "lucide-react";
import { MODULE_OPTIONS, PRIORITY_OPTIONS } from "./ticketUtils";

const TicketFormPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "FALLA",
    module: "",
    priority: "MEDIA",
    description: "",
    expected_benefit: "",
  });

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const isFalla = formData.type === "FALLA";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    
    // Validar tipo de archivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'application/zip', 'application/x-zip-compressed'];
    const invalidFiles = newFiles.filter(f => !validTypes.includes(f.type) && !f.name.endsWith('.zip'));
    
    if (invalidFiles.length > 0) {
      toast.error(`Algunos archivos no son válidos. Solo imágenes y .zip permitidos.`);
    }

    const validFilesToAdd = newFiles.filter(f => validTypes.includes(f.type) || f.name.endsWith('.zip'));
    
    if (validFilesToAdd.length > 0) {
      setFiles(prev => [...prev, ...validFilesToAdd]);
      
      // Generate previews
      validFilesToAdd.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setPreviews(prev => [...prev, { name: file.name, url: e.target.result, isImage: true }]);
          };
          reader.readAsDataURL(file);
        } else {
          setPreviews(prev => [...prev, { name: file.name, url: null, isImage: false }]);
        }
      });
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, i) => i !== indexToRemove));
    setPreviews(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const isFormValid = () => {
    if (!formData.module) return false;
    if (formData.description.length < 10) return false;
    if (isFalla && files.length === 0) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("module", formData.module);
      fd.append("description", formData.description);
      fd.append("type", formData.type);
      fd.append("priority", formData.priority);
      
      if (!isFalla && formData.expected_benefit) {
        fd.append("expected_benefit", formData.expected_benefit);
      }

      files.forEach(file => {
        fd.append("files", file);
      });

      const res = await api.createTicket(fd);
      toast.success(`Ticket #${res.correlative_id} creado exitosamente`);
      navigate(`/tickets/${res.id}`);
    } catch (error) {
      toast.error(error.message || "Error al crear ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center">
        <button onClick={() => navigate("/tickets")} className="mr-4 text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nuevo Ticket</h1>
          <p className="text-sm text-gray-500">Completa los datos para reportar una falla o sugerir una mejora</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          {/* Tipo de Ticket Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Ticket</label>
            <div className="flex bg-gray-100 p-1 rounded-lg w-full max-w-md">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "FALLA" })}
                className={`flex-1 flex justify-center items-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${isFalla ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Bug className="w-4 h-4 mr-2" />
                Falla
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "SOLICITUD_MEJORA" })}
                className={`flex-1 flex justify-center items-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${!isFalla ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Star className="w-4 h-4 mr-2" />
                Mejora
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Módulo Afectado <span className="text-red-500">*</span></label>
              <select
                name="module"
                value={formData.module}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              >
                <option value="" disabled>Selecciona un módulo...</option>
                {MODULE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad Sugerida</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              >
                {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-red-500">*</span></label>
            <p className="text-xs text-gray-500 mb-2">Describe detalladamente {isFalla ? 'la falla' : 'la mejora'}. ¿Qué esperabas que pasara y qué pasó realmente?</p>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              minLength={10}
              maxLength={5000}
              rows={5}
              placeholder={isFalla ? "Ej. Al presionar el botón de enviar campaña..." : "Ej. Sería muy útil poder filtrar por..."}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            ></textarea>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span className={formData.description.length < 10 ? 'text-red-500' : ''}>
                Mínimo 10 caracteres
              </span>
              <span>{formData.description.length} / 5000</span>
            </div>
          </div>

          {!isFalla && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beneficio Esperado</label>
              <p className="text-xs text-gray-500 mb-2">¿Cómo ayudará esta mejora al equipo o al negocio?</p>
              <textarea
                name="expected_benefit"
                value={formData.expected_benefit}
                onChange={handleInputChange}
                maxLength={2000}
                rows={3}
                placeholder="Ej. Reducirá el tiempo de revisión en un 20%..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
              ></textarea>
              <div className="text-right mt-1 text-xs text-gray-500">
                <span>{formData.expected_benefit.length} / 2000</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Archivos Adjuntos {isFalla && <span className="text-red-500">* (Requerido para fallas)</span>}
            </label>
            <p className="text-xs text-gray-500 mb-2">Imágenes (PNG, JPG, WEBP) o archivos ZIP. {isFalla && "Por favor adjunta capturas de pantalla de la falla."}</p>
            
            <div 
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer ${isFalla && files.length === 0 ? 'border-red-300' : 'border-gray-300'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">Haz clic para buscar archivos o arrástralos aquí</p>
              <p className="text-xs text-gray-500 mt-1">Soporta múltiples archivos</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                multiple 
                accept="image/png, image/jpeg, image/gif, image/webp, application/zip, .zip" 
              />
            </div>

            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previews.map((file, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white p-2">
                    {file.isImage ? (
                      <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden flex items-center justify-center">
                        <img src={file.url} alt={file.name} className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-100 rounded-md mb-2 flex flex-col items-center justify-center text-gray-500">
                        <FileArchive className="w-8 h-8 mb-1 text-blue-500" />
                        <span className="text-[10px] font-medium uppercase">ZIP</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-600 truncate px-1" title={file.name}>{file.name}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creando...</>
              ) : (
                'Crear Ticket'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketFormPage;
