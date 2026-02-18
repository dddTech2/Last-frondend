/**
 * Utilidades de validación para formularios de personal
 * Centraliza las reglas de validación para reutilización
 */

export const validators = {
  // Validar cédula - Solo números
  cedula: (value) => {
    if (!value) return 'La cédula es requerida';
    // Acepta solo dígitos
    if (!/^\d+$/.test(value)) {
      return 'La cédula solo puede contener números';
    }
    if (value.length < 8 || value.length > 12) {
      return 'La cédula debe tener entre 8 y 12 dígitos';
    }
    return null;
  },

  // Validar nombre - Solo letras y espacios
  nombre: (value) => {
    if (!value) return 'El nombre es requerido';
    if (value.trim().length < 3) {
      return 'El nombre debe tener al menos 3 caracteres';
    }
    // Solo acepta letras (incluyendo acentos) y espacios
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
      return 'El nombre solo puede contener letras y espacios';
    }
    return null;
  },

  // Validar nombre de contacto de emergencia - Mismo formato que nombre
  nombreContactoEmergencia: (value) => {
    if (!value) return 'El nombre de contacto es requerido';
    if (value.trim().length < 3) {
      return 'El nombre debe tener al menos 3 caracteres';
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
      return 'El nombre solo puede contener letras y espacios';
    }
    return null;
  },

  // Validar celular - Debe empezar con 3 y tener 10 dígitos
  celular: (value) => {
    if (!value) return 'El celular es requerido';
    const cleanValue = value.replace(/\D/g, '');
    if (!/^3\d{9}$/.test(cleanValue)) {
      return 'El celular debe empezar con 3 y tener 10 dígitos';
    }
    return null;
  },

  // Validar teléfono de emergencia - Mismo formato que celular
  telefonoEmergencia: (value) => {
    if (!value) return 'El teléfono de emergencia es requerido';
    const cleanValue = value.replace(/\D/g, '');
    if (!/^3\d{9}$/.test(cleanValue)) {
      return 'El teléfono debe empezar con 3 y tener 10 dígitos';
    }
    return null;
  },

  // Validar email - Requiere @ obligatoriamente
  email: (value, fieldName = 'correo') => {
    if (!value) return `El ${fieldName} es requerido`;

    // Validación 1: Debe contener @
    if (!value.includes('@')) {
      return `El ${fieldName} debe contener obligatoriamente @`;
    }

    // Validación 2: Formato general
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Formato de correo inválido (debe ser: usuario@dominio.com)';
    }
    return null;
  },

  // Validar contraseña
  password: (value) => {
    if (!value) return 'La contraseña es requerida';
    if (value.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!/(?=.*[a-z])/.test(value)) {
      return 'Debe contener letras minúsculas';
    }
    if (!/(?=.*[A-Z])/.test(value)) {
      return 'Debe contener letras mayúsculas';
    }
    if (!/(?=.*\d)/.test(value)) {
      return 'Debe contener números';
    }
    return null;
  },

  // Validar coincidencia de contraseñas
  passwordMatch: (password, confirmPassword) => {
    if (!confirmPassword) return 'Debes confirmar la contraseña';
    if (password !== confirmPassword) {
      return 'Las contraseñas no coinciden';
    }
    return null;
  },

  // Validar jefe inmediato (GERENTE GENERAL no requiere jefe)
  jefeInmediato: (value, cargo) => {
    // GERENTE GENERAL no requiere jefe inmediato
    if (cargo === 'GERENTE GENERAL') {
      return null;
    }
    // Otros cargos deben tener jefe
    if (!value) return 'Debe seleccionar un jefe inmediato';
    return null;
  },

  // Validar fecha
  date: (value) => {
    if (!value) return 'La fecha es requerida';
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Formato de fecha inválido';
    }
    // Eliminamos restricción de fechas futuras para evitar bloqueos
    return null;
  },

  // Validar fecha permitiendo fechas futuras (ej: fecha_ingreso)
  dateAllowFuture: (value) => {
    if (!value) return 'La fecha es requerida';
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Formato de fecha inválido';
    }
    return null;
  },

  // Validar fecha de nacimiento - Mínimo 18 años
  fechaNacimiento: (value) => {
    if (!value) return 'La fecha de nacimiento es requerida';
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Formato de fecha inválido';
    }

    const today = new Date();
    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

    if (date > today) {
      return 'La fecha no puede ser futura';
    }
    if (date > eighteenYearsAgo) {
      return 'Debe ser mayor de 18 años';
    }
    return null;
  },

  // Validar campo requerido
  required: (value, fieldName = 'Este campo') => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} es requerido`;
    }
    return null;
  },

  // Validar extensión 3CX
  extension: (value) => {
    if (!value) return null; // Opcional
    if (!/^\d{3,5}$/.test(value.trim())) {
      return 'La extensión debe tener 3-5 dígitos';
    }
    return null;
  },
};

/**
 * Validar múltiples campos a la vez
 * @param {Object} data - Objeto con los datos a validar
 * @param {Object} rules - Objeto con las reglas de validación
 * @returns {Object} Objeto con errores encontrados
 */
export const validateForm = (data, rules) => {
  const errors = {};

  Object.keys(rules).forEach(fieldName => {
    const rule = rules[fieldName];
    const value = data[fieldName];

    if (typeof rule === 'function') {
      const error = rule(value);
      if (error) {
        errors[fieldName] = error;
      }
    } else if (Array.isArray(rule)) {
      // Soporta validadores múltiples
      for (const validator of rule) {
        const error = validator(value);
        if (error) {
          errors[fieldName] = error;
          break;
        }
      }
    }
  });

  return errors;
};

/**
 * Chequear si hay errores
 */
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

/**
 * Limpiar errores de un campo específico
 */
export const clearFieldError = (errors, fieldName) => {
  const newErrors = { ...errors };
  delete newErrors[fieldName];
  return newErrors;
};

/**
 * Limpiar todos los errores
 */
export const clearAllErrors = () => {
  return {};
};
