import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { validateForm, validators } from '../utils/InputValidator';
import * as api from '../services/api';

/**
 * Hook personalizado para gestionar el formulario de ingreso de personal
 * Maneja validación, estado del formulario y limpieza de datos
 */
const useIngresoForm = (initialState = {}) => {
  const defaultState = {
    // Step 1 - Datos Personales
    cedula: '',
    nombre: '',
    celular: '',
    correo_personal: '',
    
    // Step 2 - Datos Laborales
    cargo: '',
    area: '',
    fecha_ingreso: '',
    contrato: '',
    jefe_inmediato: '',
    extension_3cx: '',
    cola: '',
    adminfo: '',
    asignacion: '',
    
    // Step 3 - Credenciales Renovar
    correo_renovar: '',
    password_renovar: '',
    password_renovar_confirm: '',
    
    // Datos adicionales personales (nuevos)
    // estado: Se determina automáticamente según tipo de contrato
    estado: '',
    ciudad: '',
    localidad: '', // Nueva: localidad de Bogotá
    fecha_nacimiento: '',
    genero: '',
    lugar: '',
    direccion_residencia: '',
    eps: '',
    fondo_pensiones: '',
    arl: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    cantidad_hijos: '',
  };

  const [formData, setFormData] = useState({ ...defaultState, ...initialState });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [cedulaValidating, setCedulaValidating] = useState(false);

  /**
   * Determinar el estado del empleado según el tipo de contrato
   * PLANTA -> PENDIENTE_APROBACION_JURIDICO
   * CORRETAJE, TEMPORAL, CASA DE COBRO -> EN_PROCESO_DE_CONTRATACION
   */
  const determineEstadoByTipoContrato = useCallback((tipoContrato) => {
    const estadoMap = {
      'PLANTA': 'PENDIENTE_APROBACION_JURIDICO',
      'CORRETAJE': 'EN_PROCESO_DE_CONTRATACION',
      'TEMPORAL': 'EN_PROCESO_DE_CONTRATACION',
      'CASA DE COBRO': 'EN_PROCESO_DE_CONTRATACION',
    };
    return estadoMap[tipoContrato] || 'EN_PROCESO_DE_CONTRATACION';
  }, []);

  /**
   * Efecto: Actualizar estado automáticamente cuando cambia el tipo de contrato
   */
  useEffect(() => {
    if (formData.contrato) {
      const nuevoEstado = determineEstadoByTipoContrato(formData.contrato);
      setFormData(prev => ({
        ...prev,
        estado: nuevoEstado,
      }));
      console.log(`✅ Estado actualizado automáticamente: ${formData.contrato} -> ${nuevoEstado}`);
    }
  }, [formData.contrato, determineEstadoByTipoContrato]);

  /**
   * Reglas de validación del formulario
   * NOTA: 'localidad' NO está aquí - se valida condicionalmente en validateAll()
   * NOTA: 'password_renovar_confirm' se valida especialmente en validateField()
   */
  const validationRules = {
    cedula: validators.cedula,
    nombre: validators.nombre,
    celular: validators.celular,
    correo_personal: (value) => validators.email(value, 'correo personal'),
    cargo: (value) => validators.required(value, 'Cargo'),
    area: (value) => validators.required(value, 'Área'),
    fecha_ingreso: validators.date,
    contrato: (value) => validators.required(value, 'Tipo de Contrato'),
    jefe_inmediato: validators.jefeInmediato,
    correo_renovar: (value) => validators.email(value, 'correo Renovar'),
    password_renovar: validators.password,
    password_renovar_confirm: () => null, // Se valida con lógica especial en validateField
    fecha_nacimiento: validators.fechaNacimiento,
    contacto_emergencia_nombre: validators.nombreContactoEmergencia,
    contacto_emergencia_telefono: validators.telefonoEmergencia,
    genero: (value) => !value || value === '' ? 'Este campo es requerido' : null,
    ciudad: (value) => !value || value === '' ? 'Este campo es requerido' : null,
    lugar: (value) => !value || value === '' ? 'Este campo es requerido' : null,
    direccion_residencia: (value) => {
      if (!value || value.toString().trim() === '') {
        return 'Este campo es requerido';
      }
      if (value.trim().length < 5) {
        return 'La dirección debe tener al menos 5 caracteres';
      }
      return null;
    },
    eps: (value) => !value || value === '' ? 'Este campo es requerido' : null,
    fondo_pensiones: (value) => !value || value === '' ? 'Este campo es requerido' : null,
    arl: (value) => !value || value === '' ? 'Este campo es requerido' : null,
    cantidad_hijos: (value) => {
      // Aceptar 0 como valor válido
      if (value === '' || value === null || value === undefined) {
        return 'Este campo es requerido';
      }
      return null;
    },
  };

  /**
   * Validar cédula contra la API para evitar duplicados
   */
  const validateCedulaAgainstAPI = useCallback(async (cedula) => {
    if (!cedula || !/^\d{8,12}$/.test(cedula.replace(/\D/g, ''))) {
      return null;
    }

    setCedulaValidating(true);
    try {
      // getEmployeeByCedula retorna null si no existe (404)
      const employee = await api.getEmployeeByCedula(cedula);
      
      if (employee) {
        // La cédula ya existe en el sistema - Mostrar toast y retornar error para bloquear
        let mensaje = '';
        if (employee.estado === 'ACTIVO') {
          mensaje = 'Esta cédula ya está registrada como empleado activo.';
        } else if (employee.estado === 'PENDIENTE_APROBACION_JURIDICO') {
          mensaje = 'Esta cédula está pendiente de aprobación jurídica.';
        } else if (employee.estado === 'RETIRADO') {
          mensaje = 'Esta cédula corresponde a un empleado retirado.';
        } else {
          mensaje = `Esta cédula ya existe en el sistema (Estado: ${employee.estado}).`;
        }
        
        // Mostrar toast de error Y retornar mensaje para bloquear el formulario
        toast.error(mensaje);
        return mensaje;
      }
      // Si retorna null, la cédula no existe (es un usuario nuevo) - permitir continuar
      return null;
    } catch (error) {
      // Para otros errores inesperados, no bloquear pero loguear
      console.warn('Error validando cédula:', error);
      return null;
    } finally {
      setCedulaValidating(false);
    }
  }, []);

  /**
   * Validar un campo individual
   */
  const validateField = useCallback((fieldName, value) => {
    // Manejo especial para password_renovar_confirm
    if (fieldName === 'password_renovar_confirm') {
      // Solo validar si ambas contraseñas están llenas
      if (!formData.password_renovar || !value) {
        return 'Este campo es requerido';
      }
      return validators.passwordMatch(formData.password_renovar, value);
    }

    // Manejo especial para jefe_inmediato
    if (fieldName === 'jefe_inmediato') {
      const error = validators.jefeInmediato(value, formData.cargo);
      return error;
    }

    // Si no hay regla de validación, no hay error
    if (!validationRules[fieldName]) {
      return null;
    }

    // Ejecutar la regla de validación
    if (typeof validationRules[fieldName] === 'function') {
      return validationRules[fieldName](value);
    }

    return null;
  }, [formData.password_renovar, formData.cargo]);

  /**
   * Manejar cambios en los campos
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validar si el campo ya ha sido tocado
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  }, [touched, validateField]);

  /**
   * Manejar blur (campo pierde foco)
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, formData[name]);
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  }, [validateField, formData]);

  /**
   * Validar cédula específicamente (con validación API)
   */
  const validateCedula = useCallback(async () => {
    const basicError = validateField('cedula', formData.cedula);
    
    if (basicError) {
      setErrors(prev => ({ ...prev, cedula: basicError }));
      return false;
    }

    const apiError = await validateCedulaAgainstAPI(formData.cedula);
    if (apiError) {
      setErrors(prev => ({ ...prev, cedula: apiError }));
      return false;
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.cedula;
      return newErrors;
    });

    return true;
  }, [formData.cedula, validateField, validateCedulaAgainstAPI]);

  /**
   * Validar todos los campos
   * NOTA: 'localidad' es SOLO para UI cuando ciudad='BOGOTA', NO se envía al backend
   */
  const validateAll = useCallback(() => {
    const newErrors = {};

    // 1. Validar todos los campos con reglas definidas en validationRules
    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    // 2. Validación condicional de 'localidad' - SOLO si ciudad es BOGOTA
    if (formData.ciudad === 'BOGOTA') {
      if (!formData.localidad || formData.localidad.toString().trim() === '') {
        newErrors.localidad = 'Este campo es requerido';
      }
    }
    // Si NO es Bogotá, asegurar que NO hay error en localidad
    else {
      delete newErrors.localidad;
    }

    // 3. Validar coincidencia de contraseñas especialmente
    if (formData.password_renovar && formData.password_renovar_confirm) {
      const passwordMatchError = validators.passwordMatch(formData.password_renovar, formData.password_renovar_confirm);
      if (passwordMatchError) {
        newErrors.password_renovar_confirm = passwordMatchError;
      }
    } else if (formData.password_renovar || formData.password_renovar_confirm) {
      // Si uno está lleno pero el otro no
      if (!formData.password_renovar_confirm) {
        newErrors.password_renovar_confirm = 'Debe confirmar la contraseña';
      }
    }

    // 4. Marcar todos los campos como tocados
    const allFieldNames = [
      'cedula', 'nombre', 'celular', 'correo_personal',
      'cargo', 'area', 'fecha_ingreso', 'contrato', 'jefe_inmediato',
      'ciudad',
      'fecha_nacimiento', 'genero', 'lugar', 'direccion_residencia',
      'eps', 'fondo_pensiones', 'arl', 'cantidad_hijos',
      'contacto_emergencia_nombre', 'contacto_emergencia_telefono',
      'correo_renovar', 'password_renovar', 'password_renovar_confirm',
    ];
    
    // Agregar localidad a los campos tocados SOLO si es Bogotá
    if (formData.ciudad === 'BOGOTA') {
      allFieldNames.push('localidad');
    }

    const newTouched = allFieldNames.reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});

    setErrors(newErrors);
    setTouched(newTouched);

    // Retornar true si NO hay errores
    const hasErrors = Object.keys(newErrors).length > 0;
    if (hasErrors) {
      console.error('📌 Campos con error:', Object.keys(newErrors));
    }
    return !hasErrors;
  }, [formData, validateField]);

  /**
   * Obtener datos limpios para enviar a la API
   * IMPORTANTE: El backend NO soporta 'localidad', solo 'ciudad'
   */
  const getCleanData = useCallback(() => {
    const { password_renovar_confirm, localidad, extension_3cx, cola, asignacion, ...cleanData } = formData;
    
    // Mapear campos que tienen nombres diferentes en el backend
    // El backend espera 'nombre_completo' no 'nombre'
    const payloadData = {
      ...cleanData,
      nombre_completo: cleanData.nombre,
      tipo_contrato: cleanData.contrato,
    };
    
    // Remover campos que no existen en el backend
    delete payloadData.nombre;
    delete payloadData.contrato;
    
    return payloadData;
  }, [formData]);

  /**
   * Resetear el formulario
   */
  const reset = useCallback(() => {
    setFormData({ ...defaultState });
    setErrors({});
    setTouched({});
  }, []);

  /**
   * Setear valores del formulario
   */
  const setValues = useCallback((newValues) => {
    setFormData(prev => ({ ...prev, ...newValues }));
  }, []);

  /**
   * Obtener error de un campo (solo si ha sido tocado)
   */
  const getFieldError = useCallback((fieldName) => {
    return touched[fieldName] ? errors[fieldName] : null;
  }, [touched, errors]);

  /**
   * Verificar si el formulario tiene errores
   */
  const hasErrors = Object.keys(errors).length > 0;

  /**
   * Verificar si un campo específico tiene error
   */
  const hasFieldError = useCallback((fieldName) => {
    return touched[fieldName] && !!errors[fieldName];
  }, [touched, errors]);

  return {
    formData,
    errors,
    touched,
    cedulaValidating,
    handleChange,
    handleBlur,
    validateField,
    validateCedula,
    validateAll,
    getCleanData,
    reset,
    setValues,
    getFieldError,
    hasErrors,
    hasFieldError,
    setFormData,
    setErrors,
    setTouched,
  };
};

export default useIngresoForm;
