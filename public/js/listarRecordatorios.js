const API = "/api/v1";

const $ = (id) => document.getElementById(id);

const statusEl = $("status");
const summaryEl = $("summary");
const tbody = $("tbody");
const outputEl = $("output");
const panel = $("panel");
const panelTitle = $("panel-title");
const panelHint = $("panel-hint");
const form = $("form");
const submitBtn = $("submit");
const filtro = $("filtro");

// Qué campos del formulario se usan en cada acción
const MODES = {
  consultar: {
    title: "Consultar un recordatorio",
    submit: "Consultar",
    fields: ["id"],
    required: ["id"],
    hint: ""
  },
  crear: {
    title: "Crear un recordatorio",
    submit: "Crear recordatorio",
    fields: ["tareaId", "mensaje", "fechaHora", "canal", "leido"],
    required: ["tareaId", "mensaje", "fechaHora"],
    hint: "Si dejas el canal o el estado sin indicar, se usan in_app y Sin leer."
  },
  reemplazar: {
    title: "Reemplazar un recordatorio",
    submit: "Reemplazar recordatorio",
    fields: ["id", "tareaId", "mensaje", "fechaHora", "canal", "leido"],
    required: ["id", "tareaId", "mensaje", "fechaHora"],
    hint: "Reemplazar cambia todos los datos. Si dejas el canal o el estado sin indicar, se usan in_app y Sin leer."
  },
  actualizar: {
    title: "Actualizar campos de un recordatorio",
    submit: "Actualizar campos",
    fields: ["id", "tareaId", "mensaje", "fechaHora", "canal", "leido"],
    required: ["id"],
    hint: "Completa solo lo que quieras cambiar. Lo demás se queda igual."
  },
  eliminar: {
    title: "Eliminar un recordatorio",
    submit: "Eliminar",
    fields: ["id"],
    required: ["id"],
    hint: "Esta acción no se puede deshacer."
  }
};

let currentMode = null;

/* ---------- Mensajes en pantalla ---------- */

function setStatus(message, type = "ok") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function setSummary(message) {
  summaryEl.textContent = message;
}

function showOutput(method, path, status, payload) {
  const body = payload === null ? "(sin contenido)" : JSON.stringify(payload, null, 2);
  outputEl.textContent = `${method} ${API}${path}\nHTTP ${status}\n\n${body}`;
}

/* ---------- Llamado al API ---------- */

