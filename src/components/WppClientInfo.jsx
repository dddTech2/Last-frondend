import React, { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { getResultadoGestor, getCompromisos, getObligaciones, getObligationUrlByCedula, calculateCondonation, reverseSearchContact } from '../services/api';

const Tooltip = ({ targetRef, content }) => {
    const tooltipRef = useRef(null);
    const [position, setPosition] = useState({ top: -9999, left: -9999 });

    useLayoutEffect(() => {
        if (targetRef.current && tooltipRef.current) {
            const targetRect = targetRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const space = 10;

            let top = targetRect.bottom + space;
            let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

            if (top + tooltipRect.height > window.innerHeight) {
                top = targetRect.top - tooltipRect.height - space;
            }
            if (left < space) {
                left = space;
            } else if (left + tooltipRect.width > window.innerWidth) {
                left = window.innerWidth - tooltipRect.width - space;
            }

            setPosition({ top, left });
        }
    }, [targetRef]);

    return ReactDOM.createPortal(
        <div
            ref={tooltipRef}
            className="fixed p-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg z-50 w-64"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
            {content}
        </div>,
        document.body
    );
};

// ──────────────────────────────────────────────────────────────────────────
// Panel de datos para UN cliente concreto (reutilizado en ambos modos)
// ──────────────────────────────────────────────────────────────────────────
const ClientDataPanel = ({ cedula, userRole, onAdminfoUrlChange, setParentClientInfo }) => {
    const [clientInfo, setClientInfo] = useState({
        resultadoGestor: null,
        compromisos: [],
        obligaciones: { total_obligaciones: 0, obligaciones: [], gestor: null },
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedObligations, setSelectedObligations] = useState([]);
    const [condonationResult, setCondonationResult] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [portfolioFilter, setPortfolioFilter] = useState('all');
    const [showTooltip, setShowTooltip] = useState(false);
    const infoIconRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const fetchClientInfo = useCallback(async () => {
        if (!cedula) {
            const emptyInfo = {
                resultadoGestor: null,
                compromisos: [],
                obligaciones: { total_obligaciones: 0, obligaciones: [], gestor: null },
            };
            setClientInfo(emptyInfo);
            if (setParentClientInfo) setParentClientInfo(emptyInfo);
            setSelectedObligations([]);
            setCondonationResult(null);
            setPortfolioFilter('all');
            setError(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setClientInfo({
            resultadoGestor: null,
            compromisos: [],
            obligaciones: { total_obligaciones: 0, obligaciones: [], gestor: null },
        });
        setSelectedObligations([]);
        setCondonationResult(null);
        setPortfolioFilter('all');

        try {
            const [resultadoGestorRes, compromisosRes, obligacionesRes] = await Promise.all([
                getResultadoGestor(cedula),
                getCompromisos(cedula),
                getObligaciones(cedula),
            ]);
            const info = {
                resultadoGestor: resultadoGestorRes.resultado_gestor,
                compromisos: compromisosRes.compromisos,
                obligaciones: obligacionesRes,
            };
            setClientInfo(info);
            if (setParentClientInfo) setParentClientInfo(info);
        } catch (err) {
            setError('Error al cargar la información del cliente.');
            console.error('Error fetching client info:', err);
        } finally {
            setLoading(false);
        }
    }, [cedula, setParentClientInfo]);

    const fetchAdminfoUrl = useCallback(async () => {
        if (!cedula) {
            if (onAdminfoUrlChange) onAdminfoUrlChange({ loading: false, url: null });
            return;
        }
        if (onAdminfoUrlChange) onAdminfoUrlChange({ loading: true, url: null });
        try {
            const response = await getObligationUrlByCedula(cedula);
            if (onAdminfoUrlChange) onAdminfoUrlChange({ loading: false, url: response?.url || null });
        } catch (error) {
            console.error('Error fetching Adminfo URL:', error);
            if (onAdminfoUrlChange) onAdminfoUrlChange({ loading: false, url: null });
        }
    }, [cedula, onAdminfoUrlChange]);

    useEffect(() => {
        fetchClientInfo();
        fetchAdminfoUrl();
    }, [fetchClientInfo, fetchAdminfoUrl]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        const handleScroll = () => setShowTooltip(false);
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
        }
        return () => {
            if (container) container.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const { hasMiBanco, hasOtrosPortafolios } = useMemo(() => {
        const obligaciones = clientInfo.obligaciones?.obligaciones || [];
        return {
            hasMiBanco: obligaciones.some(o => o.sistema_origen?.toLowerCase() === 'mi banco'),
            hasOtrosPortafolios: obligaciones.some(o => o.sistema_origen?.toLowerCase() !== 'mi banco'),
        };
    }, [clientInfo.obligaciones]);

    useEffect(() => {
        if (portfolioFilter === 'all') return;
        const newSelected = selectedObligations.filter(id => {
            const ob = clientInfo.obligaciones.obligaciones.find(o => o.obligacion === id);
            if (!ob) return false;
            if (portfolioFilter === 'mi_banco') return ob.sistema_origen?.toLowerCase() === 'mi banco';
            if (portfolioFilter === 'otros') return ob.sistema_origen?.toLowerCase() !== 'mi banco';
            return true;
        });
        if (newSelected.length !== selectedObligations.length) setSelectedObligations(newSelected);
    }, [portfolioFilter, selectedObligations, clientInfo.obligaciones]);

    const formatCurrency = (value) => {
        if (typeof value !== 'number') return value;
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
    };

    const getCompromisoStyle = (fechaCompromiso) => {
        const today = new Date();
        const compromisoDate = new Date(fechaCompromiso);
        today.setHours(0, 0, 0, 0);
        compromisoDate.setHours(0, 0, 0, 0);
        if (compromisoDate < today) return 'text-red-600';
        if (compromisoDate.getTime() === today.getTime()) return 'text-orange-500';
        return 'text-gray-700';
    };

    const handleObligationSelection = (obligationId) => {
        if (portfolioFilter === 'all' && selectedObligations.length === 0) {
            const ob = clientInfo.obligaciones.obligaciones.find(o => o.obligacion === obligationId);
            if (ob) {
                setPortfolioFilter(ob.sistema_origen?.toLowerCase() === 'mi banco' ? 'mi_banco' : 'otros');
            }
        }
        setSelectedObligations(prev =>
            prev.includes(obligationId) ? prev.filter(id => id !== obligationId) : [...prev, obligationId]
        );
    };

    const handleCalculateCondonation = async () => {
        if (selectedObligations.length === 0) {
            alert('Por favor, seleccione al menos una obligación.');
            return;
        }
        setIsCalculating(true);
        setCondonationResult(null);
        try {
            const result = await calculateCondonation(selectedObligations);
            setCondonationResult(result);
        } catch (error) {
            console.error('Error calculating condonation:', error);
            alert('Error al calcular la condonación.');
        } finally {
            setIsCalculating(false);
        }
    };

    const handleFilterClick = (filter) => setPortfolioFilter(prev => prev === filter ? 'all' : filter);

    const isObligationDisabled = (obligation) => {
        if (portfolioFilter === 'mi_banco') return obligation.sistema_origen?.toLowerCase() !== 'mi banco';
        if (portfolioFilter === 'otros') return obligation.sistema_origen?.toLowerCase() === 'mi banco';
        return false;
    };

    if (loading) return <p className="text-gray-500 text-sm p-2">Cargando información...</p>;
    if (error) return <p className="text-red-500 text-sm p-2">{error}</p>;

    return (
        <div className="space-y-4">
            {/* Resumen de Obligaciones */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-gray-800">Resumen de Obligaciones</h3>
                <p className="text-gray-700">Gestor: <span className="font-medium">{clientInfo.obligaciones?.gestor ?? 'No asignado'}</span></p>
                <p className="text-gray-700">Total de obligaciones: {clientInfo.obligaciones?.total_obligaciones ?? 'No disponible'}</p>
                {clientInfo.obligaciones?.obligaciones?.length > 0 && (
                    <ul className="list-disc pl-5 mt-2">
                        {clientInfo.obligaciones.obligaciones.map((obligacion, index) => (
                            <li key={index} className="text-gray-600">
                                <div>Número de Obligación: {obligacion.obligacion}</div>
                                <div>Sistema Origen: <span className="font-medium">{obligacion.sistema_origen || 'N/A'}</span></div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Último Resultado */}
            {(userRole === 'coordinador' || userRole === 'gestor' || userRole === 'Admin') && (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2 text-gray-800">Último Resultado</h3>
                    <p className="text-gray-700">{clientInfo.resultadoGestor || 'No disponible'}</p>
                </div>
            )}

            {/* Compromisos de Pago */}
            {(userRole === 'gestor' || userRole === 'Admin') && (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2 text-gray-800">Compromisos de Pago</h3>
                    {clientInfo.compromisos?.length > 0 ? (
                        <ul className="space-y-2">
                            {clientInfo.compromisos.map((compromiso, index) => (
                                <li key={index} className={getCompromisoStyle(compromiso.fecha_compromiso)}>
                                    <div>Fecha: {compromiso.fecha_compromiso}</div>
                                    <div>Monto: {formatCurrency(compromiso.valor_por_recuperar)}</div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-700">No hay compromisos pendientes.</p>
                    )}
                </div>
            )}

            {/* Políticas de Condonación */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                    <h3 className="font-semibold text-lg text-gray-800">Políticas de Condonación</h3>
                    {(portfolioFilter === 'mi_banco' || portfolioFilter === 'otros') && (
                        <div
                            className="flex items-center ml-2"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                        >
                            <span ref={infoIconRef} className="text-blue-500 cursor-pointer">ℹ️</span>
                        </div>
                    )}
                </div>
                {showTooltip && (
                    <Tooltip targetRef={infoIconRef} content="Por políticas de la compañía, las obligaciones de Mi banco no pueden calcularse con obligaciones de otros portafolios." />
                )}

                {clientInfo.obligaciones?.obligaciones?.length > 0 ? (
                    <>
                        {hasMiBanco && hasOtrosPortafolios && (
                            <div className="flex space-x-2 mb-4">
                                <button onClick={() => handleFilterClick('mi_banco')} className={`px-2 py-1 text-xs rounded ${portfolioFilter === 'mi_banco' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Mi banco</button>
                                <button onClick={() => handleFilterClick('otros')} className={`px-2 py-1 text-xs rounded ${portfolioFilter === 'otros' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Otros portafolios</button>
                            </div>
                        )}
                        <div className="space-y-2">
                            {clientInfo.obligaciones.obligaciones.map(o => (
                                <div key={o.obligacion} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`cb-${o.obligacion}`}
                                        checked={selectedObligations.includes(o.obligacion)}
                                        onChange={() => handleObligationSelection(o.obligacion)}
                                        disabled={isObligationDisabled(o)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:bg-gray-200"
                                    />
                                    <label htmlFor={`cb-${o.obligacion}`} className={`ml-2 text-sm ${isObligationDisabled(o) ? 'text-gray-400' : 'text-gray-700'}`}>{o.obligacion}</label>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleCalculateCondonation}
                            disabled={isCalculating || selectedObligations.length === 0}
                            className="mt-4 w-full px-3 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isCalculating ? 'Calculando...' : 'Calcular Políticas'}
                        </button>
                        {condonationResult && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                <h4 className="font-semibold text-md mb-2 text-gray-800">Resultado del Cálculo</h4>
                                <p><strong>Capital Total:</strong> {formatCurrency(condonationResult.calculation_inputs.total_capital)}</p>
                                <p><strong>Días en Mora:</strong> {condonationResult.calculation_inputs.days_in_arrears}</p>
                                <h5 className="font-semibold mt-2">Planes de Pago:</h5>
                                <ul className="list-disc pl-5">
                                    {condonationResult.payment_plans.map(plan => (
                                        <li key={plan.term}>
                                            Plazo {plan.term} meses: Paga {formatCurrency(plan.amount_to_pay)} ({plan.condonation_percent}% condonación)
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-gray-700">No hay obligaciones para calcular.</p>
                )}
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────
// Panel para contacto ambiguo (VARIOS CLIENTES – VALIDAR CONTACTO)
// ──────────────────────────────────────────────────────────────────────────
const AmbiguousContactPanel = ({ phoneNumber, userRole, onAdminfoUrlChange, setParentClientInfo }) => {
    const [candidates, setCandidates] = useState([]);   // lista de cédulas encontradas
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [candidatesError, setCandidatesError] = useState(null);
    const [selectedCedula, setSelectedCedula] = useState(null);

    // Buscar cédulas por número de teléfono al montar
    useEffect(() => {
        if (!phoneNumber) return;

        setLoadingCandidates(true);
        setCandidatesError(null);
        setCandidates([]);
        setSelectedCedula(null);

        // El endpoint espera el número sin prefijo de país (sin "57" ni "00")
        const normalizedPhone = phoneNumber.replace(/^(00|57)/, '');
        reverseSearchContact(normalizedPhone)
            .then(data => {
                // La API devuelve { cedulas: ["45441524", "9078573"] }
                const list = data?.cedulas || (Array.isArray(data) ? data : []);
                setCandidates(list);
                // Si solo hay uno, seleccionarlo automáticamente
                if (list.length === 1) {
                    setSelectedCedula(list[0]);
                }
            })
            .catch(err => {
                console.error('Error buscando cédulas por contacto:', err);
                setCandidatesError('No se pudieron obtener los clientes asociados a este número.');
            })
            .finally(() => setLoadingCandidates(false));
    }, [phoneNumber]);

    // Cuando cambia la cédula seleccionada, limpiar adminfo (ClientDataPanel lo recargará)
    useEffect(() => {
        if (!selectedCedula && onAdminfoUrlChange) {
            onAdminfoUrlChange({ loading: false, url: null });
        }
    }, [selectedCedula, onAdminfoUrlChange]);

    // candidates es un array de strings (cédulas)

    return (
        <div className="space-y-4">
            {/* Banner de alerta */}
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2">
                <span className="text-amber-500 text-lg leading-none mt-0.5">⚠️</span>
                <div>
                    <p className="text-amber-800 font-semibold text-sm">Contacto ambiguo</p>
                    <p className="text-amber-700 text-xs mt-0.5">
                        Este número está asociado a múltiples clientes. Selecciona uno para ver sus datos.
                    </p>
                    <p className="text-amber-600 text-xs font-mono mt-1">{phoneNumber}</p>
                </div>
            </div>

            {/* Lista de clientes candidatos */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-base mb-3 text-gray-800">Clientes encontrados</h3>

                {loadingCandidates && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Buscando clientes…
                    </div>
                )}

                {candidatesError && (
                    <p className="text-red-500 text-sm">{candidatesError}</p>
                )}

                {!loadingCandidates && !candidatesError && candidates.length === 0 && (
                    <p className="text-gray-500 text-sm">No se encontraron clientes para este número.</p>
                )}

                {!loadingCandidates && candidates.length > 0 && (
                    <div className="space-y-2">
                        {candidates.map((cedula, idx) => {
                            const isActive = selectedCedula === cedula;
                            return (
                                <button
                                    key={`${cedula}-${idx}`}
                                    onClick={() => setSelectedCedula(prev => prev === cedula ? null : cedula)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm ${
                                        isActive
                                            ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/40'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-semibold">{cedula}</span>
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Panel de datos del cliente seleccionado */}
            {selectedCedula && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-xs text-gray-500 font-medium px-1">Datos de {selectedCedula}</span>
                        <div className="h-px flex-1 bg-gray-200" />
                    </div>
                    <ClientDataPanel
                        cedula={selectedCedula}
                        userRole={userRole}
                        onAdminfoUrlChange={onAdminfoUrlChange}
                        setParentClientInfo={setParentClientInfo}
                    />
                </div>
            )}
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────
// Componente principal WppClientInfo
// ──────────────────────────────────────────────────────────────────────────
const WppClientInfo = ({ selectedConversation, userRole, setClientInfo: setParentClientInfo, onAdminfoUrlChange, onClose }) => {
    const scrollContainerRef = useRef(null);

    // Detectar si es conversación con contacto ambiguo:
    // • is_ambiguous_contact === true  (campo del backend)
    // • o el chat_title contiene "VARIOS CLIENTES"
    const isAmbiguous =
        selectedConversation?.is_ambiguous_contact === true ||
        (selectedConversation?.chat_title || '').toUpperCase().includes('VARIOS CLIENTES');

    const phoneNumber = selectedConversation?.customer_phone_number || null;
    const clientCedula = selectedConversation?.client_cedula || null;

    return (
        <div className="w-100 bg-white border-l border-gray-200 flex flex-col h-full min-h-0 max-w-full">
            <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Información del Cliente</h2>
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 lg:hidden flex items-center justify-center transition-colors"
                        title="Cerrar panel"
                    >
                        <X className="w-5.5 h-5.5" />
                    </button>
                )}
            </div>

            <div ref={scrollContainerRef} className="flex-1 min-h-0 p-4 space-y-4 overflow-y-auto">
                {!selectedConversation && (
                    <p className="text-gray-400 text-sm text-center mt-8">Selecciona una conversación</p>
                )}

                {selectedConversation && isAmbiguous && (
                    <AmbiguousContactPanel
                        phoneNumber={phoneNumber}
                        userRole={userRole}
                        onAdminfoUrlChange={onAdminfoUrlChange}
                        setParentClientInfo={setParentClientInfo}
                    />
                )}

                {selectedConversation && !isAmbiguous && (
                    <ClientDataPanel
                        cedula={clientCedula}
                        userRole={userRole}
                        onAdminfoUrlChange={onAdminfoUrlChange}
                        setParentClientInfo={setParentClientInfo}
                    />
                )}
            </div>
        </div>
    );
};

export default WppClientInfo;
