import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, FileText, Save, Upload, Plus, Trash2, Edit2, 
  CheckCircle2, AlertCircle, X, ChevronRight, Loader2, Eye, Download,
  Sparkles, Database, Code, Info
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

const inferVariableType = (name) => {
  const lower = (name || '').toLowerCase();
  if (lower.startsWith('fecha_') || lower.endsWith('_fecha') || lower.includes('date') || lower.includes('fecha')) return 'DATE';
  if (lower.startsWith('saldo_') || lower.startsWith('valor_') || lower.startsWith('dias_') || lower.startsWith('cantidad_') || lower.includes('monto') || lower.includes('porcentaje') || lower.includes('capital') || lower.includes('cuota') || lower.includes('total')) return 'NUMBER';
  if (lower.startsWith('es_') || lower.startsWith('tiene_') || lower.startsWith('is_')) return 'SYSTEM_DATA';
  return 'TEXT';
};

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
  const [variableMode, setVariableMode] = useState('SYSTEM'); // 'SYSTEM' | 'CUSTOM'
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
      const data = await getCommunicationTemplates('APPROVED'); 
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
      const response = await getAvailableVariables();
      const varsArray = Array.isArray(response) ? response : (response?.data || []);
      
      const formatted = varsArray.map((item) => {
        let cleanName = '';
        let description = '';
        
        if (typeof item === 'string') {
          cleanName = item.replace(/[{}]/g, '').trim();
        } else if (item && typeof item === 'object') {
          cleanName = (item.variable_name || item.name || '').replace(/[{}]/g, '').trim();
          description = item.description || '';
        }

        const label = cleanName
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

        return {
          name: cleanName,
          label: label,
          description: description,
          suggestedType: inferVariableType(cleanName)
        };
      }).filter((v) => Boolean(v.name));

      // Ordenar alfabéticamente
      formatted.sort((a, b) => a.name.localeCompare(b.name));
      setAvailableVars(formatted);
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
      setFields(fieldsData || []);
      
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
      setVariableMode('CUSTOM');
    } else {
      setEditingField(null);
      setFieldForm({
        field_name: '',
        field_label: '',
        field_type: 'TEXT',
        is_required: true,
        system_field: ''
      });
      setVariableMode('SYSTEM');
    }
    setIsFieldModalOpen(true);
  };

  // Al seleccionar una variable del sistema en el modal
  const handleSelectSystemVar = (varName) => {
    const found = availableVars.find((v) => v.name === varName);
    if (found) {
      setFieldForm((prev) => ({
        ...prev,
        field_name: found.name,
        field_label: prev.field_label && prev.field_label !== prev.field_name ? prev.field_label : found.label,
        field_type: found.suggestedType || 'SYSTEM_DATA',
      }));
    } else {
      setFieldForm((prev) => ({
        ...prev,
        field_name: varName,
      }));
    }
  };

  const handleFieldSave = async () => {
    const cleanName = (fieldForm.field_name || '').replace(/[{}]/g, '').trim();
    if (!cleanName || !fieldForm.field_label) {
      toast.error('Nombre y Etiqueta son obligatorios');
      return;
    }

    setLoading(true);
    try {
      if (editingField) {
        // Update existing
        await updateCommunicationTemplateField(editingField.id, {
          field_label: fieldForm.field_label,
          field_type: fieldForm.field_type,
          is_required: fieldForm.is_required
        });
        toast.success('Campo actualizado');
      } else {
        // Create new
        await addCommunicationTemplateField(templateData.id, {
          ...fieldForm,
          field_name: cleanName,
        });
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

  // Selected variable information
  const selectedVarInfo = availableVars.find(v => v.name === fieldForm.field_name);

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
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => setShowPreviewModal(true)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        <Eye className="h-4 w-4" />
                        Vista Previa
                      </button>
                      <button
                        onClick={handleDownloadTemplate}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <Download className="h-4 w-4" />
                        Descargar
                      </button>
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
                <div>
                  <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                    <SettingsIcon className="h-4 w-4 text-blue-600" />
                    Variables de la Plantilla
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Variables dinámicas que se reemplazan en el documento Word ({'{{variable}}'})
                  </p>
                </div>
                <button 
                  onClick={() => openFieldModal()}
                  className="flex items-center gap-1.5 text-sm bg-blue-600 text-white font-medium px-3.5 py-1.5 rounded-lg hover:bg-blue-700 shadow-sm transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Variable
                </button>
              </div>

              {fields.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12">
                  <AlertCircle className="h-10 w-10 mb-2 opacity-50 text-gray-400" />
                  <p className="font-medium text-gray-600">No hay variables configuradas</p>
                  <p className="text-xs text-gray-400 mt-1">Haz clic en "Nueva Variable" para vincular campos del sistema</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[600px]">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-semibold sticky top-0">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Variable</th>
                        <th className="px-4 py-3">Etiqueta Visible</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3">Obligatorio</th>
                        <th className="px-4 py-3 text-right rounded-tr-lg">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {fields.map((field) => (
                        <tr key={field.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {`{{${field.field_name}}}`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-900 font-medium">{field.field_label}</td>
                          <td className="px-4 py-3 text-gray-500">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                              {field.field_type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {field.is_required ? (
                              <span className="text-emerald-700 text-xs font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                Requerido
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Opcional</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => openFieldModal(field)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Editar Variable"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteField(field.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Eliminar Variable"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">
                  {editingField ? 'Editar Variable de Plantilla' : 'Nueva Variable de Plantilla'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingField ? 'Modifica la etiqueta y tipo de la variable' : 'Selecciona una variable del sistema o ingresa una personalizada'}
                </p>
              </div>
              <button onClick={() => setIsFieldModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {!editingField ? (
                <>
                  {/* Selector de Modo: Variable del Sistema vs Personalizada */}
                  <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setVariableMode('SYSTEM')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        variableMode === 'SYSTEM'
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Database className="w-3.5 h-3.5" />
                      Variable del Sistema ({availableVars.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVariableMode('CUSTOM')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        variableMode === 'CUSTOM'
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      Variable Personalizada / Manual
                    </button>
                  </div>

                  {variableMode === 'SYSTEM' ? (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Seleccionar Variable del Sistema *
                      </label>
                      <select
                        className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={fieldForm.field_name}
                        onChange={(e) => handleSelectSystemVar(e.target.value)}
                      >
                        <option value="">-- Elige un campo disponible --</option>
                        {availableVars.map((v) => (
                          <option key={v.name} value={v.name}>
                            {v.name} {v.description ? `— ${v.description}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Nombre Técnico de la Variable *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          list="available-vars-datalist"
                          className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ej: saldo_capital o fecha_limite"
                          value={fieldForm.field_name}
                          onChange={(e) => handleSelectSystemVar(e.target.value)}
                        />
                        <datalist id="available-vars-datalist">
                          {availableVars.map((v) => (
                            <option key={v.name} value={v.name}>
                              {v.label} {v.description ? `(${v.description})` : ''}
                            </option>
                          ))}
                        </datalist>
                      </div>
                    </div>
                  )}

                  {/* Informacion de la variable seleccionada */}
                  {fieldForm.field_name && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-blue-900 flex items-center gap-2">
                          <span>Tag en plantilla:</span>
                          <code className="bg-white px-2 py-0.5 rounded text-blue-700 font-bold border border-blue-200">
                            {`{{${fieldForm.field_name}}}`}
                          </code>
                        </div>
                        {selectedVarInfo?.description && (
                          <p className="text-blue-800/80 mt-1 leading-relaxed">
                            {selectedVarInfo.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Editing: Show field name as read-only badge
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Variable Técnica
                  </label>
                  <div className="p-3 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-mono text-sm font-semibold flex items-center justify-between">
                    <span>{`{{${fieldForm.field_name}}}`}</span>
                    <span className="text-[11px] font-sans font-normal text-slate-500 bg-white px-2 py-0.5 rounded border">
                      Inmutable
                    </span>
                  </div>
                </div>
              )}

              {/* Etiqueta Visible */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Etiqueta Visible (Para formularios y vistas) *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Saldo de Capital"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                  value={fieldForm.field_label}
                  onChange={(e) => setFieldForm({...fieldForm, field_label: e.target.value})}
                />
              </div>

              {/* Tipo y Obligatorio */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Tipo de Dato</label>
                  <select
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                    value={fieldForm.field_type}
                    onChange={(e) => setFieldForm({...fieldForm, field_type: e.target.value})}
                  >
                    <option value="TEXT">Texto (TEXT)</option>
                    <option value="NUMBER">Número / Saldo (NUMBER)</option>
                    <option value="DATE">Fecha (DATE)</option>
                    <option value="SYSTEM_DATA">Dato del Sistema (SYSTEM_DATA)</option>
                  </select>
                </div>

                <div className="space-y-1 flex flex-col justify-end pb-2">
                  <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      checked={fieldForm.is_required}
                      onChange={(e) => setFieldForm({...fieldForm, is_required: e.target.checked})}
                    />
                    <span className="text-xs font-semibold text-slate-700">Campo Obligatorio</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200/70 rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleFieldSave}
                disabled={loading || !fieldForm.field_name || !fieldForm.field_label}
                className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar Variable
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
