/**
 * AI Prompt Input Demo Component
 *
 * Auto-resizing textarea with submit actions, character count,
 * model selector, and keyboard shortcuts for AI prompt interfaces.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './AiPromptInput.css';

// --- Core Prompt Input Component ---

interface PromptInputProps {
  onSubmit: (text: string, model: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
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

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed, model);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, model, disabled, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const charCount = text.length;
  const charPercent = (charCount / maxLength) * 100;

  return (
    <div className={`prompt-input-wrapper ${isFocused ? 'focused' : ''} ${disabled ? 'disabled' : ''}`}>
      <div className="prompt-input-top">
        <select
          className="model-selector"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={disabled}
          aria-label="Select AI model"
        >
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4o-mini">GPT-4o Mini</option>
          <option value="claude-sonnet">Claude Sonnet</option>
          <option value="claude-opus">Claude Opus</option>
        </select>
      </div>
      <div className="prompt-input-body">
        <textarea
          ref={textareaRef}
          className="prompt-textarea"
          value={text}
          onChange={(e) => {
            if (e.target.value.length <= maxLength) {
              setText(e.target.value);
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          aria-label="Prompt input"
        />
      </div>
      <div className="prompt-input-footer">
        <div className="prompt-meta">
          <span className={`char-count ${charPercent > 90 ? 'warning' : ''} ${charPercent >= 100 ? 'danger' : ''}`}>
            {charCount} / {maxLength}
          </span>
          <span className="keyboard-hint">
            <kbd>Enter</kbd> to send &middot; <kbd>Shift+Enter</kbd> new line
          </span>
        </div>
        <button
          className="prompt-submit-btn"
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          aria-label="Send prompt"
        >
          <span className="submit-icon">↑</span>
        </button>
      </div>
    </div>
  );
};

// --- Demo Wrapper ---

interface DemoProps {
  className?: string;
}

interface SubmittedPrompt {
  id: string;
  text: string;
  model: string;
  timestamp: Date;
}

const AiPromptInputDemo: React.FC<DemoProps> = ({ className }) => {
  const [submittedPrompts, setSubmittedPrompts] = useState<SubmittedPrompt[]>([]);
  const [maxLength, setMaxLength] = useState(500);
  const [isDisabled, setIsDisabled] = useState(false);

  const handleSubmit = useCallback((text: string, model: string) => {
    const prompt: SubmittedPrompt = {
      id: Date.now().toString(),
      text,
      model,
      timestamp: new Date(),
    };
    setSubmittedPrompts((prev) => [prompt, ...prev].slice(0, 5));
  }, []);

  const clearHistory = useCallback(() => {
    setSubmittedPrompts([]);
  }, []);

  return (
    <div className={`ai-prompt-input-demo ${className || ''}`}>
      <div className="demo-header">
        <h4>AI Prompt Input</h4>
        <p>Auto-resizing textarea with model selector and keyboard shortcuts</p>
      </div>

      <div className="demo-controls">
        <div className="control-row">
          <div className="control-group">
            <label>Max Characters: {maxLength}</label>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={maxLength}
              onChange={(e) => setMaxLength(parseInt(e.target.value))}
            />
          </div>
          <div className="control-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isDisabled}
                onChange={(e) => setIsDisabled(e.target.checked)}
              />
              Disabled State
            </label>
          </div>
        </div>
      </div>

      <div className="prompt-showcase">
        <PromptInput
          onSubmit={handleSubmit}
          maxLength={maxLength}
          disabled={isDisabled}
          placeholder="Try typing a prompt... press Enter to submit"
        />
      </div>

      {submittedPrompts.length > 0 && (
        <div className="submitted-prompts">
          <div className="submitted-header">
            <h5>Submitted Prompts</h5>
            <button className="clear-btn" onClick={clearHistory}>Clear</button>
          </div>
          <div className="prompt-history">
            {submittedPrompts.map((p) => (
              <div key={p.id} className="prompt-entry">
                <div className="prompt-entry-meta">
                  <span className="prompt-model-badge">{p.model}</span>
                  <span className="prompt-time">
                    {p.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="prompt-entry-text">{p.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="demo-info">
        <h5>Features</h5>
        <ul>
          <li>Auto-resizing textarea that grows with content</li>
          <li>Model selector dropdown for AI provider choice</li>
          <li>Character count with visual warnings near limit</li>
          <li>Keyboard shortcuts: Enter to send, Shift+Enter for new line</li>
          <li>Disabled state support for loading/processing</li>
          <li>Accessibility with proper ARIA labels</li>
        </ul>
      </div>
    </div>
  );
};

export default AiPromptInputDemo;
