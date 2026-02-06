import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';
import { formatCurrency, formatNumber, formatDateLong, formatDateShort } from '../../utils/campaignUtils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// 1. Gráfico de Recuperación por Canal (Barras Horizontales)
export const RecoveryByChannelChart = ({ campaigns }) => {
  const data = campaigns.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.channel_type);
    if (existing) {
      existing.value += curr.attributed_recovered_amount;
    } else {
      acc.push({ name: curr.channel_type, value: curr.attributed_recovered_amount });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  const totalRecovery = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const percentage = totalRecovery > 0 ? (value / totalRecovery) * 100 : 0;
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg min-w-[150px]">
          <p className="font-bold text-gray-800 mb-1 border-b border-gray-100 pb-1">{label}</p>
          <div className="pt-1">
            <p className="text-indigo-600 font-semibold text-base">
              {formatCurrency(value)}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              {percentage.toFixed(1)}% del total recuperado
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-96">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recuperación Total por Canal</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" tickFormatter={(val) => `$${(val/1000000).toFixed(0)}M`} />
          <YAxis dataKey="name" type="category" width={80} />
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
          <Legend />
          <Bar dataKey="value" fill="#4F46E5" radius={[0, 4, 4, 0]} name="Monto Recuperado" barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 2. Gráfico de Distribución por Canal (Pie Chart)
export const ChannelDistributionChart = ({ campaigns }) => {
  const data = campaigns.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.channel_type);
    if (existing) {
      existing.value += curr.total_messages_sent;
    } else {
      acc.push({ name: curr.channel_type, value: curr.total_messages_sent });
    }
    return acc;
  }, []);

  const totalMessages = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const percentage = totalMessages > 0 ? (d.value / totalMessages) * 100 : 0;
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg min-w-[150px]">
          <p className="font-bold text-gray-800 mb-1 border-b border-gray-100 pb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill }}></span>
            {d.name}
          </p>
          <div className="pt-1">
            <p className="text-gray-700 font-medium">
              Mensajes: <span className="font-mono text-gray-900">{formatNumber(d.value)}</span>
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              {percentage.toFixed(1)}% del volumen total
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-96">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución de Mensajes Enviados</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={95}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="square"
            iconSize={10}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// 6. Gráfico de Recuperación por Sistema Origen
