import React, { useState, useEffect } from 'react';
import { AlertCircle, Mail, Send, MessageCircle } from 'lucide-react';
import { getObligacionesByCedula, getClientChannelsByCedula } from '../services/api';
import { debounce } from 'lodash';

const CommunicationStep1 = ({ onNext, onCancel }) => {
  const [formData, setFormData] = useState({
    cedula: '',
    obligaciones: [],
    tipoDeudor: '',
    canalComunicacion: '',
    tipoAprobacion: '',
    contactValue: ''
  });

  const [errors, setErrors] = useState({});
  const [obligacionesOptions, setObligacionesOptions] = useState([]);
  const [loadingObligaciones, setLoadingObligaciones] = useState(false);
  const [contactsByChannel, setContactsByChannel] = useState({});
  const [loadingContacts, setLoadingContacts] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'canalComunicacion') {
      setFormData(prev => ({ ...prev, [name]: value, contactValue: '' }));
    } else if (name === 'contactValue') {
      setFormData(prev => ({ ...prev, contactValue: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (name === 'canalComunicacion' && errors.contactValue) {
      setErrors(prev => ({ ...prev, contactValue: null }));
    }
    if (name === 'contactValue' && errors.contactValue) {
      setErrors(prev => ({ ...prev, contactValue: null }));
    }
  };

  // Debounced function para buscar obligaciones cuando cambia la cédula
  const fetchObligacionesByCedula = debounce(async (cedula) => {
    if (!cedula || cedula.trim() === '') {
      setObligacionesOptions([]);
      setFormData(prev => ({ ...prev, obligaciones: [] }));
      return;
    }

    setLoadingObligaciones(true);
    try {
      const response = await getObligacionesByCedula(cedula);
      const obligaciones = response.obligaciones || [];
      setObligacionesOptions(obligaciones);

      // Si hay solo una obligación, seleccionarla automáticamente
      if (obligaciones.length === 1) {
        setFormData(prev => ({ ...prev, obligaciones: [obligaciones[0].obligacion] }));
      } else {
        setFormData(prev => ({ ...prev, obligaciones: [] }));
      }
    } catch (err) {
      console.error('Error fetching obligaciones:', err);
      setObligacionesOptions([]);
      setFormData(prev => ({ ...prev, obligaciones: [] }));
    } finally {
      setLoadingObligaciones(false);
    }
  }, 500);

  useEffect(() => {
    fetchObligacionesByCedula(formData.cedula);
  }, [formData.cedula]);

  const fetchContactsByCedula = debounce(async (cedula) => {
    if (!cedula || cedula.trim() === '') {
      setContactsByChannel({});
      setFormData(prev => ({ ...prev, contactValue: '' }));
      return;
    }

    setLoadingContacts(true);
    try {
      const response = await getClientChannelsByCedula(cedula);
      const grouped = (response?.contacts || []).reduce((acc, contact) => {
        const channel = (contact.channel || '').toUpperCase();
        if (!channel || !contact.contact_value) return acc;
        if (!acc[channel]) acc[channel] = [];
        if (!acc[channel].includes(contact.contact_value)) {
          acc[channel].push(contact.contact_value);
        }
        return acc;
      }, {});
      setContactsByChannel(grouped);
    } catch (err) {
      console.error('Error fetching channel contacts:', err);
      setContactsByChannel({});
    } finally {
      setLoadingContacts(false);
    }
  }, 500);

  useEffect(() => {
    fetchContactsByCedula(formData.cedula);
  }, [formData.cedula]);

  const selectedChannelValue = formData.canalComunicacion;
  const selectedChannelKey = selectedChannelValue === 'email'
    ? 'EMAIL'
    : selectedChannelValue === 'whatsapp'
      ? 'WHATSAPP'
      : null;

  const availableContacts = selectedChannelKey ? (contactsByChannel[selectedChannelKey] || []) : [];

  useEffect(() => {
    if (!selectedChannelKey) {
      return;
    }

    const currentContacts = contactsByChannel[selectedChannelKey] || [];
    if (currentContacts.length === 0) {
      return;
    }

    setFormData(prev => {
      if (prev.canalComunicacion !== selectedChannelValue) {
        return prev;
      }
      if (currentContacts.length === 1) {
        return prev.contactValue === currentContacts[0]
          ? prev
          : { ...prev, contactValue: currentContacts[0] };
      }
      if (currentContacts.includes(prev.contactValue)) {
        return prev;
      }
      return { ...prev, contactValue: '' };
    });
  }, [selectedChannelKey, selectedChannelValue, contactsByChannel]);

  const handleContactSelect = (value) => {
    setFormData(prev => ({ ...prev, contactValue: value }));
    if (errors.contactValue) {
      setErrors(prev => ({ ...prev, contactValue: null }));
    }
  };

  const handleObligacionChange = (obligacionId) => {
    // Si solo hay una obligación, no permitir deseleccionarla
    if (obligacionesOptions.length === 1) {
      return;
    }

    setFormData(prev => {
      const obligaciones = prev.obligaciones.includes(obligacionId)
        ? prev.obligaciones.filter(o => o !== obligacionId)
        : [...prev.obligaciones, obligacionId];
      return { ...prev, obligaciones };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.cedula.trim()) {
      newErrors.cedula = 'La cédula es requerida';
    } else if (!/^\d+$/.test(formData.cedula)) {
      newErrors.cedula = 'Solo se permiten números';
    }
    
    if (formData.obligaciones.length === 0) {
      newErrors.obligaciones = 'Debes seleccionar al menos una obligación';
    }
    
    if (!formData.tipoDeudor) {
      newErrors.tipoDeudor = 'Debes especificar si eres deudor o codeudor';
    }
    
    if (!formData.canalComunicacion) {
      newErrors.canalComunicacion = 'Debes seleccionar un canal de comunicación';
    }

    if ((formData.canalComunicacion === 'email' || formData.canalComunicacion === 'whatsapp') && !formData.contactValue.trim()) {
      newErrors.contactValue = formData.canalComunicacion === 'email'
        ? 'Debes seleccionar o ingresar un correo de destino'
        : 'Debes seleccionar o ingresar un número de WhatsApp';
    }

    if (!formData.tipoAprobacion) {
      newErrors.tipoAprobacion = 'Debes seleccionar el tipo de comunicación';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(formData);
    }
  };

  const communicationChannels = [
    {
      id: 'email',
      title: 'Email',
      icon: <Mail className="h-12 w-12" />,
      color: 'from-sky-500 to-cyan-600'
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      icon: <Send className="h-12 w-12" />,
      color: 'from-emerald-500 to-green-600',
      disabled: true,
    }
  ];

  const obligaciones = [
    { value: 'obligacion1', label: 'Obligación 1' },
    { value: 'obligacion2', label: 'Obligación 2' },
    { value: 'obligacion3', label: 'Obligación 3' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      {/* SECCIÓN 1: DATOS DEL CLIENTE */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-3">
        <h3 className="font-semibold text-blue-900 mb-3 text-sm flex items-center gap-2">
          <span className="text-lg">👤</span> Datos del Cliente
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Columna 1: Cédula y Obligaciones */}
          <div className="space-y-3">
            {/* Cédula */}
            <div>
              <label className="block text-xs font-semibold text-blue-900 mb-1">
                Cédula *
              </label>
              <input
                type="text"
                name="cedula"
                value={formData.cedula}
                onChange={handleChange}
                placeholder="1023456789"
                className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.cedula ? 'border-red-500 bg-red-50' : 'border-blue-300 bg-white'
                }`}
              />
              {errors.cedula && (
                <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.cedula}
                </p>
              )}
            </div>

            {/* Obligación */}
            <div>
              <label className="block text-xs font-semibold text-blue-900 mb-1.5">
                Obligaciones * {loadingObligaciones && <span className="text-blue-600 text-xs">(Cargando...)</span>}
              </label>
              {obligacionesOptions.length > 0 ? (
                <div className="space-y-2 bg-white p-2 rounded-lg border-2 border-blue-300 max-h-40 overflow-y-auto">
                  {obligacionesOptions.map((obligacion) => (
                    <label 
                      key={obligacion.obligacion} 
                      className={`flex items-center gap-2 ${obligacionesOptions.length === 1 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.obligaciones.includes(obligacion.obligacion)}
                        onChange={() => handleObligacionChange(obligacion.obligacion)}
                        disabled={obligacionesOptions.length === 1}
                        className={`w-4 h-4 accent-blue-600 ${obligacionesOptions.length === 1 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      />
                      <span className={`text-sm font-medium ${obligacionesOptions.length === 1 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {obligacion.obligacion}
                        {obligacion.sistema_origen && <span className="text-xs text-gray-500 ml-2">({obligacion.sistema_origen})</span>}
                        {obligacionesOptions.length === 1 && <span className="text-xs text-blue-600 ml-2">(Única)</span>}
                      </span>
                    </label>
                  ))}
                </div>
              ) : loadingObligaciones ? (
                <div className="text-xs text-gray-600 p-2">Cargando obligaciones...</div>
              ) : (
                <div className="text-xs text-gray-600 p-2">Ingresa la cédula para cargar las obligaciones</div>
              )}
              {errors.obligaciones && (
                <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.obligaciones}
                </p>
              )}
            </div>
          </div>

          {/* Columna 2: Tipo de Deudor */}
          <div>
            <label className="block text-xs font-semibold text-blue-900 mb-2">
              Tipo de Deudor *
            </label>
            <div className="space-y-2">
              {/* Deudor */}
              <label className="cursor-pointer group">
                <input
                  type="radio"
                  name="tipoDeudor"
                  value="deudor"
                  checked={formData.tipoDeudor === 'deudor'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`p-2.5 rounded-lg border-2 transition-all ${
                  formData.tipoDeudor === 'deudor'
                    ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-200'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}>
                  <div className="flex items-start gap-2">
                    <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
                      formData.tipoDeudor === 'deudor'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 group-hover:border-blue-400'
                    }`}>
                      {formData.tipoDeudor === 'deudor' && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Deudor</p>
                      <p className="text-xs text-gray-600 mt-0.5">Principal responsable</p>
                    </div>
                  </div>
                </div>
              </label>

              {/* Codeudor */}
              <label className="cursor-pointer group">
                <input
                  type="radio"
                  name="tipoDeudor"
                  value="codeudor"
                  checked={formData.tipoDeudor === 'codeudor'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`p-2.5 rounded-lg border-2 transition-all ${
                  formData.tipoDeudor === 'codeudor'
                    ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-200'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}>
                  <div className="flex items-start gap-2">
                    <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
                      formData.tipoDeudor === 'codeudor'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 group-hover:border-blue-400'
                    }`}>
                      {formData.tipoDeudor === 'codeudor' && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Codeudor</p>
                      <p className="text-xs text-gray-600 mt-0.5">Responsable solidario</p>
                    </div>
                  </div>
                </div>
              </label>
            </div>
            {errors.tipoDeudor && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.tipoDeudor}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: CANAL DE COMUNICACIÓN */}
      <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-lg p-3">
        <h3 className="font-semibold text-green-900 mb-3 text-sm flex items-center gap-2">
          <span className="text-lg">📢</span> Canal de Comunicación
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {communicationChannels.map((channel) => (
            <label
              key={channel.id}
              className={`group ${channel.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              <input
                type="radio"
                name="canalComunicacion"
                value={channel.id}
                checked={formData.canalComunicacion === channel.id}
                onChange={handleChange}
                className="sr-only"
                disabled={channel.disabled}
              />
              <div className={`p-3 rounded-lg border-2 transition-all ${
                formData.canalComunicacion === channel.id
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-200'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }`}>
                <div className="flex items-start gap-2">
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    formData.canalComunicacion === channel.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 group-hover:border-blue-400'
                  }`}>
                    {formData.canalComunicacion === channel.id && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{channel.id === 'email' ? '✉️' : '💬'}</span>
                      <p className="font-semibold text-gray-800 text-sm">{channel.title}</p>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {channel.id === 'email'
                        ? 'Correo electrónico'
                        : channel.disabled
                          ? 'Temporalmente inhabilitado'
                          : 'WhatsApp Business'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
        {errors.canalComunicacion && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {errors.canalComunicacion}
          </p>
        )}

        {formData.canalComunicacion && (
          <div className="mt-4">
            <label className="block text-xs font-semibold text-green-900 mb-1.5">
              {formData.canalComunicacion === 'email' ? 'Correo de destino *' : 'Número de WhatsApp *'}
              {loadingContacts && <span className="text-green-700 text-xs ml-2">(Cargando...)</span>}
            </label>
            {availableContacts.length > 0 ? (
              <div className="space-y-2 bg-white p-2 rounded-lg border-2 border-green-200">
                {availableContacts.map((contact) => (
                  <label key={contact} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contactValueOption"
                      checked={formData.contactValue === contact}
                      onChange={() => handleContactSelect(contact)}
                      className="w-4 h-4 accent-green-600"
                    />
                    <span className="text-sm font-medium text-gray-700">{contact}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input
                type={formData.canalComunicacion === 'email' ? 'email' : 'tel'}
                name="contactValue"
                value={formData.contactValue}
                onChange={handleChange}
                placeholder={formData.canalComunicacion === 'email' ? 'cliente@correo.com' : '3001234567'}
                className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                  errors.contactValue ? 'border-red-500 bg-red-50' : 'border-green-200 bg-white'
                }`}
              />
            )}
            {errors.contactValue && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.contactValue}
              </p>
            )}
            {!loadingContacts && availableContacts.length === 0 && (
              <p className="text-[11px] text-gray-500 mt-1">
                No encontramos contactos registrados para este canal. Ingresa uno manualmente.
              </p>
            )}
          </div>
        )}
      </div>

      {/* SECCIÓN 3: TIPO DE COMUNICACIÓN */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-3">
        <h3 className="font-semibold text-purple-900 mb-3 text-sm flex items-center gap-2">
          <span className="text-lg">✓</span> Tipo de Comunicación
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Sin Aprobación */}
          <label className="cursor-pointer group">
            <input
              type="radio"
              name="tipoAprobacion"
              value="sin_aprobacion"
              checked={formData.tipoAprobacion === 'sin_aprobacion'}
              onChange={handleChange}
              className="sr-only"
            />
            <div className={`p-3 rounded-lg border-2 transition-all ${
              formData.tipoAprobacion === 'sin_aprobacion'
                ? 'border-green-500 bg-green-50 shadow-lg shadow-green-200'
                : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
            }`}>
              <div className="flex items-start gap-2">
                <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  formData.tipoAprobacion === 'sin_aprobacion'
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300 group-hover:border-green-400'
                }`}>
                  {formData.tipoAprobacion === 'sin_aprobacion' && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Sin Aprobación</p>
                  <p className="text-xs text-gray-600 mt-0.5">Envío inmediato</p>
                </div>
              </div>
              <div className="mt-2 ml-7 text-xs text-gray-600 border-l-2 border-green-200 pl-2">
                Comunicación directa sin validación previa
              </div>
            </div>
          </label>

          {/* Con Aprobación */}
          <label className="cursor-pointer group">
            <input
              type="radio"
              name="tipoAprobacion"
              value="con_aprobacion"
              checked={formData.tipoAprobacion === 'con_aprobacion'}
              onChange={handleChange}
              className="sr-only"
            />
            <div className={`p-3 rounded-lg border-2 transition-all ${
              formData.tipoAprobacion === 'con_aprobacion'
                ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-200'
                : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-md'
            }`}>
              <div className="flex items-start gap-2">
                <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  formData.tipoAprobacion === 'con_aprobacion'
                    ? 'border-amber-500 bg-amber-500'
                    : 'border-gray-300 group-hover:border-amber-400'
                }`}>
                  {formData.tipoAprobacion === 'con_aprobacion' && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Con Aprobación</p>
                  <p className="text-xs text-gray-600 mt-0.5">Requiere validación</p>
                </div>
              </div>
              <div className="mt-2 ml-7 text-xs text-gray-600 border-l-2 border-amber-200 pl-2">
                Se requiere revisión antes del envío
              </div>
            </div>
          </label>
        </div>

        {errors.tipoAprobacion && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {errors.tipoAprobacion}
          </p>
        )}
      </div>

      {/* BOTONES */}
      <div className="flex gap-3 justify-between pt-2 border-t border-gray-300">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs rounded-lg font-bold text-gray-700 bg-gradient-to-br from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 transition-all shadow-sm hover:shadow-md"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-5 py-2 text-xs rounded-lg font-bold text-white bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
        >
          Siguiente
        </button>
      </div>
    </form>
  );
};

export default CommunicationStep1;
