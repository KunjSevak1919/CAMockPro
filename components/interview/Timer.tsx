"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  initialSeconds: number;
  onExpire: () => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Timer({ initialSeconds, onExpire }: Props) {
  const [remaining, setRemaining] = useState(initialSeconds);
  // Keep a stable ref to onExpire so interval closure never goes stale
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Single interval on mount — counts down to 0
  useEffect(() => {
    if (initialSeconds <= 0) {
      onExpireRef.current();
      return;
    }
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fire onExpire when counter hits 0
  useEffect(() => {
    if (remaining === 0) onExpireRef.current();
  }, [remaining]);

  const colorClass =
    remaining > 60
      ? "text-gray-600"
      : remaining > 30
      ? "text-orange-500"
      : "text-red-500 animate-pulse";

  return (
    <span
      className={cn(
        "text-2xl font-mono font-bold tabular-nums tracking-tight",
        colorClass
      )}
      aria-live="polite"
      aria-label={`${formatTime(remaining)} remaining`}
    >
      {formatTime(remaining)}
    </span>
  );
}
