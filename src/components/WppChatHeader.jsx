import React from 'react';

const WppChatHeader = ({ selectedConversation, adminfoData, handleViewInAdminfo }) => {
  const isEvolution = selectedConversation?.active_channel === 'EVOLUTION' || selectedConversation?.active_channel?.value === 'EVOLUTION';

  return (
    <div className="p-4 border-b border-gray-200 bg-white flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          {selectedConversation ? (
            <div className="flex flex-col min-w-0">
              <span className="whitespace-normal break-words">{selectedConversation.chat_title}</span>
              <div className="flex items-center gap-2">
                <span className="font-normal text-base text-gray-500">{selectedConversation.customer_phone_number}</span>
                {isEvolution && (
                  <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                    EVO {selectedConversation.system_phone_number ? `- ${selectedConversation.system_phone_number}` : ''}
                  </span>
                )}
              </div>
            </div>
          ) : 'Seleccione una conversación'}
        </h2>
      </div>
      {selectedConversation && (
        <button
          onClick={handleViewInAdminfo}
          disabled={!adminfoData?.url || adminfoData?.loading}
          className="ml-4 px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {adminfoData?.loading ? 'Cargando...' : '👁️ Ver en Adminfo'}
        </button>
      )}
    </div>
  );
};

export default WppChatHeader;