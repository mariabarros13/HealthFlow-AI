import { useEffect, useRef } from "react";
import type { Message } from "../types/message";
import ChatMessage from "./ChatMessage";

interface ChatWindowProps {
  messages: Message[];
}

function ChatWindow({ messages }: ChatWindowProps) {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <section className="chat-history" aria-label="Histórico da conversa" aria-live="polite">
      <div className="messages-list">
        {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
        <div ref={endOfMessagesRef} />
      </div>
    </section>
  );
}

export default ChatWindow;
