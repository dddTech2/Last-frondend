import React, { useEffect, useMemo, useState } from 'react';
import EmailPreview from './wizards/EmailPreview';
import WhatsAppPreview from './WhatsAppPreview';
import { getAllCampaigns, getTemplateById, getSimpleFilters, BASE_URL, downloadCampaignLogReport } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import SimpleFilterRulesPreview from './wizards/SimpleFilterRulesPreview';

const getChannelInfo = (channel) => {
  switch ((channel || '').toLowerCase()) {
    case 'whatsapp':
      return { icon: '💬', name: 'WhatsApp' };
    case 'sms':
      return { icon: '📲', name: 'SMS' };
    case 'email':
      return { icon: '📧', name: 'Email' };
    default:
      return { icon: '📢', name: channel || '—' };
  }
};

const getStatusBadge = (status) => {
  const lower = (status || '').toLowerCase();
  if (lower.includes('completed') || lower.includes('completada')) return 'bg-green-100 text-green-800';
  if (lower.includes('error')) return 'bg-red-100 text-red-800';
  if (lower.includes('sending') || lower.includes('enviando')) return 'bg-orange-100 text-orange-800';
  if (lower.includes('scheduled') || lower.includes('programada')) return 'bg-blue-100 text-blue-800';
  if (lower.includes('pending') || lower.includes('pendiente')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
};

const formatDate = (iso) => (iso ? new Date(iso).toLocaleString() : 'N/A');

const KPI = ({ label, value, sub }) => (
  <div className="flex-1 bg-white border rounded-lg p-4 shadow-sm">
    <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
    <div className="text-2xl font-bold text-gray-800">{value}</div>
    {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
  </div>
);

// Skeleton helper
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const CampaignReportDrawer = ({ open, onClose, campaign }) => {
  const [fullCampaign, setFullCampaign] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audienceName, setAudienceName] = useState('Cargando...');
  const [audienceDefinition, setAudienceDefinition] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { getAccessToken } = useAuth();

  const channel = campaign?.channel_type;
  const channelInfo = getChannelInfo(channel || '');

  const enviados = campaign?.enviados ?? 0;
  const entregados = campaign?.entregados ?? 0;
  const leidos = campaign?.leidos ?? 0;
  const deliveryRate = enviados > 0 ? Math.round((entregados / enviados) * 100) : 0;
  const readRate = entregados > 0 ? Math.round((leidos / entregados) * 100) : 0;

  useEffect(() => {
    let ignore = false;
    const fetchDetails = async () => {
      if (!open || !campaign?.id) return;
      setLoading(true);
      setError(null);
      setTemplate(null);
      setFullCampaign(null);
      setAudienceName('Cargando...');
      setAudienceDefinition(null);

      try {
        // Siempre buscar la campaña completa primero
        const list = await getAllCampaigns();
        const found = Array.isArray(list)
          ? list.find(c => String(c?.id) === String(campaign.id) || String(c?.external_id || '') === String(campaign.id))
          : null;

        if (!ignore) {
          setFullCampaign(found || null);
        }

        // Cargar detalles de la audiencia si se encontró la campaña
        if (!ignore && found) {
          if (found.audience_filter_id) {
            try {
              const token = getAccessToken();
              const filters = await getSimpleFilters(token);
              const audience = filters.find(f => f.id === found.audience_filter_id);
              if (audience) {
                setAudienceName(audience.name);
                setAudienceDefinition(audience.definition);
              } else {
                setAudienceName('Filtro no encontrado');
                setAudienceDefinition(null);
              }
            } catch (audienceError) {
              setAudienceName('Error al cargar filtro');
            }
          } else if (found.audience_definition) {
            const definition = found.audience_definition;
            const generalCount = definition.general?.length || 0;
            const excludeCount = definition.exclude?.reduce((acc, group) => acc + group.length, 0) || 0;
            setAudienceName(`Filtro Ad-hoc (${generalCount + excludeCount} condiciones)`);
            setAudienceDefinition(definition);
          } else {
            setAudienceName('No definido');
            setAudienceDefinition(null);
          }
        } else if (!ignore) {
          // Si no se encontró la campaña completa
          setAudienceName('Información de audiencia no disponible');
        }

        // Cargar plantilla
        const templateId = found?.message_template_id || found?.template_id || found?.messageTemplateId || campaign?.message_template_id || campaign?.template_id;
        if (templateId) {
          const tpl = await getTemplateById(templateId);
          if (!ignore) setTemplate(tpl);
        } else if (!ignore) {
          setError('No se encontró el template asociado a la campaña.');
        }

      } catch (e) {
        if (!ignore) setError(e?.message || 'No se pudo cargar el detalle de la campaña.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchDetails();
    return () => { ignore = true; };
  }, [open, campaign?.id, getAccessToken]);

  const renderTemplatePreview = useMemo(() => {
    if (!template) {
      return (
        <div className="p-4 border rounded-md bg-gray-50 text-sm text-gray-600">
          La información de la plantilla no está disponible.
        </div>
      );
    }
    const tChannel = (template.channel_type || '').toUpperCase();
    if (tChannel === 'EMAIL') {
      return (
        <EmailPreview subject={template.subject} htmlContent={template.content} />
      );
    }
    if (tChannel === 'WHATSAPP') {
      const components = template.components || {};
      return (
        <WhatsAppPreview components={components} />
      );
    }
    // SMS u otros
    return (
      <div className="p-4 border rounded-md bg-gray-50 whitespace-pre-wrap text-gray-800">
        {template.content || 'Contenido no disponible'}
      </div>
    );
  }, [template]);

  const handleDownloadCSV = async () => {
    if (!fullCampaign) {
      toast.error("Los detalles de la campaña aún no se han cargado.");
      return;
    }
    setIsDownloading(true);
    toast.info("Preparando la descarga del CSV...");
    try {
      const response = await downloadCampaignLogReport(fullCampaign.id);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
      const serverFileName = decodeURIComponent(match?.[1] || match?.[2] || '');
      a.download = serverFileName || `reporte_${fullCampaign.id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Archivo CSV descargado con éxito.");

    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error al descargar el reporte.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl border-l flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-white/90 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
              {channelInfo.icon}
            </div>
            <div>
              <div className="text-base font-semibold text-gray-900">{campaign?.name || 'Campaña'}</div>
              <div className="text-xs text-gray-500">{channelInfo.name}</div>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(campaign?.status)}`}>
            {campaign?.status}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gray-50">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <KPI label="Enviados" value={enviados} />
            <KPI label="Entregados" value={entregados} sub={`${deliveryRate}% tasa de entrega`} />
            <KPI label="Leídos" value={leidos} sub={`${readRate}% tasa de lectura`} />
          </div>

          {/* Resumen */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="text-sm font-semibold text-gray-800 mb-3">Resumen de la Campaña</div>
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Última actualización</div>
                  <div className="text-gray-800 font-medium">{formatDate(campaign?.updated_at)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Programada para</div>
                  <div className="text-gray-800 font-medium">{fullCampaign?.scheduled_at ? formatDate(fullCampaign?.scheduled_at) : 'Envío inmediato'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Creada por</div>
                  <div className="text-gray-800 font-medium">{fullCampaign?.creator?.full_name || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Creada el</div>
                  <div className="text-gray-800 font-medium">{formatDate(fullCampaign?.created_at)}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-500">Audiencia</div>
                  <div className="text-gray-800 font-medium">{audienceName}</div>
                  <SimpleFilterRulesPreview definition={audienceDefinition} />
                </div>
                <div>
                  <div className="text-gray-500">Público Dirigido</div>
                  <div className="text-gray-800 font-medium">{fullCampaign?.target_role || 'No especificado'}</div>
                </div>
                {fullCampaign?.codebtor_strategy && (
                  <div>
                    <div className="text-gray-500">Estrategia Codeudor</div>
                    <div className="text-gray-800 font-medium">{fullCampaign.codebtor_strategy}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Plantilla usada */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-800">Plantilla usada</div>
              {loading ? (
                <Skeleton className="h-4 w-28" />
              ) : (
                template?.name && <div className="text-xs text-gray-500">{template.name}</div>
              )}
            </div>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-40 w-full" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : (
              renderTemplatePreview
            )}
            {!loading && template?.meta_template_name && (
              <div className="mt-3 text-xs text-gray-500">Meta name: {template.meta_template_name}</div>
            )}
          </div>

          {/* Mini barra de progreso visual */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="text-sm font-semibold text-gray-800 mb-3">Progreso</div>
            <div className="space-y-2">
              <div className="text-xs text-gray-600">Entregados</div>
              <div className="w-full h-2 bg-gray-200 rounded">
                <div className="h-2 bg-blue-500 rounded" style={{ width: `${deliveryRate}%` }} />
              </div>
              <div className="text-xs text-gray-600">Leídos</div>
              <div className="w-full h-2 bg-gray-200 rounded">
                <div className="h-2 bg-green-500 rounded" style={{ width: `${readRate}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white flex justify-between items-center">
          <button
            onClick={handleDownloadCSV}
            disabled={isDownloading || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isDownloading ? 'Descargando...' : 'Descargar Reporte CSV'}
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default CampaignReportDrawer;
