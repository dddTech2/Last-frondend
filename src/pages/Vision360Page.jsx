import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, TrendingUp, MessageSquare } from 'lucide-react';
import { getClientProfile } from '../services/api';
import { toast } from 'sonner';
import ClientProfile360 from '../components/demographics/ClientProfile360';
import TimelineSection from '../components/vision360/TimelineSection';
import WhatsAppHistorySection from '../components/vision360/WhatsAppHistorySection';
import Vision360Stats from '../components/vision360/Vision360Stats';

const Vision360Page = () => {
  const { cedula } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    loadClientData();
  }, [cedula]);

  const loadClientData = async () => {
    setIsLoading(true);
    try {
      const data = await getClientProfile(cedula, {
        include: 'obligations,contacts,campaign_history,conversations,communications'
      });
      setProfileData(data);
    } catch (error) {
      console.error('Error loading client profile:', error);
      toast.error('Error al cargar los datos del cliente');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del cliente...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No se encontró información para la cédula: {cedula}</p>
          <button
            onClick={() => navigate('/clients')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver a Buscar
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: 'Información & Deudas', icon: User },
    { id: 'timeline', label: 'Línea de Tiempo', icon: TrendingUp },
    { id: 'whatsapp', label: 'Historial WhatsApp', icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a búsqueda
        </button>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profileData.client_info?.nombre_deudor || 'Cliente'}
              </h1>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Cédula: {profileData.client_info?.cedula}</span>
                <span>•</span>
                <span>Ciudad: {profileData.client_info?.ciudad_ultima || 'N/A'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Deuda Total</div>
              <div className="text-2xl font-bold text-red-600">
                ${profileData.summary?.total_debt?.toLocaleString('es-CO') || '0'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <Vision360Stats profileData={profileData} />

      {/* Tabs */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm p-2 flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'info' && (
          <ClientProfile360 profileData={profileData} onRefresh={loadClientData} />
        )}
        
        {activeTab === 'timeline' && (
          <TimelineSection 
            campaignHistory={profileData.campaign_history}
            communications={profileData.communications}
          />
        )}
        
        {activeTab === 'whatsapp' && (
          <WhatsAppHistorySection 
            conversations={profileData.whatsapp_conversations?.conversations || []}
          />
        )}
      </div>
    </div>
  );
};

export default Vision360Page;
