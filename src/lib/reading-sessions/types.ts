export type ReadingSession = {
  id: string;
  user_id: string;
  book_id: string;
  session_date: string;
  start_page: number;
  end_page: number;
  pages_read: number;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type ReadingSessionFormValues = {
  session_date: string;
  start_page: number;
  end_page: number;
  notes: string;
};

export function getDefaultSessionDate() {
  return new Date().toISOString().slice(0, 10);
}
