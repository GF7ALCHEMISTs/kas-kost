import { NextResponse } from "next/server";

/**
 * Wrapper tipis ke WAHA (WhatsApp HTTP API, session scan-QR).
 * WAHA harus jalan di server always-on (VPS/Docker), bukan di Vercel,
 * karena butuh koneksi persisten + session file tersimpan.
 */
export async function POST(request: Request) {
  const { to, text } = (await request.json()) as { to: string; text: string };

  if (!to || !text) {
    return NextResponse.json({ error: "to dan text wajib diisi" }, { status: 400 });
  }

  const wahaUrl = `${process.env.WAHA_BASE_URL}/api/sendText`;

  const res = await fetch(wahaUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.WAHA_API_KEY ? { "X-Api-Key": process.env.WAHA_API_KEY } : {}),
    },
    body: JSON.stringify({
      session: process.env.WAHA_SESSION ?? "default",
      chatId: to, // format: 62xxxxxxxxxx@c.us
      text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ error: "Gagal kirim WA", detail }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
