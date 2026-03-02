import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const WhatsAppSystemOriginChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-[420px] flex items-center justify-center">
        <p className="text-gray-500">No hay datos por sistema de origen.</p>
      </div>
    );
  }

  const fmtCurrency = (v) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v}`;
  };
  const fmtNumber = (v) => new Intl.NumberFormat('es-CO').format(v || 0);
  const fmtCurrencyFull = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md text-sm">
          <p className="font-semibold text-gray-800 border-b pb-2 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="flex justify-between gap-4">
              <span>{entry.name}:</span>
              <span className="font-bold">
                {entry.dataKey === 'revenue' ? fmtCurrencyFull(entry.value) : fmtNumber(entry.value)}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Rendimiento por Sistema de Origen</h3>
      <p className="text-xs text-gray-400 mb-4">Total mensajes, acuerdos y recaudo agrupados por system_origin</p>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="system_origin" tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }} />
            <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={fmtCurrency} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <Bar yAxisId="left" dataKey="messages" name="Mensajes" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={28} />
            <Bar yAxisId="left" dataKey="agreements" name="Acuerdos" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} />
            <Bar yAxisId="right" dataKey="revenue" name="Recaudo ($)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table below */}
      <div className="mt-4 border-t pt-3">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Sistema Origen</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Mensajes</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Acuerdos</th>
              <th className="px-4 py-2 text-right font-medium text-gray-500">Recaudo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-800">{row.system_origin || 'Sin sistema'}</td>
                <td className="px-4 py-2 text-right text-gray-700">{fmtNumber(row.messages)}</td>
                <td className="px-4 py-2 text-right text-gray-700">{fmtNumber(row.agreements)}</td>
                <td className="px-4 py-2 text-right font-medium text-green-700">{fmtCurrencyFull(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WhatsAppSystemOriginChart;
