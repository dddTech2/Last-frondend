import React from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const WhatsAppTrendChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-96 flex items-center justify-center">
        <p className="text-gray-500">No hay datos de tendencias para este rango de fechas.</p>
      </div>
    );
  }

  const formatCurrency = (value) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value}`;
  };

  const fmtCurrencyFull = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);
  const fmtNumber = (v) => new Intl.NumberFormat('es-CO').format(v || 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md text-sm">
          <p className="font-semibold text-gray-800 border-b pb-2 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="flex justify-between gap-4">
              <span>{entry.name}:</span>
              <span className="font-bold">
                {entry.dataKey === 'revenue'
                  ? fmtCurrencyFull(entry.value)
                  : fmtNumber(entry.value)}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Check if stacked data exists (msg_campaign, msg_communication, msg_agent)
  const hasStackedData = data.some(d => d.msg_campaign > 0 || d.msg_communication > 0 || d.msg_agent > 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Tendencia Diaria: Mensajes vs Ingresos Atribuidos</h3>
      <p className="text-xs text-gray-400 mb-3">
        {hasStackedData ? 'Barras apiladas por tipo de origen | Linea = ingresos atribuidos' : 'Correlacion entre volumen de envio y pagos atribuidos'}
      </p>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid stroke="#f0f0f0" />
            <XAxis dataKey="date" scale="band" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis yAxisId="left" orientation="left" stroke="#6366f1" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 11 }} tickFormatter={formatCurrency} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />

            {hasStackedData ? (
              <>
                <Bar yAxisId="left" dataKey="msg_campaign" name="Campanas" stackId="msgs" barSize={20} fill="#6366f1" />
                <Bar yAxisId="left" dataKey="msg_communication" name="Comunicaciones" stackId="msgs" barSize={20} fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </>
            ) : (
              <Bar yAxisId="left" dataKey="messages" name="Mensajes Enviados" barSize={20} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            )}

            <Line yAxisId="right" type="monotone" dataKey="revenue" name="Ingresos Atribuidos ($)" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: '#10b981', strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WhatsAppTrendChart;
