import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { getEmployees } from '../services/api';
import { AlertCircle, Loader } from 'lucide-react';

const isCargoExcluido = (cargoStr) => {
  if (!cargoStr) return false;
  const upper = cargoStr.toString().trim().toUpperCase();

  // Excluir cualquier cargo que contenga GESTOR, AUXILIAR SERVICIOS, ASISTENTE VENTAS/ADMINISTRATIVO, ABOGADO JUNIOR
  if (upper.includes('GESTOR')) return true;
  if (upper.includes('AUXILIAR SERVICIOS') || upper.includes('AUX SERVICIOS')) return true;
  if (upper.includes('ASISTENTE VENTAS') || upper.includes('ASISTENTE ADMINISTRATIVO')) return true;
  if (upper.includes('ABOGADO JUNIOR')) return true;

  return false;
};

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
  const [inputValue, setInputValue] = useState('');

  // Cargar todos los empleados activos excluyendo los cargos no permitidos como jefe
  useEffect(() => {
    const loadEmployees = async () => {
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
        let allEmployees = [];
        let page = 1;
        let hasMore = true;

        // Obtener todos los empleados activos paginados
        while (hasMore) {
          const response = await getEmployees({
            page,
            size: 100,
            estado: 'ACTIVO',
          });

          const empleados = Array.isArray(response)
            ? response
            : response?.items
              ? response.items
              : response?.data
                ? response.data
                : [];

          allEmployees = [...allEmployees, ...empleados];

          const totalPages = response?.pages || response?.total_pages;
          if (empleados.length < 100 || (totalPages && page >= totalPages)) {
            hasMore = false;
          } else {
            page++;
          }
        }

        // Filtrar empleados válidos: activos y sin cargo excluido
        const selectOptions = allEmployees
          .filter((emp) => {
            if (!emp || !emp.nombre || !emp.cedula) return false;
            // Estado activo
            if (emp.estado && emp.estado.toString().toUpperCase() !== 'ACTIVO') {
              return false;
            }
            // Excluir cargos no permitidos
            if (isCargoExcluido(emp.cargo)) {
              return false;
            }
            return true;
          })
          .map((emp) => ({
            value: emp.cedula,
            label: `${emp.nombre} (${emp.cargo || 'Sin cargo'})`,
            cargo: emp.cargo,
            cedula: emp.cedula,
            nombre: emp.nombre,
          }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));

        setOptions(selectOptions);
      } catch (error) {
        console.error('Error al cargar empleados para jefe inmediato:', error);
        setLoadError(error.message || 'Error al cargar empleados');
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
      // Buscar por Cédula (value) O por Nombre (si el backend devuelve el nombre)
      const selected = options.find(
        (opt) =>
          opt.value === value ||
          opt.cedula === value ||
          (opt.nombre && value && opt.nombre.toString().toUpperCase() === value.toString().toUpperCase())
      );
      setSelectedValue(selected || null);
    } else {
      setSelectedValue(null);
    }
  }, [value, options]);

  // Mostrar opciones únicamente si el usuario ha escrito al menos 4 caracteres
  const displayedOptions = useMemo(() => {
    if (inputValue.trim().length < 4) {
      return selectedValue ? [selectedValue] : [];
    }
    return options;
  }, [inputValue, options, selectedValue]);

  const customStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: error ? '#dc2626' : state.isFocused ? '#16a34a' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(22, 163, 74, 0.1)' : 'none',
      backgroundColor: disabled || cargo === 'GERENTE GENERAL' ? '#f3f4f6' : 'white',
      cursor: disabled || cargo === 'GERENTE GENERAL' ? 'not-allowed' : 'pointer',
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
        {required && cargo !== 'GERENTE GENERAL' && <span className="text-red-500 ml-1">*</span>}
      </label>

      <Select
        options={displayedOptions}
        value={selectedValue}
        inputValue={inputValue}
        onInputChange={(newVal, actionMeta) => {
          if (actionMeta.action === 'input-change') {
            setInputValue(newVal);
          } else if (actionMeta.action === 'menu-close' && !newVal) {
            setInputValue('');
          }
        }}
        onChange={(option) => {
          setSelectedValue(option);
          setInputValue('');
          onChange({
            target: {
              name: 'jefe_inmediato',
              value: option?.value || '',
            },
          });
        }}
        onBlur={onBlur}
        isDisabled={disabled || loading || cargo === 'GERENTE GENERAL'}
        isClearable
        isSearchable
        placeholder={
          cargo === 'GERENTE GENERAL'
            ? 'No requiere jefe inmediato'
            : loading
              ? 'Cargando empleados...'
              : 'Escribe al menos 4 letras para buscar...'
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
          if (loading) return 'Cargando empleados...';
          if (loadError) return `Error: ${loadError}`;
          if (inputValue.trim().length < 4) {
            return 'Escribe al menos 4 letras para buscar...';
          }
          return 'No se encontraron empleados con ese nombre';
        }}
      />

      {error && cargo !== 'GERENTE GENERAL' && (
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

