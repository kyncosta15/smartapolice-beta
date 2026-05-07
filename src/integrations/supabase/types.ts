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
      apolice_parcelas: {
        Row: {
          apolice_id: string
          created_at: string
          id: string
          numero_parcela: number
          status_pagamento: string
          valor: number
          vencimento: string
        }
        Insert: {
          apolice_id: string
          created_at?: string
          id?: string
          numero_parcela: number
          status_pagamento?: string
          valor: number
          vencimento: string
        }
        Update: {
          apolice_id?: string
          created_at?: string
          id?: string
          numero_parcela?: number
          status_pagamento?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "apolice_parcelas_apolice_id_fkey"
            columns: ["apolice_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apolice_parcelas_apolice_id_fkey"
            columns: ["apolice_id"]
            isOneToOne: false
            referencedRelation: "policies_ui"
            referencedColumns: ["id"]
          },
        ]
      }
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
      apolices_corpnuvem: {
        Row: {
          cancelado: string | null
          cliente_codigo: number | null
          cliente_documento: string
          cliente_nome: string | null
          codfil: number | null
          created_at: string | null
          dados_completos: Json | null
          dat_inc: string | null
          fimvig: string | null
          historico_imagem: number | null
          id: string
          inivig: string | null
          nosnum: number
          nosnum_ren: number | null
          numapo: string | null
          numend: string | null
          ramo: string | null
          renovacao_situacao: number | null
          seguradora: string | null
          sin_situacao: number | null
          tipdoc: string | null
          ultima_sincronizacao: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancelado?: string | null
          cliente_codigo?: number | null
          cliente_documento: string
          cliente_nome?: string | null
          codfil?: number | null
          created_at?: string | null
          dados_completos?: Json | null
          dat_inc?: string | null
          fimvig?: string | null
          historico_imagem?: number | null
          id?: string
          inivig?: string | null
          nosnum: number
          nosnum_ren?: number | null
          numapo?: string | null
          numend?: string | null
          ramo?: string | null
          renovacao_situacao?: number | null
          seguradora?: string | null
          sin_situacao?: number | null
          tipdoc?: string | null
          ultima_sincronizacao?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancelado?: string | null
          cliente_codigo?: number | null
          cliente_documento?: string
          cliente_nome?: string | null
          codfil?: number | null
          created_at?: string | null
          dados_completos?: Json | null
          dat_inc?: string | null
          fimvig?: string | null
          historico_imagem?: number | null
          id?: string
          inivig?: string | null
          nosnum?: number
          nosnum_ren?: number | null
          numapo?: string | null
          numend?: string | null
          ramo?: string | null
          renovacao_situacao?: number | null
          seguradora?: string | null
          sin_situacao?: number | null
          tipdoc?: string | null
          ultima_sincronizacao?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          pdf_url: string | null
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
          pdf_url?: string | null
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
          pdf_url?: string | null
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
      company_import_settings: {
        Row: {
          allowed_fields: Json | null
          auto_fill_enabled: boolean | null
          category_mapping: Json | null
          created_at: string | null
          empresa_id: string
          id: string
          update_policy: string | null
          updated_at: string | null
        }
        Insert: {
          allowed_fields?: Json | null
          auto_fill_enabled?: boolean | null
          category_mapping?: Json | null
          created_at?: string | null
          empresa_id: string
          id?: string
          update_policy?: string | null
          updated_at?: string | null
        }
        Update: {
          allowed_fields?: Json | null
          auto_fill_enabled?: boolean | null
          category_mapping?: Json | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          update_policy?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      consultoria_casos: {
        Row: {
          client_id: string | null
          cnpjs: string[] | null
          created_at: string
          created_by: string | null
          delivered_at: string | null
          empresa_id: string
          id: string
          modo_layout: string
          perfil: Json
          responsaveis: string[] | null
          revisao_obrigatoria: boolean
          status: string
          tipo_caso: string
          titulo: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          cnpjs?: string[] | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          empresa_id: string
          id?: string
          modo_layout?: string
          perfil?: Json
          responsaveis?: string[] | null
          revisao_obrigatoria?: boolean
          status?: string
          tipo_caso?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          cnpjs?: string[] | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          empresa_id?: string
          id?: string
          modo_layout?: string
          perfil?: Json
          responsaveis?: string[] | null
          revisao_obrigatoria?: boolean
          status?: string
          tipo_caso?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultoria_casos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultoria_casos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      consultoria_config: {
        Row: {
          created_at: string
          criterios: Json
          empresa_id: string
          id: string
          modelo_parecer: string
          premium_ativado_em: string | null
          premium_ativado_por: string | null
          premium_ativo: boolean
          premium_expira_em: string | null
          premium_observacao: string | null
          prompt_mestre: string
          tom_voz: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criterios?: Json
          empresa_id: string
          id?: string
          modelo_parecer?: string
          premium_ativado_em?: string | null
          premium_ativado_por?: string | null
          premium_ativo?: boolean
          premium_expira_em?: string | null
          premium_observacao?: string | null
          prompt_mestre?: string
          tom_voz?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criterios?: Json
          empresa_id?: string
          id?: string
          modelo_parecer?: string
          premium_ativado_em?: string | null
          premium_ativado_por?: string | null
          premium_ativo?: boolean
          premium_expira_em?: string | null
          premium_observacao?: string | null
          prompt_mestre?: string
          tom_voz?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultoria_config_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      consultoria_documentos: {
        Row: {
          caso_id: string
          cnpj_referencia: string | null
          created_at: string
          empresa_id: string
          id: string
          metadados_extraidos: Json | null
          nome_original: string
          storage_path: string
          tamanho_bytes: number | null
          tipo_documento: string
          uploaded_by: string | null
        }
        Insert: {
          caso_id: string
          cnpj_referencia?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          metadados_extraidos?: Json | null
          nome_original: string
          storage_path: string
          tamanho_bytes?: number | null
          tipo_documento: string
          uploaded_by?: string | null
        }
        Update: {
          caso_id?: string
          cnpj_referencia?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          metadados_extraidos?: Json | null
          nome_original?: string
          storage_path?: string
          tamanho_bytes?: number | null
          tipo_documento?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultoria_documentos_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "consultoria_casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultoria_documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      consultoria_lacunas: {
        Row: {
          categoria: string
          cnpj_referencia: string | null
          created_at: string
          descricao: string | null
          documento_origem_id: string | null
          empresa_id: string
          id: string
          ordem: number | null
          parecer_id: string
          recomendacao: string | null
          severidade: string
          titulo: string
          valor_estimado: number | null
        }
        Insert: {
          categoria: string
          cnpj_referencia?: string | null
          created_at?: string
          descricao?: string | null
          documento_origem_id?: string | null
          empresa_id: string
          id?: string
          ordem?: number | null
          parecer_id: string
          recomendacao?: string | null
          severidade?: string
          titulo: string
          valor_estimado?: number | null
        }
        Update: {
          categoria?: string
          cnpj_referencia?: string | null
          created_at?: string
          descricao?: string | null
          documento_origem_id?: string | null
          empresa_id?: string
          id?: string
          ordem?: number | null
          parecer_id?: string
          recomendacao?: string | null
          severidade?: string
          titulo?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consultoria_lacunas_documento_origem_id_fkey"
            columns: ["documento_origem_id"]
            isOneToOne: false
            referencedRelation: "consultoria_documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultoria_lacunas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultoria_lacunas_parecer_id_fkey"
            columns: ["parecer_id"]
            isOneToOne: false
            referencedRelation: "consultoria_pareceres"
            referencedColumns: ["id"]
          },
        ]
      }
      consultoria_pareceres: {
        Row: {
          caso_id: string
          created_at: string
          economia_anual_estimada: number | null
          empresa_id: string
          estrutura: Json
          ia_modelo: string | null
          ia_tokens_uso: Json | null
          id: string
          oportunidade_capitalizacao_total: number | null
          pdf_storage_path: string | null
          resumo_executivo: string | null
          revisado_em: string | null
          revisado_por: string | null
          status: string
          updated_at: string
          versao: number
        }
        Insert: {
          caso_id: string
          created_at?: string
          economia_anual_estimada?: number | null
          empresa_id: string
          estrutura?: Json
          ia_modelo?: string | null
          ia_tokens_uso?: Json | null
          id?: string
          oportunidade_capitalizacao_total?: number | null
          pdf_storage_path?: string | null
          resumo_executivo?: string | null
          revisado_em?: string | null
          revisado_por?: string | null
          status?: string
          updated_at?: string
          versao?: number
        }
        Update: {
          caso_id?: string
          created_at?: string
          economia_anual_estimada?: number | null
          empresa_id?: string
          estrutura?: Json
          ia_modelo?: string | null
          ia_tokens_uso?: Json | null
          id?: string
          oportunidade_capitalizacao_total?: number | null
          pdf_storage_path?: string | null
          resumo_executivo?: string | null
          revisado_em?: string | null
          revisado_por?: string | null
          status?: string
          updated_at?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "consultoria_pareceres_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "consultoria_casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultoria_pareceres_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
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
      documentos: {
        Row: {
          created_at: string | null
          created_by: string | null
          empresa_id: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          original_name: string | null
          tipo: string
          veiculo_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          empresa_id: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          original_name?: string | null
          tipo: string
          veiculo_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          empresa_id?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          original_name?: string | null
          tipo?: string
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          account_id: string | null
          bucket_name: string
          category: string
          created_at: string
          deleted_at: string | null
          description: string | null
          document_date: string | null
          entity_type: string
          file_extension: string | null
          file_size: number
          id: string
          insurer: string | null
          mime_type: string | null
          original_filename: string
          policy_id: string | null
          storage_path: string
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_by_user_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          account_id?: string | null
          bucket_name?: string
          category?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          document_date?: string | null
          entity_type?: string
          file_extension?: string | null
          file_size?: number
          id?: string
          insurer?: string | null
          mime_type?: string | null
          original_filename: string
          policy_id?: string | null
          storage_path: string
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_by_user_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          account_id?: string | null
          bucket_name?: string
          category?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          document_date?: string | null
          entity_type?: string
          file_extension?: string | null
          file_size?: number
          id?: string
          insurer?: string | null
          mime_type?: string | null
          original_filename?: string
          policy_id?: string | null
          storage_path?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_by_user_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_ui"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
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
          slug: string | null
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
          slug?: string | null
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
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      endosso_parcelas: {
        Row: {
          created_at: string
          endosso_id: string
          id: string
          numero_parcela: number
          status: string
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          created_at?: string
          endosso_id: string
          id?: string
          numero_parcela: number
          status?: string
          updated_at?: string
          valor?: number
          vencimento: string
        }
        Update: {
          created_at?: string
          endosso_id?: string
          id?: string
          numero_parcela?: number
          status?: string
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "endosso_parcelas_endosso_id_fkey"
            columns: ["endosso_id"]
            isOneToOne: false
            referencedRelation: "policy_documents"
            referencedColumns: ["id"]
          },
        ]
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
      fipe_cache: {
        Row: {
          brand: string | null
          created_at: string
          data_consulta: string
          fipe_code: string | null
          fuel: string | null
          fuel_code: number | null
          id: string
          model: string | null
          price_label: string | null
          price_value: number | null
          raw_response: Json | null
          tabela_ref: number
          tenant_id: string
          updated_at: string
          vehicle_id: string
          year_model: number | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          data_consulta?: string
          fipe_code?: string | null
          fuel?: string | null
          fuel_code?: number | null
          id?: string
          model?: string | null
          price_label?: string | null
          price_value?: number | null
          raw_response?: Json | null
          tabela_ref: number
          tenant_id: string
          updated_at?: string
          vehicle_id: string
          year_model?: number | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          data_consulta?: string
          fipe_code?: string | null
          fuel?: string | null
          fuel_code?: number | null
          id?: string
          model?: string | null
          price_label?: string | null
          price_value?: number | null
          raw_response?: Json | null
          tabela_ref?: number
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string
          year_model?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fipe_cache_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_change_requests: {
        Row: {
          anexos: Json
          chassi: string | null
          created_at: string
          empresa_id: string
          id: string
          payload: Json
          placa: string | null
          prioridade: string | null
          renavam: string | null
          status: string
          tipo: string
          updated_at: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          anexos?: Json
          chassi?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          payload?: Json
          placa?: string | null
          prioridade?: string | null
          renavam?: string | null
          status?: string
          tipo: string
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          anexos?: Json
          chassi?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          payload?: Json
          placa?: string | null
          prioridade?: string | null
          renavam?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: []
      }
      fleet_request_documents: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          request_id: string
          uploaded_at: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          request_id: string
          uploaded_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          request_id?: string
          uploaded_at?: string
        }
        Relationships: []
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
          codigo_fipe: string | null
          codigo_interno: string | null
          combustivel: string | null
          consorcio_cota: string | null
          consorcio_grupo: string | null
          consorcio_taxa_adm: number | null
          created_at: string
          created_by: string | null
          current_responsible_contact: string | null
          current_responsible_name: string | null
          current_worksite_name: string | null
          current_worksite_start_date: string | null
          data_venc_emplacamento: string | null
          data_venc_ultima_parcela: string | null
          empresa_id: string
          familia: string | null
          funcao: string | null
          has_assignment_info: boolean
          id: string
          is_stolen_current: boolean
          localizacao: string | null
          marca: string | null
          modalidade_compra: string | null
          modelo: string | null
          observacoes: string | null
          origem_planilha: string | null
          percentual_tabela: number | null
          placa: string | null
          preco_fipe: number | null
          preco_nf: number | null
          proprietario_doc: string | null
          proprietario_nome: string | null
          proprietario_tipo: string | null
          renavam: string | null
          status_seguro: string | null
          status_veiculo: string | null
          stolen_current_date: string | null
          tem_rastreador: boolean
          tipo_veiculo: number | null
          uf_emplacamento: string | null
          updated_at: string
        }
        Insert: {
          ano_modelo?: number | null
          categoria?: string | null
          chassi?: string | null
          codigo?: string | null
          codigo_fipe?: string | null
          codigo_interno?: string | null
          combustivel?: string | null
          consorcio_cota?: string | null
          consorcio_grupo?: string | null
          consorcio_taxa_adm?: number | null
          created_at?: string
          created_by?: string | null
          current_responsible_contact?: string | null
          current_responsible_name?: string | null
          current_worksite_name?: string | null
          current_worksite_start_date?: string | null
          data_venc_emplacamento?: string | null
          data_venc_ultima_parcela?: string | null
          empresa_id: string
          familia?: string | null
          funcao?: string | null
          has_assignment_info?: boolean
          id?: string
          is_stolen_current?: boolean
          localizacao?: string | null
          marca?: string | null
          modalidade_compra?: string | null
          modelo?: string | null
          observacoes?: string | null
          origem_planilha?: string | null
          percentual_tabela?: number | null
          placa?: string | null
          preco_fipe?: number | null
          preco_nf?: number | null
          proprietario_doc?: string | null
          proprietario_nome?: string | null
          proprietario_tipo?: string | null
          renavam?: string | null
          status_seguro?: string | null
          status_veiculo?: string | null
          stolen_current_date?: string | null
          tem_rastreador?: boolean
          tipo_veiculo?: number | null
          uf_emplacamento?: string | null
          updated_at?: string
        }
        Update: {
          ano_modelo?: number | null
          categoria?: string | null
          chassi?: string | null
          codigo?: string | null
          codigo_fipe?: string | null
          codigo_interno?: string | null
          combustivel?: string | null
          consorcio_cota?: string | null
          consorcio_grupo?: string | null
          consorcio_taxa_adm?: number | null
          created_at?: string
          created_by?: string | null
          current_responsible_contact?: string | null
          current_responsible_name?: string | null
          current_worksite_name?: string | null
          current_worksite_start_date?: string | null
          data_venc_emplacamento?: string | null
          data_venc_ultima_parcela?: string | null
          empresa_id?: string
          familia?: string | null
          funcao?: string | null
          has_assignment_info?: boolean
          id?: string
          is_stolen_current?: boolean
          localizacao?: string | null
          marca?: string | null
          modalidade_compra?: string | null
          modelo?: string | null
          observacoes?: string | null
          origem_planilha?: string | null
          percentual_tabela?: number | null
          placa?: string | null
          preco_fipe?: number | null
          preco_nf?: number | null
          proprietario_doc?: string | null
          proprietario_nome?: string | null
          proprietario_tipo?: string | null
          renavam?: string | null
          status_seguro?: string | null
          status_veiculo?: string | null
          stolen_current_date?: string | null
          tem_rastreador?: boolean
          tipo_veiculo?: number | null
          uf_emplacamento?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      guarantee_auth_sessions: {
        Row: {
          created_at: string
          error_message: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          status: string
          token_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          status?: string
          token_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          status?: string
          token_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      guarantee_billing_sync_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          filters_used: Json | null
          id: string
          items_created: number | null
          items_fetched: number | null
          items_updated: number | null
          status: string
          sync_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          filters_used?: Json | null
          id?: string
          items_created?: number | null
          items_fetched?: number | null
          items_updated?: number | null
          status: string
          sync_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          filters_used?: Json | null
          id?: string
          items_created?: number | null
          items_fetched?: number | null
          items_updated?: number | null
          status?: string
          sync_type?: string
          user_id?: string
        }
        Relationships: []
      }
      guarantee_billings: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          bill_url: string | null
          booklet_number: string | null
          cancellation_date: string | null
          created_at: string
          days_overdue: number | null
          discount: number | null
          document_number: string | null
          document_type: string | null
          economic_group: string | null
          expiration_date: string | null
          external_id: string | null
          id: string
          installment_number: number | null
          modality: string | null
          original_expiration_date: string | null
          payment_date: string | null
          policy_number: string | null
          policyholder_document: string | null
          policyholder_name: string | null
          raw_data: Json | null
          status: string | null
          synced_at: string
          updated_at: string
          user_id: string
          write_off_date: string | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          bill_url?: string | null
          booklet_number?: string | null
          cancellation_date?: string | null
          created_at?: string
          days_overdue?: number | null
          discount?: number | null
          document_number?: string | null
          document_type?: string | null
          economic_group?: string | null
          expiration_date?: string | null
          external_id?: string | null
          id?: string
          installment_number?: number | null
          modality?: string | null
          original_expiration_date?: string | null
          payment_date?: string | null
          policy_number?: string | null
          policyholder_document?: string | null
          policyholder_name?: string | null
          raw_data?: Json | null
          status?: string | null
          synced_at?: string
          updated_at?: string
          user_id: string
          write_off_date?: string | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          bill_url?: string | null
          booklet_number?: string | null
          cancellation_date?: string | null
          created_at?: string
          days_overdue?: number | null
          discount?: number | null
          document_number?: string | null
          document_type?: string | null
          economic_group?: string | null
          expiration_date?: string | null
          external_id?: string | null
          id?: string
          installment_number?: number | null
          modality?: string | null
          original_expiration_date?: string | null
          payment_date?: string | null
          policy_number?: string | null
          policyholder_document?: string | null
          policyholder_name?: string | null
          raw_data?: Json | null
          status?: string | null
          synced_at?: string
          updated_at?: string
          user_id?: string
          write_off_date?: string | null
        }
        Relationships: []
      }
      guarantee_endorsements: {
        Row: {
          additional_info: string | null
          broker_name: string | null
          created_at: string
          document_number: number | null
          document_type: string | null
          document_type_id: number | null
          duration_days: number | null
          duration_end: string | null
          duration_start: string | null
          endorsement_secured_amount: number | null
          external_id: number | null
          id: string
          insured_document: string | null
          insured_name: string | null
          main_document_number: number | null
          main_policy_number: string | null
          modality: string | null
          policyholder_document: string | null
          policyholder_name: string | null
          premium_value: number | null
          raw_data: Json | null
          status: string | null
          submodality: string | null
          synced_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_info?: string | null
          broker_name?: string | null
          created_at?: string
          document_number?: number | null
          document_type?: string | null
          document_type_id?: number | null
          duration_days?: number | null
          duration_end?: string | null
          duration_start?: string | null
          endorsement_secured_amount?: number | null
          external_id?: number | null
          id?: string
          insured_document?: string | null
          insured_name?: string | null
          main_document_number?: number | null
          main_policy_number?: string | null
          modality?: string | null
          policyholder_document?: string | null
          policyholder_name?: string | null
          premium_value?: number | null
          raw_data?: Json | null
          status?: string | null
          submodality?: string | null
          synced_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_info?: string | null
          broker_name?: string | null
          created_at?: string
          document_number?: number | null
          document_type?: string | null
          document_type_id?: number | null
          duration_days?: number | null
          duration_end?: string | null
          duration_start?: string | null
          endorsement_secured_amount?: number | null
          external_id?: number | null
          id?: string
          insured_document?: string | null
          insured_name?: string | null
          main_document_number?: number | null
          main_policy_number?: string | null
          modality?: string | null
          policyholder_document?: string | null
          policyholder_name?: string | null
          premium_value?: number | null
          raw_data?: Json | null
          status?: string | null
          submodality?: string | null
          synced_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      guarantee_integration_logs: {
        Row: {
          action: string
          created_at: string
          duration_ms: number | null
          endpoint: string | null
          error_message: string | null
          id: string
          method: string | null
          request_params: Json | null
          response_summary: Json | null
          status_code: number | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          duration_ms?: number | null
          endpoint?: string | null
          error_message?: string | null
          id?: string
          method?: string | null
          request_params?: Json | null
          response_summary?: Json | null
          status_code?: number | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          duration_ms?: number | null
          endpoint?: string | null
          error_message?: string | null
          id?: string
          method?: string | null
          request_params?: Json | null
          response_summary?: Json | null
          status_code?: number | null
          user_id?: string
        }
        Relationships: []
      }
      guarantee_policies: {
        Row: {
          bill_url: string | null
          cancellation_date: string | null
          commission_value: number | null
          created_at: string | null
          document_number: number | null
          document_url: string | null
          duration_days: number | null
          duration_end: string | null
          duration_end_current: string | null
          duration_start: string | null
          economic_group: string | null
          external_id: number | null
          id: string
          insured_amount: number | null
          insured_amount_current: number | null
          insured_document: string | null
          insured_name: string | null
          is_renewal: boolean | null
          issue_date: string | null
          issue_rate: number | null
          junto_policy_number: string | null
          modality: string | null
          net_premium: number | null
          policy_number: string | null
          policyholder_document: string | null
          policyholder_name: string | null
          raw_data: Json | null
          status: string | null
          submodality: string | null
          synced_at: string | null
          total_premium: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bill_url?: string | null
          cancellation_date?: string | null
          commission_value?: number | null
          created_at?: string | null
          document_number?: number | null
          document_url?: string | null
          duration_days?: number | null
          duration_end?: string | null
          duration_end_current?: string | null
          duration_start?: string | null
          economic_group?: string | null
          external_id?: number | null
          id?: string
          insured_amount?: number | null
          insured_amount_current?: number | null
          insured_document?: string | null
          insured_name?: string | null
          is_renewal?: boolean | null
          issue_date?: string | null
          issue_rate?: number | null
          junto_policy_number?: string | null
          modality?: string | null
          net_premium?: number | null
          policy_number?: string | null
          policyholder_document?: string | null
          policyholder_name?: string | null
          raw_data?: Json | null
          status?: string | null
          submodality?: string | null
          synced_at?: string | null
          total_premium?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bill_url?: string | null
          cancellation_date?: string | null
          commission_value?: number | null
          created_at?: string | null
          document_number?: number | null
          document_url?: string | null
          duration_days?: number | null
          duration_end?: string | null
          duration_end_current?: string | null
          duration_start?: string | null
          economic_group?: string | null
          external_id?: number | null
          id?: string
          insured_amount?: number | null
          insured_amount_current?: number | null
          insured_document?: string | null
          insured_name?: string | null
          is_renewal?: boolean | null
          issue_date?: string | null
          issue_rate?: number | null
          junto_policy_number?: string | null
          modality?: string | null
          net_premium?: number | null
          policy_number?: string | null
          policyholder_document?: string | null
          policyholder_name?: string | null
          raw_data?: Json | null
          status?: string | null
          submodality?: string | null
          synced_at?: string | null
          total_premium?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      guarantee_policyholders: {
        Row: {
          address_city: string | null
          address_state: string | null
          created_at: string
          credit_limit: number | null
          credit_limit_available: number | null
          economic_group: string | null
          external_id: number | null
          federal_id: string | null
          id: string
          name: string | null
          raw_data: Json | null
          registration_date: string | null
          risk_rating: string | null
          segment: string | null
          status: string | null
          synced_at: string
          trade_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_city?: string | null
          address_state?: string | null
          created_at?: string
          credit_limit?: number | null
          credit_limit_available?: number | null
          economic_group?: string | null
          external_id?: number | null
          federal_id?: string | null
          id?: string
          name?: string | null
          raw_data?: Json | null
          registration_date?: string | null
          risk_rating?: string | null
          segment?: string | null
          status?: string | null
          synced_at?: string
          trade_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_city?: string | null
          address_state?: string | null
          created_at?: string
          credit_limit?: number | null
          credit_limit_available?: number | null
          economic_group?: string | null
          external_id?: number | null
          federal_id?: string | null
          id?: string
          name?: string | null
          raw_data?: Json | null
          registration_date?: string | null
          risk_rating?: string | null
          segment?: string | null
          status?: string | null
          synced_at?: string
          trade_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      guarantee_settings: {
        Row: {
          client_id: string | null
          created_at: string
          environment: string
          id: string
          last_connection_test: string | null
          last_error: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          environment?: string
          id?: string
          last_connection_test?: string | null
          last_error?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          environment?: string
          id?: string
          last_connection_test?: string | null
          last_error?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_check: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id?: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      import_jobs: {
        Row: {
          created_at: string | null
          created_by: string | null
          empresa_id: string
          id: string
          job_id: string
          payload: Json
          processed_at: string | null
          source: string
          status: string | null
          summary: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          empresa_id: string
          id?: string
          job_id: string
          payload: Json
          processed_at?: string | null
          source?: string
          status?: string | null
          summary?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          empresa_id?: string
          id?: string
          job_id?: string
          payload?: Json
          processed_at?: string | null
          source?: string
          status?: string | null
          summary?: Json | null
          updated_at?: string | null
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
      insurance_approval_requests: {
        Row: {
          created_at: string | null
          current_status: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          empresa_id: string
          id: string
          motivo: string | null
          requested_by: string
          requested_status: string
          status: string
          veiculo_id: string
        }
        Insert: {
          created_at?: string | null
          current_status: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          empresa_id: string
          id?: string
          motivo?: string | null
          requested_by: string
          requested_status: string
          status?: string
          veiculo_id: string
        }
        Update: {
          created_at?: string | null
          current_status?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          empresa_id?: string
          id?: string
          motivo?: string | null
          requested_by?: string
          requested_status?: string
          status?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_approval_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_approval_requests_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_approval_requests_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
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
      n8n_webhooks_config: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
          url: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id: string
          nome: string
          updated_at?: string | null
          url: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
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
          client_id: string | null
          codfil: number | null
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
          marca: string | null
          modelo_veiculo: string | null
          nome_embarcacao: string | null
          nome_plano_saude: string | null
          nosnum: number | null
          numero_apolice: string | null
          placa: string | null
          policy_status: Database["public"]["Enums"]["policy_status"] | null
          quantidade_parcelas: number | null
          renovada: boolean | null
          renovado_codfil: number | null
          renovado_nosnum: number | null
          responsavel_nome: string | null
          responsavel_user_id: string | null
          segurado: string | null
          seguradora: string | null
          seguradora_empresa: string | null
          seguradora_entidade: string | null
          sit_renovacao: number | null
          sit_renovacao_txt: string | null
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
          vinculo_cpf: string | null
        }
        Insert: {
          ano_modelo?: string | null
          arquivo_url?: string | null
          cidade?: string | null
          client_id?: string | null
          codfil?: number | null
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
          marca?: string | null
          modelo_veiculo?: string | null
          nome_embarcacao?: string | null
          nome_plano_saude?: string | null
          nosnum?: number | null
          numero_apolice?: string | null
          placa?: string | null
          policy_status?: Database["public"]["Enums"]["policy_status"] | null
          quantidade_parcelas?: number | null
          renovada?: boolean | null
          renovado_codfil?: number | null
          renovado_nosnum?: number | null
          responsavel_nome?: string | null
          responsavel_user_id?: string | null
          segurado?: string | null
          seguradora?: string | null
          seguradora_empresa?: string | null
          seguradora_entidade?: string | null
          sit_renovacao?: number | null
          sit_renovacao_txt?: string | null
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
          vinculo_cpf?: string | null
        }
        Update: {
          ano_modelo?: string | null
          arquivo_url?: string | null
          cidade?: string | null
          client_id?: string | null
          codfil?: number | null
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
          marca?: string | null
          modelo_veiculo?: string | null
          nome_embarcacao?: string | null
          nome_plano_saude?: string | null
          nosnum?: number | null
          numero_apolice?: string | null
          placa?: string | null
          policy_status?: Database["public"]["Enums"]["policy_status"] | null
          quantidade_parcelas?: number | null
          renovada?: boolean | null
          renovado_codfil?: number | null
          renovado_nosnum?: number | null
          responsavel_nome?: string | null
          responsavel_user_id?: string | null
          segurado?: string | null
          seguradora?: string | null
          seguradora_empresa?: string | null
          seguradora_entidade?: string | null
          sit_renovacao?: number | null
          sit_renovacao_txt?: string | null
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
          vinculo_cpf?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
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
      policy_documents: {
        Row: {
          created_at: string
          id: string
          nome_arquivo: string | null
          policy_id: string
          storage_path: string
          tamanho_bytes: number | null
          tipo: string
          updated_at: string
          user_id: string
          valor: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          nome_arquivo?: string | null
          policy_id: string
          storage_path: string
          tamanho_bytes?: number | null
          tipo: string
          updated_at?: string
          user_id: string
          valor?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          nome_arquivo?: string | null
          policy_id?: string
          storage_path?: string
          tamanho_bytes?: number | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_documents_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_documents_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_ui"
            referencedColumns: ["id"]
          },
        ]
      }
      presence_sessions: {
        Row: {
          created_at: string
          current_path: string | null
          device_id: string | null
          display_name: string | null
          ended_at: string | null
          id: string
          ip_hash: string
          last_heartbeat_at: string
          started_at: string
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_path?: string | null
          device_id?: string | null
          display_name?: string | null
          ended_at?: string | null
          id?: string
          ip_hash: string
          last_heartbeat_at?: string
          started_at?: string
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_path?: string | null
          device_id?: string | null
          display_name?: string | null
          ended_at?: string | null
          id?: string
          ip_hash?: string
          last_heartbeat_at?: string
          started_at?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
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
      public_fleet_tokens: {
        Row: {
          created_at: string
          created_by: string
          empresa_id: string
          expires_at: string | null
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          empresa_id: string
          expires_at?: string | null
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          empresa_id?: string
          expires_at?: string | null
          id?: string
          token?: string
          used_at?: string | null
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
          ip: unknown
          last_seen_at: string | null
          started_at: string | null
          user_agent: string | null
        }
        Insert: {
          employee_id?: string | null
          id?: string
          ip?: unknown
          last_seen_at?: string | null
          started_at?: string | null
          user_agent?: string | null
        }
        Update: {
          employee_id?: string | null
          id?: string
          ip?: unknown
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
      report_schedules: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          dia_envio: number
          email: string
          empresa_id: string
          frequencia_dias: number
          id: string
          nome_destinatario: string
          proximo_envio: string | null
          ultimo_envio: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          dia_envio?: number
          email: string
          empresa_id: string
          frequencia_dias?: number
          id?: string
          nome_destinatario: string
          proximo_envio?: string | null
          ultimo_envio?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          dia_envio?: number
          email?: string
          empresa_id?: string
          frequencia_dias?: number
          id?: string
          nome_destinatario?: string
          proximo_envio?: string | null
          ultimo_envio?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_schedules_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      report_sends: {
        Row: {
          created_at: string
          email: string
          empresa_id: string
          error_message: string | null
          id: string
          schedule_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          empresa_id: string
          error_message?: string | null
          id?: string
          schedule_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          empresa_id?: string
          error_message?: string | null
          id?: string
          schedule_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_sends_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_sends_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "report_schedules"
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
      seguros_distribution_cache: {
        Row: {
          clientes_ativas: number
          clientes_vigentes: number
          created_at: string
          empresa_id: string | null
          id: string
          nome_ramo: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          clientes_ativas?: number
          clientes_vigentes?: number
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome_ramo: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          clientes_ativas?: number
          clientes_vigentes?: number
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome_ramo?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seguros_distribution_cache_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      sinistro_sheet_configs: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          last_synced_at: string | null
          sheet_name: string
          sheet_url: string
          status: string
          sync_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          last_synced_at?: string | null
          sheet_name?: string
          sheet_url: string
          status?: string
          sync_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          last_synced_at?: string | null
          sheet_name?: string
          sheet_url?: string
          status?: string
          sync_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sinistro_sheet_configs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      sinistro_sheet_sync_logs: {
        Row: {
          config_id: string
          created_at: string
          detalhes: Json | null
          erros: number | null
          id: string
          registros_encontrados: number | null
          registros_existentes: number | null
          registros_novos: number | null
          status: string
        }
        Insert: {
          config_id: string
          created_at?: string
          detalhes?: Json | null
          erros?: number | null
          id?: string
          registros_encontrados?: number | null
          registros_existentes?: number | null
          registros_novos?: number | null
          status?: string
        }
        Update: {
          config_id?: string
          created_at?: string
          detalhes?: Json | null
          erros?: number | null
          id?: string
          registros_encontrados?: number | null
          registros_existentes?: number | null
          registros_novos?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sinistro_sheet_sync_logs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "sinistro_sheet_configs"
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
      tenant_ip_registry: {
        Row: {
          created_at: string
          device_id: string | null
          display_name: string | null
          first_seen_at: string
          id: string
          ip_hash: string
          last_seen_at: string
          tenant_id: string
          times_seen: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          display_name?: string | null
          first_seen_at?: string
          id?: string
          ip_hash: string
          last_seen_at?: string
          tenant_id: string
          times_seen?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          display_name?: string | null
          first_seen_at?: string
          id?: string
          ip_hash?: string
          last_seen_at?: string
          tenant_id?: string
          times_seen?: number
          updated_at?: string
        }
        Relationships: []
      }
      theft_risk_reference: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          make: string
          model: string
          notes: string | null
          reference_date: string
          risk_level: string
          risk_score: number
          source: string | null
          year_from: number | null
          year_to: number | null
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          make: string
          model: string
          notes?: string | null
          reference_date: string
          risk_level: string
          risk_score: number
          source?: string | null
          year_from?: number | null
          year_to?: number | null
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          make?: string
          model?: string
          notes?: string | null
          reference_date?: string
          risk_level?: string
          risk_score?: number
          source?: string | null
          year_from?: number | null
          year_to?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "theft_risk_reference_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
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
          beneficiario_nome: string | null
          created_at: string | null
          created_by: string | null
          data_evento: string | null
          empresa_id: string | null
          external_ref: string | null
          id: string
          localizacao: string | null
          numero_sinistro: string | null
          origem: string | null
          payload: Json
          prazo: string | null
          protocol_code: string | null
          request_id: string | null
          rh_note: string | null
          segurado_id: string | null
          status: string
          status_indenizacao: string | null
          subsidiaria: string | null
          subtipo: string | null
          tipo: string | null
          updated_at: string | null
          valor_estimado: number | null
          valor_pago: number | null
          vehicle_id: string | null
        }
        Insert: {
          apolice_id?: string | null
          beneficiario_nome?: string | null
          created_at?: string | null
          created_by?: string | null
          data_evento?: string | null
          empresa_id?: string | null
          external_ref?: string | null
          id?: string
          localizacao?: string | null
          numero_sinistro?: string | null
          origem?: string | null
          payload: Json
          prazo?: string | null
          protocol_code?: string | null
          request_id?: string | null
          rh_note?: string | null
          segurado_id?: string | null
          status?: string
          status_indenizacao?: string | null
          subsidiaria?: string | null
          subtipo?: string | null
          tipo?: string | null
          updated_at?: string | null
          valor_estimado?: number | null
          valor_pago?: number | null
          vehicle_id?: string | null
        }
        Update: {
          apolice_id?: string | null
          beneficiario_nome?: string | null
          created_at?: string | null
          created_by?: string | null
          data_evento?: string | null
          empresa_id?: string | null
          external_ref?: string | null
          id?: string
          localizacao?: string | null
          numero_sinistro?: string | null
          origem?: string | null
          payload?: Json
          prazo?: string | null
          protocol_code?: string | null
          request_id?: string | null
          rh_note?: string | null
          segurado_id?: string | null
          status?: string
          status_indenizacao?: string | null
          subsidiaria?: string | null
          subtipo?: string | null
          tipo?: string | null
          updated_at?: string | null
          valor_estimado?: number | null
          valor_pago?: number | null
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
            foreignKeyName: "tickets_segurado_id_fkey"
            columns: ["segurado_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
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
      truck_tachograph_inspections: {
        Row: {
          attachments: Json | null
          certificate_number: string | null
          cost: number
          created_at: string
          id: string
          inspection_date: string
          notes: string | null
          provider_name: string | null
          valid_until: string
          vehicle_id: string
        }
        Insert: {
          attachments?: Json | null
          certificate_number?: string | null
          cost?: number
          created_at?: string
          id?: string
          inspection_date: string
          notes?: string | null
          provider_name?: string | null
          valid_until: string
          vehicle_id: string
        }
        Update: {
          attachments?: Json | null
          certificate_number?: string | null
          cost?: number
          created_at?: string
          id?: string
          inspection_date?: string
          notes?: string | null
          provider_name?: string | null
          valid_until?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "truck_tachograph_inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      truck_tachograph_yearly_records: {
        Row: {
          created_at: string
          id: string
          incidents: string | null
          km_end: number | null
          km_start: number | null
          notes: string | null
          summary: string | null
          vehicle_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          incidents?: string | null
          km_end?: number | null
          km_start?: number | null
          notes?: string | null
          summary?: string | null
          vehicle_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          incidents?: string | null
          km_end?: number | null
          km_start?: number | null
          notes?: string | null
          summary?: string | null
          vehicle_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "truck_tachograph_yearly_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_access_logs: {
        Row: {
          created_at: string
          device_name: string | null
          hidden: boolean
          id: string
          ip_address: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          hidden?: boolean
          id?: string
          ip_address: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          hidden?: boolean
          id?: string
          ip_address?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_cpf_vinculos: {
        Row: {
          ativo: boolean | null
          cpf: string
          created_at: string | null
          id: string
          nome: string | null
          observacoes: string | null
          tipo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          cpf: string
          created_at?: string | null
          id?: string
          nome?: string | null
          observacoes?: string | null
          tipo?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          cpf?: string
          created_at?: string | null
          id?: string
          nome?: string | null
          observacoes?: string | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_memberships: {
        Row: {
          created_at: string | null
          empresa_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_memberships_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          city: string | null
          company_name: string | null
          created_at: string
          default_empresa_id: string | null
          display_name: string
          document: string | null
          id: string
          is_admin: boolean
          phone: string | null
          photo_path: string | null
          photo_url: string | null
          settings: Json | null
          state: string | null
          termos_aceitos: boolean | null
          termos_aceitos_em: string | null
          termos_versao: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          default_empresa_id?: string | null
          display_name?: string
          document?: string | null
          id: string
          is_admin?: boolean
          phone?: string | null
          photo_path?: string | null
          photo_url?: string | null
          settings?: Json | null
          state?: string | null
          termos_aceitos?: boolean | null
          termos_aceitos_em?: string | null
          termos_versao?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          default_empresa_id?: string | null
          display_name?: string
          document?: string | null
          id?: string
          is_admin?: boolean
          phone?: string | null
          photo_path?: string | null
          photo_url?: string | null
          settings?: Json | null
          state?: string | null
          termos_aceitos?: boolean | null
          termos_aceitos_em?: string | null
          termos_versao?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_default_empresa_id_fkey"
            columns: ["default_empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
          documento: string | null
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
          documento?: string | null
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
          documento?: string | null
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
      vehicle_assignment_history: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          notes: string | null
          responsible_contact: string | null
          responsible_name: string
          start_date: string
          vehicle_id: string
          worksite_code: string | null
          worksite_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          responsible_contact?: string | null
          responsible_name: string
          start_date: string
          vehicle_id: string
          worksite_code?: string | null
          worksite_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          responsible_contact?: string | null
          responsible_name?: string
          start_date?: string
          vehicle_id?: string
          worksite_code?: string | null
          worksite_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_assignment_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_finance: {
        Row: {
          bank_name: string | null
          created_at: string
          direct_payment: boolean
          down_payment: number | null
          empresa_id: string
          end_date: string | null
          id: string
          installment_value: number
          installments_paid: number
          notes: string | null
          start_date: string | null
          status: string
          term_months: number
          type: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          bank_name?: string | null
          created_at?: string
          direct_payment?: boolean
          down_payment?: number | null
          empresa_id: string
          end_date?: string | null
          id?: string
          installment_value?: number
          installments_paid?: number
          notes?: string | null
          start_date?: string | null
          status?: string
          term_months?: number
          type?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          bank_name?: string | null
          created_at?: string
          direct_payment?: boolean
          down_payment?: number | null
          empresa_id?: string
          end_date?: string | null
          id?: string
          installment_value?: number
          installments_paid?: number
          notes?: string | null
          start_date?: string | null
          status?: string
          term_months?: number
          type?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_finance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_fipe_snapshots: {
        Row: {
          created_at: string
          fipe_value: number
          id: string
          reference_month: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          fipe_value?: number
          id?: string
          reference_month: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          fipe_value?: number
          id?: string
          reference_month?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_fipe_snapshots_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_maintenance_logs: {
        Row: {
          cost: number
          created_at: string
          id: string
          notes: string | null
          odometer_km: number
          performed_date: string
          realizada: boolean
          type: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          notes?: string | null
          odometer_km?: number
          performed_date: string
          realizada?: boolean
          type: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          notes?: string | null
          odometer_km?: number
          performed_date?: string
          realizada?: boolean
          type?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenance_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_maintenance_rules: {
        Row: {
          alert_before_days: number | null
          alert_before_km: number | null
          created_at: string
          due_every_km: number | null
          due_every_months: number | null
          id: string
          type: string
          vehicle_id: string
        }
        Insert: {
          alert_before_days?: number | null
          alert_before_km?: number | null
          created_at?: string
          due_every_km?: number | null
          due_every_months?: number | null
          id?: string
          type: string
          vehicle_id: string
        }
        Update: {
          alert_before_days?: number | null
          alert_before_km?: number | null
          created_at?: string
          due_every_km?: number | null
          due_every_months?: number | null
          id?: string
          type?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenance_rules_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_reviews: {
        Row: {
          created_at: string
          data_revisao: string
          empresa_id: string
          id: string
          km_atual: number | null
          observacoes: string | null
          realizada: boolean
          tipo: string
          updated_at: string
          valor: number | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          data_revisao: string
          empresa_id: string
          id?: string
          km_atual?: number | null
          observacoes?: string | null
          realizada?: boolean
          tipo?: string
          updated_at?: string
          valor?: number | null
          vehicle_id: string
        }
        Update: {
          created_at?: string
          data_revisao?: string
          empresa_id?: string
          id?: string
          km_atual?: number | null
          observacoes?: string | null
          realizada?: boolean
          tipo?: string
          updated_at?: string
          valor?: number | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_reviews_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_reviews_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_theft_events: {
        Row: {
          created_at: string
          empresa_id: string
          event_date: string
          id: string
          notes: string | null
          status: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          event_date: string
          id?: string
          notes?: string | null
          status?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          event_date?: string
          id?: string
          notes?: string | null
          status?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_theft_events_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_theft_events_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculo_field_sources: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          created_at: string | null
          field_name: string
          id: string
          import_job_id: string | null
          new_value: string | null
          previous_value: string | null
          reverted_at: string | null
          source: string
          veiculo_id: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          created_at?: string | null
          field_name: string
          id?: string
          import_job_id?: string | null
          new_value?: string | null
          previous_value?: string | null
          reverted_at?: string | null
          source: string
          veiculo_id: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          created_at?: string | null
          field_name?: string
          id?: string
          import_job_id?: string | null
          new_value?: string | null
          previous_value?: string | null
          reverted_at?: string | null
          source?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculo_field_sources_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "frota_veiculos"
            referencedColumns: ["id"]
          },
        ]
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
      admin_companies_summary: { Args: never; Returns: Json }
      admin_dashboard_metrics: { Args: never; Returns: Json }
      admin_list_approval_requests: {
        Args: { p_status?: string }
        Returns: Json
      }
      approve_insurance_request: {
        Args: { p_decision_note?: string; p_request_id: string }
        Returns: undefined
      }
      auto_fix_frota_status: { Args: never; Returns: Json }
      can_access_requests: { Args: never; Returns: boolean }
      check_and_fix_policy_inconsistencies: {
        Args: never
        Returns: {
          fixed: boolean
          issue_type: string
          policy_id: string
        }[]
      }
      check_ip_exists: {
        Args: { _ip_address: string; _user_id: string }
        Returns: boolean
      }
      current_empresa_id: { Args: never; Returns: string }
      debug_frota_auth: {
        Args: never
        Returns: {
          auth_user_id: string
          current_empresa_result: string
          membership_count: number
          total_vehicles_no_rls: number
          total_vehicles_with_rls: number
          user_company: string
          user_memberships: Json
        }[]
      }
      debug_user_empresa_complete: { Args: never; Returns: Json }
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
      ensure_default_empresa: { Args: never; Returns: string }
      fix_categoria_outros_to_sem_seguro: {
        Args: never
        Returns: {
          error: string
          message: string
          placas_alteradas: string[]
          success: boolean
          veiculos_atualizados: number
        }[]
      }
      fix_frota_status_outros: {
        Args: never
        Returns: {
          placas_alteradas: string[]
          veiculos_atualizados: number
        }[]
      }
      generate_file_hash: { Args: { file_content: string }; Returns: string }
      generate_protocol_code: { Args: never; Returns: string }
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
      get_current_empresa: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_dashboard_kpi_history: {
        Args: { _months?: number }
        Returns: {
          month_start: string
          monthly_premium: number
          total_policies: number
        }[]
      }
      get_dashboard_kpis: { Args: { p_user_id: string }; Returns: Json }
      get_user_empresa_id: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_company_admin: { Args: { check_empresa_id: string }; Returns: boolean }
      is_consultoria_premium_active: {
        Args: { _empresa_id: string }
        Returns: boolean
      }
      is_member_of: { Args: { record_empresa_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      limpar_dados_usuario_teste: { Args: never; Returns: Json }
      limpar_dados_usuario_teste_v2: { Args: never; Returns: Json }
      reject_insurance_request: {
        Args: { p_decision_note?: string; p_request_id: string }
        Returns: undefined
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
      test_get_user_empresa: { Args: never; Returns: Json }
      trigger_sinistro_sheet_sync: { Args: never; Returns: undefined }
      user_belongs_to_empresa: {
        Args: { _empresa_id: string }
        Returns: boolean
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
      app_role: "admin" | "moderator" | "user" | "rh" | "corretora" | "master"
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
      app_role: ["admin", "moderator", "user", "rh", "corretora", "master"],
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
