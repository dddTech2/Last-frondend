// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SERVICE_SUSPENDED } from './config/serviceStatus.js';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

if (SERVICE_SUSPENDED) {
  // Servicio suspendido: solo se carga el aviso; la app y sus llamadas al backend no se cargan.
  import('./pages/ServiceSuspendedPage.jsx').then(({ default: ServiceSuspendedPage }) => {
    root.render(
      <React.StrictMode>
        <ServiceSuspendedPage />
      </React.StrictMode>,
    );
  });
} else {
  Promise.all([
    import('react-router-dom'),
    import('@tanstack/react-query'),
    import('./context/AuthContext.jsx'),
    import('./App.jsx'),
  ]).then(([{ BrowserRouter }, { QueryClient, QueryClientProvider }, { AuthProvider }, { default: App }]) => {
    // Crear instancia de QueryClient para el manejo de caché y fetching de datos
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false, // previene refetch innecesario
        },
      },
    });

    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </React.StrictMode>,
    );
  });
}
