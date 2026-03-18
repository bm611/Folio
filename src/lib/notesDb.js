/**
 * Supabase notes table helpers.
 *
 * SQL to run once in the Supabase SQL editor:
 * ─────────────────────────────────────────────
 * create table notes (
 *   id          uuid primary key,
 *   user_id     uuid references auth.users(id) on delete cascade not null,
 *   title       text not null default '',
 *   content     text not null default '',
 *   content_doc jsonb,
 *   tags        text[] default '{}',
 *   word_goal   int,
 *   created_at  timestamptz default now(),
 *   updated_at  timestamptz default now()
 * );
 *
 * alter table notes enable row level security;
 *
 * create policy "Users own their notes"
 *   on notes for all using (auth.uid() = user_id);
 *
 * create or replace function update_updated_at()
 * returns trigger as $$
 * begin new.updated_at = now(); return new; end;
 * $$ language plpgsql;
 *
 * create trigger notes_updated_at
 *   before update on notes
 *   for each row execute function update_updated_at();
 *
 * -- Run this migration to add folder support:
 * -- alter table notes add column if not exists parent_id uuid references notes(id) on delete set null;
 * -- alter table notes add column if not exists type text not null default 'file';
 * -- alter table notes add column if not exists deleted_at timestamptz;
 * ─────────────────────────────────────────────
 */

import { supabase } from './supabase'

/** Map a Supabase DB row → app note shape */
function rowToNote(row) {
  return {
    id: row.id,
    type: row.type || 'file',
    name: row.title || 'Untitled',
    title: row.title || '',
    content: row.content || '',
    contentDoc: row.content_doc || undefined,
    editorVersion: row.content_doc ? 2 : undefined,
    tags: row.tags || [],
    parentId: row.parent_id || null,
    deletedAt: row.deleted_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.type === 'folder' ? { children: [] } : {}),
  }
}

/** Map an app note → Supabase DB row (for upsert) */
function noteToRow(note, userId) {
  return {
    id: note.id,
    user_id: userId,
    title: note.title || note.name || '',
    content: note.content || '',
    content_doc: note.contentDoc || null,
    tags: note.tags || [],
    parent_id: note.parentId || null,
    type: note.type || 'file',
    created_at: note.createdAt || null,
    updated_at: note.updatedAt || note.createdAt || null,
    deleted_at: note.deletedAt || null,
  }
}

/** Fetch all notes for the signed-in user, most-recently-updated first */
export async function fetchNotes(userId) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data || []).map(rowToNote)
}

/** Insert or update a single note */
export async function upsertNote(note, userId) {
  const { error } = await supabase
    .from('notes')
    .upsert(noteToRow(note, userId), { onConflict: 'id' })

  if (error) throw error
}

/** Hard-delete a note by id */
export async function deleteNote(id) {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}

export async function softDeleteNotes(ids) {
  if (!ids?.length) {
    return
  }

  const { error } = await supabase
    .from('notes')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', ids)

  if (error) throw error
}

export async function restoreNotes(notes, userId) {
  if (!notes?.length) {
    return
  }

  const rows = notes.map((note) => ({
    ...noteToRow({ ...note, deletedAt: null }, userId),
    deleted_at: null,
  }))

  const { error } = await supabase
    .from('notes')
    .upsert(rows, { onConflict: 'id' })

  if (error) throw error
}
