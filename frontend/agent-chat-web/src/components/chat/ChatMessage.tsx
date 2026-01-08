import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import type { MessageDto } from '@/types';
import { formatTimestamp } from '@/lib/utils';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: MessageDto;
  /** Animation delay for staggered entrance */
  animationDelay?: number;
}

export function ChatMessage({ message, animationDelay = 0 }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const roleLabel = isUser ? 'You' : 'Assistant';
  const formattedTime = formatTimestamp(message.timestamp);

  return (
    <article
      role="article"
      aria-label={`${roleLabel} message at ${formattedTime}`}
      className={cn(
        'flex gap-4 py-4 px-4 md:px-6 animate-message-in',
        isUser 
          ? 'bg-gray-800/50' 
          : 'bg-transparent border-l-2 border-purple-500/50 ml-4 md:ml-6',
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-lg',
          isUser 
            ? 'bg-gradient-to-br from-blue-500 to-blue-700' 
            : 'bg-gradient-to-br from-purple-500 to-purple-700',
        )}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-gray-100">
            {roleLabel}
          </span>
          <time 
            dateTime={message.timestamp} 
            className="text-xs text-gray-400"
            aria-label={`Sent at ${formattedTime}`}
          >
            {formattedTime}
          </time>
        </div>

        <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
          {isAssistant ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap text-gray-300 leading-relaxed">{message.content}</p>
          )}
        </div>
      </div>
    </article>
  );
}
