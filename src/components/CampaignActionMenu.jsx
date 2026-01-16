import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { deleteCampaign, activateCampaign, inactivateCampaign } from '../services/api';
import { toast } from 'sonner';

// --- Iconos para el menú ---
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const DuplicateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const ReportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2z" /></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
// -------------------------

const MenuPortal = ({ children, coords }) => {
  const el = document.createElement('div');

  useEffect(() => {
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, [el]);

  return ReactDOM.createPortal(
    <div
      className="absolute"
      style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
    >
      {children}
    </div>,
    el
  );
};


const CampaignActionMenu = ({ campaign, onViewReport, onCampaignDeleted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({});
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const normalizedStatus = (campaign?.status || '').toString();
  const isScheduled = normalizedStatus.toUpperCase() === 'SCHEDULED' || normalizedStatus.toLowerCase().includes('programada');
  const isInactive = normalizedStatus.toUpperCase() === 'INACTIVE' || normalizedStatus.toLowerCase().includes('inactiva');

  const handleDuplicate = () => {
    console.log(`Duplicando campaña: ${campaign.name}`);
    setIsOpen(false);
  };

  const handleActivate = () => {
    if (window.confirm(`¿Deseas activar la campaña "${campaign.name}"?`)) {
      setIsOpen(false);
      toast.promise(activateCampaign(campaign.id), {
        loading: 'Activando campaña...',
        success: () => {
          if (onCampaignDeleted) onCampaignDeleted();
          return 'Campaña activada.';
        },
        error: (err) => `Error al activar: ${err.message}`,
      });
    } else {
      setIsOpen(false);
    }
  };

  const handleDeactivate = () => {
    if (window.confirm(`¿Deseas desactivar la campaña "${campaign.name}"?`)) {
      setIsOpen(false);
      toast.promise(inactivateCampaign(campaign.id), {
        loading: 'Desactivando campaña...',
        success: () => {
          if (onCampaignDeleted) onCampaignDeleted();
          return 'Campaña desactivada.';
        },
        error: (err) => `Error al desactivar: ${err.message}`,
      });
    } else {
      setIsOpen(false);
    }
  };

  const handleDelete = () => {
    // Solo permitir eliminar si la campaña está programada (SCHEDULED) o INACTIVE
    const canDelete = isScheduled || isInactive;

    if (!canDelete) {
      console.warn('Eliminar no permitido: estado no válido para eliminación directa desde este menú.');
      return;
    }
    if (window.confirm(`¿Estás seguro de que deseas eliminar la campaña "${campaign.name}"? Esta acción no se puede deshacer.`)) {
      setIsOpen(false);
      toast.promise(deleteCampaign(campaign.id), {
        loading: 'Eliminando campaña...',
        success: () => {
          onCampaignDeleted(); // Llama a la función para refrescar la lista
          return 'Campaña eliminada con éxito.';
        },
        error: (err) => `Error al eliminar: ${err.message}`,
      });
    } else {
      setIsOpen(false);
    }
  };

  const handleViewReport = () => {
    try {
      if (typeof onViewReport === 'function') {
        onViewReport(campaign);
      } else {
        console.log(`Viendo reporte de: ${campaign.name}`);
      }
    } finally {
      setIsOpen(false);
    }
  };

  const toggleMenu = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX - 200, // Ajustar para alinear a la derecha
      });
    }
    setIsOpen(!isOpen);
  };

  // Cierra el menú si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div>
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="text-gray-500 hover:text-blue-600 font-bold p-2 rounded-full focus:outline-none"
      >
        •••
      </button>

      {isOpen && (
        <MenuPortal coords={coords}>
            <div ref={menuRef} className="w-56 bg-white rounded-md shadow-lg z-50 border">
                <ul className="py-1">
                <li>
                    <button
                    onClick={handleDuplicate}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                    <DuplicateIcon />
                    Duplicar Campaña
                    </button>
                </li>
                <li>
                    <button
                    onClick={handleViewReport}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                    <ReportIcon />
                    Ver Reporte
                    </button>
                </li>
                
                {isScheduled && (
                  <li>
                    <button
                      onClick={handleDeactivate}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <PauseIcon />
                      Desactivar Campaña
                    </button>
                  </li>
                )}

                {isInactive && (
                  <li>
                    <button
                      onClick={handleActivate}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <PlayIcon />
                      Activar Campaña
                    </button>
                  </li>
                )}

                <hr className="my-1 border-gray-100" />
                <li>
                    <button
                      onClick={handleDelete}
                      disabled={!isScheduled && !isInactive}
                      className={`w-full text-left flex items-center px-4 py-2 text-sm rounded-md 
                        ${(isScheduled || isInactive)
                          ? 'text-red-700 hover:bg-red-50' 
                          : 'text-gray-400 cursor-not-allowed'}
                      `}
                      title={(isScheduled || isInactive) ? 'Eliminar Campaña' : 'Solo se puede eliminar cuando la campaña está Programada o Inactiva'}
                    >
                      <DeleteIcon />
                      Eliminar Campaña
                    </button>
                </li>
                </ul>
            </div>
        </MenuPortal>
      )}
    </div>
  );
};

export default CampaignActionMenu;
