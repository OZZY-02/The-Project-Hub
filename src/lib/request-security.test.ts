import test from "node:test";
import assert from "node:assert/strict";

import { escapeHtml, isSafeRemoteUrl } from "./request-security.ts";

test("isSafeRemoteUrl accepts standard https URLs", () => {
  assert.equal(isSafeRemoteUrl("https://example.com/resume.pdf"), true);
});

test("isSafeRemoteUrl rejects localhost and private addresses", () => {
  assert.equal(isSafeRemoteUrl("http://localhost:3000/file.pdf"), false);
  assert.equal(isSafeRemoteUrl("http://127.0.0.1/file.pdf"), false);
  assert.equal(isSafeRemoteUrl("http://192.168.1.20/file.pdf"), false);
  assert.equal(isSafeRemoteUrl("http://[::1]/file.pdf"), false);
});

test("isSafeRemoteUrl rejects unsupported protocols", () => {
  assert.equal(isSafeRemoteUrl("file:///tmp/resume.pdf"), false);
  assert.equal(isSafeRemoteUrl("javascript:alert(1)"), false);
});

test("escapeHtml encodes unsafe characters", () => {
  assert.equal(
    escapeHtml(`A&B <script>alert("x")</script>`),
    "A&amp;B &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
  );
});
