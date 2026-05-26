import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

// Agregar nuevos servicios aquí:
// '/api/notifications' → process.env.NOTIFICATION_API_URL || 'http://localhost:3003'
const SERVICE_ROUTES: { prefix: string; targetEnvVar: string; defaultUrl: string }[] = [
  { prefix: '/api/projects', targetEnvVar: 'PROJECT_API_URL', defaultUrl: 'http://localhost:3000' },
  { prefix: '/api/files',    targetEnvVar: 'PROJECT_API_URL', defaultUrl: 'http://localhost:3000' },
  { prefix: '/api/users',       targetEnvVar: 'USER_API_URL', defaultUrl: 'http://localhost:3002' },
  { prefix: '/api/workspaces',  targetEnvVar: 'USER_API_URL', defaultUrl: 'http://localhost:3002' },
];

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ProxyMiddleware.name);

  private resolveTarget(path: string): string | null {
    const route = SERVICE_ROUTES.find((r) => path.startsWith(r.prefix));
    if (!route) return null;
    return process.env[route.targetEnvVar] || route.defaultUrl;
  }

  use(req: Request, res: Response): void {
    const path = req.originalUrl;
    const targetBaseUrl = this.resolveTarget(path);

    if (!targetBaseUrl) {
      res.status(404).json({ message: `No service mapped for path: ${path}` });
      return;
    }

    const target = new URL(targetBaseUrl);
    const isHttps = target.protocol === 'https:';
    const transport = isHttps ? https : http;

    const options: http.RequestOptions = {
      hostname: target.hostname,
      port: target.port || (isHttps ? 443 : 80),
      path: path,
      method: req.method,
      headers: { ...req.headers, host: target.host },
    };

    this.logger.debug(`${req.method} ${path} → ${targetBaseUrl}${path}`);

    const proxyReq = transport.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      this.logger.error(`Proxy error: ${err.message}`);
      if (!res.headersSent) {
        res.status(502).json({ message: 'Bad Gateway', error: err.message });
      }
    });

    // NestJS body-parser already consumed the stream — write the parsed body manually
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
      proxyReq.end();
    } else {
      req.pipe(proxyReq);
    }
  }
}
