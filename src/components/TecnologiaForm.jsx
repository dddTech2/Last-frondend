import React, { useState, useMemo, useEffect } from 'react';
import { Search, Save, Loader2, Monitor, Wifi, Mail, Phone, Hash, ArrowLeft, AlertCircle, Lock, Upload, CheckCircle, XCircle } from 'lucide-react';
import FormField from './FormField';
import { toast } from 'sonner';
import * as api from '../services/api';

const TecnologiaForm = ({ employees = [], onSubmit, onCancel, isSubmitting = false }) => {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'credentials'
  const [searchTerm, setSearchTerm] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasCredential, setHasCredential] = useState(false);

  // Check for existing credentials when tab or employee changes
  useEffect(() => {
    const checkCredential = async () => {
      if (activeTab === 'credentials' && selectedEmployee?.adminfo) {
        try {
          const cred = await api.getEmployeeCredential(selectedEmployee.adminfo);
          // Assuming the API returns the credential object if found, or throws 404
          if (cred) { 
            setHasCredential(true);
          }
        } catch (error) {
          // If 404 or other error, assume no credential or keep false
          setHasCredential(false);
        }
      }
    };

    checkCredential();
  }, [activeTab, selectedEmployee]);
  
  // General Data Form State
  const [formData, setFormData] = useState({
    correo_renovar: '',
    extension_3cx: '',
    cola: '',
    usuario_red: '',
  });

  // Credentials Form State
  const [credentialData, setCredentialData] = useState({
    password: '',
  });

  // Filter employees based on search term and pending status
  const filteredEmployees = useMemo(() => {
    // If no search term and not filtering by pending, show nothing
    if (!searchTerm && !showPendingOnly) return [];
    
    let result = employees;

    // Filter by pending data if toggle is on
    // In 'general' mode: check for missing tech fields
    // In 'credentials' mode: show all or filter logic could be different (but we keep consistent for search)
    if (showPendingOnly) {
      result = result.filter(emp => 
        !emp.correo_renovar || 
        !emp.extension_3cx || 
        !emp.cola_3cx || 
        !emp.usuario_red
      );
    }

    // Filter by search term (Name or Cedula)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(emp => 
        (emp.nombre || '').toLowerCase().includes(term) ||
        (emp.cedula || '').includes(term) ||
        (emp.adminfo || '').toLowerCase().includes(term)
      );
    }

    return result.slice(0, 20); // Limit results for performance
  }, [employees, searchTerm, showPendingOnly]);

  const handleSelectEmployee = async (emp) => {
    setSelectedEmployee(emp);
    
    const safeString = (val) => val === null || val === undefined || typeof val === 'object' ? '' : String(val);

    // Populate General Data
    setFormData({
      correo_renovar: safeString(emp.correo_renovar),
      extension_3cx: safeString(emp.extension_3cx),
      cola: safeString(emp.cola_3cx),
      usuario_red: safeString(emp.usuario_red),
    });

    // Reset Credential Data
    setCredentialData({ password: '' });
    setHasCredential(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'cola' && value && !/^\d+$/.test(value)) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCredentialChange = (e) => {
    const { name, value } = e.target;
    setCredentialData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitGeneral = (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    const payload = {
      cedula: selectedEmployee.cedula,
      correo_renovar: formData.correo_renovar,
      extension_3cx: formData.extension_3cx,
      cola_3cx: formData.cola,
      usuario_red: formData.usuario_red,
    };
    
    onSubmit(payload);
  };

  const handleSaveCredential = async (verify = false) => {
    if (!selectedEmployee?.adminfo) {
      toast.error('El empleado no tiene ADMINFO asignado.');
      return;
    }
    if (!credentialData.password) {
      toast.error('La contraseña es requerida.');
      return;
    }

    try {
      if (verify) setIsVerifying(true);
      
      const payload = {
        adminfo: selectedEmployee.adminfo,
        email: selectedEmployee.correo_renovar,
        password: credentialData.password
      };

      // Try PUT first (Update), if fail assume Create
      try {
         await api.updateEmployeeCredential(selectedEmployee.adminfo, payload);
      } catch (err) {
         if (err.status === 404) {
           await api.createEmployeeCredential(payload);
         } else {
           throw err;
         }
      }

      toast.success('Credencial guardada correctamente.');
      setHasCredential(true); // Now we know it exists

      // 2. Verify if requested
      if (verify) {
        toast.info('Verificando credenciales SMTP...');
        await api.verifyEmployeeCredential(selectedEmployee.adminfo, credentialData.password);
        toast.success('Verificación SMTP exitosa. Credenciales válidas.');
      }
      
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al guardar/verificar credencial');
    } finally {
      if (verify) setIsVerifying(false);
    }
  };

  const handleVerifyExisting = async () => {
      if (!selectedEmployee?.adminfo) return;
      
      try {
          setIsVerifying(true);
          toast.info('Validando credenciales actuales...');
          // Call verify without password to trigger checking stored credentials
          await api.verifyEmployeeCredential(selectedEmployee.adminfo);
          toast.success('La contraseña actual es VÁLIDA.');
      } catch (error) {
          console.error(error);
          toast.error('La contraseña actual es INVÁLIDA o hubo un error de conexión.');
      } finally {
          setIsVerifying(false);
      }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await api.uploadEmployeeCredentialsCSV(file);
      toast.success('Carga masiva de credenciales exitosa.');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error en la carga masiva.');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  // --- RENDER CONTENT BASED ON TAB ---

  const renderSearchList = () => (
    <div className="space-y-4 min-h-[400px]">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
        <p className="text-sm text-blue-800 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Busca un empleado por nombre, cédula o ADMINFO.
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o adminfo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pb-2">
        <input
          type="checkbox"
          id="pendingOnly"
          checked={showPendingOnly}
          onChange={(e) => setShowPendingOnly(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="pendingOnly" className="text-sm text-gray-700 cursor-pointer select-none">
          Mostrar solo empleados con datos pendientes
        </label>
      </div>

      <div className="border rounded-lg divide-y divide-gray-100 max-h-[300px] overflow-y-auto bg-white shadow-sm">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map(emp => (
            <button
              key={emp.cedula}
              onClick={() => handleSelectEmployee(emp)}
              className="w-full text-left p-3 hover:bg-gray-50 transition-colors flex items-center justify-between group"
            >
              <div>
                <p className="font-medium text-gray-900">{emp.nombre}</p>
                <div className="flex gap-2 text-xs text-gray-500 mt-1">
                  <span className="bg-gray-100 px-2 py-0.5 rounded">{emp.cedula}</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{emp.adminfo || 'Sin Adminfo'}</span>
                  <span>{emp.cargo}</span>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                  Seleccionar
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || showPendingOnly 
              ? 'No se encontraron empleados con esos criterios.' 
              : 'Utiliza el buscador o el filtro para encontrar empleados.'}
          </div>
        )}
      </div>
      
      <div className="flex justify-end pt-4 border-t border-gray-100 mt-auto">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
        >
          Cerrar
        </button>
      </div>
    </div>
  );

  const renderGeneralForm = () => (
    <form onSubmit={handleSubmitGeneral} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Correo Renovar"
          name="correo_renovar"
          type="email"
          value={formData.correo_renovar}
          onChange={handleChange}
          icon={<Mail className="h-4 w-4 text-gray-400" />}
          placeholder="usuario@renovar.com"
        />
        <FormField
          label="Extensión 3CX"
          name="extension_3cx"
          value={formData.extension_3cx}
          onChange={handleChange}
          icon={<Phone className="h-4 w-4 text-gray-400" />}
          placeholder="Ej: 101"
        />
        <FormField
          label="Cola"
          name="cola"
          value={formData.cola}
          onChange={handleChange}
          icon={<Hash className="h-4 w-4 text-gray-400" />}
          placeholder="Ej: 101 (Solo números)"
        />
        <FormField
          label="Usuario de Red"
          name="usuario_red"
          value={formData.usuario_red}
          onChange={handleChange}
          icon={<Wifi className="h-4 w-4 text-gray-400" />}
          placeholder="Usuario de Red / Equipo"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setSelectedEmployee(null)}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar Cambios
            </>
          )}
        </button>
      </div>
    </form>
  );

  const renderCredentialsForm = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* CSV Upload Section */}
      {!selectedEmployee && (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Carga Masiva de Contraseñas (CSV)</h4>
            <p className="text-xs text-gray-500 mb-4">Formato: adminfo, email, password</p>
            
            <div className="flex justify-center">
                <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm">
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span>{isUploading ? 'Subiendo...' : 'Seleccionar Archivo CSV'}</span>
                    <input 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        onChange={handleFileUpload}
                        disabled={isUploading}
                    />
                </label>
            </div>
        </div>
      )}

      {selectedEmployee ? (
        <>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-yellow-600" />
                        <h4 className="font-semibold text-yellow-800">Gestión de Contraseña SMTP</h4>
                    </div>
                    {/* Visual Indicator */}
                    {hasCredential ? (
                        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            <CheckCircle className="h-3 w-3" />
                            Contraseña Configurada
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold">
                            <AlertCircle className="h-3 w-3" />
                            Sin Contraseña
                        </span>
                    )}
                </div>
                <p className="text-sm text-yellow-700">
                    Establece la contraseña del correo corporativo para habilitar el envío de correos desde el sistema.
                </p>
            </div>

            <div className="space-y-4">
                 <FormField
                    label="Correo Electrónico (Solo Lectura)"
                    value={selectedEmployee.correo_renovar || 'No asignado'}
                    readOnly={true}
                    disabled={true}
                    icon={<Mail className="h-4 w-4 text-gray-400" />}
                 />
                 
                 <FormField
                    label="Contraseña de Correo"
                    name="password"
                    type="password"
                    value={credentialData.password}
                    onChange={handleCredentialChange}
                    icon={<Lock className="h-4 w-4 text-gray-400" />}
                    placeholder={hasCredential ? "•••••••• (Dejar en blanco para mantener)" : "Ingrese la contraseña del correo"}
                 />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 flex-wrap">
                <button
                    type="button"
                    onClick={() => setSelectedEmployee(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                    disabled={isVerifying}
                >
                    Cancelar
                </button>
                
                {hasCredential && !credentialData.password && (
                    <button
                        type="button"
                        onClick={handleVerifyExisting}
                        className="px-4 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-medium border border-indigo-200 flex items-center gap-2"
                        disabled={isVerifying}
                    >
                        {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Validar Actual
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => handleSaveCredential(false)}
                    className="px-4 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium border border-blue-200"
                    disabled={isVerifying || !credentialData.password}
                >
                    Guardar Nueva
                </button>

                <button
                    type="button"
                    onClick={() => handleSaveCredential(true)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50"
                    disabled={isVerifying || !credentialData.password}
                >
                    {isVerifying ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verificando...
                    </>
                    ) : (
                    <>
                        <CheckCircle className="h-4 w-4" />
                        Guardar y Verificar
                    </>
                    )}
                </button>
            </div>
        </>
      ) : (
          renderSearchList()
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
            <button
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                    activeTab === 'general' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('general')}
            >
                <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Datos Generales
                </div>
            </button>
            <button
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                    activeTab === 'credentials' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('credentials')}
            >
                <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Credenciales (SMTP)
                </div>
            </button>
        </div>

        {/* Selected Employee Header (Common) */}
        {selectedEmployee && (
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                <button 
                    type="button" 
                    onClick={() => setSelectedEmployee(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                    title="Volver a la búsqueda"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h3 className="font-semibold text-lg text-gray-900">{selectedEmployee.nombre}</h3>
                    <p className="text-sm text-gray-500">
                        {selectedEmployee.cargo} • {selectedEmployee.area} • 
                        <span className="ml-1 font-mono bg-gray-100 px-1 rounded text-gray-700">{selectedEmployee.adminfo || 'N/A'}</span>
                    </p>
                </div>
            </div>
        )}

        {/* Tab Content */}
        {activeTab === 'general' ? (
            selectedEmployee ? renderGeneralForm() : renderSearchList()
        ) : (
            renderCredentialsForm()
        )}
    </div>
  );
};

export default TecnologiaForm;
