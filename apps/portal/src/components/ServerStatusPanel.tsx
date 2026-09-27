'use client';

import { useEffect, useRef, useState } from 'react';
import { Pill } from '@lab/ui';

interface ServerStatus {
  port: number;
  name: string;
  status: 'unchecked' | 'reachable' | 'unreachable';
  responseTime?: number;
}

const INITIAL_SERVERS: ServerStatus[] = [
  { port: 3000, name: 'Portal (Catalogue)', status: 'unchecked' },
  { port: 3001, name: '01 - AI Knowledge Copilot', status: 'unchecked' },
  { port: 3002, name: '02 - Document Intelligence', status: 'unchecked' },
  { port: 3003, name: '03 - India Voice Assistant', status: 'unchecked' },
  { port: 3004, name: '04 - Engineering Agent', status: 'unchecked' },
  { port: 3005, name: '05 - Data Decision Assistant', status: 'unchecked' },
];

export function ServerStatusPanel() {
  const [isLocal, setIsLocal] = useState(false);
  const [servers, setServers] = useState(INITIAL_SERVERS);
  const [checking, setChecking] = useState(false);
  const active = useRef(true);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    active.current = true;
    setIsLocal(['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname));
    return () => {
      active.current = false;
      request.current?.abort();
    };
  }, []);

  async function checkStatus() {
    if (!isLocal || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setChecking(true);
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const updated = await Promise.all(
        INITIAL_SERVERS.map(async (server): Promise<ServerStatus> => {
          try {
            const start = performance.now();
            await fetch(`http://localhost:${server.port}`, {
              method: 'HEAD',
              mode: 'no-cors',
              cache: 'no-store',
              signal: controller.signal,
            });
            // An opaque response proves reachability only; it can still be an HTTP 404.
            return {
              ...server,
              status: 'reachable',
              responseTime: Math.round(performance.now() - start),
            };
          } catch {
            return { ...server, status: 'unreachable' };
          }
        }),
      );
      if (active.current) setServers(updated);
    } finally {
      clearTimeout(timeout);
      request.current = null;
      if (active.current) setChecking(false);
    }
  }

  if (!isLocal) return null;
  return (
    <section
      aria-labelledby="local-server-heading"
      className="my-12 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-6 md:p-8"
    >
      <h2 id="local-server-heading" className="text-2xl">
        Local workspace servers
      </h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Check on demand. Reachable means a port responds; it does not mean the project is
        implemented or healthy.
      </p>
      <button
        type="button"
        onClick={checkStatus}
        disabled={checking}
        className="my-5 rounded-lg border border-[var(--hairline)] px-4 py-2 disabled:opacity-50"
      >
        {checking ? 'Checking…' : 'Check local servers'}
      </button>
      <p role="status" className="sr-only">
        {checking ? 'Checking local servers' : 'Local checks idle'}
      </p>
      <ul className="grid gap-3">
        {servers.map((server) => (
          <li
            key={server.port}
            className="flex flex-wrap items-center justify-between gap-3 rounded border border-[var(--hairline)] p-4"
          >
            <a
              href={`http://localhost:${server.port}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              {server.name} · {server.port}
            </a>
            <span className="flex items-center gap-3">
              {server.responseTime !== undefined && (
                <span className="text-xs">{server.responseTime}ms</span>
              )}
              <Pill tone={server.status === 'reachable' ? 'verified' : 'caution'} dot>
                {server.status}
              </Pill>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
