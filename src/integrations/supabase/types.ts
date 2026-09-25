export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blockchain_ledger: {
        Row: {
          amount: number
          block_number: number
          confirmations: number | null
          confirmed_at: string | null
          created_at: string
          currency: string
          current_hash: string
          deriv_transaction_id: string | null
          from_address: string | null
          id: string
          metadata: Json | null
          previous_hash: string
          status: string
          to_address: string | null
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          block_number?: number
          confirmations?: number | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          current_hash: string
          deriv_transaction_id?: string | null
          from_address?: string | null
          id?: string
          metadata?: Json | null
          previous_hash?: string
          status?: string
          to_address?: string | null
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          block_number?: number
          confirmations?: number | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          current_hash?: string
          deriv_transaction_id?: string | null
          from_address?: string | null
          id?: string
          metadata?: Json | null
          previous_hash?: string
          status?: string
          to_address?: string | null
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bot_analyses: {
        Row: {
          created_at: string
          estimated_amount: number | null
          estimated_value: number | null
          executed: boolean
          id: string
          order_id: string | null
          price: number | null
          reasons: Json | null
          rejection_reason: string | null
          signal: string
          symbol: string
          timeframe: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_amount?: number | null
          estimated_value?: number | null
          executed?: boolean
          id?: string
          order_id?: string | null
          price?: number | null
          reasons?: Json | null
          rejection_reason?: string | null
          signal: string
          symbol: string
          timeframe?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_amount?: number | null
          estimated_value?: number | null
          executed?: boolean
          id?: string
          order_id?: string | null
          price?: number | null
          reasons?: Json | null
          rejection_reason?: string | null
          signal?: string
          symbol?: string
          timeframe?: string | null
          user_id?: string
        }
        Relationships: []
      }
      deriv_accounts: {
        Row: {
          balance: number | null
          created_at: string
          currency: string | null
          deriv_account_id: string
          deriv_email: string | null
          id: string
          is_active: boolean | null
          is_virtual: boolean | null
          last_sync_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string
          currency?: string | null
          deriv_account_id: string
          deriv_email?: string | null
          id?: string
          is_active?: boolean | null
          is_virtual?: boolean | null
          last_sync_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string
          currency?: string | null
          deriv_account_id?: string
          deriv_email?: string | null
          id?: string
          is_active?: boolean | null
          is_virtual?: boolean | null
          last_sync_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deriv_transactions: {
        Row: {
          amount_imch: number
          amount_usd: number
          blockchain_ledger_id: string | null
          completed_at: string | null
          created_at: string
          deriv_account_id: string
          deriv_reference: string | null
          error_message: string | null
          exchange_rate: number
          id: string
          status: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount_imch: number
          amount_usd: number
          blockchain_ledger_id?: string | null
          completed_at?: string | null
          created_at?: string
          deriv_account_id: string
          deriv_reference?: string | null
          error_message?: string | null
          exchange_rate: number
          id?: string
          status?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount_imch?: number
          amount_usd?: number
          blockchain_ledger_id?: string | null
          completed_at?: string | null
          created_at?: string
          deriv_account_id?: string
          deriv_reference?: string | null
          error_message?: string | null
          exchange_rate?: number
          id?: string
          status?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deriv_transactions_blockchain_ledger_id_fkey"
            columns: ["blockchain_ledger_id"]
            isOneToOne: false
            referencedRelation: "blockchain_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          from_currency: string
          id: string
          rate: number
          to_currency: string
          updated_at: string
        }
        Insert: {
          from_currency: string
          id?: string
          rate: number
          to_currency: string
          updated_at?: string
        }
        Update: {
          from_currency?: string
          id?: string
          rate?: number
          to_currency?: string
          updated_at?: string
        }
        Relationships: []
      }
      imch_balances: {
        Row: {
          admin_email: string
          coins: number
          created_at: string
          id: string
          last_mining_at: string | null
          updated_at: string
        }
        Insert: {
          admin_email: string
          coins?: number
          created_at?: string
          id?: string
          last_mining_at?: string | null
          updated_at?: string
        }
        Update: {
          admin_email?: string
          coins?: number
          created_at?: string
          id?: string
          last_mining_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      imch_settings: {
        Row: {
          admin_email: string
          created_at: string
          id: string
          transfer_threshold_usdt: number
          updated_at: string
        }
        Insert: {
          admin_email: string
          created_at?: string
          id?: string
          transfer_threshold_usdt?: number
          updated_at?: string
        }
        Update: {
          admin_email?: string
          created_at?: string
          id?: string
          transfer_threshold_usdt?: number
          updated_at?: string
        }
        Relationships: []
      }
      imch_transfers: {
        Row: {
          admin_email: string
          amount_usdt: number
          bybit_transfer_id: string | null
          coins_transferred: number
          created_at: string
          error_message: string | null
          id: string
          status: string
        }
        Insert: {
          admin_email: string
          amount_usdt: number
          bybit_transfer_id?: string | null
          coins_transferred: number
          created_at?: string
          error_message?: string | null
          id?: string
          status?: string
        }
        Update: {
          admin_email?: string
          amount_usdt?: number
          bybit_transfer_id?: string | null
          coins_transferred?: number
          created_at?: string
          error_message?: string | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      kyc_verifications: {
        Row: {
          created_at: string
          date_of_birth: string | null
          document_image_url: string | null
          document_number: string | null
          document_type: string | null
          extracted_data: Json | null
          full_name: string | null
          id: string
          rejection_reason: string | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          document_image_url?: string | null
          document_number?: string | null
          document_type?: string | null
          extracted_data?: Json | null
          full_name?: string | null
          id?: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          document_image_url?: string | null
          document_number?: string | null
          document_type?: string | null
          extracted_data?: Json | null
          full_name?: string | null
          id?: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance_aoa: number
          binance_avatar_url: string | null
          binance_profile_link: string | null
          bio: string | null
          bybit_avatar_url: string | null
          bybit_profile_link: string | null
          coins: number
          created_at: string
          deriv_avatar_url: string | null
          deriv_profile_link: string | null
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          redotpay_avatar_url: string | null
          redotpay_profile_link: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          balance_aoa?: number
          binance_avatar_url?: string | null
          binance_profile_link?: string | null
          bio?: string | null
          bybit_avatar_url?: string | null
          bybit_profile_link?: string | null
          coins?: number
          created_at?: string
          deriv_avatar_url?: string | null
          deriv_profile_link?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          phone?: string | null
          redotpay_avatar_url?: string | null
          redotpay_profile_link?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          balance_aoa?: number
          binance_avatar_url?: string | null
          binance_profile_link?: string | null
          bio?: string | null
          bybit_avatar_url?: string | null
          bybit_profile_link?: string | null
          coins?: number
          created_at?: string
          deriv_avatar_url?: string | null
          deriv_profile_link?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          redotpay_avatar_url?: string | null
          redotpay_profile_link?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          risk_level: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          risk_level?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          risk_level?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_transfers: {
        Row: {
          amount: number
          created_at: string
          currency: string
          from_user_id: string
          id: string
          note: string | null
          status: string
          to_user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          from_user_id: string
          id?: string
          note?: string | null
          status?: string
          to_user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          from_user_id?: string
          id?: string
          note?: string | null
          status?: string
          to_user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          address: string
          created_at: string
          id: string
          is_primary: boolean
          label: string | null
          user_id: string
          wallet_type: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          is_primary?: boolean
          label?: string | null
          user_id: string
          wallet_type?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          label?: string | null
          user_id?: string
          wallet_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_balance_with_conversion: {
        Args: {
          p_amount: number
          p_from_currency: string
          p_to_currency: string
          p_user_id: string
        }
        Returns: Json
      }
      create_blockchain_transaction: {
        Args: {
          p_amount: number
          p_currency?: string
          p_deriv_transaction_id?: string
          p_from_address?: string
          p_metadata?: Json
          p_to_address?: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: string
      }
      generate_block_hash: {
        Args: {
          p_block_number: number
          p_previous_hash: string
          p_transaction_data: Json
        }
        Returns: string
      }
      generate_transaction_address: {
        Args: { p_type?: string; p_user_id: string }
        Returns: string
      }
      generate_wallet_address: { Args: { p_prefix?: string }; Returns: string }
      get_user_balance: { Args: { user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_user_action: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type?: string
          p_user_id: string
        }
        Returns: string
      }
      transfer_between_users: {
        Args: {
          p_amount: number
          p_currency?: string
          p_from_user_id: string
          p_note?: string
          p_to_user_id: string
        }
        Returns: Json
      }
      withdraw_imch: {
        Args: { p_amount: number; p_payment_method?: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
