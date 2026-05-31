import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { ZodError } from "zod";
import { config } from "./config.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import geoRoutes from "./routes/geo.js";
import healthRoutes from "./routes/health.js";
import plantingsRoutes from "./routes/plantings.js";
import readRoutes from "./routes/read.js";
import { createRateLimit, securityHeaders } from "./security.js";

const app = express();
const clientDistDir = path.join(process.cwd(), "dist");
const clientIndexPath = path.join(clientDistDir, "index.html");

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(securityHeaders);
app.use((request, response, next) => {
  cors({
    origin(origin, callback) {
      const requestOrigin = `${request.protocol}://${request.get("host")}`;

      if (
        !origin ||
        origin === requestOrigin ||
        config.corsOrigins.includes(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin is not allowed"));
    },
    credentials: false,
  })(request, response, next);
});
app.use(
  createRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 900,
    message: "Too many requests. Please slow down.",
  }),
);
app.use(express.json({ limit: "80mb" }));
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "server/uploads"), {
    dotfiles: "deny",
    fallthrough: false,
    index: false,
    maxAge: config.nodeEnv === "production" ? "1d" : 0,
  }),
);

app.use(healthRoutes);
app.use(
  ["/auth/login", "/auth/register"],
  createRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 25,
    message: "Too many auth attempts. Please try again later.",
  }),
);
app.use(authRoutes);
app.use(geoRoutes);
app.use(adminRoutes);
app.use(plantingsRoutes);
app.use(readRoutes);

if (existsSync(clientIndexPath)) {
  app.use(express.static(clientDistDir, { index: false, maxAge: "1h" }));
  app.use((request, response, next) => {
    if (request.method !== "GET" || !request.accepts("html")) {
      next();
      return;
    }

    response.sendFile(path.join(clientDistDir, "index.html"));
  });
}

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof ZodError) {
      response
        .status(400)
        .json({ message: error.issues[0]?.message ?? "Invalid request" });
      return;
    }

    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    const badRequestMessages = [
      "Invalid media data",
      "Unsupported media type",
      "Photo type is not supported",
      "Video type is not supported",
      "Photo file is too large",
      "Video file is too large",
      "CORS origin is not allowed",
    ];

    if (badRequestMessages.includes(message)) {
      response
        .status(message === "CORS origin is not allowed" ? 403 : 400)
        .json({ message });
      return;
    }

    if (
      message === "MONGODB_URI is required" ||
      message.includes("bad auth") ||
      message.includes("Authentication failed") ||
      message.includes("authentication failed") ||
      message.includes("AtlasError") ||
      message.includes("SSL routines") ||
      message.includes("MongoServerSelectionError") ||
      message.includes("MongoNetworkError")
    ) {
      response.status(503).json({
        message:
          message === "MONGODB_URI is required"
            ? message
            : message.includes("bad auth") ||
                message.includes("Authentication failed") ||
                message.includes("authentication failed")
              ? "Database authentication failed. Check MONGODB_URI username and password in Render."
            : "Database connection failed. Check MongoDB Atlas network access and try again.",
      });
      return;
    }

    response.status(500).json({
      message:
        config.nodeEnv === "production" ? "Unexpected server error" : message,
    });
  },
);

app.listen(config.port, () => {
  console.log(`API server running on http://localhost:${config.port}`);
});
