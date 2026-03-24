import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useDashboardStore } from '../../../store/dashboardStore';
import { getDashboardPagos } from '../../../services/dashboard';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

const TabPayments = () => {
  const filters = useDashboardStore(state => state.filters);

  const { data, isLoading } = useQuery({
    queryKey: ['pagos', filters],
    queryFn: () => getDashboardPagos(filters)
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const chartData = data && Array.isArray(data) ? data : [];

  return (
    <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm h-[600px] flex flex-col">
      <h3 className="text-lg font-bold text-slate-800 mb-2">Impacto Monetario por Segmento de Atraso</h3>
      <p className="text-sm text-slate-500 mb-10">Proximamente</p>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={450}>
          <BarChart data={chartData} margin={{ top: 40, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="categoria" stroke="#64748b" fontSize={13} tickMargin={12} />
            <YAxis stroke="#64748b" fontSize={13} tickMargin={8} tickFormatter={(val) => `$${(val / 1000000).toFixed(0)}M`} />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
              formatter={(val) => [`$${val.toLocaleString()}`, 'Recaudo Generado']}
              itemStyle={{ fontWeight: 600, color: '#059669' }}
            />
            <Bar dataKey="recaudo_total" radius={[8, 8, 0, 0]} barSize={80}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
              <LabelList
                dataKey="recaudo_total"
                position="top"
                fill="#475569"
                fontSize={12}
                fontWeight={600}
                formatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">Sin datos de pagos para este filtro</div>
      )}
    </div>
  );
};

export default TabPayments;
