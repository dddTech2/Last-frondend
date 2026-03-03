import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../services/api";
import { toast } from "sonner";
import { Search, Plus, Loader2, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Info } from "lucide-react";
import { STATUS_MAP, PRIORITY_MAP, TYPE_MAP, MODULE_OPTIONS, STATUS_OPTIONS, PRIORITY_OPTIONS, TYPE_OPTIONS, isTechOrAdmin } from "./ticketUtils";

const TicketsListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    status_filter: "",
    module_filter: "",
    type_filter: "",
    priority_filter: "",
    search: "",
    skip: 0,
    limit: 15,
  });

  const resolvedRoles = Array.isArray(user?.decoded?.roles) ? user.decoded.roles : user?.decoded?.role ? [user.decoded.role] : [];
  const canSearch = isTechOrAdmin(resolvedRoles);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const activeFilters = { ...filters };
      // Limpiar filtros vacíos
      Object.keys(activeFilters).forEach(key => {
        if (activeFilters[key] === "") {
          delete activeFilters[key];
        }
      });
      if (!canSearch) {
        delete activeFilters.search;
      }

      const res = await api.getTickets(activeFilters);
      setTickets(res.items || []);
      setTotal(res.total || 0);
    } catch (error) {
      toast.error(error.message || "Error al cargar tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filters.skip, filters.limit, filters.status_filter, filters.module_filter, filters.type_filter, filters.priority_filter]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, skip: 0 }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTickets(); // El search manual dispara un fetch
  };

  const handlePageChange = (newSkip) => {
    setFilters(prev => ({ ...prev, skip: newSkip }));
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const currentPage = Math.floor(filters.skip / filters.limit) + 1;
  const totalPages = Math.ceil(total / filters.limit);
  const hasMore = (filters.skip + filters.limit) < total;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Soporte y Tickets</h1>
          <p className="text-sm text-gray-500">Gestión de fallas y solicitudes de mejora</p>
        </div>
        <Link
          to="/tickets/nuevo"
          className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-1" />
          Nuevo Ticket
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-end">
        {canSearch && (
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">Buscar (min 3 chars)</label>
            <div className="relative">
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Buscar descripción..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </form>
        )}
        
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
          <select name="status_filter" value={filters.status_filter} onChange={handleFilterChange} className="w-full py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm bg-white">
            <option value="">Todos</option>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="min-w-[180px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">Módulo</label>
          <select name="module_filter" value={filters.module_filter} onChange={handleFilterChange} className="w-full py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm bg-white">
            <option value="">Todos</option>
            {MODULE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
          <select name="type_filter" value={filters.type_filter} onChange={handleFilterChange} className="w-full py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm bg-white">
            <option value="">Todos</option>
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">Prioridad</label>
          <select name="priority_filter" value={filters.priority_filter} onChange={handleFilterChange} className="w-full py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm bg-white">
            <option value="">Todas</option>
            {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        
        <button onClick={fetchTickets} className="p-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 flex items-center justify-center">
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Módulo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reportador</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Cargando tickets...</p>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-gray-500 font-medium text-base">No se encontraron tickets</p>
                      <p className="text-gray-400 text-sm mt-1 mb-4">Ajusta los filtros o crea uno nuevo.</p>
                      <Link to="/tickets/nuevo" className="text-blue-600 hover:text-blue-700 font-medium">Crear un ticket &rarr;</Link>
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => {
                  const statusInfo = STATUS_MAP[ticket.status] || { label: ticket.status, color: "bg-gray-100 text-gray-800 border-gray-200" };
                  const priorityInfo = PRIORITY_MAP[ticket.priority] || { label: ticket.priority, color: "bg-gray-100 text-gray-800 border-gray-200" };
                  const typeInfo = TYPE_MAP[ticket.type] || { label: ticket.type, color: "bg-gray-100 text-gray-800 border-gray-200" };
                  const PriorityIcon = priorityInfo.icon || Info;
                  const TypeIcon = typeInfo.icon || Info;

                  return (
                    <tr 
                      key={ticket.id} 
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${ticket.priority === 'Crítica' ? 'bg-red-50/20' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{ticket.correlative_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeInfo.color}`}>
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 truncate max-w-[150px]" title={ticket.module}>
                        {MODULE_OPTIONS.find(o => o.value === ticket.module || o.label === ticket.module)?.label || ticket.module}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-[200px]" title={ticket.description}>
                        {ticket.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${priorityInfo.color}`}>
                          <PriorityIcon className="w-3 h-3 mr-1" />
                          {priorityInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 truncate max-w-[120px]">
                        {ticket.reporter_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 truncate max-w-[120px]">
                        {ticket.assigned_agent_name ? ticket.assigned_agent_name : <span className="text-gray-400 italic">Sin asignar</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ticket.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && tickets.length > 0 && (
          <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{tickets.length}</span> de <span className="font-medium">{total}</span> tickets
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(0, filters.skip - filters.limit))}
                disabled={filters.skip === 0}
                className="p-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-700">
                Página {currentPage} de {totalPages || 1}
              </span>
              <button
                onClick={() => handlePageChange(filters.skip + filters.limit)}
                disabled={!hasMore}
                className="p-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsListPage;
