import React, { useEffect, useRef } from 'react';

const EmailPreview = ({ subject, htmlContent }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        // Interceptar clics en enlaces para abrirlos en nueva pestaña
        const handleLinkClicks = () => {
          if (!iframeRef.current) return;
          const doc = iframeRef.current.contentDocument;
          if (!doc) return;

          const links = doc.querySelectorAll('a[href]');
          links.forEach((link) => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
            link.addEventListener('click', (e) => {
              e.preventDefault();
              const href = link.getAttribute('href');
              if (href && href !== '#') {
                window.open(href, '_blank', 'noopener,noreferrer');
              }
            });
          });
        };

        // Ajustar el tamaño del iframe al contenido
        const resizeIframe = () => {
          if (iframeRef.current) {
            const body = iframeRef.current.contentWindow.document.body;
            const html = iframeRef.current.contentWindow.document.documentElement;
            
            const contentHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
            const contentWidth = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth);
            
            iframeRef.current.style.height = `${contentHeight}px`;
            iframeRef.current.style.width = `${contentWidth}px`;
          }
        };

        // Usar un pequeño delay para asegurar que el contenido se renderice antes de medir
        const timer = setTimeout(() => {
          handleLinkClicks();
          resizeIframe();
        }, 100);
        
        // Limpiar el timer si el componente se desmonta
        return () => clearTimeout(timer);
      }
    }
  }, [htmlContent]);

  return (
    <div className="mt-8 pt-8 border-t">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Vista Previa del Mensaje</h3>
      <div className="bg-white rounded-xl shadow-md border w-full">
        <div className="p-4 border-b">
          <span className="text-sm font-semibold text-gray-500">Asunto: </span>
          <span className="text-gray-800">{subject || '(Sin asunto)'}</span>
        </div>
        <div className="p-6 overflow-x-auto">
          <iframe
            ref={iframeRef}
            title="Vista previa de Email"
            className="w-full border-0 bg-white" // Se quita la altura fija h-96
            sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            scrolling="no" // Deshabilitar el scroll explícitamente
          />
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4 text-center">
        Las variables se completarán automáticamente con los datos de cada destinatario.
      </p>
    </div>
  );
};

export default EmailPreview;
