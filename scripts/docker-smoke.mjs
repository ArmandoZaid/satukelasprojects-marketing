import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { chromium, request } from "@playwright/test";

// Run only against the local, non-demo container with disposable credentials.
const env = parseEnv(readFileSync(".env.docker", "utf8"));
const baseURL = `http://127.0.0.1:${env.LOCAL_PORT || "3100"}`;
const api = await request.newContext({ baseURL });
let browser;
try {
  const health = await api.get("/api/health");
  assert.equal(health.status(), 200);
  assert.equal(health.headers()["cache-control"], "no-store");
  assert.deepEqual(await health.json(), { status: "ok", service: "satukelas-marketing", database: "ok" });
  for (const route of ["/", "/login"]) {
    assert.equal((await api.get(route)).status(), 200);
  }
  assert.equal((await api.get("/preview/dashboard")).status(), 404);
  assert.equal((await api.get("/api/auth/me")).status(), 401);
  assert.equal((await api.get("/api/admin/members")).status(), 401);
  const redirect = await api.get("/dashboard", { maxRedirects: 0 });
  assert.ok([302, 307].includes(redirect.status()));
  assert.ok(redirect.headers().location.includes("/login"));
  console.log("PASS liveness + PostgreSQL readiness, public routes, preview disabled, anonymous denial");

  const invalid = await api.post("/api/auth/login", {
    data: { email: env.ADMIN_EMAIL, password: "invalid-disposable-test-password" },
  });
  assert.equal(invalid.status(), 401);
  const login = await api.post("/api/auth/login", {
    data: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
  });
  assert.equal(login.status(), 200);
  assert.equal((await login.json()).user.role, "ADMIN");
  assert.match(login.headers()["set-cookie"], /HttpOnly/i);
  assert.match(login.headers()["set-cookie"], /SameSite=Lax/i);
  assert.equal((await api.get("/api/auth/me")).status(), 200);
  const initialCrm = await api.get("/api/crm");
  assert.equal(initialCrm.status(), 200);
  const initialCrmBody = await initialCrm.json();
  assert.ok(Array.isArray(initialCrmBody.opportunities));
  assert.ok(Array.isArray(initialCrmBody.activities));
  const resetDenied = await api.delete("/api/crm", { headers: { Origin: baseURL } });
  assert.equal(resetDenied.status(), 403);
  console.log("PASS invalid login, bootstrap admin login, HttpOnly session, PostgreSQL CRM 200 & global reset blocked (403)");

  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ storageState: await api.storageState() });
  const page = await context.newPage();
  const failures = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("response", (response) => {
    if (new URL(response.url()).origin === baseURL && response.url().includes("/_next/static/") && response.status() >= 400) {
      failures.push(`Static asset HTTP ${response.status()}`);
    }
  });
  for (const route of ["/dashboard", "/pipeline", "/opportunities", "/follow-ups", "/activities", "/schools", "/reports", "/members", "/settings"]) {
    const res = await page.goto(baseURL + route, { waitUntil: "networkidle" });
    assert.equal(res?.status(), 200, `Expected 200 on ${route}`);
  }
  await page.getByText(/Penyimpanan database PostgreSQL aktif/i).waitFor();
  assert.ok(await page.locator('script[src*="/_next/static/"]').count() > 0);
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  assert.deepEqual(failures, []);
  await context.close();
  console.log("PASS browser hydration/static assets, all authenticated CRM + settings + members routes render with PostgreSQL storage badge");
  const account = await api.get("/api/account");
  assert.equal(account.status(), 200);
  const accountPayload = await account.json();
  assert.equal(accountPayload.storage, "postgres");
  const originalAccount = accountPayload.account;
  assert.equal(originalAccount.email, env.ADMIN_EMAIL);
  const forged = await api.patch("/api/account", {
    headers: { Origin: "https://evil.invalid", "X-Forwarded-Host": "evil.invalid" },
    data: { title: "Must not persist" },
  });
  assert.equal(forged.status(), 403);
  assert.deepEqual((await (await api.get("/api/account")).json()).account, originalAccount);
  try {
    const update = await api.patch("/api/account", {
      headers: { Origin: baseURL }, data: { title: "Disposable Docker smoke test" },
    });
    assert.equal(update.status(), 200);
    assert.equal((await (await api.get("/api/account")).json()).account.title, "Disposable Docker smoke test");
  } finally {
    const restore = await api.patch("/api/account", {
      headers: { Origin: baseURL }, data: { title: originalAccount.title },
    });
    assert.equal(restore.status(), 200);
  }
  console.log("PASS authenticated account API (storage=postgres), same-origin mutation, forged-origin denial with unchanged state and restoration");
  assert.equal((await api.get("/api/health")).status(), 200);

  const memberPass = "SmokeMemberPass#2026";
  const secretAddress = "Jl. Rahasia Internal Smoke No. 77, Surabaya";
  const existingMembers = (await (await api.get("/api/admin/members")).json()).members;
  for (const m of existingMembers) {
    if (m.email === "smoke.persist@example.invalid") {
      await api.delete(`/api/admin/members/${m.id}`, { headers: { Origin: baseURL } });
    }
  }
  const createMemberRes = await api.post("/api/admin/members", {
    headers: { Origin: baseURL },
    data: {
      name: "Smoke Persist Member",
      email: "smoke.persist@example.invalid",
      password: memberPass,
      phone: "081234567890",
      address: secretAddress,
      title: "Spesialis Relasi Sekolah",
      isActive: true,
    },
  });
  assert.equal(createMemberRes.status(), 201);
  const createdMember = (await createMemberRes.json()).member;
  assert.equal(createdMember.address, secretAddress);

  const memberApi = await request.newContext({ baseURL });
  let createdOppId = "";
  try {
    for (const publicRoute of ["/tim/smoke-persist-member", "/m/smoke-persist-member"]) {
      const pubRes = await api.get(publicRoute);
      assert.equal(pubRes.status(), 200);
      const html = await pubRes.text();
      assert.ok(html.includes("Smoke Persist Member"));
      assert.ok(!html.includes(secretAddress), `Public route ${publicRoute} must not leak internal address`);
      assert.ok(!html.includes("scrypt$"), `Public route ${publicRoute} must not leak passwordHash`);
    }

    const memberLogin = await memberApi.post("/api/auth/login", {
      data: { email: createdMember.email, password: memberPass },
    });
    assert.equal(memberLogin.status(), 200);
    const createOppRes = await memberApi.post("/api/crm", {
      headers: { Origin: baseURL },
      data: {
        school: "SMA Negeri Smoke Persist",
        region: "Surabaya",
        service: "Photoshoot",
        period: "2026/2027",
        estimate: "45000000",
      },
    });
    assert.equal(createOppRes.status(), 201);
    const crmAfterCreate = await createOppRes.json();
    const opp = crmAfterCreate.opportunities.find((o) => o.school === "SMA Negeri Smoke Persist");
    assert.ok(opp, "Created opportunity must be returned");
    createdOppId = opp.id;

    const actRes = await memberApi.patch(`/api/crm/opportunities/${createdOppId}`, {
      headers: { Origin: baseURL },
      data: {
        action: "result",
        input: {
          summary: "Presentasi awal disetujui panitia",
          kind: "Pertemuan",
          date: "2026-01-15",
          nextAction: "Kirim draft MOU",
          due: "2026-11-12",
        },
      },
    });
    assert.equal(actRes.status(), 200);

    // Block deletion while member still owns an opportunity
    const blockedDelete = await api.delete(`/api/admin/members/${createdMember.id}`, {
      headers: { Origin: baseURL },
    });
    assert.equal(blockedDelete.status(), 409);

    // Recreate marketing-app container to prove state survives container replacement
    execFileSync(
      "docker",
      [
        "compose",
        "--env-file",
        ".env.docker",
        "-p",
        "satukelas-marketing-local",
        "-f",
        "docker-compose.yml",
        "-f",
        "docker-compose.local.yml",
        "up",
        "-d",
        "--force-recreate",
        "--wait",
        "marketing-app",
      ],
      { stdio: "ignore" },
    );

    const postRecreateCrm = await memberApi.get("/api/crm");
    assert.equal(postRecreateCrm.status(), 200);
    const postRecreateState = await postRecreateCrm.json();
    assert.ok(postRecreateState.opportunities.some((o) => o.id === createdOppId && o.nextAction === "Kirim draft MOU"));
    assert.ok(postRecreateState.activities.some((a) => a.opportunityId === createdOppId && a.summary.includes("Presentasi awal")));
    console.log("PASS member creation, public privacy check, CRM prospect+activity persistence across container --force-recreate");

    // Verify pg_dump backup and restore into a disposable database inside marketing-db
    const dumpSql = execFileSync(
      "docker",
      [
        "compose",
        "--env-file",
        ".env.docker",
        "-p",
        "satukelas-marketing-local",
        "-f",
        "docker-compose.yml",
        "exec",
        "-T",
        "marketing-db",
        "pg_dump",
        "-U",
        "marketing",
        "--clean",
        "--if-exists",
        "satukelas_marketing",
      ],
      { encoding: "utf8" },
    );
    assert.ok(dumpSql.includes("CREATE TABLE public.users"));
    assert.ok(dumpSql.includes("SMA Negeri Smoke Persist"));
    execFileSync(
      "docker",
      [
        "compose",
        "--env-file",
        ".env.docker",
        "-p",
        "satukelas-marketing-local",
        "-f",
        "docker-compose.yml",
        "exec",
        "-T",
        "marketing-db",
        "psql",
        "-U",
        "marketing",
        "-d",
        "postgres",
        "-c",
        "DROP DATABASE IF EXISTS satukelas_restore_check;",
        "-c",
        "CREATE DATABASE satukelas_restore_check;",
      ],
      { stdio: "ignore" },
    );
    try {
      execFileSync(
        "docker",
        [
          "compose",
          "--env-file",
          ".env.docker",
          "-p",
          "satukelas-marketing-local",
          "-f",
          "docker-compose.yml",
          "exec",
          "-T",
          "marketing-db",
          "psql",
          "-U",
          "marketing",
          "-d",
          "satukelas_restore_check",
        ],
        { input: dumpSql, stdio: ["pipe", "ignore", "ignore"] },
      );
      const restoredCounts = execFileSync(
        "docker",
        [
          "compose",
          "--env-file",
          ".env.docker",
          "-p",
          "satukelas-marketing-local",
          "-f",
          "docker-compose.yml",
          "exec",
          "-T",
          "marketing-db",
          "psql",
          "-U",
          "marketing",
          "-d",
          "satukelas_restore_check",
          "-tAc",
          "SELECT count(*) FROM users; SELECT count(*) FROM opportunities; SELECT count(*) FROM activities;",
        ],
        { encoding: "utf8" },
      )
        .trim()
        .split(/\r?\n/)
        .map((n) => Number(n.trim()));
      assert.deepEqual(restoredCounts, [2, 1, 1]);
      console.log("PASS pg_dump backup and psql restore verification (users=2, opportunities=1, activities=1)");
    } finally {
      execFileSync(
        "docker",
        [
          "compose",
          "--env-file",
          ".env.docker",
          "-p",
          "satukelas-marketing-local",
          "-f",
          "docker-compose.yml",
          "exec",
          "-T",
          "marketing-db",
          "psql",
          "-U",
          "marketing",
          "-d",
          "postgres",
          "-c",
          "DROP DATABASE IF EXISTS satukelas_restore_check;",
        ],
        { stdio: "ignore" },
      );
    }
  } finally {
    await memberApi.dispose();
    if (createdOppId) {
      execFileSync(
        "docker",
        [
          "compose",
          "--env-file",
          ".env.docker",
          "-p",
          "satukelas-marketing-local",
          "-f",
          "docker-compose.yml",
          "exec",
          "-T",
          "marketing-db",
          "psql",
          "-U",
          "marketing",
          "-d",
          "satukelas_marketing",
          "-c",
          `DELETE FROM activities WHERE opportunity_id = '${createdOppId}'; DELETE FROM opportunities WHERE id = '${createdOppId}';`,
        ],
        { stdio: "ignore" },
      );
    }
    const delMember = await api.delete(`/api/admin/members/${createdMember.id}`, {
      headers: { Origin: baseURL },
    });
    assert.equal(delMember.status(), 200);
  }
  console.log("PASS smoke test cleanup restored clean bootstrap state");

  assert.equal((await api.post("/api/auth/logout")).status(), 200);
  assert.equal((await api.get("/api/auth/me")).status(), 401);
  console.log("PASS logout clears session");
} finally {
  await browser?.close();
  await api.dispose();
}
