import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { Debate } from '@/types';

export async function GET() {
  try {
    const db = getDb();
    const debates = db.prepare(
      'SELECT id, title, debater_a, debater_b, status, created_at FROM debates ORDER BY created_at DESC'
    ).all() as Debate[];
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

    const db = getDb();
    const id = uuidv4();

    db.prepare(
      'INSERT INTO debates (id, title, debater_a, debater_b, transcript, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, title, debater_a, debater_b, transcript, 'pending');

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create debate' }, { status: 500 });
  }
}
