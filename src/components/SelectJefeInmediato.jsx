import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { getEmployees } from '../services/api';
import { AlertCircle, Loader } from 'lucide-react';

const SelectJefeInmediato = ({
  cargo,
  value,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  error = null,
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Mapeo de cargos a roles para buscar
  const cargoToRoles = {
    // GESTORES reportan a COORDINADORES
    'GESTOR DE COBRANZA': ['COORDINADOR DE COBRANZA'],

    // ANALISTAS (cualquier tipo) reportan a DIRECTORES
    'ANALISTA TI': ['DIRECTOR JURIDICO', 'DIRECTOR ADMINISTRATIVO Y FINANCIERA', 'DIRECTORA DE OPERACIONES'],
    'ANALISTA JUNIOR': ['DIRECTOR JURIDICO', 'DIRECTOR ADMINISTRATIVO Y FINANCIERA', 'DIRECTORA DE OPERACIONES'],
    'ANALISTA SIG': ['DIRECTOR JURIDICO', 'DIRECTOR ADMINISTRATIVO Y FINANCIERA', 'DIRECTORA DE OPERACIONES'],
    'CIENTIFICO DATOS': ['DIRECTOR JURIDICO', 'DIRECTOR ADMINISTRATIVO Y FINANCIERA', 'DIRECTORA DE OPERACIONES'],

    // COORDINADORES reportan a DIRECTORES
    'COORDINADOR': ['DIRECTOR JURIDICO', 'DIRECTOR ADMINISTRATIVO Y FINANCIERA', 'DIRECTORA DE OPERACIONES'],

    // DIRECTORES reportan a GERENTE GENERAL o DIRECTORES superiores
    'DIRECTOR JURIDICO': ['GERENTE GENERAL', 'DIRECTOR ADMINISTRATIVO Y FINANCIERA'],
    'DIRECTOR ADMINISTRATIVO Y FINANCIERA': ['GERENTE GENERAL', 'DIRECTORA DE OPERACIONES'],
    'DIRECTORA DE OPERACIONES': ['GERENTE GENERAL', 'DIRECTOR ADMINISTRATIVO Y FINANCIERA'],

    // OTROS cargos
    'ABOGADO JUNIOR': ['DIRECTOR JURIDICO'],
    'ASISTENTE VENTAS': ['COORDINADOR', 'GESTOR'],
    'AUX SERVICIOS GENERALES': ['COORDINADOR', 'DIRECTOR ADMINISTRATIVO Y FINANCIERA'],
    'LIDER DE PROCESOS': ['DIRECTORA DE OPERACIONES'],
    'SUBDIRECTOR': ['GERENTE GENERAL', 'DIRECTOR ADMINISTRATIVO Y FINANCIERA', 'DIRECTORA DE OPERACIONES'],
    'GERENTE GENERAL': [], // Gerente General no tiene jefe
  };

  // Cargar empleados con los roles correspondientes
  useEffect(() => {
    const loadEmployees = async () => {
      if (!cargo) {
        setOptions([]);
        setLoadError(null);
        return;
      }

      // GERENTE GENERAL no requiere jefe
      if (cargo === 'GERENTE GENERAL') {
        setOptions([]);
        setLoadError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);
      try {
        console.log('Iniciando carga para cargo:', cargo);

        // Obtener los roles permitidos para este cargo
        const rolesPermitidos = cargoToRoles[cargo] || [];
        console.log('Roles permitidos:', rolesPermitidos);

        if (rolesPermitidos.length === 0) {
          console.log('No hay roles permitidos para este cargo');
          setOptions([]);
          setLoading(false);
          return;
        }

        let allEmployees = [];

        // Obtener empleados para cada rol
        for (let i = 0; i < rolesPermitidos.length; i++) {
          try {
            console.log(`Fetcheando empleados con cargo: ${rolesPermitidos[i]}`);
            const response = await getEmployees({
              cargo: rolesPermitidos[i],
            });

            console.log(`Respuesta para ${rolesPermitidos[i]}:`, response);

            // Manejar diferentes formatos de respuesta
            const empleados = Array.isArray(response)
              ? response
              : response?.items  // ← Buscar en "items" primero
                ? response.items
                : response?.data
                  ? response.data
                  : [];

            console.log(`Empleados parseados para ${rolesPermitidos[i]}:`, empleados);
            allEmployees = [...allEmployees, ...empleados];
          } catch (err) {
            console.error(`Error fetching employees for cargo ${rolesPermitidos[i]}:`, err);
            setLoadError(`Error al cargar ${rolesPermitidos[i]}: ${err.message}`);
          }
        }

        console.log('Total de empleados encontrados:', allEmployees);

        // Convertir a opciones de react-select
        const selectOptions = allEmployees
          .filter(emp => emp && emp.nombre && emp.cedula) // Asegurar que tiene nombre y cédula
          .map(emp => ({
            value: emp.cedula,
            label: `${emp.nombre} (${emp.cargo || 'Sin cargo'})`,
            cargo: emp.cargo,
            cedula: emp.cedula,
            nombre: emp.nombre,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)); // Ordenar alfabéticamente

        console.log('Opciones generadas:', selectOptions);
        setOptions(selectOptions);
      } catch (error) {
        console.error('Error inesperado en loadEmployees:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          stack: error.stack
        });
        setLoadError(`Error: ${error.message}`);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, [cargo]);

  // Actualizar el valor seleccionado
  useEffect(() => {
    if (value && options.length > 0) {
      const selected = options.find(opt => opt.value === value || opt.cedula === value);
      setSelectedValue(selected || null);
    } else {
      setSelectedValue(null);
    }
  }, [value, options]);

  const customStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: error ? '#dc2626' : state.isFocused ? '#16a34a' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(22, 163, 74, 0.1)' : 'none',
      backgroundColor: disabled ? '#f3f4f6' : 'white',
      cursor: disabled ? 'not-allowed' : 'pointer',
      minHeight: '40px',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#16a34a' : state.isFocused ? '#dcfce7' : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      cursor: 'pointer',
      padding: '10px 12px',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af',
    }),
    input: (base) => ({
      ...base,
      color: '#1f2937',
    }),
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Jefe Inmediato
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <Select
        options={options}
        value={selectedValue}
        onChange={(option) => {
          setSelectedValue(option);
          onChange({
            target: {
              name: 'jefe_inmediato',
              value: option?.value || '',
            },
          });
        }}
        onBlur={onBlur}
        isDisabled={disabled || loading || !cargo || cargo === 'GERENTE GENERAL' || options.length === 0}
        isClearable
        isSearchable
        placeholder={
          cargo === 'GERENTE GENERAL'
            ? 'No requiere jefe inmediato'
            : loading
              ? 'Cargando empleados...'
              : cargo
                ? 'Busca el jefe inmediato'
                : 'Selecciona un cargo primero'
        }
        styles={customStyles}
        formatOptionLabel={(option) => (
          <div className="flex justify-between items-center">
            <span>{option.nombre}</span>
            <span className="text-xs text-gray-500 ml-2">({option.cargo})</span>
          </div>
        )}
        noOptionsMessage={() => {
          if (cargo === 'GERENTE GENERAL') return 'Este cargo no requiere jefe inmediato';
          if (!cargo) return 'Selecciona un cargo primero';
          if (loading) return 'Cargando empleados...';
          if (loadError) return `Error: ${loadError}`;
          return 'No hay empleados disponibles para este cargo';
        }}
      />

      {error && (
        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}

      {loadError && (
        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" /> Error al cargar: {loadError}
        </p>
      )}

      {loading && (
        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
          <Loader className="h-4 w-4 animate-spin" /> Cargando empleados...
        </p>
      )}
    </div>
  );
};

export default SelectJefeInmediato;
