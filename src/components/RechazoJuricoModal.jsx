import React, { useState, useEffect } from 'react';
import { AlertCircle, XCircle, X, Loader } from 'lucide-react';
import FormField from './FormField';
import { toast } from 'sonner';

/**
 * Modal para rechazar ingresos o retiros jurídicamente
 * Permite al departamento jurídico rechazar solicitudes con motivos
 */
const RechazoJuricoModal = ({ 
  isOpen, 
  onClose, 
  empleado = null, 
  tipoRechazo = 'INGRESO', // INGRESO o RETIRO
  onSubmit, 
  isSubmitting = false 
}) => {
  const [formData, setFormData] = useState({
    cedula_empleado: '',
    motivo_rechazo: '',
    observacion_detallada: '',
    fecha_rechazo: new Date().toISOString().split('T')[0],
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

    if (!formData.motivo_rechazo || formData.motivo_rechazo.trim() === '') {
      newErrors.motivo_rechazo = 'El motivo del rechazo es requerido';
    }

    if (!formData.observacion_detallada || formData.observacion_detallada.trim() === '') {
      newErrors.observacion_detallada = 'Debe incluir una observación detallada';
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

    const estadoRechazo = tipoRechazo === 'INGRESO' 
      ? 'RECHAZO_JURIDICO' 
      : 'RECHAZO_RETIRO_JURIDICO';

    const dataToSubmit = {
      ...formData,
      estado: estadoRechazo,
      tipo_rechazo: tipoRechazo,
      accion: 'RECHAZAR_JURIDICO',
    };

    await onSubmit(dataToSubmit);
  };

  if (!isOpen) return null;

  const motivosRechazo = tipoRechazo === 'INGRESO' 
    ? [
        { value: 'DOCUMENTACION_INCOMPLETA', label: 'Documentación Incompleta' },
        { value: 'ANTECEDENTES_PENALES', label: 'Antecedentes Penales' },
        { value: 'INCONSISTENCIAS_DATOS', label: 'Inconsistencias en Datos' },
        { value: 'INCOMPATIBILIDAD_CARGO', label: 'Incompatibilidad con Cargo' },
        { value: 'FRAUDE_DOCUMENTAL', label: 'Fraude Documental' },
        { value: 'OTRO', label: 'Otro' },
      ]
    : [
        { value: 'OBLIGACIONES_PENDIENTES', label: 'Obligaciones Pendientes' },
        { value: 'IRREGULARIDADES_ADMINISTRATIVAS', label: 'Irregularidades Administrativas' },
        { value: 'PROCESO_DISCIPLINARIO', label: 'Proceso Disciplinario' },
        { value: 'DOCUMENTACION_INCOMPLETA', label: 'Documentación Incompleta' },
        { value: 'OTRO', label: 'Otro' },
      ];

  const isIngreso = tipoRechazo === 'INGRESO';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Rechazo Jurídico</h3>
              <p className="text-sm text-gray-500">
                {isIngreso ? 'Rechazo de ingreso' : 'Rechazo de retiro'} de empleado
              </p>
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

          {/* Motivo del Rechazo */}
          <div>
            <FormField
              label="Motivo del Rechazo"
              name="motivo_rechazo"
              type="select"
              value={formData.motivo_rechazo}
              onChange={handleChange}
              options={motivosRechazo}
              required
              disabled={isSubmitting}
            />
            {errors.motivo_rechazo && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> {errors.motivo_rechazo}
              </p>
            )}
          </div>

          {/* Observación Detallada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observación Detallada *
            </label>
            <textarea
              name="observacion_detallada"
              value={formData.observacion_detallada}
              onChange={handleChange}
              placeholder="Proporciona detalles específicos del rechazo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows="4"
              disabled={isSubmitting}
              required
            />
            {errors.observacion_detallada && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> {errors.observacion_detallada}
              </p>
            )}
          </div>

          {/* Fecha */}
          <div>
            <FormField
              label="Fecha del Rechazo"
              name="fecha_rechazo"
              type="date"
              value={formData.fecha_rechazo}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Warning Box */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            <p className="font-semibold mb-1">⚠️ Acción Irreversible</p>
            <p>
              {isIngreso 
                ? 'El empleado será marcado como RECHAZO_JURIDICO.' 
                : 'El empleado será marcado como RECHAZO_RETIRO_JURIDICO.'}
            </p>
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
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Rechazando...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Rechazar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RechazoJuricoModal;
