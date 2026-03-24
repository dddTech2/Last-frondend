import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell 
} from 'recharts';
import { useDashboardStore } from '../../../store/dashboardStore';
import { getDashboardAnalisisAvanzado } from '../../../services/dashboard';
import { TrendingUp, Award, BarChart3, Target, PieChart } from 'lucide-react';

const formatMoney = (val) => {
  if (!val && val !== 0) return '$0';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
};

const CustomScatterTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-xl text-sm">
        <p className="font-bold text-slate-800 mb-2">{data.gestor}</p>
        <div className="space-y-1">
          <p className="text-slate-500">AHT: <span className="font-semibold text-slate-800">{data.avg_tiempo_conversacion_min} min</span></p>
          <p className="text-slate-500">Éxito: <span className="font-semibold text-emerald-600">{data.tasa_exito_pct}%</span></p>
          <p className="text-slate-500">Llamadas: <span className="font-semibold text-blue-600">{data.total_llamadas}</span></p>
        </div>
      </div>
    );
  }
  return null;
};

const TabAdvancedAnalysis = () => {
  const filters = useDashboardStore(state => state.filters);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['analisis-avanzado', filters],
    queryFn: () => getDashboardAnalisisAvanzado(filters)
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  if (isError) return (
    <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-red-600 h-64 flex flex-col items-center justify-center">
      <p className="font-bold mb-2">Error cargando el análisis avanzado</p>
      <p className="text-sm">Por favor intenta de nuevo en unos minutos.</p>
    </div>
  );

  const roiData = data?.roi_campanas || [];
  const promesasData = data?.promesas_vs_recaudo || [];
  const eficienciaData = data?.cuadrante_eficiencia || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. ROI de Campañas (Table) */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <Target className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-bold text-slate-800">ROI de Campañas</h3>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Origen de campaña vs Recaudo Real</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-50/30">
              <tr>
                <th className="px-6 py-4 font-bold">Campaña</th>
                <th className="px-6 py-4 font-bold text-center">Llamadas</th>
                <th className="px-6 py-4 font-bold text-center">Contac. %</th>
                <th className="px-6 py-4 font-bold text-center">Acuerdos</th>
                <th className="px-6 py-4 font-bold text-right">Val. Acuerdos</th>
                <th className="px-6 py-4 font-bold text-right">Recaudo Real</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roiData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">{row.campaign_name}</td>
                  <td className="px-6 py-4 text-center text-slate-600">{row.total_llamadas.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${row.contactabilidad_pct > 30 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {row.contactabilidad_pct}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-blue-600">{row.acuerdos_generados}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{formatMoney(row.valor_acuerdos)}</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatMoney(row.recaudo_real)}</td>
                </tr>
              ))}
              {!roiData.length && (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">Sin datos de ROI registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 2. Promesas vs Recaudo (Stacked/Side BarChart) */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-50 rounded-lg"><BarChart3 className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Promesas vs Recaudo</h3>
              <p className="text-xs text-slate-500">“Broken Promises” por Gestor</p>
            </div>
          </div>
          
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={promesasData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="gestor" 
                  type="category" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  formatter={(value, name) => [formatMoney(value), name]}
                />
                <Legend verticalAlign="top" align="right" height={36} />
                <Bar dataKey="total_prometido" name="Prometido" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={16} />
                <Bar dataKey="total_recaudado" name="Recaudado" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 3. Cuadrante de Eficiencia (Scatter Chart) */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-50 rounded-lg"><TrendingUp className="w-5 h-5 text-indigo-600" /></div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Cuadrante de Eficiencia</h3>
              <p className="text-xs text-slate-500">Tiempo de Conversación (AHT) vs Tasa de Éxito</p>
            </div>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  dataKey="avg_tiempo_conversacion_min" 
                  name="AHT" 
                  unit="m" 
                  stroke="#94a3b8" 
                  fontSize={12}
                  label={{ value: 'AHT (Minutos)', position: 'insideBottomRight', offset: -10, fontSize: 10, fill: '#64748b' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="tasa_exito_pct" 
                  name="Éxito" 
                  unit="%" 
                  stroke="#94a3b8" 
                  fontSize={12}
                  label={{ value: 'Éxito (%)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }}
                />
                <ZAxis type="number" dataKey="total_llamadas" range={[60, 400]} name="Llamadas" />
                <Tooltip content={<CustomScatterTooltip />} />
                <Scatter name="Gestores" data={eficienciaData}>
                  {eficienciaData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.tasa_exito_pct > 20 ? '#10b981' : entry.avg_tiempo_conversacion_min > 5 ? '#f59e0b' : '#3b82f6'} 
                      fillOpacity={0.7}
                      stroke={entry.tasa_exito_pct > 20 ? '#059669' : '#3b82f6'}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 justify-center">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" /> Alta Eficacia</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500/70" /> Eficacia Media</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" /> Tiempo Excesivo</div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default TabAdvancedAnalysis;
