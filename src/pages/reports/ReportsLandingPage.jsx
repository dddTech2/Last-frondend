import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, FileText, TrendingUp, MessageCircle, LineChart, Phone, Award } from 'lucide-react';

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
  const { user } = useAuth();

  const resolvedRoles = Array.isArray(user?.decoded?.roles)
    ? user.decoded.roles
    : user?.decoded?.role
      ? [user.decoded.role]
      : [];

  const isAuthorizedForProductivity = resolvedRoles.some(role => 
    ['Admin', 'Super Administrador', 'Coordinador', 'Directora de Operaciones'].includes(role)
  );

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
        
        <ReportCard
          title="Efectividad de Campañas Masivas"
          description="Analiza ROI de campañas SMS/WhatsApp/Email con atribución de pagos en ventana de 30 días. Comparación recordatorios vs regulares."
          icon={TrendingUp}
          onClick={() => navigate('/reports/campaign-effectiveness')}
        />
        
        <ReportCard
          title="Dashboard Granular WhatsApp"
          description="Visualiza el embudo de conversión, distribución de errores y atribución de ingresos de WhatsApp."
          icon={MessageCircle}
          onClick={() => navigate('/reports/whatsapp-dashboard')}
        />
        
        <ReportCard
          title="Dashboard Predictivo"
          description="Monitoreo en tiempo real de marcadores predictivos, análisis de recaudo, tiempos de cola y efectividad cruzada de equipos."
          icon={LineChart}
          onClick={() => navigate('/reports/dashboard-predictivo')}
        />
        
        <ReportCard
          title="Informe de Llamadas 3CX"
          description="Consolidado mensual, tendencias y detalle granular de llamadas por gestor. Exportación CSV y alertas de gestores no identificados."
          icon={Phone}
          onClick={() => navigate('/reports/calls')}
        />

        {isAuthorizedForProductivity && (
          <ReportCard
            title="Reporte de Productividad"
            description="Dashboard de productividad dinámica de gestores, rankings, cumplimiento de metas, tendencias temporales y administración de pagos/inasistencias."
            icon={Award}
            onClick={() => navigate('/reports/productivity')}
          />
        )}
        
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
