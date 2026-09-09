/**
 * Process-scoped startup work.
 *
 * Next calls `register` once per server instance, before it serves a request.
 * That makes it the only place in this app where a background schedule can
 * live: a route module has no such guarantee — it can be instantiated more than
 * once and gets no shutdown hook — so anything periodic started from one is
 * really started per instantiation.
 *
 * `register` must return before the server is ready, so nothing here may block
 * on I/O. Starting a timer does not.
 *
 * Next also evaluates this file for the Edge runtime. Node APIs such as
 * `process.once` must not appear here — even behind a NEXT_RUNTIME check —
 * or the Edge compiler fails and App Router API routes start returning 404
 * HTML. Node startup lives in `instrumentation.node.ts`.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { registerNodeInstrumentation } = await import('./instrumentation.node');
  await registerNodeInstrumentation();
}
