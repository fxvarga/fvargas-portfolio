import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Loader2 } from 'lucide-react';

interface StreamingMessageProps {
  content: string;
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <article
      role="article"
      aria-label="Assistant is typing a response"
      aria-live="polite"
      className="flex gap-4 py-4 px-4 md:px-6 bg-transparent border-l-2 border-purple-500/50 ml-4 md:ml-6 animate-message-in"
    >
      {/* Avatar */}
      <div 
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg"
        aria-hidden="true"
      >
        <Bot className="w-5 h-5 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-gray-100">Assistant</span>
          <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" aria-hidden="true" />
          <span className="text-xs text-gray-400">Thinking...</span>
        </div>

        <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
          {content ? (
            <>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              {/* Typing cursor */}
              <span 
                className="inline-block w-0.5 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" 
                aria-hidden="true"
              />
            </>
          ) : (
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" />
              <span
                className="w-2 h-2 bg-purple-400/60 rounded-full animate-bounce"
                style={{ animationDelay: '0.15s' }}
              />
              <span
                className="w-2 h-2 bg-purple-400/60 rounded-full animate-bounce"
                style={{ animationDelay: '0.3s' }}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
