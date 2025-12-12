import React, { useState, useMemo } from 'react';
import { Search, Save, Loader2, UserCog, Hash, Wifi, Users, ArrowLeft, AlertCircle } from 'lucide-react';
import FormField from './FormField';

const AsignacionForm = ({ employees = [], onSubmit, onCancel, isSubmitting = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    adminfo: '',
    asignacion: '', // Se envía como "asignacion" al backend
    jefe_inmediato: '',
  });

  // Obtener lista única de jefes inmediatos para el dropdown
  const jefesInmediatos = useMemo(() => {
    const jefesSet = new Set();
    employees.forEach(emp => {
      if (emp.jefe_inmediato && typeof emp.jefe_inmediato === 'string' && emp.jefe_inmediato.trim()) {
        jefesSet.add(emp.jefe_inmediato.trim());
      }
    });
    return Array.from(jefesSet).sort();
  }, [employees]);

  // Filter employees based on search term and pending status
  const filteredEmployees = useMemo(() => {
    if (!searchTerm && !showPendingOnly) return [];
    
    let result = employees;

    // Filter by pending data - sin adminfo asignado
    if (showPendingOnly) {
      result = result.filter(emp => !emp.adminfo);
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
    
    // Función para convertir cualquier valor a string seguro
    const safeString = (val) => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return '';
      return String(val);
    };

    // Leer de los campos existentes
    // Backend devuelve: adminfo, usuario_red (pero PUT acepta "asignacion")
    setFormData({
      adminfo: safeString(emp.adminfo),
      asignacion: safeString(emp.usuario_red), // Leer de usuario_red
      jefe_inmediato: safeString(emp.jefe_inmediato),
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    // Payload para el PUT - usar nombres que acepta el backend
    const payload = {
      cedula: selectedEmployee.cedula,
      adminfo: formData.adminfo,
      asignacion: formData.asignacion, // Backend acepta "asignacion"
      jefe_inmediato: formData.jefe_inmediato,
    };
    
    onSubmit(payload);
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

        <div className="space-y-4">
          <FormField
            label="Código Adminfo"
            name="adminfo"
            value={formData.adminfo}
            onChange={handleChange}
            icon={<Hash className="h-4 w-4 text-gray-400" />}
            placeholder="Ej: ADM001"
          />
          
          <FormField
            label="Asignación"
            name="asignacion"
            value={formData.asignacion}
            onChange={handleChange}
            icon={<Wifi className="h-4 w-4 text-gray-400" />}
            placeholder="Usuario de red / equipo asignado"
          />

          {/* Dropdown de Jefe Inmediato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              Jefe Inmediato / Coordinador
            </label>
            <select
              name="jefe_inmediato"
              value={formData.jefe_inmediato}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="">Seleccionar jefe inmediato...</option>
              {jefesInmediatos.map(jefe => (
                <option key={jefe} value={jefe}>
                  {jefe}
                </option>
              ))}
            </select>
            {/* Opción para escribir manualmente si no está en la lista */}
            <p className="text-xs text-gray-500 mt-1">
              ¿No está en la lista? Escríbelo manualmente:
            </p>
            <input
              type="text"
              name="jefe_inmediato"
              value={formData.jefe_inmediato}
              onChange={handleChange}
              placeholder="Escribir nombre del jefe inmediato..."
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
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
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 disabled:opacity-50"
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
                Guardar Asignación
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
      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
        <p className="text-sm text-indigo-800 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Busca un empleado para asignar código Adminfo, usuario de red y coordinador.
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
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pb-2">
        <input
          type="checkbox"
          id="pendingOnlyAsig"
          checked={showPendingOnly}
          onChange={(e) => setShowPendingOnly(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="pendingOnlyAsig" className="text-sm text-gray-700 cursor-pointer select-none">
          Mostrar solo empleados sin código Adminfo
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
                  {emp.adminfo && (
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                      {emp.adminfo}
                    </span>
                  )}
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
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

export default AsignacionForm;
