import React from 'react';
import { DollarSign, FileCheck, MessageCircle, TrendingUp, MessageSquareReply } from 'lucide-react';

const MetricCard = ({ title, value, subtitle, icon: Icon, color, loading }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className={`p-2 rounded-full ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    {loading ? (
      <div className="animate-pulse h-8 bg-gray-200 rounded w-1/2"></div>
    ) : (
      <>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </>
    )}
  </div>
);

const WhatsAppKPICards = ({ data, loading }) => {
  const fmtCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);
  const fmtNumber = (v) => new Intl.NumberFormat('es-CO').format(v || 0);

  // Tasa de conversion: READ / SENT
  const conversionRate = data && data.total_sent > 0
    ? ((data.total_read / data.total_sent) * 100).toFixed(1)
    : '0.0';

  // Tasa de respuesta: mensajes con hubo_respuesta=true / total enviados
  const responseRate = data && data.total_sent > 0
    ? ((data.total_responded / data.total_sent) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <MetricCard
        title="Ingresos Atribuidos"
        value={fmtCurrency(data?.total_revenue)}
        subtitle={`${fmtNumber(data?.total_payments_count || 0)} pagos con touch WhatsApp (30d)`}
        icon={DollarSign}
        color="bg-green-100 text-green-600"
        loading={loading}
      />
      <MetricCard
        title="Acuerdos Atribuidos"
        value={fmtNumber(data?.total_agreements)}
        subtitle={data?.total_agreement_value ? `Valor: ${fmtCurrency(data.total_agreement_value)}` : null}
        icon={FileCheck}
        color="bg-blue-100 text-blue-600"
        loading={loading}
      />
      <MetricCard
        title="Mensajes Enviados"
        value={fmtNumber(data?.total_sent)}
        subtitle={`${fmtNumber(data?.total_failed || 0)} fallidos`}
        icon={MessageCircle}
        color="bg-purple-100 text-purple-600"
        loading={loading}
      />
      <MetricCard
        title="Tasa de Lectura"
        value={`${conversionRate}%`}
        subtitle={`${fmtNumber(data?.total_read || 0)} de ${fmtNumber(data?.total_sent || 0)} leidos`}
        icon={TrendingUp}
        color="bg-yellow-100 text-yellow-600"
        loading={loading}
      />
      <MetricCard
        title="Tasa de Respuesta"
        value={`${responseRate}%`}
        subtitle={`${fmtNumber(data?.total_responded || 0)} respondieron (72h)`}
        icon={MessageSquareReply}
        color="bg-teal-100 text-teal-600"
        loading={loading}
      />
    </div>
  );
};

export default WhatsAppKPICards;
