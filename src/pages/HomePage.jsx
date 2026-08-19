import React from 'react';
import { Link } from 'react-router-dom';
import WelcomeHeader from '../components/WelcomeHeader';
import QuickAccessCard from '../components/QuickAccessCard';
import { useAuth } from '../context/AuthContext';

// --- Iconos para las tarjetas de acceso rápido ---
const ManageClientsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const BulkCampaignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const WorkflowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const UserManagementIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const ReportsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
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
  const { user, hasPermission, hasAnyPermission, isAdmin } = useAuth();
  const resolvedRoles = Array.isArray(user?.decoded?.roles)
    ? user.decoded.roles
    : user?.decoded?.role
      ? [user.decoded.role]
      : [];

  // Definimos todos los accesos rápidos posibles filtrados por permisos
  const allQuickAccessItems = [
    { title: "Gestionar Clientes", description: "Administra y consulta información de clientes", icon: <ManageClientsIcon />, path: "/clients", permission: "clients:read" },
    { title: "Localización y Scraping", description: "Consulta datos de contacto, EPS, seguridad social y vehículos en vivo", icon: <LocationIcon />, path: "/localizacion" },
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

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <WelcomeHeader name={user ? user.name : 'Invitado'} />

      {/* Banner de Mantenimiento de WhatsApp */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <span className="font-semibold">Atención:</span> El servicio de WhatsApp se encuentra actualmente en mantenimiento. Por favor, evite utilizar este módulo hasta que se restablezca el servicio.
        </div>
      </div>

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
