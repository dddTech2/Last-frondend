import React from 'react';
import { Loader2, User, Mail, Phone, CreditCard, Briefcase, Building2, Calendar, Shield, Home, MapPin, Users, Clock, FileText, UserCheck, Wifi, Hash, AlertTriangle } from 'lucide-react';

// Helpers
const toTitle = (str) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

const formatDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  // Ajustar por zona horaria para evitar cambio de día
  const adjustedDate = new Date(d.valueOf() + d.getTimezoneOffset() * 60000);
  return adjustedDate.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
};

const InfoPill = ({ children, color = 'slate' }) => {
  const pillVariants = {
    emerald: 'bg-emerald-100 text-emerald-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    slate: 'bg-slate-100 text-slate-700',
    rose: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-800',
  };
  const classes = pillVariants[color] || pillVariants.slate;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>
      {children}
    </span>
  );
};

const Row = ({ icon: Icon, label, value }) => {
  // Mostrar siempre la fila, incluso si está vacía
  const displayValue = (value === null || value === undefined || value === '') ? '---' : value;

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-md bg-slate-100 p-1.5 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-800 break-words">{String(displayValue)}</p>
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="border-t border-slate-200 pt-4 mt-4 first:mt-0 first:pt-0 first:border-t-0">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">{title}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
  </div>
);

const PersonalDetailView = ({ personal, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!personal) {
    return <p className="text-center text-gray-500 py-10">No se pudo cargar la información del empleado.</p>;
  }

  const {
    nombre,
    cedula,
    cargo,
    area,
    estado,
    correo_personal,
    correo_renovar,
    celular,
    extension_3cx,
    contrato,
    fecha_ingreso,
    jefe_inmediato,
    ciudad,
    direccion,
    fecha_nacimiento,
    genero,
    lugar,
    eps,
    pensiones,
    arl,
    contacto_emergencia,
    telefono_emergencia,
    hijos_cantidad,
    temporal,
    fecha_fin_contrato_temporal,
    cola_3cx,
    usuario_red,
    adminfo,
    asignacion,
    // Nuevos campos contractuales
    asignacion_salarial,
    tipo_contrato_laboral,
    fecha_terminacion_contrato,
    observaciones_contrato,
    // Campos de retiro
    motivo_retiro,
    fecha_retiro_deseada,
    observacion_retiro,
    fecha_retiro,
    usuario_que_retiro,
  } = personal;

  const estadoColor = estado === 'ACTIVO' ? 'emerald' : 'rose';

  return (
    <div className="w-full max-w-5xl mx-auto overflow-x-hidden">
      {/* Header */}
      <div className="flex items-start gap-4 p-5 rounded-xl bg-white shadow-sm border border-slate-200 mb-4">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-lg">
          {getInitials(nombre) || <User className="h-6 w-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 truncate mr-2">{nombre || 'Empleado'}</h2>
            <InfoPill color={estadoColor}>{toTitle(estado)}</InfoPill>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {correo_renovar && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${correo_renovar}`} className="hover:underline break-all">{correo_renovar}</a>
              </div>
            )}
            {celular && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="h-4 w-4" />
                <a href={`tel:${celular}`} className="hover:underline">{celular}</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl bg-white shadow-sm border border-slate-200 p-5 space-y-4">
        <Section title="Información Laboral">
          <Row icon={Briefcase} label="Cargo" value={cargo} />
          <Row icon={Building2} label="Área" value={area} />
          <Row icon={UserCheck} label="Jefe Inmediato" value={jefe_inmediato} />
          <Row icon={FileText} label="Tipo de Contrato" value={contrato} />
          <Row icon={Calendar} label="Fecha de Ingreso" value={formatDate(fecha_ingreso)} />
          <Row icon={Clock} label="Temporal" value={temporal} />
          {fecha_fin_contrato_temporal && <Row icon={Calendar} label="Fin Contrato Temporal" value={formatDate(fecha_fin_contrato_temporal)} />}

          {/* Nuevos campos contractuales */}
          {asignacion_salarial && (
            <Row icon={CreditCard} label="Asignación Salarial" value={`$${Number(asignacion_salarial).toLocaleString('es-CO')}`} />
          )}
          {tipo_contrato_laboral && (
            <Row icon={FileText} label="Tipo de Contrato Laboral" value={tipo_contrato_laboral === 'FIJO' ? 'Fijo' : 'Indefinido'} />
          )}
          {tipo_contrato_laboral === 'FIJO' && fecha_terminacion_contrato && (
            <Row icon={Calendar} label="Fecha Terminación de Contrato" value={formatDate(fecha_terminacion_contrato)} />
          )}
          {observaciones_contrato && (
            <Row icon={FileText} label="Observaciones de Contrato" value={observaciones_contrato} />
          )}
        </Section>

        <Section title="Información de Contacto y Sistemas">
          <Row icon={Mail} label="Correo Renovar (Corporativo)" value={correo_renovar} />
          <Row icon={Mail} label="Correo Personal" value={correo_personal} />
          <Row icon={Phone} label="Extensión 3CX" value={extension_3cx} />
          <Row icon={Phone} label="Cola 3CX" value={cola_3cx} />
          <Row icon={Wifi} label="Usuario de Red" value={usuario_red} />
          <Row icon={UserCheck} label="Asignación" value={asignacion} />
          <Row icon={Hash} label="Código Adminfo" value={adminfo} />
        </Section>

        <Section title="Información Personal">
          <Row icon={CreditCard} label="Cédula" value={cedula} />
          <Row icon={Calendar} label="Fecha de Nacimiento" value={formatDate(fecha_nacimiento)} />
          <Row icon={Users} label="Género" value={genero} />
          <Row icon={MapPin} label="Lugar de Expedición/Nacimiento" value={lugar} />
          <Row icon={Home} label="Dirección" value={direccion} />
          <Row icon={MapPin} label="Ciudad" value={ciudad} />
          <Row icon={Users} label="Número de Hijos" value={hijos_cantidad} />
        </Section>

        <Section title="Seguridad Social">
          <Row icon={Shield} label="EPS" value={eps} />
          <Row icon={Shield} label="Fondo de Pensiones" value={pensiones} />
          <Row icon={Shield} label="ARL" value={arl} />
        </Section>

        <Section title="Contacto de Emergencia">
          <Row icon={User} label="Nombre Contacto" value={contacto_emergencia} />
          <Row icon={Phone} label="Teléfono Contacto" value={telefono_emergencia} />
        </Section>

        {/* Sección de Retiro (solo si hay datos) */}
        {(estado === 'PENDIENTE_RETIRO_JURIDICO' || estado === 'RETIRADO' || motivo_retiro) && (
          <Section title="Información de Retiro">
            <Row icon={AlertTriangle} label="Motivo de Retiro" value={motivo_retiro} />
            <Row icon={Calendar} label="Fecha de Retiro Deseada" value={formatDate(fecha_retiro_deseada)} />
            {fecha_retiro && <Row icon={Calendar} label="Fecha de Retiro Efectiva" value={formatDate(fecha_retiro)} />}
            {observacion_retiro && <Row icon={FileText} label="Observaciones de Retiro" value={observacion_retiro} />}
            {usuario_que_retiro && <Row icon={UserCheck} label="Solicitado por" value={usuario_que_retiro} />}
          </Section>
        )}
      </div>
    </div>
  );
};

export default PersonalDetailView;