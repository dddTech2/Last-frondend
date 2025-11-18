import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, Clock, RefreshCcw, Upload, FileOutput, Send } from 'lucide-react';
import {
  getLegalBatches,
  getLegalBatchCommunications,
  uploadLegalBatchReview,
  generateLegalBatchCorrespondence,
  sendLegalBatchCorrespondence,
} from '../services/api';

const statusLabels = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

const statusColors = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
};

const LegalCommunicationsApprovalPage = () => {
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [communications, setCommunications] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingCommunications, setLoadingCommunications] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [banner, setBanner] = useState(null);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [senderEmail, setSenderEmail] = useState('analistaia@renovarfinanciera.com');
  const [senderPassword, setSenderPassword] = useState('Renovar2025*');
  const fileInputRef = useRef(null);

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 5000);
  };

  const handleSelectBatch = useCallback(async (batch) => {
    if (!batch) return;
    setSelectedBatch(batch);
    setLoadingCommunications(true);
    try {
      const data = await getLegalBatchCommunications(batch.id);
      const normalized = Array.isArray(data?.communications)
        ? data.communications
        : Array.isArray(data)
          ? data
          : [];
      setCommunications(normalized);
    } catch (err) {
      setCommunications([]);
      showBanner('error', err?.message || 'No pudimos cargar las comunicaciones del batch.');
    } finally {
      setLoadingCommunications(false);
    }
  }, []);

  const loadBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      const data = await getLegalBatches();
      const normalized = Array.isArray(data?.batches)
        ? data.batches
        : Array.isArray(data)
          ? data
          : [];
      setBatches(normalized);
      if (normalized.length) {
        const alreadySelected = normalized.find(batch => batch.id === selectedBatch?.id);
        await handleSelectBatch(alreadySelected || normalized[0]);
      } else {
        setSelectedBatch(null);
        setCommunications([]);
      }
    } catch (err) {
      showBanner('error', err?.message || 'No pudimos cargar los batches jurídicos.');
    } finally {
      setLoadingBatches(false);
    }
  }, [handleSelectBatch, selectedBatch?.id]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const filteredCommunications = useMemo(() => {
    if (statusFilter === 'ALL') return communications;
    return communications.filter(comm =>
      statusFilter === 'PENDING'
        ? comm.status === 'PENDING'
        : comm.status === statusFilter
    );
  }, [communications, statusFilter]);

  const handleRefresh = () => {
    setStatusFilter(prev => prev);
    if (selectedBatch) {
      handleSelectBatch(selectedBatch);
    }
  };

  const triggerFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUploadReview = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedBatch) return;
    setUploading(true);
    try {
      await uploadLegalBatchReview(selectedBatch.id, file);
      showBanner('success', 'Archivo CSV cargado correctamente.');
      await handleSelectBatch(selectedBatch);
    } catch (err) {
      showBanner('error', err?.message || 'No pudimos cargar el archivo CSV.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!selectedBatch) return;
    setActionLoading(true);
    try {
      await generateLegalBatchCorrespondence(selectedBatch.id);
      showBanner('success', 'Correspondencia generada correctamente.');
      await handleSelectBatch(selectedBatch);
    } catch (err) {
      showBanner('error', err?.message || 'No pudimos generar la correspondencia.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedBatch) return;
    setActionLoading(true);
    try {
      await sendLegalBatchCorrespondence(selectedBatch.id, {
        sender_email: senderEmail,
        sender_password: senderPassword,
      });
      showBanner('success', 'Correspondencia enviada correctamente.');
      await handleSelectBatch(selectedBatch);
    } catch (err) {
      showBanner('error', err?.message || 'No pudimos enviar la correspondencia.');
    } finally {
      setActionLoading(false);
      setCredentialsOpen(false);
    }
  };

  const renderStatusBadge = (status) => (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
      {statusLabels[status] || status}
    </span>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Aprobación Jurídica de Comunicaciones</h1>
          <p className="text-gray-500 text-sm">Revisa, aprueba o rechaza comunicaciones finales antes de su envío.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadBatches}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100"
            disabled={loadingBatches}
          >
            <RefreshCcw className={`h-4 w-4 ${loadingBatches ? 'animate-spin' : ''}`} />
            Recargar batches
          </button>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100"
            disabled={loadingCommunications || !selectedBatch}
          >
            <RefreshCcw className={`h-4 w-4 ${loadingCommunications ? 'animate-spin' : ''}`} />
            Refrescar comunicaciones
          </button>
        </div>
      </div>
      {banner && (
        <div className={`border rounded-xl p-4 flex items-start gap-3 ${
          banner.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          <span className="font-semibold">{banner.type === 'error' ? 'Atención' : 'Éxito'}:</span>
          <p className="text-sm">{banner.message}</p>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Batches jurídicos</h2>
        {loadingBatches ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">Cargando batches...</div>
        ) : batches.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-500">
            No hay batches jurídicos disponibles por ahora.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map(batch => (
              <button
                key={batch.id}
                onClick={() => handleSelectBatch(batch)}
                className={`text-left border rounded-xl p-4 shadow-sm hover:border-gray-400 transition ${
                  selectedBatch?.id === batch.id ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white'
                }`}
              >
                <p className="text-xs font-semibold text-gray-400">Batch ID</p>
                <p className="font-mono text-sm text-gray-800 mb-2">{batch.id}</p>
                <p className="text-xs font-semibold text-gray-400">Creado</p>
                <p className="text-sm text-gray-800 mb-2">{batch.created_at ? new Date(batch.created_at).toLocaleString() : 'Sin fecha'}</p>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{renderStatusBadge(batch.status || 'PENDING')}</span>
                  <span>{batch.total_records ?? batch.total ?? 0} registros</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedBatch && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-4">
            <div>
              <p className="text-xs font-semibold text-gray-400">Batch seleccionado</p>
              <p className="font-mono text-sm text-gray-800">{selectedBatch.id}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={triggerFilePicker}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-60"
                disabled={uploading}
              >
                <Upload className={`h-4 w-4 ${uploading ? 'animate-pulse' : ''}`} />
                {uploading ? 'Cargando...' : 'Subir CSV de revisión'}
              </button>
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg shadow-sm hover:bg-gray-800 disabled:opacity-60"
                disabled={actionLoading}
              >
                <FileOutput className={`h-4 w-4 ${actionLoading ? 'animate-spin' : ''}`} />
                Generar PDFs
              </button>
              <button
                onClick={() => setCredentialsOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg shadow-sm hover:bg-rose-700"
              >
                <Send className="h-4 w-4" />
                Enviar correspondencia
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleUploadReview}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-1 flex gap-1">
            {[
              { key: 'ALL', label: 'Todas' },
              { key: 'PENDING', label: 'Pendientes' },
              { key: 'APPROVED', label: 'Aprobadas' },
              { key: 'REJECTED', label: 'Rechazadas' },
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                  statusFilter === filter.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loadingCommunications ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center space-y-2">
          <Clock className="h-10 w-10 text-blue-500 mx-auto animate-spin" />
          <p className="font-semibold text-gray-700">Cargando comunicaciones...</p>
          <p className="text-sm text-gray-500">Esto tomará solo un momento.</p>
        </div>
      ) : (
        selectedBatch && (
          <>
            {filteredCommunications.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center space-y-2">
                <ArrowLeftRight className="h-10 w-10 text-gray-400 mx-auto" />
                <p className="font-semibold text-gray-700">Sin comunicaciones con este filtro</p>
                <p className="text-sm text-gray-500">Prueba cambiando el filtro o vuelve más tarde.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredCommunications.map(comm => (
                  <div
                    key={comm.id || comm.communication_id}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-mono text-gray-800">{comm.id || comm.communication_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-800">{comm.clientName || comm.client_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-800">{comm.templateName || comm.template_name || 'Sin plantilla'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-800">{comm.channel || 'N/A'}</p>
                    </div>
                    <div className="flex flex-col items-start">
                      {renderStatusBadge(comm.status || comm.review_status || 'PENDING')}
                    </div>
                    {comm.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">Aprobar</button>
                        <button className="px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg">Rechazar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )
      )}

      {credentialsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div>
              <p className="text-lg font-semibold text-gray-800">Enviar correspondencia</p>
              <p className="text-sm text-gray-500">Ingresa las credenciales autorizadas para completar el envío.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">Correo</label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                  placeholder="correo@renovarfinanciera.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Contraseña</label>
                <input
                  type="password"
                  value={senderPassword}
                  onChange={(e) => setSenderPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCredentialsOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-60"
                disabled={actionLoading || !senderEmail || !senderPassword}
              >
                {actionLoading ? 'Enviando...' : 'Enviar ahora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalCommunicationsApprovalPage;
