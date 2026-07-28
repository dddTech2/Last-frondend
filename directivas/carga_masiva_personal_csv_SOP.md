# SOP: Carga Masiva de Personal vía CSV (`/api/v1/employees/bulk-update`)

## Objetivo
Proporcionar un procedimiento estandarizado para la carga masiva y actualización parcial de empleados en la plataforma Renovar a través de archivos CSV delimitados por comas `,`.

## Requisitos y Roles
- **Roles autorizados:** `Admin`, `Super Administrador`, `talento_humano`, `Tecnologia`.
- **Endpoint:** `POST /api/v1/employees/bulk-update`
- **Formato:** Archivo `.csv` codificado en UTF-8 con delimitador coma `,`.

## Estructura y Reglas del CSV
1. **Identificador Obligatorio:**
   - La columna `cedula` (o `CEDULA`) es requerida en cada fila del CSV.
2. **Actualizaciones Parciales:**
   - Si la cédula existe en la base de datos, solo las columnas presentes en el CSV con valor modificarán los datos del empleado.
   - Las celdas/columnas vacías se ignoran y no sobreescriben la información existente.
3. **Creación de Empleados:**
   - Si la cédula no existe, se intenta crear el registro completo.
4. **Formato de Fechas:**
   - Formatos soportados: `DD/MM/YYYY` o `YYYY-MM-DD`.
5. **Limpieza Automática (Backend):**
   - El sistema automáticamente elimina espacios al inicio/final y convierte las cadenas a mayúsculas.

## Columnas Soportadas
`cedula`, `nombre_completo`, `area`, `cargo`, `jefe_inmediato`, `tipo_contrato`, `estado`, `ciudad`, `localidad`, `fecha_ingreso`, `fecha_nacimiento`, `genero`, `direccion_residencia`, `eps`, `fondo_pensiones`, `arl`, `celular`, `correo_personal`, `contacto_emergencia_nombre`, `contacto_emergencia_telefono`, `cantidad_hijos`, `temporal`, `fecha_fin_contrato_temporal`, `adminfo`, `correo_renovar`

## Manejo de Errores
- Si una fila tiene errores de validación (ej. formato inválido o datos requeridos faltantes), el backend retorna un array de `errors` indicando la cédula y el detalle del error, sin interrumpir el procesamiento de las demás filas válidas.
