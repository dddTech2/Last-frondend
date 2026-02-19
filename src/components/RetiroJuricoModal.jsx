import React, { useState, useEffect } from 'react';
import ModernModal from './ModernModal';
import { AlertCircle, LogOut, X, Loader } from 'lucide-react';
import FormField from './FormField';
import { toast } from 'sonner';

/**
 * Modal para procesamiento de retiros jurídicos
 * Permite registrar y procesar el retiro completo del empleado
 */
const RetiroJuricoModal = ({
  isOpen,
  onClose,
  empleado = null,
  onSubmit,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState({
    cedula_empleado: '',
    fecha_retiro_efectiva: '',
    motivo_retiro: 'RENUNCIA',
    submotivo_retiro: '',
    beneficios_pendientes: '',
    cuentas_por_liquidar: '',
    observaciones: '',
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

    if (!formData.fecha_retiro_efectiva || formData.fecha_retiro_efectiva.trim() === '') {
      newErrors.fecha_retiro_efectiva = 'La fecha de retiro es requerida';
    }

    if (!formData.motivo_retiro || formData.motivo_retiro.trim() === '') {
      newErrors.motivo_retiro = 'El motivo del retiro es requerido';
    }

    if ((formData.motivo_retiro === 'RENUNCIA' || formData.motivo_retiro === 'OTRO') && (!formData.submotivo_retiro || formData.submotivo_retiro.trim() === '')) {
      newErrors.submotivo_retiro = 'El submotivo de retiro es requerido';
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
      cedula_empleado: formData.cedula_empleado,
      fecha_retiro: formData.fecha_retiro_efectiva,
      motivo_retiro: formData.motivo_retiro,
      submotivo_retiro: formData.submotivo_retiro,
      observacion_retiro: formData.observaciones,
      beneficios_pendientes: formData.beneficios_pendientes,
      cuentas_por_liquidar: formData.cuentas_por_liquidar,
      estado: 'RETIRADO',
    };

    await onSubmit(dataToSubmit);
  };

  if (!isOpen) return null;

  const motivosRetiro = [
    { value: 'RENUNCIA', label: 'Renuncia' },
    { value: 'DESPIDO', label: 'Despido' },
    { value: 'JUBILACION', label: 'Jubilación' },
    { value: 'INCAPACIDAD', label: 'Incapacidad' },
    { value: 'VENCIMIENTO_CONTRATO', label: 'Vencimiento de Contrato' },
    { value: 'MUTUO_ACUERDO', label: 'Mutuo Acuerdo' },
    { value: 'OTRO', label: 'Otro' },
  ];

  const submotivosRetiro = [
    { value: 'Mejor Oferta laboral (Oportunidad de Crecimiento)', label: 'Mejor Oferta laboral (Oportunidad de Crecimiento)' },
    { value: 'Incompatibilidad con el/la jefe', label: 'Incompatibilidad con el/la jefe' },
    { value: 'Interés en estudiar', label: 'Interés en estudiar' },
    { value: 'Remuneración', label: 'Remuneración' },
    { value: 'Dificultades con compañeros', label: 'Dificultades con compañeros' },
    { value: 'Horario Laboral', label: 'Horario Laboral' },
    { value: 'Otro - ver observaciones', label: 'Otro - ver observaciones' }
  ];

  const showSubmotivo = formData.motivo_retiro === 'RENUNCIA' || formData.motivo_retiro === 'OTRO';

  const modalActions = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="retiro-juridico-form"
        disabled={isSubmitting}
        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <LogOut className="h-4 w-4" />
            Procesar Retiro
          </>
        )}
      </button>
    </>
  );

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Retiro Sin Validación Jurídica"
      icon={
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
          <LogOut className="h-5 w-5 text-orange-600" />
        </div>
      }
      size="md"
      actions={modalActions}
    >
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          Procesar retiro del empleado inmediatamente. Esta acción marcará al empleado como RETIRADO en el sistema.
        </p>
      </div>

      <form id="retiro-juridico-form" onSubmit={handleSubmit} className="space-y-4">
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

        {/* Fecha de Retiro Efectiva */}
        <div>
          <FormField
            label="Fecha de Retiro Efectiva"
            name="fecha_retiro_efectiva"
            type="date"
            value={formData.fecha_retiro_efectiva}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
          {errors.fecha_retiro_efectiva && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.fecha_retiro_efectiva}
            </p>
          )}
        </div>

        {/* Motivo del Retiro */}
        <div>
          <FormField
            label="Motivo del Retiro"
            name="motivo_retiro"
            type="select"
            value={formData.motivo_retiro}
            onChange={handleChange}
            options={motivosRetiro}
            required
            disabled={isSubmitting}
          />
          {errors.motivo_retiro && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.motivo_retiro}
            </p>
          )}
        </div>

        {showSubmotivo && (
          <div>
            <FormField
              label="Submotivo del Retiro"
              name="submotivo_retiro"
              type="select"
              value={formData.submotivo_retiro}
              onChange={handleChange}
              options={submotivosRetiro}
              required
              error={errors.submotivo_retiro}
              disabled={isSubmitting}
            />
            {errors.submotivo_retiro && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> {errors.submotivo_retiro}
              </p>
            )}
          </div>
        )}

        {/* Beneficios Pendientes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Beneficios Pendientes (Opcional)
          </label>
          <textarea
            name="beneficios_pendientes"
            value={formData.beneficios_pendientes}
            onChange={handleChange}
            placeholder="Describe beneficios pendientes de pago o entrega..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            rows="2"
            disabled={isSubmitting}
          />
        </div>

        {/* Cuentas por Liquidar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cuentas por Liquidar (Opcional)
          </label>
          <textarea
            name="cuentas_por_liquidar"
            value={formData.cuentas_por_liquidar}
            onChange={handleChange}
            placeholder="Detalles de cuentas o saldos a liquidar..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            rows="2"
            disabled={isSubmitting}
          />
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones (Opcional)
          </label>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            placeholder="Notas adicionales sobre el retiro..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            rows="2"
            disabled={isSubmitting}
          />
        </div>

        {/* Info Box */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
          <p className="font-semibold mb-1">⚠️ Importante</p>
          <p>Esta acción marcará al empleado como RETIRADO inmediatamente.</p>
        </div>
      </form>
    </ModernModal>
  );
};

export default RetiroJuricoModal;
