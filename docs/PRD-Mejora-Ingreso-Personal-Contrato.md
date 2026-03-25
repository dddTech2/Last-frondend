# PRD: Mejora Modal Ingreso Personal — Campos de Contrato (Frontend)

## Fecha
2026-02-18

## Overview

Mejorar el modal de **Ingreso de Personal** en la ruta `/administracion-personal` para agregar campos condicionales que aplican cuando el tipo de contrato es **PLANTA** o **CORRETAJE**. Los nuevos campos son: **Asignación Salarial** (con formato de miles), **Tipo de Contrato Laboral** (dropdown FIJO/INDEFINIDO), **Fecha de Terminación de Contrato** (condicional si el tipo es FIJO) y **Observaciones de Contrato**. Estos datos deben visualizarse correctamente en la vista de detalle (`PersonalDetailView`) cuando el empleado pasa a **Aprobación Jurídica**.

## Goals

- Permitir registrar información contractual completa para empleados de tipo PLANTA y CORRETAJE
- Mostrar/ocultar campos condicionalmente según el tipo de contrato seleccionado
- Formatear la asignación salarial con separador de miles para mejor UX
- Garantizar que la información contractual sea visible en el detalle del empleado, especialmente para el flujo de aprobación jurídica
- Validar campos obligatorios condicionales antes de enviar al backend

## Quality Gates

- El formulario no debe permitir enviar datos incompletos cuando los campos son obligatorios
- El formato de miles debe funcionar correctamente al escribir y al visualizar
- Los campos condicionales deben mostrarse/ocultarse sin parpadeo
- La vista de detalle debe mostrar los nuevos campos cuando existan datos
- No deben romperse los flujos existentes de creación de empleados con otros tipos de contrato

