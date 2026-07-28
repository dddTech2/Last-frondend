# SOP: Gestión de Reintegros e Historiales de Empleados

## Objetivo
Establecer el procedimiento operativo estándar en el frontend para el manejo de reintegros de ex-empleados (409 Conflict), así como la visualización del historial de contratos y auditoría de movimientos organizacionales por empleado.

## Endpoints Involucrados

1. **GET `/api/v1/employees/{cedula}`**
   - **Propósito:** Obtener datos actualizados del empleado en tiempo real.
   - **Impacto Frontend:** Mantiene comportamiento existente (0% cambios).

2. **POST `/api/v1/employees/{cedula}/rehire`**
   - **Propósito:** Reintegrar un trabajador retirado (dispara correos de ingreso).
   - **Flujo en Frontend:**
     - Al enviar `POST /api/v1/employees/` y recibir un HTTP `409 Conflict` (empleado en estado RETIRADO), se despliega un diálogo de confirmación:
       *"Esta cédula pertenece a un extrabajador retirado. ¿Deseas procesar su reintegro?"*
     - Si el usuario confirma, el frontend envía el formulario a `POST /api/v1/employees/{cedula}/rehire`.

3. **GET `/api/v1/employees/{cedula}/contract-history`**
   - **Propósito:** Obtener el historial de vinculaciones y contratos pasados de la cédula.
   - **Renderizado UI:** Pestaña "Contratos Anteriores" dentro de la vista detallada del empleado (`PersonalDetailView`).

4. **GET `/api/v1/employees/{cedula}/movement-history`**
   - **Propósito:** Obtener la auditoría silenciosa de cambios organizacionales (cambios de jefe, ascensos, ajustes salariales, cambios de área).
   - **Renderizado UI:** Pestaña "Historial de Movimientos" dentro de la vista detallada del empleado (`PersonalDetailView`).

## Restricciones y Casos Borde
- El endpoint de rehire requiere los datos de la nueva vinculación (`fecha_ingreso`, `tipo_contrato`, `jefe_inmediato`, `area`, `cargo`, `ciudad`, etc.).
- Si el backend devuelve error 409 con mensaje diferente a empleado retirado, mostrar la notificación de error correspondiente sin forzar el diálogo de reintegro.
- Las consultas de historial (`contract-history` y `movement-history`) deben ser resilientes: si no existen registros previos o la API retorna lista vacía, mostrar estados descriptivos de "Sin registros".
