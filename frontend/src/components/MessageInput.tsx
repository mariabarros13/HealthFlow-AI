import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

interface MessageInputProps {
  onSend: (message: string) => void;
}

function MessageInput({ onSend }: MessageInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0;

  function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const content = value.trim();
    if (!content) return;

    onSend(content);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "24px";
  }

  function handleChange(value: string, element: HTMLTextAreaElement) {
    setValue(value);
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 130)}px`;
    element.style.overflowY = element.scrollHeight > 130 ? "auto" : "hidden";
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <form className="composer" onSubmit={sendMessage}>
      <label className="sr-only" htmlFor="message-input">Digite sua pergunta sobre saúde pública</label>
      <textarea
        ref={textareaRef}
        id="message-input"
        value={value}
        onChange={(event) => handleChange(event.target.value, event.currentTarget)}
        onKeyDown={handleKeyDown}
        placeholder="Escreva sua pergunta..."
        rows={1}
      />
      <button className="send-button" type="submit" disabled={!canSend} aria-label="Enviar mensagem">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <p className="composer-hint">Enter para enviar <span aria-hidden="true">·</span> Shift + Enter para nova linha</p>
    </form>
  );
}

export default MessageInput;
