/**
 * Smoke Runner bootstrap: creates smoke-A / smoke-B users + shops + seed stock.
 * Usage: node --env-file=.env.local scripts/smoke-bootstrap.mjs
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.SMOKE_PASSWORD || "SmokeTest!23456";

if (!URL || !SERVICE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SHOPS = [
  {
    email: "smoke-a@sanayidesk.local",
    fullName: "Smoke A Owner",
    shopName: "Smoke Dükkan A",
    slug: "smoke-a",
    seedStock: true,
  },
  {
    email: "smoke-b@sanayidesk.local",
    fullName: "Smoke B Owner",
    shopName: "Smoke Dükkan B",
    slug: "smoke-b",
    seedStock: false,
  },
];

async function ensureAuthUser(email, password, fullName) {
  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;
  const existing = (listed?.users ?? []).find(
    (u) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
  );
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw error;
  return data.user.id;
}

async function uniqueSlug(base) {
  const { data } = await admin
    .from("workspaces")
    .select("slug")
    .like("slug", `${base}%`);
  const taken = new Set((data ?? []).map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; i < 50; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

async function ensureShop(authUserId, shop) {
  const { data: appUser, error: userErr } = await admin
    .from("users")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (userErr) throw userErr;

  let userId = appUser?.id;
  if (!userId) {
    const { data: created, error } = await admin
      .from("users")
      .insert({
        auth_user_id: authUserId,
        full_name: shop.fullName,
      })
      .select("id")
      .single();
    if (error) throw error;
    userId = created.id;
  }

  const { data: membership } = await admin
    .from("memberships")
    .select("id, workspace_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("role", "owner")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership?.workspace_id) {
    const { data: ws } = await admin
      .from("workspaces")
      .select("id, slug, name, is_suspended")
      .eq("id", membership.workspace_id)
      .single();
    if (ws?.is_suspended) {
      await admin
        .from("workspaces")
        .update({ is_suspended: false })
        .eq("id", ws.id);
    }
    return { userId, workspaceId: ws.id, slug: ws.slug, created: false };
  }

  const slug = await uniqueSlug(shop.slug);
  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .insert({
      name: shop.shopName,
      slug,
      type: "repair",
      plan: "trial",
      trial_ends_at: new Date(Date.now() + 30 * 864e5).toISOString(),
      is_suspended: false,
      settings: {},
    })
    .select("id, slug")
    .single();
  if (wsErr) throw wsErr;

  const { error: memErr } = await admin.from("memberships").insert({
    user_id: userId,
    workspace_id: ws.id,
    role: "owner",
    display_name: shop.fullName,
    is_active: true,
  });
  if (memErr) throw memErr;

  return { userId, workspaceId: ws.id, slug: ws.slug, created: true };
}

async function seedStock(workspaceId, userId) {
  const { data: existing } = await admin
    .from("inventory_items")
    .select("id, qty")
    .eq("workspace_id", workspaceId)
    .eq("sku", "SMOKE-FILTER")
    .maybeSingle();

  if (existing) {
    if (Number(existing.qty) < 10) {
      await admin
        .from("inventory_items")
        .update({ qty: 20, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
    return existing.id;
  }

  const { data: item, error } = await admin
    .from("inventory_items")
    .insert({
      workspace_id: workspaceId,
      sku: "SMOKE-FILTER",
      name: "Smoke Yağ Filtresi",
      qty: 20,
      unit_cost: 100,
      min_qty: 2,
    })
    .select("id")
    .single();
  if (error) throw error;

  await admin.from("inventory_movements").insert({
    workspace_id: workspaceId,
    item_id: item.id,
    kind: "in",
    qty: 20,
    note: "Smoke seed",
    created_by_user_id: userId,
  });

  return item.id;
}

async function enableNetworkFlags(workspaceId) {
  const { data: ws } = await admin
    .from("workspaces")
    .select("settings")
    .eq("id", workspaceId)
    .single();
  const settings = {
    ...(ws?.settings && typeof ws.settings === "object" ? ws.settings : {}),
    share_vehicle_history: true,
    network_visible: true,
    phone: "05551112233",
    address: "Smoke Sanayi Cad. 1",
  };
  await admin.from("workspaces").update({ settings }).eq("id", workspaceId);
}

const out = { password: PASSWORD, shops: [] };

for (const shop of SHOPS) {
  const authId = await ensureAuthUser(shop.email, PASSWORD, shop.fullName);
  const result = await ensureShop(authId, shop);
  await enableNetworkFlags(result.workspaceId);
  let itemId = null;
  if (shop.seedStock) {
    itemId = await seedStock(result.workspaceId, result.userId);
  }
  out.shops.push({
    email: shop.email,
    slug: result.slug,
    workspaceId: result.workspaceId,
    userId: result.userId,
    created: result.created,
    stockItemId: itemId,
  });
  console.log(
    JSON.stringify({
      email: shop.email,
      slug: result.slug,
      workspaceId: result.workspaceId,
      created: result.created,
      stockItemId: itemId,
    }),
  );
}

console.log("---");
console.log(JSON.stringify(out, null, 2));
