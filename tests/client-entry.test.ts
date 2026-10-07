import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import test from 'node:test';
// esbuild is supplied by the locked Wrangler dependency; no additional test packages.
import { transformSync } from 'esbuild';
import { PROTOCOL_VERSION } from '../src/shared/protocol.ts';

const require = createRequire(import.meta.url);
const compiled = transformSync(readFileSync(new URL('../src/client/App.tsx', import.meta.url), 'utf8'), {
  loader: 'tsx', format: 'cjs', jsx: 'automatic',
}).code;

/** Run the actual component handlers with controlled hooks, transport and browser storage. */
function entryConsole() {
  const hooks = [];
  let cursor = 0;
  let effects = [];
  const requests = [];
  const sockets = [];
  const storage = new Map();
  let failure = null;
  let tree;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = typeof initial === 'function' ? initial() : initial;
      return [hooks[index], value => { hooks[index] = typeof value === 'function' ? value(hooks[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = { current: initial };
      return hooks[index];
    },
    useEffect(callback, dependencies) {
      const index = cursor++;
      const previous = hooks[index];
      if (!previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
        hooks[index] = { dependencies, cleanup: previous?.cleanup };
        effects.push(() => { hooks[index].cleanup?.(); hooks[index].cleanup = callback(); });
      }
    },
  };
  class Socket {
    static OPEN = 1;
    readyState = Socket.OPEN;
    onopen;
    onmessage;
    constructor() { sockets.push(this); }
    send(data) {
      const action = JSON.parse(data);
      assert.equal(action.kind, 'leave');
      this.onmessage({ data: JSON.stringify({ protocolVersion: PROTOCOL_VERSION, serverTimeMs: Date.now(), kind: 'action-accepted', actionId: action.actionId, revision: 2 }) });
    }
    close() { this.readyState = 3; }
  }
  const module = { exports: {} };
  new Script(compiled, { filename: 'App.cjs' }).runInNewContext({
    module, exports: module.exports,
    require: name => name === './Presentation.tsx' ? { Presentation: () => null } : name === './QuickPlay.tsx' ? { QuickPlay: () => null, guestHeaders: () => ({}) } : name === 'react' ? react : name === '../shared/protocol.ts' ? { PROTOCOL_VERSION } : require(name),
    crypto, URL, URLSearchParams, Date, Error, WebSocket: Socket,
    location: { href: 'http://localhost:5173/?room=ABCDEF', origin: 'http://localhost:5173', protocol: 'http:', search: '?room=ABCDEF' },
    history: { state: null, replaceState() {} },
    sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    setInterval: () => 1, clearInterval: () => {},
    fetch: async (path, options) => {
      const body = JSON.parse(options.body);
      requests.push({ path, body });
      const failing = failure; failure = null;
      if (failing === 'network') throw new Error('Connection lost before receiving entry response');
      if (failing === 'http') return Response.json({ code: 'temporarily-unavailable', message: 'Retry entry' }, { status: 503 });
      const id = crypto.randomUUID();
      return Response.json({
        credentials: { roomId: path.endsWith('/private') ? 'BCDEFG' : 'ABCDEF', sessionId: id, role: 'player', reconnectToken: 'test-only-token' },
        snapshot: { visibility: 'private', roomId: 'ABCDEF', phase: 'lobby', phaseDeadlineMs: null, hostPlayerId: id, players: [], revision: 1 },
        controller: null,
      });
    },
  });
  function render() {
    cursor = 0; effects = [];
    tree = module.exports.App();
    const pending = effects; effects = [];
    for (const effect of pending) effect();
  }
  function nodes(node) {
    if (Array.isArray(node)) return node.flatMap(child => nodes(child));
    if (!node || typeof node !== 'object') return [];
    return [node, ...nodes(node.props?.children)];
  }
  function text(node) {
    if (Array.isArray(node)) return node.map(text).join('');
    return node && typeof node === 'object' ? text(node.props?.children) : typeof node === 'string' ? node : '';
  }
  async function click(label) {
    const button = nodes(tree).find(node => node.type === 'button' && text(node) === label);
    assert.ok(button, `Missing button: ${label}`); assert.equal(button.props.disabled ?? false, false);
    await button.props.onClick(); render();
  }
  render();
  const name = nodes(tree).find(node => node.type === 'input' && node.props.autoComplete === 'nickname');
  name.props.onChange({ target: { value: 'Returning Scientist' } }); render();
  return {
    requests, click,
    failNext(mode) { failure = mode; },
    connect() { sockets.at(-1).onopen(); render(); },
    status() { return text(nodes(tree).find(node => node.props.role === 'status')); },
  };
}

for (const [entry, label] of [['Join by Code', 'rejoin the same code'], ['Create Private Laboratory', 'create another room']]) {
  test(`successful entry → leave → ${label} uses a fresh key with unchanged details`, async () => {
    const app = entryConsole();
    await app.click(entry); app.connect(); await app.click('Leave laboratory');
    await app.click(entry);
    assert.equal(app.requests.length, 2);
    const [first, second] = app.requests;
    assert.equal(second.path, first.path);
    assert.equal(second.body.alias, first.body.alias);
    assert.notEqual(second.body.operationId, first.body.operationId);
  });
  for (const failure of ['network', 'http']) {
    test(`${entry}: ${failure} failure retains its retry key; success retires it before the next entry`, async () => {
      const app = entryConsole(); app.failNext(failure);
      await app.click(entry);
      assert.ok(app.status().includes(failure === 'http' ? 'temporarily-unavailable' : 'Connection lost'));
      await app.click(entry);
      assert.equal(app.requests[1].body.operationId, app.requests[0].body.operationId);
      app.connect(); await app.click('Leave laboratory'); await app.click(entry);
      assert.notEqual(app.requests[2].body.operationId, app.requests[1].body.operationId);
    });
  }
}
