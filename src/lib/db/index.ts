import fs from 'fs';
import path from 'path';
import { Investigation, DiagnosticReport } from '../types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'forgemind.json');

interface DatabaseShape {
  investigations: Record<string, Investigation>;
}

// Ensure local persistence file exists
function initLocalDb(): DatabaseShape {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initial: DatabaseShape = { investigations: {} };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw) as DatabaseShape;
  } catch (err) {
    console.error('Failed to read local database:', err);
    return { investigations: {} };
  }
}

function saveLocalDb(data: DatabaseShape) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    console.error('Failed to write local database:', err);
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

// Storage Operations
export async function getAllInvestigations(): Promise<Investigation[]> {
  const db = initLocalDb();
  return Object.values(db.investigations).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getInvestigationById(id: string): Promise<Investigation | null> {
  const db = initLocalDb();
  return db.investigations[id] || null;
}

export async function saveInvestigation(investigation: Investigation): Promise<Investigation> {
  const db = initLocalDb();
  db.investigations[investigation.id] = {
    ...investigation,
    updatedAt: new Date().toISOString(),
  };
  saveLocalDb(db);
  return db.investigations[investigation.id];
}

export async function updateInvestigationFeedback(
  id: string,
  helpful: boolean,
  comment?: string
): Promise<Investigation | null> {
  const db = initLocalDb();
  const existing = db.investigations[id];
  if (!existing) return null;

  existing.userFeedback = {
    helpful,
    feedbackAt: new Date().toISOString(),
    comment,
  };
  existing.updatedAt = new Date().toISOString();
  saveLocalDb(db);
  return existing;
}

export async function deleteInvestigation(id: string): Promise<boolean> {
  const db = initLocalDb();
  if (!db.investigations[id]) return false;
  delete db.investigations[id];
  saveLocalDb(db);
  return true;
}

export async function clearAllInvestigations(): Promise<void> {
  const db: DatabaseShape = { investigations: {} };
  saveLocalDb(db);
}

