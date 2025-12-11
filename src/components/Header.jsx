import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logos renovar_Mesa vertic_fondoblanco.svg';
import NotificationIcon from './NotificationIcon';

// --- Iconos para el menú de usuario ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

// --- Iconos para la navegación ---
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ClientsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CampaignsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const TemplatesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ReportsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const LegalApprovalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5-2h-3V4a1 1 0 00-1-1H8a1 1 0 00-1 1v4H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V11a1 1 0 00-1-1z" /></svg>;
const CommunicationsNavIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;


const Header = ({ onOpenChangePassword }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    sessionStorage.setItem('logoutReason', 'manual');
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const navLinkClasses = "flex items-center text-gray-600 hover:text-blue-600 transition-all duration-300 ease-in-out group";
  const activeLinkClasses = "text-blue-600 font-semibold";

  const resolvedRoles = Array.isArray(user?.decoded?.roles)
    ? user.decoded.roles
    : user?.decoded?.role
      ? [user.decoded.role]
      : [];

  const allNavLinks = [
    { to: "/", text: "Dashboard", icon: <DashboardIcon />, roles: ["Admin", "Super Administrador", "Coordinador", "Gestor", "Jurídico", "Directora de Operaciones"] },
    { to: "/clients", text: "Clientes", icon: <ClientsIcon />, roles: ["Admin", "Super Administrador", "Coordinador", "Gestor"] },
    { to: "/campaigns", text: "Campañas", icon: <CampaignsIcon />, roles: ["Admin", "Super Administrador", "Coordinador"] },
    { to: "/comunicaciones", text: "Comunicaciones", icon: <CommunicationsNavIcon />, roles: ["Admin", "Coordinador", "Gestor"] },
    {
      to: resolvedRoles.some(r => ["Admin", "Super Administrador", "Jurídico", "Directora de Operaciones"].includes(r)) ? "/templates/approval" : "/templates",
      text: "Plantillas",
      icon: <TemplatesIcon />,
      roles: ["Admin", "Super Administrador", "Coordinador", "Jurídico", "Directora de Operaciones"]
    },
    {
      to: "/communications/legal-approval",
      text: "Aprobación Jurídica",
      icon: <LegalApprovalIcon />,
      roles: ["Admin", "Super Administrador", "Jurídico", "Juridico"],
      strictForRoles: true
    },
    { to: "/reports", text: "Reportes", icon: <ReportsIcon />, roles: ["Admin", "Super Administrador", "Coordinador"] },
    { to: "/chat", text: "Chat Unificado", icon: <ChatIcon />, roles: ["Admin", "Super Administrador", "Coordinador", "Gestor"] },
    { to: "/administracion-personal", text: "Admón. Personal", icon: <BriefcaseIcon />, roles: ["Admin", "Super Administrador", "Jurídico"] },
  ];

  const hasSuperAdmin = resolvedRoles.includes("Super Administrador");
  const accessibleNavLinks = resolvedRoles.length > 0
    ? allNavLinks.filter(link => {
        if (hasSuperAdmin && !link.strictForRoles) {
          return true;
        }
        return resolvedRoles.some(userRole => link.roles.includes(userRole));
      })
    : [];

  return (
    <header className="bg-white shadow-md p-3 flex justify-between items-center sticky top-0 z-50 bg-opacity-95 backdrop-blur-sm border-b border-gray-100">
      <NavLink to="/" className="flex items-center">
        <img src={logo} alt="Logo Renovar" className="h-12 w-auto" />
        <span className="text-2xl font-semibold bg-gradient-to-r from-[#6558a1] to-[#e8437f] text-transparent bg-clip-text ml-2">
          AuraTech
        </span>
      </NavLink>

      <nav className="hidden md:flex items-center space-x-4">
        {accessibleNavLinks.map(link => (
          <NavLink key={link.to} to={link.to} className={({isActive}) => isActive ? `${navLinkClasses} ${activeLinkClasses}` : navLinkClasses}>
            {link.icon}
            <span className="ml-2 max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out">{link.text}</span>
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center space-x-4">
        <NotificationIcon />
        <div className="relative" ref={menuRef}>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center focus:outline-none">
            <div className="text-right mr-3">
              <p className="font-semibold text-gray-800 text-sm">{user && user.decoded ? user.decoded.full_name : 'Usuario'}</p>
              <p className="text-xs text-gray-500">{user && user.decoded ? user.decoded.role : 'Rol'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold">
              {user && user.decoded ? getInitials(user.decoded.full_name) : 'U'}
            </div>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 border">
              <ul className="py-1">
                <li>
                  <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <UserIcon />
                    <span className="ml-3">Mi Perfil</span>
                  </a>
                </li>
                <li>
                <button onClick={onOpenChangePassword} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <LockIcon />
                  <span className="ml-3">Cambiar Contraseña</span>
                </button>
              </li>
              <hr className="my-1"/>
                <li>
                  <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogoutIcon />
                    <span className="ml-3">Cerrar Sesión</span>
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
