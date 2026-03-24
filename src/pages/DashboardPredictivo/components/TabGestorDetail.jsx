import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDashboardStore } from '../../../store/dashboardStore';
import { getDashboardAgrupacion } from '../../../services/dashboard';
import GestorScorecard from './GestorScorecard';
import { Search, TrendingUp, Phone, CheckCircle, AlertTriangle, Star, User } from 'lucide-react';

const getBadge = (efectividad, llamadasCaidas) => {
  if (efectividad >= 20) return { label: 'Top Performer', emoji: '🌟', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200' };
  if (llamadasCaidas > 15) return { label: 'Riesgo Abandono', emoji: '⚠️', cls: 'bg-red-100 text-red-800 border border-red-200' };
  if (efectividad >= 12) return { label: 'Buen Desempeño', emoji: '👍', cls: 'bg-blue-100 text-blue-800 border border-blue-200' };
  return { label: 'En Seguimiento', emoji: '📋', cls: 'bg-slate-100 text-slate-600 border border-slate-200' };
};

const GestorCard = ({ item, onClick }) => {
  const realizadas = item.llamadas_realizadas || item.total_llamadas || 0;
  const atendidas = item.llamadas_atendidas || item.total_llamadas || 0;
  const gestiones = item.gestiones_exitosas || 0;
  // Prefer backend-computed rate, otherwise calculate
  const efectividad = item.tasa_exito_porcentaje != null
    ? Number(Number(item.tasa_exito_porcentaje).toFixed(1))
    : (atendidas > 0 ? Number(((gestiones / atendidas) * 100).toFixed(1)) : 0);
  const badge = getBadge(efectividad, item.llamadas_dejadas_caer || 0);
  const initial = (item.label || item.categoria || '?').charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-xl p-5 text-left hover:border-blue-400 hover:shadow-lg hover:shadow-blue-50 transition-all duration-200 relative overflow-hidden"
    >
      {/* Accent bar top */}
      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${efectividad >= 20 ? 'bg-emerald-500' : efectividad >= 12 ? 'bg-blue-500' : 'bg-slate-300'}`} />

      <div className="flex items-start gap-3 mb-4 mt-1">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-800 truncate text-sm">{item.label || item.categoria}</p>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${badge.cls}`}>
            {badge.emoji} {badge.label}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {realizadas !== atendidas && (
          <>
            <div className="bg-slate-50 rounded-lg py-2">
              <p className="text-xs text-slate-500 mb-0.5">Realizadas</p>
              <p className="font-bold text-slate-800 text-sm">{realizadas.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 rounded-lg py-2">
              <p className="text-xs text-slate-500 mb-0.5">Atendidas</p>
              <p className="font-bold text-slate-800 text-sm">{atendidas.toLocaleString()}</p>
            </div>
          </>
        )}
        {realizadas === atendidas && (
          <div className="col-span-2 bg-slate-50 rounded-lg py-2">
            <p className="text-xs text-slate-500 mb-0.5">Llamadas</p>
            <p className="font-bold text-slate-800 text-sm">{realizadas.toLocaleString()}</p>
          </div>
        )}
        <div className="bg-slate-50 rounded-lg py-2">
          <p className="text-xs text-slate-500 mb-0.5">Exitosas</p>
          <p className="font-bold text-slate-800 text-sm">{gestiones.toLocaleString()}</p>
        </div>
        <div className={`col-span-3 rounded-lg py-2 ${efectividad >= 20 ? 'bg-emerald-50' : efectividad >= 12 ? 'bg-blue-50' : 'bg-slate-50'}`}>
          <p className="text-xs text-slate-500 mb-0.5">Efectividad</p>
          <p className={`font-bold text-sm ${efectividad >= 20 ? 'text-emerald-600' : efectividad >= 12 ? 'text-blue-600' : 'text-slate-600'}`}>
            {efectividad}%
          </p>
        </div>
      </div>

      {/* Hover CTA */}
      <div className="mt-3 text-xs text-blue-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-center">
        Ver Scorecard Completo →
      </div>
    </button>
  );
};

