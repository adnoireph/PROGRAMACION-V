import { pool } from "../config/database.js";

function mapRecordatorio(row) {
  return {
    id: row.id,
    tareaId: row.tareaId,
    mensaje: row.mensaje,
    fechaHora: row.fechaHora,
    canal: row.canal,
    leido: Boolean(row.leido),
    createdAt: row.createdAt,
    tareaTitulo: row.tareaTitulo,
    tareaEstado: row.tareaEstado,
    materiaId: row.materiaId,
    materiaNombre: row.materiaNombre
  };
}

// Consulta con varias tablas: recordatorio -> tarea -> materia (tarea y materia solo se leen)
const SELECT_RECORDATORIO = `
  SELECT
    r.id_recordatorio AS id,
    r.id_tarea AS tareaId,
    r.mensaje,
    r.fecha_hora AS fechaHora,
    r.canal,
    r.leido,
    r.created_at AS createdAt,
    t.titulo AS tareaTitulo,
    t.estado AS tareaEstado,
    m.id_materia AS materiaId,
    m.nombre AS materiaNombre
  FROM recordatorio r
  INNER JOIN tarea t ON t.id_tarea = r.id_tarea
  INNER JOIN materia m ON m.id_materia = t.id_materia
`;

/**
 * Busca todos los recordatorios de un usuario (a través de tarea y materia).
 * @param {number} userId - ID del usuario.
 * @param {Object} filters - leido (opcional), page y limit.
 */
export async function findAllByUserId(userId, filters = {}) {
  const conditions = ["m.id_usuario = ?"];
  const params = [userId];

  if (typeof filters.leido === "boolean") {
    conditions.push("r.leido = ?");
    params.push(filters.leido ? 1 : 0);
  }

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM recordatorio r
     INNER JOIN tarea t ON t.id_tarea = r.id_tarea
     INNER JOIN materia m ON m.id_materia = t.id_materia
     WHERE ${conditions.join(" AND ")}`,
    params
  );

  const limit = filters.limit;
  const offset = (filters.page - 1) * limit;

  const [rows] = await pool.execute(
    `${SELECT_RECORDATORIO}
     WHERE ${conditions.join(" AND ")}
     ORDER BY r.fecha_hora ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    recordatorios: rows.map(mapRecordatorio),
    total: countRows[0].total
  };
}

export async function findByIdAndUserId(id, userId) {
  const [rows] = await pool.execute(
    `${SELECT_RECORDATORIO}
     WHERE r.id_recordatorio = ? AND m.id_usuario = ?`,
    [id, userId]
  );

  return rows[0] ? mapRecordatorio(rows[0]) : null;
}

// Solo lectura: valida que la tarea exista y pertenezca al usuario (tarea -> materia -> usuario)
export async function existsTareaForUser(tareaId, userId) {
  const [rows] = await pool.execute(
    `SELECT 1
     FROM tarea t
     INNER JOIN materia m ON m.id_materia = t.id_materia
     WHERE t.id_tarea = ? AND m.id_usuario = ?
     LIMIT 1`,
    [tareaId, userId]
  );

  return rows.length > 0;
}

export async function createRecordatorio(recordatorio) {
  const [result] = await pool.execute(
    `INSERT INTO recordatorio (id_tarea, mensaje, fecha_hora, canal, leido)
     VALUES (?, ?, ?, ?, ?)`,
    [
      recordatorio.tareaId,
      recordatorio.mensaje,
      recordatorio.fechaHora,
      recordatorio.canal,
      recordatorio.leido ? 1 : 0
    ]
  );

  return result.insertId;
}

export async function updateRecordatorio(id, userId, recordatorio) {
  await pool.execute(
    `UPDATE recordatorio r
     INNER JOIN tarea t ON t.id_tarea = r.id_tarea
     INNER JOIN materia m ON m.id_materia = t.id_materia
     SET r.id_tarea = ?, r.mensaje = ?, r.fecha_hora = ?, r.canal = ?, r.leido = ?
     WHERE r.id_recordatorio = ? AND m.id_usuario = ?`,
    [
      recordatorio.tareaId,
      recordatorio.mensaje,
      recordatorio.fechaHora,
      recordatorio.canal,
      recordatorio.leido ? 1 : 0,
      id,
      userId
    ]
  );

  return findByIdAndUserId(id, userId);
}

export async function patchRecordatorio(id, userId, partialRecordatorio) {
  const fields = [];
  const params = [];

  if (partialRecordatorio.tareaId !== undefined) {
    fields.push("r.id_tarea = ?");
    params.push(partialRecordatorio.tareaId);
  }

  if (partialRecordatorio.mensaje !== undefined) {
    fields.push("r.mensaje = ?");
    params.push(partialRecordatorio.mensaje);
  }

  if (partialRecordatorio.fechaHora !== undefined) {
    fields.push("r.fecha_hora = ?");
    params.push(partialRecordatorio.fechaHora);
  }

  if (partialRecordatorio.canal !== undefined) {
    fields.push("r.canal = ?");
    params.push(partialRecordatorio.canal);
  }

  if (partialRecordatorio.leido !== undefined) {
    fields.push("r.leido = ?");
    params.push(partialRecordatorio.leido ? 1 : 0);
  }

  if (fields.length === 0) {
    return findByIdAndUserId(id, userId);
  }

  params.push(id, userId);

  await pool.execute(
    `UPDATE recordatorio r
     INNER JOIN tarea t ON t.id_tarea = r.id_tarea
     INNER JOIN materia m ON m.id_materia = t.id_materia
     SET ${fields.join(", ")}
     WHERE r.id_recordatorio = ? AND m.id_usuario = ?`,
    params
  );

  return findByIdAndUserId(id, userId);
}

export async function deleteRecordatorio(id, userId) {
  const [result] = await pool.execute(
    `DELETE r
     FROM recordatorio r
     INNER JOIN tarea t ON t.id_tarea = r.id_tarea
     INNER JOIN materia m ON m.id_materia = t.id_materia
     WHERE r.id_recordatorio = ? AND m.id_usuario = ?`,
    [id, userId]
  );

  return result.affectedRows > 0;
}