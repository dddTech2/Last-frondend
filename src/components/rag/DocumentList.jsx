import React, { useState, useEffect } from 'react';
import { getDocuments, deleteDocument } from '../../services/ragService';
import { format } from 'date-fns';
import { FileText, Trash2, Search, Loader2, AlertCircle, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import ModernModal from '../ModernModal';

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [pageSize] = useState(10);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDocuments(page, pageSize, search);
      // Adapt response structure if needed. Assuming { items: [], total_pages: n } or similar.
      // Adjust based on actual API response.
      if (data && Array.isArray(data.items)) {
        setDocuments(data.items);
        setTotalPages(data.total_pages || Math.ceil(data.total / pageSize) || 1);
      } else if (Array.isArray(data)) {
         // Fallback if API returns just an array
         setDocuments(data);
         setTotalPages(1);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      setError('Error al cargar documentos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, search]);

  const confirmDelete = (doc) => {
    setDocToDelete(doc);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    
    setDeletingId(docToDelete.id);
    setDeleteModalOpen(false); // Close modal immediately or wait? better close and show loader in row
    
    try {
      await deleteDocument(docToDelete.id);
      toast.success('Documento eliminado correctamente');
      fetchDocuments();
    } catch (err) {
      toast.error('Error al eliminar el documento');
      console.error(err);
    } finally {
      setDeletingId(null);
      setDocToDelete(null);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          Documentos Indexados
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500 mb-2" />
                  <p>Cargando documentos...</p>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-red-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>{error}</p>
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  No hay documentos indexados. Sube uno para comenzar.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">{doc.file_name || doc.name || 'Sin nombre'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {doc.category || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.created_at ? format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      (doc.chunks_count > 0) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.chunks_count > 0 ? 'Indexado' : 'Procesando'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => confirmDelete(doc)}
                      disabled={deletingId === doc.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors p-1 hover:bg-red-50 rounded"
                      title="Eliminar documento"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Página <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <span className="sr-only">Anterior</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <span className="sr-only">Siguiente</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ModernModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar eliminación"
        icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
        size="sm"
        actions={
          <>
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Eliminar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar el documento <span className="font-semibold text-gray-900">{docToDelete?.filename || docToDelete?.name}</span>? 
            Esta acción no se puede deshacer y el asistente dejará de usar este documento como fuente de conocimiento.
          </p>
        </div>
      </ModernModal>
    </div>
  );
};

export default DocumentList;
