// Interruptor de suspensión del servicio.
// En `true` la aplicación NO se monta (no hay login, ni llamadas al backend)
// y solo se muestra el aviso de servicio suspendido.
// Para restablecer el servicio: cambiar a `false`, recompilar y desplegar.
// También puede forzarse en build con VITE_SERVICE_SUSPENDED=true|false.
const envFlag = import.meta.env.VITE_SERVICE_SUSPENDED;

export const SERVICE_SUSPENDED = envFlag !== undefined ? envFlag === 'true' : true;
