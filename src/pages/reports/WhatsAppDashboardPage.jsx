import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

import WhatsAppFilterBar from '../../components/reports/whatsapp/WhatsAppFilterBar';
import WhatsAppKPICards from '../../components/reports/whatsapp/WhatsAppKPICards';
import WhatsAppOriginKPICards from '../../components/reports/whatsapp/WhatsAppOriginKPICards';
import WhatsAppFunnelChart from '../../components/reports/whatsapp/WhatsAppFunnelChart';
import WhatsAppTrendChart from '../../components/reports/whatsapp/WhatsAppTrendChart';
import WhatsAppOriginPieChart from '../../components/reports/whatsapp/WhatsAppOriginPieChart';
import WhatsAppTopOriginsChart from '../../components/reports/whatsapp/WhatsAppTopOriginsChart';
import WhatsAppSystemOriginChart from '../../components/reports/whatsapp/WhatsAppSystemOriginChart';
import WhatsAppTouchesTable from '../../components/reports/whatsapp/WhatsAppTouchesTable';
import WhatsAppErrorChart from '../../components/reports/whatsapp/WhatsAppErrorChart';
import WhatsAppDataTable from '../../components/reports/whatsapp/WhatsAppDataTable';

import { getWhatsAppMessages, getWhatsAppPayments, getWhatsAppAgreements } from '../../services/api';

// ── Helper: fetch ALL pages from a paginated endpoint ──
const fetchAllPages = async (fetchFn, params) => {
  const pageSize = 1000;
  const firstPage = await fetchFn({ ...params, size: pageSize, page: 1 });
  if (!firstPage || !firstPage.items) return { items: [], total: 0 };

  const allItems = [...firstPage.items];
  const totalPages = firstPage.pages || 1;

  if (totalPages > 1) {
    const remaining = [];
    for (let p = 2; p <= totalPages; p++) {
      remaining.push(fetchFn({ ...params, size: pageSize, page: p }));
    }
    const results = await Promise.allSettled(remaining);
    results.forEach(res => {
      if (res.status === 'fulfilled' && res.value?.items) {
        allItems.push(...res.value.items);
      }
    });
  }

  return { items: allItems, total: firstPage.total || allItems.length };
};

// ── Helper: get first attributable touch from detalle_touches ──
// Only CAMPAIGN and COMMUNICATION can initiate a conversation,
// so AGENT_CHAT is excluded from first-touch attribution.
const getFirstTouch = (detalleTouches) => {
  if (!detalleTouches || !Array.isArray(detalleTouches) || detalleTouches.length === 0) return null;
  const sorted = [...detalleTouches].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  return sorted.find(t => t.tipo === 'CAMPAIGN' || t.tipo === 'COMMUNICATION') || null;
};

