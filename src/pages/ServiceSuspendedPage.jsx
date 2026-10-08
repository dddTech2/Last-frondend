import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ServiceSuspendedPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-red-100 p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Servicio temporalmente suspendido
        </h1>
        <p className="text-gray-600">
          El acceso a la plataforma se encuentra suspendido por temas
          administrativos pendientes. Para restablecer el servicio,
          comuníquese con su proveedor para normalizar el estado de su cuenta.
        </p>
      </div>
    </div>
  );
};

export default ServiceSuspendedPage;
