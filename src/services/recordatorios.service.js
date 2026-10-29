import * as recordatoriosRepository from "../repositories/recordatorios.repositorio.js";
import { HttpError } from "../utils/http-error.js";

export async function listRecordatorios(userId, filters) {
  const { recordatorios, total } = await recordatoriosRepository.findAllByUserId(userId, filters);

  return {
    data: recordatorios,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit)
    }
  };
}

export async function getRecordatorioById(id, userId) {
  const recordatorio = await recordatoriosRepository.findByIdAndUserId(id, userId);

  if (!recordatorio) {
    throw new HttpError(404, "RECORDATORIO_NOT_FOUND", "No se encontró el recordatorio con el ID proporcionado para el usuario especificado.");
  }

  return recordatorio;
}

/**
 * Valida que la tarea indicada exista y pertenezca al usuario.
 * Solo consulta: tarea y materia no se modifican.
 */
async function ensureTareaBelongsToUser(tareaId, userId) {
  const exists = await recordatoriosRepository.existsTareaForUser(tareaId, userId);

  if (!exists) {
    throw new HttpError(404, "TAREA_NOT_FOUND", "No se encontró la tarea indicada para el usuario.");
  }
}

export async function createRecordatorio(userId, recordatorio) {
  await ensureTareaBelongsToUser(recordatorio.tareaId, userId);
  const insertId = await recordatoriosRepository.createRecordatorio(recordatorio);
  return getRecordatorioById(insertId, userId);
}

export async function replaceRecordatorio(id, userId, recordatorio) {
  await getRecordatorioById(id, userId);
  await ensureTareaBelongsToUser(recordatorio.tareaId, userId);
  return recordatoriosRepository.updateRecordatorio(id, userId, recordatorio);
}

export async function updateRecordatorio(id, userId, partialRecordatorio) {
  await getRecordatorioById(id, userId);

  if (partialRecordatorio.tareaId !== undefined) {
    await ensureTareaBelongsToUser(partialRecordatorio.tareaId, userId);
  }

  return recordatoriosRepository.patchRecordatorio(id, userId, partialRecordatorio);
}

export async function removeRecordatorio(id, userId) {
  await getRecordatorioById(id, userId);
  await recordatoriosRepository.deleteRecordatorio(id, userId);
}