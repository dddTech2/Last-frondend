import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ModernModal from '../components/ModernModal';
import IngresoPersonalForm from '../components/IngresoPersonalForm';
import RetiroPersonalForm from '../components/RetiroPersonalForm';
import ProveedoresForm from '../components/ProveedoresForm';
import TecnologiaForm from '../components/TecnologiaForm';
import AprobacionRetiroJuricoModal from '../components/AprobacionRetiroJuricoModal';
import RechazoJuricoModal from '../components/RechazoJuricoModal';
import RetiroJuricoModal from '../components/RetiroJuricoModal';
import FormField from '../components/FormField';
import PersonalDetailView from '../components/PersonalDetailView';
import { UserPlus, UserMinus, Briefcase, Search, Filter, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, Download, FileText, Loader2, CheckCircle, XCircle, ShieldCheck, LogOut, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV, exportToXLSX } from '../utils/exportToCSV';
import usePersonalAPI from '../hooks/usePersonalAPI';
import * as api from '../services/api';

// --- Iconos para las tarjetas de opciones (usando lucide-react) ---
const UserPlusIcon = () => <UserPlus className="h-10 w-10 text-blue-600 mb-4" />;
const UserMinusIcon = () => <UserMinus className="h-10 w-10 text-red-600 mb-4" />;
const BriefcaseIcon = () => <Briefcase className="h-10 w-10 text-green-600 mb-4" />;

