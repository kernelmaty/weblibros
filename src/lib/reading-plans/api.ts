import type { SupabaseClient } from "@supabase/supabase-js";
import type { Book } from "@/lib/books/types";
import type {
  ReadingPlan,
  ReadingPlanBook,
  ReadingPlanDay,
  ReadingPlanDetail,
  ReadingPlanFormValues,
} from "@/lib/reading-plans/types";
import {
  calculatePlanTotals,
  generatePlanDays,
  getPendingPages,
} from "@/lib/reading-plans/utils";

const PLAN_COLUMNS =
  "id,user_id,name,start_date,target_date,total_pending_pages,pages_per_day,status,created_at,updated_at";
const PLAN_BOOK_COLUMNS =
  "id,plan_id,user_id,book_id,pending_pages_at_start,sort_order,created_at";
const PLAN_DAY_COLUMNS =
  "id,plan_id,user_id,day_date,target_pages,cumulative_target_pages,created_at";

export async function listReadingPlans(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("reading_plans")
    .select(PLAN_COLUMNS)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ReadingPlan[];
}

export async function getReadingPlanDetail(
  supabase: SupabaseClient,
  planId: string,
  allBooks: Book[],
): Promise<ReadingPlanDetail> {
  const [planResult, booksResult, daysResult] = await Promise.all([
    supabase.from("reading_plans").select(PLAN_COLUMNS).eq("id", planId).single(),
    supabase
      .from("reading_plan_books")
      .select(PLAN_BOOK_COLUMNS)
      .eq("plan_id", planId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("reading_plan_days")
      .select(PLAN_DAY_COLUMNS)
      .eq("plan_id", planId)
      .order("day_date", { ascending: true }),
  ]);

  if (planResult.error) {
    throw planResult.error;
  }

  if (booksResult.error) {
    throw booksResult.error;
  }

  if (daysResult.error) {
    throw daysResult.error;
  }

  const bookMap = new Map(allBooks.map((book) => [book.id, book]));
  const planBooks = ((booksResult.data ?? []) as ReadingPlanBook[]).map(
    (planBook) => ({
      ...planBook,
      book: bookMap.get(planBook.book_id) ?? null,
    }),
  );

  return {
    plan: planResult.data as ReadingPlan,
    books: planBooks,
    days: (daysResult.data ?? []) as ReadingPlanDay[],
  };
}

export async function createReadingPlan(
  supabase: SupabaseClient,
  values: ReadingPlanFormValues,
  selectedBooks: Book[],
) {
  const totals = calculatePlanTotals(
    selectedBooks,
    values.start_date,
    values.target_date,
  );

  const { data: plan, error: planError } = await supabase
    .from("reading_plans")
    .insert({
      name: values.name.trim(),
      start_date: values.start_date,
      target_date: values.target_date,
      total_pending_pages: totals.totalPendingPages,
      pages_per_day: totals.pagesPerDay,
      status: "activo",
    })
    .select("id")
    .single();

  if (planError) {
    throw planError;
  }

  const planId = (plan as { id: string }).id;

  const planBooks = selectedBooks.map((book, index) => ({
    plan_id: planId,
    book_id: book.id,
    pending_pages_at_start: getPendingPages(book),
    sort_order: index,
  }));

  const { error: booksError } = await supabase
    .from("reading_plan_books")
    .insert(planBooks);

  if (booksError) {
    throw booksError;
  }

  const days = generatePlanDays(
    planId,
    values.start_date,
    values.target_date,
    totals.totalPendingPages,
  );

  if (days.length > 0) {
    const { error: daysError } = await supabase
      .from("reading_plan_days")
      .insert(days);

    if (daysError) {
      throw daysError;
    }
  }

  return { id: planId };
}

export async function recalculateReadingPlan(
  supabase: SupabaseClient,
  detail: ReadingPlanDetail,
) {
  const selectedBooks = detail.books
    .map((planBook) => planBook.book)
    .filter((book): book is Book => Boolean(book));
  const totals = calculatePlanTotals(
    selectedBooks,
    detail.plan.start_date,
    detail.plan.target_date,
  );

  const { error: planError } = await supabase
    .from("reading_plans")
    .update({
      total_pending_pages: totals.totalPendingPages,
      pages_per_day: totals.pagesPerDay,
    })
    .eq("id", detail.plan.id);

  if (planError) {
    throw planError;
  }

  const updateResults = await Promise.all(
    detail.books.map((planBook) =>
      supabase
        .from("reading_plan_books")
        .update({
          pending_pages_at_start: planBook.book
            ? getPendingPages(planBook.book)
            : planBook.pending_pages_at_start,
        })
        .eq("id", planBook.id),
    ),
  );

  const failedUpdate = updateResults.find((result) => result.error);

  if (failedUpdate?.error) {
    throw failedUpdate.error;
  }

  const { error: deleteDaysError } = await supabase
    .from("reading_plan_days")
    .delete()
    .eq("plan_id", detail.plan.id);

  if (deleteDaysError) {
    throw deleteDaysError;
  }

  const days = generatePlanDays(
    detail.plan.id,
    detail.plan.start_date,
    detail.plan.target_date,
    totals.totalPendingPages,
  );

  if (days.length > 0) {
    const { error: insertDaysError } = await supabase
      .from("reading_plan_days")
      .insert(days);

    if (insertDaysError) {
      throw insertDaysError;
    }
  }
}
