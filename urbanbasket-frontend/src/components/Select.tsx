import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
  size?: 'md' | 'sm';
  id?: string;
}

export function optionsFrom(values: readonly string[]): SelectOption[] {
  return values.map((value) => ({ value, label: value }));
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  required = false,
  disabled = false,
  style,
  size = 'md',
  id,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = value === '' ? undefined : options.find((option) => option.value === value);
  const label = selected?.label ?? placeholder;

  const close = () => setOpen(false);

  const choose = (next: string) => {
    onChange(next);
    close();
    triggerRef.current?.focus();
  };

  const move = (delta: number) => {
    if (options.length === 0) return;
    setActive((current) => (current + delta + options.length) % options.length);
  };

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !menuRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const menu = menuRef.current;
    const gap = 6;
    const menuHeight = menu.offsetHeight;
    const spaceBelow = window.innerHeight - trigger.bottom - gap;
    const top = spaceBelow >= menuHeight || trigger.top < menuHeight
      ? trigger.bottom + gap
      : Math.max(8, trigger.top - menuHeight - gap);
    const left = Math.min(Math.max(8, trigger.left), window.innerWidth - menu.offsetWidth - 8);
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
    menu.style.minWidth = `${trigger.width}px`;
  }, [open, options.length, active]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    };
    const onScroll = (event: Event) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      close();
    };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const openMenu = () => {
    if (disabled) return;
    const current = options.findIndex((option) => option.value === value);
    setActive(current >= 0 ? current : 0);
    setOpen(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) openMenu();
      else move(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) openMenu();
      else if (options[active]) choose(options[active].value);
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      close();
    } else if (event.key === 'Home' && open) {
      event.preventDefault();
      setActive(0);
    } else if (event.key === 'End' && open) {
      event.preventDefault();
      setActive(options.length - 1);
    }
  };

  const menu = open ? (
    <div
      ref={menuRef}
      id={listId}
      className="select-menu"
      role="listbox"
      aria-labelledby={id}
    >
      {options.length === 0 ? (
        <div className="select-empty">No options</div>
      ) : options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <button
            key={`${option.value}-${option.label}`}
            type="button"
            role="option"
            aria-selected={isSelected}
            data-active={index === active}
            className={`select-option${isSelected ? ' selected' : ''}${index === active ? ' active' : ''}`}
            onMouseEnter={() => setActive(index)}
            onClick={() => choose(option.value)}
          >
            <span>{option.label}</span>
            {isSelected && <Check size={14} className="select-check" />}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div
      ref={rootRef}
      className={`select${size === 'sm' ? ' select-sm' : ''}`}
      style={style}
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`select-trigger${open ? ' open' : ''}${selected ? '' : ' is-placeholder'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span className="select-value">{label}</span>
        <ChevronDown size={size === 'sm' ? 14 : 16} className="select-chevron" />
      </button>
      {required && (
        <input
          className="select-native-validator"
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value}
          onChange={() => {}}
        />
      )}
      {menu && createPortal(menu, document.body)}
    </div>
  );
}
