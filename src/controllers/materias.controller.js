import * as materiasService from "../services/materias.service.js";
import { sendNoContent, sendSuccess } from "../utils/api-response.js";

import {
    validateCreateMateria,
    validateMateriaListQuery,
    validateMateriaId,
    validatePatchMateria
} from "../validators/materias.validator.js";

/**
 * Controlador para listar las materias de un usuario con filtros y paginación.
 * @param {Object} request - Objeto de petición HTTP de Express.
 * @param {Object} response - Objeto de respuesta HTTP de Express.
 * @param {Function} next - Función middleware para manejo de errores.
 */

export async function listMaterias(request, response, next) {
  try {
    const filters = validateMateriaListQuery(request.query);
    const result = await materiasService.listMaterias(request.user.id, filters);
    return sendSuccess(response, result.data, 200, result.meta);
  } catch (error) {
    return next(error);
  }
}

/**
 * Controlador para obtener una materia específica por su ID.
 * @param {Object} request - Objeto de petición HTTP de Express.
 * @param {Object} response - Objeto de respuesta HTTP de Express.
 * @param {Function} next - Función middleware para manejo de errores.
 */

export async function getMateriaById(request, response, next) {
  try {

    const id  = validateMateriaId(request.params.id);
    const materia = await materiasService.getMateriaById(id, request.user.id);
    return sendSuccess(response, materia)

  } catch (error) {
    return next(error);
  }
}

/**
 * Controlador para listar las materias de un usuario con filtros y paginación.
 * @param {Object} request - Objeto de petición HTTP de Express.
 * @param {Object} response - Objeto de respuesta HTTP de Express.
 * @param {Function} next - Función middleware para manejo de errores.
 */

export async function createMateria(request, response, next) {
  try {
    const payload = validateCreateMateria(request.body);
    const materia = await materiasService.createMateria(request.user.id, payload);
    return sendSuccess(response, materia, 201);
  } catch (error) {
    return next(error);
  }
}

export async function replaceMateria(request, response, next) {
  try {
    const id = validateMateriaId(request.params.id);
    const payload = validateCreateMateria(request.body);
    const materia = await materiasService.replaceMateria(id, request.user.id, payload);
    return sendSuccess(response, materia);
  } catch (error) {
    return next(error);
  }
}

export async function updateMateria(request, response, next) {
  try {
    const id = validateMateriaId(request.params.id);
    const payload = validatePatchMateria(request.body);
    const materia = await materiasService.updateMateria(id, request.user.id, payload);
    return sendSuccess(response, materia);
  } catch (error) {
    return next(error);
  }
}

export async function deleteMateria(request, response, next) {
  try {
    const id = validateMateriaId(request.params.id);
    await materiasService.removeMateria(id, request.user.id);
    return sendNoContent(response);
  } catch (error) {
    return next(error);
  }
}

/**
 * Controlador para obtener las tareas de una materia específica por su ID.
 * @param {Object} request - Objeto de petición HTTP de Express.
 * @param {Object} response - Objeto de respuesta HTTP de Express.
 * @param {Function} next - Función middleware para manejo de errores.
 */
export async function getTareasByMateria(request, response, next) {
    try {
        const materiaId = validateMateriaId(request.params.id); // Validamos el ID de la materia
        const userId = request.user.id; // Obtenemos el ID del usuario autenticado

        const tareas = await materiasService.getTareasByMateria(materiaId, userId);
        return sendSuccess(response, tareas);
    } catch (error) {
        return next(error);
    }
}
/**
 * Controlador para obtener los eventos de una materia específica por su ID.
 * @param {Object} request - Objeto de petición HTTP de Express.
 * @param {Object} response - Objeto de respuesta HTTP de Express.
 * @param {Function} next - Función middleware para manejo de errores.
 */
export async function listEventosByMateria(request, response, next) {
  try {
    const materiaId = validateMateriaId(request.params.id); // Validamos el ID de la materia
    const userId = request.user.id; // Obtenemos el ID del usuario autenticado

    const eventos = await materiasService.listEventosByMateria(materiaId, userId);
    return sendSuccess(response, eventos);
  } catch (error) {
    return next(error);
  }
}
