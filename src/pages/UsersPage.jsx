import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Edit2, Trash2, Key, Shield, CheckCircle, XCircle, 
  Loader2, Mail, Lock, User, Unlock, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import ModernModal from '../components/ModernModal';
import FormField from '../components/FormField';
import * as api from '../services/api';

const UsersPage = () => {
  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  // Selected user for actions
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, [currentPage, itemsPerPage]); // Reload when pagination changes

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch up to 1000 users for client-side handling to ensure smooth search/filter
      const data = await api.getUsers(0, 1000); 
      setUsers(data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.adminfo_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper to update form data from event
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
      role: 'Gestor' // Default role
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
      // Adapt payload to backend schema expectations
      const payload = {
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        is_active: formData.is_active,
        is_superuser: false, // Default to false
        adminfo_code: formData.adminfo_code,
        role_id: 2 // Default to Gestor (assuming ID 2)
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
    if (!formData.new_password || formData.new_password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.resetUserPassword(selectedUser.id, formData.new_password);
      toast.success('Contraseña actualizada');
      setPasswordModalOpen(false);
    } catch (error) {
      toast.error(error.message || 'Error al cambiar contraseña');
    } finally {
      setSubmitting(false);
    }
  };

  // Unlock User
  const handleUnlockUser = async (user) => {
    try {
      await api.unlockUser(user.id);
      toast.success(`Usuario ${user.full_name} desbloqueado`);
      fetchUsers(); // Refresh
    } catch (error) {
      toast.error(error.message || 'Error al desbloquear usuario');
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
      toast.error(error.message || 'Error al eliminar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              Gestión de Usuarios
            </h1>
            <p className="text-gray-500 mt-1">Administra el acceso y roles del sistema</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200"
          >
            <UserPlus className="h-5 w-5" />
            Crear Usuario
          </button>
        </div>

        {/* Search & List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Search Bar */}
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input 
                type="text"
                placeholder="Buscar por nombre, correo o adminfo..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">Usuario</th>
                  <th className="px-6 py-4 text-left">Adminfo</th>
                  <th className="px-6 py-4 text-left">Estado</th>
                  <th className="px-6 py-4 text-left">Rol</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center gap-2 text-gray-400">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Cargando usuarios...</span>
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
                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                            {user.full_name?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                          {user.adminfo_code || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700 border border-gray-200">
                                {typeof role === 'string' ? role : role.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm italic">Sin rol</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button 
                            onClick={() => handleUnlockUser(user)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Desbloquear Usuario"
                          >
                            <Unlock className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => openEditModal(user)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar Información"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => openPasswordModal(user)}
                            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Cambiar Contraseña"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(user)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar Usuario"
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
          {filteredUsers.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> de <span className="font-semibold">{filteredUsers.length}</span> usuarios
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10 por página</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                </select>

                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    className="p-2 text-gray-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-transparent hover:border-gray-200"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="flex items-center px-2 text-sm font-medium text-gray-700">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-2 text-gray-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-transparent hover:border-gray-200"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}

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
            value={formData.full_name}
            onChange={handleChange}
            icon={<User className="h-4 w-4" />}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Correo Electrónico"
              name="email"
              type="email"
              placeholder="usuario@renovar.com"
              value={formData.email}
              onChange={handleChange}
              icon={<Mail className="h-4 w-4" />}
            />
            <FormField
              label="Código Adminfo"
              name="adminfo_code"
              placeholder="Ej. admin"
              value={formData.adminfo_code}
              onChange={handleChange}
              icon={<Shield className="h-4 w-4" />}
            />
          </div>
          <FormField
            label="Contraseña"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            icon={<Lock className="h-4 w-4" />}
          />
          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              name="is_active"
              id="active_check" 
              checked={formData.is_active}
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
            value={formData.full_name}
            onChange={handleChange}
            icon={<User className="h-4 w-4" />}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Correo Electrónico"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              icon={<Mail className="h-4 w-4" />}
            />
            <FormField
              label="Código Adminfo"
              name="adminfo_code"
              value={formData.adminfo_code}
              onChange={handleChange}
              icon={<Shield className="h-4 w-4" />}
              disabled // Assuming adminfo is not easily changeable or keeping it editable if you prefer
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              name="is_active"
              id="edit_active_check" 
              checked={formData.is_active}
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
            value={formData.new_password}
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
