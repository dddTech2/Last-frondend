import React, { useState, useEffect } from 'react';
import { Loader2, User, Mail, Phone, CreditCard, Briefcase, Building2, Calendar, Shield, Home, MapPin, Users, Clock, FileText, UserCheck, Wifi, Hash, AlertTriangle, History, ArrowRightLeft, FileSpreadsheet } from 'lucide-react';
import * as api from '../services/api';

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

const formatDateTime = (value) => {
  if (!value) return '---';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const InfoPill = ({ children, color = 'slate' }) => {
  const pillVariants = {
    emerald: 'bg-emerald-100 text-emerald-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    slate: 'bg-slate-100 text-slate-700',
    rose: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-800',
  };
  const classes = pillVariants[color] || pillVariants.slate;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>
      {children}
    </span>
  );
};

const Row = ({ icon: Icon, label, value }) => {
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
  const [activeTab, setActiveTab] = useState('general');

  // Estados para historial de contratos y movimientos
  const [contractHistory, setContractHistory] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [contractsFetched, setContractsFetched] = useState(false);

  const [movementHistory, setMovementHistory] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movementsFetched, setMovementsFetched] = useState(false);

  // Cargar historial de contratos cuando se selecciona esa pestaña
  useEffect(() => {
    if (activeTab === 'contracts' && personal?.cedula && !contractsFetched) {
      const fetchContracts = async () => {
        setLoadingContracts(true);
        try {
          const res = await api.getContractHistory(personal.cedula);
          setContractHistory(Array.isArray(res) ? res : res?.items || []);
        } catch (error) {
          console.error('Error fetching contract history:', error);
          setContractHistory([]);
        } finally {
          setLoadingContracts(false);
          setContractsFetched(true);
        }
      };
      fetchContracts();
    }
  }, [activeTab, personal?.cedula, contractsFetched]);

  // Cargar historial de movimientos cuando se selecciona esa pestaña
  useEffect(() => {
    if (activeTab === 'movements' && personal?.cedula && !movementsFetched) {
      const fetchMovements = async () => {
        setLoadingMovements(true);
        try {
          const res = await api.getMovementHistory(personal.cedula);
          setMovementHistory(Array.isArray(res) ? res : res?.items || []);
        } catch (error) {
          console.error('Error fetching movement history:', error);
          setMovementHistory([]);
        } finally {
          setLoadingMovements(false);
          setMovementsFetched(true);
        }
      };
      fetchMovements();
    }
  }, [activeTab, personal?.cedula, movementsFetched]);

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
    asignacion_salarial,
    tipo_contrato_laboral,
    fecha_terminacion_contrato,
    observaciones_contrato,
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

      {/* Navegación por Pestañas */}
      <div className="flex border-b border-slate-200 mb-4 bg-white rounded-t-xl px-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Información General</span>
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'contracts'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Contratos Anteriores</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'movements'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Historial de Movimientos</span>
        </button>
      </div>

      {/* Contenido Pestaña 1: Información General */}
      {activeTab === 'general' && (
        <div className="rounded-xl bg-white shadow-sm border border-slate-200 p-5 space-y-4">
          <Section title="Información Laboral">
            <Row icon={Briefcase} label="Cargo" value={cargo} />
            <Row icon={Building2} label="Área" value={area} />
            <Row icon={UserCheck} label="Jefe Inmediato" value={jefe_inmediato} />
            <Row icon={FileText} label="Tipo de Contrato" value={contrato} />
            <Row icon={Calendar} label="Fecha de Ingreso" value={formatDate(fecha_ingreso)} />
            <Row icon={Clock} label="Temporal" value={temporal} />
            {fecha_fin_contrato_temporal && <Row icon={Calendar} label="Fin Contrato Temporal" value={formatDate(fecha_fin_contrato_temporal)} />}

            {/* Campos contractuales */}
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
      )}

      {/* Contenido Pestaña 2: Contratos Anteriores */}
      {activeTab === 'contracts' && (
        <div className="rounded-xl bg-white shadow-sm border border-slate-200 p-5">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-600" />
            Historial de Contratos y Vinculaciones Pasadas
          </h3>

          {loadingContracts ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mr-2" />
              <span className="text-slate-600 text-sm">Cargando contratos anteriores...</span>
            </div>
          ) : contractHistory.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              <History className="h-10 w-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">Sin contratos anteriores archivados</p>
              <p className="text-xs text-slate-500 mt-1">Este empleado no registra vinculaciones finalizadas previamente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 rounded-l-lg">Período</th>
                    <th className="py-3 px-4">Tipo Contrato</th>
                    <th className="py-3 px-4">Fecha Ingreso</th>
                    <th className="py-3 px-4">Fecha Retiro</th>
                    <th className="py-3 px-4">Motivo Retiro</th>
                    <th className="py-3 px-4">Observación</th>
                    <th className="py-3 px-4 rounded-r-lg">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {contractHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">#{item.numero_periodo || idx + 1}</td>
                      <td className="py-3 px-4 text-slate-700">{item.tipo_contrato || '---'}</td>
                      <td className="py-3 px-4 text-slate-700">{formatDate(item.fecha_ingreso) || '---'}</td>
                      <td className="py-3 px-4 text-slate-700">{formatDate(item.fecha_retiro) || '---'}</td>
                      <td className="py-3 px-4 text-slate-700">{item.motivo_retiro || '---'}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs max-w-xs truncate">{item.observacion_retiro || '---'}</td>
                      <td className="py-3 px-4">
                        <InfoPill color={item.estado_periodo === 'FINALIZADO' ? 'slate' : 'emerald'}>
                          {item.estado_periodo || 'FINALIZADO'}
                        </InfoPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Contenido Pestaña 3: Historial de Movimientos */}
      {activeTab === 'movements' && (
        <div className="rounded-xl bg-white shadow-sm border border-slate-200 p-5">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
            Auditoría y Historial de Movimientos Internos
          </h3>

          {loadingMovements ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
              <span className="text-slate-600 text-sm">Cargando historial de movimientos...</span>
            </div>
          ) : movementHistory.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              <ArrowRightLeft className="h-10 w-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">Sin movimientos registrados</p>
              <p className="text-xs text-slate-500 mt-1">No hay auditoría de cambios organizacionales recientes para este empleado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 rounded-l-lg">Tipo Movimiento</th>
                    <th className="py-3 px-4">Fecha / Hora</th>
                    <th className="py-3 px-4">Campo Modificado</th>
                    <th className="py-3 px-4">Valor Anterior</th>
                    <th className="py-3 px-4 rounded-r-lg">Valor Nuevo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {movementHistory.map((mov, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <InfoPill color="indigo">
                          {toTitle(mov.tipo_movimiento || 'CAMBIO')}
                        </InfoPill>
                      </td>
                      <td className="py-3 px-4 text-slate-700 text-xs font-medium">
                        {formatDateTime(mov.fecha_movimiento)}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-semibold uppercase text-xs">
                        {mov.campo_modificado ? mov.campo_modificado.replace(/_/g, ' ') : '---'}
                      </td>
                      <td className="py-3 px-4 text-rose-700 bg-rose-50/50 rounded text-xs font-medium">
                        {mov.valor_anterior || '---'}
                      </td>
                      <td className="py-3 px-4 text-emerald-700 bg-emerald-50/50 rounded text-xs font-medium">
                        {mov.valor_nuevo || '---'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PersonalDetailView;