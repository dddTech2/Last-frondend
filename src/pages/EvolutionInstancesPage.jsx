import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  Power, 
  Link, 
  ShieldAlert, 
  QrCode, 
  Check, 
  X, 
  Settings, 
  AlertTriangle,
  Loader2,
  Copy,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import ModernModal from '../components/ModernModal';
import {
  getEvolutionInstances,
  createEvolutionInstance,
  getEvolutionInstanceQR,
  restartEvolutionInstance,
  syncEvolutionInstanceProfile,
  configureEvolutionInstanceWebhook,
  updateEvolutionInstanceSettings,
  deleteEvolutionInstance
} from '../services/api';

const EvolutionInstancesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State variables
  const [instances, setInstances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({}); // { [instanceId_action]: boolean }
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWebhookOpen, setIsWebhookOpen] = useState(false);
  
  // Active/selected instance for modals
  const [selectedInstance, setSelectedInstance] = useState(null);
  
  // Form/Input state
  const [newInstanceData, setNewInstanceData] = useState({
    instance_name: '',
    allow_mass_sending: true,
    daily_sent_limit: 250
  });
  
  const [qrCodeData, setQrCodeData] = useState(null);
  const [settingsData, setSettingsData] = useState({
    allow_mass_sending: true,
    daily_sent_limit: 250
  });
  const [webhookUrl, setWebhookUrl] = useState('');
  
  // Polling ref for QR connection state
  const pollingIntervalRef = useRef(null);

  // Check if role is authorized
  const resolvedRoles = Array.isArray(user?.decoded?.roles)
    ? user.decoded.roles
    : user?.decoded?.role
      ? [user.decoded.role]
      : [];

  const isAuthorized = resolvedRoles.some(r => 
    ["Admin", "Super Administrador", "Coordinador", "Directora de Operaciones"].includes(r)
  );

  // Fetch instances list
  const fetchInstances = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await getEvolutionInstances();
      setInstances(data || []);
    } catch (error) {
      console.error('Error fetching instances:', error);
      toast.error(`Error al cargar las instancias: ${error.message}`);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) {
      toast.error('No tienes permisos para acceder a esta sección.');
      navigate('/');
      return;
    }
    fetchInstances();
  }, [isAuthorized, fetchInstances, navigate]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Poll connection state when QR modal is open
  const startQrPolling = (instanceId) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await getEvolutionInstanceQR(instanceId);
        // If state changed to CONNECTED, close modal and reload
        if (res.status === 'CONNECTED') {
          toast.success('¡Instancia vinculada y conectada correctamente!');
          setIsQrOpen(false);
          setQrCodeData(null);
          clearInterval(pollingIntervalRef.current);
          fetchInstances(false);
        } else if (res.qrcode) {
          // Update QR code if changed
          setQrCodeData(res.qrcode);
        }
      } catch (error) {
        console.error('Error polling QR status:', error);
      }
    }, 5000); // Poll every 5 seconds
  };

  const stopQrPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setQrCodeData(null);
    setIsQrOpen(false);
  };

  // Create physical instance
  const handleCreateInstance = async (e) => {
    e.preventDefault();
    setActionLoading(prev => ({ ...prev, create: true }));
    
    try {
      const body = {
        instance_name: newInstanceData.instance_name.trim() || null,
        allow_mass_sending: newInstanceData.allow_mass_sending,
        daily_sent_limit: parseInt(newInstanceData.daily_sent_limit)
      };
      
      const result = await createEvolutionInstance(body);
      toast.success(`Instancia '${result.instance_name}' creada con éxito.`);
      setIsCreateOpen(false);
      
      // Reset form
      setNewInstanceData({
        instance_name: '',
        allow_mass_sending: true,
        daily_sent_limit: 250
      });
      
      // If backend returned QR, show it immediately
      if (result.status === 'CONNECTING' && result.qrcode) {
        setSelectedInstance(result);
        setQrCodeData(result.qrcode);
        setIsQrOpen(true);
        startQrPolling(result.id);
      } else {
        fetchInstances();
      }
    } catch (error) {
      console.error('Error creating instance:', error);
      toast.error(`Error al crear instancia: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Open QR modal manually
  const handleShowQR = async (instance) => {
    setSelectedInstance(instance);
    setIsQrOpen(true);
    setQrCodeData(null);
    
    setActionLoading(prev => ({ ...prev, [`${instance.id}_qr`]: true }));
    try {
      const res = await getEvolutionInstanceQR(instance.id);
      if (res.status === 'CONNECTED') {
        toast.info('La instancia ya se encuentra conectada.');
        setIsQrOpen(false);
        fetchInstances(false);
      } else {
        setQrCodeData(res.qrcode || null);
        startQrPolling(instance.id);
      }
    } catch (error) {
      console.error('Error fetching QR:', error);
      toast.error(`Error al obtener código QR: ${error.message}`);
      setIsQrOpen(false);
    } finally {
      setActionLoading(prev => ({ ...prev, [`${instance.id}_qr`]: false }));
    }
  };

  // Restart physical instance
  const handleRestartInstance = async (instance) => {
    if (!window.confirm(`¿Estás seguro de reiniciar la instancia física '${instance.instance_name}'?`)) return;
    
    const key = `${instance.id}_restart`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    try {
      await restartEvolutionInstance(instance.id);
      toast.success(`Instancia '${instance.instance_name}' reiniciada correctamente.`);
      fetchInstances(false);
    } catch (error) {
      console.error('Error restarting instance:', error);
      toast.error(`Error al reiniciar instancia: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Sync profile & privacy settings
  const handleSyncProfile = async (instance) => {
    if (instance.status !== 'CONNECTED') {
      toast.warning('Debe conectar la instancia antes de sincronizar el perfil.');
      return;
    }
    
    const key = `${instance.id}_sync`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    try {
      await syncEvolutionInstanceProfile(instance.id);
      toast.success(`Configuraciones de perfil y privacidad aplicadas a '${instance.instance_name}'.`);
      fetchInstances(false);
    } catch (error) {
      console.error('Error syncing profile:', error);
      toast.error(`Error al sincronizar perfil: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Configure Webhook
  const handleOpenWebhook = (instance) => {
    setSelectedInstance(instance);
    setWebhookUrl('');
    setIsWebhookOpen(true);
  };

  const handleConfigureWebhook = async (e) => {
    e.preventDefault();
    const key = `${selectedInstance.id}_webhook`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      const urlParam = webhookUrl.trim() ? webhookUrl.trim() : null;
      const res = await configureEvolutionInstanceWebhook(selectedInstance.id, urlParam);
      toast.success(`Webhook configurado con éxito para '${selectedInstance.instance_name}'.`);
      setIsWebhookOpen(false);
      fetchInstances(false);
    } catch (error) {
      console.error('Error configuring webhook:', error);
      toast.error(`Error al configurar webhook: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Edit DB limits settings
  const handleOpenSettings = (instance) => {
    setSelectedInstance(instance);
    setSettingsData({
      allow_mass_sending: instance.allow_mass_sending,
      daily_sent_limit: instance.daily_sent_limit
    });
    setIsSettingsOpen(true);
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    const key = `${selectedInstance.id}_settings`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      const updated = await updateEvolutionInstanceSettings(selectedInstance.id, {
        allow_mass_sending: settingsData.allow_mass_sending,
        daily_sent_limit: parseInt(settingsData.daily_sent_limit)
      });
      toast.success('Configuración guardada.');
      setIsSettingsOpen(false);
      fetchInstances(false);
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(`Error al actualizar configuración: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Delete instance (logout physical and delete DB)
  const handleDeleteInstance = async (instance) => {
    const confirmation = window.prompt(
      `¿ATENCIÓN: Esto cerrará la sesión física de WhatsApp, eliminará la instancia del servidor Evolution API y borrará el registro de la base de datos de manera irreversible?\n\nPara confirmar, escribe el nombre de la instancia: "${instance.instance_name}"`
    );
    
    if (confirmation !== instance.instance_name) {
      if (confirmation !== null) toast.error('El nombre ingresado no coincide. Operación cancelada.');
      return;
    }

    const key = `${instance.id}_delete`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    try {
      await deleteEvolutionInstance(instance.id);
      toast.success(`Instancia '${instance.instance_name}' eliminada correctamente.`);
      fetchInstances(true);
    } catch (error) {
      console.error('Error deleting instance:', error);
      toast.error(`Error al eliminar la instancia: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const copyToClipboard = (text, type = 'Token') => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado al portapapeles.`);
  };

  // Helpers for render status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      CONNECTED: { text: 'Conectado', color: 'bg-green-100 text-green-800 border-green-200' },
      CONNECTING: { text: 'Esperando QR', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      DISCONNECTED: { text: 'Desconectado', color: 'bg-gray-100 text-gray-800 border-gray-200' },
      BANNED: { text: 'Baneado', color: 'bg-red-100 text-red-800 border-red-200' }
    };
    
    const info = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-700 border-gray-200' };
    
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${info.color}`}>
        {info.text}
      </span>
    );
  };

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#6558a1] to-[#e8437f] text-transparent bg-clip-text">
            WhatsApp Evolution API
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-1.5 text-sm">
            <Info className="h-4 w-4 text-[#6558a1]" />
            Administra las instancias físicas de WhatsApp, códigos QR de conexión, límites de envío y configuraciones de privacidad.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchInstances(true)}
            className="flex items-center justify-center p-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl transition shadow-sm"
            title="Refrescar lista"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin text-[#6558a1]' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-[#6558a1] hover:bg-[#52468f] text-white px-5 py-2.5 rounded-xl font-medium transition shadow-md hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Nueva Instancia
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#6558a1]" />
            <p className="text-gray-500 font-medium text-sm">Cargando instancias de Evolution API...</p>
          </div>
        ) : instances.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-20 text-center px-4">
            <div className="bg-purple-50 p-4 rounded-full text-[#6558a1] mb-4">
              <QrCode className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No hay instancias registradas</h3>
            <p className="text-gray-500 text-sm max-w-sm mt-1 mb-6">
              Registra tu primera instancia para conectar WhatsApp mediante Evolution API y comenzar a enviar y recibir mensajes.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="bg-[#6558a1] hover:bg-[#52468f] text-white px-5 py-2.5 rounded-xl font-medium transition shadow-sm"
            >
              Crear Instancia
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Nombre / Token</th>
                  <th className="px-6 py-4">Teléfono (JID)</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Envío Masivo</th>
                  <th className="px-6 py-4">Límite Diario</th>
                  <th className="px-6 py-4">Enviados Hoy</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {instances.map((inst) => (
                  <tr key={inst.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{inst.instance_name}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="font-mono text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border max-w-[120px] truncate">
                          {inst.instance_token}
                        </span>
                        <button
                          onClick={() => copyToClipboard(inst.instance_token, 'Token')}
                          className="text-gray-400 hover:text-[#6558a1] p-0.5 transition"
                          title="Copiar token"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {inst.phone_number ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          {inst.phone_number.split('@')[0]}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">No conectado</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(inst.status)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded font-semibold text-xs ${inst.allow_mass_sending ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                        {inst.allow_mass_sending ? 'Permitido' : 'Restringido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {inst.daily_sent_limit}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      <span className={inst.daily_sent_count >= inst.daily_sent_limit ? 'text-red-600 font-extrabold' : 'text-gray-700'}>
                        {inst.daily_sent_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Connect/QR Button */}
                        {inst.status !== 'CONNECTED' && (
                          <button
                            onClick={() => handleShowQR(inst)}
                            disabled={actionLoading[`${inst.id}_qr`]}
                            className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                          >
                            {actionLoading[`${inst.id}_qr`] ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <QrCode className="h-3.5 w-3.5" />
                            )}
                            Vincular
                          </button>
                        )}

                        {/* Sync Settings / Profile */}
                        {inst.status === 'CONNECTED' && (
                          <button
                            onClick={() => handleSyncProfile(inst)}
                            disabled={actionLoading[`${inst.id}_sync`]}
                            className="p-2 text-[#6558a1] bg-purple-50 hover:bg-[#6558a1] hover:text-white rounded-lg transition disabled:opacity-50"
                            title="Sincronizar nombre/foto/privacidad de WhatsApp"
                          >
                            {actionLoading[`${inst.id}_sync`] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        {/* Configure Webhook */}
                        <button
                          onClick={() => handleOpenWebhook(inst)}
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition"
                          title="Configurar Webhook"
                        >
                          <Link className="h-4 w-4" />
                        </button>

                        {/* Settings Database Limits */}
                        <button
                          onClick={() => handleOpenSettings(inst)}
                          className="p-2 text-gray-600 bg-gray-100 hover:bg-gray-700 hover:text-white rounded-lg transition"
                          title="Editar límites de envío"
                        >
                          <Sliders className="h-4 w-4" />
                        </button>

                        {/* Restart Physical Instance */}
                        <button
                          onClick={() => handleRestartInstance(inst)}
                          disabled={actionLoading[`${inst.id}_restart`]}
                          className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-600 hover:text-white rounded-lg transition disabled:opacity-50"
                          title="Reiniciar Instancia Física"
                        >
                          {actionLoading[`${inst.id}_restart`] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </button>

                        {/* Delete Instance */}
                        <button
                          onClick={() => handleDeleteInstance(inst)}
                          disabled={actionLoading[`${inst.id}_delete`]}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition disabled:opacity-50"
                          title="Cerrar sesión y Eliminar Instancia"
                        >
                          {actionLoading[`${inst.id}_delete`] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: CREATE INSTANCE */}
      <ModernModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Crear Nueva Instancia de WhatsApp"
        icon={<Plus className="h-6 w-6 text-[#6558a1]" />}
        size="md"
      >
        <form onSubmit={handleCreateInstance} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nombre de la Instancia (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. evo-ventas (Dejar vacío para autogenerar)"
              value={newInstanceData.instance_name}
              onChange={(e) => setNewInstanceData(prev => ({ ...prev, instance_name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6558a1] transition text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Límite de Envío Diario
              </label>
              <input
                type="number"
                min="1"
                required
                value={newInstanceData.daily_sent_limit}
                onChange={(e) => setNewInstanceData(prev => ({ ...prev, daily_sent_limit: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6558a1] transition text-sm"
              />
            </div>
            
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 cursor-pointer bg-gray-50 border border-gray-200 rounded-xl p-3.5 h-[46px] select-none hover:bg-gray-100/50 transition">
                <input
                  type="checkbox"
                  checked={newInstanceData.allow_mass_sending}
                  onChange={(e) => setNewInstanceData(prev => ({ ...prev, allow_mass_sending: e.target.checked }))}
                  className="rounded text-[#6558a1] focus:ring-[#6558a1] h-4.5 w-4.5"
                />
                <span className="text-sm font-medium text-gray-700">Permitir envíos masivos</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={actionLoading.create}
              className="flex items-center gap-2 px-5 py-2 bg-[#6558a1] hover:bg-[#52468f] text-white rounded-xl transition text-sm font-medium disabled:opacity-50"
            >
              {actionLoading.create && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear Instancia
            </button>
          </div>
        </form>
      </ModernModal>

      {/* MODAL: QR CODE DISPLAY */}
      <ModernModal
        isOpen={isQrOpen}
        onClose={stopQrPolling}
        title={`Vincular WhatsApp - ${selectedInstance?.instance_name}`}
        icon={<QrCode className="h-6 w-6 text-yellow-600" />}
        size="md"
      >
        <div className="flex flex-col items-center text-center p-4">
          <p className="text-gray-600 text-sm max-w-sm mb-6">
            Abre WhatsApp en tu teléfono, ve a <strong>Dispositivos vinculados</strong> y escanea el siguiente código QR para conectar la instancia.
          </p>

          {qrCodeData ? (
            <div className="relative p-4 bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm flex items-center justify-center">
              <img 
                src={qrCodeData.base64?.startsWith('data:') ? qrCodeData.base64 : `data:image/png;base64,${qrCodeData.base64}`} 
                alt="WhatsApp QR Code"
                className="w-64 h-64 select-none"
              />
            </div>
          ) : (
            <div className="w-64 h-64 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col justify-center items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-[#6558a1]" />
              <p className="text-gray-400 text-xs font-semibold">Generando código QR...</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3 mt-6 max-w-sm text-left">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Monitoreando estado de conexión:</span> Esta ventana se cerrará automáticamente en cuanto escanees el código.
            </div>
          </div>
        </div>
      </ModernModal>

      {/* MODAL: EDIT SETTINGS LIMITS */}
      <ModernModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title={`Configurar límites - ${selectedInstance?.instance_name}`}
        icon={<Settings className="h-6 w-6 text-gray-700" />}
        size="md"
      >
        <form onSubmit={handleUpdateSettings} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Límite de Envío Diario
              </label>
              <input
                type="number"
                min="1"
                required
                value={settingsData.daily_sent_limit}
                onChange={(e) => setSettingsData(prev => ({ ...prev, daily_sent_limit: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6558a1] transition text-sm"
              />
            </div>
            
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 cursor-pointer bg-gray-50 border border-gray-200 rounded-xl p-3.5 h-[46px] select-none hover:bg-gray-100/50 transition">
                <input
                  type="checkbox"
                  checked={settingsData.allow_mass_sending}
                  onChange={(e) => setSettingsData(prev => ({ ...prev, allow_mass_sending: e.target.checked }))}
                  className="rounded text-[#6558a1] focus:ring-[#6558a1] h-4.5 w-4.5"
                />
                <span className="text-sm font-medium text-gray-700">Permitir envíos masivos</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={actionLoading[`${selectedInstance?.id}_settings`]}
              className="flex items-center gap-2 px-5 py-2 bg-[#6558a1] hover:bg-[#52468f] text-white rounded-xl transition text-sm font-medium disabled:opacity-50"
            >
              {actionLoading[`${selectedInstance?.id}_settings`] && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar Configuración
            </button>
          </div>
        </form>
      </ModernModal>

      {/* MODAL: CONFIGURE WEBHOOK */}
      <ModernModal
        isOpen={isWebhookOpen}
        onClose={() => setIsWebhookOpen(false)}
        title={`Configurar Webhook - ${selectedInstance?.instance_name}`}
        icon={<Link className="h-6 w-6 text-blue-600" />}
        size="md"
      >
        <form onSubmit={handleConfigureWebhook} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              URL del Webhook
            </label>
            <input
              type="url"
              placeholder="https://tu-servidor.com/webhook (Dejar vacío para el default del .env)"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition text-sm"
            />
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              Si dejas este campo en blanco, el backend configurará automáticamente la URL por defecto registrada en las variables de entorno del servidor.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsWebhookOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={actionLoading[`${selectedInstance?.id}_webhook`]}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition text-sm font-medium disabled:opacity-50"
            >
              {actionLoading[`${selectedInstance?.id}_webhook`] && <Loader2 className="h-4 w-4 animate-spin" />}
              Configurar Webhook
            </button>
          </div>
        </form>
      </ModernModal>
    </div>
  );
};

export default EvolutionInstancesPage;
