import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WelcomeHeader from '../components/WelcomeHeader';
import MetricCard from '../components/MetricCard';
import ClientSearch from '../components/ClientSearch';
import QuickAccessCard from '../components/QuickAccessCard';

// Icons for metrics and quick access cards
const WalletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const RecoveryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const CampaignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882A1.882 1.882 0 0112.882 4h.236a1.882 1.882 0 011.882 1.882V6h-4v-.118zM12 15a4 4 0 100-8 4 4 0 000 8z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15a4 4 0 100-8 4 4 0 000 8zm0 0V19m0-4a4 4 0 01-4-4h-2a6 6 0 1012 0h-2a4 4 0 01-4 4z" /></svg>;
const NewClientsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
const ManageClientsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const BulkCampaignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const WorkflowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const UserManagementIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ReportsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const TemplateApprovalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const CommunicationsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;


const HomePage = () => {
  const { user } = useAuth();
  
  console.log('Usuario actual:', user);

  // Definimos todos los accesos rápidos posibles y los roles que pueden verlos
  const allQuickAccessItems = [
    { title: "Gestionar Clientes", description: "Administra y consulta información de clientes", icon: <ManageClientsIcon />, path: "/clients", roles: ["Admin", "Coordinador", "Gestor"] },
    { title: "Campañas Masivas", description: "Crea y gestiona campañas de comunicación", icon: <BulkCampaignIcon />, path: "/campaigns", roles: ["Admin", "Coordinador"] },
    { title: "Centro de Comunicaciones", description: "Crea campañas por Email, SMS o WhatsApp", icon: <CommunicationsIcon />, path: "/comunicaciones", roles: ["Admin", "Coordinador"] },
    { title: "Aprobación de Plantillas", description: "Revisa y aprueba plantillas de mensajes", icon: <TemplateApprovalIcon />, path: "/templates/approval", roles: ["Admin", "Jurídico", "Directora de Operaciones"] },
    { title: "Workflow Builder", description: "Automatiza flujos de comunicación inteligentes", icon: <WorkflowIcon />, path: "/workflows", roles: ["Admin"] },
    { title: "Gestión de Usuarios", description: "Administra usuarios del sistema", icon: <UserManagementIcon />, path: "/users", roles: ["Admin"] },
    { title: "Reportes y Analítica", description: "Visualiza métricas y genera reportes", icon: <ReportsIcon />, path: "/reports", roles: ["Admin", "Coordinador"] },
    { title: "Chat Unificado", description: "Gestiona conversaciones de WhatsApp con clientes", icon: <ChatIcon />, path: "/chat", roles: ["Admin", "Coordinador", "Gestor"] },
    { title: "Administración de Personal", description: "Gestionar altas, bajas y usuarios de proveedores", icon: <BriefcaseIcon />, path: "/administracion-personal", roles: ["Admin", "Super Administrador", "Jurídico"] },
  ];

  console.log('Todos los accesos rápidos:', allQuickAccessItems);
  
  // Filtramos los accesos rápidos basados en los roles del usuario
  const accessibleItems = user?.decoded?.roles
    ? allQuickAccessItems.filter(item => {
        // Otorga acceso si el usuario es Super Administrador
        if (user.decoded.roles.includes("Super Administrador")) {
          return true;
        }
        // Otorga acceso si alguno de los roles del usuario coincide
        return user.decoded.roles.some(userRole => item.roles.includes(userRole));
      })
    : [];
  
  console.log('Accesos filtrados:', accessibleItems);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <WelcomeHeader name={user ? user.name : 'Invitado'} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Cartera Asignada" value="$15,230.50" icon={<WalletIcon />} />
        <MetricCard title="Recuperación del Mes" value="$8,450.30" icon={<RecoveryIcon />} />
        <MetricCard title="Campañas Activas" value="12" icon={<CampaignIcon />} />
        <MetricCard title="Nuevos Clientes" value="24" icon={<NewClientsIcon />} />
      </div>

      <ClientSearch />

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
