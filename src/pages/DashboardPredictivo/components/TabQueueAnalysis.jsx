import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboardStore } from '../../../store/dashboardStore';
import { getDashboardAnalisisCola } from '../../../services/dashboard';

const TabQueueAnalysis = () => {
  const filters = useDashboardStore(state => state.filters);

  const { data, isLoading } = useQuery({
    queryKey: ['analisis-cola', filters],
    queryFn: () => getDashboardAnalisisCola(filters)
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  const chartData = data && Array.isArray(data) ? data : [];

  return (
    <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm h-[600px] flex flex-col">
      <h3 className="text-lg font-bold text-slate-800 mb-2">Auditoría de Cola PBX (Atenciones vs Abandonos)</h3>
      <p className="text-sm text-slate-500 mb-8">Identifica cuellos de botella y gestores con alta tasa de pérdida de llamadas encoladas.</p>
      
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={450}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="gestor" 
                stroke="#64748b" 
                fontSize={12} 
                tickMargin={12} 
                angle={-45} 
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#64748b" fontSize={12} tickMargin={8} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }}/>
              <Bar dataKey="transferidas" name="Llamadas Atendidas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} />
              <Bar dataKey="abandonadas" name="Llamadas Abandonadas (Cola)" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={25} />
            </BarChart>
          </ResponsiveContainer>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">Sin datos de auditoría de cola para este filtro</div>
      )}
    </div>
  );
};

export default TabQueueAnalysis;