---

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useIngresoForm.js` | Agregar nuevos campos al estado inicial + reglas de validación condicional |
| `src/components/IngresoPersonalForm.jsx` | Agregar sección de campos contractuales condicionales en Step 2 + renderizar en Step 3 (resumen) |
| `src/components/PersonalDetailView.jsx` | Mostrar los nuevos campos en la sección "Información Laboral" |
| `src/services/api.js` | Verificar que el payload incluya los nuevos campos al enviar al backend |

---

## User Stories

### US-FRONT-001: Agregar campos condicionales al formulario de ingreso

**Descripción:** Como usuario de Talento Humano, cuando selecciono un tipo de contrato **PLANTA** o **CORRETAJE** en el formulario de ingreso, quiero ver campos adicionales de información contractual para registrar la asignación salarial, tipo de contrato laboral, fecha de terminación (si aplica) y observaciones.

**Archivos a modificar:**
- `src/hooks/useIngresoForm.js`
- `src/components/IngresoPersonalForm.jsx`

**Acceptance Criteria:**

- [ ] Agregar al `defaultState` de `useIngresoForm.js` los siguientes campos:
  ```js
  asignacion_salarial: '',        // Número, formateado con miles
  tipo_contrato_laboral: '',      // 'FIJO' o 'INDEFINIDO'
  fecha_terminacion_contrato: '', // Date, solo si tipo_contrato_laboral === 'FIJO'
  observaciones_contrato: '',     // Texto libre
  ```
- [ ] Implementar regla de validación condicional: los campos `asignacion_salarial` y `tipo_contrato_laboral` son **obligatorios** cuando `contrato` es `PLANTA` o `CORRETAJE`
- [ ] Si `tipo_contrato_laboral === 'FIJO'`, el campo `fecha_terminacion_contrato` es **obligatorio**
- [ ] Si `tipo_contrato_laboral === 'INDEFINIDO'`, el campo `fecha_terminacion_contrato` debe limpiarse y no mostrarse
- [ ] Si `contrato` NO es `PLANTA` ni `CORRETAJE`, todos estos campos deben limpiarse y no mostrarse
- [ ] Agregar los nuevos campos a la función `getCleanData()` con los nombres que espera el backend:
  - `asignacion_salarial` → enviar como número (sin formato de miles), solo cuando aplica
  - `tipo_contrato_laboral` → 'FIJO' o 'INDEFINIDO', solo cuando aplica
  - `fecha_terminacion_contrato` → fecha ISO, solo cuando aplica (tipo FIJO)
  - `observaciones_contrato` → texto, solo cuando aplica
- [ ] Agregar la validación de los nuevos campos en `validateAll()` de forma condicional

### US-FRONT-002: Implementar campo Asignación Salarial con formato de miles

**Descripción:** Como usuario de Talento Humano, al ingresar la asignación salarial, quiero que se muestre el formato con separadores de miles (ej: 1.500.000) para facilitar la lectura, pero que internamente se almacene como número limpio.

**Archivos a modificar:**
- `src/components/IngresoPersonalForm.jsx`

**Acceptance Criteria:**

- [ ] Crear un handler `handleSalarioChange` que:
  - Limpie caracteres no numéricos del input
  - Formatee el valor con puntos de miles al estilo colombiano (ej: `1.500.000`)
  - Almacene en `formData.asignacion_salarial` el valor sin formato (solo dígitos)
- [ ] El campo debe mostrar el valor formateado visualmente (con puntos de miles)
- [ ] En el resumen (Step 3), mostrar el valor con formato `$1.500.000`
- [ ] El input debe tener tipo `text` (no `number`) para permitir el formato visual
- [ ] Máximo: 999.999.999 (limitar a 9 dígitos)
- [ ] Mínimo: 1 (no permitir 0 ni vacío cuando es requerido)

### US-FRONT-003: Renderizar sección condicional de información contractual en Step 2

**Descripción:** Como usuario, cuando el tipo de contrato sea PLANTA o CORRETAJE, quiero ver una sección adicional en el paso 2 del formulario con los campos de información contractual.

**Archivos a modificar:**
- `src/components/IngresoPersonalForm.jsx`

**Acceptance Criteria:**

- [ ] En la función `renderStep2()`, después del select de "Tipo de Contrato" y el `SelectJefeInmediato`, agregar un bloque condicional:
  ```jsx
  {(formData.contrato === 'PLANTA' || formData.contrato === 'CORRETAJE') && (
    <div className="..."> {/* Sección Información Contractual */}
      ... campos ...
    </div>
  )}
  ```
- [ ] Incluir banner informativo con estilo similar a los existentes:
  ```
  📋 Información Contractual
  Estos datos son requeridos para contratos de tipo Planta y Corretaje
  ```
- [ ] El campo **Asignación Salarial** debe usar el handler de formato de miles
- [ ] El campo **Tipo de Contrato Laboral** debe ser un `<select>` con opciones `FIJO` e `INDEFINIDO`
- [ ] El campo **Fecha de Terminación de Contrato** solo se muestra si `tipo_contrato_laboral === 'FIJO'`, con `min` igual a la fecha actual
- [ ] El campo **Observaciones de Contrato** debe ser un `<textarea>` o `FormField type="text"` multilínea
- [ ] Los campos deben usar la misma estructura visual (grid 2 columnas) que el resto del formulario
- [ ] Agregar validaciones de campos faltantes a `getMissingStep2Fields()` condicionalmente
- [ ] Agregar validación condicional a `isStep2Valid()`

### US-FRONT-004: Mostrar información contractual en resumen (Step 3)

**Descripción:** Como usuario, en el paso 3 de confirmación, quiero ver los datos contractuales si fueron diligenciados.

**Archivos a modificar:**
- `src/components/IngresoPersonalForm.jsx`

**Acceptance Criteria:**

- [ ] En `renderStep3()`, dentro de la sección "Datos Laborales", agregar condicionalmente:
  ```
  Asignación Salarial: $1.500.000
  Tipo de Contrato Laboral: Fijo / Indefinido
  Fecha Terminación de Contrato: 15 de junio de 2027 (solo si es FIJO)
  Observaciones de Contrato: [texto de observaciones]
  ```
- [ ] Agregar al `dropdownMaps` en `formatValue()` el mapeo para `tipo_contrato_laboral`:
  ```js
  tipo_contrato_laboral: { 'FIJO': 'Fijo', 'INDEFINIDO': 'Indefinido' }
  ```
- [ ] Formatear `asignacion_salarial` como `$X.XXX.XXX` en el resumen
- [ ] Formatear `fecha_terminacion_contrato` como fecha legible (similar a `fecha_ingreso`)
- [ ] Si no hay datos contractuales (contrato no es PLANTA/CORRETAJE), no mostrar la sección

### US-FRONT-005: Mostrar información contractual en vista de detalle del empleado

**Descripción:** Como usuario de Jurídica, al ver el detalle de un empleado pendiente de aprobación, quiero ver la información contractual (asignación salarial, tipo de contrato laboral, etc.) para tomar la decisión de aprobación o rechazo.

**Archivos a modificar:**
- `src/components/PersonalDetailView.jsx`

**Acceptance Criteria:**

- [ ] Agregar al destructuring de `personal` los nuevos campos:
  ```js
  asignacion_salarial,
  tipo_contrato_laboral,
  fecha_terminacion_contrato,
  observaciones_contrato,
  ```
- [ ] En la sección **"Información Laboral"**, después de los campos existentes, agregar condicionalmente los nuevos campos:
  ```jsx
  {asignacion_salarial && (
    <Row icon={CreditCard} label="Asignación Salarial" value={`$${Number(asignacion_salarial).toLocaleString('es-CO')}`} />
  )}
  {tipo_contrato_laboral && (
    <Row icon={FileText} label="Tipo de Contrato Laboral" value={tipo_contrato_laboral === 'FIJO' ? 'Fijo' : 'Indefinido'} />
  )}
  {tipo_contrato_laboral === 'FIJO' && fecha_terminacion_contrato && (
    <Row icon={Calendar} label="Fecha Terminación de Contrato" value={formatDate(fecha_terminacion_contrato)} />
  )}
  {observaciones_contrato && (
    <Row icon={FileText} label="Observaciones de Contrato" value={observaciones_contrato} />
  )}
  ```
- [ ] Estos campos solo se renderizan si tienen valor (no mostrar "---" si no aplican al tipo de contrato)
- [ ] El valor de `asignacion_salarial` debe mostrarse como moneda colombiana con separador de miles

---

## Guía de Implementación

### Orden sugerido:
1. **US-FRONT-001**: Modificar `useIngresoForm.js` (estado + validación)
2. **US-FRONT-002**: Crear handler de formato de miles en `IngresoPersonalForm.jsx`
3. **US-FRONT-003**: Renderizar campos condicionales en Step 2
4. **US-FRONT-004**: Actualizar Step 3 (resumen)
5. **US-FRONT-005**: Actualizar `PersonalDetailView.jsx`

### Notas Técnicas:

- **Formato de miles colombiano**: Usar `.` como separador de miles (no `,`). Ej: `1.500.000`
  ```js
  const formatCurrency = (value) => {
    if (!value) return '';
    const num = value.toString().replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };
  ```

- **Limpieza de campos condicionales**: Cuando el usuario cambia de un contrato PLANTA/CORRETAJE a otro tipo, los campos deben limpiarse automáticamente. Agregar un `useEffect` en `useIngresoForm.js`:
  ```js
  useEffect(() => {
    if (formData.contrato !== 'PLANTA' && formData.contrato !== 'CORRETAJE') {
      setFormData(prev => ({
        ...prev,
        asignacion_salarial: '',
        tipo_contrato_laboral: '',
        fecha_terminacion_contrato: '',
        observaciones_contrato: '',
      }));
    }
  }, [formData.contrato]);
  ```

- **Limpieza de fecha terminación**: Cuando cambia `tipo_contrato_laboral` de FIJO a INDEFINIDO:
  ```js
  useEffect(() => {
    if (formData.tipo_contrato_laboral !== 'FIJO') {
      setFormData(prev => ({
        ...prev,
        fecha_terminacion_contrato: '',
      }));
    }
  }, [formData.tipo_contrato_laboral]);
  ```

- **getCleanData()**: Al enviar al backend, solo incluir los nuevos campos si `contrato` es PLANTA o CORRETAJE. Enviar `asignacion_salarial` como número sin formato.

---

## Non-Goals (Out of Scope)

- Modificar el backend (se documenta en PRD aparte)
- Crear migraciones de base de datos
- Modificar los templates de email
- Agregar estos campos para otros tipos de contrato (TEMPORAL, OBRA_LABOR, etc.)
- Edición de información contractual post-creación (versión futura)

---

## Dependencias

| Dependencia | Descripción |
|-------------|-------------|
| **Backend PRD** | Los nuevos campos deben existir en el modelo `MasterEmployee`, el schema Pydantic y la migración Alembic |
| **API Endpoint** | El endpoint `POST /employees` debe aceptar los nuevos campos opcionales |

---

## Success Metrics

- Campos condicionales aparecen/desaparecen instantáneamente al cambiar tipo de contrato
- El formato de miles funciona correctamente (escribir, pegar, borrar)
- La vista de detalle muestra la información contractual para empleados PLANTA/CORRETAJE
- El flujo de aprobación jurídica muestra toda la información contractual relevante
- No hay regresiones en la creación de empleados con otros tipos de contrato
