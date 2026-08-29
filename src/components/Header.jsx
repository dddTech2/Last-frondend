import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logos renovar_Mesa vertic_fondoblanco.svg';
import NotificationIcon from './NotificationIcon';

// --- Iconos para el menú de usuario ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

// --- Iconos de Navegación Directa ---
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ClientsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CampaignsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const TemplatesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const CommunicationsNavIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const LegalApprovalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5-2h-3V4a1 1 0 00-1-1H8a1 1 0 00-1 1v4H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V11a1 1 0 00-1-1z" /></svg>;
const ReportsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const TicketsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>;

// --- Icono de Administración y Dropdown ---
const AdminMenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const Header = ({ onOpenChangePassword }) => {
  const { user, logout, hasPermission, hasAnyPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const adminMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    sessionStorage.setItem('logoutReason', 'manual');
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setIsAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsAdminMenuOpen(false);
  }, [location.pathname]);

  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const navLinkClasses = "flex items-center text-gray-600 hover:text-blue-600 transition-all duration-200 text-sm font-medium py-1 px-2 rounded-lg hover:bg-gray-50";
  const activeLinkClasses = "text-blue-600 font-semibold bg-blue-50/70";

  // 1. Enlaces Directos del Menú Principal
  const directNavLinks = [
    { to: "/", text: "Dashboard", icon: <DashboardIcon /> },
    { to: "/clients", text: "Clientes", icon: <ClientsIcon />, permission: "clients:read" },
    { to: "/campaigns", text: "Campañas", icon: <CampaignsIcon />, permission: "campaigns:read" },
    {
      to: (hasPermission("templates:approve_legal") || hasPermission("templates:approve_ops")) ? "/templates/approval" : "/templates",
      text: "Plantillas",
      icon: <TemplatesIcon />,
      permissions: ["templates:read", "templates:create", "templates:approve_legal", "templates:approve_ops"]
    },
    { to: "/comunicaciones", text: "Comunicaciones", icon: <CommunicationsNavIcon />, permissions: ["communications:read", "communications:generate"] },
    {
      to: "/communications/legal-approval",
      text: "Aprobación Jurídica",
      icon: <LegalApprovalIcon />,
      permission: "communications:approve_legal"
    },
    { to: "/reports", text: "Reportes", icon: <ReportsIcon />, permission: "reports:read" },
    { to: "/chat", text: "Chat Unificado", icon: <ChatIcon />, permission: "whatsapp:chat" },
    { to: "/tickets", text: "Soporte", icon: <TicketsIcon />, permissions: ["tickets:read", "tickets:create"] },
  ];

  // 2. Submenú "Administración"
  const adminSubmenuLinks = [
    {
      to: "/obligation-urls",
      title: "URLs y Tokens de Gestión",
      desc: "Ingesta masiva y links de clientes",
      icon: "🔗",
      permissions: ["campaigns:read", "campaigns:create", "communications:read", "templates:read", "users:read"]
    },
    {
      to: "/whatsapp/rules",
      title: "Reglas de WhatsApp (Límites)",
      desc: "Periodos de gracia, reintentos y elegibilidad",
      icon: "⚡",
      permissions: ["roles:manage", "users:read", "campaigns:create", "templates:create"]
    },
    {
      to: "/whatsapp/evolution",
      title: "Instancias WhatsApp (Evolution)",
      desc: "Estado de conexión y números",
      icon: "📱",
      permission: "whatsapp:instances:manage"
    },
    {
      to: "/condonation-policies",
      title: "Políticas de Condonación",
      desc: "Reglas de descuentos y acuerdos",
      icon: "⚖️",
      permissions: ["templates:read", "templates:create", "communications:read", "roles:manage"]
    },
    {
      to: "/users",
      title: "Usuarios y Roles",
      desc: "Control de acceso y permisos RBAC",
      icon: "👥",
      permissions: ["users:read", "roles:manage"]
    },
    {
      to: "/administracion-personal",
      title: "Administración de Personal",
      desc: "Gestión de empleados y coordinadores",
      icon: "💼",
      permissions: ["employees:read", "employees:write"]
    },
    {
      to: "/rag-admin",
      title: "RAG & Base de Conocimiento",
      desc: "Documentos e inteligencia artificial",
      icon: "🧠",
      permission: "rag:manage"
    },
  ];

  const filterAccessible = (list) => {
    return list.filter(item => {
      if (!item.permission && !item.permissions) return true;
      if (item.permission) return hasPermission(item.permission);
      if (item.permissions) return hasAnyPermission(item.permissions);
      return false;
    });
  };

  const accessibleDirectLinks = filterAccessible(directNavLinks);
  const accessibleAdminLinks = filterAccessible(adminSubmenuLinks);

  const isAdminActive = accessibleAdminLinks.some(l => location.pathname.startsWith(l.to));

  return (
    <header className="bg-white shadow-md p-3 flex justify-between items-center sticky top-0 z-50 bg-opacity-95 backdrop-blur-sm border-b border-gray-100">
      <NavLink to="/" className="flex items-center">
        <img src={logo} alt="Logo Renovar" className="h-10 w-auto" />
        <span className="text-xl font-bold bg-gradient-to-r from-[#6558a1] to-[#e8437f] text-transparent bg-clip-text ml-2">
          AuraTech
        </span>
      </NavLink>

      <nav className="hidden lg:flex items-center space-x-1">
        {/* Enlaces Directos */}
        {accessibleDirectLinks.map(link => (
          <NavLink 
            key={link.to} 
            to={link.to} 
            className={({isActive}) => isActive ? `${navLinkClasses} ${activeLinkClasses}` : navLinkClasses}
            title={link.text}
          >
            {link.icon}
            <span className="ml-1.5">{link.text}</span>
          </NavLink>
        ))}

        {/* Menú Desplegable Administración */}
        {accessibleAdminLinks.length > 0 && (
          <div className="relative" ref={adminMenuRef}>
            <button
              type="button"
              onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
              className={`flex items-center text-sm font-medium py-1 px-2.5 rounded-lg transition-all cursor-pointer ${
                isAdminActive || isAdminMenuOpen ? 'text-indigo-700 bg-indigo-50 font-semibold' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
              }`}
            >
              <AdminMenuIcon />
              <span className="ml-1.5">Administración</span>
              <span className={isAdminMenuOpen ? 'rotate-180 transition-transform' : 'transition-transform'}>
                <ChevronDownIcon />
              </span>
            </button>

            {isAdminMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-800/70 border-b border-gray-100 mb-1">
                  Panel de Administración
                </div>
                <div className="space-y-1">
                  {accessibleAdminLinks.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsAdminMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-start gap-2.5 p-2 rounded-xl transition-all ${
                          isActive ? 'bg-indigo-50 text-indigo-800 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                        }`
                      }
                    >
                      <span className="text-lg mt-0.5">{item.icon}</span>
                      <div>
                        <div className="text-xs font-semibold">{item.title}</div>
                        <div className="text-[10px] text-gray-500 font-normal">{item.desc}</div>
                      </div>
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="flex items-center space-x-3">
        <NotificationIcon />
        <div className="relative" ref={userMenuRef}>
          <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center focus:outline-none cursor-pointer">
            <div className="text-right mr-3 hidden sm:block">
              <p className="font-semibold text-gray-800 text-xs">{user && user.decoded ? user.decoded.full_name : 'Usuario'}</p>
              <p className="text-[10px] text-gray-500">{user && user.decoded ? user.decoded.role : 'Rol'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user && user.decoded ? getInitials(user.decoded.full_name) : 'U'}
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl z-30 border border-gray-100 p-1.5 animate-in fade-in duration-150">
              <div className="px-3 py-2 border-b border-gray-100 sm:hidden">
                <p className="font-semibold text-gray-800 text-xs">{user && user.decoded ? user.decoded.full_name : 'Usuario'}</p>
                <p className="text-[10px] text-gray-500">{user && user.decoded ? user.decoded.role : 'Rol'}</p>
              </div>
              <ul className="py-1 space-y-0.5">
                <li>
                  <a href="#" className="flex items-center px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-xl">
                    <UserIcon />
                    <span className="ml-2.5">Mi Perfil</span>
                  </a>
                </li>
                {hasAnyPermission(["users:read", "roles:manage"]) && (
                  <li>
                    <NavLink to="/users" onClick={() => setIsUserMenuOpen(false)} className="flex items-center px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 rounded-xl font-medium">
                      <AdminMenuIcon />
                      <span className="ml-2.5">Usuarios y Roles</span>
                    </NavLink>
                  </li>
                )}
                <li>
                  <button onClick={onOpenChangePassword} className="w-full text-left flex items-center px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer">
                    <LockIcon />
                    <span className="ml-2.5">Cambiar Contraseña</span>
                  </button>
                </li>
                <hr className="my-1 border-gray-100"/>
                <li>
                  <button onClick={handleLogout} className="w-full text-left flex items-center px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl cursor-pointer font-medium">
                    <LogoutIcon />
                    <span className="ml-2.5">Cerrar Sesión</span>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
