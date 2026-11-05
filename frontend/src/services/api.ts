const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
const HEALTH_URL = `${API_URL}/health`;

interface HealthResponse {
  status: "healthy";
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  let response: Response;

  try {
    response = await fetch(HEALTH_URL);
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Falha de rede ao requisitar ${HEALTH_URL} (${cause}). ` +
        `Verifique se o backend está ativo e se o CORS permite a origem ${window.location.origin}.`,
      { cause: error },
    );
  }

  if (!response.ok) {
    throw new Error(
      `A API em ${HEALTH_URL} respondeu com HTTP ${response.status}` +
        `${response.statusText ? ` ${response.statusText}` : ""}.`,
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);
    throw new Error(`A resposta de ${HEALTH_URL} não contém JSON válido (${cause}).`, {
      cause: error,
    });
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("status" in data) ||
    data.status !== "healthy"
  ) {
    throw new Error(
      `A API em ${HEALTH_URL} retornou uma resposta de saúde inválida. Esperado: {"status":"healthy"}.`,
    );
  }

  return data as HealthResponse;
}
