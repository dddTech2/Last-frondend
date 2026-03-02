import React from 'react';
import { Megaphone, Mail } from 'lucide-react';

const TypeCard = ({ title, icon: Icon, revenue, count, color, bgColor }) => (
  <div className={`${bgColor} p-5 rounded-lg border`}>
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2 rounded-full ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
    </div>
    <p className="text-xl font-bold text-gray-900">
      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(revenue || 0)}
    </p>
    <p className="text-xs text-gray-500 mt-1">
      {new Intl.NumberFormat('es-CO').format(count || 0)} pagos atribuidos (1er touch)
    </p>
  </div>
);

const WhatsAppOriginKPICards = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-white p-5 rounded-lg border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="h-7 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const campaign = data?.CAMPAIGN || { revenue: 0, count: 0 };
  const communication = data?.COMMUNICATION || { revenue: 0, count: 0 };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <TypeCard
        title="Campanas Masivas"
        icon={Megaphone}
        revenue={campaign.revenue}
        count={campaign.count}
        color="bg-indigo-100 text-indigo-600"
        bgColor="bg-white border-indigo-200"
      />
      <TypeCard
        title="Comunicaciones"
        icon={Mail}
        revenue={communication.revenue}
        count={communication.count}
        color="bg-amber-100 text-amber-600"
        bgColor="bg-white border-amber-200"
      />
    </div>
  );
};

export default WhatsAppOriginKPICards;