async function call(method, path, body) {
  const options = { method };

  if (body) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API}${path}`, options);
  const payload = response.status === 204 ? null : await response.json().catch(() => null);

  console.log(method, `${API}${path}`, response.status, payload);
  showOutput(method, path, response.status, payload);

  if (!response.ok) {
    const message = payload?.error?.message ?? payload?.message ?? `El servicio respondió con el error ${response.status}.`;
    throw new Error(message);
  }

  return payload;
}

/* ---------- Tabla ---------- */

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("es-CO");
}

function renderRows(recordatorios) {
  tbody.replaceChildren();

  if (recordatorios.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.className = "empty";
    cell.textContent = "No hay recordatorios para mostrar. Usa Crear para agregar el primero.";
    row.append(cell);
    tbody.append(row);
    return;
  }

  for (const item of recordatorios) {
    const row = document.createElement("tr");

    const values = [
      item.id,
      item.mensaje,
      item.tareaTitulo,
      item.materiaNombre,
      formatDate(item.fechaHora),
      item.canal,
      item.leido ? "Leído" : "Sin leer"
    ];

    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value ?? "";
      row.append(cell);
    }

    tbody.append(row);
  }
}

/* ---------- Acciones ---------- */

async function listar() {
  const query = filtro.value ? `?leido=${filtro.value}` : "";
  const result = await call("GET", `/recordatorios${query}`);
  const meta = result.meta;

  renderRows(result.data);
  setStatus("Recordatorios consultados correctamente.");
  setSummary(`Mostrando ${result.data.length} de ${meta.total} recordatorios. Página ${meta.page} de ${Math.max(meta.pages, 1)}.`);
}

async function consultarUno(id) {
  const result = await call("GET", `/recordatorios/${id}`);

  renderRows([result.data]);
  setStatus("Recordatorio consultado correctamente.");
  setSummary(`Mostrando el recordatorio ${id}. Usa Listar para volver a ver todos.`);
}

async function crear(body) {
  const result = await call("POST", "/recordatorios", body);

  setStatus(`Recordatorio ${result.data.id} creado correctamente.`);
  await listar();
}

async function reemplazar(id, body) {
  await call("PUT", `/recordatorios/${id}`, body);

  setStatus(`Recordatorio ${id} reemplazado correctamente.`);
  await listar();
}

async function actualizarCampos(id, body) {
  if (Object.keys(body).length === 0) {
    throw new Error("Completa al menos un campo para actualizar.");
  }

  await call("PATCH", `/recordatorios/${id}`, body);

  setStatus(`Recordatorio ${id} actualizado correctamente.`);
  await listar();
}

async function eliminar(id) {
  if (!window.confirm(`¿Eliminar el recordatorio ${id}? Esta acción no se puede deshacer.`)) {
    return;
  }

  await call("DELETE", `/recordatorios/${id}`);

  setStatus(`Recordatorio ${id} eliminado correctamente.`);
  await listar();
}

async function estadoServicio() {
  const result = await call("GET", "/health");

  setStatus(`Servicio en estado "${result.data.status}". Base de datos: ${result.data.database}.`);
}

/* ---------- Formulario ---------- */

// El campo datetime-local entrega "2026-11-01T08:00"; MySQL lo recibe como "2026-11-01 08:00:00"
function toApiDate(value) {
  const text = value.replace("T", " ");
  return text.length === 16 ? `${text}:00` : text;
}

function readBody() {
  const get = (name) => form.elements[name].value.trim();
  const body = {};

  if (get("tareaId")) body.tareaId = Number(get("tareaId"));
  if (get("mensaje")) body.mensaje = get("mensaje");
  if (get("fechaHora")) body.fechaHora = toApiDate(get("fechaHora"));
  if (get("canal")) body.canal = get("canal");
  if (get("leido")) body.leido = get("leido") === "true";

  return body;
}

function openMode(mode) {
  const config = MODES[mode];

  currentMode = mode;
  form.reset();

  for (const label of form.querySelectorAll("[data-field]")) {
    const name = label.dataset.field;
    const visible = config.fields.includes(name);

    label.hidden = !visible;
    form.elements[name].required = visible && config.required.includes(name);
  }

  panelTitle.textContent = config.title;
  panelHint.textContent = config.hint;
  submitBtn.textContent = config.submit;
  panel.hidden = false;

  for (const button of document.querySelectorAll("[data-mode]")) {
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  }

  const firstVisible = form.querySelector("[data-field]:not([hidden]) input, [data-field]:not([hidden]) select");
  firstVisible?.focus();
}

function closePanel() {
  currentMode = null;
  panel.hidden = true;

  for (const button of document.querySelectorAll("[data-mode]")) {
    button.setAttribute("aria-pressed", "false");
  }
}

// Ejecuta una acción mostrando errores en pantalla en vez de dejarlos solo en la consola
async function run(action) {
  submitBtn.disabled = true;

  try {
    await action();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "No se pudo completar la acción.", "error");
  } finally {
    submitBtn.disabled = false;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  const id = form.elements.id.value.trim();
  const body = readBody();

  run(async () => {
    switch (currentMode) {
      case "consultar":
        return consultarUno(id);
      case "crear":
        return crear(body);
      case "reemplazar":
        return reemplazar(id, body);
      case "actualizar":
        return actualizarCampos(id, body);
      case "eliminar":
        return eliminar(id);
    }
  });
});

for (const button of document.querySelectorAll("[data-mode]")) {
  button.addEventListener("click", () => openMode(button.dataset.mode));
}

$("btn-listar").addEventListener("click", () => {
  closePanel();
  run(listar);
});

$("btn-actualizar").addEventListener("click", () => run(listar));
filtro.addEventListener("change", () => run(listar));
$("btn-estado").addEventListener("click", () => run(estadoServicio));

// Al abrir la página se carga el listado
run(listar);
