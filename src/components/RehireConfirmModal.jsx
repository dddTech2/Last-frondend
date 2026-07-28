import React from 'react';
import ModernModal from './ModernModal';
import { UserCheck, AlertTriangle, Loader2 } from 'lucide-react';

const RehireConfirmModal = ({ isOpen, onClose, onConfirm, cedula, isSubmitting }) => {
  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Procesar Reintegro de Extrabajador"
      icon={<UserCheck className="h-6 w-6 text-amber-600" />}
      size="md"
      actions={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 text-white bg-amber-600 hover:bg-amber-700 rounded-lg font-medium shadow transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Procesando Reintegro...</span>
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4" />
                <span>Sí, procesar reintegro</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-amber-900">Extrabajador Retirado Detectado</h4>
            <p className="text-sm text-amber-800">
              La cédula <span className="font-bold text-amber-950">{cedula}</span> pertenece a un extrabajador previamente retirado de la compañía.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm text-gray-700 space-y-2">
          <p className="font-medium text-gray-900">
            ¿Deseas procesar su reintegro con los datos ingresados en el formulario?
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Se registrará una nueva vinculación con la nueva fecha de ingreso, cargo, área y jefe inmediato.</li>
            <li>Se dispararán automáticamente las notificaciones por correo de nuevo ingreso.</li>
            <li>El historial de contratos anteriores se conservará intacto para consulta.</li>
          </ul>
        </div>
      </div>
    </ModernModal>
  );
};

export default RehireConfirmModal;
