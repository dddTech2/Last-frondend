# 📊 Product Requirements Document (PRD): Dashboard Predictivo

## 1. Visión General
Este documento detalla la arquitectura visual, el diseño por componentes, los endpoints a consumir y el stack tecnológico recomendado para la construcción del **Dashboard Predictivo** en el Frontend (React.js). El objetivo principal es dotar al equipo de Frontend con un mapa claro de cómo interactuar dinámicamente con el Backend (FastAPI).

---

## 2. Componentes Base y Arquitectura Visual (Layout)

La aplicación debe estructurarse en dos áreas principales para garantizar una navegación fluida y un contexto constante.

*   **Sidebar Izquierdo (Fijo):** 
    *   **Filtros Globales:** Contiene todos los selectores (`fecha_inicio`, `fecha_fin`, selectores múltiples como `coordinador`, `sistema_origen`, `franja`, etc.).
    *   **Alertas Inteligentes (Bottom):** Renderizado dinámico de avisos. (Ej. *"⚠️ Alerta: Tasa de abandono alta en gestor X"*).
*   **Área Principal (Derecha, scrolleable):**
    *   **Header:** Título del Dashboard y breadcrumbs informativos sobre el periodo activo.
    *   **Sección Top (KPI Grid):** Tarjetas con los KPIs más importantes (Total Llamadas, Acuerdos, Recaudo). Siempre visibles, independientemente de la pestaña activa.
    *   **Navegación por Pestañas (Tabs):** Menú horizontal (Ej. componente `Tabs` de Shadcn UI) para alternar entre las diferentes vistas de análisis profundo.

---

## 3. Estado Global y Contrato Base (El Payload)

Todos los endpoints transaccionales (excepto el de opciones iniciales) reciben el siguiente JSON de filtros en el cuerpo de la petición (`POST`). Se recomienda encarecidamente vincular este JSON al estado global del Frontend (ej. estado de **Zustand**).

**Endpoint Base de la API Frontend:** `POST /api/v1/dashboard/...`

**Payload Base (`DashboardFilters`):**
```json
{
  "fecha_inicio": "2026-03-01",
  "fecha_fin": "2026-03-31",
  "sistemas_origen": [],
  "coordinadores": [],
  "meses": [],
  "franjas": [],
  "categorias_contacto": []
}
```
> **Regla de Oro en Backend:** Si un arreglo viaja vacío `[]`, significa que NO se filtrará por dicha dimensión (es decir, traerá todos los datos disponibles para ese rango de fechas).

---

## 4. Mapeo de Pistas Visuales (Tabs) a Endpoints

### 4.1. Filtros Iniciales y KPIs Generales (Siempre visibles)
*   **1. Poblar Dropdowns del Sidebar al cargar (OnMount):**
    *   `GET /api/v1/dashboard/filtros/opciones` -> Retorna arrays con los valores únicos (Distinct) para inyectar en los `<select multiple>`.
*   **2. Tarjetas Superiores (KPI Grid):**
    *   `POST /api/v1/dashboard/kpis` -> Devuelve los totales macro (total de llamadas, total acuerdos, recaudo total, transferencias) basados en los filtros de fecha y atributos.

### 4.2. Pestaña: Visión General (Dashboard Principal)
*   **Gráfico de Embudo (Funnel Chart):**
    *   `POST /api/v1/dashboard/funnel` -> Retorna un JSON secuencial: Total Predictivo -> Contactos Humanos -> Transferidas -> Gestiones Exitosas. *(Ideal para `@nivo/funnel`)*.
*   **Tendencia Diaria (Líneas):**
    *   `POST /api/v1/dashboard/tendencia` -> Muestra evolución temporal de efectividad / acuerdos día por día. Acepta query params extras si se desea segmentar como `?agrupar_coordinador=true`. *(Ideal para `<LineChart>` de Recharts)*.
*   **Gráfico de Dona (Distribución general):**
    *   `POST /api/v1/dashboard/distribucion-tiempos` -> Retorna el nodo `distribucion` ('Machine', 'Human', 'NoAnswer'). *(Ideal para `<PieChart>` de Recharts)*.

### 4.3. Pestaña: Desempeño (El Componente Mágico `<TabPerformance />`)
Esta vista se reutiliza fuertemente. El Frontend debe crear un componente genérico envolvente `<TabPerformance dimension="X" />` que dibuje una tabla y/o un gráfico de **Barras Horizontales (Ranking por Dinero o Eficiencia)** llamando al siguiente endpoint:
*   **Ranking Dinámico General:**
    *   `POST /api/v1/dashboard/agrupacion/{dimension}` -> `dimension` puede ser `gestor`, `coordinador`, `sistema_origen` o `franja`. Retorna las métricas agrupadas y ordenadas por impacto.

### 4.4. Pestaña: Análisis de Tiempos y Franjas
*   **Promedios de Tiempo Operativo:**
    *   `POST /api/v1/dashboard/distribucion-tiempos` -> Contiene el nodo interno `tiempos_promedio` para medir la espera media o la conversación en caso de éxito. A combinar con un endpoint extra si se decide armar el **Heatmap** de Contactabilidad por Día de Semana vs Hora (`@nivo/heatmap`).
*   *(Opcional / Futuro: Si se requiere gráficar efectividad combinada, usar un `ComposedChart` entre Volumen vs Ratio de Éxito apuntando a la dimensión `franja` del endpoint 5).*

### 4.5. Pestaña: Análisis de Pagos
*   **Gráfico de Impacto por Categoría de Atraso (Barras Verticales):**
    *   `POST /api/v1/dashboard/pagos` -> Agrupa montos (`recaudo_total`) categorizados en 'Anticipado', 'A tiempo', 'Atraso crítico', etc.

### 4.6. Pestaña: Monitoreo de Cola (Auditoría Técnica)
*   **Abandonos vs. Atenciones In-Queue:**
    *   `POST /api/v1/dashboard/analisis-cola` -> Retorna las transferidas a cada gestor y, críticamente, cuántas llamadas la gente colgó estando en su respectiva cola en la PBX. Revela alertas de ineficiencia por gestor para ser procesadas en un **Gráfico de Barras Agrupadas.**

---

## 5. Recomendaciones de Stack y Librerías Frontend
Para que el Dashboard mantenga un estándar de experiencia "Enterprise", reactividad extrema al seleccionar filtros y animaciones fluidas, se estandariza el siguiente stack:

1.  **Manejo del Estado de Filtros:** `Zustand` (Sencillo, global y libre de boilerplate; actualiza el Top Grid y las Tabs simultáneamente).
2.  **Llamadas al API (Data Fetching):** `@tanstack/react-query` (Caché por defecto. Si el usuario filtra "Marzo", cambia a "Abril" y vuelve a "Marzo", los gráficos se renderizarán en 0ms leyendo el historial estático sin contactar al Backend).
3.  **UI & Layouting Base:** `Shadcn UI` + `Tailwind CSS`. Fundamental para obtener de la caja los `Tabs`, el `Sidebar`, las `Cards` (Tarjetas de KPI) y los `Dialogs`.
4.  **Librerías de Visualización de Datos (Gráficos):**
    *   `recharts` -> La piedra angular para Torta, Barras (Horizontales y de Agrupación) y Líneas Simples o Combinadas (ComposedChart).
    *   `@nivo/funnel` -> Específico para un dibujado dinámico del Embudo de pérdida de llamadas predictivo.
    *   `@nivo/heatmap` / `ApexCharts` -> Para uso exclusivo del Heatmap (Mapa de calor de horas de contacto) dado que Recharts tiene limitaciones renderizando matrices de celdas ponderadas.
