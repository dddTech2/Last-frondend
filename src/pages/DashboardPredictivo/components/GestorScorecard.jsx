import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import { X, TrendingUp, TrendingDown, Phone, Clock, DollarSign, AlertTriangle, Star, User } from 'lucide-react';
import { useDashboardStore } from '../../../store/dashboardStore';
import { getDashboardGestorResumen } from '../../../services/dashboard';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const formatSeconds = (secs) => {
  if (!secs) return '0m 0s';
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}m ${s}s`;
};

const formatMoney = (val) => {
  if (!val && val !== 0) return '$0';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
};

// Fila de métrica con icono, label, value y nota opcional
const MetricRow = ({ icon, label, value, note, noteColor = 'text-slate-400' }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
    <div className="text-right">
      <span className="text-sm font-bold text-slate-900">{value}</span>
      {note && <p className={`text-xs mt-0.5 ${noteColor}`}>{note}</p>}
    </div>
  </div>
);

const MetricGroup = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
    </div>
    <div className="px-5">{children}</div>
  </div>
);

const GestorScorecard = ({ gestor, onClose }) => {
  const filters = useDashboardStore(state => state.filters);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['gestor-resumen', gestor, filters],
    queryFn: () => getDashboardGestorResumen(gestor, filters),
    enabled: !!gestor,
  });

  const m = data?.metricas || {};
  const tendencia = data?.tendencia || [];

  // Badge de rendimiento
  const badge = useMemo(() => {
    if (!m.tasa_exito_porcentaje) return null;
    if (m.tasa_exito_porcentaje >= 20) return { label: 'Top Performer 🌟', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-300' };
    if (m.llamadas_dejadas_caer > 15) return { label: 'Riesgo de Abandono ⚠️', cls: 'bg-red-100 text-red-800 border border-red-300' };
    if (m.tasa_exito_porcentaje >= 12) return { label: 'Buen Desempeño 👍', cls: 'bg-blue-100 text-blue-800 border border-blue-300' };
    return { label: 'En Seguimiento 📋', cls: 'bg-slate-100 text-slate-700 border border-slate-300' };
  }, [m]);

  // Pie de tipificaciones (si viene en data)
  const tipificaciones = useMemo(() => {
    const raw = data?.tipificaciones || [];
    return raw.map(t => ({
      name: t.resultado || t.tipificacion || t.label || 'Otro',
      value: t.cantidad || t.count || t.total || 0
    }));
  }, [data]);

  // Progreso de promesa vs recaudo
  const prometido = m.total_prometido || 0;
  const recaudado = m.total_recaudado || 0;
  const pctRecaudo = prometido > 0 ? Math.min(100, Math.round((recaudado / prometido) * 100)) : 0;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel deslizable */}
      <div className="fixed top-0 right-0 h-full w-full max-w-3xl bg-slate-50 z-50 overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              {gestor?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{gestor}</h2>
              {data?.coordinador && (
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <User className="w-3 h-3" /> Coord: {data.coordinador}
                </p>
              )}
            </div>
            {badge && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${badge.cls}`}>
                {badge.label}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-blue-600" />
          </div>
        )}

        {isError && (
          <div className="m-8 p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            No se pudo cargar el resumen de este gestor.
          </div>
        )}

        {!isLoading && !isError && data && (
          <div className="p-8 space-y-8">

            {/* ── Sección 2: Métricas por grupo ── */}
            <section className="space-y-4">

              {/* Grupo 1: Actividad de llamadas */}
              <MetricGroup title="📞 Actividad de Llamadas">
                <MetricRow
                  icon={<Phone className="w-4 h-4 text-blue-500" />}
                  label="Llamadas Realizadas"
                  value={(m.llamadas_realizadas ?? 0).toLocaleString()}
                />
                <MetricRow
                  icon={<Phone className="w-4 h-4 text-indigo-500" />}
                  label="Llamadas Atendidas"
                  value={(m.llamadas_atendidas ?? 0).toLocaleString()}
                  note={m.llamadas_realizadas > 0 ? `${((m.llamadas_atendidas / m.llamadas_realizadas) * 100).toFixed(1)}% de contactabilidad` : undefined}
                  noteColor="text-indigo-400"
                />
                <MetricRow
                  icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}
                  label="Llamadas Caídas"
                  value={(m.llamadas_dejadas_caer ?? 0).toLocaleString()}
                  note={m.llamadas_dejadas_caer > 15 ? 'Por encima del umbral ⚠️' : 'Dentro del rango normal'}
                  noteColor={m.llamadas_dejadas_caer > 15 ? 'text-red-500' : 'text-slate-400'}
                />
                {(m.hora_primera_llamada || m.hora_ultima_llamada) && (
                  <MetricRow
                    icon={<Clock className="w-4 h-4 text-slate-400" />}
                    label="Jornada laboral"
                    value={`${m.hora_primera_llamada ?? '--'} → ${m.hora_ultima_llamada ?? '--'}`}
                    note="Primera a última llamada"
                  />
                )}
              </MetricGroup>

              {/* Grupo 2: Rendimiento */}
              <MetricGroup title="🎯 Rendimiento">
                <MetricRow
                  icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
                  label="Gestiones Exitosas"
                  value={(m.gestiones_exitosas ?? 0).toLocaleString()}
                  note={`de ${(m.llamadas_atendidas ?? 0)} atendidas`}
                  noteColor="text-slate-400"
                />
                <MetricRow
                  icon={<Star className="w-4 h-4 text-amber-500" />}
                  label="Tasa de Éxito"
                  value={`${m.tasa_exito_porcentaje ?? 0}%`}
                  note={m.tasa_exito_porcentaje >= 20 ? 'Top Performer 🌟' : m.tasa_exito_porcentaje >= 12 ? 'Buen desempeño' : 'Requiere atención'}
                  noteColor={m.tasa_exito_porcentaje >= 20 ? 'text-emerald-500' : m.tasa_exito_porcentaje >= 12 ? 'text-blue-500' : 'text-amber-500'}
                />
                <MetricRow
                  icon={<Clock className="w-4 h-4 text-purple-500" />}
                  label="TMO (Tiempo Medio)"
                  value={formatSeconds(m.avg_tiempo_hablado_segundos)}
                  note="Promedio por llamada"
                />
              </MetricGroup>

              {/* Grupo 3: Financiero */}
              <MetricGroup title="💰 Compromisos y Recaudo">
                <MetricRow
                  icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
                  label="Total Prometido"
                  value={formatMoney(prometido)}
                  note={`${m.total_compromisos ?? 0} compromisos`}
                  noteColor="text-slate-400"
                />
                <MetricRow
                  icon={<DollarSign className="w-4 h-4 text-green-600" />}
                  label="Total Recaudado"
                  value={formatMoney(recaudado)}
                  note={prometido > 0 ? `${pctRecaudo}% efectividad de promesa` : 'Sin promesas registradas'}
                  noteColor={pctRecaudo >= 50 ? 'text-emerald-500' : 'text-amber-500'}
                />
                <MetricRow
                  icon={<User className="w-4 h-4 text-blue-400" />}
                  label="Clientes con pago"
                  value={(m.clientes_con_pago ?? 0).toLocaleString()}
                />
              </MetricGroup>

            </section>

            {/* ── Sección 4: Calidad de Acuerdos / Funnel Financiero ── */}
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Calidad de Acuerdos</h3>
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-slate-600">Compromisos: {m.total_compromisos ?? 0} | Clientes con pago: {m.clientes_con_pago ?? 0}</span>
                  <span className={`text-sm font-bold ${pctRecaudo >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {pctRecaudo}% efectividad
                  </span>
                </div>
                {/* Barra prometido */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Prometido</span>
                    <span className="font-semibold">{formatMoney(prometido)}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                    <div className="bg-slate-400 h-4 rounded-full w-full transition-all" />
                  </div>
                </div>
                {/* Barra recaudado */}
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Recaudado</span>
                    <span className="font-semibold text-emerald-600">{formatMoney(recaudado)}</span>
                  </div>
                  <div className="w-full bg-emerald-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-4 rounded-full transition-all duration-700"
                      style={{ width: `${pctRecaudo}%` }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ── Sección 3: Gráfico de Tipificaciones ── */}
            {tipificaciones.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Tipificación de Llamadas</h3>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="h-[280px] flex justify-center">
                    <PieChart width={420} height={280}>
                      <Pie
                        data={tipificaciones}
                        cx={210}
                        cy={130}
                        innerRadius={65}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        labelLine={false}
                      >
                        {tipificaciones.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </div>
                </div>
              </section>
            )}

            {/* ── Sección 5: Tendencia de Actividad ── */}
            {tendencia.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Tendencia de Actividad</h3>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tendencia} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="dia"
                        fontSize={11}
                        stroke="#94a3b8"
                        tickFormatter={v => v.slice(5)}
                      />
                      <YAxis fontSize={11} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="llamadas_realizadas"
                        name="Realizadas"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        strokeDasharray="6 3"
                      />
                      <Line
                        type="monotone"
                        dataKey="llamadas_atendidas"
                        name="Atendidas"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="gestiones_exitosas"
                        name="Exitosas"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="compromisos"
                        name="Compromisos"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        strokeDasharray="4 2"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default GestorScorecard;
