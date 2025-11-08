import React, { useState } from 'react';
import { AlertCircle, Mail, Send, MessageCircle } from 'lucide-react';

const CommunicationStep1 = ({ onNext, onCancel }) => {
  const [formData, setFormData] = useState({
    cedula: '',
    obligacion: '',
    tipoDeudor: '',
    canalComunicacion: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.cedula.trim()) {
      newErrors.cedula = 'La cédula es requerida';
    } else if (!/^\d+$/.test(formData.cedula)) {
      newErrors.cedula = 'Solo se permiten números';
    }
    
    if (!formData.obligacion) {
      newErrors.obligacion = 'Debes seleccionar una obligación';
    }
    
    if (!formData.tipoDeudor) {
      newErrors.tipoDeudor = 'Debes especificar si eres deudor o codeudor';
    }
    
    if (!formData.canalComunicacion) {
      newErrors.canalComunicacion = 'Debes seleccionar un canal de comunicación';
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
      color: 'from-emerald-500 to-green-600'
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
        <h3 className="font-semibold text-blue-900 mb-2 text-sm flex items-center gap-2">
          <span className="text-lg">👤</span> Datos del Cliente
        </h3>

        <div className="space-y-2">
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
            <label className="block text-xs font-semibold text-blue-900 mb-1">
              Obligación *
            </label>
            <select
              name="obligacion"
              value={formData.obligacion}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.obligacion ? 'border-red-500 bg-red-50' : 'border-blue-300 bg-white'
              }`}
            >
              <option value="">-- Selecciona --</option>
              {obligaciones.map(oblig => (
                <option key={oblig.value} value={oblig.value}>
                  {oblig.label}
                </option>
              ))}
            </select>
            {errors.obligacion && (
              <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.obligacion}
              </p>
            )}
          </div>

          {/* Tipo de Deudor */}
          <div>
            <label className="block text-xs font-semibold text-blue-900 mb-1.5">
              Tipo de Deudor *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoDeudor"
                  value="deudor"
                  checked={formData.tipoDeudor === 'deudor'}
                  onChange={handleChange}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm text-gray-700 font-medium">Deudor</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoDeudor"
                  value="codeudor"
                  checked={formData.tipoDeudor === 'codeudor'}
                  onChange={handleChange}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm text-gray-700 font-medium">Codeudor</span>
              </label>
            </div>
            {errors.tipoDeudor && (
              <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.tipoDeudor}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: CANAL DE COMUNICACIÓN */}
      <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-lg p-3">
        <h3 className="font-semibold text-green-900 mb-2 text-sm flex items-center gap-2">
          <span className="text-lg">📢</span> Canal de Comunicación
        </h3>

        <div className="flex justify-center gap-3 w-full">
          {communicationChannels.map((channel) => (
            <button
              key={channel.id}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, canalComunicacion: channel.id }))}
              className={`relative overflow-hidden rounded-lg p-4 text-white transition-all font-bold text-xs flex flex-col items-center justify-center gap-2 w-40 h-28 ${
                formData.canalComunicacion === channel.id
                  ? `bg-gradient-to-br ${channel.color} shadow-lg ring-2 ring-yellow-300 scale-105`
                  : `bg-gradient-to-br ${channel.color} shadow hover:shadow-lg hover:scale-105`
              }`}
            >
              <div className="relative z-10 flex flex-col items-center gap-2">
                {React.cloneElement(channel.icon, { className: 'h-7 w-7' })}
                <span className="text-xs font-bold">{channel.title}</span>
              </div>
            </button>
          ))}
        </div>
        {errors.canalComunicacion && (
          <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {errors.canalComunicacion}
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
