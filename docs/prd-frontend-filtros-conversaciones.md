[PRD]
# PRD Frontend: Filtros de Conversaciones — WhatsApp Dashboard

## Overview
Implementar la UI de filtros segmentados en el listado de conversaciones del dashboard WhatsApp. El backend ya expone los endpoints necesarios. Este PRD describe como el frontend debe consumirlos y renderizar la experiencia.

## Requisitos Previos
- Backend implementado: `GET /api/v1/conversations/` con params `filter` y `coordinator_id`
- Backend implementado: `GET /api/v1/users/my-team`
- Backend implementado: `GET /api/v1/users/coordinators`
- Documentacion completa del backend: `docs/whatsapp/filtros-conversaciones-backend.md`

## Endpoints Disponibles

| Endpoint | Metodo | Permisos | Descripcion |
|----------|--------|----------|-------------|
| `/api/v1/conversations/` | GET | Admin, Coordinador, Gerente, Gestor | Listar conversaciones con filtros |
| `/api/v1/users/my-team` | GET | Admin, Gerente, Coordinador | Listar gestores de un coordinador |
| `/api/v1/users/coordinators` | GET | Admin, Gerente | Listar todos los coordinadores |

---

## US-F01: Dropdown de filtros para Coordinador

**Descripcion:** Como Coordinador, quiero un dropdown en la vista de conversaciones que me permita segmentar por equipo, gestor individual, contactos ambiguos o desconocidos.

**Criterios de Aceptacion:**
- [ ] Se renderiza un dropdown `<select>` o componente equivalente con las siguientes opciones:
  ```
  [ Todos                        v ]
    ├── Todos
    ├── Mi equipo
    ├── Varios clientes
    ├── Desconocidos
    ─── ──────────────────────────
    ├── {full_name} ({extension_3cx})
    └── ...
  ```
- [ ] La lista de gestores se pobla llamando `GET /api/v1/users/my-team` al montar el componente. No requiere `coordinator_id`.
- [ ] Cada gestor se muestra como `{full_name} ({extension_3cx})`. Si `extension_3cx` es null, mostrar solo `{full_name}`.
- [ ] La opcion default es "Todos" (sin filtro).
- [ ] Al cambiar la seleccion, se actualiza la llamada a `/api/v1/conversations/` agregando el query param `filter` segun la tabla:

| Opcion seleccionada | Query param `filter` |
|---------------------|---------------------|
| Todos | No se envia (o `filter=null`) |
| Mi equipo | `filter=team` |
| Varios clientes | `filter=ambiguous` |
| Desconocidos | `filter=unknown` |
| Gestor (uuid) | `filter=gestor:{uuid}` |

- [ ] Se resetea la paginacion a `skip=0` al cambiar filtro.
- [ ] Se muestra un indicador de carga mientras se obtienen los datos.

---

## US-F02: Dropdown de Coordinador y Gestor para Admin/Gerente

**Descripcion:** Como Admin o Gerente, quiero dos dropdowns: uno para seleccionar un coordinador y otro para segmentar las conversaciones de ese coordinador.

**Criterios de Aceptacion:**
- [ ] Se renderizan dos dropdowns:

**Dropdown 1 — Coordinador:**
```
[ Todos los coordinadores        v ]
  ├── Todos los coordinadores          ← sin coordinator_id
  ├── {full_name} ({extension_3cx})
  └── ...
```

**Dropdown 2 — Segmento (se pobla al seleccionar coordinador o siempre visible):**
```
[ Todos                        v ]
  ├── Todos                          ← sin filter
  ├── Mi equipo                      ← filter=team
  ├── Varios clientes                ← filter=ambiguous
  ├── Desconocidos                   ← filter=unknown
  ─── ──────────────────────────
  ├── {full_name} ({extension_3cx})   ← filter=gestor:{uuid}
  └── ...
```

- [ ] La lista de coordinadores se pobla llamando `GET /api/v1/users/coordinators` al montar el componente.
- [ ] Al seleccionar un coordinador, se puebla el dropdown de segmento:
  - Si `coordinator_id` se selecciona, se puebla `GET /api/v1/users/my-team?coordinator_id={uuid}` para obtener los gestores de ese coordinador.
  - La opcion "Mi equipo" solo aparece cuando hay un coordinador seleccionado.
- [ ] Al seleccionar "Todos los coordinadores", el dropdown de segmento se limpia (no tiene sentido filtrar por equipo sin coordinador).
- [ ] Parametros enviados a `/api/v1/conversations/`:

| Coordinador seleccionado | Segmento seleccionado | Params |
|-------------------------|---------------------|--------|
| Todos | Todos | Sin params (vista global) |
| {uuid_coordinador} | Todos | `coordinator_id={uuid}` |
| {uuid_coordinador} | Mi equipo | `coordinator_id={uuid}&filter=team` |
| {uuid_coordinador} | Gestor X | `coordinator_id={uuid}&filter=gestor:{uuid_gestor}` |
| {uuid_coordinador} | Varios clientes | `coordinator_id={uuid}&filter=ambiguous` |
| {uuid_coordinador} | Desconocidos | `coordinator_id={uuid}&filter=unknown` |
| Todos | Gestor X | `filter=gestor:{uuid_gestor}` (sin restriction de coordinador) |

