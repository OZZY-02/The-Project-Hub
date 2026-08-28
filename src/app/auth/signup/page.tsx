"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Globe,
  Users,
  Zap,
} from "lucide-react";

import supabase from "../../../lib/supabaseClient";
import { useTranslation } from "../../../lib/i18n";
import { useTheme } from "../../../lib/theme";
import EmailInput from "../../../components/auth/EmailInput";
import UsernameInput from "../../../components/auth/UsernameInput";
import {
  isValidUsername,
  isUsernameAvailable,
  normalizeUsername,
} from "../../../lib/username";

export default function SignupPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { theme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "text-right" : "text-left";
  const isLight = theme === "light";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const uname = normalizeUsername(username);
      const normalizedEmail = email.trim().toLowerCase();

      if (!isValidUsername(uname)) {
        setMessage(
          !uname || uname.length < 3 || uname.length > 30
            ? t(
                "auth.username_length_error",
                "Username must be 3–30 characters long."
              )
            : t(
                "auth.username_charset_error",
                "Username may only contain letters, numbers, dot, underscore and hyphen."
              )
        );

        setIsError(true);
        return;
      }

      if (!normalizedEmail) {
        setMessage(
          t("auth.email_required", "Please enter your email address.")
        );
        setIsError(true);
        return;
      }

      if (password.length < 8) {
        setMessage(
          t(
            "auth.password_length_error",
            "Password must be at least 8 characters long."
          )
        );
        setIsError(true);
        return;
      }

      if (usernameAvailable === false) {
        setMessage(
          t(
            "auth.username_taken_error",
            "Username already taken. Please choose another."
          )
        );
        setIsError(true);
        return;
      }

      try {
        const available = await isUsernameAvailable(uname);

        if (!available) {
          setMessage(
            t(
              "auth.username_taken_error",
              "Username already taken. Please choose another."
            )
          );
          setIsError(true);
          return;
        }
      } catch (err) {
        console.error("Username availability check failed:", err);

        setMessage(
          err instanceof Error
            ? `Could not check username availability: ${err.message}`
            : t(
                "auth.username_check_error",
                "Could not check username availability."
              )
        );

        setIsError(true);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            username: uname,
          },
        },
      });

      if (error) {
        console.error("Supabase signup error:", error);

        if (
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("already exists")
        ) {
          setMessage(
            t(
              "auth.email_taken_error",
              "An account with this email already exists."
            )
          );
        } else {
          setMessage(error.message);
        }

        setIsError(true);
        return;
      }

      if (!data.user) {
        setMessage(
          t(
            "auth.signup_error",
            "Account creation failed. Please try again."
          )
        );
        setIsError(true);
        return;
      }

      if (!data.session) {
        setMessage(
          t(
            "auth.signup_success",
            "Account created! Check your email to confirm your account."
          )
        );
        setIsError(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error("Unexpected signup error:", err);

      setMessage(
        err instanceof Error
          ? `Signup failed: ${err.message}`
          : t(
              "auth.signup_error",
              "An error occurred during signup."
            )
      );

      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const shellClass = isLight
    ? "home-shell home-shell-light min-h-screen text-slate-950"
    : "home-shell home-shell-dark min-h-screen text-[#f5f7fb]";

  const titleClass = isLight ? "text-slate-950" : "text-white";

  const secondaryTextClass = isLight
    ? "text-slate-600"
    : "text-[#9eabc4]";

  const cardClass = isLight
    ? "rounded-3xl border border-slate-900/8 bg-white/90 p-8 shadow-[0_22px_70px_-52px_rgba(15,23,42,0.18)] backdrop-blur-xl"
    : "rounded-3xl border border-white/8 bg-white/[0.04] p-8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl";

  const inputClass = isLight
    ? "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:border-[#2258d1] focus:outline-none"
    : "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f5f7fb] placeholder:text-[#6f7e9d] transition-colors duration-150 focus:border-[#8fb7ff] focus:outline-none";

  const primaryBtnClass = isLight
    ? "inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:opacity-60"
    : "inline-flex w-full items-center justify-center rounded-full bg-[#2258d1] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1a46ab] disabled:translate-y-0 disabled:opacity-60";

  const featureCardClass = isLight
    ? "rounded-2xl border border-slate-900/8 bg-white/70 p-5"
    : "rounded-2xl border border-white/8 bg-white/[0.04] p-5";

  const accentClass = isLight ? "text-[#2258d1]" : "text-[#8fb7ff]";

  const highlights = [
    {
      icon: <BadgeCheck size={20} />,
      title: t("auth.signup_highlight_title_1", "AI-powered portfolio"),
      body: t(
        "auth.signup_highlight_1",
        "Your profile becomes a living portfolio — auto-arranged by skills, projects, and impact."
      ),
    },
    {
      icon: <Users size={20} />,
      title: t(
        "auth.signup_highlight_title_2",
        "Local + diaspora network"
      ),
      body: t(
        "auth.signup_highlight_2",
        "Connect with Sudanese talent in your area and across the world."
      ),
    },
    {
      icon: <Globe size={20} />,
      title: t("auth.signup_highlight_title_3", "Arabic & English"),
      body: t(
        "auth.signup_highlight_3",
        "Fully bilingual — use the platform in whichever language feels natural."
      ),
    },
    {
      icon: <Zap size={20} />,
      title: t(
        "auth.signup_highlight_title_4",
        "Mentorship & sponsors"
      ),
      body: t(
        "auth.signup_highlight_4",
        "Get matched with mentors, resume reviewers, and company sponsors."
      ),
    },
  ];

  return (
    <div dir={dir} className={shellClass}>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 sm:px-8 lg:flex-row lg:items-start lg:gap-16">
        <section className={`flex-1 ${align}`}>
          <p className="section-kicker">
            {t("auth.kicker", "The Project Hub")}
          </p>

          <h1
            className={`font-display mt-4 text-4xl leading-tight sm:text-5xl ${titleClass}`}
          >
            {t("auth.signup_title", "Join the makers collective")}
          </h1>

          <p className={`mt-5 text-lg leading-8 ${secondaryTextClass}`}>
            {t(
              "auth.signup_subtitle",
              "Build your profile, showcase your work, and get discovered by teams, mentors, and sponsors — free while we are in early access."
            )}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {highlights.map((highlight) => (
              <div key={highlight.title} className={featureCardClass}>
                <span className={accentClass}>{highlight.icon}</span>

                <p className={`mt-3 text-sm font-semibold ${titleClass}`}>
                  {highlight.title}
                </p>

                <p
                  className={`mt-1 text-sm leading-relaxed ${secondaryTextClass}`}
                >
                  {highlight.body}
                </p>
              </div>
            ))}
          </div>

          <p className={`mt-8 text-sm ${secondaryTextClass}`}>
            {t(
              "auth.already_have_account_prefix",
              "Already a maker?"
            )}{" "}
            <Link
              href="/auth/signin"
              className={`font-semibold underline underline-offset-2 transition-colors duration-150 ${
                isLight
                  ? "text-slate-950 hover:text-slate-700"
                  : "text-white hover:text-[#dfe8ff]"
              }`}
            >
              {t("auth.signin_link", "Sign in instead")}
            </Link>
          </p>
        </section>

        <section className="flex-1">
          <div className={cardClass}>
            <div className={align}>
              <h2 className={`text-2xl font-semibold ${titleClass}`}>
                {t("auth.signup_header", "Create your account")}
              </h2>

              <p className={`mt-2 text-sm ${secondaryTextClass}`}>
                {t(
                  "auth.signup_helper",
                  "Your username becomes your public profile URL."
                )}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="signup-username"
                  className={`block text-sm font-medium ${
                    isLight ? "text-slate-700" : "text-[#c8d4e8]"
                  }`}
                >
                  {t("auth.username_label", "Username")}
                </label>

                <UsernameInput
                  id="signup-username"
                  value={username}
                  onChange={setUsername}
                  onAvailabilityChange={setUsernameAvailable}
                  className={`mt-2 ${inputClass}`}
                  hintClassName={`mt-1.5 text-xs ${
                    isLight ? "text-slate-400" : "text-[#6f7e9d]"
                  }`}
                />
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className={`block text-sm font-medium ${
                    isLight ? "text-slate-700" : "text-[#c8d4e8]"
                  }`}
                >
                  {t("auth.email_label", "Email address")}
                </label>

                <EmailInput
                  id="signup-email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={setEmail}
                  className={`mt-2 ${inputClass}`}
                />
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className={`block text-sm font-medium ${
                    isLight ? "text-slate-700" : "text-[#c8d4e8]"
                  }`}
                >
                  {t("auth.password_label", "Password")}
                </label>

                <div className="relative mt-2">
                  <input
                    id="signup-password"
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pe-20`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className={`absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold transition-colors duration-150 ${
                      isLight
                        ? "text-slate-500 hover:text-slate-800"
                        : "text-[#8fb7ff] hover:text-[#c8d4e8]"
                    }`}
                  >
                    {showPassword
                      ? t("auth.hide_password", "Hide")
                      : t("auth.show_password", "Show")}
                  </button>
                </div>
              </div>

              {message && (
                <p
                  role={isError ? "alert" : "status"}
                  className={`rounded-xl px-4 py-3 text-sm ${
                    isError
                      ? isLight
                        ? "bg-red-50 text-red-700"
                        : "bg-[#2a1916] text-[#f0a37f]"
                      : isLight
                      ? "bg-green-50 text-green-700"
                      : "bg-[#0f2a1c] text-[#b9e7c9]"
                  }`}
                >
                  {message}
                </p>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading || usernameAvailable === false}
                  className={primaryBtnClass}
                >
                  {loading ? (
                    t("auth.signing_up", "Creating account…")
                  ) : (
                    <>
                      {t("auth.signup_button", "Join the Hub")}
                      <ArrowRight
                        size={16}
                        className="ms-2 rtl:rotate-180"
                        aria-hidden="true"
                      />
                    </>
                  )}
                </button>

                <p
                  className={`mt-3 text-center text-xs ${
                    isLight ? "text-slate-400" : "text-[#6f7e9d]"
                  }`}
                >
                  {t(
                    "auth.terms_note",
                    "By joining you agree to our"
                  )}{" "}
                  <Link
                    href="#"
                    className={`underline underline-offset-2 transition-colors duration-150 ${
                      isLight
                        ? "hover:text-slate-700"
                        : "hover:text-[#9eabc4]"
                    }`}
                  >
                    {t("auth.terms", "Terms")}
                  </Link>{" "}
                  &amp;{" "}
                  <Link
                    href="#"
                    className={`underline underline-offset-2 transition-colors duration-150 ${
                      isLight
                        ? "hover:text-slate-700"
                        : "hover:text-[#9eabc4]"
                    }`}
                  >
                    {t("auth.privacy", "Privacy Policy")}
                  </Link>
                  .
                </p>
              </div>
            </form>

            <div
              className={`mt-6 border-t pt-5 text-center text-sm ${
                isLight
                  ? "border-slate-100 text-slate-500"
                  : "border-white/8 text-[#6f7e9d]"
              }`}
            >
              <Link
                href="/"
                className={`transition-colors duration-150 ${
                  isLight ? "hover:text-slate-800" : "hover:text-white"
                }`}
              >
                ← {t("auth.back_home", "Back to home")}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}