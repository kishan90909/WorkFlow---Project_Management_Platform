import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function createAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn, issuer: 'workflow-api', audience: 'workflow-client' },
  );
}