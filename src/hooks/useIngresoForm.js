import { useState, useCallback, useEffect, useMemo } from 'react';
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
    nombre_temporal: '', // Nuevo campo para empresas temporales

    // Información Contractual (PLANTA/CORRETAJE)
    asignacion_salarial: '',
    tipo_contrato_laboral: '',
    fecha_terminacion_contrato: '',
    observaciones_contrato: '',

    // Step 3 - Credenciales Renovar (Gestionado en Tecnología)
    // correo_renovar: '',
    // password_renovar: '',
    // password_renovar_confirm: '',

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
      'CORRETAJE': 'PENDIENTE_APROBACION_JURIDICO',
      'TEMPORAL': 'EN_PROCESO_DE_CONTRATACION',
      'CASA DE COBRO': 'PENDIENTE_APROBACION_JURIDICO',
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
   * Efecto: Limpiar campos contractuales si el contrato NO es PLANTA o CORRETAJE
   */
  useEffect(() => {
    if (formData.contrato !== 'PLANTA' && formData.contrato !== 'CORRETAJE') {
      setFormData(prev => ({
        ...prev,
        asignacion_salarial: '',
        tipo_contrato_laboral: '',
        fecha_terminacion_contrato: '',
        observaciones_contrato: '',
      }));
    }
    // Limpiar nombre temporal si no es temporal
    if (formData.contrato !== 'TEMPORAL') {
      setFormData(prev => ({ ...prev, nombre_temporal: '' }));
    }
  }, [formData.contrato]);

  /**
   * Efecto: Limpiar fecha terminación si tipo de contrato laboral NO es FIJO
   */
  useEffect(() => {
    if (formData.tipo_contrato_laboral !== 'FIJO') {
      setFormData(prev => ({
        ...prev,
        fecha_terminacion_contrato: '',
      }));
    }
  }, [formData.tipo_contrato_laboral]);

  /**
   * Reglas de validación del formulario
   * NOTA: 'localidad' NO está aquí - se valida condicionalmente en validateAll()
   * NOTA: 'password_renovar_confirm' se valida especialmente en validateField()
   */
  const validationRules = useMemo(() => ({
    cedula: validators.cedula,
    nombre: validators.nombre,
    celular: validators.celular,
    correo_personal: (value) => validators.email(value, 'correo personal'),
    cargo: (value) => validators.required(value, 'Cargo'),
    area: (value) => validators.required(value, 'Área'),
    fecha_ingreso: validators.dateAllowFuture,
    contrato: (value) => validators.required(value, 'Tipo de Contrato'),
    nombre_temporal: (value) => {
      if (formData.contrato === 'TEMPORAL' && (!value || value.toString().trim() === '')) {
        return 'El nombre de la temporal es requerido';
      }
      return null;
    },
    jefe_inmediato: validators.jefeInmediato,
    asignacion_salarial: (value) => {
      // Solo requerido para PLANTA
      if (formData.contrato === 'PLANTA' && (!value || value.toString().trim() === '')) {
        return 'La asignación salarial es requerida';
      }
      return null;
    },
    tipo_contrato_laboral: (value) => {
      // Solo requerido para PLANTA
      if (formData.contrato === 'PLANTA' && (!value || value === '')) {
        return 'El tipo de contrato laboral es requerido';
      }
      return null;
    },
    fecha_terminacion_contrato: (value) => {
      // Solo requerido para PLANTA y contrato FIJO
      if (formData.contrato === 'PLANTA') {
        if (formData.tipo_contrato_laboral === 'FIJO' && (!value || value === '')) {
          return 'La fecha de terminación es requerida para contratos fijos';
        }
      }
      return null;
    },
    observaciones_contrato: () => null, // Opcional
    // correo_renovar: (value) => validators.email(value, 'correo Renovar'),
    // password_renovar: validators.password,
    // password_renovar_confirm: () => null, // Se valida con lógica especial en validateField
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
  }), [formData.contrato, formData.tipo_contrato_laboral, formData.cargo]);

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
  }, [formData.cargo, formData.contrato, formData.tipo_contrato_laboral, validationRules]);

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

    // 4. Marcar todos los campos como tocados
    const allFieldNames = [
      'cedula', 'nombre', 'celular', 'correo_personal',
      'cargo', 'area', 'fecha_ingreso', 'contrato', 'jefe_inmediato',
      'ciudad',
      'fecha_nacimiento', 'genero', 'lugar', 'direccion_residencia',
      'eps', 'fondo_pensiones', 'arl', 'cantidad_hijos',
      'contacto_emergencia_nombre', 'contacto_emergencia_telefono',
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
  }, [formData, validateField, validationRules]);

  /**
   * Obtener datos limpios para enviar a la API
   * IMPORTANTE: El backend NO soporta 'localidad', solo 'ciudad'
   */
  const getCleanData = useCallback(() => {
    const { localidad, ...cleanData } = formData;

    // Mapear campos que tienen nombres diferentes en el backend
    // El backend espera 'nombre_completo' no 'nombre'
    const payloadData = {
      ...cleanData,
      nombre_completo: cleanData.nombre,
      tipo_contrato: cleanData.contrato,
      temporal: cleanData.nombre_temporal, // Mapear nombre_temporal a temporal
      localidad: formData.ciudad === 'BOGOTA' ? localidad : null,
    };

    // Remover campos que no existen en el backend
    delete payloadData.nombre;
    delete payloadData.contrato;
    delete payloadData.nombre_temporal;

    // Convertir asignacion_salarial a número (remover puntos) si existe
    if (payloadData.asignacion_salarial) {
      // Si el usuario ingresó "1.500.000", convertimos a 1500000 (int)
      const numericSalario = payloadData.asignacion_salarial.toString().replace(/\./g, '');
      payloadData.asignacion_salarial = parseInt(numericSalario, 10);
    }

    // Limpiar campos contractuales: SOLO SE ENVÍAN PARA PLANTA
    if (formData.contrato === 'PLANTA') {
      // Planta lleva todo, pero fecha terminacion solo si es FIJO
      if (payloadData.tipo_contrato_laboral !== 'FIJO') {
        delete payloadData.fecha_terminacion_contrato;
      }
    } else {
      // Si no es PLANTA (CORRETAJE, PRESTACION, etc.), borrar todo dato contractual
      delete payloadData.asignacion_salarial;
      delete payloadData.tipo_contrato_laboral;
      delete payloadData.fecha_terminacion_contrato;
      delete payloadData.observaciones_contrato;
    }

    // Si adminfo está vacío, no enviarlo
    if (!payloadData.adminfo || payloadData.adminfo.trim() === '') {
      delete payloadData.adminfo;
    }

    // Limpiar otros campos opcionales si están vacíos
    if (!payloadData.extension_3cx || payloadData.extension_3cx.trim() === '') delete payloadData.extension_3cx;
    if (!payloadData.cola || payloadData.cola.trim() === '') delete payloadData.cola;
    if (!payloadData.asignacion || payloadData.asignacion.trim() === '') delete payloadData.asignacion;
    if (!payloadData.correo_renovar || payloadData.correo_renovar.trim() === '') delete payloadData.correo_renovar;

    if (!payloadData.correo_renovar || payloadData.correo_renovar.trim() === '') delete payloadData.correo_renovar;

    // Limpiar temporal si no es TEMPORAL (seguridad adicional)
    if (payloadData.tipo_contrato !== 'TEMPORAL') {
      delete payloadData.temporal;
    }

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
