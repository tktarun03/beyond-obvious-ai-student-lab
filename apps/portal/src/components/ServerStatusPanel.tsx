'use client';

import { useEffect, useState } from 'react';
import { Pill } from '@lab/ui';

interface ServerStatus {
  port: number;
  name: string;
  url: string;
  status: 'running' | 'down';
  responseTime?: number;
}

export function ServerStatusPanel() {
  const initialServers: ServerStatus[] = [
    { port: 3000, name: 'Portal (Catalogue)', url: 'http://localhost:3000', status: 'down' },
    { port: 3001, name: '01 - AI Knowledge Copilot', url: 'http://localhost:3001', status: 'down' },
    { port: 3002, name: '02 - Document Intelligence', url: 'http://localhost:3002', status: 'down' },
    { port: 3003, name: '03 - India Voice Assistant', url: 'http://localhost:3003', status: 'down' },
    { port: 3004, name: '04 - Engineering Agent', url: 'http://localhost:3004', status: 'down' },
    { port: 3005, name: '05 - Data Decision Assistant', url: 'http://localhost:3005', status: 'down' },
  ];

  const [servers, setServers] = useState<ServerStatus[]>(initialServers);

  useEffect(() => {
    const checkStatus = async () => {
      const updatedServers = await Promise.all(
        initialServers.map(async (server) => {
          try {
            const start = Date.now();
            await fetch(server.url, { method: 'HEAD', mode: 'no-cors' });
            const responseTime = Date.now() - start;
            return { ...server, status: 'running' as const, responseTime };
          } catch {
            return { ...server, status: 'down' as const };
          }
        }),
      );
      setServers(updatedServers);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="my-12 rounded-lg border border-[var(--line)] bg-[var(--bg-alt)] p-8">
      <h2 className="mb-6 text-2xl font-semibold">Server Status</h2>
      <div className="grid gap-3">
        {servers.map((server) => (
          <div
            key={server.port}
            className="flex items-center justify-between rounded border border-[var(--line)] p-4 hover:bg-[var(--bg-hover)]"
          >
            <div className="flex items-center gap-4">
              <a
                href={server.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                {server.name}
              </a>
              <span className="font-mono text-sm text-[var(--ink-muted)]">:{server.port}</span>
            </div>
            <div className="flex items-center gap-3">
              {server.responseTime && (
                <span className="text-xs text-[var(--ink-muted)]">{server.responseTime}ms</span>
              )}
              <Pill tone={server.status === 'running' ? 'verified' : 'caution'} dot>
                {server.status === 'running' ? 'Running' : 'Down'}
              </Pill>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
