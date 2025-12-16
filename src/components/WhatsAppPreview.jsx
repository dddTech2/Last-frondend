import React, { useState } from 'react';

const WhatsAppPreview = ({ components, compact = false }) => {
  const [mediaError, setMediaError] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  
  if (!components) {
    return <div className="text-gray-500 text-center p-4">No hay componentes para previsualizar.</div>;
  }

  const resolveMediaUrl = (header) => {
    // Preferimos URLs directas si existen; localPreviewUrl es usado durante creación
    return header?.localPreviewUrl || header?.url || header?.public_url || null;
  };

  const renderHeader = (header) => {
    if (!header) return null;
    const mediaUrl = resolveMediaUrl(header);
    switch (header.format) {
      case 'TEXT':
        return <div className="bg-green-600 text-white p-3 text-sm font-semibold">{header.text}</div>;
      case 'IMAGE':
        return (
          <div className="relative bg-gray-100">
            {mediaUrl && !mediaError ? (
              <>
                {isMediaLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 min-h-[200px]">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                  </div>
                )}
                <img 
                  src={mediaUrl} 
                  alt={header.file_name || 'Imagen'} 
                  className={`w-full h-auto object-contain cursor-pointer hover:opacity-95 transition-opacity ${isMediaLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={() => setIsMediaLoading(false)}
                  onError={() => {
                    setMediaError(true);
                    setIsMediaLoading(false);
                  }}
                  onClick={() => window.open(mediaUrl, '_blank')}
                />
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded cursor-pointer hover:bg-black/80" onClick={() => window.open(mediaUrl, '_blank')}>
                  🔍 Ampliar
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <span className="text-4xl block mb-2">🖼️</span>
                <span className="text-sm">{mediaError ? 'Error al cargar imagen' : 'Imagen adjunta'}</span>
                {header.file_name && <span className="text-xs block text-gray-400 mt-1">{header.file_name}</span>}
              </div>
            )}
          </div>
        );
      case 'VIDEO':
        return (
          <div className="relative bg-black">
            {mediaUrl && !mediaError ? (
              <video 
                src={mediaUrl} 
                controls 
                className="w-full h-auto"
                onLoadedData={() => setIsMediaLoading(false)}
                onError={() => {
                  setMediaError(true);
                  setIsMediaLoading(false);
                }}
              >
                Tu navegador no soporta video.
              </video>
            ) : (
              <div className="p-8 text-center text-gray-500 bg-gray-100">
                <span className="text-4xl block mb-2">🎥</span>
                <span className="text-sm">{mediaError ? 'Error al cargar video' : 'Video adjunto'}</span>
                {header.file_name && <span className="text-xs block text-gray-400 mt-1">{header.file_name}</span>}
              </div>
            )}
          </div>
        );
      case 'DOCUMENT':
        return (
          <div className="bg-gray-50 p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{header.file_name || 'Documento'}</p>
                <p className="text-xs text-gray-500">PDF/Documento</p>
              </div>
              {mediaUrl && (
                <a 
                  href={mediaUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  Abrir
                </a>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderBody = (body) => {
    if (!body || !body.text) return null;
    // Highlight both {{var}} and {var} plus SPECIAL variables like {SPECIAL:NAME}
    const previewText = body.text.replace(/\{\{([^}]+)\}\}|\{([A-Za-z0-9_:.]+)\}/g, (_m, g1, g2) => {
      const token = g1 || g2;
      return `<span class="font-bold text-blue-700 bg-blue-50 px-1 rounded">{{${token}}}</span>`;
    });
    return <div className="p-3 text-gray-800 text-sm leading-snug" dangerouslySetInnerHTML={{ __html: previewText }}></div>;
  };

  const renderFooter = (footer) => {
    if (!footer || !footer.text) return null;
    return <div className="text-xs text-gray-500 p-3 border-t border-gray-100 bg-gray-50">{footer.text}</div>;
  };

  const renderButtons = (buttons) => {
    if (!buttons || buttons.length === 0) return null;
    return (
      <div className="flex flex-col border-t border-gray-100 bg-gray-50">
        {buttons.map((button, index) => (
          <button
            key={index}
            className="bg-white text-blue-600 py-2 px-4 mx-3 my-1 rounded-md text-sm font-medium border border-blue-200 hover:bg-blue-50"
            disabled
          >
            {button.text} {button.type === 'URL' && '🔗'} {button.type === 'PHONE_NUMBER' && '📞'}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={compact ? 'w-full' : 'mt-6 pt-6 border-t'}>
      {!compact && <h3 className="text-lg font-semibold text-gray-800 mb-3">Vista Previa de WhatsApp</h3>}
      
      {/* Contenedor con fondo estilo WhatsApp */}
      <div 
        className="rounded-xl p-4"
        style={{ 
          backgroundColor: '#e5ddd5',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4cfc4\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }}
      >
        {/* Burbuja del mensaje */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {renderHeader(components.header)}
          {renderBody(components.body)}
          {renderFooter(components.footer)}
          {renderButtons(components.buttons)}
          
          {/* Timestamp */}
          <div className="text-right px-3 pb-2">
            <span className="text-[11px] text-gray-400">
              {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} ✓✓
            </span>
          </div>
        </div>
      </div>
      
      {!compact && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          Vista previa aproximada del mensaje en WhatsApp.
        </p>
      )}
    </div>
  );
};

export default WhatsAppPreview;