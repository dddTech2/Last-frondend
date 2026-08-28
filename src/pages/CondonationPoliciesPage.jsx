import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ShieldCheck, 
  Percent, 
  Calculator, 
  Save, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowLeft,
  Sparkles,
  Info,
  Layers,
  History,
  FileCode2,
  Check
} from 'lucide-react';
import condonationPolicyService from '../services/condonationPolicyService';

// Rangos de Días de Mora estándar utilizados en la matriz
const MORA_RANGES = [
  { id: 'r1', label: '121 - 720 días', min: 121, max: 720 },
  { id: 'r2', label: '721 - 1460 días', min: 721, max: 1460 },
  { id: 'r3', label: '1461 - 2880 días', min: 1461, max: 2880 },
  { id: 'r4', label: '2881 - 3600 días', min: 2881, max: 3600 },
  { id: 'r5', label: '3601 - 4680 días', min: 3601, max: 4680 },
  { id: 'r6', label: '> 4680 días', min: 4681, max: 99999 },
];

// Plazos estándar en meses
const PAYMENT_TERMS = [
  { id: 't0', label: 'Contado (0m)', min: 0, max: 0, tag: '{{POLITICA:0}}' },
  { id: 't1', label: '1 - 6 meses', min: 1, max: 6, tag: '{{POLITICA:6}}' },
  { id: 't2', label: '7 - 12 meses', min: 7, max: 12, tag: '{{POLITICA:12}}' },
  { id: 't3', label: '13 - 24 meses', min: 13, max: 24, tag: '{{POLITICA:24}}' },
  { id: 't4', label: '25 - 36 meses', min: 25, max: 36, tag: '{{POLITICA:36}}' },
  { id: 't5', label: '> 36 meses', min: 37, max: 999, tag: '{{POLITICA:37}}' },
];