- [ ] Se resetea la paginacion al cambiar cualquier dropdown.

---

## US-F03: No mostrar filtros a Gestor

**Descripcion:** Como Gestor, no debo ver los dropdowns de filtro ya que no tengo permisos para usarlos.

**Criterios de Aceptacion:**
- [ ] Si el usuario tiene rol "Gestor" (y NO tiene Admin, Gerente, ni Coordinador), no se renderizan los dropdowns de filtro.
- [ ] El gestor siempre ve sus conversaciones sin poder filtrar.

---

## US-F04: Manejo de Errores y Estados de Carga

**Descripcion:** Como usuario, quiero ver feedback claro cuando los filtros fallan o los datos estan cargando.

**Criterios de Aceptacion:**
- [ ] **Loading state:** Mientras se ejecuta la llamada a `/conversations/`, mostrar skeleton o spinner en la lista de conversaciones.
- [ ] **Error en filtro por gestor (403):** Si el coordinador intenta filtrar por un gestor fuera de su cartera, mostrar toast/error: "No tienes acceso a este gestor".
- [ ] **Error en filtro invalido (400):** Si se envia un `filter` invalido, mostrar toast: "Filtro no valido".
- [ ] **Error en coordinador (404):** Si el `coordinator_id` no existe, mostrar toast: "Coordinador no encontrado".
- [ ] **Dropdown vacio:** Si `/users/my-team` o `/users/coordinators` retorna `[]`, mostrar opcion "Sin resultados" o deshabilitar el dropdown.

---

## Guia de Integracion por Rol

### Coordinador

```
1. Al montar: GET /api/v1/users/my-team
   - Poblar dropdown con gestores

2. Al seleccionar filtro:
   - "Todos"     → GET /api/v1/conversations/?skip=0&limit=100
   - "Mi equipo" → GET /api/v1/conversations/?filter=team&skip=0&limit=100
   - Gestor X     → GET /api/v1/conversations/?filter=gestor:{uuid}&skip=0&limit=100
   - "Ambiguos"   → GET /api/v1/conversations/?filter=ambiguous&skip=0&limit=100
   - "Desconocidos"→ GET /api/v1/conversations/?filter=unknown&skip=0&limit=100
```

### Admin / Gerente

```
1. Al montar:
   - GET /api/v1/users/coordinators  → poblar dropdown de coordinadores
   - GET /api/v1/users/my-team        → poblar dropdown de gestores (sin coordinator_id)

2. Al seleccionar coordinador:
   - GET /api/v1/users/my-team?coordinator_id={uuid} → poblar gestores de ese coordinador

3. Al aplicar filtro:
   - "Todos" + "Todos coordinadores"    → GET /api/v1/conversations/?skip=0&limit=100
   - "Coordinador X" + "Todos"          → GET /api/v1/conversations/?coordinator_id={uuid}&skip=0&limit=100
   - "Coordinador X" + "Mi equipo"     → GET /api/v1/conversations/?coordinator_id={uuid}&filter=team&skip=0&limit=100
   - "Coordinador X" + "Gestor Y"     → GET /api/v1/conversations/?coordinator_id={uuid}&filter=gestor:{uuid_gestor}&skip=0&limit=100
   - "Todos coordinadores" + "Gestor Y" → GET /api/v1/conversations/?filter=gestor:{uuid_gestor}&skip=0&limit=100
```

### Gestor

```
- No mostrar dropdowns de filtro
- GET /api/v1/conversations/?skip=0&limit=100  (sin cambios)
```

---

## Estructura de Respuesta del Dropdown

### `GET /api/v1/users/my-team` y `/api/v1/users/coordinators`

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "full_name": "Juan Perez",
    "extension_3cx": "1042"
  },
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "full_name": "Maria Lopez",
    "extension_3cx": null
  }
]
```

**Para el label del option:**
```typescript
const label = item.extension_3cx
  ? `${item.full_name} (${item.extension_3cx})`
  : item.full_name;
```

---

## Notas Tecnicas para el Frontend

1. **Los parametros son combinables:** `coordinator_id` define el universo, `filter` lo segmenta. Pero no enviar ambos si no es necesario (mejor UX, menos bandwidth).

2. **`coordinator_id` es ignorado silenciosamente** para Coordinador y Gestor. Solo tiene efecto para Admin/Gerente.

3. **`filter` es ignorado para Gestor.** Siempre ve sus conversaciones.

4. **Respuesta de conversaciones no cambia de estructura.** Los items siguen siendo los mismos objetos `ConversationList` con `assigned_to`, `tags`, `messages`, etc.

5. **`assigned_to_id` puede ser UUID o null.** Asegurar que el frontend maneje ambos tipos correctamente (no hacer comparaciones estrictas de tipo).

6. **Paginacion:** Al cambiar filtro, siempre resetear `skip=0` para volver a la primera pagina.

7. **Los dropdowns se pueblan una sola vez** al montar (no requieren paginacion). Refrescar solo cuando se selecciona un coordinador diferente.
[/PRD]