const TabGestorDetail = () => {
  const filters = useDashboardStore(state => state.filters);
  const [selectedGestor, setSelectedGestor] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('efectividad');

  const { data, isLoading } = useQuery({
    queryKey: ['agrupacion', 'gestor', filters],
    queryFn: () => getDashboardAgrupacion('gestor', filters)
  });

  const gestores = useMemo(() => {
    let rawData = data;
    if (data && !Array.isArray(data) && Array.isArray(data.data)) rawData = data.data;
    if (!rawData || !Array.isArray(rawData)) return [];

    return rawData
      .map(item => {
        const realizadas = item.llamadas_realizadas || item.total_llamadas || 0;
        const atendidas = item.llamadas_atendidas || item.total_llamadas || 0;
        const gestiones = item.gestiones_exitosas || 0;
        const efectividad = item.tasa_exito_porcentaje != null
          ? Number(Number(item.tasa_exito_porcentaje).toFixed(1))
          : (atendidas > 0 ? Number(((gestiones / atendidas) * 100).toFixed(1)) : 0);
        return {
          ...item,
          label: item.categoria || item.gestor || item.nombre || item.name || 'Desconocido',
          efectividad,
          gestiones_exitosas: gestiones,
          total_llamadas: realizadas,
          llamadas_realizadas: realizadas,
          llamadas_atendidas: atendidas,
        };
      })
      .filter(item => item.label.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'efectividad') return b.efectividad - a.efectividad;
        if (sortBy === 'total_llamadas') return b.total_llamadas - a.total_llamadas;
        if (sortBy === 'gestiones_exitosas') return b.gestiones_exitosas - a.gestiones_exitosas;
        return 0;
      });
  }, [data, search, sortBy]);

  const stats = useMemo(() => {
    if (!gestores.length) return null;
    const total = gestores.length;
    const topPerformers = gestores.filter(g => g.efectividad >= 20).length;
    const enRiesgo = gestores.filter(g => (g.llamadas_dejadas_caer || 0) > 15).length;
    const avgEfect = (gestores.reduce((s, g) => s + g.efectividad, 0) / total).toFixed(1);
    return { total, topPerformers, enRiesgo, avgEfect };
  }, [gestores]);

  return (
    <div className="space-y-6">
      {/* Header + Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Detalle por Gestor</h2>
          <p className="text-sm text-slate-500 mt-0.5">Haz clic en cualquier tarjeta para ver el scorecard completo del gestor.</p>
        </div>
        {stats && (
          <div className="flex gap-3 text-center">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2">
              <p className="text-xs text-slate-500">Total</p>
              <p className="font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
              <p className="text-xs text-emerald-600">Top 🌟</p>
              <p className="font-bold text-emerald-700">{stats.topPerformers}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2">
              <p className="text-xs text-red-600">Riesgo ⚠️</p>
              <p className="font-bold text-red-700">{stats.enRiesgo}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
              <p className="text-xs text-blue-600">Efect. Prom.</p>
              <p className="font-bold text-blue-700">{stats.avgEfect}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar gestor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
        >
          <option value="efectividad">Ordenar: Efectividad</option>
          <option value="total_llamadas">Ordenar: Llamadas</option>
          <option value="gestiones_exitosas">Ordenar: Exitosas</option>
        </select>
      </div>

      {/* Grid de tarjetas */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse h-44">
              <div className="flex gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-12 bg-slate-100 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : gestores.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gestores.map((item, idx) => (
            <GestorCard
              key={idx}
              item={item}
              onClick={() => setSelectedGestor(item.label)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <User className="w-12 h-12 mb-3 opacity-40" />
          <p className="font-semibold">No se encontraron gestores</p>
          <p className="text-sm">{search ? 'Prueba con otro nombre' : 'Ajusta los filtros del dashboard'}</p>
        </div>
      )}

      {/* Scorecard Panel */}
      {selectedGestor && (
        <GestorScorecard gestor={selectedGestor} onClose={() => setSelectedGestor(null)} />
      )}
    </div>
  );
};

export default TabGestorDetail;
