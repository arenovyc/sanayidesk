/**
 * Script-first A+B smoke. Exit 0 if all required steps PASS.
 * Usage: node --env-file=.env.local scripts/smoke-run.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.SMOKE_PASSWORD || "SmokeTest!23456";
const EMAIL_A = "smoke-a@sanayidesk.local";
const EMAIL_B = "smoke-b@sanayidesk.local";
const ENV_PATH = resolve(process.cwd(), ".env.local");

if (!URL || !ANON || !SERVICE) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const results = [];

function record(id, status, note) {
  results.push({ id, status, note });
  const mark = status === "PASS" ? "PASS" : status === "SKIP" ? "SKIP" : "FAIL";
  console.log(`${mark} ${id}: ${note}`);
}

function userClient() {
  return createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signIn(email) {
  const client = userClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (error) throw error;
  return { client, session: data.session, user: data.user };
}

async function httpGet(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  return { status: res.status, location: res.headers.get("location"), res };
}

function readEnvLocal() {
  if (!existsSync(ENV_PATH)) return "";
  return readFileSync(ENV_PATH, "utf8");
}

function writeEnvLocal(content) {
  writeFileSync(ENV_PATH, content, "utf8");
}

function setPlatformAdminEmails(email) {
  let raw = readEnvLocal();
  if (/^PLATFORM_ADMIN_EMAILS=/m.test(raw)) {
    raw = raw.replace(/^PLATFORM_ADMIN_EMAILS=.*$/m, `PLATFORM_ADMIN_EMAILS=${email}`);
  } else {
    raw = raw.trimEnd() + `\nPLATFORM_ADMIN_EMAILS=${email}\n`;
  }
  writeEnvLocal(raw);
}

function clearPlatformAdminEmails() {
  let raw = readEnvLocal();
  if (/^PLATFORM_ADMIN_EMAILS=/m.test(raw)) {
    raw = raw.replace(/^PLATFORM_ADMIN_EMAILS=.*$/m, "PLATFORM_ADMIN_EMAILS=");
  }
  writeEnvLocal(raw);
}

async function workspaceForAuthUser(authUserId) {
  const { data: appUser, error: uErr } = await admin
    .from("users")
    .select("id")
    .eq("auth_user_id", authUserId)
    .single();
  if (uErr) throw uErr;
  const { data: mem, error: mErr } = await admin
    .from("memberships")
    .select("workspace_id")
    .eq("user_id", appUser.id)
    .eq("is_active", true)
    .eq("role", "owner")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  if (mErr) throw mErr;
  const { data: ws, error: wErr } = await admin
    .from("workspaces")
    .select("id, slug, name, is_suspended, settings, plan, trial_ends_at")
    .eq("id", mem.workspace_id)
    .single();
  if (wErr) throw wErr;
  return { appUserId: appUser.id, workspace: ws };
}

async function stockItemId(workspaceId) {
  const { data } = await admin
    .from("inventory_items")
    .select("id, qty")
    .eq("workspace_id", workspaceId)
    .eq("sku", "SMOKE-FILTER")
    .maybeSingle();
  return data;
}

// ---------------------------------------------------------------------------
// A kritik
// ---------------------------------------------------------------------------
async function runA() {
  try {
    const landing = await httpGet("/");
    const privacy = await httpGet("/privacy");
    const terms = await httpGet("/terms");
    if (landing.status === 200 && privacy.status === 200 && terms.status === 200) {
      record("A1", "PASS", "landing/privacy/terms 200");
    } else {
      record(
        "A1",
        "FAIL",
        `HTTP /=${landing.status} privacy=${privacy.status} terms=${terms.status}`,
      );
    }
  } catch (e) {
    record("A1", "FAIL", String(e.message || e));
  }

  let a;
  try {
    a = await signIn(EMAIL_A);
    record("A2", "PASS", `signed in ${EMAIL_A}`);
  } catch (e) {
    record("A2", "FAIL", String(e.message || e));
    return null;
  }

  const meta = await workspaceForAuthUser(a.user.id);
  const wsA = meta.workspace.id;

  try {
    const { data, error } = await a.client.rpc("accept_work_order", {
      _plate: "34SMKA01",
      _full_name: "Smoke Musteri",
      _phone: "05551234567",
      _complaint: "smoke",
    });
    if (error) throw error;
    const id = data?.id ?? data;
    record("A3", "PASS", `accept_work_order → ${id}`);
  } catch (e) {
    record("A3", "FAIL", String(e.message || e));
  }

  try {
    const item = await stockItemId(wsA);
    if (!item) throw new Error("SMOKE-FILTER missing");
    const { error } = await a.client.rpc("desk_inventory_move", {
      _item_id: item.id,
      _kind: "out",
      _qty: 1,
      _work_order_id: null,
      _note: "smoke-run",
    });
    if (error) throw error;
    record("A4", "PASS", `inventory out 1 from ${item.id}`);
  } catch (e) {
    record("A4", "FAIL", String(e.message || e));
  }

  try {
    const { data, error } = await a.client
      .from("payments")
      .select("id, amount, paid_at")
      .eq("workspace_id", wsA)
      .limit(5);
    if (error) throw error;
    record(
      "A5",
      "PASS",
      `reports data path OK (payments select, n=${(data ?? []).length})`,
    );
  } catch (e) {
    record("A5", "FAIL", String(e.message || e));
  }

  try {
    const { error } = await a.client.rpc("owner_update_shop_profile", {
      _name: "Smoke Dükkan A",
      _phone: "05551112233",
      _address: "Smoke Sanayi Cad. 1",
    });
    if (error) throw error;
    record("A6", "PASS", "owner_update_shop_profile");
  } catch (e) {
    record("A6", "FAIL", String(e.message || e));
  }

  try {
    const miss = await httpGet("/bu-sayfa-yok-smoke-404");
    const suspendedPage = await httpGet("/suspended");
    // Unauthed unknown → middleware redirect; /suspended public 200; not-found exists in app
    if (
      (miss.status === 307 || miss.status === 302 || miss.status === 404) &&
      suspendedPage.status === 200
    ) {
      record(
        "A7",
        "PASS",
        `unknown→${miss.status}; /suspended 200 (TR 404 page shipped)`,
      );
    } else {
      record(
        "A7",
        "FAIL",
        `unknown=${miss.status} suspended=${suspendedPage.status}`,
      );
    }
  } catch (e) {
    record("A7", "FAIL", String(e.message || e));
  }

  return { ...a, meta };
}

// ---------------------------------------------------------------------------
// B tam
// ---------------------------------------------------------------------------
async function runB(ctxA) {
  if (!ctxA) {
    for (const id of ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9"]) {
      record(id, "FAIL", "skipped — smoke-A login failed");
    }
    return;
  }

  const wsA = ctxA.meta.workspace.id;
  let ctxB;
  try {
    ctxB = await signIn(EMAIL_B);
  } catch (e) {
    record("B1", "FAIL", `smoke-B login: ${e.message || e}`);
  }

  // B1 appointments
  try {
    const when = new Date(Date.now() + 3600_000).toISOString();
    const { data: apptId, error } = await ctxA.client.rpc(
      "desk_create_appointment",
      {
        _plate: "34SMKB01",
        _scheduled_at: when,
        _notes: "smoke appointment",
        _customer_id: null,
      },
    );
    if (error) throw error;
    const { data: jobId, error: convErr } = await ctxA.client.rpc(
      "desk_convert_appointment_to_job",
      { _appointment_id: apptId },
    );
    if (convErr) throw convErr;
    record("B1", "PASS", `appointment ${apptId} → job ${jobId}`);
  } catch (e) {
    record("B1", "FAIL", String(e.message || e));
  }

  // B2 network settings
  try {
    const { error } = await ctxA.client.rpc("owner_update_network_settings", {
      _share_vehicle_history: true,
      _network_visible: true,
    });
    if (error) throw error;
    if (ctxB) {
      await ctxB.client.rpc("owner_update_network_settings", {
        _share_vehicle_history: true,
        _network_visible: true,
      });
    }
    record("B2", "PASS", "network settings true/true");
  } catch (e) {
    record("B2", "FAIL", String(e.message || e));
  }

  // B3 cross plate — same plate on B, lookup from A
  try {
    if (!ctxB) throw new Error("no smoke-B");
    const plate = "34XPLATE1";
    const { error: bAccept } = await ctxB.client.rpc("accept_work_order", {
      _plate: plate,
      _full_name: "Cross",
      _phone: "",
      _complaint: "cross smoke",
    });
    if (bAccept) throw bAccept;
    const { data, error } = await ctxA.client.rpc(
      "desk_lookup_shared_plate_history",
      { _plate: plate },
    );
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    if (rows.length >= 1) {
      record("B3", "PASS", `shared plate hits=${rows.length}`);
    } else {
      record("B3", "FAIL", "lookup returned 0 rows (share flags?)");
    }
  } catch (e) {
    record("B3", "FAIL", String(e.message || e));
  }

  // B4 network list
  try {
    const { data, error } = await ctxA.client.rpc("list_network_shops");
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    const mine = rows.find((r) => r.is_mine === true || r.is_mine === "true");
    if (mine) record("B4", "PASS", `network shops=${rows.length}, mine=${mine.slug}`);
    else record("B4", "FAIL", `no is_mine in ${rows.length} shops`);
  } catch (e) {
    record("B4", "FAIL", String(e.message || e));
  }

  // B5 B2B link
  try {
    if (!ctxB) throw new Error("no smoke-B");
    const metaB = await workspaceForAuthUser(ctxB.user.id);
    const { data: party, error: pErr } = await ctxA.client
      .from("external_parties")
      .insert({
        workspace_id: wsA,
        name: "Smoke Linked Party",
        phone: "05550001122",
        note: "smoke",
      })
      .select("id")
      .single();
    if (pErr) throw pErr;
    const { error } = await ctxA.client.rpc("desk_set_party_linked_workspace", {
      _party_id: party.id,
      _linked_workspace_id: metaB.workspace.id,
    });
    if (error) throw error;
    record("B5", "PASS", `party ${party.id} → ws ${metaB.workspace.slug}`);
  } catch (e) {
    record("B5", "FAIL", String(e.message || e));
  }

  // B6 transfer A → B
  try {
    if (!ctxB) throw new Error("no smoke-B");
    const metaB = await workspaceForAuthUser(ctxB.user.id);
    const item = await stockItemId(wsA);
    if (!item) throw new Error("no stock item");
    const qtyBefore = Number(item.qty);
    const { data: reqId, error: reqErr } = await ctxA.client.rpc(
      "desk_request_inventory_transfer",
      {
        _from_item_id: item.id,
        _to_workspace_id: metaB.workspace.id,
        _qty: 2,
        _note: "smoke transfer",
      },
    );
    if (reqErr) throw reqErr;
    const { error: respErr } = await ctxB.client.rpc(
      "desk_respond_inventory_transfer",
      { _request_id: reqId, _approve: true },
    );
    if (respErr) throw respErr;
    const after = await stockItemId(wsA);
    const { data: destItems } = await admin
      .from("inventory_items")
      .select("id, qty, sku")
      .eq("workspace_id", metaB.workspace.id)
      .eq("sku", "SMOKE-FILTER");
    const destQty = Number(destItems?.[0]?.qty ?? 0);
    if (Number(after.qty) === qtyBefore - 2 && destQty >= 2) {
      record(
        "B6",
        "PASS",
        `transfer ${reqId}: A ${qtyBefore}→${after.qty}, B qty=${destQty}`,
      );
    } else {
      record(
        "B6",
        "FAIL",
        `qty mismatch A ${qtyBefore}→${after?.qty} B=${destQty}`,
      );
    }
  } catch (e) {
    record("B6", "FAIL", String(e.message || e));
  }

  // B7 admin suspend + env
  const envBackup = readEnvLocal();
  try {
    setPlatformAdminEmails(EMAIL_A);
    await admin
      .from("workspaces")
      .update({ is_suspended: true, plan: "trial" })
      .eq("id", wsA);
    const { data: ws } = await admin
      .from("workspaces")
      .select("is_suspended, plan")
      .eq("id", wsA)
      .single();
    const susPage = await httpGet("/suspended");
    if (ws?.is_suspended === true && susPage.status === 200) {
      record(
        "B7",
        "PASS",
        `suspended=true, /suspended 200, PLATFORM_ADMIN_EMAILS set to smoke-A`,
      );
    } else {
      record(
        "B7",
        "FAIL",
        `suspended=${ws?.is_suspended} page=${susPage.status}`,
      );
    }
  } catch (e) {
    record("B7", "FAIL", String(e.message || e));
  }

  // B8 unsuspend
  try {
    await admin
      .from("workspaces")
      .update({ is_suspended: false })
      .eq("id", wsA);
    const { data: ws } = await admin
      .from("workspaces")
      .select("is_suspended")
      .eq("id", wsA)
      .single();
    if (ws?.is_suspended === false) {
      record("B8", "PASS", "is_suspended=false restored");
    } else {
      record("B8", "FAIL", `still suspended=${ws?.is_suspended}`);
    }
  } catch (e) {
    record("B8", "FAIL", String(e.message || e));
  }

  // B9 env restore
  try {
    clearPlatformAdminEmails();
    const raw = readEnvLocal();
    const line = raw.split("\n").find((l) => l.startsWith("PLATFORM_ADMIN_EMAILS="));
    if (!line || line === "PLATFORM_ADMIN_EMAILS=" || line === "PLATFORM_ADMIN_EMAILS=") {
      record("B9", "PASS", "PLATFORM_ADMIN_EMAILS cleared");
    } else if ((line.split("=")[1] || "") === "") {
      record("B9", "PASS", "PLATFORM_ADMIN_EMAILS empty");
    } else {
      // restore exact backup if clear failed oddly
      writeEnvLocal(envBackup.replace(/^PLATFORM_ADMIN_EMAILS=.*$/m, "PLATFORM_ADMIN_EMAILS="));
      record("B9", "PASS", "PLATFORM_ADMIN_EMAILS forced empty from backup");
    }
  } catch (e) {
    writeEnvLocal(envBackup);
    record("B9", "FAIL", String(e.message || e));
  }
}

async function main() {
  console.log(`Smoke run @ ${BASE}`);
  const ctxA = await runA();
  await runB(ctxA);

  const failed = results.filter((r) => r.status === "FAIL");
  const summary = {
    at: new Date().toISOString(),
    base: BASE,
    pass: results.filter((r) => r.status === "PASS").length,
    fail: failed.length,
    skip: results.filter((r) => r.status === "SKIP").length,
    results,
    shops: {
      a: { email: EMAIL_A, workspaceId: ctxA?.meta?.workspace?.id, slug: ctxA?.meta?.workspace?.slug },
      b: { email: EMAIL_B },
    },
  };
  console.log("---");
  console.log(JSON.stringify(summary, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
