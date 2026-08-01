export type UserRole = "admin" | "member" | "parent";
export type PeriodStatus = "open" | "closed";
export type DueStatus = "unpaid" | "confirmed";
export type ExpenseStatus = "active" | "void";

export interface SharedSession {
  id: string;
  title: string;
  status: "open" | "awaiting_payment" | "closed";
  share_token: string;
  target_account_info: string | null;
  opened_by: string;
  opened_at: string;
  closed_at: string | null;
  closed_by: string | null;
  opened_by_profile?: Profile;
}

export interface SharedExpense {
  id: string;
  session_id: string;
  title: string;
  amount: number;
  paid_by: string;
  expense_date: string;
  proof_path: string | null;
  notes: string | null;
  status: ExpenseStatus;
  void_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  paid_by_profile?: Profile;
  // signed URL sementara buat nampilin bukti transfer (diisi query, bukan dari DB)
  signedProofUrl?: string | null;
}

/** Tagihan rata per peserta, dibuat admin SAAT sesi dibuka ke tahap pembayaran.
 *  Peserta boleh nama bebas (tidak perlu akun) -> user_id & profiles bisa null. */
export interface SessionDue {
  id: string;
  session_id: string;
  user_id: string | null;
  participant_name: string;
  amount_due: number;
  status: "unpaid" | "paid";
  proof_path: string | null;
  paid_at: string | null;
  note: string | null;
  created_at: string;
  profiles?: Profile;
  // signed URL sementara buat nampilin bukti transfer (diisi query, bukan dari DB)
  signedProofUrl?: string | null;
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  joined_at: string;
  left_at: string | null;
  created_at: string;
}

export interface Period {
  id: string;
  year: number;
  month: number;
  default_due_amount: number;
  due_date: string | null;
  status: PeriodStatus;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
}

export interface PeriodDue {
  id: string;
  period_id: string;
  user_id: string;
  amount_due: number;
  status: DueStatus;
  proof_path: string | null;
  paid_at: string | null;
  note: string | null;
  created_at: string;
  // relasi (kalau di-select dengan join)
  profiles?: Profile;
  // signed URL sementara buat nampilin bukti transfer (diisi query, bukan dari DB)
  signedProofUrl?: string | null;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string | null;
}

export interface Expense {
  id: string;
  period_id: string;
  category_id: string;
  amount: number;
  expense_date: string;
  paid_by: string | null;
  description: string;
  proof_path: string | null;
  status: ExpenseStatus;
  void_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  expense_categories?: ExpenseCategory;
  paid_by_profile?: Profile;
  // signed URL sementara buat nampilin bukti transfer (diisi query, bukan dari DB)
  signedProofUrl?: string | null;
}

export interface PeriodBalance {
  period_id: string;
  year: number;
  month: number;
  total_masuk: number;
  total_keluar: number;
  saldo_akhir: number;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: "insert" | "update" | "void" | "confirm" | "edit";
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  edit_reason: string | null;
  performed_by: string;
  performed_at: string;
}

// Minimal Database type shape supaya createClient<Database> tidak error.
// Untuk type-safety penuh, generate ulang dengan:
//   npx supabase gen types typescript --project-id <id> > types/database.types.ts
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      periods: {
        Row: Period;
        Insert: Partial<Period>;
        Update: Partial<Period>;
        Relationships: [];
      };
      period_dues: {
        Row: PeriodDue;
        Insert: Partial<PeriodDue>;
        Update: Partial<PeriodDue>;
        Relationships: [];
      };
      expense_categories: {
        Row: ExpenseCategory;
        Insert: Partial<ExpenseCategory>;
        Update: Partial<ExpenseCategory>;
        Relationships: [];
      };
      expenses: {
        Row: Expense;
        Insert: Partial<Expense>;
        Update: Partial<Expense>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog>;
        Update: Partial<AuditLog>;
        Relationships: [];
      };
    };
    Views: {
      period_balances: { Row: PeriodBalance; Relationships: [] };
    };
  };
};
