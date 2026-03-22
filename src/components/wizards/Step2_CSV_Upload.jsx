import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { getTemplates, getTemplateVariablesDetail, getTemplatePreview } from '../../services/api';
import CSVPreviewTable from './CSVPreviewTable';
import { Upload, FileText, AlertCircle, CheckCircle2, Info } from 'lucide-react';

// Variables que el backend rellena automáticamente desde la BD (no son obligatorias en el CSV)
const STAFF_AUTO_VARS = new Set(['extension_3cx', 'cel_renovar']);

const Step2_CSV_Upload = ({ campaignData, setCampaignData }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Estado del CSV
  const [csvFile, setCSVFile] = useState(null);
  const [csvHeaders, setCSVHeaders] = useState([]);
  const [csvRows, setCSVRows] = useState([]);
  const [templateVariables, setTemplateVariables] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [csvValidation, setCSVValidation] = useState({
    isValid: false,
    missingColumns: [],
    extraColumns: [],
    totalRows: 0,
  });

  const renderTextWithVariables = (text) => {
    if (!text) return "";
    return text.replace(/\{\{(\d+)\}\}/g, "<span class=\"text-blue-500 font-semibold\">[{{$1}}]</span>");
  };

  // Cargar plantillas al montar
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!campaignData.channel) return;
      try {
        setLoading(true);
        const allTemplates = await getTemplates();
        const filtered = allTemplates.filter(
          t => t.status === 'APPROVED' && t.channel_type === campaignData.channel.toUpperCase()
        );
        setTemplates(filtered);
      } catch (err) {
        console.error('Error al cargar plantillas:', err);
        toast.error('No se pudieron cargar las plantillas');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [campaignData.channel]);

  // Filtrar plantillas
  const filteredTemplates = useMemo(() => {
    if (!searchTerm) return templates;
    return templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [templates, searchTerm]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obtener variables de la plantilla cuando se selecciona
  useEffect(() => {
    const fetchTemplateVariables = async () => {
      if (!campaignData.message_template_id) {
        setTemplateVariables(null);
        setTemplatePreview(null);
        return;
      }

      try {
        const variables = await getTemplateVariablesDetail(campaignData.message_template_id);
        const preview = await getTemplatePreview(campaignData.message_template_id);
        setTemplatePreview(preview);
        setTemplateVariables(variables);
        
        // Si ya hay CSV cargado, re-validar
        if (csvHeaders.length > 0) {
          validateCSV(csvHeaders, csvRows, variables);
        }
      } catch (err) {
        console.error('Error al obtener variables:', err);
        toast.error('Error al obtener variables de la plantilla');
      }
    };

    fetchTemplateVariables();
  }, [campaignData.message_template_id]);

  const handleTemplateSelect = (template) => {
    setCampaignData(prev => ({
      ...prev,
      message_template_id: template.id,
      templateName: template.name,
    }));
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor selecciona un archivo CSV válido');
      return;
    }

    // Resetear estados previos para dar feedback visual de recarga
    setCSVHeaders([]);
    setCSVRows([]);
    setCSVValidation({
      isValid: false,
      missingColumns: [],
      extraColumns: [],
      totalRows: 0,
    });

    setCSVFile(file);
    parseCSV(file, file);
    
    // IMPORTANTE: Limpiar el input para permitir recargar el mismo archivo si fue modificado
    e.target.value = '';
  };

  const parseCSV = (file, currentFile) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Mantener todo como strings
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('Errores al parsear CSV:', results.errors);
        }

        const headers = results.meta.fields || [];
        const rows = results.data || [];

        setCSVHeaders(headers);
        setCSVRows(rows);

        // Validar si ya tenemos las variables de la plantilla
        if (templateVariables) {
          validateCSV(headers, rows, templateVariables, currentFile);
        } else {
          // Validación básica sin plantilla
          setCSVValidation({
            isValid: false,
            missingColumns: [],
            extraColumns: [],
            totalRows: rows.length,
            csvFile: currentFile,
          });
        }

        toast.success(`CSV cargado: ${rows.length} filas detectadas`);
      },
      error: (error) => {
        console.error('Error al parsear CSV:', error);
        toast.error('Error al leer el archivo CSV');
      },
    });
  };

  const validateCSV = (headers, rows, variables, currentFile) => {
    if (!variables || !variables.all_required_headers) {
      return;
    }

    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    const normalizedRequired = variables.all_required_headers.map(r => r.toLowerCase().trim());

    // Buscar columnas faltantes, excluyendo las que el backend rellena automáticamente
    const missing = normalizedRequired.filter(req =>
      !normalizedHeaders.includes(req) && !STAFF_AUTO_VARS.has(req)
    );

    // Buscar columnas extras (ignoradas)
    const extras = headers.filter(h =>
      !normalizedRequired.includes(h.toLowerCase().trim())
    );

    const isValid = missing.length === 0 && rows.length > 0;

    setCSVValidation({
      isValid,
      missingColumns: missing,
      extraColumns: extras,
      totalRows: rows.length,
      csvFile: currentFile,
    });

    // Guardar en estado global
    setCampaignData(prev => ({
      ...prev,
      csvFile: currentFile || csvFile,
      csvValidation: { isValid, missingColumns: missing },
      csvRowCount: rows.length,
    }));
  };

  const selectedTemplate = templates.find(t => t.id === campaignData.message_template_id);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Plantilla y Carga de CSV</h2>

      {/* Selección de Plantilla */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Plantilla <span className="text-red-500">*</span>
        </label>
        
        <div ref={dropdownRef} className="relative">
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 bg-white flex items-center justify-between"
          >
            <span className={selectedTemplate ? 'text-gray-900' : 'text-gray-400'}>
              {selectedTemplate ? selectedTemplate.name : 'Buscar plantilla...'}
            </span>
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              <div className="p-2 border-b sticky top-0 bg-white">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <ul className="py-1">
                {loading ? (
                  <li className="px-4 py-3 text-gray-500 text-center">Cargando...</li>
                ) : filteredTemplates.length === 0 ? (
                  <li className="px-4 py-3 text-gray-500 text-center">No se encontraron plantillas</li>
                ) : (
                  filteredTemplates.map((template) => (
                    <li
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-900"
                    >
                      {template.name}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Variables requeridas */}
        {templatePreview && (
          <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Contenido de la plantilla:</h4>
            <div
              className="text-sm text-gray-600 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: renderTextWithVariables(templatePreview.preview_content) }}
            />
          </div>
        )}

        {templateVariables && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Variables requeridas en el CSV:</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {templateVariables.all_required_headers.map((variable, idx) => {
                    const isAutoFilled = STAFF_AUTO_VARS.has(variable.toLowerCase().trim());
                    return isAutoFilled ? (
                      <span
                        key={idx}
                        title="El backend la rellena automáticamente desde la BD"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-500 text-xs font-medium border border-gray-300"
                      >
                        {variable}
                        <span className="text-[10px] bg-gray-200 text-gray-500 rounded px-1">auto</span>
                      </span>
                    ) : (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium"
                      >
                        {variable}
                      </span>
                    );
                  })}
                </div>
                {templateVariables.all_required_headers.some(v => STAFF_AUTO_VARS.has(v.toLowerCase().trim())) && (
                  <p className="text-xs text-gray-500 mt-2">
                    <span className="font-medium">auto</span>: el backend obtiene estos datos automáticamente, no es necesario incluirlos en el CSV.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Carga de Archivo CSV */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cargar Archivo CSV <span className="text-red-500">*</span>
        </label>
        
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          
          {csvFile ? (
            <div>
              <p className="text-sm font-medium text-gray-900">{csvFile.name}</p>
              <p className="text-xs text-gray-500 mt-1">Haz clic para cambiar archivo</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600">
                Haz clic para seleccionar un archivo CSV
              </p>
              <p className="text-xs text-gray-400 mt-1">
                El archivo debe contener columnas: phone (o cedula) + variables de la plantilla
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Validación del CSV */}
      {csvFile && templateVariables && (
        <div className="space-y-3">
          {csvValidation.isValid ? (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  ✓ CSV válido - Todas las columnas requeridas están presentes
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {csvValidation.totalRows} filas detectadas
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  Faltan columnas requeridas
                </p>
                {csvValidation.missingColumns.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-red-700">Columnas faltantes:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {csvValidation.missingColumns.map((col, idx) => (
                        <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {csvValidation.extraColumns.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <Info className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Columnas extras detectadas (serán ignoradas)
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {csvValidation.extraColumns.map((col, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vista Previa del CSV */}
      {csvHeaders.length > 0 && csvRows.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Vista Previa</h3>
          <CSVPreviewTable
            headers={csvHeaders}
            rows={csvRows}
            requiredColumns={templateVariables?.all_required_headers || ['phone', 'cedula']}
            maxRows={10}
          />
        </div>
      )}
    </div>
  );
};

export default Step2_CSV_Upload;
