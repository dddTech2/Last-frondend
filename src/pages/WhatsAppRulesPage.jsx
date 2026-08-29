import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  UserCheck, 
  Users, 
  Sliders, 
  Save, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Code, 
  FileText, 
  Info,
  X,
  Megaphone,
  Eye,
  Power
} from 'lucide-react';
import { toast } from 'sonner';
import systemConfigurationService from '../services/systemConfigurationService';

export default function WhatsAppRulesPage() {
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);

  // Global WhatsApp rules state
  const [rulesData, setRulesData] = useState({
    grace_period_days: 15,
    max_sent_attempts: 3,
    max_templates_per_client_day: 1,
    max_templates_per_agent_day: 50,
    template_rules: {},
    all_configurations: [],
  });

  const [formValues, setFormValues] = useState({
    grace_period_days: 15,
    max_sent_attempts: 3,
    max_templates_per_client_day: 1,
    max_templates_per_agent_day: 50,
  });

  // Banner state
  const [bannerForm, setBannerForm] = useState({
    enabled: true,
    title: 'Atención',
    text: 'El servicio de WhatsApp se encuentra actualmente en mantenimiento. Por favor, evite utilizar este módulo hasta que se restablezca el servicio.',
    type: 'warning', // warning, info, danger, success
    dismissible: true,
  });

  // Modal for template rule / custom configuration
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('template'); // 'template' | 'custom'
  const [modalForm, setModalForm] = useState({
    key: '',
    value: '',
    description: '',
    type: 'json',
  });
  const [savingModal, setSavingModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rules, banner] = await Promise.all([
        systemConfigurationService.getWhatsAppRules(),
        systemConfigurationService.getPublicBanner(),
      ]);

      setRulesData(rules);
      setFormValues({
        grace_period_days: rules.grace_period_days,
        max_sent_attempts: rules.max_sent_attempts,
        max_templates_per_client_day: rules.max_templates_per_client_day,
        max_templates_per_agent_day: rules.max_templates_per_agent_day,
      });

      if (banner) {
        setBannerForm({
          enabled: banner.enabled,
          title: banner.title || 'Atención',
          text: banner.text || '',
          type: banner.type || 'warning',
          dismissible: banner.dismissible ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast.error('Error al cargar las configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGlobalRules = async (e) => {
    e.preventDefault();
    setSavingGlobal(true);
    try {
      await Promise.all([
        systemConfigurationService.upsert(
          'GRACE_PERIOD_DAYS',
          formValues.grace_period_days,
          'Días calendario de espera antes de poder reenviar una plantilla si el cliente no responde',
          'integer'
        ),
        systemConfigurationService.upsert(
          'MAX_SENT_ATTEMPTS',
          formValues.max_sent_attempts,
          'Máximo número de intentos fallidos (estado sent) antes de marcar el número como inefectivo',
          'integer'
        ),
        systemConfigurationService.upsert(
          'MAX_TEMPLATES_PER_CLIENT_DAY',
          formValues.max_templates_per_client_day,
          'Máximo número de plantillas distintas que se le pueden enviar a un mismo cliente por día',
          'integer'
        ),
        systemConfigurationService.upsert(
          'MAX_TEMPLATES_PER_AGENT_DAY',
          formValues.max_templates_per_agent_day,
          'Máximo número de plantillas que un gestor puede enviar por día',
          'integer'
        ),
      ]);

      toast.success('Reglas globales de WhatsApp actualizadas correctamente');
      loadData();
    } catch (error) {
      console.error('Error saving global rules:', error);
      toast.error(error.message || 'Error al guardar las reglas');
    } finally {
      setSavingGlobal(false);
    }
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    setSavingBanner(true);
    try {
      await systemConfigurationService.saveBannerConfig(bannerForm);
      toast.success(
        bannerForm.enabled
          ? 'Aviso del Dashboard activado y actualizado correctamente'
          : 'Aviso del Dashboard desactivado'
      );
      loadData();
    } catch (error) {
      console.error('Error saving banner config:', error);
      toast.error(error.message || 'Error al guardar el aviso');
    } finally {
      setSavingBanner(false);
    }
  };

  const handleOpenEditTemplateRule = (templateName, ruleContent) => {
    setModalMode('template');
    setModalForm({
      key: `TEMPLATE_RULES:${templateName}`,
      value: typeof ruleContent === 'string' ? ruleContent : JSON.stringify(ruleContent, null, 2),
      description: `Reglas de elegibilidad para el envío de la plantilla '${templateName}'`,
      type: 'json',
    });
    setIsModalOpen(true);
  };

  const handleOpenNewTemplateRule = () => {
    setModalMode('template');
    setModalForm({
      key: 'TEMPLATE_RULES:nueva_plantilla',
      value: JSON.stringify({
        conditions: [
          { field: "resultado_gestor", op: "in", value: ["POSIBLE NEGOCIACIÓN"] },
          { field: "fecha_ultima_gestion_prejuridica", op: "max_days_ago", value: 60 }
        ]
      }, null, 2),
      description: 'Reglas de elegibilidad para plantilla de WhatsApp',
      type: 'json',
    });
    setIsModalOpen(true);
  };

  const handleOpenNewCustomConfig = () => {
    setModalMode('custom');
    setModalForm({
      key: '',
      value: '',
      description: '',
      type: 'string',
    });
    setIsModalOpen(true);
  };

  const handleSaveModalForm = async (e) => {
    e.preventDefault();
    if (!modalForm.key.trim() || !modalForm.value.trim()) {
      toast.error('La clave y el valor son obligatorios');
      return;
    }

    if (modalForm.type === 'json') {
      try {
        JSON.parse(modalForm.value);
      } catch (err) {
        toast.error('El formato JSON ingresado es inválido: ' + err.message);
        return;
      }
    }

    setSavingModal(true);
    try {
      await systemConfigurationService.upsert(
        modalForm.key.trim(),
        modalForm.value.trim(),
        modalForm.description.trim(),
        modalForm.type
      );
      toast.success(`Configuración '${modalForm.key}' guardada exitosamente`);
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error(error.message || 'Error al guardar la configuración');
    } finally {
      setSavingModal(false);
    }
  };

  const handleDeleteConfig = async (key) => {
    if (!window.confirm(`¿Estás seguro de eliminar la regla '${key}'?`)) return;
    try {
      await systemConfigurationService.delete(key);
      toast.success(`Regla '${key}' eliminada`);
      loadData();
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error(error.message || 'Error al eliminar');
    }
  };

  const getPreviewStyles = (type) => {
    switch (type) {
      case 'danger':
        return {
          container: 'bg-rose-50 border-rose-200 text-rose-900',
          icon: <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />,
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-900',
          icon: <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />,
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case 'success':
        return {
          container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />,
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      case 'warning':
      default:
        return {
          container: 'bg-amber-50 border-amber-200 text-amber-900',
          icon: <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />,
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
        };
    }
  };

  const previewStyles = getPreviewStyles(bannerForm.type);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-semibold text-emerald-200 backdrop-blur-md">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            Políticas y Validaciones de Mensajería
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Reglas de WhatsApp y Sistema</h1>
          <p className="text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            Configura avisos en vivo para el Dashboard, límites de frecuencia, períodos de gracia y condiciones dinámicas 
            de elegibilidad que controlan el envío de plantillas.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-all cursor-pointer"
            title="Recargar reglas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. SECCIÓN: BANNER Y AVISOS DEL DASHBOARD */}
      <form onSubmit={handleSaveBanner} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-500" />
              Aviso y Banner Informativo del Dashboard
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Controla el comunicado de mantenimiento o noticias operativas visible para todos los asesores en la página principal
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setBannerForm({ ...bannerForm, enabled: !bannerForm.enabled })}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                bannerForm.enabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Power className={`w-3.5 h-3.5 ${bannerForm.enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
              {bannerForm.enabled ? 'Banner ACTIVO' : 'Banner DESACTIVADO'}
            </button>

            <button
              type="submit"
              disabled={savingBanner || loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingBanner ? 'Guardando...' : 'Guardar Aviso'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Título del Aviso
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Atención, Mantenimiento Programado..."
              value={bannerForm.title}
              onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold text-slate-800"
            />
          </div>

          {/* Tipo de Alerta */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estilo / Severidad
            </label>
            <select
              value={bannerForm.type}
              onChange={(e) => setBannerForm({ ...bannerForm, type: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white text-slate-800 font-medium"
            >
              <option value="warning">⚠️ Advertencia (Ámbar / Amarillo)</option>
              <option value="info">ℹ️ Informativo (Azul)</option>
              <option value="danger">🛑 Peligro / Urgente (Rojo)</option>
              <option value="success">✅ Éxito / Restablecido (Verde)</option>
            </select>
          </div>

          {/* Permitir Cerrar */}
          <div className="flex items-center gap-3 pt-6">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={bannerForm.dismissible}
                onChange={(e) => setBannerForm({ ...bannerForm, dismissible: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
              />
              Permitir a los usuarios cerrar el aviso temporalmente (X)
            </label>
          </div>

          {/* Mensaje */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contenido del Mensaje
            </label>
            <textarea
              rows={2}
              required
              placeholder="Escribe el mensaje que se mostrará en el Dashboard..."
              value={bannerForm.text}
              onChange={(e) => setBannerForm({ ...bannerForm, text: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 text-slate-800"
            />
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <Eye className="w-3.5 h-3.5" />
            Vista Previa en Vivo (Así se verá en el Dashboard)
          </div>

          {bannerForm.enabled ? (
            <div className={`p-4 border rounded-2xl flex items-center justify-between gap-3 shadow-xs ${previewStyles.container}`}>
              <div className="flex items-center gap-3">
                {previewStyles.icon}
                <div className="text-sm">
                  <span className="font-bold">{bannerForm.title || 'Aviso'}:</span>{' '}
                  <span className="text-gray-800 font-medium">{bannerForm.text || 'Sin contenido'}</span>
                </div>
              </div>

              {bannerForm.dismissible && (
                <button
                  type="button"
                  className="p-1 hover:bg-black/5 rounded-lg text-gray-500"
                  title="Cerrar aviso"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-slate-400 font-medium">
              El banner se encuentra desactivado. No será visible para los asesores.
            </div>
          )}
        </div>
      </form>

      {/* 2. SECCIÓN: LÍMITES Y POLÍTICAS GLOBALES DE WHATSAPP */}
      <form onSubmit={handleSaveGlobalRules} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Límites y Políticas Globales de WhatsApp
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Valores aplicados en tiempo real por el servicio de validación antes de procesar envíos
            </p>
          </div>

          <button
            type="submit"
            disabled={savingGlobal || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {savingGlobal ? 'Guardando...' : 'Guardar Políticas'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* GRACE_PERIOD_DAYS */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Periodo de Gracia</span>
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="365"
                  required
                  value={formValues.grace_period_days}
                  onChange={(e) => setFormValues({ ...formValues, grace_period_days: parseInt(e.target.value) || 0 })}
                  className="w-24 px-3 py-2 text-xl font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900"
                />
                <span className="text-xs font-semibold text-slate-600">días calendario</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-tight">
                Tiempo de espera obligatorio antes de reenviar otra plantilla si el cliente no ha respondido.
              </p>
            </div>
          </div>

          {/* MAX_SENT_ATTEMPTS */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Reintentos Máximos</span>
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={formValues.max_sent_attempts}
                  onChange={(e) => setFormValues({ ...formValues, max_sent_attempts: parseInt(e.target.value) || 1 })}
                  className="w-24 px-3 py-2 text-xl font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900"
                />
                <span className="text-xs font-semibold text-slate-600">intentos fallidos</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-tight">
                Límite de fallos consecutivos antes de marcar el número como inefectivo para contactación.
              </p>
            </div>
          </div>

          {/* MAX_TEMPLATES_PER_CLIENT_DAY */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Máx. por Cliente / Día</span>
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={formValues.max_templates_per_client_day}
                  onChange={(e) => setFormValues({ ...formValues, max_templates_per_client_day: parseInt(e.target.value) || 1 })}
                  className="w-24 px-3 py-2 text-xl font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900"
                />
                <span className="text-xs font-semibold text-slate-600">plantillas / día</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-tight">
                Máximo de plantillas que un mismo cliente puede recibir en una sola jornada (anti-spam).
              </p>
            </div>
          </div>

          {/* MAX_TEMPLATES_PER_AGENT_DAY */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Máx. por Gestor / Día</span>
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={formValues.max_templates_per_agent_day}
                  onChange={(e) => setFormValues({ ...formValues, max_templates_per_agent_day: parseInt(e.target.value) || 1 })}
                  className="w-24 px-3 py-2 text-xl font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900"
                />
                <span className="text-xs font-semibold text-slate-600">envíos / asesor</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-tight">
                Cupo diario de envíos permitidos por asesor para garantizar distribución equilibrada.
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* 3. SECCIÓN: REGLAS DE ELEGIBILIDAD POR PLANTILLA */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Code className="w-5 h-5 text-indigo-600" />
              Reglas de Elegibilidad por Plantilla
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Condiciones lógicas que deben cumplir las obligaciones del cliente para permitir el envío de plantillas específicas
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNewTemplateRule}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nueva Regla de Plantilla
          </button>
        </div>

        {Object.keys(rulesData.template_rules).length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Info className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            No hay reglas dinámicas configuradas por plantilla actualmente
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(rulesData.template_rules).map(([templateName, ruleContent]) => (
              <div key={templateName} className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl font-mono text-xs font-bold">
                      {templateName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditTemplateRule(templateName, ruleContent)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Editar JSON de reglas"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteConfig(`TEMPLATE_RULES:${templateName}`)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Eliminar regla"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-xl p-3.5 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-56">
                  <pre>{typeof ruleContent === 'object' ? JSON.stringify(ruleContent, null, 2) : ruleContent}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. SECCIÓN: TABLA COMPLETA DE PARÁMETROS */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-700" />
              Tabla de Parámetros del Sistema (system_configurations)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Todas las claves almacenadas en base de datos para control operativo
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNewCustomConfig}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nueva Clave
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Clave (Key)</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rulesData.all_configurations.map((c) => (
                <tr key={c.key} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.key}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono border">
                      {c.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] max-w-xs truncate text-slate-700" title={c.value}>
                    {c.value}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{c.description || '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => {
                          setModalMode('custom');
                          setModalForm({
                            key: c.key,
                            value: c.value,
                            description: c.description || '',
                            type: c.type || 'string',
                          });
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteConfig(c.key)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                {modalMode === 'template' ? 'Configurar Regla de Plantilla' : 'Editar Parámetro del Sistema'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clave (Key) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="TEMPLATE_RULES:nombre_plantilla"
                  value={modalForm.key}
                  onChange={(e) => setModalForm({ ...modalForm, key: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Dato
                </label>
                <select
                  value={modalForm.type}
                  onChange={(e) => setModalForm({ ...modalForm, type: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="json">JSON</option>
                  <option value="integer">Entero (Integer)</option>
                  <option value="string">Texto (String)</option>
                  <option value="boolean">Booleano (True/False)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor {modalForm.type === 'json' && '(Estructura JSON)'} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={modalForm.type === 'json' ? 8 : 3}
                  required
                  value={modalForm.value}
                  onChange={(e) => setModalForm({ ...modalForm, value: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Propósito de este parámetro..."
                  value={modalForm.description}
                  onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingModal}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingModal ? 'Guardando...' : 'Guardar Parámetro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
