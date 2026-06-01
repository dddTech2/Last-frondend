// src/routes/AppRouter.jsx
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import CampaignsPage from '../pages/CampaignsPage';
import CreateCampaignPage from '../pages/CreateCampaignPage';
import TemplateManagerPage from '../pages/TemplateManagerPage';
import TemplateEditorPage from '../pages/TemplateEditorPage';
import TemplateApprovalPage from '../pages/TemplateApprovalPage';
import LegalCommunicationsApprovalPage from '../pages/LegalCommunicationsApprovalPage';
import WhatsAppChatPage from '../pages/WhatsAppChatPage';
import AdministracionPersonal from '../pages/AdministracionPersonal';
import ComunicacionesPage from '../pages/ComunicacionesPage';
import CommunicationBuilderPage from '../pages/CommunicationBuilderPage';
import DemographicsPage from '../pages/DemographicsPage';
import ClientSearchPage from '../pages/ClientSearchPage';
import Vision360Page from '../pages/Vision360Page';
import ReportsLandingPage from '../pages/reports/ReportsLandingPage';
import EffectivenessReportPage from '../pages/reports/EffectivenessReportPage';
import CampaignEffectivenessPage from '../pages/reports/CampaignEffectivenessPage';
import WhatsAppDashboardPage from '../pages/reports/WhatsAppDashboardPage';
import DashboardPredictivoPage from '../pages/DashboardPredictivo';
import CallsReportPage from '../pages/reports/CallsReportPage';
import RagManagementPage from '../pages/RagManagementPage';
import ProtectedRoute from './ProtectedRoute';
import UsersPage from '../pages/UsersPage';
import TicketsListPage from '../pages/tickets/TicketsListPage';
import TicketFormPage from '../pages/tickets/TicketFormPage';
import TicketDetailPage from '../pages/tickets/TicketDetailPage';

export const AppRouter = () => {
  return (
    <Routes>
      {/* Ruta de Login (Pública) */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas Protegidas */}
      <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<HomePage />} />
        <Route path="clients" element={<ClientSearchPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="vision360/:cedula" element={<Vision360Page />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="campaigns/new" element={<CreateCampaignPage />} />
        <Route path="templates" element={<TemplateManagerPage />} />
        <Route path="templates/new" element={<TemplateEditorPage />} />
        <Route path="templates/:id/edit" element={<TemplateEditorPage />} />
        <Route path="templates/approval" element={<TemplateApprovalPage />} />
        <Route path="communications/legal-approval" element={<LegalCommunicationsApprovalPage />} />
        <Route path="communications/builder" element={<CommunicationBuilderPage />} />
        <Route path="chat" element={<WhatsAppChatPage />} />
        <Route path="administracion-personal" element={<AdministracionPersonal />} />
        <Route path="comunicaciones" element={<ComunicacionesPage />} />
        <Route path="workflows" element={<DemographicsPage />} />
        <Route path="reports" element={<ReportsLandingPage />} />
        <Route path="reports/effectiveness" element={<EffectivenessReportPage />} />
        <Route path="reports/campaign-effectiveness" element={<CampaignEffectivenessPage />} />
        <Route path="reports/whatsapp-dashboard" element={<WhatsAppDashboardPage />} />
        <Route path="reports/dashboard-predictivo" element={<DashboardPredictivoPage />} />
        <Route path="reports/calls" element={<CallsReportPage />} />
        <Route path="rag-admin" element={<RagManagementPage />} />
        
        {/* Rutas de Tickets */}
        <Route path="tickets" element={<TicketsListPage />} />
        <Route path="tickets/nuevo" element={<TicketFormPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        
        {/* Aquí se pueden añadir más rutas protegidas */}
      </Route>
    </Routes>
  );
};
