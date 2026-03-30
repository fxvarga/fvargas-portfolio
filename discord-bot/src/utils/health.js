// Simple HTTP health endpoint for Docker healthcheck and Caddy status page
import { createServer } from 'node:http';

let discordClient = null;
const startTime = Date.now();

/**
 * Set the Discord client reference for health reporting
 * @param {import('discord.js').Client} client
 */
export function setDiscordClient(client) {
  discordClient = client;
}

/**
 * Start the health HTTP server
 * @param {number} [port=3100]
 */
export function startHealthServer(port = 3100) {
  const server = createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      const isConnected = discordClient?.ws?.status === 0; // 0 = READY
      const status = isConnected ? 'ok' : 'degraded';
      const statusCode = isConnected ? 200 : 503;

      const body = JSON.stringify({
        status,
        uptime: Math.round((Date.now() - startTime) / 1000),
        discord: isConnected ? 'connected' : 'disconnected',
        guilds: discordClient?.guilds?.cache?.size ?? 0,
        ping: discordClient?.ws?.ping ?? -1,
      });

      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(body);
    } else if (req.url === '/' && req.method === 'GET') {
      // Simple status page
      const isConnected = discordClient?.ws?.status === 0;
      const uptime = Math.round((Date.now() - startTime) / 1000);
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;

      const html = `<!DOCTYPE html>
<html>
<head><title>Portfolio Discord Bot</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; background: #1a1a2e; color: #e0e0e0; }
  h1 { color: #5865F2; }
  .status { padding: 12px 20px; border-radius: 8px; margin: 16px 0; font-size: 1.1em; }
  .ok { background: #1a3a1a; border: 1px solid #2d7d2d; }
  .bad { background: #3a1a1a; border: 1px solid #7d2d2d; }
  .info { margin: 8px 0; }
  .label { color: #888; }
</style>
</head>
<body>
  <h1>Portfolio Discord Bot</h1>
  <div class="status ${isConnected ? 'ok' : 'bad'}">
    ${isConnected ? 'Connected to Discord' : 'Disconnected from Discord'}
  </div>
  <div class="info"><span class="label">Uptime:</span> ${hours}h ${minutes}m ${seconds}s</div>
  <div class="info"><span class="label">Guilds:</span> ${discordClient?.guilds?.cache?.size ?? 0}</div>
  <div class="info"><span class="label">Ping:</span> ${discordClient?.ws?.ping ?? -1}ms</div>
</body>
</html>`;

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[Health] Server listening on port ${port}`);
  });

  return server;
}
