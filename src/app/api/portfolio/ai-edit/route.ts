import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type PatchRequest = {
  prompt?: string;
  target?: "projects" | "skills" | "resume";
  path?: string;
  patch?: Patch;
};

type Patch = {
  target: "projects" | "skills" | "resume";
  changes: Array<{ path: string; value: JsonValue }>;
};

const openAiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY;

const forbiddenPattern = /<|>|script|<\/|javascript:/i;

const normalizePath = (path: string) => path.replace(/\[(\d+)\]/g, ".$1").trim();

const getValueAtPath = (obj: JsonValue, path: string): JsonValue | undefined => {
  const parts = normalizePath(path).split(".").filter(Boolean);
  let cur: JsonValue | undefined = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    const key = /^[0-9]+$/.test(p) ? Number(p) : p;
    if (Array.isArray(cur)) {
      if (typeof key !== "number" || !(key in cur)) return undefined;
      cur = cur[key];
      continue;
    }
    if (typeof cur !== "object" || !(key in cur)) return undefined;
    cur = cur[key as keyof typeof cur];
  }
  return cur;
};

const setValueAtPath = (obj: JsonValue, path: string, value: JsonValue) => {
  const parts = normalizePath(path).split(".").filter(Boolean);
  let cur: JsonValue = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const raw = parts[i];
    const key = /^[0-9]+$/.test(raw) ? Number(raw) : raw;
    if (Array.isArray(cur)) {
      if (typeof key !== "number" || !(key in cur)) return false;
      cur = cur[key];
      continue;
    }
    if (typeof cur !== "object" || cur === null || !(key in cur)) return false;
    cur = cur[key as keyof typeof cur];
  }
  const last = parts[parts.length - 1];
  const lastKey = /^[0-9]+$/.test(last) ? Number(last) : last;
  if (Array.isArray(cur)) {
    if (typeof lastKey !== "number" || !(lastKey in cur)) return false;
    cur[lastKey] = value;
    return true;
  }
  if (typeof cur !== "object" || cur === null || !(lastKey in cur)) return false;
  cur[lastKey as keyof typeof cur] = value;
  return true;
};

const resolvePath = (target: Patch["target"], path: string) => {
  const trimmed = path.trim();
  if (target === "resume") {
    const raw = trimmed.startsWith("resume.") ? trimmed.slice(7) : trimmed;
    const allowed = [
      "summary",
      "certifications",
      "languages",
      "college",
      "major",
      "degree_level",
      "resumeFileName",
      "resumeDataUrl",
      "resume_url",
    ];
    if (!allowed.some((key) => raw === key || raw.startsWith(`${key}.`))) return null;
    return raw;
  }
  if (target === "projects" && !trimmed.startsWith("projects")) return null;
  if (target === "skills" && !trimmed.startsWith("skills")) return null;
  return trimmed;
};

const validatePatch = (patch: Patch, intake: JsonValue) => {
  if (!patch || !patch.target || !Array.isArray(patch.changes)) return "Invalid patch format.";
  for (const change of patch.changes) {
    if (!change || typeof change.path !== "string") return "Invalid patch path.";
    const resolved = resolvePath(patch.target, change.path);
    if (!resolved) return "Patch path not allowed.";
    change.path = resolved;
    const existing = getValueAtPath(intake, resolved);
    if (typeof existing === "undefined") return "Patch path does not exist.";
    if (typeof existing !== typeof change.value) return "Type mismatch in patch.";
    if (typeof change.value === "string") {
      if (change.value.length > 800) return "Patch value too long.";
      if (forbiddenPattern.test(change.value)) return "Disallowed content in patch.";
    }
  }
  return null;
};

const applyPatch = (patch: Patch, intake: JsonValue): JsonValue => {
  const next = JSON.parse(JSON.stringify(intake)) as JsonValue;
  for (const change of patch.changes) {
    setValueAtPath(next, change.path, change.value);
  }
  return next;
};

type AiResponse = {
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
};

export async function POST(request: Request) {
  try {
    const { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey } =
      requireEnv(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]);
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data: userData } = await supabase.auth.getUser(token);
    const authUser = userData?.user || null;
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as PatchRequest;
    if (!body?.patch && (!body?.prompt || !body?.target || !body?.path)) {
      return NextResponse.json({ error: "Missing prompt/target/path or patch." }, { status: 400 });
    }

    const { data: rows } = await supabase
      .from("profile_intakes")
      .select("id, data")
      .eq("user_id", authUser.id)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "No intake data found." }, { status: 404 });
    }

    const intake = (rows[0].data || {}) as JsonValue;

    if (body.patch) {
      const patch = body.patch;
      const err = validatePatch(patch, intake);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const next = applyPatch(patch, intake);
      const { error: upsertError } = await supabase
        .from("profile_intakes")
        .update({ data: next })
        .eq("id", rows[0].id);
      if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: next });
    }

    if (!openAiKey) {
      return NextResponse.json({ error: "AI not configured." }, { status: 501 });
    }

    const schema = {
      name: "portfolio_patch",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          target: { type: "string", enum: ["projects", "skills", "resume"] },
          changes: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                path: { type: "string" },
                value: {},
              },
              required: ["path", "value"],
            },
          },
        },
        required: ["target", "changes"],
      },
    };

    const system = [
      "You are an AI assistant that outputs ONLY JSON.",
      "Return a patch that edits existing fields only.",
      "No HTML, no scripts, no new keys, preserve types.",
      "Use concise professional language.",
    ].join(" ");

    const userPrompt = [
      "Create a JSON patch for portfolio content.",
      `Target: ${body.target}`,
      `Path hint: ${body.path}`,
      `Prompt: ${body.prompt}`,
      "Existing intake JSON:",
      JSON.stringify(intake),
      "Remember: output JSON only.",
    ].join("\n");

    const aiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-2024-07-18",
        input: [
          { role: "system", content: [{ type: "text", text: system }] },
          { role: "user", content: [{ type: "text", text: userPrompt }] },
        ],
        text: {
          format: {
            type: "json_schema",
            json_schema: schema,
          },
        },
        max_output_tokens: 800,
      }),
    });

    if (!aiRes.ok) {
      const msg = await aiRes.text();
      return NextResponse.json({ error: msg || "AI request failed." }, { status: 500 });
    }

    const aiJson = (await aiRes.json()) as AiResponse;
    const content = aiJson?.output?.[0]?.content?.[0]?.text;
    if (!content) return NextResponse.json({ error: "AI returned empty output." }, { status: 500 });

    let patch: Patch;
    try {
      patch = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: "AI output was not valid JSON." }, { status: 500 });
    }

    const err = validatePatch(patch, intake);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    const next = applyPatch(patch, intake);
    const { error: upsertError } = await supabase
      .from("profile_intakes")
      .update({ data: next })
      .eq("id", rows[0].id);
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: next, patch });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error." },
      { status: 500 }
    );
  }
}