const CondonationPoliciesPage = () => {
  const [policies, setPolicies] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);
  const [currentPolicy, setCurrentPolicy] = useState(null);
  const [matrixValues, setMatrixValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');
  const [activateOnCreate, setActivateOnCreate] = useState(true);

  // Estados del Simulador en Vivo
  const [simCapital, setSimCapital] = useState('5000000');
  const [simDiasMora, setSimDiasMora] = useState('1500');

  // Formateador de moneda en pesos colombianos
  const formatCOP = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Carga de políticas desde el backend
  const loadPolicies = async (targetId = null) => {
    setLoading(true);
    try {
      const data = await condonationPolicyService.getAllPolicies();
      setPolicies(data || []);

      if (data && data.length > 0) {
        let policyToSelect = null;
        if (targetId) {
          policyToSelect = data.find((p) => p.id === targetId) || data[0];
        } else {
          // Seleccionar la activa por defecto
          policyToSelect = data.find((p) => p.esta_activa) || data[0];
        }
        setSelectedPolicyId(policyToSelect.id);
        setupPolicyMatrix(policyToSelect);
      } else {
        setCurrentPolicy(null);
        setMatrixValues({});
      }
    } catch (err) {
      console.error('Error al cargar políticas de condonación:', err);
      toast.error('No se pudieron cargar las políticas de condonación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  // Transforma las reglas del backend en un diccionario rápido [rIndex_tIndex] -> porcentaje
  const setupPolicyMatrix = (policy) => {
    setCurrentPolicy(policy);
    const newMatrix = {};

    MORA_RANGES.forEach((mora, mIdx) => {
      PAYMENT_TERMS.forEach((term, tIdx) => {
        const key = `${mIdx}_${tIdx}`;
        // Buscar regla coincidente
        const match = (policy.reglas || []).find(
          (r) =>
            r.dias_mora_min === mora.min &&
            r.dias_mora_max === mora.max &&
            r.plazo_meses_min === term.min &&
            r.plazo_meses_max === term.max
        );
        newMatrix[key] = match !== undefined ? Number(match.porcentaje_condonacion) : 0;
      });
    });

    setMatrixValues(newMatrix);
  };

  const handleSelectPolicy = (policyId) => {
    const id = Number(policyId);
    setSelectedPolicyId(id);
    const found = policies.find((p) => p.id === id);
    if (found) {
      setupPolicyMatrix(found);
    }
  };

  const handleCellChange = (mIdx, tIdx, value) => {
    const key = `${mIdx}_${tIdx}`;
    let numeric = parseFloat(value);
    if (isNaN(numeric)) numeric = 0;
    if (numeric < 0) numeric = 0;
    if (numeric > 100) numeric = 100;

    setMatrixValues((prev) => ({
      ...prev,
      [key]: numeric,
    }));
  };

  // Convierte la matriz de la UI en la lista de reglas para la API
  const buildRulesPayload = () => {
    const rules = [];
    MORA_RANGES.forEach((mora, mIdx) => {
      PAYMENT_TERMS.forEach((term, tIdx) => {
        const key = `${mIdx}_${tIdx}`;
        const pct = matrixValues[key] !== undefined ? matrixValues[key] : 0;
        rules.push({
          dias_mora_min: mora.min,
          dias_mora_max: mora.max,
          plazo_meses_min: term.min,
          plazo_meses_max: term.max,
          porcentaje_condonacion: Number(pct),
        });
      });
    });
    return rules;
  };

  // Guardar cambios en la política actual
  const handleSaveChanges = async () => {
    if (!currentPolicy) return;
    setSaving(true);
    try {
      const payload = {
        version: currentPolicy.version,
        descripcion: currentPolicy.descripcion,
        esta_activa: currentPolicy.esta_activa,
        reglas: buildRulesPayload(),
      };
      const updated = await condonationPolicyService.updatePolicy(currentPolicy.id, payload);
      toast.success(`Política ${updated.version} actualizada correctamente`);
      loadPolicies(updated.id);
    } catch (err) {
      console.error('Error al guardar política:', err);
      toast.error('Error al guardar los cambios de la política');
    } finally {
      setSaving(false);
    }
  };

  // Activar la política seleccionada
  const handleActivatePolicy = async () => {
    if (!currentPolicy) return;
    setSaving(true);
    try {
      const activated = await condonationPolicyService.activatePolicy(currentPolicy.id);
      toast.success(`¡Política ${activated.version} activada para producción!`);
      loadPolicies(activated.id);
    } catch (err) {
      console.error('Error al activar política:', err);
      toast.error('Error al activar la política');
    } finally {
      setSaving(false);
    }
  };

  // Crear nueva versión
  const handleCreateVersion = async (e) => {
    e.preventDefault();
    if (!newVersionName.trim()) {
      toast.error('Ingrese un nombre de versión válido');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        version: newVersionName.trim(),
        descripcion: newVersionDesc.trim() || `Versión creada el ${new Date().toLocaleDateString()}`,
        esta_activa: activateOnCreate,
        reglas: buildRulesPayload(),
      };
      const created = await condonationPolicyService.createPolicy(payload);
      toast.success(`Nueva versión "${created.version}" creada con éxito`);
      setIsNewVersionModalOpen(false);
      setNewVersionName('');
      setNewVersionDesc('');
      loadPolicies(created.id);
    } catch (err) {
      console.error('Error al crear versión:', err);
      toast.error(err.message || 'Error al crear la versión de la política');
    } finally {
      setSaving(false);
    }
  };

  // Sembrar o restaurar valores iniciales
  const handleSeedDefault = async () => {
    if (!window.confirm('¿Deseas inicializar la política de condonación por defecto del sistema?')) return;
    setLoading(true);
    try {
      await condonationPolicyService.seedDefaultPolicy();
      toast.success('Política de condonación inicializada correctamente');
      loadPolicies();
    } catch (err) {
      console.error('Error al inicializar seed:', err);
      toast.error('Error al inicializar la política');
    } finally {
      setLoading(false);
    }
  };

  // Cálculo en vivo para el simulador usando la matriz actual
  const simulationResults = useMemo(() => {
    const capital = parseFloat(simCapital) || 0;
    const dias = parseInt(simDiasMora, 10) || 0;

    // Buscar el índice de fila de mora
    const moraIdx = MORA_RANGES.findIndex((r) => dias >= r.min && dias <= r.max);

    return PAYMENT_TERMS.map((term, tIdx) => {
      let pct = 0;
      if (moraIdx !== -1) {
        const key = `${moraIdx}_${tIdx}`;
        pct = matrixValues[key] !== undefined ? matrixValues[key] : 0;
      }
      const valorCondonado = (capital * pct) / 100;
      const montoPagar = Math.max(capital - valorCondonado, 0);

      return {
        ...term,
        porcentaje: pct,
        valorCondonado,
        montoPagar,
      };
    });
  }, [simCapital, simDiasMora, matrixValues]);

  // Color de celda según el nivel de descuento
  const getCellBgColor = (pct) => {
    if (pct >= 60) return 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold';
    if (pct >= 30) return 'bg-teal-50 text-teal-900 border-teal-300 font-semibold';
    if (pct > 0) return 'bg-blue-50 text-blue-900 border-blue-200';
    return 'bg-gray-50 text-gray-500 border-gray-200';
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header Superior */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/templates"
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Volver a Plantillas
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Motor de Comunicación
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Percent className="w-8 h-8 text-indigo-600" />
            Políticas de Condonación
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Configura los porcentajes de descuento por días de mora y plazo que alimentan automáticamente la variable dinámica{' '}
            <code className="bg-slate-200 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-xs">
              {`{{POLITICA:meses}}`}
            </code>{' '}
            en las plantillas de WhatsApp, SMS y correo.
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setIsNewVersionModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm shadow-indigo-200 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            Nueva Versión
          </button>

          {policies.length === 0 && (
            <button
              type="button"
              onClick={handleSeedDefault}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Inicializar por Defecto
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Cargando matriz de políticas de condonación...</p>
        </div>
      ) : policies.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-xl mx-auto">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">No hay políticas registradas</h2>
          <p className="text-slate-600 mb-6 text-sm">
            La tabla de políticas de condonación aún no contiene versiones. Puedes inicializar la política base del sistema o crear una nueva.
          </p>
          <button
            type="button"
            onClick={handleSeedDefault}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm"
          >
            <Sparkles className="w-4 h-4" /> Inicializar Matriz Base (v1.0)
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Barra de Versiones y Estado */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-slate-500" />
                <label htmlFor="policy-select" className="text-sm font-semibold text-slate-700">
                  Versión Seleccionada:
                </label>
                <select
                  id="policy-select"
                  value={selectedPolicyId || ''}
                  onChange={(e) => handleSelectPolicy(e.target.value)}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {policies.map((pol) => (
                    <option key={pol.id} value={pol.id}>
                      Versión {pol.version} {pol.esta_activa ? '★ (ACTIVA EN PRODUCCIÓN)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {currentPolicy?.esta_activa ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Activa en Producción
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200">
                  <History className="w-4 h-4" />
                  Versión Inactiva / Borrador
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!currentPolicy?.esta_activa && (
                <button
                  type="button"
                  onClick={handleActivatePolicy}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Activar esta Versión
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>

          {/* Matriz Interactiva de Condonación */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Matriz de Descuentos por Mora y Plazo (% Condonación de Capital)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Edita directamente cada celda. Los cambios impactarán el cálculo de la variable{' '}
                  <code className="text-indigo-600 font-mono font-bold">{`{{POLITICA:meses}}`}</code> en los envíos de campañas y previsualizaciones.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-400"></span> Descuento Alto (≥60%)
                <span className="w-3 h-3 rounded bg-teal-200 border border-teal-400 ml-2"></span> Medio (≥30%)
                <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300 ml-2"></span> Estándar (&gt;0%)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-4 px-6 border-r border-slate-200 min-w-[200px]">
                      Rango de Mora
                    </th>
                    {PAYMENT_TERMS.map((term) => (
                      <th key={term.id} className="py-4 px-4 text-center min-w-[140px]">
                        <div>{term.label}</div>
                        <div className="text-[10px] font-mono text-indigo-600 font-normal lowercase mt-0.5">
                          {term.tag}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {MORA_RANGES.map((mora, mIdx) => (
                    <tr key={mora.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-800 bg-slate-50/50 border-r border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          {mora.label}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                          {mora.min} a {mora.max > 90000 ? 'más' : mora.max} días
                        </div>
                      </td>
                      {PAYMENT_TERMS.map((term, tIdx) => {
                        const key = `${mIdx}_${tIdx}`;
                        const value = matrixValues[key] !== undefined ? matrixValues[key] : 0;
                        return (
                          <td key={term.id} className="py-3 px-3 text-center">
                            <div className="relative inline-flex items-center justify-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={value}
                                onChange={(e) => handleCellChange(mIdx, tIdx, e.target.value)}
                                className={`w-20 text-center py-2 px-2 border rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${getCellBgColor(
                                  value
                                )}`}
                              />
                              <span className="ml-1 text-xs font-bold text-slate-400">%</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-500" />
                <span>
                  <strong>Regla de negocio:</strong> Obligaciones con mora menor a 121 días tienen condonación de 0% por defecto.
                </span>
              </div>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={saving}
                className="bg-slate-800 hover:bg-slate-900 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar Matriz'}
              </button>
            </div>
          </div>

          {/* Panel Simulador en Vivo */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-7 rounded-2xl shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
                  <Calculator className="w-3.5 h-3.5" /> Simulador en Tiempo Real
                </div>
                <h3 className="text-xl font-bold text-white">Prueba cómo se calculan las plantillas en vivo</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Ingresa valores de prueba para verificar los descuentos y el saldo a pagar resultante según la matriz configurada arriba.
                </p>
              </div>

              {/* Controles del Simulador */}
              <div className="flex items-center gap-3 flex-wrap bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                <div>
                  <label htmlFor="sim-capital" className="block text-[11px] font-medium text-slate-300 mb-1">
                    Saldo Capital ($ COP):
                  </label>
                  <input
                    id="sim-capital"
                    type="number"
                    value={simCapital}
                    onChange={(e) => setSimCapital(e.target.value)}
                    className="w-36 px-3 py-1.5 bg-slate-900/80 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    placeholder="5000000"
                  />
                </div>
                <div>
                  <label htmlFor="sim-dias" className="block text-[11px] font-medium text-slate-300 mb-1">
                    Días de Mora:
                  </label>
                  <input
                    id="sim-dias"
                    type="number"
                    value={simDiasMora}
                    onChange={(e) => setSimDiasMora(e.target.value)}
                    className="w-28 px-3 py-1.5 bg-slate-900/80 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    placeholder="1500"
                  />
                </div>
              </div>
            </div>

            {/* Tarjetas de Resultados por Plazo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
              {simulationResults.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl p-4 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold font-mono ${
                          item.porcentaje > 0
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {item.porcentaje}%
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mb-1 font-mono">
                      {item.tag}
                    </div>

                    <div className="text-xs text-rose-300/90 font-medium">
                      Descuento: -{formatCOP(item.valorCondonado)}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-700">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Monto a Pagar
                    </div>
                    <div className="text-sm font-bold text-white font-mono">
                      {formatCOP(item.montoPagar)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Nueva Versión */}
      {isNewVersionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-600" />
              Crear Nueva Versión de Política
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Se creará una nueva versión clonando los valores actuales de la matriz para que puedas hacer ajustes sin afectar el historial previo.
            </p>

            <form onSubmit={handleCreateVersion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nombre / Código de Versión *
                </label>
                <input
                  type="text"
                  required
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  placeholder="ej. 2.0 o Campaña-Septiembre"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Descripción u Objetivo Comercial
                </label>
                <textarea
                  rows="3"
                  value={newVersionDesc}
                  onChange={(e) => setNewVersionDesc(e.target.value)}
                  placeholder="ej. Descuentos agresivos para cartera castigada con plazos ampliados..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="activate-create"
                  type="checkbox"
                  checked={activateOnCreate}
                  onChange={(e) => setActivateOnCreate(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="activate-create" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Activar de inmediato esta versión para producción
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewVersionModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {saving ? 'Creando...' : 'Crear Versión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CondonationPoliciesPage;
