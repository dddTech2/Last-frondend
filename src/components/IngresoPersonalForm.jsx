import React, { useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Lock, Eye, EyeOff, Loader, User, Briefcase, Heart } from 'lucide-react';
import FormField from './FormField';
import SelectJefeInmediato from './SelectJefeInmediato';
import useIngresoForm from '../hooks/useIngresoForm';
import { validators } from '../utils/InputValidator';

const IngresoPersonalForm = ({ onSubmit, isSubmitting = false, onCancel }) => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Función para formatear el estado del empleado de forma legible
  const formatEstado = (estado) => {
    const estadoMap = {
      'PENDIENTE_APROBACION_JURIDICO': 'Pendiente Aprobación Jurídica',
      'EN_PROCESO_DE_CONTRATACION': 'En Proceso de Contratación',
      'ACTIVO': 'Activo',
      'RETIRADO': 'Retirado',
      'PENDIENTE_RETIRO_JURIDICO': 'Pendiente Retiro Jurídico',
      'RECHAZO_JURIDICO': 'Rechazo Jurídico',
      'RECHAZO_RETIRO_JURIDICO': 'Rechazo Retiro Jurídico',
    };
    return estadoMap[estado] || estado || '—';
  };

  // Obtener la fecha de hoy en formato YYYY-MM-DD para desabilitar fechas futuras
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Obtener fecha de 18 años atrás (máxima permitida para fecha_nacimiento)
  const getMaxBirthDate = () => {
    const today = new Date();
    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return eighteenYearsAgo.toISOString().split('T')[0];
  };

  const {
    formData,
    handleChange,
    handleBlur,
    validateAll,
    getCleanData,
    getFieldError,
    validateCedula,
    cedulaValidating,
    setErrors,
    setTouched,
  } = useIngresoForm();

  // Handler personalizado para validar email campos
  const handleEmailChange = (e) => {
    handleChange(e);
    // Validar email en tiempo real si tiene @
    if (e.target.value.includes('@')) {
      const error = validators.email(e.target.value, e.target.name === 'correo_personal' ? 'correo personal' : 'correo Renovar');
      setErrors(prev => ({ ...prev, [e.target.name]: error }));
    }
  };

  // Handler para formato de moneda (miles)
  const handleSalarioChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remover todo lo que no sea dígito

    // Limitar longitud
    if (value.length > 9) value = value.slice(0, 9);

    // Formatear con puntos
    const formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Actualizar estado manualmente
    handleChange({
      target: {
        name: 'asignacion_salarial',
        value: formattedValue
      }
    });
  };

  const handleEmailBlur = (e) => {
    handleBlur(e);
    // Forzar validación completa en blur
    const error = validators.email(e.target.value, e.target.name === 'correo_personal' ? 'correo personal' : 'correo Renovar');
    setErrors(prev => ({
      ...prev,
      [e.target.name]: error,
    }));
  };

  // Handler para cantidad de hijos (solo números)
  const handleCantidadHijosChange = (e) => {
    const value = e.target.value;
    // Solo permitir números
    if (value === '' || /^\d+$/.test(value)) {
      handleChange({ ...e, target: { ...e.target, value } });
    }
  };

  // Handler para contacto de emergencia teléfono (solo números, comienza con 3, 10 dígitos)
  const handleEmergencyPhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Solo números

    // Asegurar que comience con 3
    if (value.length > 0 && value[0] !== '3') {
      value = '3' + value;
    }

    // Limitar a 10 dígitos
    value = value.substring(0, 10);

    e.target.value = value;
    handleChange(e);
  };

  // Handler para contacto de emergencia nombre (solo letras como en nombre completo)
  const handleEmergencyNameChange = (e) => {
    const { value } = e.target;
    // Mantener solo letras (incluyendo acentos) y espacios
    let lettersOnly = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    e.target.value = lettersOnly;
    handleChange(e);
  };

  const handleProceedToStep2 = async () => {
    setStep(1); // Asegurar que estamos en paso 1

    // Marcar todos los campos como touched para mostrar errores
    const step1Fields = ['cedula', 'nombre', 'celular', 'correo_personal'];

    // Validar cada campo localmente
    let validationErrors = {};
    step1Fields.forEach(field => {
      let error = null;

      // Validar contenido
      if (!formData[field] || formData[field].trim() === '') {
        error = `Este campo es requerido`;
      } else {
        // Usar validadores específicos
        if (field === 'cedula') {
          error = validators.cedula(formData[field]);
        } else if (field === 'nombre') {
          error = validators.nombre(formData[field]);
        } else if (field === 'celular') {
          error = validators.celular(formData[field]);
        } else if (field === 'correo_personal') {
          error = validators.email(formData[field], 'correo personal');
        }
      }

      if (error) {
        validationErrors[field] = error;
      }
    });

    // Si hay errores de validación, mostrar y no continuar
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const fieldLabels = {
        cedula: 'Cédula',
        nombre: 'Nombre',
        celular: 'Celular',
        correo_personal: 'Correo Personal'
      };
      const errorMessages = Object.entries(validationErrors)
        .map(([field, error]) => `❌ ${fieldLabels[field] || field}: ${error}`)
        .join('\n');
      setSubmitError(`Por favor corrige los siguientes errores:\n${errorMessages}`);
      return;
    }

    // Si todo está bien localmente, validar cédula contra API
    const isCedulaValid = await validateCedula();
    if (isCedulaValid) {
      setStep(2);
      setSubmitError(null);
      toast.success('✅ Datos personales guardados correctamente');
    } else {
      setSubmitError('❌ No se puede continuar. La cédula ya existe en el sistema o hay un error en la validación.');
    }
  };

  const handleProceedToStep3 = () => {
    // Validar campos de step 2 - Datos laborales y personales
    const step2Fields = [
      'cargo', 'area', 'fecha_ingreso', 'contrato', 'jefe_inmediato',
      'fecha_nacimiento', 'genero', 'ciudad', 'lugar', 'direccion_residencia',
      'eps', 'fondo_pensiones', 'arl', 'cantidad_hijos', 'contacto_emergencia_nombre',
      'contacto_emergencia_telefono'
    ];

    // Si es Bogotá, agregar localidad
    if (formData.ciudad === 'BOGOTA') {
      step2Fields.push('localidad');
    }

    // Validar cada campo con validadores específicos
    let validationErrors = {};
    step2Fields.forEach(field => {
      let error = null;

      // Validar contenido
      if (!formData[field] || formData[field].toString().trim() === '') {
        error = `Este campo es requerido`;
      } else {
        // Validadores específicos para ciertos campos
        if (field === 'contacto_emergencia_telefono') {
          error = validators.telefonoEmergencia(formData[field]);
        } else if (field === 'fecha_ingreso') {
          error = validators.date(formData[field]);
        } else if (field === 'fecha_nacimiento') {
          error = validators.fechaNacimiento(formData[field]);
        }
      }

      if (error) {
        validationErrors[field] = error;
      }
    });

    // Si hay errores, marcar campos y mostrar mensaje
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      // Marcar todos los campos del step 2 como touched para que se muestren los errores
      const allStep2Fields = [
        'cargo', 'area', 'fecha_ingreso', 'contrato', 'jefe_inmediato',
        'fecha_nacimiento', 'genero', 'ciudad', 'localidad',
        'lugar', 'direccion_residencia', 'eps', 'fondo_pensiones', 'arl',
        'cantidad_hijos', 'contacto_emergencia_nombre', 'contacto_emergencia_telefono'
      ];

      let touchedFields = {};
      allStep2Fields.forEach(field => {
        touchedFields[field] = true;
      });
      setTouched(touchedFields);

      const fieldLabels = {
        cargo: 'Cargo',
        area: 'Área',
        fecha_ingreso: 'Fecha de Ingreso',
        contrato: 'Tipo de Contrato',
        jefe_inmediato: 'Jefe Inmediato',
        fecha_nacimiento: 'Fecha de Nacimiento',
        genero: 'Género',
        ciudad: 'Ciudad',
        localidad: 'Localidad',
        lugar: 'Lugar de Trabajo',
        direccion_residencia: 'Dirección de Residencia',
        eps: 'EPS',
        fondo_pensiones: 'Fondo de Pensiones',
        arl: 'ARL',
        cantidad_hijos: 'Cantidad de Hijos',
        contacto_emergencia_nombre: 'Contacto de Emergencia - Nombre',
        contacto_emergencia_telefono: 'Contacto de Emergencia - Teléfono',
      };

      // Mostrar errores específicos
      const errorMessages = Object.entries(validationErrors)
        .map(([field, error]) => `❌ ${fieldLabels[field] || field}: ${error}`)
        .join('\n');

      setSubmitError(`Por favor corrige los siguientes errores:\n${errorMessages}`);
      return;
    }

    // Si todo está bien, proceder a step 3
    setStep(3);
    setSubmitError(null);
    setErrors({});
    toast.success('✅ Datos laborales y personales guardados correctamente');
  };

  // Opciones para los selectores
  const cargos = [
    'COORDINADOR', 'GESTOR DE COBRANZA', 'ABOGADO JUNIOR', 'ANALISTA TI', 'ANALISTA JUNIOR',
    'ANALISTA SIG', 'ASISTENTE VENTAS', 'AUX SERVICIOS GENERALES', 'CIENTIFICO DATOS',
    'DIRECTOR JURIDICO', 'DIRECTOR ADMINISTRATIVO Y FINANCIERA', 'DIRECTORA DE OPERACIONES',
    'GERENTE GENERAL', 'LIDER DE PROCESOS', 'SUBDIRECTOR'
  ];

  const areas = [
    'COBRANZA', 'TI', 'SEGUROS', 'ADMINISTRATIVO', 'COLOCACION', 'GERENCIA', 'JURIDICA', 'RRHH'
  ];

  const tiposContrato = [
    { value: 'PLANTA', label: 'Planta' },
    { value: 'CORRETAJE', label: 'Corretaje' },
    { value: 'TEMPORAL', label: 'Temporal' },
    { value: 'CASA DE COBRO', label: 'Casa de Cobro' },
  ];

  // Opciones para ciudades principales de Colombia
  const ciudadesOptions = [
    { value: 'BOGOTA', label: 'Bogotá' },
    { value: 'MEDELLIN', label: 'Medellín' },
    { value: 'CALI', label: 'Cali' },
    { value: 'BARRANQUILLA', label: 'Barranquilla' },
    { value: 'CARTAGENA', label: 'Cartagena' },
    { value: 'SANTA_MARTA', label: 'Santa Marta' },
    { value: 'BUCARAMANGA', label: 'Bucaramanga' },
    { value: 'CÚCUTA', label: 'Cúcuta' },
    { value: 'IBAGUE', label: 'Ibagué' },
    { value: 'MANIZALES', label: 'Manizales' },
    { value: 'PEREIRA', label: 'Pereira' },
    { value: 'ARMENIA', label: 'Armenia' },
    { value: 'POPAYAN', label: 'Popayán' },
    { value: 'PASTO', label: 'Pasto' },
    { value: 'QUIBDO', label: 'Quibdó' },
    { value: 'VALLEDUPAR', label: 'Valledupar' },
    { value: 'MONTERIA', label: 'Montería' },
    { value: 'SINCELEJO', label: 'Sincelejo' },
    { value: 'VILLAVICENCIO', label: 'Villavicencio' },
    { value: 'NEIVA', label: 'Neiva' },
  ];

  // Localidades de Bogotá (se muestran si selecciona Bogotá en ciudad)
  const localidadesBogotaOptions = [
    { value: 'USAQUÉN', label: 'Usaquén' },
    { value: 'CHAPINERO', label: 'Chapinero' },
    { value: 'SANTA FE', label: 'Santa Fe' },
    { value: 'SAN CRISTÓBAL', label: 'San Cristóbal' },
    { value: 'USME', label: 'Usme' },
    { value: 'TUNJUELITO', label: 'Tunjuelito' },
    { value: 'BOSA', label: 'Bosa' },
    { value: 'KENNEDY', label: 'Kennedy' },
    { value: 'FONTIBÓN', label: 'Fontibón' },
    { value: 'ENGATIVÁ', label: 'Engativá' },
    { value: 'SUBA', label: 'Suba' },
    { value: 'BARRIOS UNIDOS', label: 'Barrios Unidos' },
    { value: 'TEUSAQUILLO', label: 'Teusaquillo' },
    { value: 'MÁRTIRES', label: 'Mártires' },
    { value: 'ANTONIO NARIÑO', label: 'Antonio Nariño' },
    { value: 'PUENTE ARANDA', label: 'Puente Aranda' },
    { value: 'LA CANDELARIA', label: 'La Candelaria' },
    { value: 'RAFAEL URIBE URIBE', label: 'Rafael Uribe Uribe' },
    { value: 'CIUDAD BOLÍVAR', label: 'Ciudad Bolívar' },
    { value: 'SUMAPAZ', label: 'Sumapaz' },
  ];

  // Opciones para lugar de trabajo
  const lugarTrabajoOptions = [
    { value: 'OFICINA', label: 'Oficina' },
    { value: 'CASA', label: 'Casa' },
    { value: 'HIBRIDO', label: 'Híbrido' },
  ];

  // Fondos de pensiones más comunes en Colombia
  const fondosPensionesOptions = [
    { value: 'PROTECIÓN', label: 'Protección' },
    { value: 'COLFONDOS', label: 'Colfondos' },
    { value: 'PORVENIR', label: 'Porvenir' },
    { value: 'SANTA FÉ', label: 'Santa Fé' },
    { value: 'SKANDIA', label: 'Skandia' },
    { value: 'INTEGRA', label: 'Integra' },
    { value: 'FUTURA', label: 'Futura' },
    { value: 'SURA', label: 'Sura' },
  ];

  // EPS más comunes en Colombia
  const epsOptions = [
    { value: 'SURA', label: 'Sura' },
    { value: 'AXA COLPATRIA', label: 'Axa Colpatria' },
    { value: 'COOMEVA', label: 'Coomeva' },
    { value: 'FAMISANAR', label: 'Famisanar' },
    { value: 'COMPENSAR', label: 'Compensar' },
    { value: 'SALUD TOTAL', label: 'Salud Total' },
    { value: 'NUEVA EPS', label: 'Nueva EPS' },
    { value: 'SANITAS', label: 'Sanitas' },
    { value: 'HUMANA', label: 'Humana' },
    { value: 'EMSSANAR', label: 'Emssanar' },
    { value: 'CAFESALUD', label: 'CafeSalud' },
    { value: 'MEDIMÁS', label: 'Medimás' },
    { value: 'COLSANITAS', label: 'Colsanitas' },
  ];

  // ARL más importantes en Colombia
  const arlOptions = [
    { value: 'SURA', label: 'Sura' },
    { value: 'ARP BOLÍVAR', label: 'ARP Bolívar' },
    { value: 'ARP COLMENA', label: 'ARP Colmena' },
    { value: 'LIBERTY MUTUAL', label: 'Liberty Mutual' },
    { value: 'MAPFRE', label: 'Mapfre' },
    { value: 'POSITIVA', label: 'Positiva' },
    { value: 'ARP CIGNA', label: 'ARP Cigna' },
  ];

  // Opciones de cantidad de hijos (0-10)
  const cantidadHijosOptions = [
    { value: '0', label: '0' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
    { value: '6', label: '6' },
    { value: '7', label: '7' },
    { value: '8', label: '8' },
    { value: '9', label: '9' },
    { value: '10', label: '10' },
  ];

  // Validar pasos
  const isStep1Valid = () => {
    return (
      formData.cedula &&
      formData.nombre &&
      formData.celular &&
      formData.correo_personal &&
      !getFieldError('cedula') &&
      !getFieldError('nombre') &&
      !getFieldError('celular') &&
      !getFieldError('correo_personal')
    );
  };

  // Función para obtener los campos faltantes en step 2
  const getMissingStep2Fields = () => {
    const fieldLabels = {
      cargo: 'Cargo',
      area: 'Área',
      fecha_ingreso: 'Fecha de Ingreso',
      contrato: 'Tipo de Contrato',
      jefe_inmediato: 'Jefe Inmediato',
      fecha_nacimiento: 'Fecha de Nacimiento',
      genero: 'Género',
      ciudad: 'Ciudad',
      localidad: 'Localidad',
      lugar: 'Lugar de Trabajo',
      direccion_residencia: 'Dirección de Residencia',
      eps: 'EPS',
      fondo_pensiones: 'Fondo de Pensiones',
      arl: 'ARL',
      cantidad_hijos: 'Cantidad de Hijos',
      contacto_emergencia_nombre: 'Contacto de Emergencia - Nombre',
      contacto_emergencia_telefono: 'Contacto de Emergencia - Teléfono',
    };

    const missingFields = [];

    if (!formData.cargo) missingFields.push(fieldLabels.cargo);
    if (!formData.area) missingFields.push(fieldLabels.area);
    if (!formData.fecha_ingreso) missingFields.push(fieldLabels.fecha_ingreso);
    if (!formData.contrato) missingFields.push(fieldLabels.contrato);
    if (!formData.jefe_inmediato) missingFields.push(fieldLabels.jefe_inmediato);
    if (!formData.fecha_nacimiento) missingFields.push(fieldLabels.fecha_nacimiento);
    if (!formData.genero) missingFields.push(fieldLabels.genero);
    if (!formData.ciudad) missingFields.push(fieldLabels.ciudad);
    if (formData.ciudad === 'BOGOTA' && !formData.localidad) missingFields.push(fieldLabels.localidad);
    if (!formData.lugar) missingFields.push(fieldLabels.lugar);
    if (!formData.direccion_residencia) missingFields.push(fieldLabels.direccion_residencia);
    if (!formData.eps) missingFields.push(fieldLabels.eps);
    if (!formData.fondo_pensiones) missingFields.push(fieldLabels.fondo_pensiones);
    if (!formData.arl) missingFields.push(fieldLabels.arl);
    if (!formData.cantidad_hijos) missingFields.push(fieldLabels.cantidad_hijos);
    if (!formData.contacto_emergencia_nombre) missingFields.push(fieldLabels.contacto_emergencia_nombre);
    if (!formData.contacto_emergencia_telefono) missingFields.push(fieldLabels.contacto_emergencia_telefono);

    return missingFields;
  };

  const isStep2Valid = () => {
    const baseValidation = (
      formData.cargo &&
      formData.area &&
      formData.fecha_ingreso &&
      formData.contrato &&
      formData.jefe_inmediato &&
      formData.fecha_nacimiento &&
      formData.genero &&
      formData.ciudad &&
      (formData.ciudad === 'BOGOTA' ? formData.localidad : true) &&
      formData.lugar &&
      formData.direccion_residencia &&
      formData.eps &&
      formData.fondo_pensiones &&
      formData.arl &&
      formData.cantidad_hijos &&
      formData.contacto_emergencia_nombre &&
      formData.contacto_emergencia_telefono
      // estado se determina automáticamente según tipo de contrato
    );

    return baseValidation;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    const isValid = validateAll();
    if (!isValid) {
      // Debug: Log detallado de errores para el desarrollador
      console.group('❌ VALIDACIÓN FALLIDA');
      console.error('Errores encontrados:', errors);
      console.error('Datos actuales:', {
        cedula: formData.cedula,
        nombre: formData.nombre,
        celular: formData.celular,
        correo_personal: formData.correo_personal,
        cargo: formData.cargo,
        area: formData.area,
        fecha_ingreso: formData.fecha_ingreso,
        contrato: formData.contrato,
        jefe_inmediato: formData.jefe_inmediato,
        estado: formData.estado,
        ciudad: formData.ciudad,
        localidad: formData.localidad,
        fecha_nacimiento: formData.fecha_nacimiento,
        genero: formData.genero,
        lugar: formData.lugar,
        direccion_residencia: formData.direccion_residencia,
        eps: formData.eps,
        fondo_pensiones: formData.fondo_pensiones,
        arl: formData.arl,
        cantidad_hijos: formData.cantidad_hijos,
        contacto_emergencia_nombre: formData.contacto_emergencia_nombre,
        contacto_emergencia_telefono: formData.contacto_emergencia_telefono,
      });
      console.groupEnd();

      setSubmitError('Por favor completa todos los campos requeridos correctamente');
      return;
    }

    const dataToSubmit = getCleanData();
    await onSubmit(dataToSubmit);
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h4 className="font-semibold text-blue-900">👤 Datos Personales</h4>
        <p className="text-sm text-blue-700 mt-1">Información básica del empleado</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FormField
            label="Cédula"
            name="cedula"
            type="tel"
            placeholder="Ej: 12345678"
            value={formData.cedula}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            disabled={isSubmitting}
          />
          {getFieldError('cedula') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('cedula')}
            </p>
          )}
        </div>

        <div>
          <FormField
            label="Nombre Completo"
            name="nombre"
            type="text"
            placeholder="Ej: Juan Pérez García"
            value={formData.nombre}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            disabled={isSubmitting}
          />
          {getFieldError('nombre') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('nombre')}
            </p>
          )}
        </div>

        <div>
          <FormField
            label="Celular"
            name="celular"
            type="tel"
            placeholder="Ej: 3001234567"
            value={formData.celular}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            disabled={isSubmitting}
          />
          {getFieldError('celular') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('celular')}
            </p>
          )}
        </div>

        <div>
          <FormField
            label="Correo Personal"
            name="correo_personal"
            type="email"
            placeholder="Ej: juan@correo.com"
            value={formData.correo_personal}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            required
            disabled={isSubmitting}
          />
          {getFieldError('correo_personal') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('correo_personal')}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
        <h4 className="font-semibold text-green-900">💼 Datos Laborales</h4>
        <p className="text-sm text-green-700 mt-1">Información del puesto y área de trabajo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FormField
            label="Cargo"
            name="cargo"
            type="select"
            value={formData.cargo}
            onChange={handleChange}
            onBlur={handleBlur}
            options={cargos.map(c => ({ value: c, label: c }))}
            required
            disabled={isSubmitting}
            error={!!getFieldError('cargo')}
          />
          {getFieldError('cargo') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('cargo')}
            </p>
          )}
        </div>

        <div>
          <FormField
            label="Área"
            name="area"
            type="select"
            value={formData.area}
            onChange={handleChange}
            onBlur={handleBlur}
            options={areas.map(a => ({ value: a, label: a }))}
            required
            disabled={isSubmitting}
            error={!!getFieldError('area')}
          />
          {getFieldError('area') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('area')}
            </p>
          )}
        </div>

        <div>
          <FormField
            label="Fecha de Ingreso"
            name="fecha_ingreso"
            type="date"
            value={formData.fecha_ingreso}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            disabled={isSubmitting}
            error={!!getFieldError('fecha_ingreso')}
          />
          {getFieldError('fecha_ingreso') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('fecha_ingreso')}
            </p>
          )}
        </div>

        <div>
          <FormField
            label="Tipo de Contrato"
            name="contrato"
            type="select"
            value={formData.contrato}
            onChange={handleChange}
            onBlur={handleBlur}
            options={tiposContrato}
            required
            disabled={isSubmitting}
            error={!!getFieldError('contrato')}
          />
          {getFieldError('contrato') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('contrato')}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectJefeInmediato
          cargo={formData.cargo}
          value={formData.jefe_inmediato}
          onChange={handleChange}
          onBlur={handleBlur}
          error={getFieldError('jefe_inmediato')}
          disabled={isSubmitting || !formData.cargo}
          required
        />
      </div>

      {(formData.contrato === 'PLANTA' || formData.contrato === 'CORRETAJE') && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-6">
          <h4 className="font-semibold text-yellow-900 mb-4">📋 Información Contractual</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FormField
                label="Asignación Salarial"
                name="asignacion_salarial"
                type="text"
                value={formData.asignacion_salarial}
                onChange={handleSalarioChange}
                onBlur={handleBlur}
                placeholder="Ej: 1.500.000"
                required
                disabled={isSubmitting}
                error={!!getFieldError('asignacion_salarial')}
                icon={Briefcase}
              />
              {getFieldError('asignacion_salarial') && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {getFieldError('asignacion_salarial')}
                </p>
              )}
            </div>

            <div>
              <FormField
                label="Tipo de Contrato Laboral"
                name="tipo_contrato_laboral"
                type="select"
                value={formData.tipo_contrato_laboral}
                onChange={handleChange}
                onBlur={handleBlur}
                options={[
                  { value: 'FIJO', label: 'Fijo' },
                  { value: 'INDEFINIDO', label: 'Indefinido' }
                ]}
                required
                disabled={isSubmitting}
                error={!!getFieldError('tipo_contrato_laboral')}
              />
              {getFieldError('tipo_contrato_laboral') && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {getFieldError('tipo_contrato_laboral')}
                </p>
              )}
            </div>

            {formData.tipo_contrato_laboral === 'FIJO' && (
              <div>
                <FormField
                  label="Fecha Terminación de Contrato"
                  name="fecha_terminacion_contrato"
                  type="date"
                  value={formData.fecha_terminacion_contrato}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min={getTodayDate()}
                  required
                  disabled={isSubmitting}
                  error={!!getFieldError('fecha_terminacion_contrato')}
                />
                {getFieldError('fecha_terminacion_contrato') && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {getFieldError('fecha_terminacion_contrato')}
                  </p>
                )}
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones de Contrato
              </label>
              <textarea
                name="observaciones_contrato"
                value={formData.observaciones_contrato || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="Ingrese cualquier observación relevante sobre el contrato..."
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded text-sm text-blue-800 mt-6">
        <p className="font-semibold mb-1">Datos Personales y Seguridad Social</p>
        <p>Información personal, beneficiarios y datos de seguridad social</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FormField
            label="Fecha de Nacimiento"
            name="fecha_nacimiento"
            type="date"
            value={formData.fecha_nacimiento}
            onChange={handleChange}
            onBlur={handleBlur}
            max={getMaxBirthDate()}
            required
            disabled={isSubmitting}
            error={!!getFieldError('fecha_nacimiento')}
          />
          {getFieldError('fecha_nacimiento') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('fecha_nacimiento')}
            </p>
          )}
        </div>

        <div>
          <FormField
            label="Género"
            name="genero"
            type="select"
            value={formData.genero}
            onChange={handleChange}
            onBlur={handleBlur}
            options={[
              { value: 'M', label: 'Masculino' },
              { value: 'F', label: 'Femenino' },
              { value: 'O', label: 'Otro' }
            ]}
            required
            disabled={isSubmitting}
            error={!!getFieldError('genero')}
          />
          {getFieldError('genero') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('genero')}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado del Empleado
          </label>
          <div className="w-full px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 font-semibold">
            {formData.estado ? formatEstado(formData.estado) : 'Se determina según el tipo de contrato'}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {formData.contrato ? `Asignado automáticamente para contrato: ${formData.contrato}` : 'Selecciona un tipo de contrato'}
          </p>
        </div>

        <div>
          <FormField
            label="Ciudad"
            name="ciudad"
            type="select"
            value={formData.ciudad}
            onChange={handleChange}
            onBlur={handleBlur}
            options={ciudadesOptions}
            required
            disabled={isSubmitting}
            error={!!getFieldError('ciudad')}
          />
          {getFieldError('ciudad') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('ciudad')}
            </p>
          )}
        </div>

        {formData.ciudad === 'BOGOTA' && (
          <div>
            <FormField
              label="Localidad"
              name="localidad"
              type="select"
              value={formData.localidad}
              onChange={handleChange}
              onBlur={handleBlur}
              options={localidadesBogotaOptions}
              required
              disabled={isSubmitting}
              error={!!getFieldError('localidad')}
            />
            {getFieldError('localidad') && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> {getFieldError('localidad')}
              </p>
            )}
          </div>
        )}

        <div>
          <FormField
            label="Lugar de Trabajo"
            name="lugar"
            type="select"
            value={formData.lugar}
            onChange={handleChange}
            onBlur={handleBlur}
            options={lugarTrabajoOptions}
            required
            disabled={isSubmitting}
            error={!!getFieldError('lugar')}
          />
          {getFieldError('lugar') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('lugar')}
            </p>
          )}
        </div>

        <div>
          <FormField
            label="Dirección de Residencia"
            name="direccion_residencia"
            type="text"
            placeholder="Ej: Calle 10 #20-30"
            value={formData.direccion_residencia}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            disabled={isSubmitting}
            error={!!getFieldError('direccion_residencia')}
          />
          {getFieldError('direccion_residencia') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('direccion_residencia')}
            </p>
          )}
        </div>

        <div>
          <FormField
            label="EPS"
            name="eps"
            type="select"
            value={formData.eps}
            onChange={handleChange}
            onBlur={handleBlur}
            options={epsOptions}
            required
            disabled={isSubmitting}
            error={!!getFieldError('eps')}
          />
          {getFieldError('eps') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('eps')}
            </p>
          )}
        </div>

        <div>
          <FormField
            label="Fondo de Pensiones"
            name="fondo_pensiones"
            type="select"
            value={formData.fondo_pensiones}
            onChange={handleChange}
            onBlur={handleBlur}
            options={fondosPensionesOptions}
            required
            disabled={isSubmitting}
            error={!!getFieldError('fondo_pensiones')}
          />
          {getFieldError('fondo_pensiones') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('fondo_pensiones')}
            </p>
          )}
        </div>

        <div>
          <FormField
            label="ARL"
            name="arl"
            type="select"
            value={formData.arl}
            onChange={handleChange}
            onBlur={handleBlur}
            options={arlOptions}
            required
            disabled={isSubmitting}
            error={!!getFieldError('arl')}
          />
          {getFieldError('arl') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('arl')}
            </p>
          )}
        </div>

        <div>
          <FormField
            label="Cantidad de Hijos"
            name="cantidad_hijos"
            type="select"
            value={formData.cantidad_hijos}
            onChange={handleChange}
            onBlur={handleBlur}
            options={cantidadHijosOptions}
            required
            disabled={isSubmitting}
            error={!!getFieldError('cantidad_hijos')}
          />
          {getFieldError('cantidad_hijos') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('cantidad_hijos')}
            </p>
          )}
        </div>

        <div>
          <FormField
            label="Contacto de Emergencia - Nombre"
            name="contacto_emergencia_nombre"
            type="text"
            placeholder="Nombre de contacto"
            value={formData.contacto_emergencia_nombre}
            onChange={handleEmergencyNameChange}
            onBlur={handleBlur}
            required
            disabled={isSubmitting}
            error={!!getFieldError('contacto_emergencia_nombre')}
          />
          {getFieldError('contacto_emergencia_nombre') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('contacto_emergencia_nombre')}
            </p>
          )}
        </div>

        <div>
          <FormField
            label="Contacto de Emergencia - Teléfono"
            name="contacto_emergencia_telefono"
            type="tel"
            placeholder="Ej: 3001234567"
            value={formData.contacto_emergencia_telefono}
            onChange={handleEmergencyPhoneChange}
            onBlur={handleBlur}
            required
            disabled={isSubmitting}
            error={!!getFieldError('contacto_emergencia_telefono')}
          />
          {getFieldError('contacto_emergencia_telefono') && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {getFieldError('contacto_emergencia_telefono')}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    // Mapeo de valores formateados
    const formatValue = (field, value) => {
      if (!value) return '—';

      // Especiales: dropdowns que necesitan valores legibles
      const dropdownMaps = {
        genero: { 'M': 'Masculino', 'F': 'Femenino', 'O': 'Otro' },
        estado: {
          'PENDIENTE_APROBACION_JURIDICO': 'Pendiente Aprobación Jurídica',
          'EN_PROCESO_DE_CONTRATACION': 'En Proceso de Contratación',
          'ACTIVO': 'Activo',
          'RETIRADO': 'Retirado',
          'PENDIENTE_RETIRO_JURIDICO': 'Pendiente Retiro Jurídico',
          'RECHAZO_JURIDICO': 'Rechazo Jurídico',
          'RECHAZO_RETIRO_JURIDICO': 'Rechazo Retiro Jurídico',
        },
        lugar: { 'OFICINA': 'Oficina', 'CASA': 'Casa', 'HIBRIDO': 'Híbrido' },
        contrato: { 'PLANTA': 'Planta', 'CORRETAJE': 'Corretaje', 'TEMPORAL': 'Temporal', 'CASA DE COBRO': 'Casa de Cobro' },
      };

      if (dropdownMaps[field] && dropdownMaps[field][value]) {
        return dropdownMaps[field][value];
      }

      // Fechas: formatear
      if (field === 'fecha_terminacion_contrato' && value) {
        try {
          return new Date(value).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
          return value;
        }
      }

      // Format currency
      if (field === 'asignacion_salarial' && value) {
        return `$${value}`;
      }

      // Format tipo contrato laboral
      if (field === 'tipo_contrato_laboral') {
        return value === 'FIJO' ? 'Fijo' : (value === 'INDEFINIDO' ? 'Indefinido' : value);
      }

      if ((field === 'fecha_ingreso' || field === 'fecha_nacimiento') && value) {
        try {
          return new Date(value).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
          return value;
        }
      }

      // Default
      return value;
    };

    return (
      <div className="space-y-6">
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-semibold text-green-900">Resumen - Verifica tus datos</h4>
              <p className="text-sm text-green-700 mt-0.5">Revisa toda la información antes de crear el empleado</p>
            </div>
          </div>
        </div>

        {/* Sección: Datos Personales (Step 1) */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Datos Personales
            </h5>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
            >
              Editar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Cédula</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('cedula', formData.cedula)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Nombre</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('nombre', formData.nombre)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Celular</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('celular', formData.celular)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Correo Personal</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('correo_personal', formData.correo_personal)}</p>
            </div>
          </div>
        </div>

        {/* Sección: Datos Laborales (Step 2 - Labor) */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-purple-600" />
              Datos Laborales
            </h5>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors"
            >
              Editar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Cargo</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('cargo', formData.cargo)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Área</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('area', formData.area)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Fecha de Ingreso</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('fecha_ingreso', formData.fecha_ingreso)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Tipo de Contrato</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('contrato', formData.contrato)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Jefe Inmediato</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('jefe_inmediato', formData.jefe_inmediato)}</p>
            </div>

            {(formData.contrato === 'PLANTA' || formData.contrato === 'CORRETAJE') && (
              <>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
                  <p className="text-xs text-yellow-700 font-semibold uppercase">Asignación Salarial</p>
                  <p className="text-sm text-yellow-900 mt-1">{formatValue('asignacion_salarial', formData.asignacion_salarial)}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
                  <p className="text-xs text-yellow-700 font-semibold uppercase">Tipo Contrato Laboral</p>
                  <p className="text-sm text-yellow-900 mt-1">{formatValue('tipo_contrato_laboral', formData.tipo_contrato_laboral)}</p>
                </div>
                {formData.tipo_contrato_laboral === 'FIJO' && (
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
                    <p className="text-xs text-yellow-700 font-semibold uppercase">Fecha Terminación</p>
                    <p className="text-sm text-yellow-900 mt-1">{formatValue('fecha_terminacion_contrato', formData.fecha_terminacion_contrato)}</p>
                  </div>
                )}
                {formData.observaciones_contrato && (
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-100 md:col-span-2">
                    <p className="text-xs text-yellow-700 font-semibold uppercase">Observaciones</p>
                    <p className="text-sm text-yellow-900 mt-1">{formData.observaciones_contrato}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sección: Información Personal (Step 2 - Personal) */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-600" />
              Información Personal
            </h5>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs px-2 py-1 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded transition-colors"
            >
              Editar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Fecha de Nacimiento</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('fecha_nacimiento', formData.fecha_nacimiento)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Género</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('genero', formData.genero)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Estado del Empleado</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('estado', formData.estado)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Cantidad de Hijos</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('cantidad_hijos', formData.cantidad_hijos)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Ciudad</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('ciudad', formData.ciudad)}</p>
            </div>
            {formData.ciudad === 'BOGOTA' && (
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-500 font-semibold uppercase">Localidad</p>
                <p className="text-sm text-gray-800 mt-1">{formatValue('localidad', formData.localidad)}</p>
              </div>
            )}
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Lugar de Trabajo</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('lugar', formData.lugar)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Dirección de Residencia</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('direccion_residencia', formData.direccion_residencia)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">EPS</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('eps', formData.eps)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Fondo de Pensiones</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('fondo_pensiones', formData.fondo_pensiones)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">ARL</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('arl', formData.arl)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Contacto de Emergencia - Nombre</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('contacto_emergencia_nombre', formData.contacto_emergencia_nombre)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500 font-semibold uppercase">Contacto de Emergencia - Teléfono</p>
              <p className="text-sm text-gray-800 mt-1">{formatValue('contacto_emergencia_telefono', formData.contacto_emergencia_telefono)}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded text-sm text-blue-800">
          <p className="font-semibold mb-1">✓ Información completa</p>
          <p>Todos los datos han sido validados. Puedes confirmar para crear el empleado o editar cualquier sección.</p>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Indicador de pasos */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
          1
        </div>
        <div className={`flex-1 h-1 rounded transition-all ${step > 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
          2
        </div>
        <div className={`flex-1 h-1 rounded transition-all ${step > 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
          3
        </div>
      </div>

      <div className="text-sm text-gray-600 font-medium">
        Paso {step} de 3: {step === 1 ? 'Datos Personales' : step === 2 ? 'Datos Laborales' : 'Resumen'}
      </div>

      {/* Contenido de pasos */}
      <div className="min-h-96">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      {/* Error general */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">Error en el formulario</p>
            <p className="text-sm text-red-700 whitespace-pre-wrap">{submitError}</p>
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3 pt-6 border-t border-gray-200 justify-between">
        <div>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Atrás
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>

          {step < 3 ? (
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  if (step === 1) {
                    handleProceedToStep2();
                  } else if (step === 2) {
                    handleProceedToStep3();
                  } else {
                    setStep(step + 1);
                  }
                }}
                disabled={cedulaValidating || !((step === 1 && isStep1Valid()) || (step === 2 && isStep2Valid()))}
                className="px-6 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {cedulaValidating && step === 1 ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  'Siguiente'
                )}
              </button>
            </div>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Creando empleado...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Crear Empleado
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default IngresoPersonalForm;
