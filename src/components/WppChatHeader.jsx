import React from 'react';
import { Info, ArrowLeft } from 'lucide-react';

const WppChatHeader = ({ 
  selectedConversation, 
  adminfoData, 
  handleViewInAdminfo,
  toggleClientInfo,
  showClientInfo,
  onBack
}) => {
  return (
    <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between h-20 flex-shrink-0">
      <div className="flex items-center min-w-0 flex-1">
        {selectedConversation && onBack && (
          <button 
            onClick={onBack}
            className="mr-3 p-2 rounded-full hover:bg-gray-100 md:hidden flex items-center justify-center text-gray-500 hover:text-gray-700 flex-shrink-0 transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            {selectedConversation ? (
              <div className="flex flex-col min-w-0">
                <span className="whitespace-normal break-words leading-tight">{selectedConversation.chat_title}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-normal text-sm text-gray-500">{selectedConversation.customer_phone_number}</span>
                </div>
              </div>
            ) : 'Seleccione una conversación'}
          </h2>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {selectedConversation && (
          <button
            onClick={handleViewInAdminfo}
            disabled={!adminfoData?.url || adminfoData?.loading}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {adminfoData?.loading ? 'Cargando...' : '👁️ Ver en Adminfo'}
          </button>
        )}
        {selectedConversation && toggleClientInfo && (
          <button
            onClick={toggleClientInfo}
            className={`p-2 rounded-lg border transition-colors flex-shrink-0 flex items-center justify-center ${showClientInfo ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
            title={showClientInfo ? "Ocultar información del cliente" : "Mostrar información del cliente"}
          >
            <Info className="w-5.5 h-5.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default WppChatHeader;