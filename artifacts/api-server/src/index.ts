import { loadIntegrationSecretsIntoEnv } from "./lib/integration-secrets";
import { loadEmailTemplates } from "./lib/email-template-settings";
import { logger } from "./lib/logger";
import { loadSystemSettings } from "./lib/system-settings";
import { startSubscriptionWorker } from "./lib/subscription-worker";

await loadIntegrationSecretsIntoEnv();
await loadSystemSettings();
await loadEmailTemplates();
startSubscriptionWorker(); // Inicia o verificador automático de faturamento

const { dbReady, databaseProvider, databaseLocation } = await import("@workspace/db");
const { default: app } = await import("./app");

const rawPort = process.env["PORT"] || "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  logger.warn(`Invalid PORT value: "${rawPort}". Falling back to 3000.`);
}

await dbReady;

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port, databaseProvider, databaseLocation }, "Server listening");
});
