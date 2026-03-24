import React from 'react';
import Select from 'react-select';
import { useQuery } from '@tanstack/react-query';
import { useDashboardStore } from '../../../store/dashboardStore';
import { getDashboardOpciones } from '../../../services/dashboard';
import { Filter, Calendar, Zap } from 'lucide-react';

const DashboardSidebar = () => {
  const { filters, setFilters, resetFilters } = useDashboardStore();

  const { data: opciones = {}, isLoading } = useQuery({
    queryKey: ['dashboardOpciones'],
    queryFn: getDashboardOpciones,
    staleTime: Infinity,
  });

  const handleDateChange = (e) => {
    setFilters({ [e.target.name]: e.target.value });
  };

  const createOptions = (arr) => (arr || []).map(item => ({ value: item, label: item }));

  const customStyles = {
    control: (base) => ({
      ...base,
      borderColor: '#e2e8f0',
      minHeight: '38px',
      '&:hover': { borderColor: '#cbd5e1' }
    })
  };

  return (
    <div className="w-80 bg-white border-r border-slate-200 h-full flex flex-col shadow-sm flex-shrink-0 z-10">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-800 font-bold">
          <Filter className="w-5 h-5 text-blue-600" />
          <span>Filtros Globales</span>
        </div>
        <button 
          onClick={resetFilters}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Limpiar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Rango de Fechas */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Periodo Analizado
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
              <input
                type="date"
                name="fecha_inicio"
                value={filters.fecha_inicio}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
              <input
                type="date"
                name="fecha_fin"
                value={filters.fecha_fin}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Dimensiones Multi-select */}
        <div className="space-y-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 pt-5">
            Segmentación Dinámica
          </h3>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sistemas de Origen</label>
            <Select 
              isMulti
              isLoading={isLoading}
              options={createOptions(opciones.sistemas_origen)}
              value={filters.sistemas_origen.map(s => ({ value: s, label: s }))}
              onChange={(selected) => setFilters({ sistemas_origen: selected.map(s => s.value) })}
              placeholder="Todos los orígenes..."
              className="text-sm react-select-container"
              classNamePrefix="react-select"
              styles={customStyles}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Coordinadores</label>
            <Select 
              isMulti
              isLoading={isLoading}
              options={createOptions(opciones.coordinadores)}
              value={filters.coordinadores.map(s => ({ value: s, label: s }))}
              onChange={(selected) => setFilters({ coordinadores: selected.map(s => s.value) })}
              placeholder="Cualquier coordinador..."
              className="text-sm react-select-container"
              classNamePrefix="react-select"
              styles={customStyles}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categorías de Contacto</label>
            <Select 
              isMulti
              isLoading={isLoading}
              options={createOptions(opciones.categorias_contacto)}
              value={filters.categorias_contacto.map(s => ({ value: s, label: s }))}
              onChange={(selected) => setFilters({ categorias_contacto: selected.map(s => s.value) })}
              placeholder="Todas las categorías..."
              className="text-sm react-select-container"
              classNamePrefix="react-select"
              styles={customStyles}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Franjas Horarias</label>
            <Select 
              isMulti
              isLoading={isLoading}
              options={createOptions(opciones.franjas)}
              value={filters.franjas.map(s => ({ value: s, label: s }))}
              onChange={(selected) => setFilters({ franjas: selected.map(s => s.value) })}
              placeholder="Todas las franjas..."
              className="text-sm react-select-container"
              classNamePrefix="react-select"
              styles={customStyles}
            />
          </div>
        </div>
      </div>

      {/* Alertas Inteligentes */}
      <div className="p-4 m-4 bg-orange-50 border border-orange-100 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
          <h4 className="font-semibold text-orange-800 text-sm">Actualización Activa</h4>
        </div>
        <p className="text-xs text-orange-700 leading-relaxed font-medium">
          Los gráficos reaccionarán instantáneamente al ajustar estos selectores. Múltiples opciones permitidas.
        </p>
      </div>
    </div>
  );
};

export default DashboardSidebar;
