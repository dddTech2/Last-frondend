import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import systemConfigurationService from '../services/systemConfigurationService';
import QuickAccessCard from '../components/QuickAccessCard';
import { AlertTriangle, Info, AlertCircle, CheckCircle2, X } from 'lucide-react';

const WelcomeHeader = ({ name }) => (
  <div className="mb-8">
    <h1 className="text-3xl font-bold text-gray-800">Bienvenido de vuelta, {name}</h1>
    <p className="text-gray-500">Aquí tienes un resumen de tu actividad y herramientas principales</p>
  </div>
);

// --- Iconos para los accesos rápidos ---
const ManageClientsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const BulkCampaignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>;
const UserManagementIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ReportsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const WorkflowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const TemplateApprovalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const CommunicationsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const LegalApprovalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6-3h-4V4a1 1 0 00-1-1H8a1 1 0 00-1 1v1H3a1 1 0 00-1 1v13a1 1 0 001 1h18a1 1 0 001-1V8a1 1 0 00-1-1z" /></svg>;
const BuilderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const RagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

const HomePage = () => {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const [banner, setBanner] = useState(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  useEffect(() => {
    loadBanner();
  }, []);

  const loadBanner = async () => {
    try {
      const data = await systemConfigurationService.getPublicBanner();
      setBanner(data);
    } catch (err) {
      console.error('Error fetching system banner:', err);
    }
  };

  // Definimos todos los accesos rápidos posibles filtrados por permisos
  const allQuickAccessItems = [
    { title: "Gestionar Clientes", description: "Administra y consulta información de clientes", icon: <ManageClientsIcon />, path: "/clients", permission: "clients:read" },
    { title: "Localización y Scraping", description: "Consulta datos de contacto, EPS, seguridad social y vehículos en vivo", icon: <LocationIcon />, path: "/localizacion", permissions: ["localizacion:read", "localizacion:manage"] },
    { title: "Campañas Masivas", description: "Crea y gestiona campañas de comunicación", icon: <BulkCampaignIcon />, path: "/campaigns", permission: "campaigns:read" },
    { title: "Centro de Comunicaciones", description: "Crea campañas por Email, SMS o WhatsApp", icon: <CommunicationsIcon />, path: "/comunicaciones", permissions: ["communications:read", "communications:generate"] },
    { title: "Constructor de Comunicaciones", description: "Crea y configura plantillas de documentos", icon: <BuilderIcon />, path: "/communications/builder", permission: "communications:generate" },
    { title: "Aprobación de Plantillas", description: "Revisa y aprueba plantillas de mensajes", icon: <TemplateApprovalIcon />, path: "/templates/approval", permissions: ["templates:approve_legal", "templates:approve_ops"] },
    { title: "Crear Plantilla", description: "Crea nuevas plantillas de SMS, WhatsApp o Email", icon: <BuilderIcon />, path: "/templates/new", permission: "templates:create" },
    { title: "Aprobación Jurídica", description: "Revisa comunicaciones pendientes de Jurídico", icon: <LegalApprovalIcon />, path: "/communications/legal-approval", permission: "communications:approve_legal" },
    { title: "Demográficos", description: "Automatiza flujos de comunicación inteligentes", icon: <WorkflowIcon />, path: "/workflows", permission: "workflows:manage" },
    { title: "Gestión de Usuarios y Roles", description: "Administra usuarios, roles y permisos granulares", icon: <UserManagementIcon />, path: "/users", permissions: ["users:read", "roles:manage"] },
    { title: "Reportes y Analítica", description: "Visualiza métricas y genera reportes", icon: <ReportsIcon />, path: "/reports", permission: "reports:read" },
    { title: "Chat Unificado", description: "Gestiona conversaciones de WhatsApp con clientes", icon: <ChatIcon />, path: "/chat", permission: "whatsapp:chat" },
    { title: "Administración de Personal", description: "Gestionar altas, bajas y usuarios de nómina", icon: <BriefcaseIcon />, path: "/administracion-personal", permissions: ["employees:read", "employees:write"] },
    { title: "Gestión de Conocimiento (RAG)", description: "Administra documentos y base de conocimiento para la IA", icon: <RagIcon />, path: "/rag-admin", permission: "rag:manage" },
  ];

  const accessibleItems = allQuickAccessItems.filter(item => {
    if (item.public) return true;
    if (!item.permission && !item.permissions) return true;
    if (item.permission) return hasPermission(item.permission);
    if (item.permissions) return hasAnyPermission(item.permissions);
    return false;
  });

  const getBannerStyles = (type) => {
    switch (type) {
      case 'danger':
        return {
          container: 'bg-rose-50 border-rose-200 text-rose-900',
          icon: <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />,
          title: 'text-rose-950 font-bold',
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-900',
          icon: <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />,
          title: 'text-blue-950 font-bold',
        };
      case 'success':
        return {
          container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />,
          title: 'text-emerald-950 font-bold',
        };
      case 'warning':
      default:
        return {
          container: 'bg-amber-50 border-amber-200 text-amber-900',
          icon: <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />,
          title: 'text-amber-950 font-bold',
        };
    }
  };

  const bannerStyles = banner ? getBannerStyles(banner.type) : null;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <WelcomeHeader name={user && user.decoded ? user.decoded.full_name : 'Usuario'} />

      {/* Banner Dinámico del Sistema */}
      {banner && banner.enabled && !isBannerDismissed && (
        <div className={`mb-6 p-4 border rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200 ${bannerStyles.container}`}>
          <div className="flex items-center gap-3">
            {bannerStyles.icon}
            <div className="text-sm">
              <span className={bannerStyles.title}>{banner.title}:</span>{' '}
              <span className="text-gray-800 font-medium">{banner.text}</span>
            </div>
          </div>

          {banner.dismissible && (
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer text-gray-500 hover:text-gray-800"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Acceso Rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {accessibleItems.map((item) => (
            <Link to={item.path} key={item.title}>
              <QuickAccessCard title={item.title} description={item.description} icon={item.icon} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
