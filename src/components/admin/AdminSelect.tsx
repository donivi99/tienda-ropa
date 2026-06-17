import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface AdminSelectOption {
  value: string;
  label: string;
  /** Clases del trigger en variant="status" */
  toneClass?: string;
  /** Punto de color en el panel desplegable */
  dotClass?: string;
}

interface AdminSelectProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  placeholder?: string;
  variant?: 'default' | 'status';
  size?: 'default' | 'compact';
  className?: string;
  disabled?: boolean;
}

/** Paleta boutique — negro cálido, crema, dorado */
const PALETTE = {
  label: 'text-[#a89a82]',
  placeholder: 'text-[#8a7d6a]',
  trigger: {
    base: 'border-[#3d3529] bg-[#1a1714] text-[#f5e6c8] hover:border-[#d4af37]/35',
    open: 'border-[#d4af37]/55 bg-[#1e1b18] ring-1 ring-[#d4af37]/20',
    focus: 'focus:ring-2 focus:ring-[#d4af37]/40 focus:border-[#d4af37]/50',
  },
  panel: {
    shell:
      'border-[#d4af37]/25 bg-[#1a1714] shadow-[0_20px_56px_rgba(0,0,0,0.65),0_0_0_1px_rgba(212,175,55,0.06)]',
    item: 'text-[#f5e6c8]',
    itemHover: 'bg-[#d4af37]/10',
    itemSelected: 'bg-[#d4af37]/14 font-medium',
    check: 'text-[#d4af37]',
  },
  chevron: 'text-[#c9a432]',
} as const;

