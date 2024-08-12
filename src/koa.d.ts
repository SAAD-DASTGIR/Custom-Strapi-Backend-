// src/koa.d.ts
import * as Koa from 'koa';

declare module 'koa' {
  interface Request {
    body?: any;
  }
}
