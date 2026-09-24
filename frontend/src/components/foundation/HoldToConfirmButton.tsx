import React, { useState, useRef, useEffect, useCallback } from "react";
import { AlertOctagon, Check } from "lucide-react";

export interface HoldToConfirmButtonProps {
  onConfirm: () => void;
  holdDurationMs?: number;
  label: string;
  confirmingLabel?: string;
  confirmedLabel?: string;
  variant?: "danger" | "warning" | "primary";
  className?: string;
  disabled?: boolean;
}

/**
 * Industrial Hold-to-Confirm Emergency Action Primitive
 * Prevents accidental execution of high-impact crisis mitigations
 * (e.g. generator shedding, emergency electrical transfers) without
 * introducing cognitive panic or multi-step modal dialogs.
 * 
 * Supports:
 * - 1.5s continuous physical pointer press (mouse or touch)
 * - 1.5s keyboard hold via Spacebar / Enter
 * - Gloved field ergonomics (minimum 48px interactive target)
 * - High-contrast visual progress ring/bar
 */
export function HoldToConfirmButton({
  onConfirm,
  holdDurationMs = 1500,
  label,
  confirmingLabel = "HOLDING...",
  confirmedLabel = "CONFIRMED & DISPATCHED",
  variant = "danger",
  className = "",
  disabled = false,
}: HoldToConfirmButtonProps) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const completeHold = useCallback(() => {
    setIsHolding(false);
    setProgress(100);
    setIsConfirmed(true);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    onConfirm();

    // Reset confirmed state after 2.5s
    setTimeout(() => {
      setIsConfirmed(false);
      setProgress(0);
    }, 2500);
  }, [onConfirm]);

  const updateProgress = useCallback(() => {
    if (!startTimeRef.current) return;
    const elapsed = performance.now() - startTimeRef.current;
    const currentProgress = Math.min((elapsed / holdDurationMs) * 100, 100);
    setProgress(currentProgress);

    if (currentProgress >= 100) {
      completeHold();
    } else {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [holdDurationMs, completeHold]);

  const startHold = () => {
    if (disabled || isConfirmed) return;
    setIsHolding(true);
    startTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const cancelHold = () => {
    if (isConfirmed) return;
    setIsHolding(false);
    startTimeRef.current = null;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const variantStyles = {
    danger: {
      base: "bg-red-950/70 text-red-200 border-red-700/80 hover:bg-red-900/80 hover:border-red-600 focus-visible:ring-red-500",
      fill: "bg-red-600",
      border: "border-red-600",
      confirmed: "bg-emerald-950 text-emerald-200 border-emerald-600",
    },
    warning: {
      base: "bg-amber-950/70 text-amber-200 border-amber-700/80 hover:bg-amber-900/80 hover:border-amber-600 focus-visible:ring-amber-500",
      fill: "bg-amber-600",
      border: "border-amber-600",
      confirmed: "bg-emerald-950 text-emerald-200 border-emerald-600",
    },
    primary: {
      base: "bg-sky-950/70 text-sky-200 border-sky-700/80 hover:bg-sky-900/80 hover:border-sky-600 focus-visible:ring-sky-500",
      fill: "bg-sky-600",
      border: "border-sky-600",
      confirmed: "bg-emerald-950 text-emerald-200 border-emerald-600",
    },
  }[variant];

  return (
    <button
      type="button"
      disabled={disabled || isConfirmed}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          if (!isHolding) startHold();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") {
          cancelHold();
        }
      }}
      className={`relative overflow-hidden group select-none min-h-[48px] px-5 py-3 rounded border font-mono font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2.5 focus-visible:ring-2 focus-visible:outline-none ${
        isConfirmed ? variantStyles.confirmed : variantStyles.base
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"} ${className}`}
      aria-label={label}
      aria-pressed={isHolding}
    >
      {/* Visual background progress fill */}
      <span
        className={`absolute inset-0 opacity-40 transition-all ${variantStyles.fill}`}
        style={{
          width: `${progress}%`,
          transitionDuration: isHolding ? "0ms" : "200ms",
        }}
        aria-hidden="true"
      />

      {/* Button content */}
      <span className="relative z-10 flex items-center gap-2">
        {isConfirmed ? (
          <>
            <Check size={16} className="text-emerald-400 shrink-0" aria-hidden="true" />
            <span>{confirmedLabel}</span>
          </>
        ) : (
          <>
            <AlertOctagon size={16} className={`shrink-0 ${isHolding ? "animate-pulse" : ""}`} aria-hidden="true" />
            <span>{isHolding ? `${confirmingLabel} (${Math.round(progress)}%)` : label}</span>
          </>
        )}
      </span>

      {/* Ruggedized Hold Hint Indicator */}
      {!isConfirmed && !isHolding && !disabled && (
        <span className="relative z-10 text-[9px] font-normal text-muted-foreground opacity-80 pl-1">
          [HOLD 1.5S]
        </span>
      )}
    </button>
  );
}
