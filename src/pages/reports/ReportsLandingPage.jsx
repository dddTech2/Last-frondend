import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, FileText } from 'lucide-react';

const ReportCard = ({ title, description, icon: Icon, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer flex flex-col items-start"
  >
    <div className="p-3 bg-blue-50 rounded-full mb-4">
      <Icon className="h-6 w-6 text-blue-600" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm">{description}</p>
    <span className="mt-4 text-blue-600 text-sm font-medium hover:underline">Ver reporte &rarr;</span>
  </div>
);

const ReportsLandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Centro de Reportes</h1>
        <p className="text-gray-500 mt-1">Selecciona un reporte para visualizar las métricas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard
          title="Efectividad de Comunicaciones"
          description="Analiza el impacto financiero de las campañas de Email, SMS y WhatsApp cruzado con recaudos."
          icon={BarChart3}
          onClick={() => navigate('/reports/effectiveness')}
        />
        
        {/* Placeholder for future reports */}
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400">
          <FileText className="h-8 w-8 mb-2 opacity-50" />
          <span className="text-sm">Próximamente más reportes</span>
        </div>
      </div>
    </div>
  );
};

export default ReportsLandingPage;
