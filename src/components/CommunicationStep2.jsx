import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import FormField from './FormField';

const CommunicationStep2 = ({ communicationType, onNext, onBack }) => {
  const [formData, setFormData] = useState({
    campaignName: '',
    description: '',
    targetAudience: 'all',
    schedule: 'immediate',
    scheduledDate: '',
    scheduledTime: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo al modificarlo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.campaignName.trim()) {
      newErrors.campaignName = 'El nombre de la campaña es requerido';
    }
    
    if (formData.campaignName.trim().length < 3) {
      newErrors.campaignName = 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    
    if (formData.schedule === 'scheduled') {
      if (!formData.scheduledDate) {
        newErrors.scheduledDate = 'Debes seleccionar una fecha';
      }
      if (!formData.scheduledTime) {
        newErrors.scheduledTime = 'Debes seleccionar una hora';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onNext(formData);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const audienceOptions = [
    { value: 'all', label: 'Todos los clientes' },
    { value: 'active', label: 'Clientes activos' },
    { value: 'inactive', label: 'Clientes inactivos' },
    { value: 'vip', label: 'Clientes VIP' },
    { value: 'delinquent', label: 'Clientes con deuda' },
  ];

  return (
    <div className="space-y-4 text-sm">
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 rounded-lg p-3">
        <h3 className="font-semibold text-indigo-900 mb-2 text-sm flex items-center gap-2">
          <span className="text-lg">⚙️</span> Configuración de Campaña
        </h3>
        <p className="text-sm text-indigo-700 font-medium">
          <span className="font-semibold">{communicationType.title}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Nombre de la Campaña *
          </label>
          <input
            type="text"
            name="campaignName"
            value={formData.campaignName}
            onChange={handleChange}
            placeholder="Ej: Campaña Q1"
            className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
              errors.campaignName ? 'border-red-500 bg-red-50' : 'border-indigo-300 bg-white'
            }`}
          />
          {errors.campaignName && (
            <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.campaignName}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Descripción *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe tu campaña..."
            rows="2"
            className={`w-full px-3 py-2 text-xs border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none ${
              errors.description ? 'border-red-500 bg-red-50' : 'border-indigo-300 bg-white'
            }`}
          />
          {errors.description && (
            <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.description}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Audiencia *
          </label>
          <select
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
          >
            {audienceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Tipo de Envío *
          </label>
          <select
            name="schedule"
            value={formData.schedule}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
          >
            <option value="immediate">Inmediato</option>
            <option value="scheduled">Programado</option>
          </select>
        </div>

        {formData.schedule === 'scheduled' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fecha *
              </label>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
                min={getTodayDate()}
                className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.scheduledDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.scheduledDate && (
                <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.scheduledDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Hora *
              </label>
              <input
                type="time"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleChange}
                className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.scheduledTime ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.scheduledTime && (
                <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.scheduledTime}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
        <p className="font-semibold mb-1">💡 Tip</p>
        <p>Mayor lectura en horarios de oficina (9 AM - 5 PM)</p>
      </div>

      <div className="flex gap-3 pt-3 border-t border-gray-300">
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs rounded-lg font-bold text-gray-700 bg-gradient-to-br from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 transition-all shadow-sm hover:shadow-md"
        >
          Atrás
        </button>
        <button
          onClick={handleSubmit}
          className="px-5 py-2 text-xs rounded-lg font-bold text-white bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg ml-auto"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default CommunicationStep2;
