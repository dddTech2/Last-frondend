import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle, Loader2 } from 'lucide-react';
import { getClientProfile } from '../services/api';
// Importamos la imagen - Asumiremos que el usuario la guardará aquí
// Si no existe, fallará el build, así que usaremos una ruta relativa segura o un placeholder por ahora
import searchImage from '../assets/vision360-search.png'; 

const ClientSearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Verificamos si existe el cliente intentando cargar su perfil
      // Usamos include mínimo para que sea rápido
      await getClientProfile(searchTerm.trim(), { include: 'client_info' });
      
      // Si no lanza error, el cliente existe
      navigate(`/vision360/${encodeURIComponent(searchTerm.trim())}`);
    } catch (err) {
      console.error("Error searching client:", err);
      // Asumimos que cualquier error 404 o similar significa que no existe
      setError('No se encontró ningún cliente con esa cédula o nombre.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-2xl w-full text-center space-y-8 border border-gray-100">
        
        {/* Image Section */}
        <div className="flex justify-center mb-6">
          <img 
            src={searchImage} 
            alt="Buscar Cliente" 
            className="w-48 h-48 object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.style.display = 'none'; // Ocultar si falla la carga
            }}
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Vision 360° Cliente
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Ingrese el número de identificación del cliente para consultar su historial completo.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative max-w-lg mx-auto w-full">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (error) setError(null); // Limpiar error al escribir
              }}
              placeholder="Ej: 123456789"
              className={`w-full pl-6 pr-14 py-4 text-lg border-2 rounded-full outline-none transition-all shadow-sm
                ${error 
                  ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-red-50' 
                  : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-gray-300'
                }`}
              autoFocus
              disabled={isLoading}
            />
            
            <button
              type="submit"
              disabled={!searchTerm.trim() || isLoading}
              className={`absolute right-2 top-2 bottom-2 p-3 rounded-full transition-all shadow-md 
                ${!searchTerm.trim() || isLoading 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-95'
                }`}
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Search className="w-6 h-6" />
              )}
            </button>
          </div>
          
          {/* Error Message within the same component */}
          {error && (
            <div className="absolute -bottom-12 left-0 right-0 flex items-center justify-center text-red-600 bg-red-50 py-2 px-4 rounded-lg animate-fade-in-up">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
        </form>

        <div className="text-sm text-gray-400 pt-8 border-t border-gray-100 mt-8">
          Búsqueda unificada en tiempo real
        </div>
      </div>
    </div>
  );
};

export default ClientSearchPage;
