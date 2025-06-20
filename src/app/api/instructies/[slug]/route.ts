import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import slugify from "slugify";



export async function POST(req: Request) {
  try {
    
    const { titel, inhoud, nummer, functies } = await req.json();

    if (!titel?.trim()) {
      return NextResponse.json({ error: "Titel is verplicht" }, { status: 400 });
    }
    const slug = slugify(titel, { lower: true, strict: true });
    const created_at = new Date().toISOString();

    const functiesGeparsed = Array.isArray(functies)
  ? functies
  : typeof functies === "string"
  ? (() => {
      try {
        return JSON.parse(functies);
      } catch {
        return [];
      }
    })()
  : [];

await db.query(
  `INSERT INTO instructies (titel, inhoud, slug, status, created_at, nummer, functies)
   VALUES ($1, $2, $3, 'concept', $4, $5, $6)`,
  [titel, inhoud, slug, created_at, nummer, JSON.stringify(functiesGeparsed)]
    );

    return new NextResponse(JSON.stringify({ slug }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🛑 Fout bij POST:", err);
    return NextResponse.json({ error: "Fout bij opslaan" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, context: any) {
  const slug = context?.params?.slug;
  if (slug) {
    try {
      const result = await db.query(
        "SELECT id, titel, inhoud, nummer, functies FROM instructies WHERE slug = $1",
        [Array.isArray(slug) ? slug[0] : slug]
      );
      if (result.rows.length === 0)
        return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
      return NextResponse.json(result.rows[0], { status: 200 });
    } catch (err) {
      console.error("🛑 Fout bij GET (één instructie):", err);
      return NextResponse.json({ error: "Ophalen mislukt" }, { status: 500 });
    }
  }


  try {
    const result = await db.query(
      "SELECT id, titel, slug, nummer, functies FROM instructies ORDER BY created_at DESC"
    );
    return NextResponse.json(result.rows, { status: 200 });
  } catch (err) {
    console.error("🛑 Fout bij ophalen instructies:", err);
    return NextResponse.json({ error: "Fout bij ophalen" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(req: Request, context: any) {
  const slug = Array.isArray(context.params.slug)
    ? context.params.slug[0]
    : context.params.slug;

  try {
    const { titel, inhoud, nummer, functies } = await req.json();

    const functiesGeparsed = Array.isArray(functies)
      ? functies
      : typeof functies === "string"
      ? (() => {
          try {
            return JSON.parse(functies);
          } catch {
            return [];
          }
        })()
      : [];

    await db.query(
      `UPDATE instructies
       SET titel = $1, inhoud = $2, nummer = $3, functies = $4
       WHERE slug = $5`,
      [titel, inhoud, nummer, JSON.stringify(functiesGeparsed), slug]
    );

    return NextResponse.json({ slug }, { status: 200 });
  } catch (err) {
    console.error("🛑 Fout bij PUT:", err);
    return NextResponse.json({ error: "Update mislukt" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(_req: Request, context: any) {
  const slug = Array.isArray(context.params.slug)
    ? context.params.slug[0]
    : context.params.slug;

  try {
    await db.query("DELETE FROM instructies WHERE slug = $1", [slug]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("🛑 Fout bij DELETE:", err);
    return NextResponse.json({ error: "Verwijderen mislukt" }, { status: 500 });
  }
}
