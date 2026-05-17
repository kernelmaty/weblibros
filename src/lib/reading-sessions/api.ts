import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReadingSession, ReadingSessionFormValues } from "@/lib/reading-sessions/types";

const READING_SESSION_COLUMNS =
  "id,user_id,book_id,session_date,start_page,end_page,pages_read,notes,created_at,updated_at";

export async function listReadingSessionsByBook(
  supabase: SupabaseClient,
  bookId: string,
) {
  const { data, error } = await supabase
    .from("reading_sessions")
    .select(READING_SESSION_COLUMNS)
    .eq("book_id", bookId)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ReadingSession[];
}

export async function listReadingSessionsSince(
  supabase: SupabaseClient,
  sinceDate: string,
) {
  const { data, error } = await supabase
    .from("reading_sessions")
    .select(READING_SESSION_COLUMNS)
    .gte("session_date", sinceDate)
    .order("session_date", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ReadingSession[];
}

export async function listReadingSessionsForBooksBetween(
  supabase: SupabaseClient,
  bookIds: string[],
  startDate: string,
  endDate: string,
) {
  if (bookIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("reading_sessions")
    .select(READING_SESSION_COLUMNS)
    .in("book_id", bookIds)
    .gte("session_date", startDate)
    .lte("session_date", endDate)
    .order("session_date", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ReadingSession[];
}

export async function createReadingSession(
  supabase: SupabaseClient,
  bookId: string,
  values: ReadingSessionFormValues,
) {
  const { data, error } = await supabase
    .from("reading_sessions")
    .insert({
      book_id: bookId,
      session_date: values.session_date,
      start_page: values.start_page,
      end_page: values.end_page,
      notes: values.notes.trim(),
    })
    .select(READING_SESSION_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data as ReadingSession;
}
