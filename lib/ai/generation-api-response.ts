export type GenerationApiSuccess = {
  ok: true;
  blueprint: unknown;
  projectId: string;
  source: "openai" | "mock";
};

export type GenerationApiFailure = {
  ok: false;
  error: string;
  message: string;
  details?: string;
};

export function generationSuccessBody(
  data: Omit<GenerationApiSuccess, "ok">,
): GenerationApiSuccess {
  return { ok: true, ...data };
}

export function generationFailureBody(
  error: string,
  message: string,
  options?: { details?: string; status?: number },
): { body: GenerationApiFailure; status: number } {
  const body: GenerationApiFailure = {
    ok: false,
    error,
    message,
  };
  if (options?.details && process.env.NODE_ENV === "development") {
    body.details = options.details;
  }
  return { body, status: options?.status ?? 500 };
}
