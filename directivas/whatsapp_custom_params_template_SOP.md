# SOP: Envío de Plantillas WhatsApp con Variables Personalizadas (custom_params)

## 1. Objetivo
Establecer el procedimiento operativo estándar para la integración del formulario dinámico de variables personalizadas (`custom_params`) en el flujo de envío de plantillas de WhatsApp dentro del frontend.

## 2. Entradas y Salidas
- **Entradas:**
  - `template_id`: ID de la plantilla seleccionada por el gestor.
  - `cedula`: Cédula del cliente.
  - `phone_number`: Número telefónico de destino en formato internacional E.164.
  - `obligacion`: Identificador de la obligación del cliente.
  - `GET /api/v1/templates/{template_id}/variables-detail`: Retorna `detected_variables`.
  - `GET /api/v1/templates/{template_id}/preview?cedula={cedula}&obligacion={obligacion}`: Retorna el contenido precargado con datos de BD.
- **Salidas:**
  - `POST /api/v1/whatsapp/send_from_template` con el objeto `custom_params` opcional.

## 3. Reglas de Negocio y Lógica de Construcción
1. **Variables del Sistema (Solo Lectura):**
   - Las variables reservadas del sistema (`nombre_cliente`, `cedula`, `cliente`, `obligacion`, `asesor`, `nombre_gestor`) no son editables por el gestor.
2. **Variables Negociables / Especiales:**
   - Variables de negocio (ej: `valor_cuota`, `fecha_pago`, `SPECIAL:fecha`) se renderizan como inputs editables.
   - Las claves en `custom_params` deben conservar el nombre exacto de la plantilla, incluyendo el prefijo `SPECIAL:` si aplica.
   - En la interfaz de usuario (UI), los labels deben limpiarse removiendo el prefijo `SPECIAL:` para mostrar un texto amigable.
3. **Previsualización Interactiva (Live Preview):**
   - Cuando el gestor modifica el valor de un campo editable en la UI, el texto compilado de la previsualización debe actualizarse dinámicamente.
4. **Construcción del Payload:**
   - Solo se deben enviar en `custom_params` aquellas variables que tengan valores ingresados o modificados por el gestor.
   - Si no se modifica ninguna variable, no se envía el objeto `custom_params` o se envía vacío.

## 4. Componentes Afectados
- `src/services/api.js`: Exportar `getTemplateVariablesDetail`.
- `src/components/InitiateConversationModal.jsx`: Agregar paso de edición interactiva de variables en previsualización.
- `src/components/ExpiredSessionModal.jsx`: Agregar paso de edición interactiva de variables en previsualización.
- `src/pages/WhatsAppChatPage.jsx`: Integrar soporte para `custom_params` al enviar plantillas directamente desde la barra de chat.
- `src/components/TemplateVariableForm.jsx`: (Nuevo Componente Reutilizable) Componente modular para la edición y sincronización reactiva de `custom_params`.

## 5. Trampas Conocidas y Casos Borde
- **Nombres con prefijo SPECIAL:** No remover `SPECIAL:` de la clave del objeto `custom_params` al construir el JSON de envío a la API Backend.
- **Campos Vacíos:** No incluir claves con strings vacíos `""` o `null` si el usuario borra el campo, para permitir que el backend mantenga la lógica de autocompletado por defecto con la base de datos.
- **Formato de Números y Fechas:** Mantener el formateo ingresado por el usuario sin alterar caracteres como puntos o guiones.
