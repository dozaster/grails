import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/submit
 * Receives waitlist form data. Swap the body of this function to connect
 * to your actual backend (Supabase, Airtable, Resend, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Option A: log to console (current — works for local dev)
    console.log("[waitlist submission]", body);

    // ── Option B: forward to Airtable (uncomment + set env var)
    // await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Waitlist`, {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${process.env.AIRTABLE_API_KEY}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({ fields: body }),
    // });

    // ── Option C: forward to Supabase
    // const { createClient } = await import("@supabase/supabase-js");
    // const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    // await supabase.from("waitlist").insert(body);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[waitlist] error:", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
