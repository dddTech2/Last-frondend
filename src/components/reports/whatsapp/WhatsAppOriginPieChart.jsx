import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const TYPE_COLORS = {
  'Campanas': '#6366f1',
  'Comunicaciones': '#f59e0b',
};

const WhatsAppOriginPieChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-[420px] flex items-center justify-center">
        <p className="text-gray-500">No hay datos de atribucion por tipo de origen.</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md text-sm">
          <p className="font-semibold text-gray-800">{entry.name}</p>
          <p className="text-gray-600">
            Ingresos: <span className="font-bold">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(entry.value)}</span>
          </p>
          <p className="text-gray-500 text-xs">{pct}% del total</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-[420px] flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Ingresos por Tipo de Origen</h3>
      <p className="text-xs text-gray-400 mb-3">Atribucion primer touch del pago</p>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              nameKey="name"
              label={renderCustomLabel}
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WhatsAppOriginPieChart;
