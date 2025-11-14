import React, { useState, useRef, useEffect } from 'react';
import CommunicationStep1 from './CommunicationStep1';
import CommunicationStep2 from './CommunicationStep2';
import CommunicationStep3 from './CommunicationStep3';
import './CommunicationsWizard.css';

const CommunicationsWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState(null);
  const [selectedCommunication, setSelectedCommunication] = useState(null);
  const [campaignConfig, setCampaignConfig] = useState(null);
  const [completedData, setCompletedData] = useState(null);
  const [stepHeights, setStepHeights] = useState({});
  const stepRefs = useRef({});

  const TOTAL_STEPS = 4;

  const steps = [
    { id: 1, title: 'Paso 1: Datos del Cliente', subtitle: 'Información y canal de comunicación', icon: '1️⃣' },
    { id: 2, title: 'Paso 2: Configuración', subtitle: 'Configura tu campaña', icon: '2️⃣' },
    { id: 3, title: 'Paso 3: Mensaje', subtitle: 'Redacta tu comunicación', icon: '3️⃣' },
    { id: 4, title: 'Paso 4: Confirmación', subtitle: 'Resumen y envío', icon: '4️⃣' },
  ];

  // Calcular altura del contenido dinámicamente
  useEffect(() => {
    const calculateHeights = () => {
      const newHeights = {};
      steps.forEach(step => {
        const contentElement = stepRefs.current[`content-${step.id}`];
        if (contentElement) {
          newHeights[step.id] = contentElement.scrollHeight;
        }
      });
      setStepHeights(newHeights);
    };

    calculateHeights();
    window.addEventListener('resize', calculateHeights);
    return () => window.removeEventListener('resize', calculateHeights);
  }, [currentStep, step1Data, campaignConfig]);

  const handleStep1Submit = (data) => {
    setStep1Data(data);
    const channelMap = {
      'email': { id: 'email', title: 'Email' },
      'sms': { id: 'sms', title: 'SMS' },
      'whatsapp': { id: 'whatsapp', title: 'WhatsApp' }
    };
    setSelectedCommunication(channelMap[data.canalComunicacion]);
    goToStep(2);
  };

  const handleStep2Submit = (config) => {
    setCampaignConfig({ ...config, ...step1Data });
    goToStep(3);
  };

  const handleStep3Submit = (finalData) => {
    setCompletedData(finalData);
    goToStep(4);
  };

  const goToStep = (stepNumber) => {
    setCurrentStep(stepNumber);
  };

  const handleHeaderClick = (stepId) => {
    if (stepId < currentStep || stepId <= (step1Data ? 4 : 1)) {
      setCurrentStep(stepId);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setStep1Data(null);
    setSelectedCommunication(null);
    setCampaignConfig(null);
    setCompletedData(null);
  };

  return (
    <div className="wizard-container">
      {/* Step 1 */}
      <div
        className={`wizard-step ${currentStep === 1 ? 'is-active' : ''}`}
      >
        <div
          className="wizard-step__header"
          onClick={() => handleHeaderClick(1)}
        >
          <div className="wizard-step__number">1</div>
          <div className="wizard-step__header-content">
            <h3 className="wizard-step__title">{steps[0].title}</h3>
            <p className="wizard-step__subtitle">{steps[0].subtitle}</p>
          </div>
        </div>
        <div
          className="wizard-step__content"
          ref={(el) => (stepRefs.current['content-1'] = el)}
        >
          <CommunicationStep1
            onNext={handleStep1Submit}
            onCancel={handleReset}
          />
        </div>
      </div>

      {/* Step 2 */}
      <div
        className={`wizard-step ${currentStep === 2 ? 'is-active' : ''}`}
      >
        <div
          className="wizard-step__header"
          onClick={() => handleHeaderClick(2)}
        >
          <div className="wizard-step__number">2</div>
          <div className="wizard-step__header-content">
            <h3 className="wizard-step__title">{steps[1].title}</h3>
            <p className="wizard-step__subtitle">{steps[1].subtitle}</p>
          </div>
        </div>
        <div
          className="wizard-step__content"
          ref={(el) => (stepRefs.current['content-2'] = el)}
        >
          {step1Data && selectedCommunication && (
            <CommunicationStep2
              communicationType={selectedCommunication}
              onNext={handleStep2Submit}
              onBack={() => goToStep(1)}
              step1Data={step1Data}
            />
          )}
        </div>
      </div>

      {/* Step 3 */}
      <div
        className={`wizard-step ${currentStep === 3 ? 'is-active' : ''}`}
      >
        <div
          className="wizard-step__header"
          onClick={() => handleHeaderClick(3)}
        >
          <div className="wizard-step__number">3</div>
          <div className="wizard-step__header-content">
            <h3 className="wizard-step__title">{steps[2].title}</h3>
            <p className="wizard-step__subtitle">{steps[2].subtitle}</p>
          </div>
        </div>
        <div
          className="wizard-step__content"
          ref={(el) => (stepRefs.current['content-3'] = el)}
        >
          {step1Data && campaignConfig && selectedCommunication && (
            <CommunicationStep3
              communicationType={selectedCommunication}
              campaignConfig={campaignConfig}
              onNext={handleStep3Submit}
              onBack={() => goToStep(2)}
            />
          )}
        </div>
      </div>

      {/* Step 4 */}
      <div
        className={`wizard-step ${currentStep === 4 ? 'is-active' : ''}`}
      >
        <div
          className="wizard-step__header"
          onClick={() => handleHeaderClick(4)}
        >
          <div className="wizard-step__number">4</div>
          <div className="wizard-step__header-content">
            <h3 className="wizard-step__title">{steps[3].title}</h3>
            <p className="wizard-step__subtitle">{steps[3].subtitle}</p>
          </div>
        </div>
        <div
          className="wizard-step__content"
          ref={(el) => (stepRefs.current['content-4'] = el)}
        >
          {completedData ? (
            <CompletionSummary data={completedData} onReset={handleReset} />
          ) : (
            <div className="completion-placeholder">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-bold text-green-900 mb-2">¡Listo para Enviar!</h2>
              <p className="text-green-700">Tu campaña está configurada y lista para ser enviada</p>
              <div className="flex gap-4 justify-center pt-8">
                <button
                  onClick={() => goToStep(3)}
                  className="px-8 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  onClick={handleReset}
                  className="px-8 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Crear Nueva Campaña
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Completion Summary Component
const CompletionSummary = ({ data, onReset }) => (
  <div className="completion-summary">
    <div className="completion-success">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="text-3xl font-bold text-green-900 mb-2">¡Campaña Creada Exitosamente!</h2>
      <p className="text-green-700 text-lg">Tu campaña está lista para ser enviada</p>
    </div>

    {/* Summary Details Grid */}
    <div className="completion-grid">
      <div className="completion-card completion-card--blue">
        <p className="completion-card__label">Cédula</p>
        <p className="completion-card__value">{data.cedula}</p>
      </div>
      <div className="completion-card completion-card--purple">
        <p className="completion-card__label">Tipo de Deudor</p>
        <p className="completion-card__value">{data.tipoDeudor === 'deudor' ? 'Deudor' : 'Codeudor'}</p>
      </div>
      <div className="completion-card completion-card--indigo">
        <p className="completion-card__label">Canal</p>
        <p className="completion-card__value">{data.canalComunicacion.toUpperCase()}</p>
      </div>
      <div className="completion-card completion-card--orange">
        <p className="completion-card__label">Obligación</p>
        <p className="completion-card__value">{data.obligacion}</p>
      </div>
    </div>

    {/* Message Preview */}
    {data.messageContent && (
      <div className="completion-preview">
        <p className="completion-preview__label">Vista Previa del Mensaje</p>
        <div className="completion-preview__content">
          {data.messageContent}
        </div>
      </div>
    )}

    <div className="completion-actions">
      <button
        onClick={onReset}
        className="btn btn--primary"
      >
        Crear Nueva Campaña
      </button>
      <button
        onClick={() => console.log('Descargar reporte...')}
        className="btn btn--secondary"
      >
        Descargar Reporte
      </button>
    </div>
  </div>
);

export default CommunicationsWizard;
