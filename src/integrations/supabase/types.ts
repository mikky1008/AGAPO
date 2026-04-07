export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_agent_logs: {
        Row: {
          id: string
          senior_id: string
          action: string
          old_priority: string | null
          new_priority: string | null
          score: number | null
          reasoning: string | null
          triggered_by: string | null
          triggered_at: string
        }
        Insert: {
          id?: string
          senior_id: string
          action: string
          old_priority?: string | null
          new_priority?: string | null
          score?: number | null
          reasoning?: string | null
          triggered_by?: string | null
          triggered_at?: string
        }
        Update: {
          id?: string
          senior_id?: string
          action?: string
          old_priority?: string | null
          new_priority?: string | null
          score?: number | null
          reasoning?: string | null
          triggered_by?: string | null
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_logs_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      assistance_records: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          date_given: string
          deleted_at: string | null
          description: string
          given_by: string
          id: string
          senior_id: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          date_given?: string
          deleted_at?: string | null
          description: string
          given_by: string
          id?: string
          senior_id: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          date_given?: string
          deleted_at?: string | null
          description?: string
          given_by?: string
          id?: string
          senior_id?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistance_records_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          assistance_added: boolean
          assistance_completed: boolean
          created_at: string
          email_assistance_added: boolean
          email_assistance_completed: boolean
          email_high_priority: boolean
          email_new_senior: boolean
          high_priority: boolean
          id: string
          new_senior: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          assistance_added?: boolean
          assistance_completed?: boolean
          created_at?: string
          email_assistance_added?: boolean
          email_assistance_completed?: boolean
          email_high_priority?: boolean
          email_new_senior?: boolean
          high_priority?: boolean
          id?: string
          new_senior?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          assistance_added?: boolean
          assistance_completed?: boolean
          created_at?: string
          email_assistance_added?: boolean
          email_assistance_completed?: boolean
          email_high_priority?: boolean
          email_new_senior?: boolean
          high_priority?: boolean
          id?: string
          new_senior?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          senior_id: string | null
          triggered_by: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          senior_id?: string | null
          triggered_by?: string | null
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          senior_id?: string | null
          triggered_by?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seniors: {
        Row: {
          address: string
          age: number
          agent_reasoning: string | null
          birth_date: string
          contact_number: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          emergency_contact: string | null
          first_name: string
          gender: string
          health_status: string
          id: string
          illness_severity: string | null
          illnesses: string[] | null
          income_level: string
          last_aid_date: string | null
          last_name: string
          living_alone: boolean | null
          living_status: string
          photo: string | null
          priority_level: string | null
          priority_score: number | null
          priority_updated_at: string | null
          registered_date: string
          updated_at: string
          with_family: boolean | null
        }
        Insert: {
          address: string
          age: number
          agent_reasoning?: string | null
          birth_date: string
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          emergency_contact?: string | null
          first_name: string
          gender: string
          health_status?: string
          id?: string
          illness_severity?: string | null
          illnesses?: string[] | null
          income_level?: string
          last_aid_date?: string | null
          last_name: string
          living_alone?: boolean | null
          living_status?: string
          photo?: string | null
          priority_level?: string | null
          priority_score?: number | null
          priority_updated_at?: string | null
          registered_date?: string
          updated_at?: string
          with_family?: boolean | null
        }
        Update: {
          address?: string
          age?: number
          agent_reasoning?: string | null
          birth_date?: string
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          emergency_contact?: string | null
          first_name?: string
          gender?: string
          health_status?: string
          id?: string
          illness_severity?: string | null
          illnesses?: string[] | null
          income_level?: string
          last_aid_date?: string | null
          last_name?: string
          living_alone?: boolean | null
          living_status?: string
          photo?: string | null
          priority_level?: string | null
          priority_score?: number | null
          priority_updated_at?: string | null
          registered_date?: string
          updated_at?: string
          with_family?: boolean | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          id: string
          performed_by: string | null
          action: string
          table_name: string
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          logged_at: string
        }
        Insert: {
          id?: string
          performed_by?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          logged_at?: string
        }
        Update: {
          id?: string
          performed_by?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          logged_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_ai_priority: {
        Args: {
          _senior_id: string
          _score: number
          _level: string
          _reasoning: string
          _triggered_by?: string
        }
        Returns: undefined
      }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_all_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          full_name: string | null
          role: string
          is_active: boolean
          created_at: string
        }[]
      }
      restore_senior: {
        Args: { _senior_id: string }
        Returns: undefined
      }
      set_user_role: {
        Args: {
          _target_user_id: string
          _new_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      soft_delete_assistance: {
        Args: { _record_id: string }
        Returns: undefined
      }
      soft_delete_senior: {
        Args: { _senior_id: string }
        Returns: undefined
      }
      toggle_user_active: {
        Args: { _target_user_id: string; _is_active: boolean }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "staff"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "staff"],
    },
  },
} as const