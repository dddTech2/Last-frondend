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
import ProductivityReportPage from '../pages/reports/ProductivityReportPage';
import RagManagementPage from '../pages/RagManagementPage';
import ProtectedRoute from './ProtectedRoute';
import UsersPage from '../pages/UsersPage';
import TicketsListPage from '../pages/tickets/TicketsListPage';
import TicketFormPage from '../pages/tickets/TicketFormPage';
import TicketDetailPage from '../pages/tickets/TicketDetailPage';
import EvolutionInstancesPage from '../pages/EvolutionInstancesPage';
import PermissionGuard from '../components/PermissionGuard';

export const AppRouter = () => {
  return (
    <Routes>
      {/* Ruta de Login (Pública) */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas Protegidas */}
      <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<HomePage />} />
        
        {/* Clientes */}
        <Route path="clients" element={
          <PermissionGuard requiredPermission="clients:read">
            <ClientSearchPage />
          </PermissionGuard>
        } />
        <Route path="vision360/:cedula" element={
          <PermissionGuard requiredPermission="clients:read">
            <Vision360Page />
          </PermissionGuard>
        } />

        {/* Usuarios y Roles */}
        <Route path="users" element={
          <PermissionGuard requiredPermissions={["users:read", "roles:manage"]}>
            <UsersPage />
          </PermissionGuard>
        } />

        {/* Campañas */}
        <Route path="campaigns" element={
          <PermissionGuard requiredPermission="campaigns:read">
            <CampaignsPage />
          </PermissionGuard>
        } />
        <Route path="campaigns/new" element={
          <PermissionGuard requiredPermission="campaigns:create">
            <CreateCampaignPage />
          </PermissionGuard>
        } />

        {/* Plantillas */}
        <Route path="templates" element={
          <PermissionGuard requiredPermission="templates:read">
            <TemplateManagerPage />
          </PermissionGuard>
        } />
        <Route path="templates/new" element={
          <PermissionGuard requiredPermission="templates:create">
            <TemplateEditorPage />
          </PermissionGuard>
        } />
        <Route path="templates/:id/edit" element={
          <PermissionGuard requiredPermission="templates:create">
            <TemplateEditorPage />
          </PermissionGuard>
        } />
        <Route path="templates/approval" element={
          <PermissionGuard requiredPermissions={["templates:approve_legal", "templates:approve_ops"]}>
            <TemplateApprovalPage />
          </PermissionGuard>
        } />

        {/* Comunicaciones */}
        <Route path="communications/legal-approval" element={
          <PermissionGuard requiredPermission="communications:approve_legal">
            <LegalCommunicationsApprovalPage />
          </PermissionGuard>
        } />
        <Route path="communications/builder" element={
          <PermissionGuard requiredPermission="communications:generate">
            <CommunicationBuilderPage />
          </PermissionGuard>
        } />
        <Route path="comunicaciones" element={
          <PermissionGuard requiredPermissions={["communications:read", "communications:generate"]}>
            <ComunicacionesPage />
          </PermissionGuard>
        } />

        {/* WhatsApp Chat */}
        <Route path="chat" element={
          <PermissionGuard requiredPermission="whatsapp:chat">
            <WhatsAppChatPage />
          </PermissionGuard>
        } />

        {/* Administración de Personal */}
        <Route path="administracion-personal" element={
          <PermissionGuard requiredPermissions={["employees:read", "employees:write"]}>
            <AdministracionPersonal />
          </PermissionGuard>
        } />

        {/* Workflows / Demográficos */}
        <Route path="workflows" element={
          <PermissionGuard requiredPermission="workflows:manage">
            <DemographicsPage />
          </PermissionGuard>
        } />

        {/* Reportes */}
        <Route path="reports" element={
          <PermissionGuard requiredPermission="reports:read">
            <ReportsLandingPage />
          </PermissionGuard>
        } />
        <Route path="reports/effectiveness" element={
          <PermissionGuard requiredPermission="reports:read">
            <EffectivenessReportPage />
          </PermissionGuard>
        } />
        <Route path="reports/campaign-effectiveness" element={
          <PermissionGuard requiredPermission="reports:read">
            <CampaignEffectivenessPage />
          </PermissionGuard>
        } />
        <Route path="reports/whatsapp-dashboard" element={
          <PermissionGuard requiredPermission="reports:whatsapp:read">
            <WhatsAppDashboardPage />
          </PermissionGuard>
        } />
        <Route path="reports/dashboard-predictivo" element={
          <PermissionGuard requiredPermission="reports:read">
            <DashboardPredictivoPage />
          </PermissionGuard>
        } />
        <Route path="reports/calls" element={
          <PermissionGuard requiredPermission="reports:calls:read">
            <CallsReportPage />
          </PermissionGuard>
        } />
        <Route path="reports/productivity" element={
          <PermissionGuard requiredPermission="reports:productivity:read">
            <ProductivityReportPage />
          </PermissionGuard>
        } />

        {/* RAG Admin */}
        <Route path="rag-admin" element={
          <PermissionGuard requiredPermission="rag:manage">
            <RagManagementPage />
          </PermissionGuard>
        } />

        {/* WhatsApp Evolution */}
        <Route path="whatsapp/evolution" element={
          <PermissionGuard requiredPermission="whatsapp:instances:manage">
            <EvolutionInstancesPage />
          </PermissionGuard>
        } />
        
        {/* Rutas de Tickets */}
        <Route path="tickets" element={
          <PermissionGuard requiredPermissions={["tickets:read", "tickets:create"]}>
            <TicketsListPage />
          </PermissionGuard>
        } />
        <Route path="tickets/nuevo" element={
          <PermissionGuard requiredPermission="tickets:create">
            <TicketFormPage />
          </PermissionGuard>
        } />
        <Route path="tickets/:id" element={
          <PermissionGuard requiredPermission="tickets:read">
            <TicketDetailPage />
          </PermissionGuard>
        } />
      </Route>
    </Routes>
  );
};
