import test from "node:test";
import assert from "node:assert/strict";

import { createMissingSupabaseEnvError, hasSupabaseEnv, missingEnvKeys, requireEnv } from "./env.ts";

test("missingEnvKeys returns absent variables", () => {
  assert.deepEqual(
    missingEnvKeys(["A", "B", "C"], { A: "1", B: undefined, C: "" }),
    ["B", "C"]
  );
});

test("requireEnv returns selected values", () => {
  assert.deepEqual(requireEnv(["A", "B"], { A: "1", B: "2" }), { A: "1", B: "2" });
});

test("requireEnv throws a helpful error when values are missing", () => {
  assert.throws(() => requireEnv(["A", "B"], { A: "1" }), /Missing required environment variables: B/);
});

test("hasSupabaseEnv checks both required public variables", () => {
  assert.equal(hasSupabaseEnv({ NEXT_PUBLIC_SUPABASE_URL: "x" }), false);
  assert.equal(
    hasSupabaseEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    }),
    true
  );
});

test("createMissingSupabaseEnvError points developers to .env.local", () => {
  assert.match(
    createMissingSupabaseEnvError({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" }).message,
    /NEXT_PUBLIC_SUPABASE_ANON_KEY/
  );
});
