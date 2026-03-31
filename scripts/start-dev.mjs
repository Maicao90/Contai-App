import { spawn } from "node:child_process";

const packageManager = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const backendPort = process.env.API_PORT ?? "3000";
const frontendPort = process.env.PORT ?? "5173";
const basePath = process.env.BASE_PATH ?? "/";

const sharedEnv = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV ?? "development",
};

const services = [
  {
    name: "api",
    color: "\u001b[36m",
    args: ["--filter", "@workspace/api-server", "dev"],
    env: {
      ...sharedEnv,
      PORT: backendPort,
    },
  },
  {
    name: "web",
    color: "\u001b[35m",
    args: ["--filter", "@workspace/prospecta-bot", "dev"],
    env: {
      ...sharedEnv,
      PORT: frontendPort,
      BASE_PATH: basePath,
      VITE_API_TARGET:
        process.env.VITE_API_TARGET ?? `http://127.0.0.1:${backendPort}`,
    },
  },
];

let shuttingDown = false;
const children = [];

function relayOutput(service, chunk, targetStream) {
  const lines = chunk.toString().split(/\r?\n/);
  for (const line of lines) {
    if (!line) continue;
    targetStream.write(`${service.color}[${service.name}]\u001b[0m ${line}\n`);
  }
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => process.exit(exitCode), 250);
}

for (const service of services) {
  const child = spawn(packageManager, service.args, {
    cwd: process.cwd(),
    env: service.env,
    shell: process.platform === "win32",
    stdio: ["inherit", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => relayOutput(service, chunk, process.stdout));
  child.stderr.on("data", (chunk) => relayOutput(service, chunk, process.stderr));
  child.on("exit", (code) => {
    if (!shuttingDown) {
      shutdown(code ?? 1);
    }
  });

  children.push(child);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
