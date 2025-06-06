import { NextResponse } from "next/server";
import { db } from "@/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(_req: Request, context: any) {
  const slug = context.params.slug;

  try {
    const result = await db.query("SELECT * FROM instructies WHERE slug = $1", [slug]);
    if (result.rows.length === 0)
      return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (err) {
    console.error("🛑 Fout bij GET:", err);
    return NextResponse.json({ error: "Databasefout" }, { status: 500 });
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(_req: Request, context: any) {
  const slug = context.params.slug;

  try {
    const { titel, inhoud } = await _req.json();

    await db.query(
      `UPDATE instructies SET titel = $1, inhoud = $2 WHERE slug = $3`,
      [titel, inhoud, slug]
    );

    return NextResponse.json({ slug }, { status: 200 });
  } catch (err) {
    console.error("🛑 Fout bij PATCH:", err);
    return NextResponse.json({ error: "Update mislukt" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(_req: Request, context: any) {
  const slug = context.params.slug;

  try {
    await db.query(`DELETE FROM instructies WHERE slug = $1`, [slug]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("🛑 Fout bij DELETE:", err);
    return NextResponse.json({ error: "Verwijderen mislukt" }, { status: 500 });
  }
}
