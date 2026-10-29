import pino from 'pino'
import { ENV } from '../../config/env.js'

export const logger = pino({
    level: ENV.LOG_LEVEL || 'info',
    ...(ENV.NODE_ENV === 'development'
        ? {
              transport: {
                  target: 'pino-pretty',
                  options: {
                      colorize: true,
                      translateTime: 'SYS:standard',
                      ignore: 'pid,hostname',
                  },
              },
          }
        : {}),
})
