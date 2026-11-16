/**
 * Ostim demo dükkan seed — idempotent.
 * Usage: node --env-file=.env.local scripts/seed-demo-ostim.mjs
 *
 * Giriş: demo@baskent-oto.local / BaskentDemo!2026
 * PIN: Ahmet 1111 · Mehmet 2222 · Burak 3333 · slug baskent-oto
 */
import { createClient } from "@supabase/supabase-js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
let bcrypt;
try {
  bcrypt = require("bcryptjs");
} catch {
  console.error("bcryptjs yok: npm install bcryptjs --no-save");
  process.exit(1);
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SERVICE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_EMAIL = "demo@baskent-oto.local";
const DEMO_PASSWORD = "BaskentDemo!2026";
const SLUG = "baskent-oto";
const NEIGHBOR_SLUGS = ["ostim-yildiz-oto", "sasmaz-teknik"];

const daysAgo = (n, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
};
const daysAhead = (n, hour = 11) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const pinHash = (pin) =>
  bcrypt.hashSync(pin, 10).replace(/^\$2b\$/, "$2a$");

async function ensureAuthUser(email, password, fullName) {
  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
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

async function wipeDemoShops() {
  const slugs = [SLUG, ...NEIGHBOR_SLUGS];
  const { data: shops } = await admin
    .from("workspaces")
    .select("id, slug")
    .in("slug", slugs);
  for (const ws of shops ?? []) {
    console.log("Siliniyor:", ws.slug, ws.id);
    const { error } = await admin.from("workspaces").delete().eq("id", ws.id);
    if (error) throw error;
  }
  // orphan PIN users (null auth) without memberships
  const { data: orphans } = await admin
    .from("users")
    .select("id, auth_user_id, full_name")
    .is("auth_user_id", null);
  for (const u of orphans ?? []) {
    const { data: mem } = await admin
      .from("memberships")
      .select("id")
      .eq("user_id", u.id)
      .limit(1);
    if (!mem?.length) {
      await admin.from("users").delete().eq("id", u.id);
    }
  }
}

async function mustInsert(table, row, select = "id") {
  const { data, error } = await admin.from(table).insert(row).select(select).single();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

async function main() {
  console.log("1) Auth kullanıcısı…");
  const authId = await ensureAuthUser(
    DEMO_EMAIL,
    DEMO_PASSWORD,
    "Başkent Demo Patron",
  );

  console.log("2) Eski demo dükkanları temizle…");
  await wipeDemoShops();

  console.log("3) Dükkan + komşular…");
  const trialEnds = new Date(Date.now() + 15 * 864e5).toISOString();

  const ws = await mustInsert("workspaces", {
    name: "Başkent Oto Mekanik (Ostim)",
    slug: SLUG,
    type: "repair",
    plan: "trial",
    trial_ends_at: trialEnds,
    is_suspended: false,
    settings: {
      network_visible: true,
      share_vehicle_history: true,
      phone: "03123851234",
      address: "Ostim OSB 100. Yıl Bulvarı No:42 Yenimahalle/Ankara",
    },
  });

  const neighborA = await mustInsert("workspaces", {
    name: "Ostim Yıldız Otomotiv",
    slug: "ostim-yildiz-oto",
    type: "repair",
    plan: "trial",
    trial_ends_at: trialEnds,
    is_suspended: false,
    settings: {
      network_visible: true,
      share_vehicle_history: true,
      phone: "03123550011",
      address: "Ostim 15. Cadde No:8",
    },
  });

  const neighborB = await mustInsert("workspaces", {
    name: "Şaşmaz Teknik Servis",
    slug: "sasmaz-teknik",
    type: "repair",
    plan: "trial",
    trial_ends_at: trialEnds,
    is_suspended: false,
    settings: {
      network_visible: true,
      share_vehicle_history: true,
      phone: "03122781122",
      address: "Şaşmaz Sanayi Sitesi A Blok",
    },
  });

  // Owner app user (link or create)
  let { data: ownerUser } = await admin
    .from("users")
    .select("id")
    .eq("auth_user_id", authId)
    .maybeSingle();
  if (!ownerUser) {
    ownerUser = await mustInsert("users", {
      auth_user_id: authId,
      full_name: "Başkent Demo Patron",
      phone: "05321234567",
    });
  } else {
    await admin
      .from("users")
      .update({ full_name: "Başkent Demo Patron", phone: "05321234567" })
      .eq("id", ownerUser.id);
  }

  // If owner already has another shop membership as sole owner — still add baskent membership
  const { data: existingOwnerMem } = await admin
    .from("memberships")
    .select("id, workspace_id")
    .eq("user_id", ownerUser.id)
    .eq("role", "owner")
    .eq("is_active", true);
  // Soft-deactivate other owner memberships so login lands on demo shop? Better: keep and add — getSession uses first by created_at. Deactivate others temporarily?
  for (const m of existingOwnerMem ?? []) {
    if (m.workspace_id !== ws.id) {
      await admin
        .from("memberships")
        .update({ is_active: false })
        .eq("id", m.id);
      console.log("Diğer owner membership pasif:", m.workspace_id);
    }
  }

  await mustInsert("memberships", {
    user_id: ownerUser.id,
    workspace_id: ws.id,
    role: "owner",
    display_name: "Başkent Demo Patron",
    is_active: true,
  });

  console.log("4) Ustalar…");
  async function addPinStaff(name, role, pin) {
    const u = await mustInsert("users", {
      auth_user_id: null,
      full_name: name,
    });
    const m = await mustInsert("memberships", {
      user_id: u.id,
      workspace_id: ws.id,
      role,
      display_name: name,
      pin_hash: pinHash(pin),
      is_active: true,
    });
    return m;
  }
  const ahmet = await addPinStaff("Ahmet Usta", "mechanic", "1111");
  const mehmet = await addPinStaff("Mehmet Usta", "mechanic", "2222");
  await addPinStaff("Burak", "apprentice", "3333");

  console.log("5) Rehber + B2B…");
  const dir = async (name, phone, note) =>
    mustInsert("directory_contacts", {
      workspace_id: ws.id,
      name,
      phone,
      note,
    });
  await dir("Ostim Lider Yedek Parça", "03123850001", "Balata / filtre / yağ");
  await dir("Ankara Japon Kore Parça", "03123850002", "Japon-Kore orijinal");
  await dir("Şaşmaz Filtre & Yağ Merkezi", "03122780003", "Yağ toptan");

  const party = async (name, phone, note) =>
    mustInsert("external_parties", {
      workspace_id: ws.id,
      name,
      phone,
      note,
      linked_workspace_id: null,
    });
  const pomp = await party(
    "Yıldız Pompa & Enjektör (Ostim)",
    "03123851111",
    "Enjektör / pompa revizyon",
  );
  const elektrik = await party(
    "Kardeşler Oto Elektrik",
    "03123852222",
    "Beyin / elektrik",
  );
  const torna = await party(
    "Başkent Torna & Rektifiye",
    "03123853333",
    "Motor torna",
  );

  console.log("6) Stok…");
  const stock = [
    ["YAG-5W30", "5W-30 Tam Sentetik Motor Yağı (4L)", 48, 620, 12],
    ["FLT-YAG", "Yağ Filtresi (üniversal)", 35, 95, 10],
    ["FLT-HAVA", "Hava Filtresi", 28, 140, 8],
    ["FLT-POLEN", "Polen Filtresi", 22, 110, 6],
    ["BAL-ON", "Ön Fren Balatası Takım", 14, 480, 4],
    ["BAL-ARKA", "Arka Fren Balatası Takım", 11, 390, 3],
    ["TRG-SET", "Triger Seti (kayış+rulamn)", 6, 1850, 2],
    ["DEVIR", "Devirdaim Pompası", 5, 920, 2],
    ["ANTIF", "Antifriz (3L)", 18, 210, 5],
    ["BZN-FIL", "Mazot Filtresi", 2, 160, 6], // low
    ["TERM", "Termostat", 1, 240, 4], // low
    ["BUJI", "Kızdırma Bujisi", 3, 180, 8], // low
    ["YAG-0W20", "0W-20 Motor Yağı (4L)", 20, 680, 6],
    ["DISK-ON", "Ön Fren Diski (adet)", 8, 750, 2],
  ];
  const stockIds = {};
  for (const [sku, name, qty, cost, min] of stock) {
    const item = await mustInsert("inventory_items", {
      workspace_id: ws.id,
      sku,
      name,
      qty,
      unit_cost: cost,
      min_qty: min,
    });
    stockIds[sku] = item.id;
    await mustInsert("inventory_movements", {
      workspace_id: ws.id,
      item_id: item.id,
      kind: "in",
      qty,
      note: "Demo açılış stoğu",
      created_by_user_id: ownerUser.id,
    });
  }

  // Neighbor stock for transfer
  const nItem = await mustInsert("inventory_items", {
    workspace_id: neighborA.id,
    sku: "YAG-5W30",
    name: "5W-30 Tam Sentetik Motor Yağı (4L)",
    qty: 10,
    unit_cost: 600,
    min_qty: 2,
  });

  console.log("7) Transfer + ağ plaka geçmişi…");
  await mustInsert("inventory_transfer_requests", {
    from_workspace_id: ws.id,
    to_workspace_id: neighborA.id,
    from_item_id: stockIds["YAG-5W30"],
    qty: 4,
    note: "Acil yağ ihtiyacı — tamamlandı",
    status: "approved",
    created_by_user_id: ownerUser.id,
    responded_at: daysAgo(5),
  });
  // Ensure neighbor has the plate for shared history lookup
  const sharedVeh = await mustInsert("vehicles", {
    workspace_id: neighborB.id,
    plate_normalized: "06TRN088",
    make_model: "Ford Transit 2.2",
  });
  await mustInsert("work_orders", {
    workspace_id: neighborB.id,
    vehicle_id: sharedVeh.id,
    status: "delivered",
    complaint: "Fren hidroliği değişimi (komşu kayıt)",
    opened_at: daysAgo(40),
    closed_at: daysAgo(39),
  });

  console.log("8) Müşteriler + geçmiş işler…");
  const cust = async (full_name, phone) =>
    mustInsert("customers", {
      workspace_id: ws.id,
      full_name,
      phone,
    });

  const customers = {
    ahmetY: await cust("Ahmet Yılmaz", "05321110001"),
    mehmetK: await cust("Mehmet Kaya", "05321110002"),
    ayseD: await cust("Ayşe Demir", "05321110003"),
    fatmaC: await cust("Fatma Çelik", "05321110004"),
    aliO: await cust("Ali Öztürk", "05321110005"),
    zeynepA: await cust("Zeynep Arslan", "05321110006"),
    canB: await cust("Can Bulut", "05321110007"),
    elifS: await cust("Elif Şahin", "05321110008"),
    hasanT: await cust("Hasan Tekin", "05321110009"),
    denizY: await cust("Deniz Yıldız", "05321110010"),
  };

  const veh = async (plate, make_model, customer_id = null) => {
    const plate_normalized = plate.replace(/\s/g, "").toUpperCase();
    const { data: existing } = await admin
      .from("vehicles")
      .select("id")
      .eq("workspace_id", ws.id)
      .eq("plate_normalized", plate_normalized)
      .maybeSingle();
    if (existing) {
      await admin
        .from("vehicles")
        .update({
          make_model,
          customer_id: customer_id ?? undefined,
        })
        .eq("id", existing.id);
      return existing;
    }
    return mustInsert("vehicles", {
      workspace_id: ws.id,
      plate_normalized,
      make_model,
      customer_id,
    });
  };

  async function addJob({
    plate,
    make,
    customer,
    status,
    complaint,
    openedDaysAgo,
    closedDaysAgo = null,
    items = [],
    payments = [],
    assignee = null,
    quote = null,
    remindDaysFromNow = null,
    hour = 10,
  }) {
    const v = await veh(plate, make, customer?.id ?? null);
    const opened = daysAgo(openedDaysAgo, hour);
    const closed =
      closedDaysAgo == null ? null : daysAgo(closedDaysAgo, hour + 3);
    let remind_at = null;
    if (remindDaysFromNow != null) {
      const r = new Date();
      r.setDate(r.getDate() + remindDaysFromNow);
      r.setHours(9, 0, 0, 0);
      remind_at = r.toISOString();
    }
    const wo = await mustInsert("work_orders", {
      workspace_id: ws.id,
      vehicle_id: v.id,
      customer_id: customer?.id ?? null,
      status,
      complaint,
      opened_at: opened,
      closed_at: closed,
      created_by_user_id: ownerUser.id,
      quote_amount: quote,
      remind_at,
    });
    for (const it of items) {
      await mustInsert("work_order_items", {
        workspace_id: ws.id,
        work_order_id: wo.id,
        kind: it.kind ?? "labor",
        description: it.description,
        amount: it.amount,
      });
    }
    for (const p of payments) {
      await mustInsert("payments", {
        workspace_id: ws.id,
        work_order_id: wo.id,
        amount: p.amount,
        method: p.method,
        invoice_mode: "uninvoiced",
        paid_at: p.paidAt ?? closed ?? opened,
        note: p.note ?? "",
        created_by_user_id: ownerUser.id,
      });
    }
    if (assignee) {
      await mustInsert("work_order_assignments", {
        workspace_id: ws.id,
        work_order_id: wo.id,
        membership_id: assignee.id,
        assigned_by_user_id: ownerUser.id,
        assigned_at: opened,
      });
    }
    return { wo, v };
  }

  // Historical delivered jobs (~25) totaling ~₺340k collected
  const hist = [
    { plate: "06ABC101", make: "Fiat Egea", c: customers.ahmetY, d: 28, items: [{ kind: "part", description: "Yağ + filtre seti", amount: 2800 }, { kind: "labor", description: "Periyodik bakım", amount: 1500 }], pay: [{ amount: 4300, method: "cash" }], who: ahmet },
    { plate: "06ABC102", make: "Renault Clio", c: customers.mehmetK, d: 27, items: [{ kind: "part", description: "Ön balata", amount: 2200 }, { kind: "labor", description: "Balata işçilik", amount: 800 }], pay: [{ amount: 3000, method: "card" }], who: mehmet },
    { plate: "06ABC103", make: "VW Golf", c: customers.ayseD, d: 26, items: [{ kind: "part", description: "Triger seti", amount: 9500 }, { kind: "labor", description: "Triger işçilik", amount: 4500 }], pay: [{ amount: 14000, method: "transfer" }], who: mehmet },
    { plate: "06ABC104", make: "Toyota Corolla", c: customers.fatmaC, d: 25, items: [{ kind: "labor", description: "Diagnostik + buji", amount: 3200 }], pay: [{ amount: 3200, method: "cash" }], who: ahmet },
    { plate: "06ABC105", make: "Hyundai i20", c: customers.aliO, d: 24, items: [{ kind: "part", description: "Alternatör", amount: 7800 }, { kind: "labor", description: "Değişim", amount: 2200 }], pay: [{ amount: 10000, method: "card" }], who: ahmet },
    { plate: "06ABC106", make: "Opel Astra", c: customers.zeynepA, d: 23, items: [{ kind: "part", description: "Debriyaj seti", amount: 12500 }, { kind: "labor", description: "Kavrama işçilik", amount: 5500 }], pay: [{ amount: 18000, method: "transfer" }], who: mehmet },
    { plate: "06ABC107", make: "Ford Focus", c: customers.canB, d: 22, items: [{ kind: "part", description: "Amortisör takım", amount: 6400 }, { kind: "labor", description: "Takım değişim", amount: 2600 }], pay: [{ amount: 9000, method: "cash" }], who: ahmet },
    { plate: "06ABC108", make: "Peugeot 301", c: customers.elifS, d: 21, items: [{ kind: "labor", description: "Klima gaz dolum", amount: 2800 }], pay: [{ amount: 2800, method: "card" }], who: mehmet },
    { plate: "06ABC109", make: "Honda Civic", c: customers.hasanT, d: 20, items: [{ kind: "part", description: "Su pompası", amount: 3100 }, { kind: "labor", description: "Değişim", amount: 1400 }], pay: [{ amount: 4500, method: "cash" }], who: ahmet },
    { plate: "06ABC110", make: "Dacia Sandero", c: customers.denizY, d: 19, items: [{ kind: "part", description: "Egzoz orta susturucu", amount: 4200 }, { kind: "labor", description: "Kaynak+montaj", amount: 1800 }], pay: [{ amount: 6000, method: "transfer" }], who: mehmet },
    { plate: "06ABC111", make: "BMW 3.20", c: customers.ahmetY, d: 18, items: [{ kind: "part", description: "Enjektör 4 adet", amount: 22000 }, { kind: "labor", description: "Enjektör işçilik", amount: 6000 }], pay: [{ amount: 28000, method: "transfer" }], who: ahmet },
    { plate: "06ABC112", make: "Mercedes C200", c: customers.mehmetK, d: 17, items: [{ kind: "part", description: "Turbo kartuş", amount: 15500 }, { kind: "labor", description: "Turbo işçilik", amount: 4500 }], pay: [{ amount: 20000, method: "card" }], who: mehmet },
    { plate: "06ABC113", make: "Audi A3", c: customers.ayseD, d: 16, items: [{ kind: "labor", description: "Yağ bakımı premium", amount: 5200 }], pay: [{ amount: 5200, method: "cash" }], who: ahmet },
    { plate: "06ABC114", make: "Seat Leon", c: customers.fatmaC, d: 15, items: [{ kind: "part", description: "Ön disk + balata", amount: 4800 }, { kind: "labor", description: "Fren işçilik", amount: 1600 }], pay: [{ amount: 6400, method: "card" }], who: mehmet },
    { plate: "06ABC115", make: "Skoda Octavia", c: customers.aliO, d: 14, items: [{ kind: "part", description: "EGR temizliği+conta", amount: 3600 }, { kind: "labor", description: "EGR işçilik", amount: 2400 }], pay: [{ amount: 6000, method: "cash" }], who: ahmet },
    { plate: "06ABC116", make: "Nissan Qashqai", c: customers.zeynepA, d: 13, items: [{ kind: "part", description: "Şanzıman yağı+filtre", amount: 4100 }, { kind: "labor", description: "Şanzıman bakımı", amount: 2900 }], pay: [{ amount: 7000, method: "transfer" }], who: mehmet },
    { plate: "06ABC117", make: "Kia Sportage", c: customers.canB, d: 12, items: [{ kind: "part", description: "Akü 72Ah", amount: 5200 }, { kind: "labor", description: "Akü montaj", amount: 400 }], pay: [{ amount: 5600, method: "cash" }], who: ahmet },
    { plate: "06ABC118", make: "Mazda 3", c: customers.elifS, d: 11, items: [{ kind: "labor", description: "Rot başı + balans", amount: 3800 }], pay: [{ amount: 3800, method: "card" }], who: mehmet },
    { plate: "06ABC119", make: "Volvo S60", c: customers.hasanT, d: 10, items: [{ kind: "part", description: "Sanziman mekatronik", amount: 18500 }, { kind: "labor", description: "İşçilik", amount: 6500 }], pay: [{ amount: 25000, method: "transfer" }], who: ahmet },
    { plate: "06ABC120", make: "Fiat Doblo", c: customers.denizY, d: 9, items: [{ kind: "part", description: "Debimetre", amount: 2900 }, { kind: "labor", description: "Değişim", amount: 900 }], pay: [{ amount: 3800, method: "cash" }], who: mehmet },
    { plate: "06ABC121", make: "Renault Fluence", c: customers.ahmetY, d: 8, items: [{ kind: "part", description: "Radyatör", amount: 4500 }, { kind: "labor", description: "Değişim+antifriz", amount: 2000 }], pay: [{ amount: 6500, method: "card" }], who: ahmet },
    { plate: "06ABC122", make: "Peugeot 308", c: customers.mehmetK, d: 7, items: [{ kind: "labor", description: "Yağ+filtre+kontrol", amount: 4100 }], pay: [{ amount: 4100, method: "cash" }], who: mehmet },
    // Veresiye (partial / unpaid) ~28.5k remaining across 3
    { plate: "06VRS201", make: "Honda Civic", c: customers.ayseD, d: 6, items: [{ kind: "part", description: "Ön takım komple", amount: 12000 }, { kind: "labor", description: "Ön takım işçilik", amount: 4500 }], pay: [{ amount: 4000, method: "cash", note: "Kapora" }], who: ahmet, creditLedger: 12500 },
    { plate: "06VRS202", make: "Dacia Duster", c: customers.fatmaC, d: 5, items: [{ kind: "part", description: "Debriyaj seti", amount: 9800 }, { kind: "labor", description: "Kavrama", amount: 4200 }], pay: [{ amount: 5000, method: "transfer", note: "Kısmi" }], who: mehmet, creditLedger: 9000 },
    { plate: "06VRS203", make: "Hyundai i20", c: customers.aliO, d: 4, items: [{ kind: "part", description: "Katalitik", amount: 8500 }, { kind: "labor", description: "Egzoz işçilik", amount: 2500 }], pay: [{ amount: 2500, method: "cash", note: "Kapora" }], who: ahmet, creditLedger: 8500 },
  ];

  let collected = 0;
  for (const h of hist) {
    const { wo } = await addJob({
      plate: h.plate,
      make: h.make,
      customer: h.c,
      status: "delivered",
      complaint: h.items.map((i) => i.description).join(" + "),
      openedDaysAgo: h.d,
      closedDaysAgo: h.d - 1,
      items: h.items,
      payments: h.pay,
      assignee: h.who,
    });
    for (const p of h.pay) {
      if (p.method !== "credit") collected += p.amount;
    }
    if (h.creditLedger && h.c) {
      await mustInsert("customer_ledger_entries", {
        workspace_id: ws.id,
        customer_id: h.c.id,
        work_order_id: wo.id,
        delta: h.creditLedger,
        note: "Veresiye bakiye (demo)",
      });
    }
    // bonuses for mechanics
    if (h.who) {
      const labor = h.items
        .filter((i) => i.kind === "labor")
        .reduce((s, i) => s + i.amount, 0);
      const bonus = Math.round(labor * 0.15);
      if (bonus > 0) {
        await mustInsert("mechanic_bonus_entries", {
          workspace_id: ws.id,
          work_order_id: wo.id,
          membership_id: h.who.id,
          amount: bonus,
          note: "İşçilik primi %15 (demo)",
          created_by_user_id: ownerUser.id,
        });
      }
    }
  }

  // Reminder jobs (delivered, remind_at today/this week)
  await addJob({
    plate: "06KML210",
    make: "Honda Civic",
    customer: customers.hasanT,
    status: "delivered",
    complaint: "Periyodik bakım (yağ+filtre)",
    openedDaysAgo: 300,
    closedDaysAgo: 299,
    items: [
      { kind: "part", description: "Yağ seti", amount: 3200 },
      { kind: "labor", description: "Bakım", amount: 1200 },
    ],
    payments: [{ amount: 4400, method: "cash" }],
    assignee: ahmet,
    remindDaysFromNow: 0,
  });
  await addJob({
    plate: "06VRN442",
    make: "Dacia Duster",
    customer: customers.denizY,
    status: "delivered",
    complaint: "Yağ bakımı",
    openedDaysAgo: 305,
    closedDaysAgo: 304,
    items: [
      { kind: "part", description: "Yağ+filtre", amount: 3600 },
      { kind: "labor", description: "Bakım", amount: 1000 },
    ],
    payments: [{ amount: 4600, method: "card" }],
    assignee: mehmet,
    remindDaysFromNow: 1,
  });
  await addJob({
    plate: "06PLT118",
    make: "Hyundai i20",
    customer: customers.elifS,
    status: "delivered",
    complaint: "Periyodik bakım",
    openedDaysAgo: 310,
    closedDaysAgo: 309,
    items: [
      { kind: "part", description: "Yağ seti", amount: 3000 },
      { kind: "labor", description: "Bakım", amount: 1100 },
    ],
    payments: [{ amount: 4100, method: "cash" }],
    assignee: ahmet,
    remindDaysFromNow: 2,
  });

  // Transit history (3 weeks ago) + will have open job
  await addJob({
    plate: "06TRN088",
    make: "Ford Transit 2.2",
    customer: customers.canB,
    status: "delivered",
    complaint: "Fren balata + disk (geçmiş ziyaret)",
    openedDaysAgo: 21,
    closedDaysAgo: 20,
    items: [
      { kind: "part", description: "Balata+disk", amount: 5400 },
      { kind: "labor", description: "Fren işçilik", amount: 1800 },
    ],
    payments: [{ amount: 7200, method: "transfer" }],
    assignee: ahmet,
  });

  console.log("9) Tahta — 6 açık iş…");
  // Kabul
  await addJob({
    plate: "06EGE412",
    make: "Fiat Egea 1.3 Multijet",
    customer: customers.ahmetY,
    status: "intake",
    complaint: "Periyodik bakım + kızdırma bujisi kontrolü",
    openedDaysAgo: 0,
    hour: 8,
    items: [],
    payments: [],
  });

  // Onay bekliyor
  const passat = await addJob({
    plate: "06BJK903",
    make: "VW Passat 1.6 TDI",
    customer: customers.mehmetK,
    status: "waiting_approval",
    complaint: "Kavrama + volan seti değişimi",
    openedDaysAgo: 1,
    items: [
      { kind: "part", description: "Kavrama + volan seti", amount: 18500 },
      { kind: "labor", description: "Kavrama işçilik", amount: 6000 },
    ],
    payments: [],
    assignee: ahmet,
    quote: 24500,
  });
  await mustInsert("message_events", {
    workspace_id: ws.id,
    work_order_id: passat.wo.id,
    channel: "whatsapp_manual",
    payload: { kind: "quote", len: 86, sha256: "demoquotehash0001" },
    created_by_user_id: ownerUser.id,
  });

  // Transit open + B2B + media
  const transit = await addJob({
    plate: "06TRN088",
    make: "Ford Transit 2.2",
    customer: customers.canB,
    status: "in_progress",
    complaint: "Enjektör revizyonu + mazot filtresi",
    openedDaysAgo: 2,
    items: [
      { kind: "part", description: "Mazot filtresi", amount: 450 },
      { kind: "labor", description: "Montaj / test", amount: 2500 },
    ],
    payments: [],
    assignee: ahmet,
  });
  await mustInsert("b2b_ledger_entries", {
    workspace_id: ws.id,
    external_party_id: pomp.id,
    amount: 6000,
    direction: "we_owe",
    status: "confirmed",
    note: "Enjektör revizyon — Transit 06 TRN 088",
    work_order_id: transit.wo.id,
    confirmed_at: daysAgo(1),
    confirmed_by_user_id: ownerUser.id,
    created_by_user_id: ownerUser.id,
  });
  await mustInsert("b2b_ledger_entries", {
    workspace_id: ws.id,
    external_party_id: elektrik.id,
    amount: 2800,
    direction: "they_owe",
    status: "confirmed",
    note: "Bobin işi — ödendi/kapandı örnek",
    confirmed_at: daysAgo(8),
    confirmed_by_user_id: ownerUser.id,
    created_by_user_id: ownerUser.id,
  });
  await mustInsert("b2b_ledger_entries", {
    workspace_id: ws.id,
    external_party_id: torna.id,
    amount: 4500,
    direction: "we_owe",
    status: "pending",
    note: "Blok rektifiye — bekliyor",
    created_by_user_id: ownerUser.id,
  });
  await mustInsert("media", {
    workspace_id: ws.id,
    work_order_id: transit.wo.id,
    storage_path: `${ws.id}/${transit.wo.id}/demo-enjektor-eski.jpg`,
    content_type: "image/jpeg",
    byte_size: 120000,
    created_by_user_id: ownerUser.id,
  });
  await mustInsert("media", {
    workspace_id: ws.id,
    work_order_id: transit.wo.id,
    storage_path: `${ws.id}/${transit.wo.id}/demo-enjektor-yeni.jpg`,
    content_type: "image/jpeg",
    byte_size: 135000,
    created_by_user_id: ownerUser.id,
  });

  // Megane
  await addJob({
    plate: "06MGN055",
    make: "Renault Megane 4",
    customer: customers.zeynepA,
    status: "in_progress",
    complaint: "Triger seti + devirdaim değişimi",
    openedDaysAgo: 1,
    items: [
      { kind: "part", description: "Triger + devirdaim", amount: 8500 },
      { kind: "labor", description: "Triger işçilik", amount: 3000 },
    ],
    payments: [{ amount: 3000, method: "cash", note: "Kapora", paidAt: daysAgo(1) }],
    assignee: mehmet,
  });

  // Parça
  const astra = await addJob({
    plate: "06CRD304",
    make: "Opel Astra J",
    customer: customers.fatmaC,
    status: "waiting_parts",
    complaint: "Termostat + genleşme kabı değişimi",
    openedDaysAgo: 1,
    items: [
      { kind: "part", description: "Termostat", amount: 650 },
      { kind: "part", description: "Genleşme kabı", amount: 890 },
      { kind: "labor", description: "Soğutma işçilik", amount: 1200 },
    ],
    payments: [],
    assignee: mehmet,
  });
  await mustInsert("part_requests", {
    workspace_id: ws.id,
    work_order_id: astra.wo.id,
    description: "Opel Astra J termostat + genleşme kabı (orijinal)",
    status: "open",
    created_by_membership_id: mehmet.id,
  });

  // Hazır — unpaid lock demo
  await addJob({
    plate: "06ANK771",
    make: "Toyota Corolla",
    customer: customers.aliO,
    status: "ready",
    complaint: "Ön takım + ön fren balatası",
    openedDaysAgo: 3,
    items: [
      { kind: "part", description: "Ön takım parçaları", amount: 6200 },
      { kind: "part", description: "Ön fren balatası", amount: 1600 },
      { kind: "labor", description: "İşçilik", amount: 2000 },
    ],
    payments: [{ amount: 5000, method: "card", note: "Kısmi tahsilat", paidAt: daysAgo(1) }],
    assignee: ahmet,
  });

  console.log("10) Randevu + audit + mesaj…");
  await mustInsert("appointments", {
    workspace_id: ws.id,
    plate: "06RND101",
    scheduled_at: daysAhead(1, 10),
    status: "scheduled",
    notes: "Skoda Octavia — yağ bakımı",
    created_by_user_id: ownerUser.id,
  });
  await mustInsert("appointments", {
    workspace_id: ws.id,
    plate: "06RND202",
    scheduled_at: daysAhead(1, 14),
    status: "scheduled",
    notes: "Peugeot 3008 — fren kontrol",
    created_by_user_id: ownerUser.id,
  });
  await mustInsert("appointments", {
    workspace_id: ws.id,
    plate: "06RND303",
    scheduled_at: daysAhead(2, 11),
    status: "scheduled",
    notes: "Ford Focus — triger teklif",
    created_by_user_id: ownerUser.id,
  });

  const audits = [
    { action: "work_order.quote", entity_type: "work_order", entity_id: passat.wo.id, new_data: { quote_amount: 24500 } },
    { action: "work_order.deliver_unpaid", entity_type: "work_order", entity_id: null, new_data: { remaining: 8500, note: "Demo geçmiş veresiye teslim" } },
    { action: "work_order.status", entity_type: "work_order", entity_id: passat.wo.id, old_data: { status: "in_progress" }, new_data: { status: "waiting_approval" } },
    { action: "payment.create", entity_type: "payment", new_data: { amount: 5000, method: "card" } },
    { action: "shared_plate_lookup", entity_type: "vehicle", new_data: { plate: "06TRN088", result_count: 1 } },
  ];
  for (const a of audits) {
    await mustInsert("audit_logs", {
      workspace_id: ws.id,
      actor_user_id: ownerUser.id,
      action: a.action,
      entity_type: a.entity_type,
      entity_id: a.entity_id ?? passat.wo.id,
      old_data: a.old_data ?? null,
      new_data: a.new_data,
    });
  }

  await mustInsert("message_events", {
    workspace_id: ws.id,
    work_order_id: passat.wo.id,
    channel: "whatsapp_manual",
    payload: { kind: "ready", len: 64, sha256: "demoreadyhash0002" },
    created_by_user_id: ownerUser.id,
  });

  console.log("11) PIN hash’lerini Postgres crypt ile yeniden yaz…");
  const anon = createClient(URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: deskLoginErr } = await anon.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  if (deskLoginErr) throw deskLoginErr;
  for (const [mem, pin] of [
    [ahmet, "1111"],
    [mehmet, "2222"],
  ]) {
    const { error } = await anon.rpc("owner_set_member_pin", {
      _membership_id: mem.id,
      _pin: pin,
    });
    if (error) console.warn("pin set", mem.id, error.message);
  }
  // Burak apprentice
  const { data: burakMem } = await admin
    .from("memberships")
    .select("id")
    .eq("workspace_id", ws.id)
    .eq("display_name", "Burak")
    .maybeSingle();
  if (burakMem) {
    const { error } = await anon.rpc("owner_set_member_pin", {
      _membership_id: burakMem.id,
      _pin: "3333",
    });
    if (error) console.warn("burak pin", error.message);
  }

  console.log("\n=== DEMO HAZIR ===");
  console.log(
    JSON.stringify(
      {
        shop: "Başkent Oto Mekanik (Ostim)",
        slug: SLUG,
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        pins: { ahmet: "1111", mehmet: "2222", burak: "3333" },
        workspaceId: ws.id,
        neighbors: ["ostim-yildiz-oto", "sasmaz-teknik"],
        approxCollectedTry: collected,
        note: "Media satırları var; storage dosyası yok (görsel 404 olabilir).",
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
