import React, { useState } from 'react';
import FormField from './FormField';

const ProveedoresForm = ({ onSubmit, isSubmitting = false, onCancel }) => {
  const [formData, setFormData] = useState({
    nombreEmpresa: '',
    nit: '',
    direccion: '',
    telefonoEmpresa: '',
    nombreContacto: '',
    emailContacto: '',
    telefonoContacto: '',
  });

  const [selectedPermisos, setSelectedPermisos] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePermiso = (permiso) => {
    setSelectedPermisos(prev =>
      prev.includes(permiso)
        ? prev.filter(p => p !== permiso)
        : [...prev, permiso]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSubmit) {
      await onSubmit({ ...formData, permisos: selectedPermisos });
    }
  };

  const permisosDisponibles = [
    { id: 'leer_catalogos', label: 'Leer Catálogos' },
    { id: 'crear_ordenes', label: 'Crear Órdenes' },
    { id: 'ver_facturacion', label: 'Ver Facturación' },
    { id: 'descargar_reportes', label: 'Descargar Reportes' },
    { id: 'acceso_api', label: 'Acceso a API' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Datos de la Empresa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Nombre de la Empresa"
            name="nombreEmpresa"
            value={formData.nombreEmpresa}
            onChange={handleChange}
            placeholder="Empresa XYZ S.A."
            required
          />
          <FormField
            label="NIT"
            name="nit"
            value={formData.nit}
            onChange={handleChange}
            placeholder="123456789-1"
            required
          />
          <FormField
            label="Dirección"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            placeholder="Calle 123 # 45-67"
            required
          />
          <FormField
            label="Teléfono Empresa"
            name="telefonoEmpresa"
            type="tel"
            value={formData.telefonoEmpresa}
            onChange={handleChange}
            placeholder="3001234567"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Datos del Contacto</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Nombre Completo"
            name="nombreContacto"
            value={formData.nombreContacto}
            onChange={handleChange}
            placeholder="Juan Pérez"
            required
          />
          <FormField
            label="Email"
            name="emailContacto"
            type="email"
            value={formData.emailContacto}
            onChange={handleChange}
            placeholder="contacto@empresa.com"
            required
          />
          <FormField
            label="Teléfono del Contacto"
            name="telefonoContacto"
            type="tel"
            value={formData.telefonoContacto}
            onChange={handleChange}
            placeholder="3001234567"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Permisos de Acceso</h3>
        <div className="space-y-2">
          {permisosDisponibles.map(permiso => (
            <label
              key={permiso.id}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedPermisos.includes(permiso.id)}
                onChange={() => togglePermiso(permiso.id)}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">{permiso.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-3">Resumen</h4>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Empresa:</span> {formData.nombreEmpresa || '—'}
          </p>
          <p>
            <span className="font-medium">Contacto:</span> {formData.nombreContacto || '—'}
          </p>
          <p>
            <span className="font-medium">Email:</span> {formData.emailContacto || '—'}
          </p>
          <p>
            <span className="font-medium">Permisos:</span>{' '}
            {selectedPermisos.length > 0 ? selectedPermisos.join(', ') : 'Ninguno'}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Guardando...
            </>
          ) : (
            'Crear Proveedor'
          )}
        </button>
      </div>
    </form>
  );
};

export default ProveedoresForm;
