import test from "node:test";
import assert from "node:assert/strict";
import { isValidHttpsImageUrl } from "../lib/api.ts";

test("external event images accept valid HTTPS URLs", () => {
  assert.equal(isValidHttpsImageUrl("https://images.example.test/event.jpg"), true);
  assert.equal(isValidHttpsImageUrl(" https://cdn.example.test/path/image.webp "), true);
});

test("external event images reject insecure and credential-bearing URLs", () => {
  assert.equal(isValidHttpsImageUrl("http://images.example.test/event.jpg"), false);
  assert.equal(isValidHttpsImageUrl("https://user:pass@images.example.test/event.jpg"), false);
  assert.equal(isValidHttpsImageUrl("javascript:alert(1)"), false);
  assert.equal(isValidHttpsImageUrl("not a URL"), false);
});
