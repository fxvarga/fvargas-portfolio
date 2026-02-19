# Building an AI Chat Bubble Component with React

Create a polished AI chat interface with streaming text animation, typing indicators, and message bubbles. Perfect for chatbot UIs, AI assistants, and any application that needs to display real-time conversational AI responses.

## What We're Building

Our AI chat bubble implementation includes:

- **Streaming text animation** that reveals tokens character-by-character
- **Typing indicator** with animated bouncing dots
- **User and assistant styling** with distinct visual treatments
- **Configurable stream speed** for different response feels
- **Auto-scroll** to keep the latest message visible

TIP: Try selecting different conversations and adjusting the stream speed slider to see how the text reveal animation changes!

## Prerequisites

Before we start, make sure you have:

- React 18+ installed
- Basic understanding of React hooks (useState, useEffect, useRef, useCallback)
- Familiarity with CSS animations and transitions

## Step 1: Define the Message Types

First, let's set up our TypeScript interfaces for chat messages:

```tsx
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
```

The `isStreaming` flag tells the component whether to animate the text reveal or display it all at once. This is key — user messages appear instantly, while assistant messages stream in.

## Step 2: Build the Streaming Text Logic

The core of our chat bubble is the character-by-character streaming effect. We use `setInterval` to progressively reveal the message content:

```tsx
const ChatBubble: React.FC<ChatBubbleProps> = ({ message, streamSpeed = 20 }) => {
  const [displayedText, setDisplayedText] = useState(
    message.isStreaming ? '' : message.content
  );
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

  return (
    <div className={`chat-bubble chat-bubble-${message.role}`}>
      <div className="chat-bubble-content">
        {displayedText}
        {cursorVisible && <span className="streaming-cursor">|</span>}
      </div>
    </div>
  );
};
```

NOTE: We use a `useRef` for the character index instead of state to avoid re-rendering on every character increment. Only `displayedText` triggers re-renders when we update it in batches.

## Step 3: Create the Typing Indicator

The typing indicator gives users visual feedback that the AI is "thinking." Three bouncing dots with staggered animation delays create a natural pulsing effect:

```tsx
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
```

The CSS animation for the dots uses `animation-delay` to stagger each dot:

```css
.typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #c26a2d;
  animation: typingBounce 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}
```

## Step 4: Compose the Chat Interface

Now let's wire everything together with a conversation runner that simulates the user-then-AI flow:

```tsx
const AiChatBubbleDemo: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const runConversation = useCallback(() => {
    setMessages([]);
    setIsTyping(false);

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: 'How do I center a div in CSS?',
      timestamp: new Date(),
    };
    setMessages([userMsg]);

    // Show typing indicator, then reveal AI response
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Use Flexbox! Set display: flex, justify-content: center...',
          timestamp: new Date(),
          isStreaming: true,
        };
        setMessages(prev => [...prev, aiMsg]);
      }, 1500);
    }, 800);
  }, []);

  return (
    <div className="chat-preview-area">
      {messages.map(msg => (
        <ChatBubble key={msg.id} message={msg} />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={chatEndRef} />
    </div>
  );
};
```

## Styling

The chat bubbles use distinct visual treatments for user vs. assistant messages. User messages align right with an accent-colored background, while assistant messages align left with a neutral background:

```css
.chat-bubble {
  display: flex;
  gap: 0.75rem;
  max-width: 85%;
  animation: bubbleFadeIn 0.3s ease-out;
}

.chat-bubble-user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.chat-bubble-assistant {
  align-self: flex-start;
}

.chat-bubble-user .chat-bubble-body {
  background: rgba(194, 106, 45, 0.15);
  border-color: rgba(194, 106, 45, 0.25);
}

.streaming-cursor {
  color: #c26a2d;
  font-weight: bold;
  animation: cursorBlink 0.7s step-end infinite;
}

@keyframes cursorBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```

## Usage Examples

```tsx
// Basic usage - static message
<ChatBubble
  message={{
    id: '1',
    role: 'assistant',
    content: 'Hello! How can I help you?',
    timestamp: new Date(),
  }}
/>

// Streaming message
<ChatBubble
  message={{
    id: '2',
    role: 'assistant',
    content: 'Let me explain how this works...',
    timestamp: new Date(),
    isStreaming: true,
  }}
  streamSpeed={15}
/>

// In a chat interface
<div className="chat-container">
  {messages.map(msg => (
    <ChatBubble key={msg.id} message={msg} />
  ))}
  {isTyping && <TypingIndicator />}
</div>
```

## Performance Considerations

WARNING: Setting stream speed too low (under 5ms) can cause excessive re-renders. For production use, consider batching characters in groups of 2-3 instead of one at a time.

- Use `useRef` for mutable values that don't need to trigger renders
- Clean up intervals in the effect's cleanup function to prevent memory leaks
- Consider using `requestAnimationFrame` for smoother animation at very high speeds
- Memoize child components with `React.memo` if the chat list grows large

## Accessibility

Our chat bubbles include comprehensive accessibility support:

```tsx
// ARIA roles on messages
<div
  className="chat-bubble"
  role="article"
  aria-label={`${message.role} message`}
>
  {/* content */}
</div>

// Typing indicator announces itself to screen readers
<div
  className="typing-indicator"
  role="status"
  aria-label="AI is typing"
>
  {/* dots */}
</div>

// Hide decorative cursor from assistive tech
<span className="streaming-cursor" aria-hidden="true">|</span>
```

- **Reduced motion** support disables all animations
- **Screen readers** announce new messages via ARIA live regions
- **Semantic markup** with proper roles for articles and status indicators

## Conclusion

AI chat bubbles are a fundamental building block for conversational interfaces. The streaming text effect creates a natural, engaging feel that mimics real-time AI generation. Experiment with different stream speeds and typing indicator styles to match your application's personality.

---

## Related Tutorials

- [Building an AI Prompt Input with React](/blog/ai-prompt-input)
- [Creating AI Thinking Skeleton Loaders](/blog/ai-thinking-skeleton)
- [Building AI Tool Call Cards with React](/blog/ai-tool-call-card)
