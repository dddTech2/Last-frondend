# SOP: Envío de Plantillas WhatsApp con Variables Personalizadas y Adjuntos Multimedia (custom_params)

## 1. Objetivo
Establecer el procedimiento operativo estándar para la integración del formulario dinámico de variables personalizadas (`custom_params`) y la carga interactiva de archivos adjuntos multimedia (`document_link` / `document_filename`) en el flujo de envío de plantillas de WhatsApp dentro del frontend.

## 2. Entradas y Salidas
- **Entradas:**
  - `template_id`: ID de la plantilla seleccionada por el gestor.
  - `cedula`: Cédula del cliente.
  - `phone_number`: Número telefónico de destino en formato internacional E.164.
  - `obligacion`: Identificador de la obligación del cliente.
  - `GET /api/v1/templates/{template_id}`: Retorna la estructura completa de la plantilla con `components.header.format`.
  - `GET /api/v1/templates/{template_id}/variables-detail`: Retorna `detected_variables`.
  - `GET /api/v1/templates/{template_id}/preview?cedula={cedula}&obligacion={obligacion}`: Retorna el contenido precargado con datos de BD y formato de header.
- **Salidas:**
  - `POST /api/v1/whatsapp/send_from_template` con el objeto `custom_params` opcional conteniendo variables y/o `document_link` + `document_filename`.

## 3. Reglas de Negocio y Lógica de Construcción
1. **Detección Estricta del Header Multimedia:**
   - La propiedad clave para determinar si una plantilla requiere/admite adjunto es `template.components?.header?.format` proveniente del endpoint `GET /api/v1/templates/{template_id}`.
   - Si `headerFormat` es `"DOCUMENT"`, `"IMAGE"` o `"VIDEO"`, la plantilla requiere adjunto.
2. **Variables del Sistema (Solo Lectura):**
   - Las variables reservadas del sistema (`nombre_cliente`, `cedula`, `cliente`, `obligacion`, `asesor`, `nombre_gestor`) no son editables por el gestor.
3. **Variables Negociables / Especiales:**
   - Variables de negocio (ej: `valor_cuota`, `fecha_pago`, `SPECIAL:fecha`) se renderizan como inputs editables.
   - Las claves en `custom_params` deben conservar el nombre exacto de la plantilla, incluyendo el prefijo `SPECIAL:` si aplica.
   - En la interfaz de usuario (UI), los labels deben limpiarse removiendo el prefijo `SPECIAL:` para mostrar un texto amigable.
4. **Manejo de Adjuntos Multimedia (Meta Rules):**
   - Si `hasAttachment` es verdadero (`['DOCUMENT', 'IMAGE', 'VIDEO'].includes(headerFormat)`), el frontend **DEBE** renderizar la sección de adjuntar archivo independientemente de si hay o no otras variables de texto.
   - Al cargar un archivo local:
     1. Se genera la Signed URL de carga mediante `getSignedUploadUrl(9999, file.type, file.name)`.
     2. Se realiza la subida `PUT` del archivo al almacenamiento en la nube (GCS).
     3. Se inyecta la URL del archivo subido en `custom_params.document_link` y el nombre del archivo en `custom_params.document_filename`.
   - Si la plantilla fue aprobada como "TEXT" o sin header (`null`), Meta no permite adjuntarle archivos en el envío.
5. **Previsualización Interactiva (Live Preview):**
   - Cuando el gestor modifica el valor de un campo editable en la UI o adjunta un archivo, la vista previa refleja los cambios dinámicamente.
6. **Construcción del Payload:**
   - Solo se deben enviar en `custom_params` aquellas variables que tengan valores ingresados o modificados por el gestor, incluyendo `document_link` y `document_filename` si hay un adjunto presente.

## 4. Componentes Afectados
- `src/components/TemplateVariableForm.jsx`: Inspeccionar `template.components?.header?.format` para renderizar el uploader multimedia dinámico (Documento, Imagen o Video) sin ocultarse si `detected_variables` está vacío.
- `src/components/InitiateConversationModal.jsx`: Consultar `getTemplateById(templateId)` para pasar el objeto completo de la plantilla con `components.header.format`.
- `src/components/ExpiredSessionModal.jsx`: Consultar `getTemplateById(templateId)` para pasar el objeto completo de la plantilla con `components.header.format`.
- `src/pages/WhatsAppChatPage.jsx`: Consultar `getTemplateById(templateId)` para pasar la plantilla completa.

## 5. Trampas Conocidas y Casos Borde (Auto-Corrección)
- **Nota Crítica de Inspección:** No confiar únicamente en la lista resumida `getTemplates()`, ya que la propiedad `components.header.format` se encuentra en la respuesta del objeto detallado de la plantilla (`GET /api/v1/templates/{template_id}`). El frontend DEBE extraer `template.components?.header?.format` o llamar a `getTemplateById(template_id)`.
- **Renderizado Obligatorio:** Si `['DOCUMENT', 'IMAGE', 'VIDEO'].includes(headerFormat)` es verdadero, `TemplateVariableForm` **NUNCA debe retornar null**, incluso si `detected_variables` viene vacío (`[]`). Debe mostrar la zona de arrastre/carga para el adjunto.
- **Nombres con prefijo SPECIAL:** No remover `SPECIAL:` de la clave del objeto `custom_params` al construir el JSON de envío a la API Backend.
- **Campos Vacíos:** No incluir claves con strings vacíos `""` o `null` si el usuario borra el campo.
