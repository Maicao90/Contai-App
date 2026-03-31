import { spawn, type ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";
import readline from "node:readline";

type ActiveTunnel = {
  url: string;
  close?: () => void;
};

type SshTunnel = ActiveTunnel & {
  process: ChildProcessByStdio<null, Readable, Readable>;
};

let tunnelPromise: Promise<ActiveTunnel> | null = null;
let activeTunnel: ActiveTunnel | null = null;

function normalizeBaseUrl(value: string): string {
  const cleanedValue = value.trim().replace(/[)\]}>,;]+$/g, "");
  const matchedUrl = cleanedValue.match(/https?:\/\/[^\s"']+/i)?.[0] ?? cleanedValue;
  const sanitizedUrl = matchedUrl.replace(/[)\]}>,;]+$/g, "").replace(/\/+$/, "");

  try {
    const parsed = new URL(sanitizedUrl);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    const matchedBaseUrl = sanitizedUrl.match(/https?:\/\/[a-z0-9.-]+(?::\d+)?/i)?.[0];
    return (matchedBaseUrl ?? sanitizedUrl).replace(/\/+$/, "");
  }
}

function sanitizeSubdomainPart(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getPreferredTunnelSubdomain(): string | null {
  const explicit = process.env.DEMO_TUNNEL_SUBDOMAIN?.trim();
  if (explicit) {
    return sanitizeSubdomainPart(explicit).slice(0, 50) || null;
  }

  const user = sanitizeSubdomainPart(process.env.USERNAME ?? "");
  const computer = sanitizeSubdomainPart(process.env.COMPUTERNAME ?? "");
  const base = [user || null, computer || null, "prospectalp"]
    .filter(Boolean)
    .join("-");

  const stable = sanitizeSubdomainPart(base).slice(0, 50);
  return stable || null;
}

function extractTunnelUrl(value: string): string | null {
  try {
    const parsed = JSON.parse(value) as {
      address?: string;
      listen_host?: string;
      message?: string;
      event?: string;
      type?: string;
    };

    if (parsed.address) {
      return normalizeBaseUrl(
        parsed.address.startsWith("http") ? parsed.address : `https://${parsed.address}`,
      );
    }

    if (parsed.listen_host) {
      return normalizeBaseUrl(
        parsed.listen_host.startsWith("http")
          ? parsed.listen_host
          : `https://${parsed.listen_host}`,
      );
    }

    if (parsed.message) {
      const messageMatch = parsed.message.match(/https:\/\/[^\s"]+/i);
      if (messageMatch) {
        return normalizeBaseUrl(messageMatch[0]);
      }
    }

    if (parsed.event === "tcpip-forward" && parsed.type === "opened" && parsed.address) {
      return normalizeBaseUrl(`https://${parsed.address}`);
    }
  } catch {
    const directMatch = value.match(/https:\/\/[^\s"]+/i);
    if (!directMatch) {
      return null;
    }

    if (!/tunneled|forward|opened|demo/i.test(value)) {
      return null;
    }

    return normalizeBaseUrl(directMatch[0]);
  }

  return null;
}

async function verifyTunnelBaseUrl(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${normalizeBaseUrl(baseUrl)}/api/healthz`, {
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      return false;
    }

    const body = (await response.json()) as { status?: string };
    return body.status === "ok";
  } catch {
    return false;
  }
}

async function openLocalhostRunTunnel(remoteTarget: string): Promise<ActiveTunnel> {
  const child = spawn(
    "ssh",
    [
      "-T",
      "-o",
      "StrictHostKeyChecking=no",
      "-o",
      "ServerAliveInterval=30",
      "-R",
      remoteTarget,
      "nokey@localhost.run",
      "--",
      "--output",
      "json",
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );

  const tunnel = await new Promise<SshTunnel>((resolve, reject) => {
    let settled = false;
    let combinedOutput = "";

    const cleanup = () => {
      stdoutReader.close();
      stderrReader.close();
      clearTimeout(timeout);
      child.stdout.removeAllListeners();
      child.stderr.removeAllListeners();
      child.removeAllListeners();
    };

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (!child.killed) {
        child.kill();
      }
      reject(error);
    };

    const handleLine = (line: string) => {
      combinedOutput += `${line}\n`;
      const url = extractTunnelUrl(line);
      if (!url || settled) return;

      settled = true;
      cleanup();
      resolve({
        url,
        process: child,
        close: () => {
          if (!child.killed) {
            child.kill();
          }
        },
      });
    };

    const stdoutReader = readline.createInterface({ input: child.stdout });
    const stderrReader = readline.createInterface({ input: child.stderr });

    stdoutReader.on("line", handleLine);
    stderrReader.on("line", handleLine);

    child.on("error", (error) => {
      fail(error instanceof Error ? error : new Error(String(error)));
    });

    child.on("exit", (code, signal) => {
      if (settled) return;
      fail(
        new Error(
          `Nao foi possivel abrir o link publico da demo. SSH finalizado com code=${code ?? "null"} signal=${signal ?? "null"}.\n${combinedOutput}`.trim(),
        ),
      );
    });

    const timeout = setTimeout(() => {
      fail(
        new Error(
          `Tempo esgotado ao criar o link publico da demo.\n${combinedOutput}`.trim(),
        ),
      );
    }, 20000);
  });

  child.on("exit", () => {
    if ((activeTunnel as SshTunnel | null)?.process?.pid === child.pid) {
      activeTunnel = null;
      tunnelPromise = null;
    }
  });

  return tunnel;
}

async function openSshTunnel(): Promise<ActiveTunnel> {
  const configuredBaseUrl = process.env.PUBLIC_DEMO_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return { url: normalizeBaseUrl(configuredBaseUrl) };
  }

  const port = Number(process.env.API_PORT ?? process.env.PORT ?? "3000");
  const requestedHost = getPreferredTunnelSubdomain();
  if (requestedHost) {
    const preferredTunnel = await openLocalhostRunTunnel(
      `${requestedHost}:80:127.0.0.1:${port}`,
    );

    if (await verifyTunnelBaseUrl(preferredTunnel.url)) {
      activeTunnel = preferredTunnel;
      return preferredTunnel;
    }

    preferredTunnel.close?.();
  }

  const fallbackTunnel = await openLocalhostRunTunnel(`80:127.0.0.1:${port}`);
  activeTunnel = fallbackTunnel;
  return fallbackTunnel;
}

export async function ensurePublicDemoBaseUrl(): Promise<string> {
  if (activeTunnel?.url) {
    if (await verifyTunnelBaseUrl(activeTunnel.url)) {
      return activeTunnel.url;
    }

    activeTunnel.close?.();
    activeTunnel = null;
    tunnelPromise = null;
  }

  if (!tunnelPromise) {
    tunnelPromise = openSshTunnel().catch((error) => {
      tunnelPromise = null;
      throw error;
    });
  }

  const tunnel = await tunnelPromise;
  activeTunnel = tunnel;
  return tunnel.url;
}

export async function buildPublicDemoUrl(demoPath: string): Promise<string> {
  const baseUrl = await ensurePublicDemoBaseUrl();
  return `${normalizeBaseUrl(baseUrl)}${demoPath.startsWith("/") ? demoPath : `/${demoPath}`}`;
}

export function getActivePublicDemoBaseUrl(): string | null {
  if (activeTunnel?.url) {
    return activeTunnel.url;
  }

  const configuredBaseUrl = process.env.PUBLIC_DEMO_BASE_URL?.trim();
  return configuredBaseUrl ? normalizeBaseUrl(configuredBaseUrl) : null;
}

export function warmPublicDemoTunnel(): void {
  void ensurePublicDemoBaseUrl().catch(() => {
    // Tunnel warming is best-effort. Message/share routes can retry later.
  });
}
