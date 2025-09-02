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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      coberturas: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          lmi: number | null
          policy_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          lmi?: number | null
          policy_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          lmi?: number | null
          policy_id?: string | null
          updated_at?: string | null
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
      colaboradores: {
        Row: {
          cargo: string | null
          centro_custo: string | null
          cpf: string
          created_at: string
          custo_mensal: number | null
          data_admissao: string | null
          data_demissao: string | null
          data_nascimento: string | null
          email: string | null
          empresa_id: string | null
          id: string
          nome: string
          observacoes: string | null
          status: Database["public"]["Enums"]["colaborador_status"] | null
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cargo?: string | null
          centro_custo?: string | null
          cpf: string
          created_at?: string
          custo_mensal?: number | null
          data_admissao?: string | null
          data_demissao?: string | null
          data_nascimento?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["colaborador_status"] | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cargo?: string | null
          centro_custo?: string | null
          cpf?: string
          created_at?: string
          custo_mensal?: number | null
          data_admissao?: string | null
          data_demissao?: string | null
          data_nascimento?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["colaborador_status"] | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores_historico: {
        Row: {
          acao: string
          colaborador_id: string | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          observacoes: string | null
          usuario_responsavel: string | null
        }
        Insert: {
          acao: string
          colaborador_id?: string | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          observacoes?: string | null
          usuario_responsavel?: string | null
        }
        Update: {
          acao?: string
          colaborador_id?: string | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          observacoes?: string | null
          usuario_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_historico_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
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
      dependentes: {
        Row: {
          colaborador_id: string | null
          cpf: string
          created_at: string
          custo_mensal: number | null
          data_nascimento: string
          documentos_anexos: string[] | null
          grau_parentesco: Database["public"]["Enums"]["grau_parentesco"]
          id: string
          nome: string
          status: Database["public"]["Enums"]["colaborador_status"] | null
          updated_at: string
        }
        Insert: {
          colaborador_id?: string | null
          cpf: string
          created_at?: string
          custo_mensal?: number | null
          data_nascimento: string
          documentos_anexos?: string[] | null
          grau_parentesco: Database["public"]["Enums"]["grau_parentesco"]
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["colaborador_status"] | null
          updated_at?: string
        }
        Update: {
          colaborador_id?: string | null
          cpf?: string
          created_at?: string
          custo_mensal?: number | null
          data_nascimento?: string
          documentos_anexos?: string[] | null
          grau_parentesco?: Database["public"]["Enums"]["grau_parentesco"]
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["colaborador_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dependentes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          cnpj: string | null
          contato_rh_email: string | null
          contato_rh_nome: string | null
          contato_rh_telefone: string | null
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          contato_rh_email?: string | null
          contato_rh_nome?: string | null
          contato_rh_telefone?: string | null
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          contato_rh_email?: string | null
          contato_rh_nome?: string | null
          contato_rh_telefone?: string | null
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
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
      planilhas_uploads: {
        Row: {
          caminho_storage: string
          colaboradores_importados: number | null
          created_at: string
          data_processamento: string | null
          data_upload: string
          dependentes_importados: number | null
          empresa_id: string | null
          id: string
          nome_arquivo: string
          status: string
          tamanho_arquivo: number
          tipo_arquivo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          caminho_storage: string
          colaboradores_importados?: number | null
          created_at?: string
          data_processamento?: string | null
          data_upload?: string
          dependentes_importados?: number | null
          empresa_id?: string | null
          id?: string
          nome_arquivo: string
          status?: string
          tamanho_arquivo: number
          tipo_arquivo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          caminho_storage?: string
          colaboradores_importados?: number | null
          created_at?: string
          data_processamento?: string | null
          data_upload?: string
          dependentes_importados?: number | null
          empresa_id?: string | null
          id?: string
          nome_arquivo?: string
          status?: string
          tamanho_arquivo?: number
          tipo_arquivo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planilhas_uploads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
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
          created_by_extraction: boolean | null
          custo_mensal: number | null
          data_nascimento: string | null
          documento: string | null
          documento_tipo: string | null
          email: string | null
          expiration_date: string | null
          extraction_timestamp: string | null
          extraido_em: string | null
          fim_vigencia: string | null
          forma_pagamento: string | null
          franquia: number | null
          id: string
          inicio_vigencia: string | null
          modelo_veiculo: string | null
          numero_apolice: string | null
          placa: string | null
          policy_status: Database["public"]["Enums"]["policy_status"] | null
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
          created_by_extraction?: boolean | null
          custo_mensal?: number | null
          data_nascimento?: string | null
          documento?: string | null
          documento_tipo?: string | null
          email?: string | null
          expiration_date?: string | null
          extraction_timestamp?: string | null
          extraido_em?: string | null
          fim_vigencia?: string | null
          forma_pagamento?: string | null
          franquia?: number | null
          id?: string
          inicio_vigencia?: string | null
          modelo_veiculo?: string | null
          numero_apolice?: string | null
          placa?: string | null
          policy_status?: Database["public"]["Enums"]["policy_status"] | null
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
          created_by_extraction?: boolean | null
          custo_mensal?: number | null
          data_nascimento?: string | null
          documento?: string | null
          documento_tipo?: string | null
          email?: string | null
          expiration_date?: string | null
          extraction_timestamp?: string | null
          extraido_em?: string | null
          fim_vigencia?: string | null
          forma_pagamento?: string | null
          franquia?: number | null
          id?: string
          inicio_vigencia?: string | null
          modelo_veiculo?: string | null
          numero_apolice?: string | null
          placa?: string | null
          policy_status?: Database["public"]["Enums"]["policy_status"] | null
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
      tickets: {
        Row: {
          canal_origem: string | null
          colaborador_id: string | null
          created_at: string
          dados_solicitacao: Json | null
          data_conclusao: string | null
          data_execucao: string | null
          data_recebimento: string | null
          data_validacao: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          numero_ticket: string
          observacoes_internas: string | null
          operador_responsavel: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          tipo: Database["public"]["Enums"]["ticket_type"]
          titulo: string
          updated_at: string
        }
        Insert: {
          canal_origem?: string | null
          colaborador_id?: string | null
          created_at?: string
          dados_solicitacao?: Json | null
          data_conclusao?: string | null
          data_execucao?: string | null
          data_recebimento?: string | null
          data_validacao?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          numero_ticket: string
          observacoes_internas?: string | null
          operador_responsavel?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          tipo: Database["public"]["Enums"]["ticket_type"]
          titulo: string
          updated_at?: string
        }
        Update: {
          canal_origem?: string | null
          colaborador_id?: string | null
          created_at?: string
          dados_solicitacao?: Json | null
          data_conclusao?: string | null
          data_execucao?: string | null
          data_recebimento?: string | null
          data_validacao?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          numero_ticket?: string
          observacoes_internas?: string | null
          operador_responsavel?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          tipo?: Database["public"]["Enums"]["ticket_type"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
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
      check_and_fix_policy_inconsistencies: {
        Args: Record<PropertyKey, never>
        Returns: {
          fixed: boolean
          issue_type: string
          policy_id: string
        }[]
      }
      delete_policy_completely: {
        Args: { policy_id_param: string }
        Returns: boolean
      }
      delete_user_and_related_data: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      delete_user_completely: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_file_access: {
        Args: { file_path: string }
        Returns: {
          can_access: boolean
          file_owner: string
          reason: string
          user_id: string
        }[]
      }
    }
    Enums: {
      colaborador_status: "ativo" | "inativo" | "pendente"
      grau_parentesco: "conjuge" | "filho" | "filha" | "mae" | "pai" | "outros"
      policy_status:
        | "vigente"
        | "aguardando_emissao"
        | "nao_renovada"
        | "pendente_analise"
      ticket_status:
        | "recebido"
        | "em_validacao"
        | "em_execucao"
        | "concluido"
        | "pendente_cliente"
        | "cancelado"
      ticket_type:
        | "inclusao_dependente"
        | "exclusao_dependente"
        | "duvida_cobertura"
        | "segunda_via_carteirinha"
        | "duvida_geral"
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
      colaborador_status: ["ativo", "inativo", "pendente"],
      grau_parentesco: ["conjuge", "filho", "filha", "mae", "pai", "outros"],
      policy_status: [
        "vigente",
        "aguardando_emissao",
        "nao_renovada",
        "pendente_analise",
      ],
      ticket_status: [
        "recebido",
        "em_validacao",
        "em_execucao",
        "concluido",
        "pendente_cliente",
        "cancelado",
      ],
      ticket_type: [
        "inclusao_dependente",
        "exclusao_dependente",
        "duvida_cobertura",
        "segunda_via_carteirinha",
        "duvida_geral",
      ],
    },
  },
} as const
