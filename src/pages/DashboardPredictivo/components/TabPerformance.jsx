import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { useDashboardStore } from '../../../store/dashboardStore';
import { getDashboardAgrupacion } from '../../../services/dashboard';
import GestorScorecard from './GestorScorecard';
import { Eye } from 'lucide-react';

const TabPerformance = () => {
  const [dimension, setDimension] = useState('gestor');
  const [selectedGestor, setSelectedGestor] = useState(null);
  const filters = useDashboardStore(state => state.filters);

  const { data, isLoading } = useQuery({
    queryKey: ['agrupacion', dimension, filters],
    queryFn: () => getDashboardAgrupacion(dimension, filters)
  });

  const [sortBy, setSortBy] = useState('efectividad'); 
  
  const sortedData = React.useMemo(() => {
    let rawData = data;
    if (data && !Array.isArray(data) && Array.isArray(data.data)) {
        rawData = data.data;
    }
    if (!rawData || !Array.isArray(rawData)) return [];
    
    let mapped = rawData.map(item => {
      const llamadas = item.total_llamadas || 0;
      const gestiones = item.gestiones_exitosas || 0;
      const efectividad = llamadas > 0 ? Number(((gestiones / llamadas) * 100).toFixed(1)) : 0;
      return {
        ...item,
        label: item[dimension] || item.nombre || item.name || item.gestor || item.categoria || item.origen || item.franja || 'Desconocido',
        efectividad: efectividad,
        valor_acuerdos: item.valor_acuerdos || 0,
        recaudo_total: item.recaudo_total || 0,
        gestiones_exitosas: gestiones,
        total_llamadas: llamadas
      };
    });

    mapped = mapped.filter(item => item[sortBy] > 0);

    return mapped.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0)).slice(0, 15);
  }, [data, sortBy, dimension]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-xl border border-slate-100 shadow-sm gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Agrupar Dimension por</label>
          <div className="flex flex-wrap gap-2">
            {['gestor', 'coordinador', 'sistema_origen', 'franja'].map(dim => (
              <button 
                key={dim}
                onClick={() => setDimension(dim)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${dimension === dim ? 'bg-blue-600 text-white shadow-md shadow-blue-200 ring-2 ring-blue-600 ring-offset-1' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
              >
                {dim === 'sistema_origen' ? 'Sistema Origen' : dim.charAt(0).toUpperCase() + dim.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="w-full sm:w-auto">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ordenar Ranking por</label>
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
          >
            <option value="efectividad">Efectividad de Llamada (%)</option>
            <option value="gestiones_exitosas">Gestiones Exitosas (Q)</option>
            <option value="valor_acuerdos">Valor Acuerdos ($)</option>
            <option value="recaudo_total">Recaudo Monetario ($)</option>
            <option value="total_llamadas">Volumen de Llamadas</option>
          </select>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-[650px] flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Top 15 Ranking ({dimension === 'sistema_origen' ? 'sistemas' : dimension}s)</h3>
        <p className="text-sm text-slate-500 mb-8">Compara el desempeño cruzado según la métrica seleccionada.</p>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : sortedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={sortedData}
                layout="vertical"
                margin={{ top: 5, right: 80, left: 100, bottom: 5 }}
                onClick={(e) => {
                  if (dimension === 'gestor' && e?.activePayload?.[0]?.payload?.label) {
                    setSelectedGestor(e.activePayload[0].payload.label);
                  }
                }}
                style={{ cursor: dimension === 'gestor' ? 'pointer' : 'default' }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickMargin={8} />
                <YAxis 
                  dataKey="label" 
                  type="category" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tick={{fill: '#475569', fontWeight: 600}} 
                  width={140}
                  tickFormatter={(val) => (val && val.length > 15) ? `${val.substring(0, 15)}...` : val}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  itemStyle={{ fontWeight: 600, marginTop: '8px' }}
                  formatter={(value, name, props) => {
                    if (sortBy === 'efectividad') {
                      const { payload } = props;
                      return [
                        `${value}%  (${payload.gestiones_exitosas} gestiones / ${payload.total_llamadas} llamadas)`,
                        'Efectividad'
                      ];
                    }
                    if (sortBy === 'recaudo_total' || sortBy === 'valor_acuerdos') return [`$${value.toLocaleString()}`, name];
                    return [value.toLocaleString(), name];
                  }}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }}/>
                
                {sortBy === 'efectividad' ? (
                  <Bar dataKey="efectividad" name="Efectividad (%)" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={28}>
                    <LabelList 
                      dataKey="efectividad" 
                      position="right" 
                      fill="#3b82f6" 
                      fontSize={12} 
                      fontWeight={700}
                      formatter={(val) => `${val}%`} 
                    />
                  </Bar>
                ) : (
                  <Bar 
                    dataKey={sortBy} 
                    name={
                      sortBy === 'recaudo_total' ? 'Recaudo Generado' : 
                      sortBy === 'valor_acuerdos' ? 'Valor Acuerdos' : 
                      sortBy === 'gestiones_exitosas' ? 'Gestiones Exitosas' : 'Llamadas Totales'
                    } 
                    fill={
                      sortBy === 'recaudo_total' ? '#10b981' : 
                      sortBy === 'valor_acuerdos' ? '#8b5cf6' : 
                      sortBy === 'gestiones_exitosas' ? '#3b82f6' : '#f59e0b'
                    }
                    radius={[0, 8, 8, 0]}
                    barSize={28}
                  >
                    <LabelList 
                      dataKey={sortBy} 
                      position="right" 
                      fill="#64748b" 
                      fontSize={12} 
                      fontWeight={600}
                      formatter={(val) => (sortBy === 'recaudo_total' || sortBy === 'valor_acuerdos') ? `$${val.toLocaleString()}` : val.toLocaleString()} 
                    />
                  </Bar>
                )}
              </BarChart>
            </ResponsiveContainer>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-50/50 rounded-xl border border-slate-100/50 my-4">
            <span className="text-5xl mb-3">📭</span>
            <p className="font-semibold text-lg text-slate-700">Métrica sin datos</p>
            <p className="text-sm">Ningún usuario tiene valores calculables para este filtro.</p>
          </div>
        )}
      </div>

      {/* Hint when in gestor mode */}
      {dimension === 'gestor' && sortedData.length > 0 && (
        <p className="text-xs text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
          <Eye className="w-3 h-3" /> Haz clic en cualquier barra para ver el scorecard del gestor
        </p>
      )}

      {/* GestorScorecard slide-in */}
      {selectedGestor && (
        <GestorScorecard gestor={selectedGestor} onClose={() => setSelectedGestor(null)} />
      )}
    </div>
  );
};

export default TabPerformance;
