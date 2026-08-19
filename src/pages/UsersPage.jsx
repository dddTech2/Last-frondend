import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Edit2, Trash2, Key, Shield, CheckCircle, XCircle, 
  Loader2, Mail, Lock, User, Unlock, ChevronLeft, ChevronRight, Settings, Plus, 
  Check, Filter, AlertCircle, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import ModernModal from '../components/ModernModal';
import FormField from '../components/FormField';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

const UsersPage = () => {
  const { hasPermission, isAdmin } = useAuth();
  
  // Active Tab
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'roles'

  // Users State
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State for Users
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assignRolesModalOpen, setAssignRolesModalOpen] = useState(false);
  
  // Roles Management Modals
  const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);
  const [editRolePermsModalOpen, setEditRolePermsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermIds, setSelectedPermIds] = useState([]);
  const [permSearchTerm, setPermSearchTerm] = useState('');

  // Selected user for actions
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({});
  const [roleFormData, setRoleFormData] = useState({ name: '', description: '', permission_ids: [] });
  const [submitting, setSubmitting] = useState(false);

  // Initial load
  useEffect(() => {
    fetchUsers();
    fetchRolesAndPermissions();
  }, []);

  const DEFAULT_PERMISSIONS = [
    { id: 1, name: 'users:read', description: 'Visualizar listado de usuarios' },
    { id: 2, name: 'users:write', description: 'Crear, editar, eliminar y cambiar contraseñas de usuarios' },
    { id: 3, name: 'users:unlock', description: 'Desbloquear cuentas bloqueadas por intentos fallidos' },
    { id: 4, name: 'roles:manage', description: 'Crear roles y modificar matriz de permisos' },
    { id: 5, name: 'campaigns:read', description: 'Visualizar campañas y sus métricas' },
    { id: 6, name: 'campaigns:create', description: 'Crear y ejecutar campañas masivas' },
    { id: 7, name: 'campaigns:cancel', description: 'Cancelar campañas en curso' },
    { id: 8, name: 'templates:read', description: 'Visualizar plantillas de mensajes y documentos' },
    { id: 9, name: 'templates:create', description: 'Crear y editar plantillas' },
    { id: 10, name: 'templates:approve_legal', description: 'Aprobar plantillas desde el área jurídica' },
    { id: 11, name: 'templates:approve_ops', description: 'Aprobar plantillas desde operaciones' },
    { id: 12, name: 'communications:read', description: 'Consultar centro de comunicaciones' },
    { id: 13, name: 'communications:generate', description: 'Generar documentos y comunicaciones' },
    { id: 14, name: 'communications:approve_legal', description: 'Aprobación jurídica de comunicaciones' },
    { id: 15, name: 'employees:read', description: 'Consultar listado de colaboradores' },
    { id: 16, name: 'employees:write', description: 'Crear y modificar información de empleados' },
    { id: 17, name: 'employees:bulk_update', description: 'Carga masiva CSV de empleados' },
    { id: 18, name: 'employees:retirement_request', description: 'Solicitar retiro de colaboradores' },
    { id: 19, name: 'employees:retirement_legal_approve', description: 'Aprobación jurídica de retiros y contratos' },
    { id: 20, name: 'whatsapp:chat', description: 'Acceso a conversaciones y chat de WhatsApp' },
    { id: 21, name: 'whatsapp:instances:manage', description: 'Gestionar instancias de Evolution API' },
    { id: 22, name: 'reports:read', description: 'Consultar reportes generales' },
    { id: 23, name: 'reports:calls:read', description: 'Consultar reportes de llamadas 3CX' },
    { id: 24, name: 'reports:productivity:read', description: 'Consultar reportes de productividad y pagos' },
    { id: 25, name: 'reports:whatsapp:read', description: 'Consultar reportes de BI WhatsApp' },
    { id: 26, name: 'workflows:manage', description: 'Gestionar flujos demográficos y automatizaciones' },
    { id: 27, name: 'clients:read', description: 'Consultar información y visión 360 de clientes' },
    { id: 28, name: 'tickets:read', description: 'Visualizar tickets de soporte' },
    { id: 29, name: 'tickets:create', description: 'Crear tickets y comentarios de soporte' },
    { id: 30, name: 'tickets:manage', description: 'Gestionar, priorizar y resolver tickets' },
    { id: 31, name: 'rag:manage', description: 'Administrar base de conocimiento RAG' }
  ];

  const fetchUsersAndRoles = async () => {
    setLoading(true);
    setRolesLoading(true);
    try {
      const [usersData, rolesData, permsData] = await Promise.all([
        api.getUsers(0, 1000).catch(() => []),
        api.getRoles().catch(() => []),
        api.getAllPermissions().catch(() => [])
      ]);

      setUsers(usersData || []);

      // Si el endpoint de roles devolvió datos, usamos esos
      if (rolesData && rolesData.length > 0) {
        setRoles(rolesData);
      } else if (usersData && usersData.length > 0) {
        // Fallback inteligente: extraer los roles únicos de los usuarios cargados
        const rolesMap = new Map();
        usersData.forEach(u => {
          (u.roles || []).forEach(r => {
            if (!rolesMap.has(r.id)) {
              rolesMap.set(r.id, {
                id: r.id,
                name: r.name,
                description: r.description || `Rol: ${r.name}`,
                permissions: r.permissions || []
              });
            }
          });
        });
        setRoles(Array.from(rolesMap.values()).sort((a, b) => a.id - b.id));
      }

      if (permsData && permsData.length > 0) {
        setAllPermissions(permsData);
      } else {
        setAllPermissions(DEFAULT_PERMISSIONS);
      }
    } catch (error) {
      toast.error('Error al cargar información de usuarios y roles');
      console.error(error);
    } finally {
      setLoading(false);
      setRolesLoading(false);
    }
  };

  const fetchUsers = fetchUsersAndRoles;
  const fetchRolesAndPermissions = fetchUsersAndRoles;

  // Group permissions by category (prefix before :)
  const groupedPermissions = useMemo(() => {
    const groups = {};
    const filtered = allPermissions.filter(p => 
      p.name.toLowerCase().includes(permSearchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(permSearchTerm.toLowerCase()))
    );

    filtered.forEach(p => {
      const category = p.name.split(':')[0] || 'otros';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(p);
    });

    return groups;
  }, [allPermissions, permSearchTerm]);

  // Handlers
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.adminfo_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Create User
  const openCreateModal = () => {
    setFormData({
      full_name: '',
      email: '',
      password: '',
      adminfo_code: '',
      is_active: true,
      role_ids: roles.length > 0 ? [roles[0].id] : [2]
    });
    setCreateModalOpen(true);
  };

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password || !formData.full_name || !formData.adminfo_code) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        is_active: formData.is_active,
        is_superuser: false,
        adminfo_code: formData.adminfo_code,
        role_id: formData.role_ids?.[0] || 2
      };
      
      await api.createUser(payload);
      toast.success('Usuario creado exitosamente');
      setCreateModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Error al crear usuario');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit User
  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      adminfo_code: user.adminfo_code,
      is_active: user.is_active
    });
    setEditModalOpen(true);
  };

  const handleUpdateUser = async () => {
    setSubmitting(true);
    try {
      await api.updateUser(selectedUser.id, formData);
      toast.success('Usuario actualizado');
      setEditModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Error al actualizar');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset Password
  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setFormData({ new_password: '' });
    setPasswordModalOpen(true);
  };

  const handleResetPassword = async () => {
    if (!formData.new_password) {
      toast.error('Por favor ingresa una nueva contraseña');
      return;
    }

    setSubmitting(true);
    try {
      await api.resetUserPassword(selectedUser.id, formData.new_password);
      toast.success('Contraseña restablecida');
      setPasswordModalOpen(false);
    } catch (error) {
      toast.error(error.message || 'Error al restablecer contraseña');
    } finally {
      setSubmitting(false);
    }
  };

  // Unlock User
  const handleUnlockUser = async (user) => {
    try {
      await api.unlockUser(user.id);
      toast.success(`Cuenta de ${user.full_name} desbloqueada`);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Error al desbloquear cuenta');
    }
  };

  // Delete User
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    setSubmitting(true);
    try {
      await api.deleteUser(selectedUser.id);
      toast.success('Usuario eliminado');
      setDeleteModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Error al eliminar usuario');
    } finally {
      setSubmitting(false);
    }
  };

  // Assign Roles to User
  const openAssignRolesModal = (user) => {
    setSelectedUser(user);
    const currentRoleIds = (user.roles || []).map(r => r.id);
    setSelectedPermIds(currentRoleIds);
    setAssignRolesModalOpen(true);
  };

  const handleSaveUserRoles = async () => {
    setSubmitting(true);
    try {
      await api.updateUserRoles(selectedUser.id, selectedPermIds);
      toast.success('Roles de usuario actualizados');
      setAssignRolesModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Error al actualizar roles');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Role Management Handlers ---

  const openCreateRoleModal = () => {
    setRoleFormData({ name: '', description: '', permission_ids: [] });
    setSelectedPermIds([]);
    setPermSearchTerm('');
    setCreateRoleModalOpen(true);
  };

  const handleCreateRole = async () => {
    if (!roleFormData.name.trim()) {
      toast.error('El nombre del rol es obligatorio');
      return;
    }
    setSubmitting(true);
    try {
      await api.createRole({
        name: roleFormData.name.trim(),
        description: roleFormData.description?.trim() || null,
        permission_ids: selectedPermIds
      });
      toast.success('Rol creado exitosamente');
      setCreateRoleModalOpen(false);
      fetchRolesAndPermissions();
    } catch (error) {
      toast.error(error.message || 'Error al crear rol');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditRolePermsModal = (role) => {
    setSelectedRole(role);
    const existingPermIds = (role.permissions || []).map(p => p.id);
    setSelectedPermIds(existingPermIds);
    setPermSearchTerm('');
    setEditRolePermsModalOpen(true);
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;
    setSubmitting(true);
    try {
      await api.updateRolePermissions(selectedRole.id, selectedPermIds);
      toast.success(`Permisos actualizados para el rol ${selectedRole.name}`);
      setEditRolePermsModalOpen(false);
      fetchRolesAndPermissions();
      fetchUsers(); // Refresh users to reflect updated permissions
    } catch (error) {
      toast.error(error.message || 'Error al actualizar permisos del rol');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePermission = (permId) => {
    setSelectedPermIds(prev => 
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const toggleCategoryPermissions = (perms) => {
    const permIds = perms.map(p => p.id);
    const allSelected = permIds.every(id => selectedPermIds.includes(id));
    if (allSelected) {
      setSelectedPermIds(prev => prev.filter(id => !permIds.includes(id)));
    } else {
      setSelectedPermIds(prev => Array.from(new Set([...prev, ...permIds])));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-blue-600" />
            Gestión de Usuarios y Roles
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra usuarios del sistema, asignación de roles y permisos atómicos granulares.
          </p>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'users' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Usuarios ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'roles' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Roles y Permisos ({roles.length})
            </button>
          </div>

          {activeTab === 'users' ? (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-colors text-sm"
            >
              <UserPlus className="h-4 w-4" />
              Nuevo Usuario
            </button>
          ) : (
            <button
              onClick={openCreateRoleModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              Nuevo Rol
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: USUARIOS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o adminfo..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>por página</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 text-gray-700 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Adminfo</th>
                  <th className="px-6 py-4">Roles Asignados</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        Cargando usuarios...
                      </div>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                          {user.adminfo_code || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 items-center">
                          {(user.roles || []).map((role) => (
                            <span 
                              key={role.id} 
                              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                                role.name === 'Admin' || role.name === 'Super Administrador'
                                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                  : role.name === 'Coordinador'
                                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                  : role.name === 'Jurídico'
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}
                            >
                              {role.name}
                            </span>
                          ))}
                          <button
                            onClick={() => openAssignRolesModal(user)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                            title="Modificar roles"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.locked_until && new Date(user.locked_until) > new Date() ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                            <Lock className="h-3 w-3" />
                            Bloqueado
                          </span>
                        ) : user.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                            <CheckCircle className="h-3 w-3" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                            <XCircle className="h-3 w-3" />
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {user.locked_until && new Date(user.locked_until) > new Date() && (
                            <button
                              onClick={() => handleUnlockUser(user)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Desbloquear cuenta"
                            >
                              <Unlock className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openPasswordModal(user)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Cambiar contraseña"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar usuario"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredUsers.length > 0 && (
            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
              <div className="text-xs text-gray-500">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredUsers.length)} de {filteredUsers.length} usuarios
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 py-1 text-xs font-medium text-gray-700">
                  {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROLES Y PERMISOS */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rolesLoading ? (
              <div className="col-span-full py-12 text-center text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
                <p className="mt-2 text-sm">Cargando catálogo de roles y permisos...</p>
              </div>
            ) : roles.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-400">
                No hay roles configurados en el sistema
              </div>
            ) : (
              roles.map((role) => (
                <div key={role.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                          <Shield className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">{role.name}</h3>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                        ID: {role.id}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mt-3 min-h-[40px]">
                      {role.description || 'Sin descripción configurada.'}
                    </p>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span>Permisos asociados:</span>
                      <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {role.permissions?.length || 0} permisos
                      </span>
                    </div>

                    {/* Preview of top 3 permissions */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(role.permissions || []).slice(0, 3).map(p => (
                        <span key={p.id} className="text-[11px] bg-gray-50 text-gray-600 px-2 py-0.5 rounded border border-gray-100 font-mono">
                          {p.name}
                        </span>
                      ))}
                      {(role.permissions?.length || 0) > 3 && (
                        <span className="text-[11px] text-gray-400 px-1 py-0.5">
                          +{(role.permissions.length - 3)} más
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => openEditRolePermsModal(role)}
                      className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Configurar Permisos
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Assign Roles to User Modal */}
      <ModernModal
        isOpen={assignRolesModalOpen}
        onClose={() => setAssignRolesModalOpen(false)}
        title="Asignar Roles a Usuario"
        icon={<Shield className="h-6 w-6 text-blue-600" />}
        size="md"
        actions={
          <>
            <button 
              onClick={() => setAssignRolesModalOpen(false)} 
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSaveUserRoles} 
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar Roles
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecciona los roles que deseas asignar a <strong>{selectedUser?.full_name}</strong> ({selectedUser?.email}). El usuario heredará todos los permisos asociados a estos roles.
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto p-1">
            {roles.map((role) => {
              const isChecked = selectedPermIds.includes(role.id);
              return (
                <label
                  key={role.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isChecked 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setSelectedPermIds(prev => 
                        prev.includes(role.id) 
                          ? prev.filter(id => id !== role.id) 
                          : [...prev, role.id]
                      );
                    }}
                    className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm flex items-center justify-between">
                      <span>{role.name}</span>
                      <span className="text-xs text-gray-500 font-normal">
                        {role.permissions?.length || 0} permisos
                      </span>
                    </div>
                    {role.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </ModernModal>

      {/* Edit Role Permissions Modal */}
      <ModernModal
        isOpen={editRolePermsModalOpen}
        onClose={() => setEditRolePermsModalOpen(false)}
        title={`Configurar Permisos: ${selectedRole?.name}`}
        icon={<Settings className="h-6 w-6 text-indigo-600" />}
        size="lg"
        actions={
          <>
            <button 
              onClick={() => setEditRolePermsModalOpen(false)} 
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSaveRolePermissions} 
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar {selectedPermIds.length} Permisos
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrar permisos..."
                value={permSearchTerm}
                onChange={(e) => setPermSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-semibold text-indigo-600">{selectedPermIds.length}</span> de {allPermissions.length} seleccionados
            </div>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {Object.entries(groupedPermissions).map(([category, perms]) => {
              const allCategorySelected = perms.every(p => selectedPermIds.includes(p.id));
              const someCategorySelected = perms.some(p => selectedPermIds.includes(p.id));

              return (
                <div key={category} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
                    <span className="font-bold text-xs uppercase tracking-wider text-gray-700">
                      Módulo: {category} ({perms.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleCategoryPermissions(perms)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {allCategorySelected ? 'Desmarcar todos' : 'Marcar todos'}
                    </button>
                  </div>

                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white">
                    {perms.map(p => {
                      const isChecked = selectedPermIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer text-xs transition-all ${
                            isChecked 
                              ? 'border-indigo-500 bg-indigo-50/40 text-indigo-950 font-medium' 
                              : 'border-gray-100 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(p.id)}
                            className="mt-0.5 h-3.5 w-3.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                          />
                          <div className="flex-1">
                            <div className="font-mono text-[11px]">{p.name}</div>
                            {p.description && (
                              <div className="text-[10px] text-gray-500 font-normal">{p.description}</div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ModernModal>

      {/* Create Custom Role Modal */}
      <ModernModal
        isOpen={createRoleModalOpen}
        onClose={() => setCreateRoleModalOpen(false)}
        title="Crear Nuevo Rol Personalizado"
        icon={<Plus className="h-6 w-6 text-indigo-600" />}
        size="lg"
        actions={
          <>
            <button 
              onClick={() => setCreateRoleModalOpen(false)} 
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleCreateRole} 
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear Rol
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField
            label="Nombre del Rol *"
            name="name"
            placeholder="Ej. Auditor Externo, Especialista Jurídico"
            value={roleFormData.name}
            onChange={(e) => setRoleFormData(prev => ({ ...prev, name: e.target.value }))}
            icon={<Shield className="h-4 w-4" />}
          />
          <FormField
            label="Descripción"
            name="description"
            placeholder="Describe las responsabilidades o alcance de este rol"
            value={roleFormData.description}
            onChange={(e) => setRoleFormData(prev => ({ ...prev, description: e.target.value }))}
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Seleccionar Permisos Iniciales ({selectedPermIds.length} seleccionados)
            </label>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="border border-gray-200 rounded-lg p-2.5 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-gray-700 uppercase">{category}</span>
                    <button
                      type="button"
                      onClick={() => toggleCategoryPermissions(perms)}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Alternar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {perms.map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-xs bg-white p-1.5 rounded border border-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPermIds.includes(p.id)}
                          onChange={() => togglePermission(p.id)}
                          className="h-3.5 w-3.5 text-indigo-600 rounded"
                        />
                        <span className="font-mono text-[11px] text-gray-800">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ModernModal>

      {/* Create User Modal */}
      <ModernModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Crear Nuevo Usuario"
        icon={<UserPlus className="h-6 w-6 text-blue-600" />}
        size="md"
        actions={
          <>
            <button 
              onClick={() => setCreateModalOpen(false)} 
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleCreateUser} 
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear Usuario
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField
            label="Nombre Completo"
            name="full_name"
            placeholder="Ej. Juan Pérez"
            value={formData.full_name || ''}
            onChange={handleChange}
            icon={<User className="h-4 w-4" />}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Correo Electrónico"
              name="email"
              type="email"
              placeholder="usuario@renovar.com"
              value={formData.email || ''}
              onChange={handleChange}
              icon={<Mail className="h-4 w-4" />}
            />
            <FormField
              label="Código Adminfo"
              name="adminfo_code"
              placeholder="Ej. admin"
              value={formData.adminfo_code || ''}
              onChange={handleChange}
              icon={<Shield className="h-4 w-4" />}
            />
          </div>
          <FormField
            label="Contraseña"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password || ''}
            onChange={handleChange}
            icon={<Lock className="h-4 w-4" />}
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Rol Principal
            </label>
            <select
              value={formData.role_ids?.[0] || 2}
              onChange={(e) => setFormData(prev => ({ ...prev, role_ids: [Number(e.target.value)] }))}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              name="is_active"
              id="active_check" 
              checked={formData.is_active || false}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="active_check" className="text-sm text-gray-700 select-none">Usuario Activo</label>
          </div>
        </div>
      </ModernModal>

      {/* Edit User Modal */}
      <ModernModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Editar Usuario"
        icon={<Edit2 className="h-6 w-6 text-blue-600" />}
        size="md"
        actions={
          <>
            <button 
              onClick={() => setEditModalOpen(false)} 
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleUpdateUser} 
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar Cambios
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField
            label="Nombre Completo"
            name="full_name"
            value={formData.full_name || ''}
            onChange={handleChange}
            icon={<User className="h-4 w-4" />}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Correo Electrónico"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
              icon={<Mail className="h-4 w-4" />}
            />
            <FormField
              label="Código Adminfo"
              name="adminfo_code"
              value={formData.adminfo_code || ''}
              onChange={handleChange}
              icon={<Shield className="h-4 w-4" />}
              disabled
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              name="is_active"
              id="edit_active_check" 
              checked={formData.is_active || false}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="edit_active_check" className="text-sm text-gray-700 select-none">Usuario Activo</label>
          </div>
        </div>
      </ModernModal>

      {/* Password Reset Modal */}
      <ModernModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Restablecer Contraseña"
        icon={<Key className="h-6 w-6 text-amber-600" />}
        size="sm"
        actions={
          <>
            <button 
              onClick={() => setPasswordModalOpen(false)} 
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleResetPassword} 
              disabled={submitting}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Cambiar Contraseña
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Estás cambiando la contraseña para <strong>{selectedUser?.full_name}</strong>.
          </p>
          <FormField
            label="Nueva Contraseña"
            name="new_password"
            type="password"
            placeholder="••••••••"
            value={formData.new_password || ''}
            onChange={handleChange}
            icon={<Lock className="h-4 w-4" />}
            autoFocus
          />
        </div>
      </ModernModal>

      {/* Delete Confirmation Modal */}
      <ModernModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Eliminar Usuario"
        icon={<Trash2 className="h-6 w-6 text-red-600" />}
        size="sm"
        actions={
          <>
            <button 
              onClick={() => setDeleteModalOpen(false)} 
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleDeleteUser} 
              disabled={submitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Eliminar Definitivamente
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar al usuario <strong>{selectedUser?.full_name}</strong>?
          </p>
          <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
            Esta acción no se puede deshacer. El usuario perderá el acceso al sistema inmediatamente.
          </p>
        </div>
      </ModernModal>

    </div>
  );
};

export default UsersPage;
