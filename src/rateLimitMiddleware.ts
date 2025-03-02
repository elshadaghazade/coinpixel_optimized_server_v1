import { Request, Response, NextFunction } from 'express';
import { Socket } from 'socket.io';

// Store request data by IP and token
const requestCountByIp = new Map<string, { count: number; lastRequestTime: number; timeWindow: number }>();

// Environment-based configurations
const maxRequests = 3;
const timeWindow = 2000;

function getHashCode(req: Request) {
  const ip = req.ip || req.headers['x-real-ip'] || req.headers['x-forwarded-for'] as string;

  if (!ip) throw new Error('IP_IS_WRONG');

  const url = req.url;
  const token = req.headers.authorization || '';

  return Buffer.from(ip + url + token).toString('base64');
}

// HTTP middleware to apply rate-limiting logic
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  let hashCode = '';
  try {
    hashCode = getHashCode(req);
  } catch {
    return res.status(400).json({ error: 'BAD_REQUEST' });
  }

  const maxRequestsRecalc = maxRequests;
  const timeWindowRecalc = timeWindow;

  if (!requestCountByIp.has(hashCode)) {
    requestCountByIp.set(hashCode, { count: maxRequestsRecalc, lastRequestTime: Date.now(), timeWindow: timeWindowRecalc });
  } else {
    const requestData = requestCountByIp.get(hashCode)!;
    if (Date.now() - requestData.lastRequestTime >= requestData.timeWindow) {
      requestData.count = maxRequestsRecalc;
      requestData.lastRequestTime = Date.now();
      requestData.timeWindow = timeWindowRecalc;
    } else if (requestData.count <= 0) {
      requestData.lastRequestTime = Date.now();
      requestData.timeWindow = Math.min(requestData.timeWindow + 100, 30000); // Prevent runaway increasing of timeout
      return res.status(429).json({ error: 'TOO_MANY_REQUESTS' });
    } else {
      requestData.count--;
    }
  }

  next();
}

// Clean up old request records
const clearExpiredRequestRecord = () => {
  if (!requestCountByIp.size) return;
  for (let [key, value] of requestCountByIp.entries()) {
    if (Date.now() - value.lastRequestTime >= value.timeWindow * 2) {
      requestCountByIp.delete(key);
    }
  }
};

setInterval(clearExpiredRequestRecord, Number(process.env.CLEAR_REQUEST_RECORDS_TIME_DELAY || 60000));

// Socket.io rate-limiting middleware
export function socketRateLimitMiddleware(socket: Socket, next: (err?: any) => void) {
  const ip = socket.handshake.address || socket.handshake.headers['x-forwarded-for'] as string;
  const url = 'socket.io'; // You can customize this if needed
  // const token = socket.handshake.auth?.token || '';

  const hashCode = Buffer.from(ip + url).toString('base64');

  const maxRequestsRecalc = maxRequests;
  const timeWindowRecalc = timeWindow;

  if (!requestCountByIp.has(hashCode)) {
    requestCountByIp.set(hashCode, { count: maxRequestsRecalc, lastRequestTime: Date.now(), timeWindow: timeWindowRecalc });
  } else {
    const requestData = requestCountByIp.get(hashCode)!;
    if (Date.now() - requestData.lastRequestTime >= requestData.timeWindow) {
      requestData.count = maxRequestsRecalc;
      requestData.lastRequestTime = Date.now();
      requestData.timeWindow = timeWindowRecalc;
    } else if (requestData.count <= 0) {
      requestData.lastRequestTime = Date.now();
      requestData.timeWindow = Math.min(requestData.timeWindow + 100, 30000);
      return next(new Error('TOO_MANY_REQUESTS'));
    } else {
      requestData.count--;
    }
  }

  next();
}