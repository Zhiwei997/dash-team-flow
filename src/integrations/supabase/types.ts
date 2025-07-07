export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_type: string
          id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_type: string
          id?: string
          storage_path: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_type?: string
          id?: string
          storage_path?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      group_chat_members: {
        Row: {
          group_chat_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_chat_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_chat_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_members_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chats: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string
          group_chat_id: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_chat_id: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_chat_id?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_leads: {
        Row: {
          city: string | null
          company_name: string | null
          country: string
          created_at: string
          email: string
          full_name: string
          id: string
          occupation: string | null
          phone_number: string | null
          province: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          country?: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          occupation?: string | null
          phone_number?: string | null
          province?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string | null
          country?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          occupation?: string | null
          phone_number?: string | null
          province?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          project_id: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          project_id: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          project_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_activities: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          project_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          project_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          project_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
      property_owner: {
        Row: {
          contact_number: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          location: string | null
          occupation: string | null
          user_id: string | null
        }
        Insert: {
          contact_number?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          location?: string | null
          occupation?: string | null
          user_id?: string | null
        }
        Update: {
          contact_number?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          location?: string | null
          occupation?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stakeholder: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          contact_number: string | null
          email: string | null
          id: string
          location: string
          name: string | null
          occupation: string | null
          submitted_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          contact_number?: string | null
          email?: string | null
          id?: string
          location: string
          name?: string | null
          occupation?: string | null
          submitted_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          contact_number?: string | null
          email?: string | null
          id?: string
          location?: string
          name?: string | null
          occupation?: string | null
          submitted_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      todos: {
        Row: {
          completed: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          project_id: string
          title: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          project_id: string
          title: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      chat_user_details: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          occupation: string | null
          project_id: string | null
          role: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_group_chat_member: {
        Args: { group_chat_id_param: string }
        Returns: boolean
      }
      is_project_member: {
        Args: { project_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
