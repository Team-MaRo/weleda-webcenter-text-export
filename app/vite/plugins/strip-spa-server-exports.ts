import type {Plugin} from 'vite';
import process from 'node:process';

// Match home.tsx with or without a Vite/RR query-string suffix (e.g.
// `?__react-router-build-client-route`, the virtual module RR creates for
// the client environment).
const HOME_ROUTE_RE = /[/\\]app[/\\]routes[/\\]home\.tsx(?:$|\?)/;
const ACTION_MARKER = 'export async function action';

// Strip the `export async function action(...) { ... }` block from
// app/routes/home.tsx in the SPA build (SSR=false, GitHub Pages). React
// Router 7's vite plugin rejects `action` exports in SPA-mode route modules,
// but we need it in SSR mode for the no-JS form POST. `vite-env-only`'s
// `serverOnly$()` only nulls the *value* — leaving `export const action =
// undefined`, which RR still flags. So we lift the whole export out at the
// source-text level.
export function stripSpaServerExports(): Plugin {
  const isSpaBuild = process.env.SSR === 'false';
  return {
    name: 'strip-spa-server-exports',
    enforce: 'pre',
    transform(code, id) {
      if (!isSpaBuild) {
        return null;
      }
      if (!HOME_ROUTE_RE.test(id)) {
        return null;
      }
      const start = code.indexOf(ACTION_MARKER);
      if (start === -1) {
        return null;
      }
      // Skip past the parameter list `(...)` — necessary because the params
      // contain destructuring like `({request}: ...)` whose `{}` we'd
      // otherwise count as the function body opener.
      let i = code.indexOf('(', start);
      if (i === -1) {
        return null;
      }
      let depth = 1;
      i++;
      while (i < code.length && depth > 0) {
        const ch = code[i];
        if (ch === '(') {
          depth++;
        } else if (ch === ')') {
          depth--;
        }
        i++;
      }
      // Now find the opening `{` of the function body and brace-match to its
      // close. Robust against nested braces in the action body.
      i = code.indexOf('{', i);
      if (i === -1) {
        return null;
      }
      depth = 1;
      i++;
      while (i < code.length && depth > 0) {
        const ch = code[i];
        if (ch === '{') {
          depth++;
        } else if (ch === '}') {
          depth--;
        }
        i++;
      }
      // Swallow the trailing newline so we don't leave a blank line.
      while (i < code.length && (code[i] === '\n' || code[i] === '\r')) {
        i++;
      }
      return {code: code.slice(0, start) + code.slice(i), map: null};
    },
  };
}
