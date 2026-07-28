import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Settings, Save, CheckCircle2, AlertCircle, PlusCircle, PenSquare } from 'lucide-react';
import * as mammoth from 'mammoth';
import { toast } from 'sonner';
import FormField from '../components/FormField';
import UpdateCommunicationTab from '../components/UpdateCommunicationTab';
import { 
  createCommunicationTemplate, 
  uploadCommunicationTemplateFile, 
  addCommunicationTemplateField,
  getAvailableVariables 
} from '../services/api';

const CommunicationBuilderPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Constructor de Comunicaciones</h1>
            <p className="text-gray-500 text-sm">Gestiona tus plantillas de documentos</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('create')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'create'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <PlusCircle className="h-4 w-4" />
            Crear Nueva
          </button>
          <button
            onClick={() => setActiveTab('update')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'update'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <PenSquare className="h-4 w-4" />
            Actualizar Existente
          </button>
        </nav>
      </div>

      <div className="max-w-5xl mx-auto">
        {activeTab === 'create' ? <CreateCommunicationWizard /> : <UpdateCommunicationTab />}
      </div>
    </div>
  );
};

const CreateCommunicationWizard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Estados del proceso
  const [step, setStep] = useState(1); // 1: Upload, 2: Config, 3: Review
  const [loading, setLoading] = useState(false);
  
  // Datos de la comunicación
  const [commName, setCommName] = useState('');
  const [commDescription, setCommDescription] = useState('');
  const [commType, setCommType] = useState('AUTOMATIC'); // AUTOMATIC, FORM, LEGAL
  const [file, setFile] = useState(null);
  const [variables, setVariables] = useState([]);
  const [availableVariables, setAvailableVariables] = useState([]);

  // Cargar variables del sistema desde la API al montar el componente
  useEffect(() => {
    const fetchVariables = async () => {
      try {
        const response = await getAvailableVariables();
        const varsArray = Array.isArray(response) ? response : (response?.data || []);
        const formattedVars = varsArray.map((item) => {
          const cleanName = item.variable_name.replace(/[{}]/g, '');
          return {
            value: cleanName,
            label: cleanName,
            description: item.description
          };
        });
        setAvailableVariables(formattedVars);
      } catch (error) {
        console.error("Error al cargar variables disponibles del sistema:", error);
      }
    };
    fetchVariables();
  }, []);

  // Tipos de input para usuario (basado en TemplateFieldType)
  const inputTypes = [
    { value: 'TEXT', label: 'Texto' },
    { value: 'NUMBER', label: 'Número' },
    { value: 'DATE', label: 'Fecha' },
  ];

  // Paso 1: Manejo de Archivo
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.docx')) {
      toast.error('Por favor sube un archivo Word (.docx)');
      return;
    }

    setFile(selectedFile);
    extractVariables(selectedFile);
  };

  const extractVariables = async (fileObj) => {
    setLoading(true);
    try {
      const arrayBuffer = await fileObj.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      
      // Regex para encontrar variables tipo {{variable}} o <<variable>>
      const regex = /{{([^}]+)}}|<<([^>]+)>>/g;
      const found = new Set();
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        // match[1] es para {{...}}, match[2] es para <<...>>
        const varName = (match[1] || match[2]).trim();
        found.add(varName);
      }

      const newVariables = Array.from(found).map(rawName => {
        const cleanName = rawName.replace(/[{}]/g, '').trim();
        // Intentar auto-emparejar con variables del sistema si coincide
        const matchedSystemVar = availableVariables.find(av => av.value.toLowerCase() === cleanName.toLowerCase());

        return {
          name: cleanName,
          source: 'SYSTEM', // Por defecto 'Dato del Sistema'
          label: cleanName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Humanize
          inputType: 'TEXT',
          systemField: matchedSystemVar ? matchedSystemVar.value : 'CUSTOM', // Si coincide usarlo; si no, 'CUSTOM'
          customSystemField: cleanName,
          required: true
        };
      });

      setVariables(newVariables);
      if (newVariables.length > 0) {
        toast.success(`Se encontraron ${newVariables.length} variables`);
      } else {
        toast.info('No se encontraron variables en el documento');
      }
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      toast.error('Error al analizar el documento');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Configuración de Variables
  const updateVariable = (index, field, value) => {
    const newVars = [...variables];
    newVars[index] = { ...newVars[index], [field]: value };
    
    // Resetear campos dependientes
    if (field === 'source') {
      if (value === 'SYSTEM') {
        newVars[index].inputType = '';
        newVars[index].label = '';
        // Si el nombre de la variable coincide con alguna del sistema, auto-asignarla; de lo contrario 'CUSTOM'
        const matched = availableVariables.find(av => av.value.toLowerCase() === newVars[index].name.toLowerCase());
        if (matched) {
          newVars[index].systemField = matched.value;
        } else {
          newVars[index].systemField = 'CUSTOM';
          newVars[index].customSystemField = newVars[index].name;
        }
      } else {
        newVars[index].systemField = '';
        newVars[index].customSystemField = '';
        newVars[index].inputType = 'TEXT';
        if (!newVars[index].label) {
          newVars[index].label = newVars[index].name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      }
    }
    
    setVariables(newVars);
  };

  const validateStep1 = () => {
    if (!commName.trim()) {
      toast.error('Ingresa un nombre para la comunicación');
      return false;
    }
    if (!file) {
      toast.error('Debes subir un archivo .docx');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const incomplete = variables.some(v => 
      !v.source || 
      (v.source === 'SYSTEM' && !v.systemField) || 
      (v.source === 'SYSTEM' && v.systemField === 'CUSTOM' && !v.customSystemField?.trim() && !v.name?.trim()) ||
      (v.source === 'USER' && !v.label)
    );
    if (incomplete) {
      toast.error('Por favor configura todas las variables');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Subir el archivo (Obtiene file_identifier)
      const uploadResponse = await uploadCommunicationTemplateFile(file);
      const filePath = uploadResponse.file_path; 

      if (!filePath) {
        throw new Error('No se pudo obtener el identificador del archivo subido');
      }

      // 2. Crear la plantilla
      const payload = {
        name: commName,
        description: commDescription,
        type: commType,
        template_file_path: filePath,
      };
      
      console.log('Creando plantilla:', payload);
      const createdTemplate = await createCommunicationTemplate(payload);
      
      if (!createdTemplate || !createdTemplate.id) {
        throw new Error('La plantilla se creó pero no se recibió su ID');
      }

      console.log('Plantilla creada:', createdTemplate);

      // 3. Crear cada uno de los campos configurados para la plantilla en el backend
      if (variables && variables.length > 0) {
        const createPromises = variables.map(async (v) => {
          let fieldName = v.name;
          if (v.source === 'SYSTEM') {
            if (v.systemField === 'CUSTOM') {
              fieldName = (v.customSystemField && v.customSystemField.trim()) ? v.customSystemField.trim() : v.name;
            } else if (v.systemField) {
              fieldName = v.systemField;
            }
          }

          const fieldLabel = v.source === 'USER' ? v.label : fieldName;
          const fieldType = v.source === 'SYSTEM' ? 'SYSTEM_DATA' : (v.inputType || 'TEXT');

          const fieldData = {
            field_name: fieldName,
            field_label: fieldLabel,
            field_type: fieldType,
            is_required: v.required ?? true
          };

          console.log(`Registrando campo en plantilla ${createdTemplate.id}:`, fieldData);
          return addCommunicationTemplateField(createdTemplate.id, fieldData);
        });

        await Promise.all(createPromises);
      }
      
      toast.success('Comunicación creada y configurada exitosamente');
      navigate('/comunicaciones'); 
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error.message || 'Error al guardar la comunicación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div></div> {/* Spacer */}
        <div className="flex items-center gap-2">
          <div className={`h-2 w-8 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`h-2 w-8 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`h-2 w-8 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Información Básica y Documento
          </h2>

          <div className="space-y-6">
            <FormField
              label="Nombre de la Comunicación"
              placeholder="Ej: Carta de Cobro Preventivo"
              value={commName}
              onChange={(e) => setCommName(e.target.value)}
              required
            />
            
            <FormField
              label="Descripción"
              type="textarea"
              placeholder="Describe el propósito de esta comunicación..."
              value={commDescription}
              onChange={(e) => setCommDescription(e.target.value)}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Tipo de Comunicación</label>
              <select
                value={commType}
                onChange={(e) => setCommType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="AUTOMATIC">Automática (AUTOMATIC)</option>
                <option value="FORM">Formulario (FORM)</option>
                <option value="LEGAL">Legal (LEGAL)</option>
              </select>
              <p className="text-xs text-gray-500">
                Define cómo se comportará esta plantilla en el sistema.
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".docx"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-blue-50 rounded-full">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {file ? file.name : 'Sube tu archivo Word (.docx)'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Asegúrate de usar variables entre llaves dobles, ej: {'{{nombre_cliente}}'}
                  </p>
                </div>
                {file && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Archivo cargado
                  </span>
                )}
              </div>
            </div>

            {variables.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Variables Detectadas:</h4>
                <div className="flex flex-wrap gap-2">
                  {variables.map((v, i) => (
                    <span key={i} className="px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-700 font-mono">
                      {v.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Configuración de Variables
          </h2>

          <div className="space-y-4">
            {variables.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No se detectaron variables para configurar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Variable</th>
                      <th className="px-4 py-3">Origen</th>
                      <th className="px-4 py-3">Configuración</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {variables.map((variable, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-blue-600 font-medium">
                          {variable.name}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={variable.source}
                            onChange={(e) => updateVariable(index, 'source', e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="USER">Entrada de Usuario</option>
                            <option value="SYSTEM">Dato del Sistema</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {variable.source === 'USER' && (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Etiqueta (Label)"
                                className="flex-1 p-2 border border-gray-300 rounded-lg"
                                value={variable.label}
                                onChange={(e) => updateVariable(index, 'label', e.target.value)}
                              />
                              <select
                                className="w-32 p-2 border border-gray-300 rounded-lg"
                                value={variable.inputType}
                                onChange={(e) => updateVariable(index, 'inputType', e.target.value)}
                              >
                                {inputTypes.map(t => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          {variable.source === 'SYSTEM' && (
                            <div className="space-y-2">
                              <select
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                value={variable.systemField}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateVariable(index, 'systemField', val);
                                  if (val === 'CUSTOM' && !variable.customSystemField) {
                                    updateVariable(index, 'customSystemField', variable.name);
                                  }
                                }}
                              >
                                <option value="">Seleccionar campo...</option>
                                <option value="CUSTOM">⚙️ Personalizada (usar nombre original "{variable.name}")</option>
                                {availableVariables.length > 0 && (
                                  <optgroup label="Campos del Sistema Backend">
                                    {availableVariables.map(f => (
                                      <option key={f.value} value={f.value}>
                                        {f.value} {f.description ? `- ${f.description}` : ''}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                              </select>
                              {variable.systemField === 'CUSTOM' && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 font-medium">Nombre de campo a enviar:</span>
                                  <input
                                    type="text"
                                    placeholder={`Ej: ${variable.name}`}
                                    className="flex-1 p-1.5 text-xs border border-gray-300 rounded-md font-mono bg-blue-50/50 text-blue-800 font-semibold focus:ring-2 focus:ring-blue-500"
                                    value={variable.customSystemField ?? variable.name}
                                    onChange={(e) => updateVariable(index, 'customSystemField', e.target.value)}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Atrás
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Revisar y Guardar
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Resumen Final
          </h2>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Detalles Generales</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><span className="font-semibold">Nombre:</span> {commName}</p>
                <p><span className="font-semibold">Descripción:</span> {commDescription || 'Sin descripción'}</p>
                <p><span className="font-semibold">Archivo:</span> {file?.name}</p>
                <p><span className="font-semibold">Variables:</span> {variables.length}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Configuración de Variables</h3>
              <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto space-y-2">
                {variables.map((v, i) => (
                  <div key={i} className="text-sm border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                    <span className="font-mono text-blue-600">{v.name}</span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span className="font-medium">
                      {v.source === 'SYSTEM' 
                        ? `Sistema (${v.systemField === 'CUSTOM' ? (v.customSystemField || v.name) : v.systemField})` 
                        : `Usuario (${v.label})`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Atrás
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-2"
            >
              {loading ? 'Guardando...' : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Comunicación
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CommunicationBuilderPage;
