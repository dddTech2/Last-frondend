import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { useDashboardStore } from '../../../store/dashboardStore';
import { getDashboardAnalisisTiemposFranjas } from '../../../services/dashboard';

const DIAS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const CustomComposedTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-slate-100 shadow-xl rounded-xl p-4 text-sm">
      <p className="font-bold text-slate-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-semibold text-slate-800">
            {p.name === 'Tasa Éxito (%)' ? `${p.value}%` : p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

const TabTimesDetail = () => {
  const filters = useDashboardStore(state => state.filters);
  const [groupBy, setGroupBy] = useState('franja'); // 'franja' | 'hora'

  const { data, isLoading } = useQuery({
    queryKey: ['analisis-tiempos-franjas', filters],
    queryFn: () => getDashboardAnalisisTiemposFranjas(filters)
  });

  // Composed chart data grouped by 'franja' or 'hora'
  const composedData = useMemo(() => {
    const raw = data?.composed || [];
    if (!raw.length) return [];

    if (groupBy === 'franja') {
      const grouped = {};
      raw.forEach(item => {
        const key = item.franja || 'Sin franja';
        if (!grouped[key]) {
          grouped[key] = { label: key, gestiones_exitosas: 0, total_llamadas: 0 };
        }
        grouped[key].gestiones_exitosas += item.gestiones_exitosas || 0;
        grouped[key].total_llamadas += item.total_llamadas || 0;
      });
      return Object.values(grouped).map(g => ({
        ...g,
        tasa_exito_pct: g.total_llamadas > 0
          ? Number(((g.gestiones_exitosas / g.total_llamadas) * 100).toFixed(2))
          : 0
      }));
    }

    // Group by hour - aggregate
    const grouped = {};
    raw.forEach(item => {
      const hora = item.hora != null ? `${String(item.hora).padStart(2, '0')}:00` : 'Sin hora';
      if (!grouped[hora]) {
        grouped[hora] = { label: hora, gestiones_exitosas: 0, total_llamadas: 0 };
      }
      grouped[hora].gestiones_exitosas += item.gestiones_exitosas || 0;
      grouped[hora].total_llamadas += item.total_llamadas || 0;
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, g]) => ({
        ...g,
        tasa_exito_pct: g.total_llamadas > 0
          ? Number(((g.gestiones_exitosas / g.total_llamadas) * 100).toFixed(2))
          : 0
      }));
  }, [data, groupBy]);

  // Nivo Heatmap data: [{ id: "Lunes", data: [{ x: "08", y: 15.38 }, ...] }, ...]
  const heatmapData = useMemo(() => {
    const raw = data?.heatmap || [];
    if (!raw.length) return [];

    const byDay = {};
    DIAS_ORDER.forEach(dia => { byDay[dia] = {}; });

    raw.forEach(item => {
      const dia = item.dia_semana;
      const hora = String(item.hora).padStart(2, '0');
      if (!byDay[dia]) byDay[dia] = {};
      byDay[dia][hora] = Number(Number(item.tasa_contactabilidad_pct || 0).toFixed(1));
    });

    // Get all unique hours sorted
    const horas = [...new Set(raw.map(r => String(r.hora).padStart(2, '0')))].sort();

    return DIAS_ORDER
      .filter(dia => Object.keys(byDay[dia]).length > 0)
      .map(dia => ({
        id: dia,
        data: horas.map(h => ({ x: `${h}:00`, y: byDay[dia][h] ?? 0 }))
      }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Composed Chart ── */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Volumen vs Efectividad por Franja Horaria</h3>
            <p className="text-sm text-slate-500 mt-1">
              Gestiones exitosas (eje izq.) y tasa de éxito % (eje der.) por segmento de tiempo.
            </p>
          </div>
          <div className="flex gap-2">
            {['franja', 'hora'].map(opt => (
              <button
                key={opt}
                onClick={() => setGroupBy(opt)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  groupBy === opt
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt === 'franja' ? '🕑 Franja' : '🕐 Por Hora'}
              </button>
            ))}
          </div>
        </div>

        {composedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={composedData} margin={{ top: 10, right: 50, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={13} tickMargin={10} />
              <YAxis
                yAxisId="left"
                stroke="#3b82f6"
                fontSize={12}
                tickMargin={8}
                label={{ value: 'Gestiones Exitosas', angle: -90, position: 'insideLeft', fill: '#3b82f6', fontSize: 12, dy: 60 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#ef4444"
                fontSize={12}
                tickMargin={8}
                tickFormatter={v => `${v}%`}
                label={{ value: 'Tasa Éxito %', angle: 90, position: 'insideRight', fill: '#ef4444', fontSize: 12, dy: -40 }}
              />
              <Tooltip content={<CustomComposedTooltip />} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 16 }} />
              <Bar
                yAxisId="left"
                dataKey="gestiones_exitosas"
                name="Gestiones Exitosas"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                barSize={40}
                fillOpacity={0.85}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="tasa_exito_pct"
                name="Tasa Éxito (%)"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: '#ef4444', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400">Sin datos para el gráfico de composición</div>
        )}
      </div>

      {/* ── Heatmap de Contactabilidad ── */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Mapa de Calor de Contactabilidad</h3>
        <p className="text-sm text-slate-500 mb-6">
          Días y horas con mayor tasa de contacto humano. <span className="font-semibold text-blue-600">Más oscuro = más contactos.</span>
        </p>
        {heatmapData.length > 0 ? (
          <div style={{ height: `${Math.max(heatmapData.length * 52 + 60, 280)}px` }}>
            <ResponsiveHeatMap
              data={heatmapData}
              margin={{ top: 50, right: 20, bottom: 20, left: 90 }}
              valueFormat=">-.1f"
              axisTop={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: '',
                legendOffset: 46
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0
              }}
              colors={{
                type: 'sequential',
                scheme: 'blues'
              }}
              emptyColor="#f1f5f9"
              borderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
              borderRadius={4}
              legends={[
                {
                  anchor: 'bottom-right',
                  translateX: 0,
                  translateY: 30,
                  length: 200,
                  thickness: 10,
                  direction: 'row',
                  tickPosition: 'after',
                  tickSize: 3,
                  tickSpacing: 4,
                  tickFormat: v => `${v}%`,
                  title: 'Tasa contactabilidad % →',
                  titleAlign: 'start',
                  titleOffset: 4
                }
              ]}
              tooltip={({ cell }) => (
                <div className="bg-white border border-slate-200 shadow-xl rounded-xl px-4 py-3 text-sm">
                  <p className="font-bold text-slate-700 mb-1">{cell.serieId} · {cell.data.x}</p>
                  <p className="text-slate-500">
                    Contactabilidad: <span className="font-bold text-blue-700">{Number(cell.value ?? 0).toFixed(1)}%</span>
                  </p>
                </div>
              )}
              animate={true}
              motionConfig="gentle"
            />
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <span className="text-4xl mb-2">🌡️</span>
            <p>Sin datos de contactabilidad para este filtro</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabTimesDetail;
