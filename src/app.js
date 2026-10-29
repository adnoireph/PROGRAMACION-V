import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import healthRoutes from "./routes/health.routes.js";
import materiasRouter from "./routes/materias.routes.js";
import recordatoriosRouter from "./routes/recordatorios.routes.js";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";
import { attachTemporaryUser } from "./middlewares/request-context.middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(attachTemporaryUser);

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/materias", materiasRouter);
app.use("/api/v1/recordatorios", recordatoriosRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;