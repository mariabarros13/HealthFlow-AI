import type { ConnectionState } from "../types/message";

interface ChatHeaderProps {
  connection: ConnectionState;
}

const connectionLabels: Record<ConnectionState, string> = {
  loading: "Verificando conexão",
  connected: "Backend conectado",
  error: "Backend indisponível",
};

function ChatHeader({ connection }: ChatHeaderProps) {
  return (
    <header className="app-header">
      <a className="brand" href="#inicio" aria-label="HealthFlow AI, início">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M16 4.5v23M4.5 16h23" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <circle cx="16" cy="16" r="13.5" stroke="currentColor" strokeWidth="2" />
          </svg>
        </span>
        <span className="brand-copy">
          <strong>HealthFlow <span>AI</span></strong>
          <small>Assistente Inteligente de Saúde Pública</small>
        </span>
      </a>

      <div className={`connection-status connection-status--${connection}`} role="status" aria-live="polite">
        <span className="status-dot" aria-hidden="true" />
        <span>{connectionLabels[connection]}</span>
      </div>
    </header>
  );
}

export default ChatHeader;
