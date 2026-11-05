import { useEffect, useState } from "react";
import ChatHeader from "./components/ChatHeader";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import { checkBackendHealth } from "./services/api";
import type { ConnectionState, Message } from "./types/message";
import "./App.css";

const welcomeMessage: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Olá! Sou o HealthFlow AI. Posso ajudar você a encontrar e compreender informações sobre saúde pública. Envie sua pergunta para começar.",
};

function App() {
  const [connection, setConnection] = useState<ConnectionState>("loading");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);

  useEffect(() => {
    let isMounted = true;

    checkBackendHealth()
      .then(() => {
        if (isMounted) {
          setConnection("connected");
          setConnectionError(null);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setConnection("error");
          setConnectionError(error instanceof Error ? error.message : String(error));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleSend(message: string) {
    setMessages((currentMessages) => [
      ...currentMessages,
      { id: crypto.randomUUID(), role: "user", content: message },
    ]);
  }

  return (
    <main className="app-shell" id="inicio">
      <ChatHeader connection={connection} />
      <section className="conversation-area" aria-label="Assistente de saúde pública">
        <div className="conversation-heading">
          <span className="conversation-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 5.75A2.75 2.75 0 0 1 6.75 3h10.5A2.75 2.75 0 0 1 20 5.75v7.5A2.75 2.75 0 0 1 17.25 16H10l-5 4v-6.5a2.75 2.75 0 0 1-1-2.12V5.75Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M8 9.5h8M8 12.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <h1>Conversa</h1>
            <p>Informação clara para cuidar melhor da saúde coletiva.</p>
          </div>
        </div>

        {connectionError && (
          <div className="connection-alert" role="alert">
            <strong>Não foi possível conectar ao backend.</strong>
            <p>{connectionError}</p>
          </div>
        )}

        <div className="chat-panel">
          <ChatWindow messages={messages} />
          <div className="composer-area">
            <MessageInput onSend={handleSend} />
            <p className="local-note">
              Suas mensagens aparecem nesta conversa. As respostas do assistente serão integradas em uma próxima etapa.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
