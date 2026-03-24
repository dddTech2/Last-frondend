import React, { useState } from 'react';
import DashboardSidebar from './components/DashboardSidebar';
import DashboardKPIs from './components/DashboardKPIs';
import TabOverview from './components/TabOverview';
import TabPerformance from './components/TabPerformance';
import TabTimes from './components/TabTimes';
import TabPayments from './components/TabPayments';
import TabQueueAnalysis from './components/TabQueueAnalysis';
import TabTimesDetail from './components/TabTimesDetail';
import TabGestorDetail from './components/TabGestorDetail';
import TabAdvancedAnalysis from './components/TabAdvancedAnalysis';

const DashboardPredictivoPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Visión General' },
    { id: 'performance', label: 'Desempeño' },
    { id: 'gestor-detail', label: '👤 Detalle Gestores' },
    { id: 'times', label: 'Tiempos y Franjas' },
    { id: 'times-detail', label: 'Análisis de Tiempo' },
    { id: 'payments', label: 'Análisis de Pagos' },
    { id: 'advanced', label: '🚀 Análisis Avanzado' },
    { id: 'queue', label: 'Monitoreo de Cola' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-slate-800">
      {/* Sidebar Fijo */}
      <DashboardSidebar />

      {/* Área Principal Scrolleable */}
      <div className="flex-1 flex flex-col overflow-y-auto w-full">
        <div className="p-8 max-w-7xl mx-auto w-full">
          <header className="mb-8 flex flex-col space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard Predictivo</h1>
            <p className="text-slate-500">Métricas avanzadas y análisis de impacto en tiempo real.</p>
          </header>

          {/* KPI Grid - Top Section Always Visible */}
          <DashboardKPIs />

          {/* Navegación por pestañas */}
          <div className="mt-10">
            <div className="border-b border-slate-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[400px]">
              {activeTab === 'overview' && <TabOverview />}
              {activeTab === 'performance' && <TabPerformance />}
              {activeTab === 'gestor-detail' && <TabGestorDetail />}
              {activeTab === 'times' && <TabTimes />}
              {activeTab === 'times-detail' && <TabTimesDetail />}
              {activeTab === 'payments' && <TabPayments />}
              {activeTab === 'advanced' && <TabAdvancedAnalysis />}
              {activeTab === 'queue' && <TabQueueAnalysis />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPredictivoPage;
