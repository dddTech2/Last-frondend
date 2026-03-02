import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#64748b', '#ec4899', '#8b5cf6'];

const WhatsAppErrorChart = ({ data, onSliceClick }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-96 flex items-center justify-center">
        <p className="text-gray-500">No hay errores en este rango de fechas. ¡Excelente!</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md text-sm">
          <p className="font-semibold text-gray-800">{payload[0].name}</p>
          <p className="text-gray-600">
            Fallas: <span className="font-medium text-red-600">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegendText = (value, entry) => (
    <span className="text-sm font-medium text-gray-700 truncate max-w-[120px] inline-block align-bottom" title={value}>{value}</span>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución de Errores (FAILED)</h3>
      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
              onClick={(entry) => {
                if (entry && onSliceClick) {
                  onSliceClick(entry.name);
                }
              }}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend layout="vertical" verticalAlign="middle" align="right" formatter={renderLegendText} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">Haz clic en un segmento para ver los números afectados</p>
    </div>
  );
};

export default WhatsAppErrorChart;
