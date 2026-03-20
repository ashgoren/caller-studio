export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      choreographers: {
        Row: {
          created_at: string
          id: number
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      dance_types: {
        Row: {
          id: number
          name: string
          sort_order: number
        }
        Insert: {
          id?: number
          name: string
          sort_order: number
        }
        Update: {
          id?: number
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      dances: {
        Row: {
          created_at: string
          dance_type_id: number | null
          difficulty: number | null
          figures: Json
          formation_id: number | null
          id: number
          notes: string | null
          place_in_program: string | null
          progression_id: number | null
          title: string
          url: string | null
          user_id: string
          video: string | null
          walkthrough: string | null
        }
        Insert: {
          created_at?: string
          dance_type_id?: number | null
          difficulty?: number | null
          figures?: Json
          formation_id?: number | null
          id?: number
          notes?: string | null
          place_in_program?: string | null
          progression_id?: number | null
          title: string
          url?: string | null
          user_id?: string
          video?: string | null
          walkthrough?: string | null
        }
        Update: {
          created_at?: string
          dance_type_id?: number | null
          difficulty?: number | null
          figures?: Json
          formation_id?: number | null
          id?: number
          notes?: string | null
          place_in_program?: string | null
          progression_id?: number | null
          title?: string
          url?: string | null
          user_id?: string
          video?: string | null
          walkthrough?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dances_dance_type_id_fkey"
            columns: ["dance_type_id"]
            isOneToOne: false
            referencedRelation: "dance_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dances_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dances_progression_id_fkey"
            columns: ["progression_id"]
            isOneToOne: false
            referencedRelation: "progressions"
            referencedColumns: ["id"]
          },
        ]
      }
      dances_choreographers: {
        Row: {
          choreographer_id: number
          created_at: string
          dance_id: number
          id: number
        }
        Insert: {
          choreographer_id: number
          created_at?: string
          dance_id: number
          id?: number
        }
        Update: {
          choreographer_id?: number
          created_at?: string
          dance_id?: number
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "dances_choreographers_choreographer_id_fkey"
            columns: ["choreographer_id"]
            isOneToOne: false
            referencedRelation: "choreographers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dances_choreographers_dance_id_fkey"
            columns: ["dance_id"]
            isOneToOne: false
            referencedRelation: "dances"
            referencedColumns: ["id"]
          },
        ]
      }
      dances_key_moves: {
        Row: {
          created_at: string
          dance_id: number
          id: number
          key_move_id: number
        }
        Insert: {
          created_at?: string
          dance_id: number
          id?: number
          key_move_id: number
        }
        Update: {
          created_at?: string
          dance_id?: number
          id?: number
          key_move_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "dances_key_moves_dance_id_fkey"
            columns: ["dance_id"]
            isOneToOne: false
            referencedRelation: "dances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dances_key_moves_key_move_id_fkey"
            columns: ["key_move_id"]
            isOneToOne: false
            referencedRelation: "key_moves"
            referencedColumns: ["id"]
          },
        ]
      }
      dances_vibes: {
        Row: {
          created_at: string
          dance_id: number
          id: number
          vibe_id: number
        }
        Insert: {
          created_at?: string
          dance_id: number
          id?: number
          vibe_id: number
        }
        Update: {
          created_at?: string
          dance_id?: number
          id?: number
          vibe_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "dances_vibes_dance_id_fkey"
            columns: ["dance_id"]
            isOneToOne: false
            referencedRelation: "dances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dances_vibes_vibe_id_fkey"
            columns: ["vibe_id"]
            isOneToOne: false
            referencedRelation: "vibes"
            referencedColumns: ["id"]
          },
        ]
      }
      formations: {
        Row: {
          id: number
          name: string
          sort_order: number
        }
        Insert: {
          id?: number
          name: string
          sort_order: number
        }
        Update: {
          id?: number
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      key_moves: {
        Row: {
          created_at: string
          id: number
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          date: string | null
          id: number
          location: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          id?: number
          location?: string | null
          notes?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          date?: string | null
          id?: number
          location?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      programs_dances: {
        Row: {
          created_at: string
          dance_id: number
          id: number
          order: number
          program_id: number
        }
        Insert: {
          created_at?: string
          dance_id: number
          id?: number
          order: number
          program_id: number
        }
        Update: {
          created_at?: string
          dance_id?: number
          id?: number
          order?: number
          program_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "programs_dances_dance_id_fkey"
            columns: ["dance_id"]
            isOneToOne: false
            referencedRelation: "dances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_dances_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      progressions: {
        Row: {
          id: number
          name: string
          sort_order: number
        }
        Insert: {
          id?: number
          name: string
          sort_order: number
        }
        Update: {
          id?: number
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      vibes: {
        Row: {
          created_at: string
          id: number
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