export const RecoveryByOriginChart = ({ campaigns }) => {
  const data = campaigns.reduce((acc, curr) => {
    const origin = curr.sistema_origen || 'Desconocido';
    const existing = acc.find(item => item.name === origin);
    if (existing) {
      existing.value += curr.attributed_recovered_amount;
    } else {
      acc.push({ name: origin, value: curr.attributed_recovered_amount });
    }
    return acc;
  }, [])
  .filter(item => item.value > 0) // Hide items with 0 recovery
  .sort((a, b) => b.value - a.value);

  const totalRecovery = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const percentage = totalRecovery > 0 ? (value / totalRecovery) * 100 : 0;
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg min-w-[150px]">
          <p className="font-bold text-gray-800 mb-1 border-b border-gray-100 pb-1">{label}</p>
          <div className="pt-1">
            <p className="text-pink-600 font-semibold text-base">
              {formatCurrency(value)}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              {percentage.toFixed(1)}% del total recuperado
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-96">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recuperación por Sistema Origen</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" tickFormatter={(val) => `$${(val/1000000).toFixed(0)}M`} />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={180} 
            tick={{fontSize: 10}}
            tickFormatter={(value) => value.length > 25 ? `${value.substring(0, 25)}...` : value} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
          <Legend />
          <Bar dataKey="value" fill="#EC4899" radius={[0, 4, 4, 0]} name="Monto Recuperado" barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 7. Gráfico Doble: Canal vs Sistema Origen (Stacked Bar)
export const ChannelOriginStackedChart = ({ campaigns }) => {
  // Agrupar por Canal y luego por Origen
  const processedData = campaigns.reduce((acc, curr) => {
    const channel = curr.channel_type || 'Desconocido';
    const origin = curr.sistema_origen || 'Desconocido';
    
    let channelGroup = acc.find(item => item.name === channel);
    if (!channelGroup) {
      channelGroup = { name: channel };
      acc.push(channelGroup);
    }
    
    // Sumar al origen específico dentro del canal
    if (!channelGroup[origin]) {
      channelGroup[origin] = 0;
    }
    channelGroup[origin] += curr.attributed_recovered_amount;
    
    return acc;
  }, []);

  // Identificar todos los orígenes únicos para crear las barras apiladas
  const allOrigins = Array.from(new Set(campaigns.map(c => c.sistema_origen || 'Desconocido')));
  const originColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Filter out items with 0 value
      const activeItems = payload.filter(p => p.value > 0);
      
      if (activeItems.length === 0) return null;

      return (
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg min-w-[150px]">
          <p className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">{label}</p>
          <div className="space-y-1">
            {activeItems.map((entry, index) => (
              <div key={index} className="flex justify-between text-sm">
                 <span style={{ color: entry.color }}>{entry.name}:</span>
                 <span className="font-medium ml-2">{formatCurrency(entry.value)}</span>
              </div>
            ))}
             <div className="border-t border-gray-100 mt-1 pt-1 flex justify-between font-bold text-gray-800">
               <span>Total:</span>
               <span>{formatCurrency(activeItems.reduce((sum, e) => sum + e.value, 0))}</span>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-96">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recaudo por Canal y Sistema Origen</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(val) => `$${(val/1000000).toFixed(0)}M`} />
          <Tooltip content={<CustomTooltip />} />
          {/* Legend removed to avoid clutter */}
          {allOrigins.map((origin, index) => (
            <Bar 
              key={origin} 
              dataKey={origin} 
              stackId="a" 
              fill={originColors[index % originColors.length]} 
              name={origin}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 8. Gráfico de Efectividad por Sistema Origen (Composed Chart)
export const EffectivenessByOriginChart = ({ campaigns }) => {
  const data = campaigns.reduce((acc, curr) => {
    const origin = curr.sistema_origen || 'Desconocido';
    let group = acc.find(item => item.name === origin);
    
    if (!group) {
      group = { name: origin, sent: 0, payments: 0 };
      acc.push(group);
    }
    
    group.sent += curr.total_messages_sent;
    group.payments += curr.attributed_payments_count;
    
    return acc;
  }, [])
  .map(item => ({
    ...item,
    conversionRate: item.sent > 0 ? (item.payments / item.sent) * 100 : 0
  }))
  .filter(item => item.sent > 1000)
  .sort((a, b) => b.conversionRate - a.conversionRate);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg min-w-[180px]">
          <p className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">{d.name}</p>
          <div className="space-y-2 text-sm">
             <div className="flex justify-between">
               <span className="text-gray-600">Tasa de Efectividad:</span>
               <span className="font-bold text-orange-600">{d.conversionRate.toFixed(3)}%</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-600">Mensajes Enviados:</span>
               <span className="font-mono">{formatNumber(d.sent)}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-600">Pagos Atribuidos:</span>
               <span className="font-mono">{formatNumber(d.payments)}</span>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-96">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Efectividad por Sistema Origen (Pagos / Envíos &gt; 1k)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="name" 
            angle={-25} 
            textAnchor="end" 
            height={60} 
            interval={0}
            tick={{fontSize: 10, dy: 5}}
            tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
          />
          <YAxis 
            yAxisId="left"
            tickFormatter={(val) => formatNumber(val)}
            label={{ value: 'Mensajes', angle: -90, position: 'insideLeft', offset: -5, style: { fill: '#6b7280', fontSize: 12 } }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tickFormatter={(val) => `${val.toFixed(2)}%`}
            label={{ value: 'Efectividad (%)', angle: 90, position: 'insideRight', offset: 10, style: { fill: '#6b7280', fontSize: 12 } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36}/>
          <Bar 
            yAxisId="left" 
            dataKey="sent" 
            name="Volumen de Mensajes" 
            fill="#cbd5e1" 
            barSize={40} 
            radius={[4, 4, 0, 0]}
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="conversionRate" 
            name="Tasa de Efectividad" 
            stroke="#ea580c" 
            strokeWidth={3}
            dot={{ r: 5, fill: '#fff', strokeWidth: 2 }} 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};


export const PerformanceOverTimeChart = ({ data }) => {
  const sortedData = [...data].sort((a, b) => new Date(a.date_day).getTime() - new Date(b.date_day).getTime());

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dateStr = formatDateLong(label);
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg min-w-[220px]">
          <p className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1 text-sm">{dateStr}</p>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span style={{ color: entry.color }} className="font-medium mr-3">{entry.name}:</span>
                <span className="font-mono text-gray-700 font-semibold">
                  {entry.dataKey === 'total_recovered' ? formatCurrency(entry.value) : formatNumber(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-96">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Cronología de Rendimiento Diario</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="date_day" 
            tickFormatter={(str) => formatDateShort(str)} 
            stroke="#9ca3af"
            tick={{fontSize: 12}}
          />
          <YAxis 
            yAxisId="left" 
            tickFormatter={(val) => `$${(val/1000000).toFixed(0)}M`} 
            stroke="#4F46E5"
            tick={{fontSize: 12}}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#10B981"
            tick={{fontSize: 12}}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="total_recovered" stroke="#4F46E5" strokeWidth={2} activeDot={{ r: 6 }} dot={false} name="Monto Recuperado" />
          <Line yAxisId="right" type="monotone" dataKey="total_sends" stroke="#10B981" strokeWidth={2} activeDot={{ r: 6 }} dot={false} name="Mensajes Enviados" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// 4. Gráfico de Tendencias Mensuales (Barras + Línea de Conversión)
export const MonthlyTrendsChart = ({ campaigns }) => {
  const monthlyData = campaigns.reduce((acc, curr) => {
    const month = curr.campaign_send_date.substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { 
        month, 
        recovered: 0, 
        sent: 0, 
        payments: 0,
        clients: 0 
      };
    }
    acc[month].recovered += curr.attributed_recovered_amount;
    acc[month].sent += curr.total_messages_sent;
    acc[month].payments += curr.attributed_payments_count;
    acc[month].clients += curr.unique_clients_contacted;
    return acc;
  }, {});

  const data = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(item => ({
      ...item,
      conversionRate: item.sent > 0 ? (item.payments / item.sent) * 100 : 0
    }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const [year, month] = data.month.split('-');
      const dateLabel = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      
      return (
        <div className="bg-white p-4 border border-gray-100 shadow-lg rounded-lg min-w-[240px]">
          <p className="font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">{dateLabel}</p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Recuperado
              </span>
              <span className="font-bold text-emerald-700">{formatCurrency(data.recovered)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span> Conversión
              </span>
              <span className="font-bold text-orange-600">{data.conversionRate.toFixed(2)}%</span>
            </div>
            
            <div className="border-t border-gray-100 pt-2 space-y-1.5 mt-2 bg-gray-50 -mx-4 px-4 py-2">
               <div className="flex justify-between">
                 <span className="text-gray-500 text-xs uppercase tracking-wide">Mensajes</span>
                 <span className="font-mono text-gray-700">{formatNumber(data.sent)}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-500 text-xs uppercase tracking-wide">Pagos</span>
                 <span className="font-mono text-gray-700">{formatNumber(data.payments)}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-500 text-xs uppercase tracking-wide">Clientes Únicos</span>
                 <span className="font-mono text-gray-700">{formatNumber(data.clients)}</span>
               </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-96">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Análisis Mensual de Recuperación y Eficiencia</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
          <CartesianGrid stroke="#f5f5f5" vertical={false} />
          <XAxis 
            dataKey="month" 
            tickFormatter={(str) => {
              const [y, m] = str.split('-');
              const date = new Date(parseInt(y), parseInt(m) - 1);
              return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
            }} 
            scale="point" 
            padding={{ left: 20, right: 20 }}
            tick={{fontSize: 12}}
            stroke="#9ca3af"
          />
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            tickFormatter={(val) => `$${(val/1000000).toFixed(0)}M`}
            label={{ value: 'Recuperado ($)', angle: -90, position: 'insideLeft', offset: -10, style: { fill: '#6b7280', fontSize: 12 } }}
            tick={{fontSize: 12}}
            stroke="#9ca3af"
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tickFormatter={(val) => `${val.toFixed(1)}%`}
            label={{ value: 'Tasa de Conversión (%)', angle: 90, position: 'insideRight', offset: 0, style: { fill: '#6b7280', fontSize: 12 } }}
            tick={{fontSize: 12}}
            stroke="#9ca3af"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            yAxisId="left" 
            dataKey="recovered" 
            name="Monto Recuperado" 
            fill="#10B981" 
            barSize={40} 
            radius={[4, 4, 0, 0]} 
            fillOpacity={0.8}
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="conversionRate" 
            name="Tasa de Conversión (Pagos/Msj)" 
            stroke="#F97316" 
            strokeWidth={3} 
            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
            activeDot={{ r: 7 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// 5. Gráfico de Comparación Recordatorio vs Regular
export const ReminderComparisonChart = ({ campaigns }) => {
  const data = campaigns.reduce((acc, curr) => {
    const type = curr.is_reminder_campaign ? 'Recordatorio' : 'Regular';
    if (!acc[type]) {
      acc[type] = {
        name: type,
        recovered: 0,
        sent: 0,
        payments: 0
      };
    }
    acc[type].recovered += curr.attributed_recovered_amount;
    acc[type].sent += curr.total_messages_sent;
    acc[type].payments += curr.attributed_payments_count;
    return acc;
  }, {});

  const chartData = Object.values(data).map(item => ({
    ...item,
    conversionRate: item.sent > 0 ? (item.payments / item.sent) * 100 : 0
  })).sort((a, b) => b.recovered - a.recovered);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-100 shadow-lg rounded-lg min-w-[200px]">
          <p className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">{data.name} Campañas</p>
          <div className="space-y-2 text-sm">
             <div className="flex justify-between">
                <span className="text-gray-600">Recuperado:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(data.recovered)}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-gray-600">Enviados:</span>
                <span className="font-mono">{formatNumber(data.sent)}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-gray-600">Pagos:</span>
                <span className="font-mono">{formatNumber(data.payments)}</span>
             </div>
             <div className="pt-2 mt-2 border-t border-gray-50 flex justify-between items-center">
                <span className="text-gray-500 text-xs uppercase">Conversión</span>
                <span className="font-bold text-orange-500">{data.conversionRate.toFixed(2)}%</span>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-96">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Desglose Recordatorio vs Regular</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
          <CartesianGrid stroke="#f5f5f5" vertical={false} />
          <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 12, fontWeight: 500}} />
          <YAxis 
            yAxisId="left"
            tickFormatter={(val) => `$${(val/1000000).toFixed(0)}M`}
            stroke="#9ca3af"
            label={{ value: 'Recuperado ($)', angle: -90, position: 'insideLeft', offset: -10, style: { fill: '#6b7280', fontSize: 12 } }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tickFormatter={(val) => `${val.toFixed(1)}%`}
            stroke="#9ca3af"
            label={{ value: 'Conversión (%)', angle: 90, position: 'insideRight', offset: 10, style: { fill: '#6b7280', fontSize: 12 } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            yAxisId="left" 
            dataKey="recovered" 
            name="Monto Recuperado" 
            fill="#8b5cf6" 
            barSize={60} 
            radius={[4, 4, 0, 0]}
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="conversionRate" 
            name="Tasa de Conversión" 
            stroke="#f59e0b" 
            strokeWidth={3}
            dot={{ r: 5, fill: '#fff', strokeWidth: 2 }} 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
