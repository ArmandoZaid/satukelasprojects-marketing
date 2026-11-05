import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dockerfile = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");

test("runs with the declared non-root user and group", () => {
  assert.match(dockerfile, /^USER nextjs:nodejs$/m);
});

test("includes PostgreSQL migration and bootstrap assets in the runtime image", () => {
  assert.match(dockerfile, /migrations/);
  assert.match(dockerfile, /db-migrate\.mjs/);
  assert.match(dockerfile, /db-bootstrap\.mjs/);
  assert.match(dockerfile, /src\/lib\/db\/config\.mjs/);
});
