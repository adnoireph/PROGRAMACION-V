import * as materiasRepository from "../repositories/materias.repositorio.js";
import { HttpError } from "../utils/http-error.js";

export async function listMaterias(userId, filters) {
  const { materias, total } = await materiasRepository.findAllByUserId(userId, filters);

  return {
    data: materias,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit)
    }
  };
}

export async function getMateriaById(id, userId) {

  const materia = await materiasRepository.findByIdAndUserId(id, userId);

  if (!materia) {
    throw new HttpError(404, "Materia_not_found", "No se encontró la materia con el ID proporcionado para el usuario especificado.");
  }

  return materia
}

export async function createMateria(userId, materia) {
  await ensureUniqueFields(userId, materia);
  return materiasRepository.createMateria(userId, materia);
}
/** 
* Valida que el código y el nombre de una materia sean únicos para un usuario específico.
* 
* @async
* @function ensureUniqueFields
* @param {string|number} userId - Identificador único del usuario dueño de la materia.
* @param {Object} materia - Objeto que contiene los datos de la materia a validar.
* @param {string} [materia.codigo] - Código identificador de la materia (opcional).
* @param {string} [materia.nombre] - Nombre de la materia (opcional).
* @param {string|number} [excludeId] - ID de una materia existente a excluir de la validación (útil en actualizaciones).
* 
* @returns {Promise} No retorna ningún valor si las validaciones son exitosas.
* 
* @throws {HttpError} Código 409 (DUPLICATE_CODE) si el código ya está registrado para el usuario.
* @throws {HttpError} Código 409 (DUPLICATE_NAME) si el nombre ya está registrado para el usuario.
*/



async function ensureUniqueFields(userId, materia, excludeId) {
  if (materia.codigo) {
    const duplicatedCode = await materiasRepository.existsByCode(userId, materia.codigo, excludeId);

    if (duplicatedCode) {
      throw new HttpError(409, "DUPLICATE_CODE", "Ya existe una materia con ese código.");
    }
  }

  if (materia.nombre) {
    const duplicatedName = await materiasRepository.existsByName(userId, materia.nombre, excludeId);

    if (duplicatedName) {
      throw new HttpError(409, "DUPLICATE_NAME", "Ya existe una materia con ese nombre.");
    }
  }
}

export async function replaceMateria(id, userId, materia) {
  await getMateriaById(id, userId);
  await ensureUniqueFields(userId, materia, id);
  return materiasRepository.updateMateria(id, userId, materia);
}

export async function updateMateria(id, userId, partialMateria) {
  await getMateriaById(id, userId);
  await ensureUniqueFields(userId, partialMateria, id);
  return materiasRepository.patchMateria(id, userId, partialMateria);
}

export async function removeMateria(id, userId) {
  await getMateriaById(id, userId);
  await materiasRepository.deleteMateria(id, userId);
}
export async function getTareasByMateria(materiaId, userId) {
    // Primero validamos que la materia exista y le pertenezca al usuario
    await getMateriaById(materiaId, userId);
    
    // Luego llamamos al repositorio para buscar las tareas
    return await materiasRepository.findTareasByMateriaId(materiaId, userId);
}