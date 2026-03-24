import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDashboardStore } from '../../../store/dashboardStore';
import { getDashboardDistribucionTiempos } from '../../../services/dashboard';
import { Clock, PhoneCall, Timer } from 'lucide-react';

const TabTimes = () => {
  const filters = useDashboardStore(state => state.filters);

  const { data, isLoading } = useQuery({
    queryKey: ['distribucion', filters],
    queryFn: () => getDashboardDistribucionTiempos(filters)
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const promedios = data?.tiempos_promedio || {};
  
  const formatName = (key) => {
    const map = {
      espera_transferidas_seg: 'Espera Transferidas',
      espera_abandonadas_seg: 'Espera Abandonadas',
      conversacion_exitosa_seg: 'Charla Exitosa',
      duracion_con_acuerdo_seg: 'Duración (Acuerdo)',
      duracion_sin_acuerdo_seg: 'Duración (Sin Acuerdo)'
    };
    return map[key] || key;
  };

  const chartData = Object.entries(promedios).map(([key, segundos]) => ({
    name: formatName(key),
    minutos: Number((segundos / 60).toFixed(2)),
    segundos: Math.round(segundos)
  }));

  const formatMinutos = (mins) => {
    if (!mins) return '0m 0s';
    const min = Math.floor(mins);
    const sec = Math.round((mins - min) * 60);
    return `${min}m ${sec}s`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
          <Clock className="w-8 h-8 opacity-80 mb-4" />
          <h4 className="text-indigo-100 font-medium mb-1">Tiempo Medio de Espera</h4>
          <p className="text-3xl font-bold">{formatMinutos((promedios['espera_transferidas_seg'] || 0) / 60)}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200">
          <PhoneCall className="w-8 h-8 opacity-80 mb-4" />
          <h4 className="text-emerald-100 font-medium mb-1">Duración (Con Acuerdo)</h4>
          <p className="text-3xl font-bold">{formatMinutos((promedios['duracion_con_acuerdo_seg'] || 0) / 60)}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-200">
          <Timer className="w-8 h-8 opacity-80 mb-4" />
          <h4 className="text-orange-100 font-medium mb-1">Duración (Sin Acuerdo)</h4>
          <p className="text-3xl font-bold">{formatMinutos((promedios['duracion_sin_acuerdo_seg'] || 0) / 60)}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-[400px]">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Comparativa Analítica de Tiempos (Minutos)</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={13} tickMargin={12} />
                <YAxis stroke="#64748b" fontSize={13} tickMargin={8} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  formatter={(val) => [`${val} min`, 'Duración Promedio']}
                />
                <Bar dataKey="minutos" radius={[8, 8, 0, 0]} barSize={80}>
                  {chartData.map((entry, index) => {
                    const colors = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 pb-10">Sin datos de tiempos disponibles</div>
        )}
      </div>
    </div>
  );
};

export default TabTimes;
