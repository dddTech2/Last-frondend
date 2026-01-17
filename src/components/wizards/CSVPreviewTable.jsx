import React from 'react';

const CSVPreviewTable = ({ headers, rows, requiredColumns, maxRows = 10 }) => {
  if (!headers || headers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay datos para mostrar
      </div>
    );
  }

  const displayRows = rows.slice(0, maxRows);
  const totalRows = rows.length;

  const isRequired = (header) => {
    const normalized = header.toLowerCase();
    return requiredColumns.some(col => col.toLowerCase() === normalized);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header con contador */}
      <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
        <h4 className="font-semibold text-gray-700">Vista Previa del CSV</h4>
        <span className="text-sm text-gray-600">
          Mostrando {displayRows.length} de {totalRows} filas
        </span>
      </div>

      {/* Tabla con scroll horizontal */}
      <div className="overflow-x-auto max-h-96">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isRequired(header)
                      ? 'bg-green-50 text-green-800'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isRequired(header) && (
                      <span className="text-green-600">✓</span>
                    )}
                    {header}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50">
                {headers.map((header, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-4 py-3 text-sm whitespace-nowrap ${
                      isRequired(header)
                        ? 'bg-green-50 text-gray-900 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {row[header] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer con leyenda */}
      <div className="bg-gray-50 px-4 py-2 border-t">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-100 border border-green-300 rounded"></span>
            <span>Columnas requeridas</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></span>
            <span>Columnas extras (ignoradas)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVPreviewTable;