const WhatsAppDashboardPage = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    campaignId: '',
  });

  const [loading, setLoading] = useState(false);
  const [kpiData, setKpiData] = useState(null);
  const [funnelData, setFunnelData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [errorData, setErrorData] = useState([]);
  const [originKPIData, setOriginKPIData] = useState(null);
  const [originPieData, setOriginPieData] = useState([]);
  const [topOriginsData, setTopOriginsData] = useState([]);
  const [systemOriginData, setSystemOriginData] = useState([]);
  const [touchesData, setTouchesData] = useState(null);

  // Drill-down state
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedError, setSelectedError] = useState(null);

  const handleDateChange = (type, value) => {
    setFilters(prev => ({ ...prev, [type === 'start' ? 'startDate' : 'endDate']: value }));
    resetDrillDown();
  };

  const handleCampaignChange = (value) => {
    setFilters(prev => ({ ...prev, campaignId: value }));
    resetDrillDown();
  };

  const resetDrillDown = () => {
    setSelectedStage(null);
    setSelectedError(null);
  };

   const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Messages are filtered by send date (fecha_hora within the range)
      const msgParams = {
        start_date: filters.startDate,
        end_date: filters.endDate,
        ...(filters.campaignId && { campaign_id: filters.campaignId })
      };

      // Payments/Agreements are NOT filtered by date at the API level.
      // Instead we fetch all attributed records and filter client-side:
      // keep only those whose first attributable touch falls within the date range.
      const finParams = {
        ...(filters.campaignId && { campaign_id: filters.campaignId }),
        attributed_only: true,
      };

      // ── Phase 1: Funnel counts (cheap, size=1) ──
      const [sentCountRes, deliveredCountRes, readCountRes, failedCountRes] = await Promise.allSettled([
        getWhatsAppMessages({ ...msgParams, estado: 'SENT', size: 1, page: 1 }),
        getWhatsAppMessages({ ...msgParams, estado: 'DELIVERED', size: 1, page: 1 }),
        getWhatsAppMessages({ ...msgParams, estado: 'READ', size: 1, page: 1 }),
        getWhatsAppMessages({ ...msgParams, estado: 'FAILED', size: 1, page: 1 }),
      ]);

      const getTotal = (res) => res.status === 'fulfilled' && res.value ? (res.value.total || 0) : 0;

      const rawSent = getTotal(sentCountRes);
      const rawDelivered = getTotal(deliveredCountRes);
      const rawRead = getTotal(readCountRes);
      const failedCount = getTotal(failedCountRes);

      const cumulativeSent = rawSent + rawDelivered + rawRead;
      const cumulativeDelivered = rawDelivered + rawRead;
      const cumulativeRead = rawRead;

      // ── Phase 2: Fetch ALL items (auto-paginated) ──
      const [allMsgsResult, allFailedResult, allPayResult, allAgrResult] = await Promise.allSettled([
        fetchAllPages(getWhatsAppMessages, msgParams),
        fetchAllPages(getWhatsAppMessages, { ...msgParams, estado: 'FAILED' }),
        fetchAllPages(getWhatsAppPayments, finParams),
        fetchAllPages(getWhatsAppAgreements, finParams),
      ]);

      const allMessages = allMsgsResult.status === 'fulfilled' ? allMsgsResult.value.items : [];
      const allFailed = allFailedResult.status === 'fulfilled' ? allFailedResult.value.items : [];
      const allPaymentsRaw = allPayResult.status === 'fulfilled' ? allPayResult.value.items : [];
      const allAgreementsRaw = allAgrResult.status === 'fulfilled' ? allAgrResult.value.items : [];

      // ── Client-side date filter for payments/agreements ──
      // Keep only records whose first attributable touch date falls within [startDate, endDate].
      const rangeStart = filters.startDate; // 'yyyy-MM-dd'
      const rangeEnd = filters.endDate;

      const isFirstTouchInRange = (record) => {
        const ft = getFirstTouch(record.detalle_touches);
        if (!ft || !ft.fecha) return false;
        const touchDate = ft.fecha.split('T')[0]; // 'yyyy-MM-dd'
        return touchDate >= rangeStart && touchDate <= rangeEnd;
      };

      const allPayments = allPaymentsRaw.filter(isFirstTouchInRange);
      const allAgreements = allAgreementsRaw.filter(isFirstTouchInRange);
      const totalPaymentsCount = allPayments.length;
      const totalAgreementsCount = allAgreements.length;

      // ══════════════════════════════════════════════
      // ── AGGREGATION: KPIs ──
      // ══════════════════════════════════════════════
      const totalRevenue = allPayments.reduce((sum, p) => sum + (Number(p.valor_pagado) || 0), 0);
      const totalAgreementValue = allAgreements.reduce((sum, a) => sum + (Number(a.valor_acuerdo) || 0), 0);
      const respondedCount = allMessages.filter(m => m.hubo_respuesta === true).length;

      setKpiData({
        total_revenue: totalRevenue,
        total_payments_count: totalPaymentsCount,
        total_agreements: totalAgreementsCount,
        total_agreement_value: totalAgreementValue,
        total_sent: cumulativeSent,
        total_read: cumulativeRead,
        total_failed: failedCount,
        total_responded: respondedCount,
      });

      // ══════════════════════════════════════════════
      // ── AGGREGATION: First-Touch Attribution (Payments) ──
      // ══════════════════════════════════════════════
      const revenueByType = {};   // { CAMPAIGN: { revenue, count }, ... }
      const revenueByName = {};   // { "Campana Febrero": { revenue, count, tipo }, ... }

      allPayments.forEach(pay => {
        const firstTouch = getFirstTouch(pay.detalle_touches);
        if (!firstTouch) return;

        const tipo = firstTouch.tipo || 'DESCONOCIDO';
        const nombre = firstTouch.nombre || 'Sin nombre';
        const valor = Number(pay.valor_pagado) || 0;

        // By type
        if (!revenueByType[tipo]) revenueByType[tipo] = { revenue: 0, count: 0 };
        revenueByType[tipo].revenue += valor;
        revenueByType[tipo].count++;

        // By name
        const nameKey = `${nombre}__${tipo}`;
        if (!revenueByName[nameKey]) revenueByName[nameKey] = { name: nombre, tipo, revenue: 0, count: 0 };
        revenueByName[nameKey].revenue += valor;
        revenueByName[nameKey].count++;
      });

      // Origin KPI Cards (2 cards: Campanas + Comunicaciones)
      setOriginKPIData(revenueByType);

      // Origin Pie Chart data
      const TYPE_LABELS = { CAMPAIGN: 'Campanas', COMMUNICATION: 'Comunicaciones' };
      const pieData = Object.entries(revenueByType)
        .map(([tipo, d]) => ({ name: TYPE_LABELS[tipo] || tipo, value: d.revenue }))
        .filter(d => d.value > 0)
        .sort((a, b) => b.value - a.value);
      setOriginPieData(pieData);

      // Top Origins by nombre_origen (sorted by revenue desc)
      const topOrigins = Object.values(revenueByName)
        .sort((a, b) => b.revenue - a.revenue);
      setTopOriginsData(topOrigins);

      // ══════════════════════════════════════════════
      // ── AGGREGATION: Touches Average Table ──
      // ══════════════════════════════════════════════
      if (allPayments.length > 0) {
        let sumTouchesTotal = 0, sumTouchesCamp = 0, sumTouchesComm = 0;
        let sumDaysFirst = 0, sumDaysLast = 0;
        let countDaysFirst = 0, countDaysLast = 0;
        let countResponded = 0;

        allPayments.forEach(p => {
          sumTouchesTotal += (Number(p.total_touches) || 0);
          sumTouchesCamp += (Number(p.touches_campania) || 0);
          sumTouchesComm += (Number(p.touches_comunicacion) || 0);

          if (p.dias_primer_touch_a_conversion != null) {
            sumDaysFirst += Number(p.dias_primer_touch_a_conversion);
            countDaysFirst++;
          }
          if (p.dias_ultimo_touch_a_conversion != null) {
            sumDaysLast += Number(p.dias_ultimo_touch_a_conversion);
            countDaysLast++;
          }
          if (p.cliente_respondio === true) countResponded++;
        });

        const n = allPayments.length;
        setTouchesData({
          avg_touches_total: sumTouchesTotal / n,
          avg_touches_campaign: sumTouchesCamp / n,
          avg_touches_communication: sumTouchesComm / n,
          avg_days_first_touch: countDaysFirst > 0 ? sumDaysFirst / countDaysFirst : null,
          avg_days_last_touch: countDaysLast > 0 ? sumDaysLast / countDaysLast : null,
          pct_responded: (countResponded / n) * 100,
        });
      } else {
        setTouchesData(null);
      }

      // ══════════════════════════════════════════════
      // ── AGGREGATION: System Origin (Messages + Agreements + Revenue) ──
      // ══════════════════════════════════════════════
      const systemOriginMap = {};

      // Count messages by system_origin
      allMessages.forEach(msg => {
        const so = msg.system_origin || 'Sin sistema';
        if (!systemOriginMap[so]) systemOriginMap[so] = { system_origin: so, messages: 0, agreements: 0, revenue: 0 };
        systemOriginMap[so].messages++;
      });

      // Count agreements by system_origin: agreements don't have system_origin directly,
      // but their touches do. Use first touch's system info or cross-reference via cedula.
      // Since agreements endpoint doesn't have system_origin, we cross-reference:
      // For each agreement, find the first touch and look up that message's system_origin.
      // Simpler approach: use the tipo_origen from first touch as proxy.
      // Actually the messages have system_origin. Let's build a cedula->system_origin map from messages.
      const cedulaToSystemOrigin = {};
      allMessages.forEach(msg => {
        if (msg.cedula && msg.system_origin) {
          // Keep the most common system_origin for each cedula
          if (!cedulaToSystemOrigin[msg.cedula]) cedulaToSystemOrigin[msg.cedula] = {};
          cedulaToSystemOrigin[msg.cedula][msg.system_origin] = (cedulaToSystemOrigin[msg.cedula][msg.system_origin] || 0) + 1;
        }
      });
      const getPrimarySO = (cedula) => {
        const map = cedulaToSystemOrigin[cedula];
        if (!map) return 'Sin sistema';
        return Object.entries(map).sort((a, b) => b[1] - a[1])[0][0];
      };

      allAgreements.forEach(agr => {
        const so = getPrimarySO(agr.id_cliente);
        if (!systemOriginMap[so]) systemOriginMap[so] = { system_origin: so, messages: 0, agreements: 0, revenue: 0 };
        systemOriginMap[so].agreements++;
      });

      // Revenue by system_origin (from payments, cross-referenced via cedula)
      allPayments.forEach(pay => {
        const so = getPrimarySO(pay.id_cliente);
        if (!systemOriginMap[so]) systemOriginMap[so] = { system_origin: so, messages: 0, agreements: 0, revenue: 0 };
        systemOriginMap[so].revenue += (Number(pay.valor_pagado) || 0);
      });

      const systemOriginArray = Object.values(systemOriginMap).sort((a, b) => b.revenue - a.revenue);
      setSystemOriginData(systemOriginArray);

      // ══════════════════════════════════════════════
      // ── AGGREGATION: Error Distribution ──
      // ══════════════════════════════════════════════
      const errorCounts = {};
      allFailed.forEach(msg => {
        const errorKey = msg.error || 'Error desconocido';
        errorCounts[errorKey] = (errorCounts[errorKey] || 0) + 1;
      });
      setErrorData(
        Object.entries(errorCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      );

      // ══════════════════════════════════════════════
      // ── AGGREGATION: Trend Data (stacked by tipo_origen) ──
      // ══════════════════════════════════════════════
      const dateTrends = {};

      allMessages.forEach(msg => {
        const dateStr = msg.fecha_hora ? msg.fecha_hora.split('T')[0] : null;
        if (!dateStr) return;

        if (!dateTrends[dateStr]) {
          dateTrends[dateStr] = { date: dateStr, messages: 0, msg_campaign: 0, msg_communication: 0, revenue: 0 };
        }
        dateTrends[dateStr].messages++;

        const tipo = msg.tipo_origen;
        if (tipo === 'CAMPAIGN') dateTrends[dateStr].msg_campaign++;
        else if (tipo === 'COMMUNICATION') dateTrends[dateStr].msg_communication++;
      });

      // Revenue is plotted by the first-touch date (when the message was sent),
      // NOT by fecha_pago. This aligns with the filter semantics: "messages sent
      // in this date range and the revenue they generated".
      allPayments.forEach(pay => {
        const ft = getFirstTouch(pay.detalle_touches);
        const dateStr = ft?.fecha ? ft.fecha.split('T')[0] : null;
        if (!dateStr) return;
        if (!dateTrends[dateStr]) {
          dateTrends[dateStr] = { date: dateStr, messages: 0, msg_campaign: 0, msg_communication: 0, revenue: 0 };
        }
        dateTrends[dateStr].revenue += (Number(pay.valor_pagado) || 0);
      });

      setTrendData(Object.values(dateTrends).sort((a, b) => new Date(a.date) - new Date(b.date)));

      // ── Funnel ──
      setFunnelData([
        { stage: 'Enviados', count: cumulativeSent },
        { stage: 'Entregados', count: cumulativeDelivered },
        { stage: 'Leidos', count: cumulativeRead },
        ...(failedCount > 0 ? [{ stage: 'Fallidos', count: failedCount }] : [])
      ]);

    } catch (error) {
      console.error('Dashboard Load Error:', error);
      toast.error('Error al cargar datos del Dashboard. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => navigate('/reports')}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Granular WhatsApp</h1>
          <p className="text-gray-500">Atribucion financiera multi-touch y metricas de entrega</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
          <Info className="h-3 w-3" />
          <span>Datos actualizados cada noche (1:00 AM)</span>
        </div>
      </div>

      {/* 2. Filters */}
      <WhatsAppFilterBar
        startDate={filters.startDate}
        endDate={filters.endDate}
        onDateChange={handleDateChange}
        campaignId={filters.campaignId}
        onCampaignChange={handleCampaignChange}
      />

      {/* 3. KPI Cards (5 globales) */}
      <WhatsAppKPICards data={kpiData} loading={loading} />

      {/* 4. KPI Cards por Tipo de Origen (3 cards) */}
      <WhatsAppOriginKPICards data={originKPIData} loading={loading} />

      {/* 5. Embudo + Tendencia Diaria (barras apiladas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative">
          {loading && <LoadingOverlay />}
          <WhatsAppFunnelChart
            data={funnelData}
            onSliceClick={(stage) => {
              setSelectedStage(stage);
              setSelectedError(null);
            }}
          />
        </div>
        <div className="relative">
          {loading && <LoadingOverlay />}
          <WhatsAppTrendChart data={trendData} />
        </div>
      </div>

      {/* 6. Pie de Ingresos por Tipo + Top 10 Origenes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative">
          {loading && <LoadingOverlay />}
          <WhatsAppOriginPieChart data={originPieData} />
        </div>
        <div className="relative">
          {loading && <LoadingOverlay />}
          <WhatsAppTopOriginsChart data={topOriginsData} />
        </div>
      </div>

      {/* 7. Rendimiento por System Origin */}
      <div className="relative">
        {loading && <LoadingOverlay />}
        <WhatsAppSystemOriginChart data={systemOriginData} />
      </div>

      {/* 8. Tabla de Touches Promedio */}
      <WhatsAppTouchesTable data={touchesData} loading={loading} />

      {/* 9. Error Distribution */}
      <div className="relative">
        {loading && <LoadingOverlay />}
        <WhatsAppErrorChart
          data={errorData}
          onSliceClick={(errorText) => {
            setSelectedError(errorText);
            setSelectedStage(null);
          }}
        />
      </div>

      {/* 10. Drill-Down Data Table */}
      <div id="data-table-section">
        <WhatsAppDataTable
          filters={filters}
          selectedStage={selectedStage}
          selectedError={selectedError}
        />
      </div>
    </div>
  );
};

export default WhatsAppDashboardPage;
