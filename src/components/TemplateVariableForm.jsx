import React from 'react';
import { Sliders, Info } from 'lucide-react';

const READONLY_SYSTEM_VARS = [
  'nombre_cliente',
  'cedula',
  'cliente',
  'obligacion',
  'asesor',
  'nombre_gestor',
];

export const isVariableEditable = (varName) => {
  if (!varName) return false;
  const cleanName = varName.replace(/^SPECIAL:/i, '').toLowerCase();
  return !READONLY_SYSTEM_VARS.includes(cleanName);
};

export const formatVariableLabel = (varName) => {
  if (!varName) return '';
  let isSpecial = false;
  let raw = varName;
  if (varName.toUpperCase().startsWith('SPECIAL:')) {
    isSpecial = true;
    raw = varName.substring(8);
  }
  const formatted = raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return isSpecial ? `${formatted} (Especial)` : formatted;
};

const TemplateVariableForm = ({
  detectedVariables = [],
  formValues = {},
  onChange,
  disabled = false,
}) => {
  const editableVars = detectedVariables.filter(isVariableEditable);
  const readonlyVars = detectedVariables.filter((v) => !isVariableEditable(v));

  if (!detectedVariables || detectedVariables.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-3 text-sm">
      <div className="flex items-center gap-2 mb-3 text-slate-800 font-semibold">
        <Sliders className="w-4 h-4 text-blue-600" />
        <span>Variables Personalizadas (Opcional)</span>
      </div>

      {editableVars.length === 0 ? (
        <p className="text-xs text-slate-500 italic">
          Esta plantilla solo utiliza variables estándar del sistema (autocompletadas por la base de datos).
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 mb-2">
            Puedes ajustar manualmente los valores de las siguientes variables si deseas personalizar este envío:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {editableVars.map((varName) => {
              const label = formatVariableLabel(varName);
              const val = formValues[varName] !== undefined ? formValues[varName] : '';

              return (
                <div key={varName} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-700 flex items-center justify-between">
                    <span>{label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{varName}</span>
                  </label>
                  <input
                    type="text"
                    disabled={disabled}
                    value={val}
                    onChange={(e) => onChange(varName, e.target.value)}
                    placeholder="Valor por defecto de BD"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {readonlyVars.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>
            Variables autocompletadas automáticamente por BD: {readonlyVars.map(formatVariableLabel).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};

export default TemplateVariableForm;
