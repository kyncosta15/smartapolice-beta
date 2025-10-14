import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

export interface FipeSpreadsheetRow {
  placa: string;
  codigo_fipe: string;
  modelo?: string;
  ano?: string;
}

export interface ProcessResult {
  success: number;
  failed: number;
  notFound: number;
  errors: Array<{ placa: string; error: string }>;
}

export class FipeSpreadsheetProcessor {
  /**
   * Processa arquivo XLSX e extrai dados das colunas B (placa) e C (código FIPE)
   */
  static async parseSpreadsheet(file: File): Promise<FipeSpreadsheetRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Converter para JSON - pula a primeira linha (cabeçalho)
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          const rows: FipeSpreadsheetRow[] = [];
          
          // Processar linhas (pular cabeçalho linha 0)
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            // Coluna B = índice 1 (placa), Coluna C = índice 2 (código FIPE)
            const placa = row[1]?.toString().trim();
            const codigoFipe = row[2]?.toString().trim();
            
            // Só adiciona se tem placa e código FIPE
            if (placa && codigoFipe) {
              rows.push({
                placa: placa,
                codigo_fipe: codigoFipe,
                modelo: row[0]?.toString().trim(), // Coluna A (modelo)
                ano: row[3]?.toString().trim() // Coluna D (ano)
              });
            }
          }
          
          resolve(rows);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsBinaryString(file);
    });
  }

  /**
   * Atualiza os veículos no banco de dados com os códigos FIPE da planilha
   */
  static async updateVehicles(
    rows: FipeSpreadsheetRow[],
    empresaId: string
  ): Promise<ProcessResult> {
    const result: ProcessResult = {
      success: 0,
      failed: 0,
      notFound: 0,
      errors: []
    };

    for (const row of rows) {
      try {
        // Buscar veículo pela placa (case insensitive)
        const { data: vehicle, error: searchError } = await supabase
          .from('frota_veiculos')
          .select('id, placa')
          .eq('empresa_id', empresaId)
          .ilike('placa', row.placa)
          .maybeSingle();

        if (searchError) {
          result.failed++;
          result.errors.push({
            placa: row.placa,
            error: `Erro ao buscar: ${searchError.message}`
          });
          continue;
        }

        if (!vehicle) {
          result.notFound++;
          result.errors.push({
            placa: row.placa,
            error: 'Veículo não encontrado na base de dados'
          });
          continue;
        }

        // Atualizar código FIPE do veículo
        const { error: updateError } = await supabase
          .from('frota_veiculos')
          .update({
            codigo_fipe: row.codigo_fipe,
            updated_at: new Date().toISOString()
          })
          .eq('id', vehicle.id);

        if (updateError) {
          result.failed++;
          result.errors.push({
            placa: row.placa,
            error: `Erro ao atualizar: ${updateError.message}`
          });
        } else {
          result.success++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          placa: row.placa,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return result;
  }

  /**
   * Processa o arquivo completo: lê a planilha e atualiza os veículos
   */
  static async processFile(file: File, empresaId: string): Promise<ProcessResult> {
    const rows = await this.parseSpreadsheet(file);
    return await this.updateVehicles(rows, empresaId);
  }
}
