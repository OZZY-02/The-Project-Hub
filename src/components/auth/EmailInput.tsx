"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { getEmailSuggestions } from "../../lib/email-domains";

type EmailInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
};

export default function EmailInput({
  id,
  value,
  onChange,
  className,
  placeholder,
  autoComplete = "email",
  required,
}: EmailInputProps) {
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const suggestions = getEmailSuggestions(value);
  const showSuggestions = open && suggestions.length > 0 && value.includes("@");

  useEffect(() => {
    setActiveIndex(0);
  }, [value]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const pickSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        id={id}
        required={required}
        type="email"
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (e.target.value.includes("@")) setOpen(true);
        }}
        onFocus={() => {
          if (value.includes("@")) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!showSuggestions) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % suggestions.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
          } else if (e.key === "Enter" && showSuggestions) {
            e.preventDefault();
            pickSuggestion(suggestions[activeIndex]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        aria-autocomplete="list"
        aria-controls={showSuggestions ? listId : undefined}
        aria-expanded={showSuggestions}
        className={className}
      />

      {showSuggestions && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#0a1528]"
        >
          {suggestions.map((suggestion, index) => (
            <li key={suggestion} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickSuggestion(suggestion)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                  index === activeIndex
                    ? "bg-[#2258d1]/10 text-[#2258d1] dark:bg-[#8fb7ff]/10 dark:text-[#8fb7ff]"
                    : "text-slate-700 hover:bg-slate-50 dark:text-[#d8e4ff] dark:hover:bg-white/5"
                }`}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
