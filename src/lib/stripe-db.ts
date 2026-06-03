import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require", max: 3 });

// Create table on first use
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS stripe_subscriptions (
      subscription_id  TEXT PRIMARY KEY,
      customer_id      TEXT NOT NULL,
      email            TEXT,
      status           TEXT NOT NULL DEFAULT 'active',
      expires_at       TIMESTAMPTZ,
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function upsertSubscription(data: {
  subscriptionId: string;
  customerId: string;
  email?: string;
  status: "active" | "cancelled" | "past_due";
  expiresAt?: Date;
}) {
  await ensureTable();
  await sql`
    INSERT INTO stripe_subscriptions
      (subscription_id, customer_id, email, status, expires_at, updated_at)
    VALUES
      (${data.subscriptionId}, ${data.customerId}, ${data.email ?? null},
       ${data.status}, ${data.expiresAt ?? null}, NOW())
    ON CONFLICT (subscription_id) DO UPDATE SET
      status     = EXCLUDED.status,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
  `;
}

export async function getSubscriptionStatus(subscriptionId: string): Promise<"active" | "cancelled" | "past_due" | "not_found"> {
  await ensureTable();
  const rows = await sql`
    SELECT status FROM stripe_subscriptions WHERE subscription_id = ${subscriptionId}
  `;
  if (rows.length === 0) return "not_found";
  return rows[0].status as "active" | "cancelled" | "past_due";
}
