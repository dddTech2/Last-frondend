import React from 'react';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/847/847969.png';

const WppChatHeader = ({ 
  selectedConversation, 
  adminfoData, 
  handleViewInAdminfo,
  wppProfileData,
  isLoadingWppProfile
}) => {
  return (
    <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {selectedConversation && (
          <div className="relative w-11 h-11 flex-shrink-0">
            {isLoadingWppProfile ? (
              <div className="w-11 h-11 rounded-full bg-gray-200 animate-pulse border border-gray-100" />
            ) : (
              <img
                src={wppProfileData?.profilePic || DEFAULT_AVATAR}
                alt={wppProfileData?.name || selectedConversation.chat_title}
                className="w-11 h-11 rounded-full object-cover border border-gray-200 shadow-sm transition-all"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_AVATAR; // Fallback automático si URL expira (403)
                }}
              />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {selectedConversation ? (
            <div className="flex flex-col min-w-0">
              {isLoadingWppProfile ? (
                <>
                  <div className="h-4 w-36 bg-gray-200 rounded animate-pulse mb-1.5" />
                  <div className="h-3.5 w-24 bg-gray-200 rounded animate-pulse" />
                </>
              ) : (
                <>
                  <h2 className="text-base font-semibold text-gray-800 truncate flex items-center gap-1.5">
                    <span>{wppProfileData?.name || selectedConversation.chat_title}</span>
                    {wppProfileData?.name && wppProfileData.name !== selectedConversation.chat_title && (
                      <span className="text-xs text-gray-400 font-normal truncate">
                        ({selectedConversation.chat_title})
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="font-mono">{selectedConversation.customer_phone_number}</span>
                    {wppProfileData?.status && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="italic truncate max-w-xs text-gray-400" title={wppProfileData.status}>
                          {wppProfileData.status}
                        </span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <h2 className="text-base font-semibold text-gray-800">Seleccione una conversación</h2>
          )}
        </div>
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