import React from 'react';
import { TrendingUp, MessageSquare, Mail, Phone, FileText, Calendar } from 'lucide-react';

const Vision360Stats = ({ profileData }) => {
  const stats = profileData?.stats || calculateStatsFromArrays(profileData);

  if (!stats) return null;

  const { interactions, channels } = stats;
  const total = interactions?.total || 1; 

  // Definición explícita de estilos por color para que Tailwind los detecte
  const colorStyles = {
    blue: {
      bg500: 'bg-blue-500',
      bg50: 'bg-blue-50',
      text600: 'text-blue-600',
      text500: 'text-blue-500'
    },
    orange: {
      bg500: 'bg-orange-500',
      bg50: 'bg-orange-50',
      text600: 'text-orange-600',
      text500: 'text-orange-500'
    },
    green: {
      bg500: 'bg-green-500',
      bg50: 'bg-green-50',
      text600: 'text-green-600',
      text500: 'text-green-500'
    },
    purple: {
      bg500: 'bg-purple-500',
      bg50: 'bg-purple-50',
      text600: 'text-purple-600',
      text500: 'text-purple-500'
    }
  };

  const statItems = [
    {
      title: 'SMS',
      value: channels?.sms_sent || 0,
      icon: MessageSquare,
      colorKey: 'blue',
      description: 'Mensajes de texto'
    },
    {
      title: 'Email',
      value: channels?.email_sent || 0,
      icon: Mail,
      colorKey: 'orange',
      description: 'Correos enviados'
    },
    {
      title: 'WhatsApp',
      value: channels?.whatsapp_sent || 0,
      icon: Phone,
      colorKey: 'green',
      description: 'Campañas masivas'
    },
    {
      title: 'Docs',
      value: channels?.documents_generated || 0,
      icon: FileText,
      colorKey: 'purple',
      description: 'Cartas y PDFs'
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Métricas de Actividad
        </h2>
        {interactions?.last_interaction_date && (
          <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            Último evento: <span className="font-medium text-gray-700">{new Date(interactions.last_interaction_date).toLocaleDateString('es-CO')}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((item, idx) => {
          const Icon = item.icon;
          const percentage = Math.min(Math.round((item.value / total) * 100), 100);
          const styles = colorStyles[item.colorKey];
          
          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative overflow-hidden group hover:shadow-md transition-all duration-300">
              {/* Fondo líquido animado */}
              <div 
                className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out opacity-10 group-hover:opacity-20 ${styles.bg500}`}
                style={{ height: `${percentage > 10 ? percentage : 10}%` }}
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-white/30 skew-y-2 animate-pulse"></div>
              </div>

              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <div className={`p-2 rounded-lg ${styles.bg50} inline-block mb-3`}>
                    <Icon className={`w-6 h-6 ${styles.text600}`} />
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{item.title}</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-bold text-gray-900">{item.value}</span>
                    <span className="text-xs text-gray-400 font-medium">
                      ({percentage}%)
                    </span>
                  </div>
                </div>
                
                {/* Visual Circle Progress Mini */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      className="text-gray-100"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={126}
                      strokeDashoffset={126 - (126 * percentage) / 100}
                      className={`${styles.text500} transition-all duration-1000 ease-out`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
              
              <p className="relative z-10 text-xs text-gray-400 mt-3 pl-1 border-l-2 border-gray-200">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const calculateStatsFromArrays = (profileData) => {
  if (!profileData) return null;

  const campaignMessages = profileData.campaign_history?.recent_messages || [];
  const communications = profileData.communications?.communications || [];

  const sms = campaignMessages.filter(m => m.channel?.toUpperCase() === 'SMS').length;
  const email = campaignMessages.filter(m => m.channel?.toUpperCase() === 'EMAIL').length;
  const whatsapp = campaignMessages.filter(m => m.channel?.toUpperCase() === 'WHATSAPP').length;
  const docs = communications.length;

  const total = sms + email + whatsapp + docs;

  const allDates = [
    ...campaignMessages.map(m => new Date(m.sent_at || m.send_date)),
    ...communications.map(c => new Date(c.created_at))
  ].filter(d => !isNaN(d.getTime()));

  const lastDate = allDates.length > 0 
    ? new Date(Math.max(...allDates)).toISOString()
    : null;

  return {
    interactions: { total, last_interaction_date: lastDate },
    channels: {
      sms_sent: sms,
      email_sent: email,
      whatsapp_sent: whatsapp,
      documents_generated: docs
    }
  };
};

export default Vision360Stats;
