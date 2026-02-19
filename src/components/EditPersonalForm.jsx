import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Lock, Eye, EyeOff, Loader, User, Briefcase, Heart, Save } from 'lucide-react';
import FormField from './FormField';
import SelectJefeInmediato from './SelectJefeInmediato';
import useIngresoForm from '../hooks/useIngresoForm'; // Reusing hook for validation logic mostly
import { validators } from '../utils/InputValidator';

const EditPersonalForm = ({ initialData, onSubmit, isSubmitting = false, onCancel }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        cedula: '',
        nombre: '',
        celular: '',
        correo_personal: '',
        cargo: '',
        area: '',
        fecha_ingreso: '',
        contrato: '',
        nombre_temporal: '',
        jefe_inmediato: '',
        estado: 'ACTIVO',
        ciudad: '',
        localidad: '',
        fecha_nacimiento: '',
        genero: '',
        lugar: '',
        direccion_residencia: '',
        eps: '',
        fondo_pensiones: '',
        arl: '',
        cantidad_hijos: '',
        contacto_emergencia_nombre: '',
        contacto_emergencia_telefono: '',
        asignacion_salarial: '',
        tipo_contrato_laboral: '',
        fecha_terminacion_contrato: '',
        observaciones_contrato: '',
        // Extra fields that might be present
        correo_renovar: '',
        extension_3cx: '',
        cola_3cx: '',
        usuario_red: '',
        adminfo: '',
        asignacion: ''
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [submitError, setSubmitError] = useState(null);

    // Initialize form data from initialData
    useEffect(() => {
        if (initialData) {
            // Helper to handle nulls
            const safeVal = (val) => (val === null || val === undefined) ? '' : val;

            setFormData(prev => ({
                ...prev,
                ...initialData,
                // Ensure specific fields are strings
                cedula: safeVal(initialData.cedula),
                nombre: safeVal(initialData.nombre),
                celular: safeVal(initialData.celular),
                fecha_ingreso: initialData.fecha_ingreso ? initialData.fecha_ingreso.split('T')[0] : '',
                fecha_nacimiento: initialData.fecha_nacimiento ? initialData.fecha_nacimiento.split('T')[0] : '',
                fecha_terminacion_contrato: initialData.fecha_terminacion_contrato ? initialData.fecha_terminacion_contrato.split('T')[0] : '',
                asignacion_salarial: safeVal(initialData.asignacion_salarial),
                // Map backend fields to frontend expected names
                direccion_residencia: safeVal(initialData.direccion) || safeVal(initialData.direccion_residencia),
                fondo_pensiones: safeVal(initialData.pensiones) || safeVal(initialData.fondo_pensiones),
                contacto_emergencia_nombre: safeVal(initialData.contacto_emergencia) || safeVal(initialData.contacto_emergencia_nombre),
                contacto_emergencia_telefono: safeVal(initialData.telefono_emergencia) || safeVal(initialData.contacto_emergencia_telefono),
                cantidad_hijos: safeVal(initialData.hijos_cantidad || initialData.cantidad_hijos).toString(),
                cola_3cx: safeVal(initialData.cola_3cx) || safeVal(initialData.cola),
            }));
        }
    }, [initialData]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        // Trigger validation for this field
        // (Simplified validation here, relying on final validation)
    };

    // Handler personalizado para validar email campos
    const handleEmailChange = (e) => {
        handleChange(e);
        if (e.target.value.includes('@')) {
            const error = validators.email(e.target.value, e.target.name === 'correo_personal' ? 'correo personal' : 'correo Corporativo');
            setErrors(prev => ({ ...prev, [e.target.name]: error }));
        }
    };

    // Handler para formato de moneda (miles)
    const handleSalarioChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 9) value = value.slice(0, 9);
        const formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        handleChange({
            target: {
                name: 'asignacion_salarial',
                value: formattedValue
            }
        });
    };

    const handleEmailBlur = (e) => {
        handleBlur(e);
        const error = validators.email(e.target.value, e.target.name === 'correo_personal' ? 'correo personal' : 'correo Corporativo');
        setErrors(prev => ({ ...prev, [e.target.name]: error }));
    };

    // Handler para cantidad de hijos (solo números)
    const handleCantidadHijosChange = (e) => {
        const value = e.target.value;
        if (value === '' || /^\d+$/.test(value)) {
            handleChange({ ...e, target: { ...e.target, value } });
        }
    };

    // Handler para contacto de emergencia teléfono
    const handleEmergencyPhoneChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0 && value[0] !== '3') {
            value = '3' + value;
        }
        value = value.substring(0, 10);
        e.target.value = value;
        handleChange(e);
    };

    // Handler para contacto de emergencia nombre
    const handleEmergencyNameChange = (e) => {
        const { value } = e.target;
        let lettersOnly = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        e.target.value = lettersOnly;
        handleChange(e);
    };

    const validateStep1 = () => {
        const errors = {};
        if (!formData.nombre) errors.nombre = 'Requerido';
        if (!formData.celular) errors.celular = 'Requerido';
        if (!formData.correo_personal) errors.correo_personal = 'Requerido';
        // Cedula is read-only in edit mode, so we assume it's valid/present

        // Check validators
        if (formData.celular && validators.celular(formData.celular)) errors.celular = validators.celular(formData.celular);
        if (formData.correo_personal && validators.email(formData.correo_personal, 'correo personal')) errors.correo_personal = validators.email(formData.correo_personal, 'correo personal');

        return errors;
    };

    const validateStep2 = () => {
        const errors = {};
        const reqFields = ['cargo', 'area', 'fecha_ingreso', 'contrato', 'jefe_inmediato',
            'fecha_nacimiento', 'genero', 'ciudad', 'lugar', 'direccion_residencia',
            'eps', 'fondo_pensiones', 'arl', 'cantidad_hijos', 'contacto_emergencia_nombre',
            'contacto_emergencia_telefono'];

        reqFields.forEach(f => {
            if (!formData[f] || String(formData[f]).trim() === '') errors[f] = 'Requerido';
        });

        if (formData.contrato === 'TEMPORAL' && !formData.nombre_temporal) errors.nombre_temporal = 'Requerido';
        if (formData.ciudad === 'BOGOTA' && !formData.localidad) errors.localidad = 'Requerido';

        return errors;
    };

    const validateStep3 = () => {
        // Opcional fields like tech info, but validate format if present
        const errors = {};
        if (formData.correo_renovar && validators.email(formData.correo_renovar, 'correo corporativo')) {
            errors.correo_renovar = validators.email(formData.correo_renovar, 'correo corporativo');
        }
        return errors;
    };


    const handleNext = () => {
        let currentErrors = {};
        if (step === 1) currentErrors = validateStep1();
        if (step === 2) currentErrors = validateStep2();

        if (Object.keys(currentErrors).length > 0) {
            setErrors(currentErrors);
            setTouched(Object.keys(currentErrors).reduce((acc, k) => ({ ...acc, [k]: true }), {}));
            setSubmitError('Por favor corrige los errores antes de continuar.');
            return;
        }

        setErrors({});
        setSubmitError(null);
        setStep(prev => prev + 1);
    };

    const handlePrev = () => {
        setStep(prev => prev - 1);
        setSubmitError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Final validation
        const errors1 = validateStep1();
        const errors2 = validateStep2();
        const errors3 = validateStep3();

        const allErrors = { ...errors1, ...errors2, ...errors3 };
        if (Object.keys(allErrors).length > 0) {
            setErrors(allErrors);
            setSubmitError('Hay errores en el formulario. Por favor revisa todos los pasos.');
            return;
        }


        // Sanitize data: convert empty strings to null for optional fields
        const cleanData = Object.entries(formData).reduce((acc, [key, value]) => {
            // Logic for localidad: only include if city is BOGOTA
            if (key === 'localidad') {
                if (formData.ciudad === 'BOGOTA' && value) {
                    acc[key] = value;
                } else {
                    acc[key] = null; // Send null to clear it if it was set
                }
                return acc;
            }

            if (value === '' || value === undefined) {
                acc[key] = null;
            } else {
                acc[key] = value;
            }
            return acc;
        }, {});

        // Specific modifications for numeric fields if they are strings
        if (cleanData.asignacion_salarial) {
            // Remove dots (thousands separators) before parsing
            const salaryString = cleanData.asignacion_salarial.toString().replace(/\./g, '');
            cleanData.asignacion_salarial = parseInt(salaryString, 10);
        }
        if (cleanData.cantidad_hijos) {
            cleanData.cantidad_hijos = parseInt(cleanData.cantidad_hijos, 10);
        }

        try {
            await onSubmit(cleanData);
        } catch (err) {
            setSubmitError(err.message || 'Error al guardar cambios');
        }
    };

    // --- Options (Reused) ---
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
        { value: 'COLPENSIONES', label: 'Colpensiones' },
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
    const cantidadHijosOptions = Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: String(i) }));


    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-xl overflow-hidden max-w-4xl w-full mx-auto max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-5 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                        <User className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Editar Empleado</h2>
                        <p className="text-blue-100 text-sm">Actualizar información completa sin notificaciones</p>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-gray-50 border-b border-gray-200 px-8 py-4 shrink-0">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex flex-col items-center relative z-10">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step === s
                                    ? 'bg-blue-600 text-white shadow-lg scale-110 ring-4 ring-blue-100'
                                    : step > s
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 text-gray-500'
                                    }`}
                            >
                                {step > s ? <CheckCircle2 className="h-6 w-6" /> : s}
                            </div>
                            <span className={`text-xs mt-2 font-medium ${step === s ? 'text-blue-700' : 'text-gray-500'}`}>
                                {s === 1 ? 'Personal' : s === 2 ? 'Laboral' : 'Tecnología'}
                            </span>
                        </div>
                    ))}
                    {/* Connecting lines would go here but CSS complexity is high for inline, skipping for brevity */}
                </div>
            </div>

            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">

                    {submitError && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-red-700 whitespace-pre-line">{submitError}</div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                <h4 className="font-semibold text-blue-900">👤 Datos Personales</h4>
                                <p className="text-sm text-blue-700 mt-1">Información básica del empleado</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    label="Cédula"
                                    name="cedula"
                                    value={formData.cedula}
                                    disabled={true} // Siempre deshabilitado en edición
                                    required
                                    icon={User}
                                />
                                <FormField
                                    label="Nombre Completo"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.nombre && errors.nombre}
                                    required
                                    disabled={isSubmitting}
                                />
                                <FormField
                                    label="Celular"
                                    name="celular"
                                    value={formData.celular}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.celular && errors.celular}
                                    required
                                    disabled={isSubmitting}
                                />
                                <FormField
                                    label="Correo Personal"
                                    name="correo_personal"
                                    value={formData.correo_personal}
                                    onChange={handleEmailChange}
                                    onBlur={handleEmailBlur}
                                    error={touched.correo_personal && errors.correo_personal}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                                <h4 className="font-semibold text-green-900">💼 Datos Laborales</h4>
                                <p className="text-sm text-green-700 mt-1">Información del puesto y área de trabajo</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField label="Cargo" name="cargo" type="select" value={formData.cargo} onChange={handleChange} onBlur={handleBlur} options={cargos.map(c => ({ value: c, label: c }))} error={touched.cargo && errors.cargo} required disabled={isSubmitting} />
                                <FormField label="Área" name="area" type="select" value={formData.area} onChange={handleChange} onBlur={handleBlur} options={areas.map(a => ({ value: a, label: a }))} error={touched.area && errors.area} required disabled={isSubmitting} />
                                <FormField label="Fecha de Ingreso" name="fecha_ingreso" type="date" value={formData.fecha_ingreso} onChange={handleChange} onBlur={handleBlur} error={touched.fecha_ingreso && errors.fecha_ingreso} required disabled={isSubmitting} />
                                <FormField label="Tipo de Contrato" name="contrato" type="select" value={formData.contrato} onChange={handleChange} onBlur={handleBlur} options={tiposContrato} error={touched.contrato && errors.contrato} required disabled={isSubmitting} />
                            </div>

                            {formData.contrato === 'TEMPORAL' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField label="Nombre de la Temporal" name="nombre_temporal" value={formData.nombre_temporal} onChange={handleChange} onBlur={handleBlur} error={touched.nombre_temporal && errors.nombre_temporal} required disabled={isSubmitting} icon={Briefcase} />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SelectJefeInmediato cargo={formData.cargo} value={formData.jefe_inmediato} onChange={handleChange} onBlur={handleBlur} error={touched.jefe_inmediato && errors.jefe_inmediato} disabled={isSubmitting} required />
                            </div>

                            {/* Sección Contractual (para PLANTA) */}
                            {formData.contrato === 'PLANTA' && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4 mb-4">
                                    <h5 className="font-semibold text-yellow-900 mb-2">Información Contractual</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField label="Asignación Salarial" name="asignacion_salarial" value={formData.asignacion_salarial} onChange={handleSalarioChange} placeholder="Ej: 1.500.000" required disabled={isSubmitting} icon={Briefcase} />
                                        <FormField label="Tipo Contrato Laboral" name="tipo_contrato_laboral" type="select" value={formData.tipo_contrato_laboral} onChange={handleChange} options={[{ value: 'FIJO', label: 'Fijo' }, { value: 'INDEFINIDO', label: 'Indefinido' }]} />
                                        <FormField label="Fecha Terminación" name="fecha_terminacion_contrato" type="date" value={formData.fecha_terminacion_contrato} onChange={handleChange} />
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-gray-200 pt-4 mt-4">
                                <h5 className="font-semibold text-gray-700 mb-4">Información Adicional</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField label="Fecha Nacimiento" name="fecha_nacimiento" type="date" value={formData.fecha_nacimiento} onChange={handleChange} required />
                                    <FormField label="Género" name="genero" type="select" value={formData.genero} onChange={handleChange} options={[{ value: 'MASCULINO', label: 'Masculino' }, { value: 'FEMENINO', label: 'Femenino' }, { value: 'OTRO', label: 'Otro' }]} required />
                                    <FormField label="Ciudad" name="ciudad" type="select" value={formData.ciudad} onChange={handleChange} options={ciudadesOptions} required />
                                    {formData.ciudad === 'BOGOTA' && (
                                        <FormField label="Localidad" name="localidad" type="select" value={formData.localidad} onChange={handleChange} options={localidadesBogotaOptions} required />
                                    )}
                                    <FormField label="Lugar Trabajo" name="lugar" type="select" value={formData.lugar} onChange={handleChange} options={lugarTrabajoOptions} required />
                                    <FormField label="Dirección Residencia" name="direccion_residencia" value={formData.direccion_residencia} onChange={handleChange} required />

                                    {/* Seguridad Social */}
                                    <FormField label="EPS" name="eps" type="select" value={formData.eps} onChange={handleChange} options={epsOptions} required />
                                    <FormField label="Fondo Pensiones" name="fondo_pensiones" type="select" value={formData.fondo_pensiones} onChange={handleChange} options={fondosPensionesOptions} required />
                                    <FormField label="ARL" name="arl" type="select" value={formData.arl} onChange={handleChange} options={arlOptions} required />

                                    {/* Familia y Emergencia */}
                                    <FormField label="Cantidad Hijos" name="cantidad_hijos" type="select" value={formData.cantidad_hijos} onChange={handleChange} options={cantidadHijosOptions} required />
                                    <FormField label="Contacto Emergencia (Nombre)" name="contacto_emergencia_nombre" value={formData.contacto_emergencia_nombre} onChange={handleEmergencyNameChange} required />
                                    <FormField label="Contacto Emergencia (Tel)" name="contacto_emergencia_telefono" value={formData.contacto_emergencia_telefono} onChange={handleEmergencyPhoneChange} required />
                                </div>
                            </div>

                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                                <h4 className="font-semibold text-purple-900">💻 Información Tecnológica</h4>
                                <p className="text-sm text-purple-700 mt-1">Credenciales y accesos (Edición Avanzada)</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField label="Correo Renovar" name="correo_renovar" type="email" value={formData.correo_renovar} onChange={handleEmailChange} onBlur={handleBlur} />
                                <FormField label="Usuario Red" name="usuario_red" value={formData.usuario_red} onChange={handleChange} />
                                <FormField label="Adminfo" name="adminfo" value={formData.adminfo} onChange={handleChange} />
                                <FormField label="Asignación" name="asignacion" value={formData.asignacion} onChange={handleChange} />
                                <FormField label="Extensión 3CX" name="extension_3cx" value={formData.extension_3cx} onChange={handleChange} />
                                <FormField label="Cola 3CX" name="cola_3cx" value={formData.cola_3cx} onChange={handleChange} />
                            </div>

                            <div className="bg-gray-100 p-4 rounded-md mt-4">
                                <p className="text-xs text-gray-500 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Nota: Los cambios realizados aquí se guardarán silenciosamente y NO enviarán notificaciones automáticas al empleado ni a otras áreas.
                                </p>
                            </div>
                        </div>
                    )}

                </form>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 border-t border-gray-200 px-8 py-5 flex justify-between items-center shrink-0">
                <button
                    type="button"
                    onClick={step === 1 ? onCancel : handlePrev}
                    className="px-6 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                    disabled={isSubmitting}
                >
                    {step === 1 ? 'Cancelar' : 'Atrás'}
                </button>

                {step < 3 ? (
                    <button
                        type="button"
                        onClick={handleNext}
                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
                    >
                        Siguiente
                        <CheckCircle2 className="h-5 w-5" />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader className="h-5 w-5 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default EditPersonalForm;
