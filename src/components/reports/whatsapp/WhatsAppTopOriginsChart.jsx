import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

const WhatsAppTopOriginsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-[420px] flex items-center justify-center">
        <p className="text-gray-500">No hay datos de origenes con atribucion.</p>
      </div>
    );
  }

  const fmtCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);
  const fmtNumber = (v) => new Intl.NumberFormat('es-CO').format(v || 0);

  const top10 = data.slice(0, 10);
  const remaining = data.slice(10);

  const TYPE_BADGES = {
    'CAMPAIGN': 'bg-indigo-50 text-indigo-700',
    'COMMUNICATION': 'bg-amber-50 text-amber-700',
  };
  const TYPE_LABELS = {
    'CAMPAIGN': 'Campana',
    'COMMUNICATION': 'Comunicacion',
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md text-sm max-w-xs">
          <p className="font-semibold text-gray-800 truncate">{d.name}</p>
          <p className="text-gray-500 text-xs mb-1">{TYPE_LABELS[d.tipo] || d.tipo}</p>
          <p className="text-gray-700">Ingresos: <span className="font-bold text-green-600">{fmtCurrency(d.revenue)}</span></p>
          <p className="text-gray-700">Pagos: <span className="font-bold">{fmtNumber(d.count)}</span></p>
        </div>
      );
    }
    return null;
  };

  // Truncate long names for Y axis
  const chartData = top10.map(d => ({
    ...d,
    shortName: d.name.length > 25 ? d.name.substring(0, 22) + '...' : d.name,
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Top 10 Origenes por Ingresos</h3>
      <p className="text-xs text-gray-400 mb-3">Nombre del origen que recibio el primer touch antes del pago</p>

      {/* Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 80, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
            <YAxis dataKey="shortName" type="category" width={160} tick={{ fill: '#4b5563', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 6, 6, 0]} cursor="pointer">
              <LabelList
                dataKey="revenue"
                position="right"
                formatter={(v) => fmtCurrency(v)}
                style={{ fill: '#374151', fontSize: 10, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Remaining table */}
      {remaining.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <p className="text-xs text-gray-500 mb-2 font-medium">{remaining.length} origenes adicionales</p>
          <div className="max-h-48 overflow-y-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Nombre Origen</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Tipo</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Ingresos</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Pagos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {remaining.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-1.5 text-gray-800 truncate max-w-[200px]" title={row.name}>{row.name}</td>
                    <td className="px-3 py-1.5">
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${TYPE_BADGES[row.tipo] || 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[row.tipo] || row.tipo}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium text-gray-900">{fmtCurrency(row.revenue)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-600">{fmtNumber(row.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppTopOriginsChart;
