import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveFunnel } from '@nivo/funnel';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useDashboardStore } from '../../../store/dashboardStore';
import { getDashboardFunnel, getDashboardTendencia, getDashboardDistribucionTiempos } from '../../../services/dashboard';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const TabOverview = () => {
  const filters = useDashboardStore(state => state.filters);

  const { data: funnelData, isLoading: loadFunnel } = useQuery({
    queryKey: ['funnel', filters],
    queryFn: () => getDashboardFunnel(filters)
  });

  const { data: tendenciaData, isLoading: loadTend } = useQuery({
    queryKey: ['tendencia', filters],
    queryFn: () => getDashboardTendencia(filters)
  });

  const { data: distData, isLoading: loadDist } = useQuery({
    queryKey: ['distribucion', filters],
    queryFn: () => getDashboardDistribucionTiempos(filters)
  });

  const formattedFunnelData = React.useMemo(() => {
    if (!funnelData || !Array.isArray(funnelData)) return [];
    return funnelData.map((item, index) => {
      // Find the label from common fields or the first string property if undefined
      let detectedLabel = item.step || item.label || item.name || item.etapa || item.id || item.categoria;
      if (!detectedLabel) {
        // Fallback: if backend gave something like { "Contactos": 100 }, extract key
        const keys = Object.keys(item).filter(k => k !== 'value' && k !== 'total' && k !== 'cantidad' && k !== 'percentage_from_previous');
        detectedLabel = keys.length > 0 ? item[keys[0]] || keys[0] : `Paso ${index + 1}`;
      }
      return {
        ...item,
        id: item.step || item.id || detectedLabel || `step-${index}`,
        value: item.value !== undefined ? item.value : (item.cantidad || item.total || item.count || 0),
        label: detectedLabel,
        percentage_from_previous: item.percentage_from_previous || 0
      };
    });
  }, [funnelData]);

  // Handle both array [{name,value}] and object {key: value} formats from API
  const pieData = React.useMemo(() => {
    const raw = distData?.distribucion;
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map((item, i) => ({
        name: item.nombre || item.name || item.label || item.resultado || `Resultado ${i + 1}`,
        value: item.valor || item.value || item.cantidad || item.total || 0
      }));
    }
    return Object.entries(raw).map(([name, value]) => ({ name, value: Number(value) || 0 }));
  }, [distData]);

  // Add safety mapping for Tendencia data
  const formattedTendenciaData = React.useMemo(() => {
    let raw = tendenciaData;
    if (tendenciaData && !Array.isArray(tendenciaData) && Array.isArray(tendenciaData.data)) {
      raw = tendenciaData.data;
    }
    if (!raw || !Array.isArray(raw)) return [];
    
    return raw.map(item => ({
      ...item,
      fecha: item.fecha || item.date || item.dia || item.day || 'Sin fecha',
      efectividad: typeof item.llamadas_exitosas !== 'undefined' ? item.llamadas_exitosas : (item.efectividad || item.rate || 0),
      acuerdos: typeof item.total_acuerdos_exitosos !== 'undefined' ? item.total_acuerdos_exitosos : (item.acuerdos || item.valor_acuerdos || 0),
      pagos: typeof item.total_pagos_exitosos !== 'undefined' ? item.total_pagos_exitosos : (item.pagos || 0)
    }));
  }, [tendenciaData]);

  if (loadFunnel || loadTend || loadDist) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Embudo de Conversión */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Embudo de Contactabilidad</h3>
          {formattedFunnelData && formattedFunnelData.length > 0 ? (
            <ResponsiveFunnel
              data={formattedFunnelData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              valueFormat=">-.0f"
              colors={{ scheme: 'blues' }}
              borderWidth={20}
              labelColor={{ from: 'color', modifiers: [ [ 'darker', 3 ] ] }}
              beforeSeparatorLength={100}
              beforeSeparatorOffset={20}
              afterSeparatorLength={100}
              afterSeparatorOffset={20}
              currentPartSizeExtension={10}
              currentBorderWidth={40}
              motionConfig="wobbly"
              tooltip={({ part }) => (
                <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-100 font-semibold text-sm">
                  <div className="flex items-center mb-1">
                    <span 
                      className="inline-block w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: part.color }}
                    ></span>
                    {part.data.label}: <span className="font-bold ml-1">{part.formattedValue}</span>
                  </div>
                  {part.data.percentage_from_previous > 0 && part.data.label !== 'Total Predictivo' && (
                     <div className="text-xs text-slate-500 ml-5">
                       Conversión: {part.data.percentage_from_previous}%
                     </div>
                  )}
                </div>
              )}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 pb-10">Sin datos para el embudo</div>
          )}
        </div>

        {/* Distribución General */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Distribución de Resultados</h3>
          {pieData.length > 0 ? (
            <div className="h-[320px] w-full flex justify-center">
                <PieChart width={400} height={310}>
                  <Pie
                    data={pieData}
                    cx={200}
                    cy={130}
                    innerRadius={65}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
            </div>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-400 pb-10">Sin datos de distribución</div>
          )}
        </div>
      </div>

      {/* Tendencia Diaria */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-[450px]">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Tendencia de Efectividad Diaria</h3>
        {formattedTendenciaData && formattedTendenciaData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
              <LineChart data={formattedTendenciaData} margin={{ top: 5, right: 30, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="fecha" stroke="#94a3b8" fontSize={12} tickMargin={12} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickMargin={8} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} tickMargin={8} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val, name) => [val, name]}
                  labelStyle={{ fontWeight: 'bold', color: '#334155' }}
                />
                <Legend verticalAlign="top" align="right" height={40} wrapperStyle={{ paddingBottom: '20px' }} />
                <Line yAxisId="left" type="monotone" dataKey="efectividad" name="Llamadas Exitosas" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                <Line yAxisId="left" type="monotone" dataKey="acuerdos" name="Acuerdos Exitosos" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                <Line yAxisId="left" type="monotone" dataKey="pagos" name="Pagos Exitosos" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 pb-10">Sin datos de tendencia</div>
        )}
      </div>
    </div>
  );
};

export default TabOverview;
