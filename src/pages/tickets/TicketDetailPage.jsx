import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../services/api";
import { toast } from "sonner";
import { ArrowLeft, Loader2, AlertCircle, MessageSquare, Clock, FileImage, Download, Bug, Star, Settings, User, RefreshCw, Info } from "lucide-react";
import { STATUS_MAP, PRIORITY_MAP, TYPE_MAP, STATUS_OPTIONS, PRIORITY_OPTIONS, MODULE_OPTIONS, isTechOrAdmin } from "./ticketUtils";

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [techUsers, setTechUsers] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [imageModal, setImageModal] = useState(null);
  
  const resolvedRoles = Array.isArray(user?.decoded?.roles) ? user.decoded.roles : user?.decoded?.role ? [user.decoded.role] : [];
  const isAdminOrTech = isTechOrAdmin(resolvedRoles);

  const fetchTicket = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTicket(id);
      setTicket(data);
    } catch (err) {
      if (err.status === 403) setError("No tiene acceso a este ticket.");
      else if (err.status === 404) setError("Ticket no encontrado.");
      else setError(err.message || "Error al cargar ticket");
    } finally {
      setLoading(false);
    }
  };

  const fetchTechUsers = async () => {
    if (!isAdminOrTech) return;
    try {
      // Intentamos cargar hasta 100 usuarios, asumiendo que la API los retorna todos.
      // Se podría optimizar filtrando en backend si la API lo permite
      const res = await api.getUsers(0, 1000);
      const allUsers = Array.isArray(res) ? res : res.items || [];
      const tech = allUsers.filter(u => 
        u.roles?.some(r => r.name === "Tecnología" || r.name === "Tecnologia" || r.name === "Admin" || r.name === "Super Administrador")
      );
      setTechUsers(tech);
    } catch (error) {
      console.error("Error al cargar agentes:", error);
    }
  };

  useEffect(() => {
    fetchTicket();
    fetchTechUsers();
  }, [id]);

  const handleUpdate = async (field, value) => {
    if (!isAdminOrTech) return;
    setUpdating(true);
    try {
      const res = await api.updateTicket(id, { [field]: value });
      setTicket(res);
      toast.success("Ticket actualizado");
    } catch (err) {
      toast.error(err.message || "Error al actualizar");
    } finally {
      // Refrescar para asegurar sync total, incluyendo historial completo y nombres de usuarios
      fetchTicket();
      setUpdating(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    setCommenting(true);
    try {
      const newComment = await api.addTicketComment(id, commentText);
      setTicket(prev => ({
        ...prev,
        comments: [...(prev.comments || []), newComment]
      }));
      setCommentText("");
      toast.success("Comentario agregado");
    } catch (err) {
      toast.error(err.message || "Error al agregar comentario");
    } finally {
      setCommenting(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500 font-medium">Cargando detalle del ticket...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado / Error</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button onClick={() => navigate('/tickets')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          Volver al listado
        </button>
      </div>
    );
  }

  if (!ticket) return null;

  const statusInfo = STATUS_MAP[ticket.status] || { label: ticket.status, color: "bg-gray-100 text-gray-800 border-gray-200" };
  const priorityInfo = PRIORITY_MAP[ticket.priority] || { label: ticket.priority, color: "bg-gray-100 text-gray-800 border-gray-200" };
  const typeInfo = TYPE_MAP[ticket.type] || { label: ticket.type, color: "bg-gray-100 text-gray-800 border-gray-200" };
  const PriorityIcon = priorityInfo.icon || Info;
  const TypeIcon = typeInfo.icon || Bug;

  const mapFieldChanged = (field) => {
    const dict = { status: "Estado", priority: "Prioridad", assigned_agent_id: "Agente asignado" };
    return dict[field] || field;
  };

  const getStatusValue = (statusStr) => {
    if (!statusStr) return "ABIERTO";
    const s = statusStr.toUpperCase().replace(" ", "_");
    if (s === "EN_PROGRESO") return "EN_PROGRESO";
    if (s === "RESUELTO") return "RESUELTO";
    if (s === "CERRADO") return "CERRADO";
    return "ABIERTO";
  };

  const formatFieldValue = (field, value) => {
    if (!value) return "nada";
    if (field === "status") {
      const match = STATUS_OPTIONS.find(o => o.value === value);
      return match ? match.label : value;
    }
    if (field === "priority") {
      const match = PRIORITY_OPTIONS.find(o => o.value === value);
      return match ? match.label : value;
    }
    if (field === "assigned_agent_id") {
      if (value === "Sin asignar" || value === "null" || !value) return "Sin asignar";
      const techUser = techUsers.find(u => u.id === value);
      return techUser ? techUser.full_name : "Agente Asignado";
    }
    return value;
  };

  const getPriorityValue = (priorityStr) => {
    if (!priorityStr) return "MEDIA";
    const p = priorityStr.toUpperCase().replace("Í", "I");
    if (p === "BAJA") return "BAJA";
    if (p === "ALTA") return "ALTA";
    if (p === "CRITICA") return "CRITICA";
    return "MEDIA";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => navigate("/tickets")} className="mr-4 text-gray-500 hover:text-gray-700 transition-colors bg-white p-2 rounded-full shadow-sm border border-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">Ticket #{ticket.correlative_id}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeInfo.color}`}>
                <TypeIcon className="w-3 h-3 mr-1" />
                {typeInfo.label}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500">
              {MODULE_OPTIONS.find(o => o.value === ticket.module || o.label === ticket.module)?.label || ticket.module}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Detalles */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className={`px-3 py-1 rounded-md text-sm font-medium border ${statusInfo.color}`}>
                  {statusInfo.label}
                </div>
                <div className={`px-3 py-1 rounded-md text-sm font-medium border flex items-center ${priorityInfo.color}`}>
                  <PriorityIcon className="w-4 h-4 mr-1" />
                  {priorityInfo.label}
                </div>
                <div className="text-sm text-gray-500 flex items-center ml-auto">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDate(ticket.created_at)}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción</h3>
                <div className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed p-4 bg-gray-50 rounded-lg border border-gray-100">
                  {ticket.description}
                </div>
              </div>

              {ticket.type === "Solicitud de Mejora" && ticket.expected_benefit && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Beneficio Esperado</h3>
                  <div className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed p-4 bg-purple-50 rounded-lg border border-purple-100">
                    {ticket.expected_benefit}
                  </div>
                </div>
              )}

              {ticket.attachments && ticket.attachments.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Archivos Adjuntos ({ticket.attachments.length})</h3>
                    <button onClick={fetchTicket} className="text-xs text-blue-600 hover:text-blue-800 flex items-center font-medium">
                      <RefreshCw className="w-3 h-3 mr-1" /> Recargar Enlaces
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {ticket.attachments.map(att => (
                      <div key={att.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white">
                        {att.signed_url ? (
                          att.content_type.startsWith('image/') ? (
                            <div className="aspect-video bg-gray-100 overflow-hidden cursor-pointer" onClick={() => setImageModal(att.signed_url)}>
                              <img src={att.signed_url} alt={att.file_name} className="object-cover w-full h-full hover:scale-105 transition-transform duration-300" />
                            </div>
                          ) : (
                            <div className="aspect-video bg-gray-50 flex flex-col items-center justify-center p-4">
                              <FileArchive className="w-8 h-8 text-blue-500 mb-2" />
                              <a href={att.signed_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-medium truncate max-w-full hover:underline">
                                Descargar ZIP
                              </a>
                            </div>
                          )
                        ) : (
                          <div className="aspect-video bg-gray-100 flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                            <FileImage className="w-6 h-6 mb-1" />
                            <span className="text-[10px]">Imagen no disponible</span>
                          </div>
                        )}
                        <div className="p-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-600 truncate flex justify-between items-center">
                          <span className="truncate mr-2" title={att.file_name}>{att.file_name}</span>
                          {att.signed_url && (
                            <a href={att.signed_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600" title="Descargar" download>
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comentarios */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center">
              <MessageSquare className="w-5 h-5 text-gray-500 mr-2" />
              <h3 className="font-semibold text-gray-800">Comentarios</h3>
            </div>
            
            <div className="p-6">
              {ticket.comments && ticket.comments.length > 0 ? (
                <div className="space-y-6 mb-6">
                  {ticket.comments.map((comment, idx) => (
                    <div key={comment.id || idx} className="flex space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs uppercase">
                        {comment.author_name.substring(0, 2)}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg rounded-tl-none border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-800">{comment.author_name}</span>
                          <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm mb-6">
                  Aún no hay comentarios en este ticket.
                </div>
              )}

              <form onSubmit={handleCommentSubmit} className="mt-4 pt-4 border-t border-gray-100">
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-blue-500 focus:border-blue-500 resize-none mb-3"
                  required
                  maxLength={5000}
                ></textarea>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!commentText.trim() || commenting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {commenting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Enviar Comentario
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Sidebar (Info, Gestion, Historial) */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-5 py-3 flex items-center">
              <User className="w-4 h-4 text-gray-500 mr-2" />
              <h3 className="font-semibold text-gray-800 text-sm">Detalles Personales</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Reportado por</p>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-bold mr-2">
                    {ticket.reporter_name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-800 font-medium">{ticket.reporter_name}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1">Agente Asignado</p>
                {ticket.assigned_agent_name ? (
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold mr-2">
                      {ticket.assigned_agent_name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-800 font-medium">{ticket.assigned_agent_name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Sin asignar</span>
                )}
              </div>
            </div>
          </div>

          {isAdminOrTech && (
            <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden relative">
              {updating && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              )}
              <div className="border-b border-blue-100 bg-blue-50 px-5 py-3 flex items-center">
                <Settings className="w-4 h-4 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-800 text-sm">Gestión del Ticket</h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                  <select 
                    value={getStatusValue(ticket.status)} 
                    onChange={(e) => handleUpdate("status", e.target.value)}
                    className="w-full border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                  >
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Prioridad</label>
                  <select 
                    value={getPriorityValue(ticket.priority)} 
                    onChange={(e) => handleUpdate("priority", e.target.value)}
                    className="w-full border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                  >
                    {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Asignar Agente</label>
                  <select 
                    value={ticket.assigned_agent_id || ""} 
                    onChange={(e) => handleUpdate("assigned_agent_id", e.target.value || null)}
                    className="w-full border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                  >
                    <option value="">-- Sin asignar --</option>
                    {techUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
              <h3 className="font-semibold text-gray-800 text-sm">Historial de Cambios</h3>
            </div>
            <div className="p-0 max-h-80 overflow-y-auto">
              {ticket.history && ticket.history.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {ticket.history.map(item => (
                    <li key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5"></div>
                        </div>
                        <div className="ml-3">
                          <p className="text-xs text-gray-800">
                            <span className="font-semibold">{item.user_name}</span> cambió <span className="font-medium text-gray-600">{mapFieldChanged(item.field_changed)}</span> de{' '}
                            <span className="bg-gray-100 px-1 py-0.5 rounded text-[10px] line-through text-gray-500">{formatFieldValue(item.field_changed, item.old_value)}</span>{' '}
                            a <span className="bg-blue-50 text-blue-700 px-1 py-0.5 rounded font-medium text-[10px]">{formatFieldValue(item.field_changed, item.new_value)}</span>
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">{formatDate(item.created_at)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center text-sm text-gray-500">
                  Sin cambios registrados.
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* Image Modal Lightbox */}
      {imageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setImageModal(null)}>
          <div className="relative max-w-5xl max-h-[90vh] w-full flex justify-center items-center">
            <button 
              className="absolute -top-10 right-0 text-white hover:text-gray-300 p-2"
              onClick={() => setImageModal(null)}
            >
              Cerrar <span className="text-xl">×</span>
            </button>
            <img src={imageModal} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
          </div>
        </div>
      )}

    </div>
  );
};

export default TicketDetailPage;
