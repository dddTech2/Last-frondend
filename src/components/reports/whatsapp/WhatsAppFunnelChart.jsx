import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts';

const STAGE_COLORS = {
  'Enviados': '#3b82f6',
  'Entregados': '#10b981',
  'Leidos': '#f59e0b',
  'Fallidos': '#ef4444',
};

const WhatsAppFunnelChart = ({ data, onSliceClick }) => {
  // Data expected format: [{ stage: 'Enviados', count: 100 }, { stage: 'Entregados', count: 90 }, ...]
  // Funnel stages per PRD: SENT -> DELIVERED -> READ  (FAILED is separate branch)
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-96 flex items-center justify-center">
        <p className="text-gray-500">No hay datos para el embudo en este rango de fechas.</p>
      </div>
    );
  }

  // Calculate drop-off percentages
  const maxCount = data.length > 0 ? data[0].count : 1;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      const pct = maxCount > 0 ? ((entry.count / maxCount) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md">
          <p className="font-semibold text-gray-800">{entry.stage}</p>
          <p className="text-gray-600">
            Cantidad: <span className="font-medium text-gray-900">{new Intl.NumberFormat('es-CO').format(entry.count)}</span>
          </p>
          <p className="text-gray-500 text-xs">
            {pct}% del total enviado
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Embudo de Conversion WhatsApp</h3>
      <p className="text-xs text-gray-400 mb-3">Ciclo: Enviados &rarr; Entregados &rarr; Leidos | Fallidos (rama separada)</p>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 60, left: 20, bottom: 5 }}
            onClick={(state) => {
              if (state && state.activePayload && onSliceClick) {
                onSliceClick(state.activePayload[0].payload.stage);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => new Intl.NumberFormat('es-CO').format(v)} />
            <YAxis dataKey="stage" type="category" width={100} tick={{ fill: '#4b5563', fontSize: 13, fontWeight: 500 }} />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} cursor="pointer">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.stage] || '#94a3b8'} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                formatter={(v) => new Intl.NumberFormat('es-CO').format(v)}
                style={{ fill: '#374151', fontSize: 12, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">Haz clic en una barra para filtrar la tabla de detalle</p>
    </div>
  );
};

export default WhatsAppFunnelChart;
