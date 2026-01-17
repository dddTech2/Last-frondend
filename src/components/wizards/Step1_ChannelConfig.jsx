import React from 'react';

// --- Iconos para las tarjetas de canal ---
const WhatsAppIcon = ({ color }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657A8 8 0 018.343 7.343m9.314 9.314a8 8 0 01-9.314-9.314m0 0A8.003 8.003 0 002 8c0 4.418 3.582 8 8 8 1.26 0 2.45-.293 3.536-.813" /></svg>;
const SmsIcon = ({ color }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const EMAILIcon = ({ color }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
// ------------------------------------

const ChannelCard = ({ icon, title, description, selected, onClick, color }) => {
  const borderColor = selected ? color.border : 'border-gray-200';
  const textColor = selected ? color.text : 'text-gray-800';
  const iconComponent = React.cloneElement(icon, { color: selected ? color.text : 'text-gray-400' });

  return (
    <div
      onClick={onClick}
      className={`p-6 border-2 ${borderColor} rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-1`}
    >
      <div className="flex flex-col items-center text-center">
        {iconComponent}
        <h3 className={`mt-4 text-lg font-semibold ${textColor}`}>{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
};

const Step1_ChannelConfig = ({ campaignData, setCampaignData }) => {
  const { channel, name, campaignType = 'normal' } = campaignData;

  const handleChannelSelect = (selectedChannel) => {
    setCampaignData({ ...campaignData, channel: selectedChannel });
  };

  const handleCampaignTypeChange = (type) => {
    setCampaignData({ ...campaignData, campaignType: type });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Inicia tu Campaña</h2>
      <p className="text-gray-500 mt-1">Selecciona el tipo de campaña y el canal de comunicación.</p>

      {/* Toggle: Tipo de Campaña */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Tipo de Campaña</h3>
        <div className="flex gap-4">
          <button
            onClick={() => handleCampaignTypeChange('normal')}
            className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all duration-200 ${
              campaignType === 'normal'
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-semibold">Normal</span>
            </div>
            <p className="text-xs mt-2 opacity-75">Con segmentación de audiencia</p>
          </button>

          <button
            onClick={() => handleCampaignTypeChange('csv')}
            className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all duration-200 ${
              campaignType === 'csv'
                ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-semibold">Por CSV</span>
            </div>
            <p className="text-xs mt-2 opacity-75">Carga masiva con archivo</p>
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Selecciona el Canal</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ChannelCard
            icon={<WhatsAppIcon />}
            title="WhatsApp"
            description="Mensajes directos con alta tasa de apertura"
            selected={channel === 'WhatsApp'}
            onClick={() => handleChannelSelect('WhatsApp')}
            color={{ border: 'border-green-500', text: 'text-green-600' }}
          />
          <ChannelCard
            icon={<SmsIcon />}
            title="SMS"
            description="Mensajes de texto simples y efectivos"
            selected={channel === 'SMS'}
            onClick={() => handleChannelSelect('SMS')}
            color={{ border: 'border-blue-500', text: 'text-blue-600' }}
          />
          <ChannelCard
            icon={<EMAILIcon />}
            title="EMAIL"
            description="Comunicación rica con contenido multimedia"
            selected={channel === 'EMAIL'}
            onClick={() => handleChannelSelect('EMAIL')}
            color={{ border: 'border-purple-500', text: 'text-purple-600' }}
          />
        </div>
      </div>
      
      {/* --- Campo de Nombre de Campaña (Aparece después de seleccionar un canal) --- */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${channel ? 'max-h-40 opacity-100 mt-8' : 'max-h-0 opacity-0'}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">Dale un nombre a tu campaña</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
          placeholder={`Ej: Campaña de ${channel} para clientes nuevos`}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {name && name.length < 7 && (
          <p className="text-xs text-red-500 mt-1">El nombre debe tener al menos 7 caracteres</p>
        )}
      </div>
    </div>
  );
};

export default Step1_ChannelConfig;
