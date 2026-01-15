import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, AlertCircle, CheckCircle, XCircle, DollarSign, Briefcase } from 'lucide-react';
import * as api from '../../services/api';
import { toast } from 'sonner';

const ClientProfile360 = ({ profileData, onRefresh }) => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [showInvalidModal, setShowInvalidModal] = useState(false);
  const [invalidDetail, setInvalidDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [channelFilter, setChannelFilter] = useState('TODOS');

  const { client_info, contacts, obligations, summary } = profileData || {};

  const handleMarkInvalid = (contact) => {
    setSelectedContact(contact);
    setInvalidDetail('');
    setShowInvalidModal(true);
  };

  const confirmMarkInvalid = async () => {
    if (!invalidDetail.trim()) {
      toast.error('Por favor ingresa un motivo');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.updateContactStatus(
        selectedContact.contact_value,
        selectedContact.channel,
        'INVALID',
        invalidDetail
      );
      toast.success('Contacto marcado como inválido');
      setShowInvalidModal(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error al marcar contacto:', error);
      toast.error(error.message || 'Error al actualizar el contacto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivate = async (contact) => {
    // Confirmación simple
    if (!window.confirm(`¿Estás seguro de reactivar el contacto ${contact.contact_value} (${contact.channel})?`)) {
      return;
    }

    try {
      await api.updateContactStatus(
        contact.contact_value,
        contact.channel,
        'ACTIVE',
        'Reactivado manualmente por agente'
      );
      toast.success('Contacto reactivado exitosamente');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error al reactivar contacto:', error);
      toast.error(error.message || 'Error al reactivar el contacto');
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'EMAIL':
        return <Mail className="h-4 w-4" />;
      case 'SMS':
      case 'WHATSAPP':
      case 'CALL':
        return <Phone className="h-4 w-4" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      ACTIVE2: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <CheckCircle className="h-3 w-3" /> },
      INVALID: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="h-3 w-3" /> },
      UNVERIFIED: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <AlertCircle className="h-3 w-3" /> },
    };

    const badge = badges[status] || badges.UNVERIFIED;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {status}
      </span>
    );
  };

  if (!profileData) return null;

  return (
    <div className="space-y-6">
      {/* Resumen en Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Deuda Total</p>
              <p className="text-2xl font-bold mt-1">
                ${summary?.total_debt?.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}
              </p>
            </div>
            <DollarSign className="h-10 w-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Obligaciones</p>
              <p className="text-2xl font-bold mt-1">{summary?.total_obligations || 0}</p>
            </div>
            <Briefcase className="h-10 w-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Contactos Activos</p>
              <p className="text-2xl font-bold mt-1">{summary?.active_contacts_count || 0}</p>
            </div>
            <Phone className="h-10 w-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Gestor</p>
              <p className="text-lg font-bold mt-1 truncate">{summary?.gestor || 'N/A'}</p>
            </div>
            <User className="h-10 w-10 opacity-80" />
          </div>
        </div>
      </div>

      {/* Información Demográfica */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          Información Demográfica
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-500">Nombre</label>
            <p className="font-medium text-gray-900">{client_info?.nombre_deudor || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Cédula</label>
            <p className="font-medium text-gray-900">{client_info?.cedula || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Edad</label>
            <p className="font-medium text-gray-900">{client_info?.edad_deudor ? `${client_info.edad_deudor} años` : 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Género</label>
            <p className="font-medium text-gray-900">{client_info?.genero || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Ciudad</label>
            <p className="font-medium text-gray-900">{client_info?.ciudad_ultima || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Departamento</label>
            <p className="font-medium text-gray-900">{client_info?.departamento || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Actividad Económica</label>
            <p className="font-medium text-gray-900">{client_info?.actividad_economica_actual || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Última Gestión Directa</label>
            <p className="font-medium text-gray-900">
              {client_info?.ultima_fecha_gestion_directa 
                ? new Date(client_info.ultima_fecha_gestion_directa).toLocaleDateString('es-CO')
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Contactos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Phone className="h-5 w-5 mr-2 text-green-600" />
          Contactos ({contacts?.length || 0})
        </h3>
        
        {/* Filtros por Canal */}
        <div className="mb-4 flex flex-wrap gap-2">
          {['TODOS', 'SMS', 'WHATSAPP', 'EMAIL', 'CALL'].map((channel) => {
            const count = channel === 'TODOS' 
              ? contacts?.length || 0
              : contacts?.filter(c => c.channel === channel).length || 0;
            
            return (
              <button
                key={channel}
                onClick={() => setChannelFilter(channel)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  channelFilter === channel
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {channel === 'TODOS' ? 'Todos' : channel}
                <span className="ml-2 text-xs opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts && contacts.length > 0 ? (
                contacts
                  .filter(contact => channelFilter === 'TODOS' || contact.channel === channelFilter)
                  .map((contact, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(contact.channel)}
                        <span className="text-sm font-medium text-gray-900">{contact.channel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contact.contact_value}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(contact.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contact.is_primary ? '✓' : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(contact.contact_status || contact.status) !== 'INVALID' ? (
                        <button
                          onClick={() => handleMarkInvalid(contact)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Marcar Inválido
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(contact)}
                          className="text-green-600 hover:text-green-900 font-medium flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    {contacts && contacts.length > 0 
                      ? `No hay contactos de tipo ${channelFilter}`
                      : 'No hay contactos registrados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Obligaciones */}
      {obligations && obligations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-purple-600" />
            Obligaciones ({obligations.length})
          </h3>
          <div className="space-y-3">
            {obligations.map((obl, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Código</label>
                    <p className="font-medium text-sm text-gray-900">{obl.codigo_de_obligacion}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Estado</label>
                    <p className="font-medium text-sm text-gray-900">{obl.estado_cartera}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Saldo Total</label>
                    <p className="font-medium text-sm text-gray-900">
                      ${obl.saldo_total?.toLocaleString('es-CO') || '0'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Días de Mora</label>
                    <p className="font-medium text-sm text-gray-900">{obl.dias_mora_adicional || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para marcar contacto inválido */}
      {showInvalidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Marcar Contacto como Inválido</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Canal:</strong> {selectedContact?.channel}<br />
              <strong>Contacto:</strong> {selectedContact?.contact_value}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={invalidDetail}
                onChange={(e) => setInvalidDetail(e.target.value)}
                placeholder="Ej: El cliente indicó que no es su número"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="3"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowInvalidModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmMarkInvalid}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProfile360;
