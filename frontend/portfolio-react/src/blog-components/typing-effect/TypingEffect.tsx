/**
 * Typing Effect Demo Component
 * 
 * A typewriter-style text animation with blinking cursor,
 * supporting multiple phrases with delete and retype.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './TypingEffect.css';

interface TypingEffectProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseTime?: number;
  className?: string;
}

const TypingEffect: React.FC<TypingEffectProps> = ({
  phrases,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseTime = 2000,
  className = '',
}) => {
  const [displayText, setDisplayText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const currentPhrase = phrases[phraseIndex];

  const tick = useCallback(() => {
    if (isPaused) {
      timeoutRef.current = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseTime);
      return;
    }

    if (isDeleting) {
      // Deleting
      if (displayText.length > 0) {
        setDisplayText(displayText.slice(0, -1));
        timeoutRef.current = setTimeout(tick, deletingSpeed);
      } else {
        // Move to next phrase
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    } else {
      // Typing
      if (displayText.length < currentPhrase.length) {
        setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        timeoutRef.current = setTimeout(tick, typingSpeed);
      } else {
        // Finished typing, pause before deleting
        setIsPaused(true);
        timeoutRef.current = setTimeout(tick, 0);
      }
    }
  }, [displayText, isDeleting, isPaused, currentPhrase, phrases.length, typingSpeed, deletingSpeed, pauseTime]);

  useEffect(() => {
    timeoutRef.current = setTimeout(tick, typingSpeed);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [tick, typingSpeed]);

  return (
    <span className={`typing-effect ${className}`}>
      {displayText}
      <span className="typing-cursor">|</span>
    </span>
  );
};

interface DemoProps {
  className?: string;
}

const TypingEffectDemo: React.FC<DemoProps> = ({ className }) => {
  const [typingSpeed, setTypingSpeed] = useState(100);
  const [deletingSpeed, setDeletingSpeed] = useState(50);
  const [customPhrases, setCustomPhrases] = useState([
    'Full-Stack Developer',
    'UI/UX Enthusiast',
    'Open Source Contributor',
    'Problem Solver',
  ]);
  const [newPhrase, setNewPhrase] = useState('');
  const [key, setKey] = useState(0);

  const handleAddPhrase = () => {
    if (newPhrase.trim()) {
      setCustomPhrases([...customPhrases, newPhrase.trim()]);
      setNewPhrase('');
      setKey(k => k + 1);
    }
  };

  const handleRemovePhrase = (index: number) => {
    if (customPhrases.length > 1) {
      setCustomPhrases(customPhrases.filter((_, i) => i !== index));
      setKey(k => k + 1);
    }
  };

  return (
    <div className={`typing-effect-demo ${className || ''}`}>
      <div className="demo-header">
        <h4>Typing Effect</h4>
        <p>Classic typewriter animation with customizable options</p>
      </div>

      <div className="typing-showcase">
        <div className="typing-preview">
          <span className="typing-prefix">I am a </span>
          <TypingEffect
            key={key}
            phrases={customPhrases}
            typingSpeed={typingSpeed}
            deletingSpeed={deletingSpeed}
          />
        </div>
      </div>

      <div className="demo-controls">
        <div className="control-row">
          <div className="control-group">
            <label>Typing Speed: {typingSpeed}ms</label>
            <input
              type="range"
              min="30"
              max="200"
              value={typingSpeed}
              onChange={(e) => {
                setTypingSpeed(parseInt(e.target.value));
                setKey(k => k + 1);
              }}
            />
          </div>
          <div className="control-group">
            <label>Deleting Speed: {deletingSpeed}ms</label>
            <input
              type="range"
              min="20"
              max="100"
              value={deletingSpeed}
              onChange={(e) => {
                setDeletingSpeed(parseInt(e.target.value));
                setKey(k => k + 1);
              }}
            />
          </div>
        </div>

        <div className="phrases-editor">
          <h5>Phrases</h5>
          <div className="phrases-list">
            {customPhrases.map((phrase, index) => (
              <div key={index} className="phrase-item">
                <span>{phrase}</span>
                <button
                  onClick={() => handleRemovePhrase(index)}
                  className="remove-phrase"
                  disabled={customPhrases.length <= 1}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div className="add-phrase">
            <input
              type="text"
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              placeholder="Add new phrase..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddPhrase()}
            />
            <button onClick={handleAddPhrase}>Add</button>
          </div>
        </div>
      </div>

      <div className="demo-info">
        <h5>Features</h5>
        <ul>
          <li>Configurable typing and deleting speeds</li>
          <li>Cycles through multiple phrases</li>
          <li>Blinking cursor animation</li>
          <li>Pause before deleting</li>
          <li>Zero external dependencies</li>
        </ul>
      </div>
    </div>
  );
};

export default TypingEffectDemo;
