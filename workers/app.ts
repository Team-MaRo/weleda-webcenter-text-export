import {createContext, createRequestHandler, RouterContextProvider} from 'react-router';

// Cloudflare bindings exposed to loaders/actions/middleware. With
// `v8_middleware` enabled (react-router.config.ts) the load context is a
// `RouterContextProvider`, not a plain object, so the worker stashes the
// Cloudflare `env`/`ctx` on a typed context key that route code reads via
// `context.get(CloudflareContext)`.
export const CloudflareContext = createContext<{env: Env; ctx: ExecutionContext}>();

const requestHandler = createRequestHandler(
  async () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const context = new RouterContextProvider();
    context.set(CloudflareContext, {env, ctx});
    return requestHandler(request, context);
  },
} satisfies ExportedHandler<Env>;
