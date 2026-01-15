import React from 'react';
import { Mail, MessageSquare, FileText, Phone, Calendar } from 'lucide-react';

const TimelineSection = ({ campaignHistory, communications }) => {
  // Combine and sort events
  const events = [
    ...(campaignHistory?.recent_messages || []).map(msg => ({
      type: 'CAMPAIGN',
      date: new Date(msg.sent_at || msg.send_date),
      data: msg
    })),
    ...(communications?.communications || []).map(comm => ({
      type: 'COMMUNICATION',
      date: new Date(comm.created_at),
      data: comm
    }))
  ].sort((a, b) => b.date - a.date);

  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow-sm">
        No hay historial de interacciones registrado.
      </div>
    );
  }

  const getIcon = (event) => {
    if (event.type === 'COMMUNICATION') return <FileText className="w-5 h-5 text-purple-600" />;
    
    const channel = event.data.channel?.toUpperCase();
    switch (channel) {
      case 'SMS': return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'EMAIL': return <Mail className="w-5 h-5 text-orange-600" />;
      case 'WHATSAPP': return <Phone className="w-5 h-5 text-green-600" />;
      default: return <Calendar className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTitle = (event) => {
    if (event.type === 'COMMUNICATION') {
      return event.data.template_name || 'Comunicación Generada';
    }
    return event.data.campaign_name || 'Campaña Masiva';
  };

  const getDescription = (event) => {
    if (event.type === 'COMMUNICATION') {
      return `Estado: ${event.data.status}`;
    }
    return event.data.message_content || 'Contenido del mensaje no disponible';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Línea de Tiempo de Interacciones
      </h3>

      <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
        {events.map((event, index) => (
          <div key={index} className="relative pl-8">
            {/* Timeline Dot */}
            <div className="absolute -left-[9px] top-1 bg-white border-2 border-gray-200 rounded-full p-1">
               {getIcon(event)}
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start group hover:bg-gray-50 p-2 rounded-lg transition-colors -mt-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    {event.type === 'COMMUNICATION' ? 'DOC' : event.data.channel}
                  </span>
                  <span className="text-sm text-gray-500">
                    {event.date.toLocaleString('es-CO')}
                  </span>
                </div>
                
                <h4 className="text-base font-medium text-gray-900">
                  {getTitle(event)}
                </h4>
                
                <p className="text-sm text-gray-600 mt-1 line-clamp-2 group-hover:line-clamp-none transition-all">
                  {getDescription(event)}
                </p>
                
                {event.data.contact_identifier && (
                   <p className="text-xs text-gray-400 mt-1">
                     Destino: {event.data.contact_identifier}
                   </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineSection;
