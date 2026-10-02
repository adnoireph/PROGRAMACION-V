# Endpoint GET de eventos por materia

## Objetivo

Consultar los eventos de una materia que pertenece al usuario de la solicitud.

- **Ruta:** `GET /api/v1/materias/:id/eventos`
- **`id`:** identificador de la materia recibido en `request.params.id`.
- **`userId`:** identificador del usuario obtenido de `request.user.id`.
- **Respuesta exitosa:** HTTP 200 con `{ "success": true, "data": [...] }`.
- **Sin eventos:** HTTP 200 con `data: []`.
- **Materia inexistente o de otro usuario:** el servicio valida la propiedad con `getMateriaById`; el error centralizado responde HTTP 404.

## Implementación

### Ruta

En `src/routes/materias.routes.js`, la ruta está registrada en el router de materias:

```js
router.get("/:id/eventos", listEventosByMateria);
```

`src/app.js` monta este router bajo `/api/v1/materias`.

### Controlador

`listEventosByMateria(request, response, next)` valida el ID con `validateMateriaId`, obtiene el usuario desde `request.user.id`, llama a `materiasService.listEventosByMateria` y responde mediante `sendSuccess(response, eventos)`. Los errores se propagan con `next(error)`.

### Servicio

`listEventosByMateria(materiaId, userId)` verifica primero que la materia exista y pertenezca al usuario mediante `getMateriaById`. Después solicita los eventos al repositorio con `findEventosByMateriaAndUserId`.

### Repositorio

`findEventosByMateriaAndUserId(id, userId)` consulta `evento` con `pool.execute`, une la tabla `materia` y filtra por materia y usuario mediante parámetros:

```sql
WHERE m.id_materia = ? AND m.id_usuario = ?
```

La consulta devuelve estos campos con alias camelCase cuando corresponde:

- `id_evento AS id`
- `id_materia AS materiaId`
- `titulo`
- `descripcion`
- `fecha`
- `hora_inicio AS horaInicio`
- `hora_fin AS horaFin`
- `tipo`
- `created_at AS createdAt`
- `updated_at AS updatedAt`

El repositorio retorna el arreglo `rows`. Si no hay eventos, el arreglo está vacío.

## Validaciones y errores

- ID inválido (`abc`, `0` o un entero negativo): `validateMateriaId` produce HTTP 400.
- Materia inexistente o que pertenece a otro usuario: `getMateriaById` produce HTTP 404.
- Materia válida sin eventos: HTTP 200 con `data: []`.
- Materia válida con eventos: HTTP 200 con los eventos dentro de `data`.

El usuario no se recibe como parámetro de consulta. Se obtiene de `request.user.id`; actualmente, el middleware temporal puede asignar el ID `1`.

## Flujo

```text
GET /api/v1/materias/:id/eventos
  -> materias.routes.js
  -> listEventosByMateria (controlador)
  -> validateMateriaId
  -> listEventosByMateria (servicio)
  -> getMateriaById (validación de propiedad)
  -> findEventosByMateriaAndUserId (repositorio)
  -> MySQL
  -> sendSuccess: { success: true, data: eventos }
```