const AdministracionPersonal = () => {
  const [openModal, setOpenModal] = useState(null);
  
  // === HOOK DE API ===
  const {
    employees,
    isLoading,
    isDetailLoading,
    pagination,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    requestRetirement,
    pendingApprovals,
    fetchPendingApprovals,
    pendingRetirements,
    fetchPendingRetirements,
    approveContract,
    rejectContract,
    approveRetirement,
    rejectRetirement,
    getEmployeeDetails,
  } = usePersonalAPI();

  // === GESTIÓN DE PERSONAL ===
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCargo, setFilterCargo] = useState('todos');
  const [filterArea, setFilterArea] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos'); // Por defecto mostrar todos los estados
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [allEmployees, setAllEmployees] = useState([]); // Almacena TODOS los empleados
  const [loadingAllEmployees, setLoadingAllEmployees] = useState(false);
  
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [viewDetailModal, setViewDetailModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, cedula: null });
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Nuevos estados para los modales de retiro
  const [aprobacionRetiroModal, setAprobacionRetiroModal] = useState({ isOpen: false, empleado: null });
  const [rechazoRetiroModal, setRechazoRetiroModal] = useState({ isOpen: false, empleado: null });
  const [retiroJuridicoModal, setRetiroJuridicoModal] = useState({ isOpen: false, empleado: null });
  const [tecnologiaModal, setTecnologiaModal] = useState(false);

  const [isFormSubmitting, setIsFormSubmitting] = useState(false);


  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCargo, filterArea, filterEstado]);

  // Obtener TODOS los empleados una sola vez
  useEffect(() => {
    const loadAllEmployees = async () => {
      setLoadingAllEmployees(true);
      try {
        let allEmps = [];
        let page = 1;
        let hasMore = true;

        // Hacer llamadas paginadas hasta obtener todos
        while (hasMore) {
          const params = {
            page: page,
            size: 100, // Máximo permitido por el backend
          };

          // Aplicar filtros del backend
          if (filterCargo !== 'todos') params.cargo = filterCargo;
          if (filterArea !== 'todos') params.area = filterArea;
          if (filterEstado !== 'todos') params.estado = filterEstado;

          try {
            // Usar la función de api.js
            const data = await api.getEmployees(params);
            const items = data.items || data || [];
            
            if (Array.isArray(items) && items.length > 0) {
              allEmps = [...allEmps, ...items];
            }

            // Verificar si hay más páginas
            if (data.page && data.totalPages && data.page >= data.totalPages) {
              hasMore = false;
            } else if (!Array.isArray(items) || items.length < 100) {
              hasMore = false;
            }

            page++;
          } catch (pageError) {
            console.error(`Error en página ${page}:`, pageError);
            hasMore = false;
            if (allEmps.length === 0) {
              throw pageError;
            }
          }
        }

        setAllEmployees(allEmps);
      } catch (error) {
        console.error('Error loading all employees:', error);
        toast.error('Error al cargar empleados');
      } finally {
        setLoadingAllEmployees(false);
      }
    };

    loadAllEmployees();
  }, [filterCargo, filterArea, filterEstado]);

  // Cargar aprobaciones pendientes al montar el componente
  useEffect(() => {
    fetchPendingApprovals();
    fetchPendingRetirements();
  }, [fetchPendingApprovals, fetchPendingRetirements]);


  // === OPCIONES PARA FILTROS (Simulado, idealmente vendrían de la API) ===
  const cargosUnicos = ['todos', 'COORDINADOR', 'GESTOR', 'ABOGADO JUNIOR','ANALISTA TI', 'ANALISTA JUNIOR', 'ANALISTA SIG', 'ASISTENTE VENTAS','AUX SERVICIOS GENERALES','CIENTIFICO DATOS','DIRECTOR JURIDICO','DIRECTOR ADMINISTRATIVO Y FINANCIERA','DIRECTORA DE OPERACIONES','GERENTE GENERAL','LIDER DE PROCESOS','SUBDIRECTOR'];
  const areasUnicas = ['todos', 'COBRANZA', 'TI', 'SEGUROS', 'ADMINISTRATIVO', 'COLOCACION', 'GERENCIA', 'JURIDICA','RRHH'];
  const estadosUnicos = [
    { label: 'Todos', value: 'todos' },
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Retirado', value: 'RETIRADO' },
    { label: 'Pendiente Retiro', value: 'PENDIENTE_RETIRO_JURIDICO' },
    { label: 'Rechazo Retiro', value: 'RECHAZO_RETIRO_JURIDICO' },
  ];

  // === FILTRADO CLIENT-SIDE ===
  // Filtrar empleados localmente por nombre, cedula, correo o adminfo
  const filteredEmployees = useMemo(() => {
    if (!searchTerm || !allEmployees.length) return allEmployees;

    const term = searchTerm.toLowerCase().trim();
    return allEmployees.filter(emp => {
      // Buscar en: nombre, cedula, correo_renovar, correo_personal, adminfo
      const nombre = (emp.nombre || '').toLowerCase();
      const cedula = (emp.cedula || '').toLowerCase();
      const correoRenovar = (emp.correo_renovar || '').toLowerCase();
      const correoPersonal = (emp.correo_personal || '').toLowerCase();
      const adminfo = (emp.adminfo || '').toLowerCase();

      return (
        nombre.includes(term) ||
        cedula.includes(term) ||
        correoRenovar.includes(term) ||
        correoPersonal.includes(term) ||
        adminfo.includes(term)
      );
    });
  }, [searchTerm, allEmployees]);

  // Paginación manual sobre los resultados filtrados
  const totalFilteredEmployees = filteredEmployees.length;
  const totalPages = Math.ceil(totalFilteredEmployees / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  // Función para recargar todos los empleados
  const reloadAllEmployees = useCallback(async () => {
    setLoadingAllEmployees(true);
    try {
      let allEmps = [];
      let page = 1;
      let hasMore = true;

      // Hacer llamadas paginadas hasta obtener todos
      while (hasMore) {
        const params = {
          page: page,
          size: 100,
        };

        if (filterCargo !== 'todos') params.cargo = filterCargo;
        if (filterArea !== 'todos') params.area = filterArea;
        if (filterEstado !== 'todos') params.estado = filterEstado;

        try {
          const data = await api.getEmployees(params);
          const items = data.items || data || [];
          
          if (Array.isArray(items) && items.length > 0) {
            allEmps = [...allEmps, ...items];
          }

          if (data.page && data.totalPages && data.page >= data.totalPages) {
            hasMore = false;
          } else if (!Array.isArray(items) || items.length < 100) {
            hasMore = false;
          }

          page++;
        } catch (pageError) {
          console.error(`Error en página ${page}:`, pageError);
          hasMore = false;
          if (allEmps.length === 0) {
            throw pageError;
          }
        }
      }

      setAllEmployees(allEmps);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error reloading employees:', error);
      toast.error('Error al recargar empleados');
    } finally {
      setLoadingAllEmployees(false);
    }
  }, [filterCargo, filterArea, filterEstado]);

  // === HANDLERS ===
  const handleFormSubmit = useCallback(async (formKey, data) => {
    setIsFormSubmitting(true);
    try {
      if (formKey === 'Empleado') {
        await createEmployee(data);
      } else if (formKey === 'Retiro') {
        await requestRetirement(data);
      }
      // TODO: Manejar 'Proveedor'
      
      setOpenModal(null);
      // Refrescar la lista
      reloadAllEmployees();
    } catch (error) {
      // El hook ya muestra el toast de error
    } finally {
      setIsFormSubmitting(false);
    }
  }, [createEmployee, requestRetirement, reloadAllEmployees]);

  const handleViewDetail = async (personal) => {
    setSelectedPersonal(personal); // Muestra datos básicos inmediatamente
    setViewDetailModal(true);
    const details = await getEmployeeDetails(personal.cedula);
    if (details) {
      setSelectedPersonal(details); // Actualiza con todos los detalles
    }
  };

  const handleEdit = (personal) => {
    setSelectedPersonal(personal);
    setEditFormData(personal);
    setEditModal(true);
  };

  const handleDeleteClick = (personal) => {
    setSelectedPersonal(personal);
    setOpenModal('retiro'); // Abre el modal de retiro
  };

  const handleSaveEdit = async () => {
    if (!editFormData || !selectedPersonal) return;

    const payload = {
      correo_renovar: editFormData.correo_renovar,
      extension_3cx: editFormData.extension_3cx,
      cola: editFormData.cola,
      adminfo: editFormData.adminfo,
      asignacion: editFormData.asignacion,
      jefe_inmediato: editFormData.jefe_inmediato,
    };

    try {
      await updateEmployee(selectedPersonal.cedula, payload);
      setEditModal(false);
      refreshData();
    } catch (error) {
      // El hook ya se encarga de mostrar el toast de error
    }
  };

  const handleApprove = async (cedula) => {
    try {
      await approveContract(cedula);
      refreshData();
    } catch (error) {
      // El hook maneja el error
    }
  };

  const handleOpenRejectionModal = (cedula) => {
    setRejectionModal({ isOpen: true, cedula });
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.error('Debes proporcionar un motivo de rechazo.');
      return;
    }
    try {
      await rejectContract(rejectionModal.cedula, rejectionReason);
      setRejectionModal({ isOpen: false, cedula: null });
      setRejectionReason('');
      refreshData();
    } catch (error) {
      // El hook maneja el error
    }
  };

  // --- Handlers para Retiros Jurídicos ---

  const handleOpenApproveRetirement = (empleado) => {
    setAprobacionRetiroModal({ isOpen: true, empleado });
  };

  const handleSubmitApproveRetirement = async (data) => {
    setIsFormSubmitting(true);
    try {
      await approveRetirement(data.cedula_empleado);
      setAprobacionRetiroModal({ isOpen: false, empleado: null });
      reloadAllEmployees(); // Refrescar lista principal
    } catch (error) {
      console.error(error);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleOpenRejectRetirement = (empleado) => {
    setRechazoRetiroModal({ isOpen: true, empleado });
  };

  const handleSubmitRejectRetirement = async (data) => {
    setIsFormSubmitting(true);
    try {
      await rejectRetirement(data.cedula_empleado, data.motivo_rechazo);
      setRechazoRetiroModal({ isOpen: false, empleado: null });
      reloadAllEmployees();
    } catch (error) {
      console.error(error);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Este handler sería para el "Retiro Jurídico" directo (el otro módulo)
  // Podríamos poner un botón en la lista principal o en la tarjeta de acciones
  const handleOpenRetiroJuridico = (empleado) => {
    setRetiroJuridicoModal({ isOpen: true, empleado });
  };

  const handleSubmitRetiroJuridico = async (data) => {
    setIsFormSubmitting(true);
    try {
      // Usamos approveRetirement o una función específica si existiera 'processRetirement'
      // Como RetiroJuricoModal envía 'accion: PROCESAR_RETIRO_JURIDICO', asumimos que es un retiro aprobado
      await approveRetirement(data.cedula_empleado); 
      setRetiroJuridicoModal({ isOpen: false, empleado: null });
      reloadAllEmployees();
    } catch (error) {
      console.error(error);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleUpdateTechnology = async (data) => {
    setIsFormSubmitting(true);
    try {
      await updateEmployee(data.cedula, data);
      setTecnologiaModal(false);
      toast.success('Información tecnológica actualizada correctamente');
      reloadAllEmployees();
    } catch (error) {
      console.error(error);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Resetear paginación cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCargo, filterArea, filterEstado]);

  const formConfigs = useMemo(() => ({
    ingreso: {
      title: 'Ingreso de Personal',
      icon: <UserPlusIcon />,
      component: (
        <IngresoPersonalForm
          onSubmit={(data) => handleFormSubmit('Empleado', data)}
          onCancel={() => setOpenModal(null)}
          isSubmitting={isFormSubmitting}
        />
      ),
    },
    retiro: {
      title: 'Retiro de Personal',
      icon: <UserMinusIcon />,
      component: (
        <RetiroPersonalForm
          empleado={selectedPersonal}
          onSubmit={(data) => handleFormSubmit('Retiro', data)}
          onCancel={() => setOpenModal(null)}
          isSubmitting={isFormSubmitting}
        />
      ),
    },
    proveedores: {
      title: 'Creación de Usuarios para Proveedores',
      icon: <BriefcaseIcon />,
      component: (
        <ProveedoresForm
          onSubmit={(data) => handleFormSubmit('Proveedor', data)}
          onCancel={() => setOpenModal(null)}
          isSubmitting={isFormSubmitting}
        />
      ),
    },
  }), [isLoading, selectedPersonal, handleFormSubmit]);

  // --- FUNCIONES DE EXPORTACIÓN ---
  const handleExportCSV = useCallback(() => {
    if (employees.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const columns = [
      { key: 'nombre', label: 'Nombre' },
      { key: 'correo_renovar', label: 'Email' },
      { key: 'celular', label: 'Teléfono' },
      { key: 'cedula', label: 'Cédula' },
      { key: 'cargo', label: 'Cargo' },
      { key: 'area', label: 'Área' },
      { key: 'fecha_ingreso', label: 'Fecha Ingreso' },
      { key: 'estado', label: 'Estado' },
    ];

    const timestamp = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
    const filename = `personal_${timestamp}.csv`;

    exportToCSV(employees, filename, columns);
    toast.success(`✅ Exportado ${employees.length} registros a CSV`);
  }, [employees]);

  const handleExportExcel = useCallback(async () => {
    if (employees.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const columns = [
      { key: 'nombre', label: 'Nombre' },
      { key: 'correo_renovar', label: 'Email' },
      { key: 'celular', label: 'Teléfono' },
      { key: 'cedula', label: 'Cédula' },
      { key: 'cargo', label: 'Cargo' },
      { key: 'area', label: 'Área' },
      { key: 'fecha_ingreso', label: 'Fecha Ingreso' },
      { key: 'estado', label: 'Estado' },
    ];

    const timestamp = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
    const filename = `personal_${timestamp}.xlsx`;

    try {
      const success = await exportToXLSX(employees, filename, 'Personal', columns);
      if (success) {
        toast.success(`✅ Exportado ${employees.length} registros a Excel`);
      } else {
        toast.error('❌ No se pudo exportar a Excel. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('❌ Error durante la exportación. Intenta de nuevo.');
    }
  }, [employees]);

  return (
    <>
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* SECCIÓN 1: ACCIONES RÁPIDAS */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Módulo de Administración de Personal
            </h1>
            <p className="text-gray-600 mb-8">
              Gestiona el personal, ingreso, retiro y proveedores desde una sola plataforma.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Tarjeta 1: Ingreso de Personal */}
              <button
                onClick={() => setOpenModal('ingreso')}
                className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out text-center flex flex-col items-center"
              >
                <UserPlusIcon />
                <h2 className="text-xl font-semibold text-gray-800">Ingreso de Personal</h2>
                <p className="text-gray-500 mt-2">Gestionar el alta de nuevos empleados.</p>
              </button>

              {/* Tarjeta 2: Retiro de Personal */}
              <button
                onClick={() => setOpenModal('retiro')}
                className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out text-center flex flex-col items-center"
              >
                <UserMinusIcon />
                <h2 className="text-xl font-semibold text-gray-800">Solicitud de Retiro</h2>
                <p className="text-gray-500 mt-2">Solicitar la baja de un empleado.</p>
              </button>

              {/* Tarjeta 3: Retiro Jurídico (Directo) */}
              <button
                onClick={() => setRetiroJuridicoModal({ isOpen: true, empleado: null })}
                className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out text-center flex flex-col items-center"
              >
                <LogOut className="h-10 w-10 text-orange-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-800">Retiro Jurídico</h2>
                <p className="text-gray-500 mt-2">Procesar retiro directamente.</p>
              </button>

              {/* Tarjeta 4: Actualización Tecnológica */}
              <button
                onClick={() => setTecnologiaModal(true)}
                className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out text-center flex flex-col items-center"
              >
                <Monitor className="h-10 w-10 text-purple-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-800">Actualización Tecnológica</h2>
                <p className="text-gray-500 mt-2">Actualizar correos, extensiones y usuarios.</p>
              </button>

              {/* Tarjeta 5: Creación de Usuarios para Proveedores */}
              <div className="bg-gray-100 p-8 rounded-lg shadow-inner text-center flex flex-col items-center cursor-not-allowed">
                <BriefcaseIcon />
                <h2 className="text-xl font-semibold text-gray-500">Usuarios para Proveedores</h2>
                <p className="text-gray-400 mt-2">Esta función estará disponible próximamente.</p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: BANDEJA DE APROBACIONES */}
          {/* Las bandejas de aprobación se han movido a LegalCommunicationsApprovalPage.jsx */}
          
          {/* SECCIÓN 3: GESTIÓN DE PERSONAL */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Eye className="h-6 w-6 text-green-600" />
                Gestión de Personal
              </h2>
              <p className="text-gray-600 text-sm mt-1">Busca, filtra y gestiona empleados</p>
            </div>

            {/* Búsqueda y Filtros */}
            <div className="p-6 border-b border-gray-200 bg-gray-50 space-y-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email, teléfono o cédula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Cargo
                  </label>
                  <select
                    value={filterCargo}
                    onChange={(e) => setFilterCargo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {cargosUnicos.map(cargo => (
                      <option key={cargo} value={cargo}>
                        {cargo === 'todos' ? 'Todos los cargos' : cargo.charAt(0).toUpperCase() + cargo.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Área
                  </label>
                  <select
                    value={filterArea}
                    onChange={(e) => setFilterArea(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {areasUnicas.map(area => (
                      <option key={area} value={area}>
                        {area === 'todos' ? 'Todas las áreas' : area}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Estado
                  </label>
                  <select
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {estadosUnicos.map(estado => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botones de Exportación */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors border border-blue-200"
                  title="Descargar en formato CSV"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar CSV</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors border border-green-200"
                  title="Descargar en formato Excel"
                >
                  <FileText className="h-4 w-4" />
                  <span>Exportar Excel</span>
                </button>
              </div>

              {/* Info de resultados */}
              <div className="text-sm text-gray-600">
                Mostrando <span className="font-semibold text-gray-800">{paginatedEmployees.length}</span> de <span className="font-semibold text-gray-800">{totalFilteredEmployees}</span> registros
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cargo</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Área</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fecha Ingreso</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loadingAllEmployees ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex justify-center items-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                          <span className="text-lg">Cargando personal...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedEmployees.length > 0 ? (
                    paginatedEmployees.map((personal) => (
                      <tr key={personal.cedula} className="hover:bg-green-50 transition-colors duration-150">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{personal.nombre}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{personal.correo_renovar || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 capitalize">
                            {personal.cargo}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{personal.area}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {personal.fecha_ingreso ? new Date(personal.fecha_ingreso).toLocaleDateString('es-CO') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewDetail(personal)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(personal)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(personal)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Solicitar Retiro"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        {searchTerm ? (
                          <>
                            <p className="text-lg font-semibold">No se encontraron resultados para "{searchTerm}"</p>
                            <p className="text-sm mt-1">Intenta con otro término de búsqueda (nombre, cédula, correo o adminfo).</p>
                          </>
                        ) : allEmployees.length === 0 ? (
                          <>
                            <p className="text-lg font-semibold">No se encontraron empleados</p>
                            <p className="text-sm mt-1">Intenta ajustar los filtros o crea un nuevo empleado.</p>
                          </>
                        ) : (
                          <>
                            <p className="text-lg font-semibold">Sin resultados</p>
                            <p className="text-sm mt-1">No hay empleados disponibles con los filtros seleccionados.</p>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalFilteredEmployees > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Página <span className="font-semibold">{currentPage}</span> de <span className="font-semibold">{totalPages}</span>
                  {searchTerm && <span className="ml-2">({totalFilteredEmployees} resultados encontrados)</span>}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1); // Vuelve a la página 1 al cambiar el tamaño
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value={10}>10 por página</option>
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                  </select>

                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    className="p-2 text-gray-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-2 text-gray-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Ver Detalles */}
      {selectedPersonal && (
        <ModernModal
          isOpen={viewDetailModal}
          onClose={() => setViewDetailModal(false)}
          title={`Detalles - ${selectedPersonal.nombre}`}
          size="xl"
        >
          <PersonalDetailView personal={selectedPersonal} isLoading={isDetailLoading} />
        </ModernModal>
      )}

      {/* MODAL: Editar Personal */}
      {editFormData && (
        <ModernModal
          isOpen={editModal}
          onClose={() => setEditModal(false)}
          title={`Editar - ${editFormData.nombre}`}
          size="md"
          actions={
            <div className="flex gap-3">
              <button
                onClick={() => setEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Correo Renovar"
                type="email"
                value={editFormData.correo_renovar || ''}
                onChange={(v) => setEditFormData({ ...editFormData, correo_renovar: v })}
              />
              <FormField
                label="Jefe Inmediato"
                value={editFormData.jefe_inmediato || ''}
                onChange={(v) => setEditFormData({ ...editFormData, jefe_inmediato: v })}
              />
              <FormField
                label="Extensión 3CX"
                value={editFormData.extension_3cx || ''}
                onChange={(v) => setEditFormData({ ...editFormData, extension_3cx: v })}
              />
              <FormField
                label="Cola"
                value={editFormData.cola || ''}
                onChange={(v) => setEditFormData({ ...editFormData, cola: v })}
              />
              <FormField
                label="Código Adminfo"
                value={editFormData.adminfo || ''}
                onChange={(v) => setEditFormData({ ...editFormData, adminfo: v })}
              />
              <FormField
                label="Asignación"
                value={editFormData.asignacion || ''}
                onChange={(v) => setEditFormData({ ...editFormData, asignacion: v })}
              />
            </div>
          </div>
        </ModernModal>
      )}

      {/* El modal de confirmación de eliminación ya no es necesario */}

      {/* MODAL: Formularios (Ingreso, Retiro, Proveedores) */}
      {openModal && formConfigs[openModal] && (
        <ModernModal
          isOpen={true}
          onClose={() => setOpenModal(null)}
          title={formConfigs[openModal].title}
          icon={formConfigs[openModal].icon}
          size="lg"
        >
          {formConfigs[openModal].component}
        </ModernModal>
      )}

      {/* MODAL: Motivo de Rechazo */}
      <ModernModal
        isOpen={rejectionModal.isOpen}
        onClose={() => setRejectionModal({ isOpen: false, cedula: null })}
        title="Motivo de Rechazo"
        size="md"
        actions={
          <div className="flex gap-3">
            <button
              onClick={() => setRejectionModal({ isOpen: false, cedula: null })}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleReject}
              disabled={isLoading}
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium"
            >
              {isLoading ? 'Rechazando...' : 'Confirmar Rechazo'}
            </button>
          </div>
        }
      >
        <FormField
          label="Por favor, especifica el motivo del rechazo"
          type="textarea"
          value={rejectionReason}
          onChange={setRejectionReason}
          required
        />
      </ModernModal>

      {/* MODAL: Aprobación de Retiro */}
      {aprobacionRetiroModal.isOpen && (
        <AprobacionRetiroJuricoModal
          isOpen={aprobacionRetiroModal.isOpen}
          onClose={() => setAprobacionRetiroModal({ isOpen: false, empleado: null })}
          onSubmit={handleSubmitApproveRetirement}
          empleado={aprobacionRetiroModal.empleado}
          isSubmitting={isFormSubmitting}
        />
      )}

      {/* MODAL: Rechazo de Retiro */}
      {rechazoRetiroModal.isOpen && (
        <RechazoJuricoModal
          isOpen={rechazoRetiroModal.isOpen}
          onClose={() => setRechazoRetiroModal({ isOpen: false, empleado: null })}
          onSubmit={handleSubmitRejectRetirement}
          empleado={rechazoRetiroModal.empleado}
          isSubmitting={isFormSubmitting}
        />
      )}

      {/* MODAL: Retiro Jurídico */}
      {retiroJuridicoModal.isOpen && (
        <RetiroJuricoModal
          isOpen={retiroJuridicoModal.isOpen}
          onClose={() => setRetiroJuridicoModal({ isOpen: false, empleado: null })}
          onSubmit={handleSubmitRetiroJuridico}
          empleado={retiroJuridicoModal.empleado}
          isSubmitting={isFormSubmitting}
        />
      )}

      {/* MODAL: Actualización Tecnológica */}
      {tecnologiaModal && (
        <ModernModal
          isOpen={true}
          onClose={() => setTecnologiaModal(false)}
          title="Actualización Tecnológica"
          icon={<Monitor className="h-6 w-6 text-purple-600" />}
          size="lg"
        >
          <TecnologiaForm
            employees={allEmployees}
            onSubmit={handleUpdateTechnology}
            onCancel={() => setTecnologiaModal(false)}
            isSubmitting={isFormSubmitting}
          />
        </ModernModal>
      )}
    </>
  );
};

export default AdministracionPersonal;