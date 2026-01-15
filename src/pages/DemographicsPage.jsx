import React, { useState } from 'react';
import { Search, Users, Upload } from 'lucide-react';
import ClientProfile360 from '../components/demographics/ClientProfile360';
import BulkOperations from '../components/demographics/BulkOperations';
import * as api from '../services/api';
import { toast } from 'sonner';

const DemographicsPage = () => {
  const [activeTab, setActiveTab] = useState('individual');
  const [searchValue, setSearchValue] = useState('');
  const [searchType, setSearchType] = useState(null); // 'cedula' or 'contact'
  const [profileData, setProfileData] = useState(null);
  const [contactSearchResults, setContactSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const detectSearchType = (value) => {
    // Detectar si es cédula, teléfono o email
    const cleaned = value.trim();
    
    // Si contiene @, es email
    if (cleaned.includes('@')) {
      return 'contact';
    }
    
    // Si es solo números
    if (/^\d+$/.test(cleaned)) {
      // Teléfonos celulares colombianos: 10 dígitos que empiezan con 3
      if (cleaned.length === 10 && cleaned.startsWith('3')) {
        return 'contact';
      }
      // Teléfonos con prefijo 57: 12 dígitos (57 + 10 dígitos)
      if (cleaned.length === 12 && cleaned.startsWith('573')) {
        return 'contact';
      }
      // Cédulas: típicamente 6-10 dígitos (pero no celulares)
      if (cleaned.length >= 6 && cleaned.length <= 10) {
        return 'cedula';
      }
    }
    
    return null;
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error('Por favor ingresa un valor de búsqueda');
      return;
    }

    const type = detectSearchType(searchValue);
    
    if (!type) {
      toast.error('Formato inválido. Ingresa una cédula, teléfono o email válido');
      return;
    }

    setIsLoading(true);
    setSearchType(type);
    setProfileData(null);
    setContactSearchResults(null);

    try {
      if (type === 'cedula') {
        // Búsqueda por cédula - cargar perfil completo
        const data = await api.getClientProfile(searchValue.trim(), {
          include: 'contacts,obligations',
        });
        setProfileData(data);
        toast.success('Perfil cargado exitosamente');
      } else {
        // Búsqueda inversa por contacto
        const data = await api.reverseSearchContact(searchValue.trim());
        setContactSearchResults(data);
        
        if (data.cedulas && data.cedulas.length > 0) {
          toast.success(`Se encontraron ${data.cedulas.length} cliente(s) asociado(s)`);
        } else {
          toast.warning('No se encontraron clientes con ese contacto');
        }
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      toast.error(error.message || 'Error al realizar la búsqueda');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCedula = async (cedula) => {
    setIsLoading(true);
    try {
      const data = await api.getClientProfile(cedula, {
        include: 'contacts,obligations',
      });
      setProfileData(data);
      setContactSearchResults(null);
      setSearchType('cedula');
      setSearchValue(cedula);
      toast.success('Perfil cargado exitosamente');
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      toast.error(error.message || 'Error al cargar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Demográficos</h1>
        <p className="text-gray-600">Gestión de información de contacto y datos demográficos de clientes</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('individual')}
              className={`${
                activeTab === 'individual'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center py-4 px-6 border-b-2 font-medium text-sm transition-colors`}
            >
              <Search className="h-5 w-5 mr-2" />
              Búsqueda Individual
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`${
                activeTab === 'bulk'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center py-4 px-6 border-b-2 font-medium text-sm transition-colors`}
            >
              <Upload className="h-5 w-5 mr-2" />
              Procesos Masivos
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'individual' ? (
            <div>
              {/* Search Bar */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar por Cédula, Teléfono o Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ej: 1234567890, 3001234567, cliente@email.com"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    <Search className="h-5 w-5" />
                    {isLoading ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Ingresa una cédula para ver el perfil completo, o un teléfono/email para encontrar los clientes asociados
                </p>
              </div>

              {/* Results */}
              {isLoading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              )}

              {!isLoading && contactSearchResults && contactSearchResults.cedulas && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    Clientes Encontrados ({contactSearchResults.cedulas.length})
                  </h3>
                  <div className="space-y-2">
                    {contactSearchResults.cedulas.map((cedula) => (
                      <button
                        key={cedula}
                        onClick={() => handleSelectCedula(cedula)}
                        className="w-full text-left px-4 py-3 bg-white hover:bg-blue-100 rounded-lg border border-gray-200 hover:border-blue-400 transition-all"
                      >
                        <span className="font-medium text-gray-900">Cédula: {cedula}</span>
                        <span className="text-sm text-gray-500 ml-2">→ Click para ver perfil</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isLoading && profileData && (
                <ClientProfile360 profileData={profileData} onRefresh={() => handleSearch()} />
              )}

              {!isLoading && !profileData && !contactSearchResults && (
                <div className="text-center py-12 text-gray-500">
                  <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Realiza una búsqueda para comenzar</p>
                </div>
              )}
            </div>
          ) : (
            <BulkOperations />
          )}
        </div>
      </div>
    </div>
  );
};

export default DemographicsPage;
