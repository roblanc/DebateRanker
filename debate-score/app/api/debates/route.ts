import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { ensureDb } from '@/lib/db';
import { Debate } from '@/types';

export async function GET() {
  try {
    const db = await ensureDb();
    const result = await db.execute(
      'SELECT id, title, debater_a, debater_b, status, created_at FROM debates ORDER BY created_at DESC'
    );
    const debates = result.rows as unknown as Debate[];
    return NextResponse.json({ debates });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch debates' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, debater_a, debater_b, transcript } = body;

    if (!title || !debater_a || !debater_b || !transcript) {
      return NextResponse.json(
        { error: 'Missing required fields: title, debater_a, debater_b, transcript' },
        { status: 400 }
      );
    }

    const db = await ensureDb();
    const id = uuidv4();

    await db.execute({
      sql: 'INSERT INTO debates (id, title, debater_a, debater_b, transcript, status) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, title, debater_a, debater_b, transcript, 'pending'],
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create debate' }, { status: 500 });
  }
}
