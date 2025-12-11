import React, { useState, useMemo } from 'react';
import { Search, Save, Loader2, Monitor, Wifi, Mail, Phone, Hash, ArrowLeft, AlertCircle } from 'lucide-react';
import FormField from './FormField';

const TecnologiaForm = ({ employees = [], onSubmit, onCancel, isSubmitting = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    correo_renovar: '',
    extension_3cx: '',
    cola: '',
    adminfo: '',
    asignacion: '',
  });

  // Filter employees based on search term and pending status
  const filteredEmployees = useMemo(() => {
    // If no search term and not filtering by pending, show nothing (or could show all)
    if (!searchTerm && !showPendingOnly) return [];
    
    let result = employees;

    // Filter by pending data if toggle is on
    // We consider "pending" if any of the tech fields are missing/empty
    if (showPendingOnly) {
      result = result.filter(emp => 
        !emp.correo_renovar || 
        !emp.extension_3cx || 
        !emp.cola || 
        !emp.adminfo || 
        !emp.asignacion
      );
    }

    // Filter by search term (Name or Cedula)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(emp => 
        (emp.nombre || '').toLowerCase().includes(term) ||
        (emp.cedula || '').includes(term)
      );
    }

    return result.slice(0, 20); // Limit results for performance
  }, [employees, searchTerm, showPendingOnly]);

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      correo_renovar: emp.correo_renovar || '',
      extension_3cx: emp.extension_3cx || '',
      cola: emp.cola || '',
      adminfo: emp.adminfo || '',
      asignacion: emp.asignacion || '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    onSubmit({ cedula: selectedEmployee.cedula, ...formData });
  };

  // --- VIEW: EDIT FORM ---
  if (selectedEmployee) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
          <button 
            type="button" 
            onClick={() => setSelectedEmployee(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
            title="Volver a la búsqueda"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{selectedEmployee.nombre}</h3>
            <p className="text-sm text-gray-500">{selectedEmployee.cargo} • {selectedEmployee.area}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Correo Renovar"
            name="correo_renovar"
            type="email"
            value={formData.correo_renovar}
            onChange={handleChange}
            icon={<Mail className="h-4 w-4 text-gray-400" />}
            placeholder="usuario@renovar.com"
          />
          <FormField
            label="Extensión 3CX"
            name="extension_3cx"
            value={formData.extension_3cx}
            onChange={handleChange}
            icon={<Phone className="h-4 w-4 text-gray-400" />}
            placeholder="Ej: 101"
          />
          <FormField
            label="Cola"
            name="cola"
            value={formData.cola}
            onChange={handleChange}
            icon={<Hash className="h-4 w-4 text-gray-400" />}
            placeholder="Ej: Ventas"
          />
          <FormField
            label="Usuario del Sistema (Adminfo)"
            name="adminfo"
            value={formData.adminfo}
            onChange={handleChange}
            icon={<Monitor className="h-4 w-4 text-gray-400" />}
            placeholder="Usuario Adminfo"
          />
          <FormField
            label="Usuario de Red (Asignación)"
            name="asignacion"
            value={formData.asignacion}
            onChange={handleChange}
            icon={<Wifi className="h-4 w-4 text-gray-400" />}
            placeholder="Usuario de Red / Equipo"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setSelectedEmployee(null)}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    );
  }

  // --- VIEW: SEARCH & LIST ---
  return (
    <div className="space-y-4 min-h-[400px]">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
        <p className="text-sm text-blue-800 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Busca un empleado por nombre o cédula para actualizar su información tecnológica.
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pb-2">
        <input
          type="checkbox"
          id="pendingOnly"
          checked={showPendingOnly}
          onChange={(e) => setShowPendingOnly(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="pendingOnly" className="text-sm text-gray-700 cursor-pointer select-none">
          Mostrar solo empleados con datos pendientes
        </label>
      </div>

      <div className="border rounded-lg divide-y divide-gray-100 max-h-[300px] overflow-y-auto bg-white shadow-sm">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map(emp => (
            <button
              key={emp.cedula}
              onClick={() => handleSelectEmployee(emp)}
              className="w-full text-left p-3 hover:bg-gray-50 transition-colors flex items-center justify-between group"
            >
              <div>
                <p className="font-medium text-gray-900">{emp.nombre}</p>
                <div className="flex gap-2 text-xs text-gray-500 mt-1">
                  <span className="bg-gray-100 px-2 py-0.5 rounded">{emp.cedula}</span>
                  <span>{emp.cargo}</span>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                  Seleccionar
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || showPendingOnly 
              ? 'No se encontraron empleados con esos criterios.' 
              : 'Utiliza el buscador o el filtro para encontrar empleados.'}
          </div>
        )}
      </div>
      
      <div className="flex justify-end pt-4 border-t border-gray-100 mt-auto">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default TecnologiaForm;
