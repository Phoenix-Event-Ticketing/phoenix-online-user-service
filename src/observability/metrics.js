import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const userHttpRequests = new client.Counter({
  name: 'user_http_requests_total',
  help: 'HTTP requests by method, route and status code.',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export function metricsMiddleware(req, res, next) {
  res.on('finish', () => {
    userHttpRequests.inc({
      method: req.method,
      route: req.route?.path || req.path || 'unknown',
      status_code: String(res.statusCode),
    });
  });
  next();
}

export async function metricsHandler(req, res) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}
