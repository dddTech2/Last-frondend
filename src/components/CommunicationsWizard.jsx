import React, { useState, useRef, useEffect } from 'react';
import CommunicationStep1 from './CommunicationStep1';
import CommunicationStep2 from './CommunicationStep2';
import CommunicationStep3 from './CommunicationStep3';
import CommunicationStep4 from './CommunicationStep4';
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
  }, [currentStep, step1Data, campaignConfig, completedData]);

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

  const handleStep4Complete = () => {
    // After document generation and preview confirmation
    // Reset wizard for next campaign
    handleReset();
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
          {completedData && (
            <CommunicationStep4
              campaignConfig={completedData}
              onBack={() => goToStep(3)}
              onComplete={handleStep4Complete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunicationsWizard;
