/**
 * AI Chat Bubble Demo Component
 *
 * Streaming message UI with typing indicators, markdown-like formatting,
 * and animated token-by-token text reveal for AI chat interfaces.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './AiChatBubble.css';

// --- Core Chat Bubble Component ---

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatBubbleProps {
  message: ChatMessage;
  streamSpeed?: number;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, streamSpeed = 20 }) => {
  const [displayedText, setDisplayedText] = useState(message.isStreaming ? '' : message.content);
  const [cursorVisible, setCursorVisible] = useState(message.isStreaming ?? false);
  const charIndex = useRef(0);

  useEffect(() => {
    if (!message.isStreaming) {
      setDisplayedText(message.content);
      setCursorVisible(false);
      return;
    }

    charIndex.current = 0;
    setDisplayedText('');
    setCursorVisible(true);

    const interval = setInterval(() => {
      if (charIndex.current < message.content.length) {
        const nextChunk = message.content.slice(0, charIndex.current + 1);
        setDisplayedText(nextChunk);
        charIndex.current += 1;
      } else {
        clearInterval(interval);
        setCursorVisible(false);
      }
    }, streamSpeed);

    return () => clearInterval(interval);
  }, [message.content, message.isStreaming, streamSpeed]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`chat-bubble chat-bubble-${message.role}`} role="article" aria-label={`${message.role} message`}>
      <div className="chat-bubble-avatar">
        {message.role === 'user' ? '👤' : '🤖'}
      </div>
      <div className="chat-bubble-body">
        <div className="chat-bubble-header">
          <span className="chat-bubble-sender">
            {message.role === 'user' ? 'You' : 'AI Assistant'}
          </span>
          <span className="chat-bubble-time">{formatTime(message.timestamp)}</span>
        </div>
        <div className="chat-bubble-content">
          {displayedText}
          {cursorVisible && <span className="streaming-cursor" aria-hidden="true">|</span>}
        </div>
      </div>
    </div>
  );
};

// --- Typing Indicator ---

const TypingIndicator: React.FC = () => (
  <div className="typing-indicator" role="status" aria-label="AI is typing">
    <div className="chat-bubble-avatar">🤖</div>
    <div className="typing-dots">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  </div>
);

// --- Demo Wrapper ---

interface DemoProps {
  className?: string;
}

const sampleConversations: { label: string; messages: Omit<ChatMessage, 'id' | 'timestamp'>[] }[] = [
  {
    label: 'Code Help',
    messages: [
      { role: 'user', content: 'How do I center a div in CSS?' },
      {
        role: 'assistant',
        content:
          'There are several ways to center a div! The most modern approach is using Flexbox:\n\n.parent {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n\nOr you can use CSS Grid:\n\n.parent {\n  display: grid;\n  place-items: center;\n}\n\nBoth methods work great for horizontal and vertical centering.',
        isStreaming: true,
      },
    ],
  },
  {
    label: 'Creative Writing',
    messages: [
      { role: 'user', content: 'Write a haiku about React components.' },
      {
        role: 'assistant',
        content:
          'Components compose,\nState flows like a gentle stream,\nUI blossoms bright.',
        isStreaming: true,
      },
    ],
  },
  {
    label: 'Debugging',
    messages: [
      { role: 'user', content: 'Why is my useEffect running twice in development?' },
      {
        role: 'assistant',
        content:
          'In React 18+ with Strict Mode enabled, useEffect intentionally runs twice in development. This helps you find bugs related to missing cleanup functions.\n\nReact mounts your component, unmounts it, then mounts it again. This double-invocation only happens in development — not in production.\n\nTo fix issues this reveals, make sure your effects have proper cleanup functions that undo whatever the effect did.',
        isStreaming: true,
      },
    ],
  },
];

const AiChatBubbleDemo: React.FC<DemoProps> = ({ className }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamSpeed, setStreamSpeed] = useState(20);
  const [selectedConversation, setSelectedConversation] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const runConversation = useCallback(() => {
    const conversation = sampleConversations[selectedConversation];
    setMessages([]);
    setIsTyping(false);

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: conversation.messages[0].content,
      timestamp: new Date(),
    };
    setMessages([userMsg]);

    // Show typing indicator then AI response
    setTimeout(() => {
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: conversation.messages[1].content,
          timestamp: new Date(),
          isStreaming: conversation.messages[1].isStreaming,
        };
        setMessages((prev) => [...prev, aiMsg]);
      }, 1500);
    }, 800);
  }, [selectedConversation]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setIsTyping(false);
  }, []);

  return (
    <div className={`ai-chat-bubble-demo ${className || ''}`}>
      <div className="demo-header">
        <h4>AI Chat Bubble</h4>
        <p>Streaming message UI with typing indicators and animated text reveal</p>
      </div>

      <div className="demo-controls">
        <div className="control-row">
          <div className="control-group">
            <label>Conversation:</label>
            <select
              value={selectedConversation}
              onChange={(e) => setSelectedConversation(parseInt(e.target.value))}
            >
              {sampleConversations.map((conv, i) => (
                <option key={i} value={i}>
                  {conv.label}
                </option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label>Stream Speed: {streamSpeed}ms</label>
            <input
              type="range"
              min="5"
              max="80"
              value={streamSpeed}
              onChange={(e) => setStreamSpeed(parseInt(e.target.value))}
            />
          </div>
        </div>
        <div className="control-row">
          <div className="notification-buttons">
            <button className="notification-btn info" onClick={runConversation}>
              Run Conversation
            </button>
            <button className="clear-btn" onClick={clearChat}>
              Clear Chat
            </button>
          </div>
        </div>
      </div>

      <div className="chat-preview-area">
        <div className="chat-messages">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} streamSpeed={streamSpeed} />
          ))}
          {isTyping && <TypingIndicator />}
          {messages.length === 0 && !isTyping && (
            <div className="chat-placeholder">
              Select a conversation and click "Run Conversation" to see the demo
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="demo-info">
        <h5>Features</h5>
        <ul>
          <li>Token-by-token streaming text animation</li>
          <li>Animated typing indicator with bouncing dots</li>
          <li>User and assistant message styling</li>
          <li>Configurable stream speed</li>
          <li>Auto-scroll to latest message</li>
          <li>Accessibility with ARIA roles and labels</li>
        </ul>
      </div>
    </div>
  );
};

export default AiChatBubbleDemo;
