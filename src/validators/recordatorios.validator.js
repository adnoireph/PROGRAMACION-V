import { HttpError } from "../utils/http-error.js";

// Valores del enum recordatorio_canal_enum. Complétalo con los que veas en phpMyAdmin
// (tabla recordatorio -> Estructura -> columna canal).
const CANALES = ["in_app", "email", "push"];

function parseBoolean(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' debe ser true o false.`);
}

function parseRequiredPositiveInteger(value, fieldName) {
  const parsed = Number(value);

  if (value === undefined || value === null || value === "" || !Number.isInteger(parsed) || parsed < 1) {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' debe ser un entero positivo.`);
  }

  return parsed;
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' es obligatorio.`);
  }

  return value.trim();
}

function normalizeMensaje(value) {
  const mensaje = normalizeString(value, "mensaje");

  if (mensaje.length > 255) {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'mensaje' no puede superar 255 caracteres.");
  }

  return mensaje;
}

function normalizeFechaHora(value) {
  const fechaHora = normalizeString(value, "fechaHora");

  if (Number.isNaN(Date.parse(fechaHora))) {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'fechaHora' debe ser una fecha y hora válida.");
  }

  return fechaHora;
}

function normalizeCanal(value) {
  const canal = normalizeString(value, "canal");

  if (!CANALES.includes(canal)) {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo 'canal' debe ser uno de: ${CANALES.join(", ")}.`);
  }

  return canal;
}

export function validateRecordatorioListQuery(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);

  if (!Number.isInteger(page) || page < 1) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'page' debe ser un entero mayor o igual a 1.");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'limit' debe ser un entero entre 1 y 100.");
  }

  return {
    leido: parseBoolean(query.leido, "leido"),
    page,
    limit
  };
}

export function validateRecordatorioId(id) {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new HttpError(400, "INVALID_ID", "El identificador de recordatorio no es válido.");
  }

  return parsedId;
}

export function validateCreateRecordatorio(body) {
  const tareaId = parseRequiredPositiveInteger(body.tareaId, "tareaId");
  const mensaje = normalizeMensaje(body.mensaje);
  const fechaHora = normalizeFechaHora(body.fechaHora);
  const canal = body.canal === undefined ? CANALES[0] : normalizeCanal(body.canal);
  const leido = body.leido === undefined ? false : parseBoolean(body.leido, "leido");

  return {
    tareaId,
    mensaje,
    fechaHora,
    canal,
    leido
  };
}

export function validatePatchRecordatorio(body) {
  const payload = {};

  if (body.tareaId !== undefined) {
    payload.tareaId = parseRequiredPositiveInteger(body.tareaId, "tareaId");
  }

  if (body.mensaje !== undefined) {
    payload.mensaje = normalizeMensaje(body.mensaje);
  }

  if (body.fechaHora !== undefined) {
    payload.fechaHora = normalizeFechaHora(body.fechaHora);
  }

  if (body.canal !== undefined) {
    payload.canal = normalizeCanal(body.canal);
  }

  if (body.leido !== undefined) {
    payload.leido = parseBoolean(body.leido, "leido");
  }

  if (Object.keys(payload).length === 0) {
    throw new HttpError(422, "VALIDATION_ERROR", "No se enviaron campos válidos para actualizar.");
  }

  return payload;
}