const CHEVRON = (
  <svg className={`h-4 w-4 shrink-0 ${PALETTE.chevron}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export function AdminSelect({
  id: idProp,
  label,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar…',
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
}: AdminSelectProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const labelId = `${id}-label`;
  const listboxId = `${id}-listbox`;

  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;

  const estimatePanelHeight = useCallback(() => {
    return Math.min(options.length * 40 + 12, 240);
  }, [options.length]);

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const panelHeight = estimatePanelHeight();
    const gap = 6;
    const fitsBelow = rect.bottom + gap + panelHeight <= window.innerHeight;
    const top = fitsBelow
      ? rect.bottom + gap
      : Math.max(8, rect.top - panelHeight - gap);

    setPanelStyle({
      top,
      left: rect.left,
      width: rect.width,
    });
  }, [estimatePanelHeight]);

  const close = useCallback(() => {
    setOpen(false);
    setHighlightIndex(-1);
  }, []);

  const openList = useCallback(() => {
    if (disabled) return;
    updatePanelPosition();
    setOpen(true);
    const idx = options.findIndex((o) => o.value === value);
    setHighlightIndex(idx >= 0 ? idx : 0);
  }, [disabled, options, updatePanelPosition, value]);

  const selectOption = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      close();
      triggerRef.current?.focus();
    },
    [close, onChange]
  );

  useEffect(() => {
    if (!open) return;

    updatePanelPosition();

    const onScrollOrResize = () => updatePanelPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return;
      close();
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [close, open]);

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        e.preventDefault();
        if (!open) {
          openList();
        } else {
          setHighlightIndex((prev) => {
            if (e.key === 'ArrowDown') return Math.min(prev + 1, options.length - 1);
            return Math.max(prev - 1, 0);
          });
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open && highlightIndex >= 0) {
          selectOption(options[highlightIndex].value);
        } else {
          openList();
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      default:
        break;
    }
  };

  const triggerTone =
    variant === 'status' && selected?.toneClass
      ? `${selected.toneClass}${open ? ' ring-1 ring-[#d4af37]/25' : ''}`
      : `${PALETTE.trigger.base}${open ? ` ${PALETTE.trigger.open}` : ''}`;

  const triggerSize = size === 'compact' ? 'px-3 py-1.5 text-xs' : 'px-3 py-2.5 text-sm';

  const panel = open && panelStyle
    ? createPortal(
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={label ? labelId : undefined}
          className={`fixed z-[100] max-h-60 overflow-y-auto rounded-xl border py-1.5 ${PALETTE.panel.shell}`}
          style={{
            top: panelStyle.top,
            left: panelStyle.left,
            width: panelStyle.width,
          }}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightIndex;

            return (
              <li key={option.value || '__empty'} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => selectOption(option.value)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors ${PALETTE.panel.item} ${
                    isSelected
                      ? PALETTE.panel.itemSelected
                      : isHighlighted
                        ? PALETTE.panel.itemHover
                        : 'hover:bg-[#d4af37]/8'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    {variant === 'status' && option.dotClass && (
                      <span className={`h-2 w-2 shrink-0 rounded-full ${option.dotClass}`} aria-hidden />
                    )}
                    <span className="truncate">{option.label}</span>
                  </span>
                  {isSelected && (
                    <svg className={`h-4 w-4 shrink-0 ${PALETTE.panel.check}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>,
        document.body
      )
    : null;

  return (
    <div ref={rootRef} className={className}>
      {label && (
        <label id={labelId} htmlFor={id} className={`block text-xs uppercase tracking-wider mb-1.5 ${PALETTE.label}`}>
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-labelledby={label ? labelId : undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onTriggerKeyDown}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border transition-all duration-150 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${PALETTE.trigger.focus} ${triggerSize} ${triggerTone}`}
      >
        <span className={`truncate ${!selected ? PALETTE.placeholder : ''}`}>{displayLabel}</span>
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>{CHEVRON}</span>
      </button>
      {panel}
    </div>
  );
}

/** Tonos cálidos para trigger de estado (menos saturados que azul/verde puro) */
export const ORDER_STATUS_TONES: Record<string, string> = {
  pendiente_pago: 'border-[#a89a82]/40 bg-[#2a2520] text-[#c9bfb0]',
  pagado: 'border-[#d4af37]/45 bg-[#d4af37]/14 text-[#e8c96a]',
  enviado: 'border-[#6a9fb5]/40 bg-[#4a7080]/20 text-[#9ec4d4]',
  entregado: 'border-[#6b9e7a]/40 bg-[#4a7058]/20 text-[#a8d4b4]',
  cancelado: 'border-[#b87a7a]/40 bg-[#704848]/20 text-[#d4a8a8]',
  pago_fallido: 'border-[#b87a7a]/40 bg-[#704848]/20 text-[#d4a8a8]',
  reembolsado: 'border-[#b87a7a]/40 bg-[#704848]/20 text-[#d4a8a8]',
  reembolso_pendiente: 'border-[#c9a227]/40 bg-[#705820]/20 text-[#e8c96a]',
};

export const ORDER_STATUS_DOTS: Record<string, string> = {
  pendiente_pago: 'bg-[#8a7d6a]',
  pagado: 'bg-[#d4af37]',
  enviado: 'bg-[#7eb8c9]',
  entregado: 'bg-[#7aad88]',
  cancelado: 'bg-[#c98888]',
  pago_fallido: 'bg-[#c98888]',
  reembolsado: 'bg-[#c98888]',
  reembolso_pendiente: 'bg-[#c9a227]',
  '': 'bg-[#8a7d6a]',
};

const NEUTRAL_TONE = 'border-[#3d3529] bg-[#1a1714] text-[#f5e6c8]';

export function orderStatusOptions(
  labels: { value: string; label: string }[],
  includeAll?: { label: string }
): AdminSelectOption[] {
  const opts = labels.map((o) => ({
    ...o,
    toneClass: ORDER_STATUS_TONES[o.value] ?? NEUTRAL_TONE,
    dotClass: ORDER_STATUS_DOTS[o.value] ?? ORDER_STATUS_DOTS[''],
  }));

  if (includeAll) {
    return [
      {
        value: '',
        label: includeAll.label,
        toneClass: NEUTRAL_TONE,
        dotClass: ORDER_STATUS_DOTS[''],
      },
      ...opts,
    ];
  }

  return opts;
}
