import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Step1_ChannelConfig from '../components/wizards/Step1_ChannelConfig';
import Step2_Segmentation from '../components/wizards/Step2_Segmentation';
import Step3_Template from '../components/wizards/Step3_Template';
import Step4_Scheduling from '../components/wizards/Step4_Scheduling';
import Step5_Confirmation from '../components/wizards/Step5_Confirmation';
import { createAndLaunchCampaign, createSchedule, createSimpleFilter, refreshCampaignStats } from '../services/api';
import CampaignScheduleCreate from '../schemas/CampaignScheduleCreate';
import CampaignCreate from '../schemas/CampaignCreate';
import AudienceFilterSimpleCreate from '../schemas/AudienceFilterSimpleCreate';
import FilterSavePromptModal from '../components/wizards/FilterSavePromptModal';


// --- Iconos para el Stepper ---
const ChannelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const SegmentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TemplateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ScheduleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ConfirmIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CheckIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;
// -----------------------------

const Stepper = ({ currentStep }) => {
  const steps = [
    { name: "Canal y Configuración", icon: <ChannelIcon /> },
    { name: "Segmentación", icon: <SegmentIcon /> },
    { name: "Plantilla", icon: <TemplateIcon /> },
    { name: "Programación", icon: <ScheduleIcon /> },
    { name: "Confirmación", icon: <ConfirmIcon /> },
  ];

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <React.Fragment key={step.name}>
          <div className="flex flex-col items-center text-center px-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                index < currentStep ? "bg-blue-600 text-white" : 
                index === currentStep ? "bg-white border-2 border-blue-600 text-blue-600" : 
                "bg-gray-200 text-gray-500"
            }`}>
              {index < currentStep ? <CheckIcon /> : step.icon}
            </div>
            <p className={`mt-2 text-xs transition-all duration-300 ${
                index === currentStep ? 'font-semibold text-gray-800' : 'text-gray-500'
            }`}>{step.name}</p>
          </div>
          {index < steps.length - 1 && <div className="flex-1 h-0.5 bg-gray-200"></div>}
        </React.Fragment>
      ))}
    </div>
  );
};

const CreateCampaignPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [campaignData, setCampaignData] = useState({
    name: '',
    channel: '',
    templateName: '',
    previewSubject: '',
    previewContent: '',
    selectedTemplateDetails: null,
    special_variable_value: '',
  });
  // Estado para el modal de decisión de guardado de filtro
  const [showFilterPrompt, setShowFilterPrompt] = useState(false);
  const [launchLoading, setLaunchLoading] = useState(false); // evita doble envío

  // Determina si hay un filtro construido pero no guardado (definition sin audience_filter_id)
  const hasUnsavedDefinition = !campaignData.audience_filter_id && (
    campaignData.definition && (
      (campaignData.definition.general?.length > 0) || (campaignData.definition.exclude?.length > 0)
    )
  );

  // El botón "Siguiente" en el primer paso estará deshabilitado si no se ha seleccionado un canal
  // o si el nombre de la campaña tiene menos de 7 caracteres.
  const hasAudienceFilter = !!campaignData.audience_filter_id || (campaignData.definition && (campaignData.definition.general?.length > 0 || campaignData.definition.exclude?.length > 0));
  const isCodebtorStrategyMissing = campaignData.target_role === 'CODEUDOR' && !campaignData.codebtor_strategy;

  // Verificar si la plantilla seleccionada tiene una variable especial que requiere valor
  const hasSpecialVariable = campaignData.selectedTemplateDetails?.special_variable_name;
  const isSpecialVariableValueMissing = hasSpecialVariable && !campaignData.special_variable_value?.trim();

  // Validaciones:
  // Paso 0: requiere canal y nombre >= 7 caracteres
  // Desde paso 1 en adelante: siempre debe mantenerse un filtro (guardado o reglas) seleccionado.
  // Si el rol es CODEUDOR, se debe seleccionar una estrategia.
  // Si la plantilla tiene variable especial, se debe ingresar el valor.
  const isNextDisabled = (
    (currentStep === 0 && (!campaignData.channel || campaignData.name.trim().length < 7)) ||
    (currentStep >= 1 && !hasAudienceFilter) ||
    (currentStep === 1 && isCodebtorStrategyMissing) ||
    (currentStep === 2 && isSpecialVariableValueMissing) ||
    (currentStep === 1 && campaignData.client_count === 0)
  );
  
  const handleNext = async () => {
    if (currentStep < 4) {
      // Bloqueo preventivo si por alguna razón se pierde el filtro después del paso 1
      if (currentStep >= 1 && !hasAudienceFilter) return;
      setCurrentStep(currentStep + 1);
      return;
    }

    // Lógica de envío en el último paso
    try {
      if (!hasAudienceFilter) {
        alert('Debes seleccionar o construir un filtro antes de crear la campaña.');
        return;
      }

      // Validar que se haya ingresado el valor de la variable especial si la plantilla la requiere
      if (isSpecialVariableValueMissing) {
        console.log('Validación fallida - falta valor de variable especial');
        console.log('hasSpecialVariable:', hasSpecialVariable);
        console.log('special_variable_value:', campaignData.special_variable_value);
        console.log('isSpecialVariableValueMissing:', isSpecialVariableValueMissing);
        alert(`La plantilla seleccionada requiere un valor para la variable especial "${campaignData.selectedTemplateDetails?.special_variable_name}". Por favor, ingresa este valor en el paso anterior.`);
        return;
      }

      // Si hay definición sin guardar, primero mostrar modal de decisión
      if (hasUnsavedDefinition) {
        setShowFilterPrompt(true);
        return; // Esperar decisión del usuario
      }

      // Caso normal (ya tiene audience_filter_id) lanzar directo
      await performLaunch(campaignData.audience_filter_id);

    } catch (error) {
      console.error("Error al crear la campaña:", error);
      alert(`Error al crear la campaña: ${error.message}`);
    }
  };

  /**
   * Crea (si es necesario) el filtro final y lanza la campaña / schedule.
   * @param {string|null} existingFilterId - si ya hay uno guardado.
   * @param {object} saveOptions - { explicitName, description } si el usuario decidió guardar.
   */
  const performLaunch = async (existingFilterId = null, saveOptions = null) => {
    try {
      setLaunchLoading(true);
      let filterIdToUse = existingFilterId;

      // Crear filtro si no existe uno listo
      if (!filterIdToUse) {
        let finalName;
        let finalDescription = null;
        if (saveOptions?.explicitName) {
          finalName = saveOptions.explicitName;
          finalDescription = saveOptions.description || null;
        } else {
          // Nombre automático (flujo "no guardar" para el usuario)
            finalName = `Filtro para Campaña: ${campaignData.name}`;
        }
        const newFilterPayload = new AudienceFilterSimpleCreate(finalName, campaignData.definition, finalDescription);
        const createdFilter = await createSimpleFilter(newFilterPayload);
        filterIdToUse = createdFilter.id;
      }

      if (!filterIdToUse) {
        alert('No se pudo determinar el filtro de audiencia.');
        return;
      }

      if (campaignData.schedule_type === 'recurrent') {
        const schedulePayload = new CampaignScheduleCreate({
          name: campaignData.name,
            channel_type: campaignData.channel.toUpperCase(), // Convert to uppercase
            message_template_id: campaignData.message_template_id,
            audience_filter_id: filterIdToUse,
            target_role: campaignData.target_role,
            codebtor_strategy: (campaignData.target_role === 'CODEUDOR' || campaignData.target_role === 'AMBAS') ? campaignData.codebtor_strategy : null,
            special_variable_value: campaignData.special_variable_value?.trim() || '',
            ...campaignData.schedule_details
        });
        console.log('Creando schedule recurrente:', schedulePayload);
        console.log('Valor de special_variable_value (schedule):', campaignData.special_variable_value);
        console.log('Valor trimmed (schedule):', campaignData.special_variable_value?.trim());
        console.log('Valor final a enviar (schedule):', campaignData.special_variable_value?.trim() || '');
        await createSchedule(schedulePayload);
        alert('¡Campaña recurrente creada con éxito!');
        // Actualizar estadísticas de campañas
        try {
          await refreshCampaignStats();
          toast.success("Actualizando estadísticas de campañas...");
        } catch (err) {
          console.error('Error al actualizar estadísticas:', err);
        }
      } else {
        const campaignPayload = new CampaignCreate({
          name: campaignData.name,
          channel_type: campaignData.channel.toUpperCase(), // Convert to uppercase
          message_template_id: campaignData.message_template_id,
          audience_filter_id: filterIdToUse,
          target_role: campaignData.target_role,
          codebtor_strategy: (campaignData.target_role === 'CODEUDOR' || campaignData.target_role === 'AMBAS') ? campaignData.codebtor_strategy : null,
          scheduled_at: campaignData.scheduled_at || null,
          special_variable_value: campaignData.special_variable_value?.trim() || '',
        });
        console.log('Enviando campaña única:', campaignPayload);
        console.log('Valor de special_variable_value:', campaignData.special_variable_value);
        console.log('Valor trimmed:', campaignData.special_variable_value?.trim());
        console.log('Valor final a enviar:', campaignData.special_variable_value?.trim() || '');
        await createAndLaunchCampaign(campaignPayload);
        alert('¡Campaña creada y lanzada con éxito!');
        // Actualizar estadísticas de campañas
        try {
          await refreshCampaignStats();
          toast.success("Actualizando estadísticas de campañas...");
        } catch (err) {
          console.error('Error al actualizar estadísticas:', err);
        }
      }
      navigate('/campaigns', { state: { refreshNeeded: true } });
    } catch (error) {
      console.error('Error al crear la campaña:', error);
      alert(`Error al crear la campaña: ${error.message}`);
    } finally {
      setLaunchLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    else navigate('/campaigns');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1_ChannelConfig campaignData={campaignData} setCampaignData={setCampaignData} />;
      case 1:
        return <Step2_Segmentation campaignData={campaignData} setCampaignData={setCampaignData} />;
      case 2:
        return <Step3_Template campaignData={campaignData} setCampaignData={setCampaignData} />;
      case 3:
        return <Step4_Scheduling campaignData={campaignData} setCampaignData={setCampaignData} />;
      case 4:
        return <Step5_Confirmation campaignData={campaignData} />;
      default:
        return <div className="text-center py-12">Paso {currentStep + 1} no implementado</div>;
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-5xl mx-auto">
        <Stepper currentStep={currentStep} />
        <div className="my-10">
          {renderStep()}
        </div>
        <div className="flex justify-between items-center pt-6 border-t">
          <button
            onClick={handleBack}
            className="px-6 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            {currentStep === 0 ? 'Cancelar' : 'Anterior'}
          </button>
          <button
            onClick={handleNext}
            disabled={isNextDisabled}
            className={`px-6 py-2 text-white rounded-md font-semibold transition-colors duration-300 ${
              isNextDisabled
                ? 'bg-gray-400 cursor-not-allowed'
                : currentStep === 4
                ? (campaignData.schedule_type === 'recurrent' ? 'bg-purple-600 hover:bg-purple-700' : 
                   campaignData.schedule_type === 'scheduled' ? 'bg-green-600 hover:bg-green-700' : 
                   'bg-blue-600 hover:bg-blue-700')
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            {currentStep < 4 ? 'Siguiente' : 
             campaignData.schedule_type === 'recurrent' ? 'Crear Campaña Recurrente' :
             campaignData.schedule_type === 'scheduled' ? 'Programar Campaña' :
             (launchLoading ? 'Procesando...' : 'Lanzar Campaña')}
          </button>
        </div>
      </div>
      {/* Modal de guardar filtro */}
      <FilterSavePromptModal
        open={showFilterPrompt}
        defaultName={`Filtro para Campaña: ${campaignData.name}`}
        loading={launchLoading}
        onSaveExplicit={async (name, description) => {
          await performLaunch(null, { explicitName: name, description });
        }}
        onSkip={async () => { // Lanzar sin guardar (nombre interno)
          await performLaunch(null, null);
        }}
        onCancel={() => setShowFilterPrompt(false)}
      />
    </div>
  );
};

export default CreateCampaignPage;
