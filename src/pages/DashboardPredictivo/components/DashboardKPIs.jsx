import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDashboardStore } from '../../../store/dashboardStore';
import { getDashboardKPIs } from '../../../services/dashboard';
import MetricCard from '../../../components/MetricCard';
import { Phone, CheckCircle, DollarSign, ArrowRightLeft, FileText, CreditCard } from 'lucide-react';

const DashboardKPIs = () => {
  const filters = useDashboardStore((state) => state.filters);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardKPIs', filters],
    queryFn: () => getDashboardKPIs(filters)
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm h-24 border border-slate-100 flex items-center">
             <div className="w-12 h-12 bg-slate-200 rounded-full mr-4"></div>
             <div className="flex-1 space-y-2"><div className="h-4 bg-slate-200 rounded w-1/2"></div><div className="h-6 bg-slate-200 rounded w-3/4"></div></div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-8 border border-red-100">Error al cargar KPIs. Reintente más tarde.</div>;
  }

  const kpis = [
    { title: 'Total Llamadas', value: data?.total_llamadas?.toLocaleString() || 0, icon: <div className="bg-blue-100 p-3 rounded-xl"><Phone className="h-6 w-6 text-blue-600" /></div> },
    { title: 'Transferencias', value: data?.transferidas?.toLocaleString() || 0, icon: <div className="bg-indigo-100 p-3 rounded-xl"><ArrowRightLeft className="h-6 w-6 text-indigo-600" /></div> },
    { title: 'Total Acuerdos', value: data?.total_acuerdos ? `$${data.total_acuerdos.toLocaleString()}` : '$0', subtitle: `${data?.cantidad_acuerdos || 0} cant.`, icon: <div className="bg-emerald-100 p-3 rounded-xl"><CheckCircle className="h-6 w-6 text-emerald-600" /></div> },
    { title: 'Total Pagos', value: data?.recaudo_total ? `$${data.recaudo_total.toLocaleString()}` : '$0', subtitle: `${data?.cantidad_pagos || 0} cant.`, icon: <div className="bg-amber-100 p-3 rounded-xl"><DollarSign className="h-6 w-6 text-amber-600" /></div> },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpis.map((kpi, index) => (
        <MetricCard key={index} title={kpi.title} value={kpi.value} icon={kpi.icon} subtitle={kpi.subtitle} />
      ))}
    </div>
  );
};

export default DashboardKPIs;
