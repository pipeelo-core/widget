import { render } from 'preact';
import { WIDGET_USER_FIELDS, type WidgetUser } from '../shared/protocol';
import { uuidV4 } from '../shared/uuid';
import { App, type PanelParams } from './App';
import { isEmbedded } from './bridge';
import { readStorage, writeStorage } from './lib/storage';
import { STR } from './lib/strings';
import './styles.css';

function readHashParams(): URLSearchParams {
  const params = new URLSearchParams(location.search);
  new URLSearchParams(location.hash.slice(1)).forEach((value, key) => params.set(key, value));
  return params;
}

function readUser(params: URLSearchParams): WidgetUser | null {
  if (isEmbedded()) return null;
  let user: WidgetUser | null = null;
  for (const key of WIDGET_USER_FIELDS) {
    const value = params.get(key);
    if (value) (user = user || {})[key] = value;
  }
  return user;
}

function dashed(hex: string): string {
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function pageToken(id: string): string {
  const key = `pipeelo:token:${id}`;
  const saved = readStorage(key);
  if (saved) return saved;
  const token = uuidV4();
  writeStorage(key, token);
  return token;
}

function parseParams(hash: URLSearchParams): PanelParams | null {
  const code = hash.get('c');
  if (code && /^[0-9a-f]{64}$/i.test(code)) {
    const hex = code.toLowerCase();
    return { id: dashed(hex.slice(0, 32)), eid: dashed(hex.slice(32)), lastread: hash.get('lastread'), mode: hash.get('mode') ?? 'fullscreen', user: readUser(hash) };
  }
  const id = hash.get('id');
  const eid = hash.get('eid') ?? (id && !isEmbedded() ? pageToken(id) : null);
  if (!id || !eid) return null;
  return { id, eid, lastread: hash.get('lastread'), mode: hash.get('mode'), user: readUser(hash) };
}

const params = parseParams(readHashParams());

if (
  params?.mode === 'fullscreen' ||
  (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches)
) {
  document.documentElement.setAttribute('data-density', 'mobile');
}

if (!isEmbedded()) document.documentElement.setAttribute('data-standalone', '');

const root = document.getElementById('app');
if (root) {
  render(
    params ? <App params={params} /> : <div class="fatal">{STR.startError}</div>,
    root
  );
  document.getElementById('boot')?.remove();
}
