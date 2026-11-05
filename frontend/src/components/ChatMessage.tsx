import type { Message } from "../types/message";

interface ChatMessageProps {
  message: Message;
}

function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  return (
    <article className={`message message--${message.role}`}>
      {isAssistant && <span className="message-avatar" aria-hidden="true">H</span>}
      <div className="message-body">
        <span className="message-author">{isAssistant ? "HealthFlow AI" : "Você"}</span>
        <p className="message-bubble">{message.content}</p>
      </div>
    </article>
  );
}

export default ChatMessage;
