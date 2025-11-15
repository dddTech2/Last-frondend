import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader, CheckCircle2, Calendar } from 'lucide-react';
import { getCommunicationTemplateFields } from '../services/api';

const CommunicationStep3 = ({ communicationType, campaignConfig, onNext, onBack }) => {
  const [templateFields, setTemplateFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [nameFieldParts, setNameFieldParts] = useState({});
  const [loadingFields, setLoadingFields] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Helper function para obtener la clave correcta de un field
  // USO INTERNO: Usar `id` (UUID único del field)
  // Para API: Transformamos a usar field_name en handleSubmit
  const getFieldKey = (field, index, usedKeys = new Set()) => {
    const candidates = [field?.field_name, field?.id, field?.field_id, field?.field_label, index != null ? `field_${index}` : null];
    for (const candidate of candidates) {
      if (!candidate) continue;
      if (!usedKeys.has(candidate)) {
        usedKeys.add(candidate);
        return candidate;
      }
    }
    let fallbackIndex = index ?? usedKeys.size;
    let key;
    do {
      key = `field_${fallbackIndex++}`;
    } while (usedKeys.has(key));
    usedKeys.add(key);
    return key;
  };

  // Funciones de validación específicas por tipo de campo
  const validateFieldValue = (field, index) => {
    const key = field.__fieldKey || getFieldKey(field, index);
    const value = fieldValues[key];

    // Campos requeridos vacíos
    if (field.is_required && !value?.trim()) {
      return `${field.field_label} es requerido`;
    }

    // Si no es requerido y está vacío, es válido
    if (!value?.trim()) {
      return null;
    }

    // Validar según tipo de campo
    if (field.field_type === 'NUMBER') {
      // Solo números, sin caracteres especiales
      if (!/^\d+$/.test(value)) {
        return `${field.field_label} solo puede contener números`;
      }
      if (value.length < 8 || value.length > 12) {
        return `${field.field_label} debe tener entre 8 y 12 dígitos`;
      }
    }

    if (field.field_type === 'DATE') {
      // Validar formato YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return `${field.field_label} debe estar en formato YYYY-MM-DD`;
      }
      // Validar que sea una fecha válida
      const date = new Date(value + 'T00:00:00');
      if (isNaN(date.getTime())) {
        return `${field.field_label} no es una fecha válida`;
      }
      // No permitir fechas futuras
      if (date > new Date()) {
        return `${field.field_label} no puede ser una fecha futura`;
      }
    }

    // TEXT o cualquier otro tipo
    return null;
  };

  // Handler para campos de número (solo dígitos)
  const handleNumberChange = (fieldId, value) => {
    const onlyNumbers = value.replace(/\D/g, '').substring(0, 12);
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: onlyNumbers
    }));
  };

  // Handler para campos de fecha (readonly)
  const handleDateChange = (fieldId, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleTextChange = (fieldId, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Detectar si un campo es de nombre
  const isNameField = (field) => {
    const fieldNameLower = (field.field_name || '').toLowerCase();
    const fieldLabelLower = (field.field_label || '').toLowerCase();
    
    return (
      (fieldNameLower.includes('nombre') || fieldNameLower.includes('name')) &&
      !fieldNameLower.includes('empresa')
    ) || (
      (fieldLabelLower.includes('nombre') || fieldLabelLower.includes('name')) &&
      !fieldLabelLower.includes('empresa')
    );
  };

  // Partir nombre en 4 partes
  const parseNameInto4Parts = (fullName) => {
    if (!fullName || typeof fullName !== 'string') {
      return ['', '', '', ''];
    }

    const parts = fullName
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .filter(p => p.length > 0);

    while (parts.length < 4) {
      parts.push('');
    }

    return parts.slice(0, 4);
  };

  // Concatenar 4 partes de nombre
  const joinNameFrom4Parts = (nameParts) => {
    if (!Array.isArray(nameParts)) return '';
    return nameParts
      .filter(part => part && part.trim())
      .join(' ')
      .trim();
  };

  // Cargar campos del template si es FORM o LEGAL
  useEffect(() => {
    const loadTemplateFields = async () => {
      console.log('=== STEP 3 DEBUG ===');
      console.log('campaignConfig:', campaignConfig);
      console.log('selectedTemplate:', campaignConfig?.selectedTemplate);
      console.log('selectedTemplate.type:', campaignConfig?.selectedTemplate?.type);
      
      // El type viene de selectedTemplate, no de communicationType
      const templateType = campaignConfig?.selectedTemplate?.type;
      const isFormOrLegal = templateType === 'FORM' || templateType === 'LEGAL';
      const templateId = campaignConfig?.selectedTemplateId;

      console.log('Template Type:', templateType);
      console.log('Is FORM or LEGAL:', isFormOrLegal);
      console.log('Template ID:', templateId);

      if (!isFormOrLegal || !templateId) {
        console.log('Condición no cumplida - No cargando campos');
        setTemplateFields([]);
        setFieldValues({});
        return;
      }

      setLoadingFields(true);
      try {
        const response = await getCommunicationTemplateFields(templateId);
        console.log('API Response:', response);
        
        // La API devuelve un array directo
        let fields = Array.isArray(response) ? response : response?.fields || [];
        
        console.log('All fields received:', fields.length);
        
        if (Array.isArray(fields)) {
          // Filtrar campos que NO son SYSTEM_DATA
          const usedKeys = new Set();
          const editableFields = fields
            .filter(f => f.field_type !== 'SYSTEM_DATA')
            .map((field, index) => {
              const fieldKey = getFieldKey(field, index, usedKeys);
              return { ...field, __fieldKey: fieldKey, __index: index };
            });
            const filteredEditableFields = editableFields.filter(Boolean);
          
          console.log('Editable fields found:', filteredEditableFields.length);
          filteredEditableFields.forEach((f, idx) => {
            console.log(`[${idx}] ${f.field_label} (${f.field_type}) -> key: ${f.__fieldKey}`);
          });
          
          setTemplateFields(filteredEditableFields);
          
          // Inicializar valores vacíos usando __fieldKey como clave
          const initialValues = {};
          filteredEditableFields.forEach(field => {
            const key = field.__fieldKey;
            console.log(`Inicializando [${field.__index}]: "${key}"`);
            initialValues[key] = '';
          });
          console.log('initialValues keys:', Object.keys(initialValues));
          setFieldValues(initialValues);
        }
      } catch (error) {
        console.error('Error loading template fields:', error);
        setTemplateFields([]);
      } finally {
        setLoadingFields(false);
      }
    };

    loadTemplateFields();
  }, [campaignConfig?.selectedTemplateId, campaignConfig?.selectedTemplate?.type]);

  const validateFormFields = () => {
    const newFieldErrors = {};
    
    templateFields.forEach((field, index) => {
      const error = validateFieldValue(field, index);
      if (error) {
        newFieldErrors[field.__fieldKey] = error;
      }
    });

    setFieldErrors(newFieldErrors);
    return Object.keys(newFieldErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateFormFields()) {
      const finalFieldValues = { ...fieldValues };
      
      Object.entries(nameFieldParts).forEach(([fieldName, parts]) => {
        finalFieldValues[fieldName] = joinNameFrom4Parts(parts);
      });

      // Construir dos versiones de los datos:
      // 1. templateFieldsForAPI: Usa field_name como claves (lo que API espera)
      // 2. fieldMetadata: Usa field_name como claves con metadata
      const templateFieldsForAPI = {};
      const fieldMetadata = {};
      
      templateFields.forEach(field => {
        const fieldKey = field.__fieldKey; // UUID o field_name (depende de API)
        const fieldName = field.field_name; // Siempre el nombre legible
        const value = finalFieldValues[fieldKey];
        
        // Para API: usar field_name como clave
        templateFieldsForAPI[fieldName] = value;
        
        // Para metadata: también usar field_name como clave
        fieldMetadata[fieldName] = {
          label: field.field_label,
          type: field.field_type,
          value: value
        };
      });

      console.log('=== STEP 3 SUBMIT DEBUG ===');
      console.log('fieldValues keys:', Object.keys(fieldValues));
      console.log('finalFieldValues keys:', Object.keys(finalFieldValues));
      console.log('finalFieldValues:', finalFieldValues);
      console.log('templateFieldsForAPI keys:', Object.keys(templateFieldsForAPI));
      console.log('templateFieldsForAPI:', templateFieldsForAPI);
      console.log('fieldMetadata:', fieldMetadata);
      console.log('Enviando a Step 4:', {
        templateFields: templateFieldsForAPI,
        fieldMetadata: fieldMetadata
      });

      onNext({
        ...campaignConfig,
        templateFields: templateFieldsForAPI,
        fieldMetadata: fieldMetadata,
      });
    }
  };

  // Solo mostrar si es FORM o LEGAL
  const templateType = campaignConfig?.selectedTemplate?.type;
  const isFormOrLegal = templateType === 'FORM' || templateType === 'LEGAL';

  if (!isFormOrLegal) {
    return (
      <div className="space-y-4 text-base p-4">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-700 text-base font-medium">
            Esta plantilla no requiere campos adicionales.
          </p>
        </div>
        
        <div className="flex gap-3 pt-4 border-t border-gray-300">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm rounded-lg font-bold text-gray-700 bg-gradient-to-br from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 transition-all shadow-sm hover:shadow-md"
          >
            Atrás
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-sm rounded-lg font-bold text-white bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg ml-auto"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-base max-h-full overflow-y-auto p-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-3">
        <h3 className="font-semibold text-blue-900 mb-2 text-base flex items-center gap-2">
          <span className="text-lg">📋</span> Campos del Documento
        </h3>
        <p className="text-blue-700 text-sm font-medium">
          Completa los campos requeridos para generar el documento
        </p>
      </div>

      {/* Resumen de la plantilla */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2 text-emerald-900 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span><strong>Plantilla:</strong> {campaignConfig?.selectedTemplate?.name || 'No especificada'}</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-900 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span><strong>Tipo:</strong> {templateType || 'No especificado'}</span>
        </div>
      </div>

      {/* Campos del Formulario */}
      <div className="space-y-4">
        {loadingFields ? (
          <div className="flex items-center justify-center gap-2 text-blue-600 py-8">
            <Loader className="h-5 w-5 animate-spin" />
            <span className="text-sm">Cargando campos del documento...</span>
          </div>
        ) : templateFields.length === 0 ? (
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-700 text-sm font-medium">No hay campos adicionales para completar en este documento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {templateFields.map(field => (
              <div key={field.__fieldKey} className="space-y-2">
                <label className="block text-sm font-bold leading-tight bg-gradient-to-r from-white via-purple-100 to-indigo-100 text-transparent bg-clip-text drop-shadow-sm">
                  {field.field_label}
                  {field.is_required && <span className="text-red-600 ml-1">*</span>}
                  {field.field_type !== 'TEXT' && (
                    <span className="ml-2 text-sm font-medium text-indigo-700/80 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {field.field_type === 'NUMBER' ? '(Números)' : field.field_type === 'DATE' ? '(Fecha)' : ''}
                    </span>
                  )}
                </label>

                {/* Renderizar input según el tipo de campo */}
                {field.field_type === 'NUMBER' ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fieldValues[field.__fieldKey] || ''}
                    onChange={(e) => handleNumberChange(field.__fieldKey, e.target.value)}
                    placeholder="Ej: 12345678"
                    maxLength="12"
                    className={`w-full px-3 py-2.5 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all font-mono ${
                      fieldErrors[field.__fieldKey] 
                        ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                        : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                ) : field.field_type === 'DATE' ? (
                  <input
                    type="date"
                    value={fieldValues[field.__fieldKey] || ''}
                    onChange={(e) => handleDateChange(field.__fieldKey, e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                      fieldErrors[field.__fieldKey] 
                        ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                        : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                ) : isNameField(field) ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm text-purple-700 font-semibold mb-1">Primer Nombre</label>
                        <input
                          type="text"
                          value={nameFieldParts[field.__fieldKey]?.[0] || ''}
                          onChange={(e) => {
                            const parts = [...(nameFieldParts[field.__fieldKey] || ['', '', '', ''])];
                            parts[0] = e.target.value;
                            setNameFieldParts(prev => ({ ...prev, [field.__fieldKey]: parts }));
                            setFieldValues(prev => ({
                              ...prev,
                              [field.__fieldKey]: joinNameFrom4Parts(parts)
                            }));
                          }}
                          placeholder="Ej: Juan"
                          className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors[field.__fieldKey] 
                              ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                              : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-purple-700 font-semibold mb-1">Primer Apellido</label>
                        <input
                          type="text"
                          value={nameFieldParts[field.__fieldKey]?.[1] || ''}
                          onChange={(e) => {
                            const parts = [...(nameFieldParts[field.__fieldKey] || ['', '', '', ''])];
                            parts[1] = e.target.value;
                            setNameFieldParts(prev => ({ ...prev, [field.__fieldKey]: parts }));
                            setFieldValues(prev => ({
                              ...prev,
                              [field.__fieldKey]: joinNameFrom4Parts(parts)
                            }));
                          }}
                          placeholder="Ej: García"
                          className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors[field.__fieldKey] 
                              ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                              : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-purple-700 font-semibold mb-1">Segundo Apellido</label>
                        <input
                          type="text"
                          value={nameFieldParts[field.__fieldKey]?.[2] || ''}
                          onChange={(e) => {
                            const parts = [...(nameFieldParts[field.__fieldKey] || ['', '', '', ''])];
                            parts[2] = e.target.value;
                            setNameFieldParts(prev => ({ ...prev, [field.__fieldKey]: parts }));
                            setFieldValues(prev => ({
                              ...prev,
                              [field.__fieldKey]: joinNameFrom4Parts(parts)
                            }));
                          }}
                          placeholder="Ej: Martínez"
                          className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors[field.__fieldKey] 
                              ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                              : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-purple-700 font-semibold mb-1">Segundo Nombre (Opt.)</label>
                        <input
                          type="text"
                          value={nameFieldParts[field.__fieldKey]?.[3] || ''}
                          onChange={(e) => {
                            const parts = [...(nameFieldParts[field.__fieldKey] || ['', '', '', ''])];
                            parts[3] = e.target.value;
                            setNameFieldParts(prev => ({ ...prev, [field.__fieldKey]: parts }));
                            setFieldValues(prev => ({
                              ...prev,
                              [field.__fieldKey]: joinNameFrom4Parts(parts)
                            }));
                          }}
                          placeholder="Ej: Carlos"
                          className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors[field.__fieldKey] 
                              ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                              : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                      <strong>Resultado:</strong> {fieldValues[field.__fieldKey] || '(Nombre completo)'}
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={fieldValues[field.__fieldKey] || ''}
                    onChange={(e) => handleTextChange(field.__fieldKey, e.target.value)}
                    placeholder={`Ingresa ${field.field_label.toLowerCase()}`}
                    className={`w-full px-3 py-2.5 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors[field.__fieldKey] 
                        ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                        : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                )}

                {fieldErrors[field.__fieldKey] && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {fieldErrors[field.__fieldKey]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-3 pt-4 border-t border-gray-300">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm rounded-lg font-bold text-gray-700 bg-gradient-to-br from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 transition-all shadow-sm hover:shadow-md"
        >
          Atrás
        </button>
        <button
          onClick={handleSubmit}
          disabled={loadingFields || templateFields.length === 0}
          className="px-5 py-2 text-sm rounded-lg font-bold text-white bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default CommunicationStep3;