import React from 'react';

const WhatsAppTouchesTable = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-40 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (!data) return null;

  const fmt = (v) => v != null && !isNaN(v) ? v.toFixed(1) : '-';
  const fmtPct = (v) => v != null && !isNaN(v) ? `${v.toFixed(1)}%` : '-';

  const rows = [
    {
      label: 'Promedio touches antes de pago',
      campaign: fmt(data.avg_touches_campaign),
      communication: fmt(data.avg_touches_communication),
      total: fmt(data.avg_touches_total),
    },
    {
      label: 'Prom. dias 1er touch a pago',
      campaign: '-',
      communication: '-',
      total: fmt(data.avg_days_first_touch),
    },
    {
      label: 'Prom. dias ultimo touch a pago',
      campaign: '-',
      communication: '-',
      total: fmt(data.avg_days_last_touch),
    },
    {
      label: '% clientes que respondieron',
      campaign: '-',
      communication: '-',
      total: fmtPct(data.pct_responded),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Metricas de Conversion por Touch</h3>
      <p className="text-xs text-gray-400 mb-4">Promedios calculados sobre pagos atribuidos con al menos 1 touch WhatsApp</p>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Metrica</th>
              <th className="px-4 py-3 text-center font-medium text-indigo-600">Campanas</th>
              <th className="px-4 py-3 text-center font-medium text-amber-600">Comunicaciones</th>
              <th className="px-4 py-3 text-center font-medium text-gray-800">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700 font-medium">{row.label}</td>
                <td className="px-4 py-3 text-center text-gray-900">{row.campaign}</td>
                <td className="px-4 py-3 text-center text-gray-900">{row.communication}</td>
                <td className="px-4 py-3 text-center font-bold text-gray-900">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WhatsAppTouchesTable;
