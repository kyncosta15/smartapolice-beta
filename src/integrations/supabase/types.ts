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
      apolices_beneficios: {
        Row: {
          cnpj: string
          created_at: string
          empresa_id: string | null
          fim_vigencia: string
          id: string
          inicio_vigencia: string
          numero_apolice: string
          observacoes: string | null
          quantidade_vidas: number | null
          razao_social: string
          seguradora: string
          status: string | null
          tipo_beneficio: string
          updated_at: string
          user_id: string
          valor_colaborador: number | null
          valor_empresa: number | null
          valor_total: number | null
        }
        Insert: {
          cnpj: string
          created_at?: string
          empresa_id?: string | null
          fim_vigencia: string
          id?: string
          inicio_vigencia: string
          numero_apolice: string
          observacoes?: string | null
          quantidade_vidas?: number | null
          razao_social: string
          seguradora: string
          status?: string | null
          tipo_beneficio: string
          updated_at?: string
          user_id: string
          valor_colaborador?: number | null
          valor_empresa?: number | null
          valor_total?: number | null
        }
        Update: {
          cnpj?: string
          created_at?: string
          empresa_id?: string | null
          fim_vigencia?: string
          id?: string
          inicio_vigencia?: string
          numero_apolice?: string
          observacoes?: string | null
          quantidade_vidas?: number | null
          razao_social?: string
          seguradora?: string
          status?: string | null
          tipo_beneficio?: string
          updated_at?: string
          user_id?: string
          valor_colaborador?: number | null
          valor_empresa?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "apolices_beneficios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          created_at: string
          created_by: string | null
          document: string | null
          document_type: string | null
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          status: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          document?: string | null
          document_type?: string | null
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          document?: string | null
          document_type?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
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
          {
            foreignKeyName: "coberturas_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_ui"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborador_apolice_vinculo: {
        Row: {
          apolice_id: string | null
          colaborador_id: string | null
          created_at: string
          data_exclusao: string | null
          data_inclusao: string
          id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          apolice_id?: string | null
          colaborador_id?: string | null
          created_at?: string
          data_exclusao?: string | null
          data_inclusao?: string
          id?: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          apolice_id?: string | null
          colaborador_id?: string | null
          created_at?: string
          data_exclusao?: string | null
          data_inclusao?: string
          id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_apolice_vinculo_apolice_id_fkey"
            columns: ["apolice_id"]
            isOneToOne: false
            referencedRelation: "apolices_beneficios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborador_apolice_vinculo_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborador_documentos: {
        Row: {
          colaborador_id: string
          created_at: string | null
          id: string
          nome_arquivo: string
          storage_path: string
          tamanho_arquivo: number | null
          tipo_documento: string
          tipo_mime: string | null
          updated_at: string | null
        }
        Insert: {
          colaborador_id: string
          created_at?: string | null
          id?: string
          nome_arquivo: string
          storage_path: string
          tamanho_arquivo?: number | null
          tipo_documento: string
          tipo_mime?: string | null
          updated_at?: string | null
        }
        Update: {
          colaborador_id?: string
          created_at?: string | null
          id?: string
          nome_arquivo?: string
          storage_path?: string
          tamanho_arquivo?: number | null
          tipo_documento?: string
          tipo_mime?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_documentos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborador_links: {
        Row: {
          ativo: boolean | null
          campos_solicitados: Json
          created_at: string
          descricao: string | null
          empresa_id: string | null
          expira_em: string | null
          id: string
          link_token: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          campos_solicitados?: Json
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          expira_em?: string | null
          id?: string
          link_token: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          campos_solicitados?: Json
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          expira_em?: string | null
          id?: string
          link_token?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_links_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborador_submissoes: {
        Row: {
          created_at: string
          dados_preenchidos: Json
          data_protocolo: string | null
          documentos_anexados: Json | null
          id: string
          ip_origem: string | null
          link_id: string | null
          numero_protocolo: string | null
          observacoes: string | null
          status: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          dados_preenchidos?: Json
          data_protocolo?: string | null
          documentos_anexados?: Json | null
          id?: string
          ip_origem?: string | null
          link_id?: string | null
          numero_protocolo?: string | null
          observacoes?: string | null
          status?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          dados_preenchidos?: Json
          data_protocolo?: string | null
          documentos_anexados?: Json | null
          id?: string
          ip_origem?: string | null
          link_id?: string | null
          numero_protocolo?: string | null
          observacoes?: string | null
          status?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_submissoes_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "colaborador_links"
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
      companies: {
        Row: {
          cnpj: string
          created_at: string | null
          id: string
          legal_name: string
          trade_name: string | null
        }
        Insert: {
          cnpj: string
          created_at?: string | null
          id?: string
          legal_name: string
          trade_name?: string | null
        }
        Update: {
          cnpj?: string
          created_at?: string | null
          id?: string
          legal_name?: string
          trade_name?: string | null
        }
        Relationships: []
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
      delete_requests: {
        Row: {
          context_id: string
          contexto: string
          created_at: string
          id: string
          motivo: string
          requested_by: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          context_id: string
          contexto: string
          created_at?: string
          id?: string
          motivo: string
          requested_by: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          context_id?: string
          contexto?: string
          created_at?: string
          id?: string
          motivo?: string
          requested_by?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
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
      dependents: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string | null
          employee_id: string | null
          full_name: string
          id: string
          relationship: string | null
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          employee_id?: string | null
          full_name: string
          id?: string
          relationship?: string | null
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          employee_id?: string | null
          full_name?: string
          id?: string
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dependents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_plans: {
        Row: {
          created_at: string | null
          employee_id: string | null
          end_date: string | null
          id: string
          monthly_premium: number
          plan_id: string | null
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          monthly_premium: number
          plan_id?: string | null
          start_date: string
          status?: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          monthly_premium?: number
          plan_id?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_plans_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          birth_date: string | null
          company_id: string
          cpf: string
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          status: string
        }
        Insert: {
          birth_date?: string | null
          company_id: string
          cpf: string
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          status?: string
        }
        Update: {
          birth_date?: string | null
          company_id?: string
          cpf?: string
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          status?: string
        }
        Relationships: []
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
      files: {
        Row: {
          created_at: string | null
          id: string
          mime_type: string | null
          original_name: string | null
          path: string
          request_id: string | null
          size: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mime_type?: string | null
          original_name?: string | null
          path: string
          request_id?: string | null
          size?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mime_type?: string | null
          original_name?: string | null
          path?: string
          request_id?: string | null
          size?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "files_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      frota_documentos: {
        Row: {
          created_at: string
          id: string
          nome_arquivo: string
          origem: string
          tamanho_arquivo: number | null
          tipo: string
          tipo_mime: string | null
          url: string
          veiculo_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_arquivo: string
          origem?: string
          tamanho_arquivo?: number | null
          tipo: string
          tipo_mime?: string | null
          url: string
          veiculo_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_arquivo?: string
          origem?: string
          tamanho_arquivo?: number | null
          tipo?: string
          tipo_mime?: string | null
          url?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "frota_documentos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      frota_pagamentos: {
        Row: {
          created_at: string
          id: string
          observacoes: string | null
          status: string
          tipo: string
          updated_at: string
          valor: number
          veiculo_id: string
          vencimento: string
        }
        Insert: {
          created_at?: string
          id?: string
          observacoes?: string | null
          status?: string
          tipo: string
          updated_at?: string
          valor: number
          veiculo_id: string
          vencimento: string
        }
        Update: {
          created_at?: string
          id?: string
          observacoes?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
          veiculo_id?: string
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "frota_pagamentos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      frota_responsaveis: {
        Row: {
          cnh_numero: string | null
          cnh_url: string | null
          cnh_validade: string | null
          created_at: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          veiculo_id: string
        }
        Insert: {
          cnh_numero?: string | null
          cnh_url?: string | null
          cnh_validade?: string | null
          created_at?: string
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          veiculo_id: string
        }
        Update: {
          cnh_numero?: string | null
          cnh_url?: string | null
          cnh_validade?: string | null
          created_at?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "frota_responsaveis_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      frota_veiculos: {
        Row: {
          ano_modelo: number | null
          categoria: string | null
          chassi: string | null
          codigo: string | null
          consorcio_cota: string | null
          consorcio_grupo: string | null
          consorcio_taxa_adm: number | null
          created_at: string
          data_venc_emplacamento: string | null
          data_venc_ultima_parcela: string | null
          empresa_id: string
          id: string
          localizacao: string | null
          marca: string | null
          modalidade_compra: string | null
          modelo: string | null
          observacoes: string | null
          origem_planilha: string | null
          percentual_tabela: number | null
          placa: string
          preco_fipe: number | null
          preco_nf: number | null
          proprietario_doc: string | null
          proprietario_nome: string | null
          proprietario_tipo: string | null
          renavam: string | null
          status_seguro: string | null
          uf_emplacamento: string | null
          updated_at: string
        }
        Insert: {
          ano_modelo?: number | null
          categoria?: string | null
          chassi?: string | null
          codigo?: string | null
          consorcio_cota?: string | null
          consorcio_grupo?: string | null
          consorcio_taxa_adm?: number | null
          created_at?: string
          data_venc_emplacamento?: string | null
          data_venc_ultima_parcela?: string | null
          empresa_id: string
          id?: string
          localizacao?: string | null
          marca?: string | null
          modalidade_compra?: string | null
          modelo?: string | null
          observacoes?: string | null
          origem_planilha?: string | null
          percentual_tabela?: number | null
          placa: string
          preco_fipe?: number | null
          preco_nf?: number | null
          proprietario_doc?: string | null
          proprietario_nome?: string | null
          proprietario_tipo?: string | null
          renavam?: string | null
          status_seguro?: string | null
          uf_emplacamento?: string | null
          updated_at?: string
        }
        Update: {
          ano_modelo?: number | null
          categoria?: string | null
          chassi?: string | null
          codigo?: string | null
          consorcio_cota?: string | null
          consorcio_grupo?: string | null
          consorcio_taxa_adm?: number | null
          created_at?: string
          data_venc_emplacamento?: string | null
          data_venc_ultima_parcela?: string | null
          empresa_id?: string
          id?: string
          localizacao?: string | null
          marca?: string | null
          modalidade_compra?: string | null
          modelo?: string | null
          observacoes?: string | null
          origem_planilha?: string | null
          percentual_tabela?: number | null
          placa?: string
          preco_fipe?: number | null
          preco_nf?: number | null
          proprietario_doc?: string | null
          proprietario_nome?: string | null
          proprietario_tipo?: string | null
          renavam?: string | null
          status_seguro?: string | null
          uf_emplacamento?: string | null
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
            foreignKeyName: "fk_installments_policy_id"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_ui"
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
            foreignKeyName: "installments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_ui"
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
          {
            foreignKeyName: "parcelas_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_ui"
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
      plans: {
        Row: {
          base_monthly_cost: number | null
          created_at: string | null
          id: string
          name: string
          operator: string
          type: string
        }
        Insert: {
          base_monthly_cost?: number | null
          created_at?: string | null
          id?: string
          name: string
          operator: string
          type: string
        }
        Update: {
          base_monthly_cost?: number | null
          created_at?: string | null
          id?: string
          name?: string
          operator?: string
          type?: string
        }
        Relationships: []
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
          file_hash: string | null
          fim_vigencia: string | null
          forma_pagamento: string | null
          franquia: number | null
          id: string
          inicio_vigencia: string | null
          last_audit_id: string | null
          modelo_veiculo: string | null
          numero_apolice: string | null
          placa: string | null
          policy_status: Database["public"]["Enums"]["policy_status"] | null
          quantidade_parcelas: number | null
          responsavel_nome: string | null
          responsavel_user_id: string | null
          segurado: string | null
          seguradora: string | null
          seguradora_empresa: string | null
          seguradora_entidade: string | null
          status: string | null
          telefone: string | null
          tipo_categoria: string | null
          tipo_cobertura: string | null
          tipo_seguro: string | null
          uf: string | null
          user_id: string
          valor_mensal_num: number | null
          valor_parcela: number | null
          valor_premio: number | null
          version_number: number | null
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
          file_hash?: string | null
          fim_vigencia?: string | null
          forma_pagamento?: string | null
          franquia?: number | null
          id?: string
          inicio_vigencia?: string | null
          last_audit_id?: string | null
          modelo_veiculo?: string | null
          numero_apolice?: string | null
          placa?: string | null
          policy_status?: Database["public"]["Enums"]["policy_status"] | null
          quantidade_parcelas?: number | null
          responsavel_nome?: string | null
          responsavel_user_id?: string | null
          segurado?: string | null
          seguradora?: string | null
          seguradora_empresa?: string | null
          seguradora_entidade?: string | null
          status?: string | null
          telefone?: string | null
          tipo_categoria?: string | null
          tipo_cobertura?: string | null
          tipo_seguro?: string | null
          uf?: string | null
          user_id: string
          valor_mensal_num?: number | null
          valor_parcela?: number | null
          valor_premio?: number | null
          version_number?: number | null
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
          file_hash?: string | null
          fim_vigencia?: string | null
          forma_pagamento?: string | null
          franquia?: number | null
          id?: string
          inicio_vigencia?: string | null
          last_audit_id?: string | null
          modelo_veiculo?: string | null
          numero_apolice?: string | null
          placa?: string | null
          policy_status?: Database["public"]["Enums"]["policy_status"] | null
          quantidade_parcelas?: number | null
          responsavel_nome?: string | null
          responsavel_user_id?: string | null
          segurado?: string | null
          seguradora?: string | null
          seguradora_empresa?: string | null
          seguradora_entidade?: string | null
          status?: string | null
          telefone?: string | null
          tipo_categoria?: string | null
          tipo_cobertura?: string | null
          tipo_seguro?: string | null
          uf?: string | null
          user_id?: string
          valor_mensal_num?: number | null
          valor_parcela?: number | null
          valor_premio?: number | null
          version_number?: number | null
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
      policy_audit: {
        Row: {
          changed_fields: string[] | null
          created_at: string
          created_by: string | null
          data_after: Json | null
          data_before: Json | null
          file_hash: string | null
          id: string
          operation: string
          policy_id: string
          user_id: string
          version_number: number
        }
        Insert: {
          changed_fields?: string[] | null
          created_at?: string
          created_by?: string | null
          data_after?: Json | null
          data_before?: Json | null
          file_hash?: string | null
          id?: string
          operation: string
          policy_id: string
          user_id: string
          version_number?: number
        }
        Update: {
          changed_fields?: string[] | null
          created_at?: string
          created_by?: string | null
          data_after?: Json | null
          data_before?: Json | null
          file_hash?: string | null
          id?: string
          operation?: string
          policy_id?: string
          user_id?: string
          version_number?: number
        }
        Relationships: []
      }
      policy_confirmed_fields: {
        Row: {
          confirmed_at: string
          confirmed_by: string | null
          field_name: string
          field_value: string
          id: string
          policy_id: string
        }
        Insert: {
          confirmed_at?: string
          confirmed_by?: string | null
          field_name: string
          field_value: string
          id?: string
          policy_id: string
        }
        Update: {
          confirmed_at?: string
          confirmed_by?: string | null
          field_name?: string
          field_value?: string
          id?: string
          policy_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          department: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      public_request_tokens: {
        Row: {
          created_at: string | null
          employee_id: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_request_tokens_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      public_sessions: {
        Row: {
          employee_id: string | null
          id: string
          ip: unknown | null
          last_seen_at: string | null
          started_at: string | null
          user_agent: string | null
        }
        Insert: {
          employee_id?: string | null
          id?: string
          ip?: unknown | null
          last_seen_at?: string | null
          started_at?: string | null
          user_agent?: string | null
        }
        Update: {
          employee_id?: string | null
          id?: string
          ip?: unknown | null
          last_seen_at?: string | null
          started_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      request_approvals: {
        Row: {
          created_at: string | null
          decided_at: string | null
          decided_by: string | null
          decision: string
          id: string
          note: string | null
          request_id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision: string
          id?: string
          note?: string | null
          request_id: string
          role: string
        }
        Update: {
          created_at?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision?: string
          id?: string
          note?: string | null
          request_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_approvals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_items: {
        Row: {
          action: string
          created_at: string | null
          dependent_id: string | null
          id: string
          notes: string | null
          request_id: string | null
          target: string
        }
        Insert: {
          action: string
          created_at?: string | null
          dependent_id?: string | null
          id?: string
          notes?: string | null
          request_id?: string | null
          target: string
        }
        Update: {
          action?: string
          created_at?: string | null
          dependent_id?: string | null
          id?: string
          notes?: string | null
          request_id?: string | null
          target?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_items_dependent_id_fkey"
            columns: ["dependent_id"]
            isOneToOne: false
            referencedRelation: "dependents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_tickets: {
        Row: {
          created_at: string | null
          external_ref: string | null
          id: string
          payload: Json
          protocol_code: string
          request_id: string | null
          rh_note: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          external_ref?: string | null
          id?: string
          payload: Json
          protocol_code: string
          request_id?: string | null
          rh_note?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          external_ref?: string | null
          id?: string
          payload?: Json
          protocol_code?: string
          request_id?: string | null
          rh_note?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      requests: {
        Row: {
          channel: string | null
          created_at: string | null
          draft: boolean | null
          employee_id: string | null
          id: string
          kind: string
          metadata: Json | null
          protocol_code: string
          session_id: string | null
          status: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          draft?: boolean | null
          employee_id?: string | null
          id?: string
          kind: string
          metadata?: Json | null
          protocol_code: string
          session_id?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          draft?: boolean | null
          employee_id?: string | null
          id?: string
          kind?: string
          metadata?: Json | null
          protocol_code?: string
          session_id?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "public_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_tokens: {
        Row: {
          created_at: string | null
          employee_id: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          session_id: string | null
          token: string
          used_at: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          token: string
          used_at?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          token?: string
          used_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_tokens_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_tokens_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "public_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_rate_limits: {
        Row: {
          blocked_until: string | null
          employee_cpf: string | null
          first_attempt_at: string | null
          id: string
          ip_address: unknown
          last_attempt_at: string | null
          submission_count: number | null
        }
        Insert: {
          blocked_until?: string | null
          employee_cpf?: string | null
          first_attempt_at?: string | null
          id?: string
          ip_address: unknown
          last_attempt_at?: string | null
          submission_count?: number | null
        }
        Update: {
          blocked_until?: string | null
          employee_cpf?: string | null
          first_attempt_at?: string | null
          id?: string
          ip_address?: unknown
          last_attempt_at?: string | null
          submission_count?: number | null
        }
        Relationships: []
      }
      ticket_attachments: {
        Row: {
          created_at: string
          file_path: string
          file_url: string | null
          id: string
          nome_arquivo: string
          tamanho_arquivo: number | null
          ticket_id: string | null
          tipo: string
          tipo_mime: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          file_url?: string | null
          id?: string
          nome_arquivo: string
          tamanho_arquivo?: number | null
          ticket_id?: string | null
          tipo: string
          tipo_mime?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          file_url?: string | null
          id?: string
          nome_arquivo?: string
          tamanho_arquivo?: number | null
          ticket_id?: string | null
          tipo?: string
          tipo_mime?: string | null
          vehicle_id?: string | null
        }
        Relationships: []
      }
      ticket_movements: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          payload: Json | null
          ticket_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          payload?: Json | null
          ticket_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          payload?: Json | null
          ticket_id?: string
          tipo?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          apolice_id: string | null
          created_at: string | null
          created_by: string | null
          data_evento: string | null
          empresa_id: string | null
          external_ref: string | null
          id: string
          localizacao: string | null
          origem: string | null
          payload: Json
          protocol_code: string
          request_id: string | null
          rh_note: string | null
          status: string
          subtipo: string | null
          tipo: string | null
          updated_at: string | null
          valor_estimado: number | null
          vehicle_id: string | null
        }
        Insert: {
          apolice_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_evento?: string | null
          empresa_id?: string | null
          external_ref?: string | null
          id?: string
          localizacao?: string | null
          origem?: string | null
          payload: Json
          protocol_code: string
          request_id?: string | null
          rh_note?: string | null
          status?: string
          subtipo?: string | null
          tipo?: string | null
          updated_at?: string | null
          valor_estimado?: number | null
          vehicle_id?: string | null
        }
        Update: {
          apolice_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_evento?: string | null
          empresa_id?: string | null
          external_ref?: string | null
          id?: string
          localizacao?: string | null
          origem?: string | null
          payload?: Json
          protocol_code?: string
          request_id?: string | null
          rh_note?: string | null
          status?: string
          subtipo?: string | null
          tipo?: string | null
          updated_at?: string | null
          valor_estimado?: number | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          photo_path: string | null
          photo_url: string | null
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
          photo_path?: string | null
          photo_url?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          photo_path?: string | null
          photo_url?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar: string | null
          avatar_url: string | null
          classification: string | null
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
          avatar_url?: string | null
          classification?: string | null
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
          avatar_url?: string | null
          classification?: string | null
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
      policies_ui: {
        Row: {
          created_at: string | null
          end_date: string | null
          expiration_date: string | null
          extraction_timestamp: string | null
          id: string | null
          name: string | null
          pdf_path: string | null
          placa: string | null
          policy_number: string | null
          seguradora_empresa: string | null
          seguradora_entidade: string | null
          start_date: string | null
          status: string | null
          tipo_categoria: string | null
          tipo_cobertura: string | null
          user_id: string | null
          valor_mensal: number | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          expiration_date?: string | null
          extraction_timestamp?: string | null
          id?: string | null
          name?: string | null
          pdf_path?: string | null
          placa?: string | null
          policy_number?: string | null
          seguradora_empresa?: never
          seguradora_entidade?: string | null
          start_date?: string | null
          status?: never
          tipo_categoria?: never
          tipo_cobertura?: never
          user_id?: string | null
          valor_mensal?: never
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          expiration_date?: string | null
          extraction_timestamp?: string | null
          id?: string | null
          name?: string | null
          pdf_path?: string | null
          placa?: string | null
          policy_number?: string | null
          seguradora_empresa?: never
          seguradora_entidade?: string | null
          start_date?: string | null
          status?: never
          tipo_categoria?: never
          tipo_cobertura?: never
          user_id?: string | null
          valor_mensal?: never
        }
        Relationships: [
          {
            foreignKeyName: "policies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auto_fix_frota_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      can_access_requests: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
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
      fix_categoria_outros_to_sem_seguro: {
        Args: Record<PropertyKey, never>
        Returns: {
          error: string
          message: string
          placas_alteradas: string[]
          success: boolean
          veiculos_atualizados: number
        }[]
      }
      fix_frota_status_outros: {
        Args: Record<PropertyKey, never>
        Returns: {
          placas_alteradas: string[]
          veiculos_atualizados: number
        }[]
      }
      generate_file_hash: {
        Args: { file_content: string }
        Returns: string
      }
      generate_protocol_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_session_token: {
        Args: {
          p_employee_id: string
          p_ip_address: unknown
          p_user_agent?: string
        }
        Returns: {
          expires_at: string
          session_id: string
          token: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      rh_employee_request: {
        Args: {
          employee_data: Json
          observacoes?: string
          request_kind: string
        }
        Returns: Json
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
      validate_session_token: {
        Args: { p_token: string }
        Returns: {
          employee_id: string
          session_id: string
          valid: boolean
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
