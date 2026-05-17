import type { SupabaseClient } from "@supabase/supabase-js";
import type { Book, BookFormValues } from "@/lib/books/types";
import { normalizeBookPayload } from "@/lib/books/utils";

const BOOK_COLUMNS =
  "id,user_id,title,author,genre,status,priority,total_pages,current_page,started_at,finished_at,notes,percentage_read,pages_remaining,created_at,updated_at";

export async function getCurrentUserId(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user?.id ?? null;
}

export async function listBooks(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("books")
    .select(BOOK_COLUMNS)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Book[];
}

export async function getBook(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("books")
    .select(BOOK_COLUMNS)
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data as Book;
}

export async function createBook(supabase: SupabaseClient, values: BookFormValues) {
  const { data, error } = await supabase
    .from("books")
    .insert(normalizeBookPayload(values))
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data as { id: string };
}

export async function updateBook(
  supabase: SupabaseClient,
  id: string,
  values: BookFormValues,
) {
  const { error } = await supabase
    .from("books")
    .update(normalizeBookPayload(values))
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function deleteBook(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("books").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
