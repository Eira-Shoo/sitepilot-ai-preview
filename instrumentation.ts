export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { applyDevOpenAiKeyFromEnvLocal } = await import("@/lib/openai/resolve-api-key");
    applyDevOpenAiKeyFromEnvLocal();
  }
}
