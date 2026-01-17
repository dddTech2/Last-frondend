import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, FileText, Save, Upload, Plus, Trash2, Edit2, 
  CheckCircle2, AlertCircle, X, ChevronRight, Loader2, Eye, Download
} from 'lucide-react';
import { toast } from 'sonner';
import FormField from './FormField';
import { 
  getCommunicationTemplates, 
  getCommunicationTemplate,
  updateCommunicationTemplate, 
  uploadCommunicationTemplateFile,
  getCommunicationTemplateFields,
  addCommunicationTemplateField,
  updateCommunicationTemplateField,
  deleteCommunicationTemplateField,
  getAvailableVariables,
  getCommunicationTemplateFile
} from '../services/api';

const UpdateCommunicationTab = () => {
  // State for template selection
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State for editing
  const [loading, setLoading] = useState(false);
  const [templateData, setTemplateData] = useState(null);
  const [fields, setFields] = useState([]);
  
  // File upload state
  const [newFile, setNewFile] = useState(null);
  const fileInputRef = useRef(null);

  // Preview state
  const [previewFile, setPreviewFile] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Field management state
  const [availableVars, setAvailableVars] = useState([]);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null); // null = creating new
  const [fieldForm, setFieldForm] = useState({
    field_name: '',
    field_label: '',
    field_type: 'TEXT',
    is_required: true,
    system_field: ''
  });

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
    loadAvailableVariables();
  }, []);

  // Load template details when selected
  useEffect(() => {
    if (selectedTemplateId) {
      loadTemplateDetails(selectedTemplateId);
    } else {
      setTemplateData(null);
      setFields([]);
      setNewFile(null);
    }
  }, [selectedTemplateId]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      // Fetch all templates (adjust status filter if needed)
      const data = await getCommunicationTemplates('APPROVED'); 
      // Also maybe fetch DRAFT or others? The API generic getTemplates might be better if we want everything
      // But based on API.js, getCommunicationTemplates takes statusFilter.
      // Let's assume we want to edit existing templates in the system.
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Error al cargar las plantillas');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadAvailableVariables = async () => {
    try {
      const vars = await getAvailableVariables();
      setAvailableVars(vars || []);
    } catch (error) {
      console.error('Error loading available variables:', error);
    }
  };

  const loadTemplateDetails = async (id) => {
    setLoading(true);
    setPreviewFile(null);
    try {
      const [details, fieldsData] = await Promise.all([
        getCommunicationTemplate(id),
        getCommunicationTemplateFields(id)
      ]);
      setTemplateData(details);
      setFields(fieldsData);
      
      // Load preview file
      if (details?.template_file_path) {
        loadPreviewFile(details.template_file_path);
      }
    } catch (error) {
      console.error('Error loading template details:', error);
      toast.error('Error al cargar los detalles de la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const loadPreviewFile = async (filePath) => {
    setLoadingPreview(true);
    try {
      const fileData = await getCommunicationTemplateFile(filePath);
      setPreviewFile(fileData);
    } catch (error) {
      console.error('Error loading preview file:', error);
      toast.error('Error al cargar el archivo de vista previa');
    } finally {
      setLoadingPreview(false);
    }
  };

  // --- Handlers for Basic Data ---

  const handleBasicDataUpdate = async () => {
    if (!templateData) return;
    
    setLoading(true);
    try {
      const payload = {
        name: templateData.name,
        description: templateData.description,
        status: templateData.status
      };

      // If file changed
      if (newFile) {
        const uploadResponse = await uploadCommunicationTemplateFile(newFile);
        payload.new_template_file_path = uploadResponse.file_path;
        payload.change_description = `Actualización de archivo: ${newFile.name}`;
      }

      await updateCommunicationTemplate(templateData.id, payload);
      toast.success('Plantilla actualizada correctamente');
      setNewFile(null);
      
      // Reload details to confirm changes
      loadTemplateDetails(templateData.id);
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Error al actualizar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.docx')) {
      setNewFile(file);
    } else {
      toast.error('Por favor selecciona un archivo .docx válido');
    }
  };

  const handleDownloadTemplate = () => {
    if (!previewFile?.url) {
      toast.error('No hay archivo disponible para descargar');
      return;
    }
    
    const link = document.createElement('a');
    link.href = previewFile.url;
    link.download = templateData?.name ? `${templateData.name}.docx` : 'plantilla.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Descarga iniciada');
  };

  // --- Handlers for Fields ---

  const openFieldModal = (field = null) => {
    if (field) {
      setEditingField(field);
      setFieldForm({
        field_name: field.field_name,
        field_label: field.field_label,
        field_type: field.field_type,
        is_required: field.is_required,
        system_field: field.system_field || ''
      });
    } else {
      setEditingField(null);
      setFieldForm({
        field_name: '',
        field_label: '',
        field_type: 'TEXT',
        is_required: true,
        system_field: ''
      });
    }
    setIsFieldModalOpen(true);
  };

  const handleFieldSave = async () => {
    if (!fieldForm.field_name || !fieldForm.field_label) {
      toast.error('Nombre y Etiqueta son obligatorios');
      return;
    }

    setLoading(true);
    try {
      if (editingField) {
        // Update existing
        await updateCommunicationTemplateField(editingField.id, {
          field_label: fieldForm.field_label,
          is_required: fieldForm.is_required
          // field_name usually cannot be changed easily without breaking things, guide says only label/required
        });
        toast.success('Campo actualizado');
      } else {
        // Create new
        await addCommunicationTemplateField(templateData.id, fieldForm);
        toast.success('Campo agregado');
      }
      setIsFieldModalOpen(false);
      loadTemplateDetails(templateData.id); // Refresh fields
    } catch (error) {
      console.error('Error saving field:', error);
      toast.error('Error al guardar el campo');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (!window.confirm('¿Estás seguro de eliminar este campo?')) return;
    
    setLoading(true);
    try {
      await deleteCommunicationTemplateField(fieldId);
      toast.success('Campo eliminado');
      loadTemplateDetails(templateData.id); // Refresh fields
    } catch (error) {
      console.error('Error deleting field:', error);
      toast.error('Error al eliminar el campo');
    } finally {
      setLoading(false);
    }
  };

  // Filter templates for search
  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Preview Modal Component
  const PreviewModal = () => {
    if (!showPreviewModal || !previewFile) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-800">{templateData?.name}</h3>
              <p className="text-sm text-gray-600 mt-1">MIME: {previewFile.mimeType}</p>
            </div>
            <button 
              onClick={() => setShowPreviewModal(false)} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-6 bg-gray-50">
            {previewFile.mimeType?.startsWith('image/') ? (
              <div className="flex items-center justify-center">
                <img 
                  src={previewFile.url} 
                  alt="Preview" 
                  className="max-w-full h-auto rounded shadow-lg"
                />
              </div>
            ) : previewFile.mimeType === 'application/pdf' ? (
              <iframe 
                src={previewFile.url} 
                className="w-full h-full min-h-[600px] border-0 rounded shadow-lg"
                title="PDF Preview"
              />
            ) : previewFile.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? (
              <div className="bg-white p-8 rounded shadow-lg">
                <p className="text-center text-gray-600">
                  Vista previa de archivos .docx no disponible en el navegador.
                </p>
                <p className="text-center text-sm text-gray-500 mt-2">
                  Descarga el archivo para visualizarlo.
                </p>
              </div>
            ) : previewFile.mimeType?.startsWith('text/') ? (
              <div className="bg-white p-8 rounded shadow-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-800">
                  {previewFile.text || previewFile.url}
                </pre>
              </div>
            ) : (
              <div className="bg-white p-8 rounded shadow-lg text-center">
                <p className="text-gray-600">Vista previa no disponible para este tipo de archivo</p>
                <p className="text-sm text-gray-500 mt-2">Tipo: {previewFile.mimeType || 'desconocido'}</p>
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button 
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar
            </button>
            <button 
              onClick={() => setShowPreviewModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 1. Template Selection */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />
          Seleccionar Plantilla
        </h2>
        
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              value={selectedTemplateId || ''}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              disabled={loadingTemplates}
            >
              <option value="">-- Selecciona una plantilla --</option>
              {filteredTemplates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.channel_type || 'DOC'})
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={loadTemplates}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="Recargar lista"
          >
            <Loader2 className={`h-5 w-5 ${loadingTemplates ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Editing Area */}
      {selectedTemplateId && templateData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
          
          {/* Left Column: Metadata & File */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Datos Básicos
              </h3>
              
              <div className="space-y-4">
                <FormField 
                  label="Nombre"
                  value={templateData.name}
                  onChange={(e) => setTemplateData({...templateData, name: e.target.value})}
                />
                
                <FormField 
                  label="Descripción"
                  type="textarea"
                  value={templateData.description || ''}
                  onChange={(e) => setTemplateData({...templateData, description: e.target.value})}
                />

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    value={templateData.status}
                    onChange={(e) => setTemplateData({...templateData, status: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                    <option value="DRAFT">Borrador</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Archivo Plantilla (.docx)</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 truncate text-sm text-gray-500 bg-gray-50 p-2 rounded border border-gray-200">
                      {newFile ? newFile.name : (templateData.template_file_path?.split('/').pop() || 'Archivo actual')}
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Reemplazar archivo"
                    >
                      <Upload className="h-4 w-4" />
                    </button>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".docx"
                    onChange={handleFileChange} 
                  />
                  {newFile && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Archivo listo para subir
                    </p>
                  )}
                  
                  {/* Preview and Download Buttons */}
                  {previewFile && !newFile && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setShowPreviewModal(true)}
                        disabled={loadingPreview}
                        className="flex-1 flex items-center justify-center gap-2 bg-purple-50 text-purple-700 py-2 px-3 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Plantilla
                      </button>
                      <button
                        onClick={handleDownloadTemplate}
                        disabled={loadingPreview}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-700 py-2 px-3 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        <Download className="h-4 w-4" />
                        Descargar
                      </button>
                    </div>
                  )}
                  
                  {loadingPreview && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando vista previa...
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleBasicDataUpdate}
                  disabled={loading}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Fields Management */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4 text-blue-600" />
                  Variables de la Plantilla
                </h3>
                <button 
                  onClick={() => openFieldModal()}
                  className="flex items-center gap-1 text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Variable
                </button>
              </div>

              {fields.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12">
                  <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
                  <p>No hay variables configuradas</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[600px]">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-semibold sticky top-0">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Variable</th>
                        <th className="px-4 py-3">Etiqueta</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3">Obligatorio</th>
                        <th className="px-4 py-3 text-right rounded-tr-lg">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {fields.map((field) => (
                        <tr key={field.id} className="hover:bg-gray-50 group">
                          <td className="px-4 py-3 font-mono text-blue-600">{field.field_name}</td>
                          <td className="px-4 py-3 text-gray-900">{field.field_label}</td>
                          <td className="px-4 py-3 text-gray-500">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                              {field.field_type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {field.is_required ? (
                              <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">Sí</span>
                            ) : (
                              <span className="text-gray-400 text-xs">No</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => openFieldModal(field)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Editar"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteField(field.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
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
      )}

      {/* Field Modal */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800">
                {editingField ? 'Editar Variable' : 'Nueva Variable'}
              </h3>
              <button onClick={() => setIsFieldModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {!editingField ? (
                // Creating new: Show autocomplete for field_name
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Nombre de Variable (Técnico)</label>
                  <input
                    type="text"
                    list="available-vars"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: saldo_capital"
                    value={fieldForm.field_name}
                    onChange={(e) => setFieldForm({...fieldForm, field_name: e.target.value})}
                  />
                  <datalist id="available-vars">
                    {availableVars.map((v, i) => (
                      <option key={i} value={v} />
                    ))}
                  </datalist>
                  <p className="text-xs text-gray-500">Debe coincidir con la variable en el Word, ej: {'{{variable}}'}</p>
                </div>
              ) : (
                // Editing: Show field name as read-only
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Variable</label>
                  <div className="p-2 bg-gray-100 text-gray-600 rounded-lg font-mono text-sm">
                    {fieldForm.field_name}
                  </div>
                </div>
              )}

              <FormField 
                label="Etiqueta (Visible)"
                placeholder="Ej: Saldo Capital"
                value={fieldForm.field_label}
                onChange={(e) => setFieldForm({...fieldForm, field_label: e.target.value})}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    value={fieldForm.field_type}
                    onChange={(e) => setFieldForm({...fieldForm, field_type: e.target.value})}
                  >
                    <option value="TEXT">Texto</option>
                    <option value="NUMBER">Número</option>
                    <option value="DATE">Fecha</option>
                    <option value="SYSTEM_DATA">Sistema</option>
                  </select>
                </div>

                <div className="space-y-1 flex flex-col justify-end pb-2">
                   <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={fieldForm.is_required}
                      onChange={(e) => setFieldForm({...fieldForm, is_required: e.target.checked})}
                    />
                    <span className="text-sm text-gray-700">Obligatorio</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsFieldModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={handleFieldSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal />
    </div>
  );
};

// Icon helper
const SettingsIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default UpdateCommunicationTab;
