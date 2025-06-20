import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const schoonEmail = email.trim().toLowerCase();

    const gebruiker = await db.query(
      "SELECT email FROM medewerkers WHERE LOWER(email) = $1",
      [schoonEmail]
    );

    if (gebruiker.rowCount === 0) {
      return NextResponse.json({ error: "E-mailadres niet gevonden." }, { status: 404 });
    }

    const token = randomUUID();
    const vervaltijd = new Date(Date.now() + 1000 * 60 * 30); // 30 min geldig

    await db.query(
      `INSERT INTO wachtwoord_resets (email, token, vervaltijd)
       VALUES ($1, $2, $3)`,
      [schoonEmail, token, vervaltijd]
    );

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://werkinstructies-app.vercel.app";
    const resetLink = `${baseUrl}/wachtwoord-reset?token=${token}`;

    await resend.emails.send({
      from: "IJssalon Vincenzo <noreply@ijssalonvincenzo.nl>",
      to: schoonEmail,
      subject: "Wachtwoord herstellen",
      text: `Klik op onderstaande link om je wachtwoord opnieuw in te stellen. Deze link is 30 minuten geldig.\n\n${resetLink}`
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Fout bij versturen resetlink:", err);
    return NextResponse.json({ error: "Interne fout." }, { status: 500 });
  }
}
