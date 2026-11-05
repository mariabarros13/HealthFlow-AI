import os
from pathlib import Path

import httpx
from dotenv import load_dotenv
from google import genai
from google.genai import errors, types

from app.schemas.chat import ChatHistoryMessage


BACKEND_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_ROOT / ".env")

DEFAULT_MODEL = "gemini-3.8-flash"
REQUEST_TIMEOUT_SECONDS = 45.0

SYSTEM_PROMPT = """
Você é o HealthFlow AI, um assistente de informação em saúde pública.

Atue com tom profissional, acolhedor, objetivo e cauteloso. Seu domínio é
informação institucional e administrativa e orientação sobre serviços públicos
de saúde. Ajude a pessoa a compreender informações gerais e a localizar os
canais oficiais apropriados, sem afirmar que consultou fontes que não recebeu.

Limites obrigatórios:
- Nunca faça diagnósticos, triagem, prescrições ou recomendações de tratamento
  individual, mesmo que a pessoa peça ou forneça sintomas e exames.
- Não substitua profissionais de saúde nem serviços de emergência. Se a pessoa
  relatar uma situação urgente, oriente-a a procurar imediatamente o serviço de
  emergência local ou um profissional de saúde.
- Não invente regras, direitos, horários, contatos, endereços, disponibilidade
  de serviços ou evidências. Quando não souber ou não houver base suficiente,
  diga isso claramente e recomende confirmar em canais oficiais do SUS,
  Ministério da Saúde ou secretaria de saúde local.
- Para perguntas fora de informação institucional, administrativa ou serviços
  públicos de saúde, explique brevemente que estão fora do seu escopo e indique
  um canal apropriado quando possível.

Responda em português, salvo se a pessoa usar outro idioma. Separe claramente
informações gerais de orientações que exigem confirmação oficial.
""".strip()


class LLMConfigurationError(Exception):
    """Required local provider configuration is missing or invalid."""


class LLMTimeoutError(Exception):
    """The LLM provider did not respond before the request timed out."""


class LLMProviderError(Exception):
    """The LLM provider returned an error or an unusable response."""


class LLMRateLimitError(LLMProviderError):
    """The LLM provider is temporarily rate limiting requests."""


class LLMUnavailableError(LLMProviderError):
    """The LLM provider is temporarily unavailable."""


def _build_contents(
    history: list[ChatHistoryMessage], message: str
) -> list[types.Content]:
    contents = [
        types.Content(
            role="model" if item.role == "assistant" else "user",
            parts=[types.Part(text=item.content)],
        )
        for item in history
    ]
    contents.append(types.Content(role="user", parts=[types.Part(text=message)]))
    return contents


async def generate_reply(
    message: str, history: list[ChatHistoryMessage]
) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "replace-with-your-gemini-api-key":
        raise LLMConfigurationError(
            "GEMINI_API_KEY não configurada. Defina a chave no arquivo backend/.env."
        )

    model = os.getenv("GEMINI_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL
    client = genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(timeout=int(REQUEST_TIMEOUT_SECONDS * 1000)),
    )
    try:
        response = await client.aio.models.generate_content(
            model=model,
            contents=_build_contents(history, message),
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.2,
            ),
        )
    except httpx.TimeoutException as exc:
        raise LLMTimeoutError("O provedor de IA demorou para responder.") from exc
    except httpx.HTTPError as exc:
        raise LLMProviderError(
            "Não foi possível estabelecer comunicação com o provedor de IA."
        ) from exc
    except errors.APIError as exc:
        if exc.code == 429:
            raise LLMRateLimitError(
                "O provedor de IA está limitando as requisições. Tente novamente mais tarde."
            ) from exc
        if exc.code >= 500:
            raise LLMUnavailableError(
                "O provedor de IA está temporariamente indisponível."
            ) from exc
        if exc.code in (401, 403):
            raise LLMProviderError(
                "O provedor de IA rejeitou a autenticação. "
                "Verifique a chave de API configurada."
            ) from exc
        raise LLMProviderError(
            f"O provedor de IA rejeitou a requisição (HTTP {exc.code}). "
            "Verifique a chave, o modelo e a configuração do provedor."
        ) from exc
    finally:
        await client.aio.aclose()

    try:
        answer = (response.text or "").strip()
    except (ValueError, TypeError, AttributeError) as exc:
        raise LLMProviderError(
            "O provedor de IA retornou uma resposta em formato inesperado."
        ) from exc

    if not answer:
        raise LLMProviderError("O provedor de IA retornou uma resposta vazia.")

    return answer
