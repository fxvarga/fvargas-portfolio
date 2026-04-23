import { useRef, useCallback, type ReactNode, type KeyboardEvent, createElement } from 'react';
import { useEditMode } from '../context/EditModeContext';

// ---------------------------------------------------------------------------
// <Editable> — inline-editable text wrapper
// ---------------------------------------------------------------------------
// Usage:  <Editable path="hero.headline" as="h1">{hero.headline}</Editable>
//
// When edit mode is OFF → renders the text (using override if present) in the
// specified HTML element (default: span).
//
// When edit mode is ON → the element becomes contentEditable. On blur the new
// text is saved as an override keyed by `path`.
// ---------------------------------------------------------------------------

interface EditableProps {
  /** Dot-notation content path, e.g. "hero.headline" */
  path: string;
  /** HTML element to render. Defaults to "span". */
  as?: keyof HTMLElementTagNameMap;
  /** The original (default) text from the content module */
  children: ReactNode;
  /** Extra className to forward */
  className?: string;
}

export default function Editable({ path, as = 'span', children, className }: EditableProps) {
  const { editMode, overrides, setOverride } = useEditMode();
  const ref = useRef<HTMLElement>(null);

  // Resolve displayed value: override wins over original children
  const override = overrides[path];
  const displayText = override !== undefined ? override : children;

  const handleBlur = useCallback(() => {
    if (!ref.current) return;
    const newText = ref.current.innerText.trim();
    // Only save if it actually changed
    const original = typeof children === 'string' ? children : '';
    if (newText !== original) {
      setOverride(path, newText);
    }
  }, [path, children, setOverride]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Enter without Shift commits the edit (single-line feel)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ref.current?.blur();
    }
  }, []);

  // Build props for the rendered element
  const props: Record<string, unknown> = {
    ref,
    className: [
      className,
      editMode ? 'outline-dashed outline-1 outline-primary/40 hover:outline-primary/70 focus:outline-primary rounded cursor-text transition-[outline]' : '',
    ].filter(Boolean).join(' ') || undefined,
  };

  if (editMode) {
    props.contentEditable = true;
    props.suppressContentEditableWarning = true;
    props.onBlur = handleBlur;
    props.onKeyDown = handleKeyDown;
    // data attribute lets export strip contentEditable attrs
    props['data-editable'] = path;
  }

  return createElement(as, props, displayText);
}
