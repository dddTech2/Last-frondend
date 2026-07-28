import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import * as api from '../services/api'; // Importamos todas las funciones de api.js

/**
 * Hook personalizado para gestionar la lógica de la API de Personal.
 * Encapsula el estado, las llamadas a la API y el manejo de errores.
 */
const usePersonalAPI = () => {
  const [employees, setEmployees] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [pendingRetirements, setPendingRetirements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    size: 10,
    totalPages: 1,
  });

  const handleApiCall = useCallback(async (apiFunction, ...args) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFunction(...args);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Ocurrió un error inesperado.';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async (params) => {
    const response = await handleApiCall(api.getEmployees, params);
    if (response) {
      setEmployees(response.items);
      setPagination({
        total: response.total,
        page: response.page,
        size: response.size,
        totalPages: Math.ceil(response.total / response.size),
      });
    }
  }, [handleApiCall]);

  const fetchPendingApprovals = useCallback(async () => {
    const response = await handleApiCall(api.getEmployees, { estado: 'PENDIENTE_APROBACION_JURIDICO', size: 100 });
    if (response) {
      setPendingApprovals(response.items);
    }
  }, [handleApiCall]);

  const fetchPendingRetirements = useCallback(async () => {
    const response = await handleApiCall(api.getEmployees, { estado: 'PENDIENTE_RETIRO_JURIDICO', size: 100 });
    if (response) {
      setPendingRetirements(response.items);
    }
  }, [handleApiCall]);

  const createEmployee = useCallback(async (employeeData) => {
    const createdEmployee = await handleApiCall(api.createEmployee, employeeData);
    if (createdEmployee) {
      toast.success('Empleado creado exitosamente.');
      // Si no requiere aprobación, podría aparecer en la lista principal, pero
      // según el flujo, es mejor re-validar las listas desde la fuente.
      // Por ahora, solo mostramos éxito. El refresh se hará en el componente.
    }
    return createdEmployee;
  }, [handleApiCall]);

  const updateEmployee = useCallback(async (cedula, employeeData) => {
    const updatedEmployee = await handleApiCall(api.updateEmployee, cedula, employeeData);
    if (updatedEmployee) {
      toast.success('Empleado actualizado correctamente.');
      // Lógica para actualizar el estado local
      setEmployees(prev => prev.map(emp => (emp.cedula === cedula ? updatedEmployee : emp)));
    }
    return updatedEmployee;
  }, [handleApiCall]);

  const updateEmployeeFull = useCallback(async (cedula, employeeData) => {
    const updatedEmployee = await handleApiCall(api.updateEmployeeFull, cedula, employeeData);
    if (updatedEmployee) {
      toast.success('Edición completa realizada con éxito.');
      setEmployees(prev => prev.map(emp => (emp.cedula === cedula ? updatedEmployee : emp)));
    }
    return updatedEmployee;
  }, [handleApiCall]);

  const requestRetirement = useCallback(async (retirementData) => {
    await handleApiCall(api.requestRetirement, retirementData);
    toast.success('Solicitud de retiro enviada correctamente.');
  }, [handleApiCall]);

  const approveContract = useCallback(async (cedula) => {
    await handleApiCall(api.approveContract, cedula);
    toast.success('Contrato aprobado. El empleado ahora está activo.');
    // Se quita de pendientes y se podría añadir a la lista de activos
    setPendingApprovals(prev => prev.filter(emp => emp.cedula !== cedula));
  }, [handleApiCall]);

  const rejectContract = useCallback(async (cedula, motivo) => {
    await handleApiCall(api.rejectContract, cedula, motivo);
    toast.warn('Contrato rechazado.');
    setPendingApprovals(prev => prev.filter(emp => emp.cedula !== cedula));
  }, [handleApiCall]);

  const approveRetirement = useCallback(async (cedula, data = {}) => {
    await handleApiCall(api.approveRetirement, cedula, data);
    toast.success('Retiro aprobado. El empleado ha sido retirado.');
    setPendingRetirements(prev => prev.filter(emp => emp.cedula !== cedula));
  }, [handleApiCall]);

  const rejectRetirement = useCallback(async (cedula, motivo) => {
    await handleApiCall(api.rejectRetirement, cedula, motivo);
    toast.warn('Retiro rechazado.');
    setPendingRetirements(prev => prev.filter(emp => emp.cedula !== cedula));
  }, [handleApiCall]);

  const rehireEmployee = useCallback(async (cedula, employeeData) => {
    const rehireResult = await handleApiCall(api.rehireEmployee, cedula, employeeData);
    if (rehireResult) {
      toast.success('Reintegro procesado exitosamente.');
    }
    return rehireResult;
  }, [handleApiCall]);

  const getContractHistory = useCallback(async (cedula) => {
    return await handleApiCall(api.getContractHistory, cedula);
  }, [handleApiCall]);

  const getMovementHistory = useCallback(async (cedula) => {
    return await handleApiCall(api.getMovementHistory, cedula);
  }, [handleApiCall]);

  const getEmployeeDetails = useCallback(async (cedula) => {
    setIsDetailLoading(true);
    try {
      const details = await handleApiCall(api.getEmployeeByCedula, cedula);
      return details;
    } finally {
      setIsDetailLoading(false);
    }
  }, [handleApiCall]);


  return {
    employees,
    pendingApprovals,
    pendingRetirements,
    isLoading,
    isDetailLoading,
    error,
    pagination,
    fetchEmployees,
    fetchPendingApprovals,
    fetchPendingRetirements,
    createEmployee,
    updateEmployee,
    updateEmployeeFull,
    requestRetirement,
    approveContract,
    rejectContract,
    approveRetirement,
    rejectRetirement,
    rehireEmployee,
    getContractHistory,
    getMovementHistory,
    getEmployeeDetails,
  };
};

export default usePersonalAPI;