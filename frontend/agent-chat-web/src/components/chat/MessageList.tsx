import { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { StreamingMessage } from './StreamingMessage';
import { ToolCallCard } from './ToolCallCard';
import type { ChatTimelineItem } from '@/types';
import { Bot, FileSpreadsheet, Calculator, Search, BookOpen } from 'lucide-react';

interface MessageListProps {
  items: ChatTimelineItem[];
  streamingContent: string;
  isStreaming: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}

const suggestions = [
  {
    icon: <Calculator className="w-4 h-4" />,
    text: 'Run monthly depreciation for US01',
    query: 'Run the monthly depreciation process for entity US01 for December 2024',
  },
  {
    icon: <Search className="w-4 h-4" />,
    text: 'Query fixed assets',
    query: 'Query all active fixed assets for entity US01',
  },
  {
    icon: <FileSpreadsheet className="w-4 h-4" />,
    text: 'Generate Excel report',
    query: 'Generate an Excel report with all fixed assets and their depreciation schedules',
  },
  {
    icon: <BookOpen className="w-4 h-4" />,
    text: 'Create journal entry',
    query: 'Create a journal entry for monthly depreciation',
  },
];

export function MessageList({
  items,
  streamingContent,
  isStreaming,
  onSuggestionClick,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items, streamingContent]);

  if (items.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 md:p-8">
        <div className="text-center max-w-lg">
          {/* Hero icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20">
            <Bot className="w-8 h-8 text-purple-400" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-100 mb-2">
            Welcome to Agent Chat
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            I can help you with depreciation calculations, journal entries, fixed asset queries, and generating Excel reports.
          </p>
          
          {/* Suggestion chips */}
          {onSuggestionClick && (
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.text}
                  onClick={() => onSuggestionClick(suggestion.query)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700/50 hover:border-gray-600/50 rounded-xl text-sm text-gray-300 hover:text-gray-100 transition-all duration-150 group"
                >
                  <span className="text-gray-500 group-hover:text-purple-400 transition-colors">
                    {suggestion.icon}
                  </span>
                  {suggestion.text}
                </button>
              ))}
            </div>
          )}
          
          {!onSuggestionClick && (
            <p className="text-sm text-gray-500">
              Start a conversation by sending a message below.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 overflow-y-auto scroll-smooth"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {/* Timeline container with connector line */}
      <div className="relative">
        {/* Vertical timeline line for desktop */}
        <div 
          className="hidden md:block absolute left-[38px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-700/50 via-gray-700/30 to-transparent pointer-events-none" 
          aria-hidden="true"
        />
        
        {items.map((item, index) => {
          if (item.type === 'message') {
            return (
              <ChatMessage 
                key={item.data.id} 
                message={item.data}
                animationDelay={index * 50}
              />
            );
          } else {
            return <ToolCallCard key={item.data.id} toolCall={item.data} />;
          }
        })}
        
        {isStreaming && <StreamingMessage content={streamingContent} />}
      </div>
      
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
