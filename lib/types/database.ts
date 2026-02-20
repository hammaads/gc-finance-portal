export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string | null
          bank_name: string
          created_at: string
          currency_id: string
          deleted_at: string | null
          id: string
          opening_balance: number
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number?: string | null
          bank_name: string
          created_at?: string
          currency_id: string
          deleted_at?: string | null
          id?: string
          opening_balance?: number
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string | null
          bank_name?: string
          created_at?: string
          currency_id?: string
          deleted_at?: string | null
          id?: string
          opening_balance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          amount_pkr: number
          category_id: string
          cause_id: string
          created_at: string
          currency_id: string
          deleted_at: string | null
          description: string
          exchange_rate_to_pkr: number
          id: string
          quantity: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          amount_pkr?: number
          category_id: string
          cause_id: string
          created_at?: string
          currency_id: string
          deleted_at?: string | null
          description: string
          exchange_rate_to_pkr?: number
          id?: string
          quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          amount_pkr?: number
          category_id?: string
          cause_id?: string
          created_at?: string
          currency_id?: string
          deleted_at?: string | null
          description?: string
          exchange_rate_to_pkr?: number
          id?: string
          quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_cause_id_fkey"
            columns: ["cause_id"]
            isOneToOne: false
            referencedRelation: "causes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_cause_id_fkey"
            columns: ["cause_id"]
            isOneToOne: false
            referencedRelation: "drive_financial_summary"
            referencedColumns: ["cause_id"]
          },
          {
            foreignKeyName: "budget_items_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      causes: {
        Row: {
          created_at: string
          date: string | null
          deleted_at: string | null
          description: string | null
          expected_headcount: number | null
          id: string
          location: string | null
          name: string
          number_of_daigs: number | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          deleted_at?: string | null
          description?: string | null
          expected_headcount?: number | null
          id?: string
          location?: string | null
          name: string
          number_of_daigs?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string | null
          deleted_at?: string | null
          description?: string | null
          expected_headcount?: number | null
          id?: string
          location?: string | null
          name?: string
          number_of_daigs?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: string
          created_at: string
          deleted_at: string | null
          exchange_rate_to_pkr: number
          id: string
          is_base: boolean
          name: string
          symbol: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          deleted_at?: string | null
          exchange_rate_to_pkr?: number
          id?: string
          is_base?: boolean
          name: string
          symbol: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          deleted_at?: string | null
          exchange_rate_to_pkr?: number
          id?: string
          is_base?: boolean
          name?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      donors: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      drive_templates: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          template_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          template_data?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          template_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_drive_allocations: {
        Row: {
          amount_pkr: number
          cause_id: string
          id: string
          ledger_entry_id: string
        }
        Insert: {
          amount_pkr: number
          cause_id: string
          id?: string
          ledger_entry_id: string
        }
        Update: {
          amount_pkr?: number
          cause_id?: string
          id?: string
          ledger_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_drive_allocations_cause_id_fkey"
            columns: ["cause_id"]
            isOneToOne: false
            referencedRelation: "causes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_drive_allocations_cause_id_fkey"
            columns: ["cause_id"]
            isOneToOne: false
            referencedRelation: "drive_financial_summary"
            referencedColumns: ["cause_id"]
          },
          {
            foreignKeyName: "expense_drive_allocations_ledger_entry_id_fkey"
            columns: ["ledger_entry_id"]
            isOneToOne: false
            referencedRelation: "ledger_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          amount_pkr: number
          bank_account_id: string | null
          category_id: string | null
          cause_id: string | null
          created_at: string
          created_by: string
          currency_id: string
          date: string
          deleted_at: string | null
          description: string | null
          donor_id: string | null
          exchange_rate_to_pkr: number
          from_user_id: string | null
          id: string
          to_user_id: string | null
          type: string
          updated_at: string
          void_reason: string | null
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          category_id?: string | null
          cause_id?: string | null
          created_at?: string
          created_by: string
          currency_id: string
          date?: string
          deleted_at?: string | null
          description?: string | null
          donor_id?: string | null
          exchange_rate_to_pkr: number
          from_user_id?: string | null
          id?: string
          to_user_id?: string | null
          type: string
          updated_at?: string
          void_reason?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category_id?: string | null
          cause_id?: string | null
          created_at?: string
          created_by?: string
          currency_id?: string
          date?: string
          deleted_at?: string | null
          description?: string | null
          donor_id?: string | null
          exchange_rate_to_pkr?: number
          from_user_id?: string | null
          id?: string
          to_user_id?: string | null
          type?: string
          updated_at?: string
          void_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_cause_id_fkey"
            columns: ["cause_id"]
            isOneToOne: false
            referencedRelation: "causes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_cause_id_fkey"
            columns: ["cause_id"]
            isOneToOne: false
            referencedRelation: "drive_financial_summary"
            referencedColumns: ["cause_id"]
          },
          {
            foreignKeyName: "ledger_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "volunteer_cash_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "volunteer_cash_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "volunteer_cash_balances"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      bank_account_balances: {
        Row: {
          account_name: string | null
          balance: number | null
          bank_name: string | null
          currency_code: string | null
          currency_id: string | null
          currency_symbol: string | null
          id: string | null
          opening_balance: number | null
          total_deposits: number | null
          total_withdrawals: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_vs_actual: {
        Row: {
          actual_pkr: number | null
          budgeted_pkr: number | null
          category_id: string | null
          category_name: string | null
          cause_id: string | null
          cause_name: string | null
          remaining_pkr: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_cause_id_fkey"
            columns: ["cause_id"]
            isOneToOne: false
            referencedRelation: "causes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_cause_id_fkey"
            columns: ["cause_id"]
            isOneToOne: false
            referencedRelation: "drive_financial_summary"
            referencedColumns: ["cause_id"]
          },
        ]
      }
      drive_financial_summary: {
        Row: {
          cause_id: string | null
          cause_name: string | null
          date: string | null
          expected_headcount: number | null
          location: string | null
          remaining_budget_pkr: number | null
          total_budget_pkr: number | null
          total_donations_pkr: number | null
          total_spent_pkr: number | null
          type: string | null
        }
        Relationships: []
      }
      volunteer_cash_balances: {
        Row: {
          balance_pkr: number | null
          display_name: string | null
          id: string | null
          total_deposited_pkr: number | null
          total_received_pkr: number | null
          total_sent_pkr: number | null
          total_spent_pkr: number | null
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  TableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends TableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[TableNameOrOptions["schema"]]["Tables"] &
        Database[TableNameOrOptions["schema"]]["Views"])
    : never = never,
> = TableNameOrOptions extends { schema: keyof Database }
  ? (Database[TableNameOrOptions["schema"]]["Tables"] &
      Database[TableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : TableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[TableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  TableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends TableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[TableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = TableNameOrOptions extends { schema: keyof Database }
  ? Database[TableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : TableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][TableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  TableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends TableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[TableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = TableNameOrOptions extends { schema: keyof Database }
  ? Database[TableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : TableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][TableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never
