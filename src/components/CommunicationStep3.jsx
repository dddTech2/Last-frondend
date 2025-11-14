import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader, CheckCircle2, Calendar } from 'lucide-react';
import { getCommunicationTemplateFields } from '../services/api';

const CommunicationStep3 = ({ communicationType, campaignConfig, onNext, onBack }) => {
  const [templateFields, setTemplateFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [nameFieldParts, setNameFieldParts] = useState({});
  const [loadingFields, setLoadingFields] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Funciones de validación específicas por tipo de campo
  const validateFieldValue = (field) => {
    const value = fieldValues[field.id];

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
          const editableFields = fields.filter(f => f.field_type !== 'SYSTEM_DATA');
          
          console.log('Editable fields found:', editableFields.length);
          editableFields.forEach(f => {
            console.log(`  - ${f.field_label} (${f.field_type})`);
          });
          
          setTemplateFields(editableFields);
          
          // Inicializar valores vacíos
          const initialValues = {};
          editableFields.forEach(field => {
            initialValues[field.id] = '';
          });
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
    
    templateFields.forEach(field => {
      const error = validateFieldValue(field);
      if (error) {
        newFieldErrors[field.id] = error;
      }
    });

    setFieldErrors(newFieldErrors);
    return Object.keys(newFieldErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateFormFields()) {
      const finalFieldValues = { ...fieldValues };
      
      Object.entries(nameFieldParts).forEach(([fieldId, parts]) => {
        finalFieldValues[fieldId] = joinNameFrom4Parts(parts);
      });

      onNext({
        ...campaignConfig,
        templateFields: finalFieldValues,
      });
    }
  };

  // Solo mostrar si es FORM o LEGAL
  const templateType = campaignConfig?.selectedTemplate?.type;
  const isFormOrLegal = templateType === 'FORM' || templateType === 'LEGAL';

  if (!isFormOrLegal) {
    return (
      <div className="space-y-4 text-sm p-4">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-700 text-sm font-medium">
            Esta plantilla no requiere campos adicionales.
          </p>
        </div>
        
        <div className="flex gap-3 pt-4 border-t border-gray-300">
          <button
            onClick={onBack}
            className="px-4 py-2 text-xs rounded-lg font-bold text-gray-700 bg-gradient-to-br from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 transition-all shadow-sm hover:shadow-md"
          >
            Atrás
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-xs rounded-lg font-bold text-white bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg ml-auto"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm max-h-full overflow-y-auto p-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-3">
        <h3 className="font-semibold text-blue-900 mb-2 text-sm flex items-center gap-2">
          <span className="text-lg">📋</span> Campos del Documento
        </h3>
        <p className="text-blue-700 text-xs font-medium">
          Completa los campos requeridos para generar el documento
        </p>
      </div>

      {/* Resumen de la plantilla */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2 text-emerald-900 text-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span><strong>Plantilla:</strong> {campaignConfig?.selectedTemplate?.name || 'No especificada'}</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-900 text-xs">
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
              <div key={field.id} className="space-y-2">
                <label className="block text-xs font-semibold text-gray-900">
                  {field.field_label}
                  {field.is_required && <span className="text-red-600 ml-1">*</span>}
                  {field.field_type !== 'TEXT' && (
                    <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {field.field_type === 'NUMBER' ? '(Números)' : field.field_type === 'DATE' ? '(Fecha)' : ''}
                    </span>
                  )}
                </label>

                {/* Renderizar input según el tipo de campo */}
                {field.field_type === 'NUMBER' ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => handleNumberChange(field.id, e.target.value)}
                    placeholder="Ej: 12345678"
                    maxLength="12"
                    className={`w-full px-3 py-2.5 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all font-mono ${
                      fieldErrors[field.id] 
                        ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                        : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                ) : field.field_type === 'DATE' ? (
                  <input
                    type="date"
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => handleDateChange(field.id, e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                      fieldErrors[field.id] 
                        ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                        : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                ) : isNameField(field) ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 font-medium mb-1">Primer Nombre</label>
                        <input
                          type="text"
                          value={nameFieldParts[field.id]?.[0] || ''}
                          onChange={(e) => {
                            const parts = nameFieldParts[field.id] || ['', '', '', ''];
                            parts[0] = e.target.value;
                            setNameFieldParts(prev => ({ ...prev, [field.id]: parts }));
                            setFieldValues(prev => ({
                              ...prev,
                              [field.id]: joinNameFrom4Parts(parts)
                            }));
                          }}
                          placeholder="Ej: Juan"
                          className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors[field.id] 
                              ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                              : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 font-medium mb-1">Primer Apellido</label>
                        <input
                          type="text"
                          value={nameFieldParts[field.id]?.[1] || ''}
                          onChange={(e) => {
                            const parts = nameFieldParts[field.id] || ['', '', '', ''];
                            parts[1] = e.target.value;
                            setNameFieldParts(prev => ({ ...prev, [field.id]: parts }));
                            setFieldValues(prev => ({
                              ...prev,
                              [field.id]: joinNameFrom4Parts(parts)
                            }));
                          }}
                          placeholder="Ej: García"
                          className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors[field.id] 
                              ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                              : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 font-medium mb-1">Segundo Apellido</label>
                        <input
                          type="text"
                          value={nameFieldParts[field.id]?.[2] || ''}
                          onChange={(e) => {
                            const parts = nameFieldParts[field.id] || ['', '', '', ''];
                            parts[2] = e.target.value;
                            setNameFieldParts(prev => ({ ...prev, [field.id]: parts }));
                            setFieldValues(prev => ({
                              ...prev,
                              [field.id]: joinNameFrom4Parts(parts)
                            }));
                          }}
                          placeholder="Ej: Martínez"
                          className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors[field.id] 
                              ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                              : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 font-medium mb-1">Segundo Nombre (Opt.)</label>
                        <input
                          type="text"
                          value={nameFieldParts[field.id]?.[3] || ''}
                          onChange={(e) => {
                            const parts = nameFieldParts[field.id] || ['', '', '', ''];
                            parts[3] = e.target.value;
                            setNameFieldParts(prev => ({ ...prev, [field.id]: parts }));
                            setFieldValues(prev => ({
                              ...prev,
                              [field.id]: joinNameFrom4Parts(parts)
                            }));
                          }}
                          placeholder="Ej: Carlos"
                          className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors[field.id] 
                              ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                              : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <strong>Resultado:</strong> {fieldValues[field.id] || '(Nombre completo)'}
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => handleTextChange(field.id, e.target.value)}
                    placeholder={`Ingresa ${field.field_label.toLowerCase()}`}
                    className={`w-full px-3 py-2.5 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors[field.id] 
                        ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                        : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                )}

                {fieldErrors[field.id] && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {fieldErrors[field.id]}
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
          className="px-4 py-2 text-xs rounded-lg font-bold text-gray-700 bg-gradient-to-br from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 transition-all shadow-sm hover:shadow-md"
        >
          Atrás
        </button>
        <button
          onClick={handleSubmit}
          disabled={loadingFields || templateFields.length === 0}
          className="px-5 py-2 text-xs rounded-lg font-bold text-white bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default CommunicationStep3;