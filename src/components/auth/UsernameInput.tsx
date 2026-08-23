"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "../../lib/i18n";
import {
  isValidUsername,
  isUsernameAvailable,
  normalizeUsername,
  suggestUsernames,
} from "../../lib/username";

type UsernameInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onAvailabilityChange?: (available: boolean | null) => void;
  className?: string;
  hintClassName?: string;
  excludeUserId?: string | null;
};

export default function UsernameInput({
  id,
  value,
  onChange,
  onAvailabilityChange,
  className,
  hintClassName,
  excludeUserId,
}: UsernameInputProps) {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const uname = normalizeUsername(value);
    if (!uname) {
      setAvailable(null);
      setSuggestions([]);
      setShowPopup(false);
        onAvailabilityChange?.(null);
      return;
    }

    if (!isValidUsername(uname)) {
      setAvailable(null);
      setSuggestions([]);
      setShowPopup(false);
      onAvailabilityChange?.(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setChecking(true);
      const notify = onAvailabilityChange;
      try {
        const isFree = await isUsernameAvailable(uname, excludeUserId);
        setAvailable(isFree);
        notify?.(isFree);
        if (!isFree) {
          setSuggestions(suggestUsernames(uname));
          setShowPopup(true);
        } else {
          setSuggestions([]);
          setShowPopup(false);
        }
      } catch {
        setAvailable(null);
        notify?.(null);
      } finally {
        setChecking(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, excludeUserId]);

  const borderTone =
    available === true
      ? "border-green-400 focus:border-green-500"
      : available === false
        ? "border-red-400 focus:border-red-500"
        : "";

  return (
    <div className="relative">
      <input
        id={id}
        required
        type="text"
        autoComplete="username"
        placeholder="e.g. ahmed_maker"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${className} ${borderTone}`.trim()}
        aria-invalid={available === false}
        aria-describedby={`${id}-hint`}
      />

      <p id={`${id}-hint`} className={hintClassName}>
        {checking
          ? t("auth.username_checking", "Checking availability…")
          : available === true
            ? t("auth.username_available", "Username is available.")
            : t("auth.username_hint", "3–30 chars: letters, numbers, dots, underscores, hyphens.")}
      </p>

      {showPopup && available === false && suggestions.length > 0 && (
        <div
          role="dialog"
          aria-live="polite"
          className="absolute z-30 mt-2 w-full rounded-2xl border border-red-200 bg-white p-4 shadow-xl dark:border-red-500/25 dark:bg-[#0f1a2e]"
        >
          <p className="text-sm font-semibold text-red-700 dark:text-[#f0a37f]">
            {t("auth.username_taken_error", "Username already taken. Please choose another.")}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-[#9eabc4]">
            {t("auth.username_suggestions", "Try one of these:")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  onChange(suggestion);
                  setShowPopup(false);
                }}
                className="rounded-full border border-[#2258d1]/20 bg-[#2258d1]/5 px-3 py-1.5 text-xs font-semibold text-[#2258d1] transition-colors hover:bg-[#2258d1]/10 dark:border-[#8fb7ff]/25 dark:bg-[#8fb7ff]/10 dark:text-[#8fb7ff]"
              >
                @{suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
