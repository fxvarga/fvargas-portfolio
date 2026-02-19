# Building an AI Prompt Input with React

Create a polished AI prompt input component with auto-resizing textarea, model selection, character limits, and keyboard shortcuts. Essential for any chatbot or AI-powered application that needs a professional input experience.

## What We're Building

Our AI prompt input implementation includes:

- **Auto-resizing textarea** that grows with content up to a max height
- **Model selector** dropdown for choosing AI providers
- **Character count** with visual warnings near the limit
- **Keyboard shortcuts** for submitting and adding new lines
- **Disabled state** for loading/processing feedback

TIP: Try typing a multi-line prompt in the input above, then press Enter to submit. Use Shift+Enter for new lines! Adjust the character limit slider to see the warning colors.

## Prerequisites

Before we start, make sure you have:

- React 18+ installed
- Basic understanding of React hooks (useState, useRef, useCallback, useEffect)
- Familiarity with CSS transitions and form styling

## Step 1: Auto-Resizing Textarea

The key feature is a textarea that automatically grows as the user types. We achieve this by resetting the height to `auto`, then setting it to the `scrollHeight`:

```tsx
const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, maxLength = 2000 }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [text, autoResize]);

  return (
    <textarea
      ref={textareaRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      rows={1}
    />
  );
};
```

NOTE: We cap the height at 200px with `Math.min()` and let CSS `overflow-y: auto` handle scrolling beyond that. This prevents the input from taking over the entire viewport.

## Step 2: Keyboard Shortcut Handling

AI chat UIs typically use Enter to submit and Shift+Enter for new lines. We intercept the `keyDown` event:

```tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
  // Shift+Enter falls through naturally and inserts a newline
};

const handleSubmit = useCallback(() => {
  const trimmed = text.trim();
  if (!trimmed || disabled) return;
  onSubmit(trimmed, model);
  setText('');
  // Reset textarea height
  if (textareaRef.current) {
    textareaRef.current.style.height = 'auto';
  }
}, [text, model, disabled, onSubmit]);
```

## Step 3: Character Count with Visual Feedback

A character counter that changes color as users approach the limit provides excellent UX feedback:

```tsx
const charCount = text.length;
const charPercent = (charCount / maxLength) * 100;

<span className={`char-count ${charPercent > 90 ? 'warning' : ''} ${charPercent >= 100 ? 'danger' : ''}`}>
  {charCount} / {maxLength}
</span>
```

```css
.char-count {
  font-size: 0.75rem;
  color: #666;
  font-variant-numeric: tabular-nums;
}

.char-count.warning { color: #f59e0b; }
.char-count.danger { color: #ef4444; }
```

## Step 4: Model Selector

Adding a model selector dropdown lets users choose their AI provider. This is a common pattern in multi-model AI applications:

```tsx
<select
  className="model-selector"
  value={model}
  onChange={(e) => setModel(e.target.value)}
  aria-label="Select AI model"
>
  <option value="gpt-4o">GPT-4o</option>
  <option value="gpt-4o-mini">GPT-4o Mini</option>
  <option value="claude-sonnet">Claude Sonnet</option>
  <option value="claude-opus">Claude Opus</option>
</select>
```

## Step 5: Complete Component

Here's the full implementation with all features integrated:

```tsx
interface PromptInputProps {
  onSubmit: (text: string, model: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  placeholder = 'Ask me anything...',
  maxLength = 2000,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [model, setModel] = useState('gpt-4o');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize, keyboard handling, submit logic...

  return (
    <div className={`prompt-input-wrapper ${isFocused ? 'focused' : ''}`}>
      <div className="prompt-input-top">
        <select className="model-selector" value={model} onChange={...} />
      </div>
      <div className="prompt-input-body">
        <textarea ref={textareaRef} value={text} ... />
      </div>
      <div className="prompt-input-footer">
        <div className="prompt-meta">
          <span className="char-count">...</span>
          <span className="keyboard-hint">
            <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> new line
          </span>
        </div>
        <button className="prompt-submit-btn" onClick={handleSubmit}>
          <span className="submit-icon">↑</span>
        </button>
      </div>
    </div>
  );
};
```

## Styling

The input wrapper uses a focus state with a glowing border effect to indicate active interaction:

```css
.prompt-input-wrapper {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.prompt-input-wrapper.focused {
  border-color: #c26a2d;
  box-shadow: 0 0 0 2px rgba(194, 106, 45, 0.15),
              0 8px 24px rgba(0, 0, 0, 0.2);
}

.prompt-submit-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #c26a2d;
  color: #fff;
}

.prompt-submit-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: #555;
  cursor: not-allowed;
}
```

## Usage Examples

```tsx
// Basic usage
<PromptInput
  onSubmit={(text, model) => console.log(text, model)}
/>

// With custom settings
<PromptInput
  onSubmit={handleSubmit}
  placeholder="Describe your image..."
  maxLength={500}
/>

// In a chat interface
const ChatInterface = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (text: string, model: string) => {
    setIsProcessing(true);
    await sendToAI(text, model);
    setIsProcessing(false);
  };

  return (
    <div className="chat-interface">
      <MessageList messages={messages} />
      <PromptInput
        onSubmit={handleSubmit}
        disabled={isProcessing}
      />
    </div>
  );
};
```

## Performance Considerations

WARNING: Avoid calling `autoResize()` on every keystroke for very long text inputs. Consider debouncing the resize calculation for inputs that may contain thousands of characters.

- Reset textarea height before measuring to get accurate `scrollHeight`
- Use `font-variant-numeric: tabular-nums` for the character counter to prevent layout shifts
- Clear text state on submit to avoid stale references
- Memoize the `onSubmit` callback in parent components to prevent unnecessary re-renders

## Accessibility

```tsx
// Proper labeling
<textarea aria-label="Prompt input" />
<select aria-label="Select AI model" />
<button aria-label="Send prompt">↑</button>

// Keyboard hints visible in the UI
<span className="keyboard-hint">
  <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> new line
</span>
```

- **Keyboard navigation** works naturally with Tab through model selector, textarea, and submit button
- **Screen readers** announce the model selection and submit button purposes
- **Reduced motion** support disables transition animations

## Conclusion

A well-crafted prompt input is the gateway to your AI application. The auto-resizing textarea, keyboard shortcuts, and visual feedback create a professional experience that users expect from modern AI interfaces. Customize the model options and styling to match your application's design system.

---

## Related Tutorials

- [Building an AI Chat Bubble Component](/blog/ai-chat-bubble)
- [Creating AI Thinking Skeleton Loaders](/blog/ai-thinking-skeleton)
- [Building an AI Approval Flow Interface](/blog/ai-approval-flow)
