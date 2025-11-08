import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, X, Loader } from 'lucide-react';
import FormField from './FormField';
import { toast } from 'sonner';

/**
 * Modal para aprobar retiros jurídicos de empleados
 * Permite al departamento jurídico aprobar solicitudes de retiro
 */
const AprobacionRetiroJuricoModal = ({ 
  isOpen, 
  onClose, 
  empleado = null, 
  onSubmit, 
  isSubmitting = false 
}) => {
  const [formData, setFormData] = useState({
    cedula_empleado: '',
    observacion_aprobacion: '',
    fecha_aprobacion: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (empleado) {
      setFormData(prev => ({
        ...prev,
        cedula_empleado: empleado.cedula || '',
      }));
    }
  }, [empleado]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo si existe
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.cedula_empleado || formData.cedula_empleado.trim() === '') {
      newErrors.cedula_empleado = 'La cédula es requerida';
    }

    if (!formData.fecha_aprobacion || formData.fecha_aprobacion.trim() === '') {
      newErrors.fecha_aprobacion = 'La fecha es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    const dataToSubmit = {
      ...formData,
      estado: 'RETIRADO', // Cambiar a RETIRADO al aprobar
      accion: 'APROBAR_RETIRO_JURIDICO',
    };

    await onSubmit(dataToSubmit);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Aprobar Retiro Jurídico</h3>
              <p className="text-sm text-gray-500">Aprobación de retiro pendiente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Cédula */}
          <div>
            <FormField
              label="Cédula del Empleado"
              name="cedula_empleado"
              type="text"
              value={formData.cedula_empleado}
              onChange={handleChange}
              placeholder="Ej: 1234567890"
              required
              disabled={isSubmitting || !!empleado}
            />
            {errors.cedula_empleado && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> {errors.cedula_empleado}
              </p>
            )}
          </div>

          {/* Fecha de Aprobación */}
          <div>
            <FormField
              label="Fecha de Aprobación"
              name="fecha_aprobacion"
              type="date"
              value={formData.fecha_aprobacion}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
            {errors.fecha_aprobacion && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> {errors.fecha_aprobacion}
              </p>
            )}
          </div>

          {/* Observación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observación (Opcional)
            </label>
            <textarea
              name="observacion_aprobacion"
              value={formData.observacion_aprobacion}
              onChange={handleChange}
              placeholder="Notas adicionales sobre la aprobación..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows="3"
              disabled={isSubmitting}
            />
          </div>

          {/* Info Box */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            <p className="font-semibold mb-1">ℹ️ Información</p>
            <p>Al aprobar, el empleado pasará a estado "RETIRADO".</p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Aprobando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Aprobar Retiro
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AprobacionRetiroJuricoModal;
