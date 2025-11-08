// src/routes/AppRouter.jsx
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import CampaignsPage from '../pages/CampaignsPage';
import CreateCampaignPage from '../pages/CreateCampaignPage';
import TemplateManagerPage from '../pages/TemplateManagerPage';
import TemplateEditorPage from '../pages/TemplateEditorPage';
import TemplateApprovalPage from '../pages/TemplateApprovalPage';
import WhatsAppChatPage from '../pages/WhatsAppChatPage';
import AdministracionPersonal from '../pages/AdministracionPersonal';
import ComunicacionesPage from '../pages/ComunicacionesPage';
import ProtectedRoute from './ProtectedRoute';
export const AppRouter = () => {
  return (
    <Routes>
      {/* Ruta de Login (Pública) */}

  <Route path="/login" element={<LoginPage />} />

      {/* Rutas Protegidas */}
      <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<HomePage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="campaigns/new" element={<CreateCampaignPage />} />
        <Route path="templates" element={<TemplateManagerPage />} />
        <Route path="templates/new" element={<TemplateEditorPage />} />
        <Route path="templates/:id/edit" element={<TemplateEditorPage />} />
        <Route path="templates/approval" element={<TemplateApprovalPage />} />
        <Route path="chat" element={<WhatsAppChatPage />} />
        <Route path="administracion-personal" element={<AdministracionPersonal />} />
        <Route path="comunicaciones" element={<ComunicacionesPage />} />
        {/* Aquí se pueden añadir más rutas protegidas */}
      </Route>
    </Routes>
  );
};
