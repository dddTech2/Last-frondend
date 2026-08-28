import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const PolicyEditor = ({ onInsert }) => {
  const policyTerms = [
    { label: 'Contado (0 meses)', value: '0' },
    { label: '1 - 6 meses', value: '6' },
    { label: '7 - 12 meses', value: '12' },
    { label: '13 - 24 meses', value: '24' },
    { label: '25 - 36 meses', value: '36' },
    { label: '> 36 meses', value: '37' },
  ];
  const [selectedTermValue, setSelectedTermValue] = useState(policyTerms[0].value);

  const handleInsertPolicy = () => {
    onInsert(`{{POLITICA:${selectedTermValue}}}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-700">Variable Política:</span>
        <select
          id="policy-term"
          value={selectedTermValue}
          onChange={(e) => setSelectedTermValue(e.target.value)}
          className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {policyTerms.map((term) => (
            <option key={term.value} value={term.value}>
              {term.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={handleInsertPolicy}
        className="bg-indigo-600 text-white px-3.5 py-1.5 text-xs font-semibold rounded-lg hover:bg-indigo-700 shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
      >
        <span>+ Insertar {`{{POLITICA:${selectedTermValue}}}`}</span>
      </button>

      <div className="border-l border-slate-300 pl-3">
        <Link
          to="/condonation-policies"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
          title="Ver o editar la tabla de porcentajes de condonación de capital"
        >
          <span>⚖️ Configurar porcentajes de condonación</span>
        </Link>
      </div>
    </div>
  );
};

export default PolicyEditor;
