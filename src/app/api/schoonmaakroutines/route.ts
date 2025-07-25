// Bestand: src/app/api/schoonmaakroutines/route.ts
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET: alle routines ophalen
export async function GET() {
  try {
    const result = await db.query('SELECT * FROM schoonmaakroutines WHERE actief = true ORDER BY id');
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Fout bij ophalen routines:", err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}

// POST: nieuwe routine aanmaken
export async function POST(req: NextRequest) {
  try {
    const { naam, frequentie, periode_start, periode_eind } = await req.json();

    if (!naam || typeof frequentie !== 'number' || typeof periode_start !== 'number' || typeof periode_eind !== 'number') {
      return NextResponse.json({ error: 'Alle velden zijn verplicht en moeten correct zijn ingevuld' }, { status: 400 });
    }

    if (frequentie <= 0 || periode_start < 1 || periode_start > 12 || periode_eind < 1 || periode_eind > 12) {
      return NextResponse.json({ error: 'Frequentie of maandwaarden zijn ongeldig' }, { status: 400 });
    }

    const result = await db.query(
      `INSERT INTO schoonmaakroutines (naam, frequentie, periode_start, periode_eind)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [naam, frequentie, periode_start, periode_eind]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Fout bij toevoegen routine:", err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}

// PATCH: laatst uitgevoerd datum bijwerken + loggen
export async function PATCH(req: NextRequest) {
  try {
    const { id, laatst_uitgevoerd } = await req.json();
    if (!id || !laatst_uitgevoerd) {
      return NextResponse.json({ error: 'id en datum zijn verplicht' }, { status: 400 });
    }

    await db.query('BEGIN');
    try {
      await db.query(
        `UPDATE schoonmaakroutines SET laatst_uitgevoerd = $2 WHERE id = $1`,
        [id, laatst_uitgevoerd]
      );

      await db.query(
        `INSERT INTO schoonmaak_log (routine_id, datum) VALUES ($1, $2)`,
        [id, laatst_uitgevoerd]
      );

      await db.query('COMMIT');
    } catch (err) {
      console.error("Fout in transactiestap:", err);
      await db.query('ROLLBACK');
      throw err;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Fout bij bijwerken routine:", err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}

// DELETE: routine deactiveren
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id ontbreekt' }, { status: 400 });

    await db.query('UPDATE schoonmaakroutines SET actief = false WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Fout bij verwijderen routine:", err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
