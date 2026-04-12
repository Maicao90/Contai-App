import { loadIntegrationSecretsIntoEnv } from "../artifacts/api-server/src/lib/integration-secrets.ts";

const main = async () => {
  try {
    // Definimos o CWD para a pasta do api-server para simular a execução real
    process.chdir("./artifacts/api-server");
    console.log("CWD:", process.cwd());
    
    await loadIntegrationSecretsIntoEnv();
    
    const keysToCheck = ["OPENAI_API_KEY", "META_ACCESS_TOKEN", "DATABASE_URL"];
    
    for (const key of keysToCheck) {
      if (process.env[key]) {
        console.log(`✅ ${key} carregada com sucesso.`);
      } else {
        console.log(`❌ Falha ao carregar ${key}.`);
      }
    }
    
  } catch (err) {
    console.error("ERRO NO TESTE:", err);
  }
};

main();
