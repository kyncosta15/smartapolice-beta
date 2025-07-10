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
      coberturas: {
        Row: {
          descricao: string | null
          id: string
          lmi: number | null
          policy_id: string | null
        }
        Insert: {
          descricao?: string | null
          id?: string
          lmi?: number | null
          policy_id?: string | null
        }
        Update: {
          descricao?: string | null
          id?: string
          lmi?: number | null
          policy_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coberturas_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_exports: {
        Row: {
          created_at: string
          dashboard_type: string | null
          export_date: string
          export_time: string
          file_name: string
          file_size_kb: number | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dashboard_type?: string | null
          export_date?: string
          export_time?: string
          file_name: string
          file_size_kb?: number | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dashboard_type?: string | null
          export_date?: string
          export_time?: string
          file_name?: string
          file_size_kb?: number | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      installments: {
        Row: {
          created_at: string | null
          data_vencimento: string | null
          id: string
          numero_parcela: number | null
          policy_id: string | null
          status: string | null
          user_id: string
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          data_vencimento?: string | null
          id?: string
          numero_parcela?: number | null
          policy_id?: string | null
          status?: string | null
          user_id: string
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          data_vencimento?: string | null
          id?: string
          numero_parcela?: number | null
          policy_id?: string | null
          status?: string | null
          user_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_installments_policy_id"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_projections: {
        Row: {
          actual_cost: number | null
          created_at: string
          id: string
          month: number
          projected_cost: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          actual_cost?: number | null
          created_at?: string
          id?: string
          month: number
          projected_cost?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          actual_cost?: number | null
          created_at?: string
          id?: string
          month?: number
          projected_cost?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_projections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      parcelas: {
        Row: {
          created_at: string | null
          data: string | null
          id: string
          numero: number | null
          policy_id: string | null
          status: string | null
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          id?: string
          numero?: number | null
          policy_id?: string | null
          status?: string | null
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          data?: string | null
          id?: string
          numero?: number | null
          policy_id?: string | null
          status?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parcelas_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          ano_modelo: string | null
          arquivo_url: string | null
          cidade: string | null
          condutor_principal: string | null
          corretora: string | null
          created_at: string | null
          custo_mensal: number | null
          data_nascimento: string | null
          documento: string | null
          documento_tipo: string | null
          email: string | null
          extraido_em: string | null
          fim_vigencia: string | null
          forma_pagamento: string | null
          franquia: number | null
          id: string
          inicio_vigencia: string | null
          modelo_veiculo: string | null
          numero_apolice: string | null
          placa: string | null
          quantidade_parcelas: number | null
          responsavel_nome: string | null
          responsavel_user_id: string | null
          segurado: string | null
          seguradora: string | null
          status: string | null
          telefone: string | null
          tipo_seguro: string | null
          uf: string | null
          user_id: string
          valor_parcela: number | null
          valor_premio: number | null
        }
        Insert: {
          ano_modelo?: string | null
          arquivo_url?: string | null
          cidade?: string | null
          condutor_principal?: string | null
          corretora?: string | null
          created_at?: string | null
          custo_mensal?: number | null
          data_nascimento?: string | null
          documento?: string | null
          documento_tipo?: string | null
          email?: string | null
          extraido_em?: string | null
          fim_vigencia?: string | null
          forma_pagamento?: string | null
          franquia?: number | null
          id?: string
          inicio_vigencia?: string | null
          modelo_veiculo?: string | null
          numero_apolice?: string | null
          placa?: string | null
          quantidade_parcelas?: number | null
          responsavel_nome?: string | null
          responsavel_user_id?: string | null
          segurado?: string | null
          seguradora?: string | null
          status?: string | null
          telefone?: string | null
          tipo_seguro?: string | null
          uf?: string | null
          user_id: string
          valor_parcela?: number | null
          valor_premio?: number | null
        }
        Update: {
          ano_modelo?: string | null
          arquivo_url?: string | null
          cidade?: string | null
          condutor_principal?: string | null
          corretora?: string | null
          created_at?: string | null
          custo_mensal?: number | null
          data_nascimento?: string | null
          documento?: string | null
          documento_tipo?: string | null
          email?: string | null
          extraido_em?: string | null
          fim_vigencia?: string | null
          forma_pagamento?: string | null
          franquia?: number | null
          id?: string
          inicio_vigencia?: string | null
          modelo_veiculo?: string | null
          numero_apolice?: string | null
          placa?: string | null
          quantidade_parcelas?: number | null
          responsavel_nome?: string | null
          responsavel_user_id?: string | null
          segurado?: string | null
          seguradora?: string | null
          status?: string | null
          telefone?: string | null
          tipo_seguro?: string | null
          uf?: string | null
          user_id?: string
          valor_parcela?: number | null
          valor_premio?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_responsavel_user_id_fkey"
            columns: ["responsavel_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar: string | null
          company: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          password_hash: string
          phone: string | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          password_hash: string
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          password_hash?: string
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_file_access: {
        Args: { file_path: string }
        Returns: {
          can_access: boolean
          user_id: string
          file_owner: string
          reason: string
        }[]
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
