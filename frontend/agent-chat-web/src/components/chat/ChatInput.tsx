import { useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = !disabled && message.trim().length > 0;

  return (
    <div className="flex gap-3 p-4 md:px-6 border-t border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1"
        aria-label="Chat message input"
      />
      <Button
        onClick={handleSend}
        disabled={!canSend}
        className="self-end"
        size="icon"
        aria-label={canSend ? 'Send message' : 'Cannot send message'}
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
