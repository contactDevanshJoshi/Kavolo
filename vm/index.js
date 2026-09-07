import http from "http";
import pino from "pino";
import dotenv from "dotenv";

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const PORT = process.env.PORT || 8080;

// Healthcheck HTTP server for uptime monitoring (SAD §12)
const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy", service: "kavolo-vm-service", timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  logger.info(`[Kavolo VM Service] Initialized and listening on port ${PORT}`);
});

// Phase 3.3: Baileys WhatsApp WebSocket session handler
// Phase 6.4: Throttled send_queue Firestore collection drainer
