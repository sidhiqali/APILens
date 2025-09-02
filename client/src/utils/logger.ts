'use client';

type LogMethod = (...args: unknown[]) => void;

const isDev = process.env.NODE_ENV !== 'production';

const noop: LogMethod = () => {};

export const logger = {
  log: (isDev ? console.log : noop) as LogMethod,
  warn: (isDev ? console.warn : noop) as LogMethod,
  error: console.error as LogMethod, 
};

export default logger;

