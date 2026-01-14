import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface FleetTemplateDownloadProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function FleetTemplateDownload({ 
  variant = 'outline', 
  size = 'default',
  className 
}: FleetTemplateDownloadProps) {
  const { toast } = useToast();

  const handleDownloadTemplate = () => {
    try {
      // Definição das colunas do modelo
      const templateData = [
        {
          'Placa *': 'ABC1D23',
          'Marca': 'FIAT',
          'Modelo': 'STRADA FREEDOM 1.3',
          'Chassi': '9BD374110N1234567',
          'Renavam': '12345678901',
          'Ano Modelo': 2024,
          'Categoria': 'utilitario',
          'Combustível': 'Flex',
          'Código FIPE': '001504-0',
          'UF Emplacamento': 'SP',
          'Localização': 'Matriz',
          'Proprietário Nome': 'Nome da Empresa LTDA',
          'Proprietário Documento': '12.345.678/0001-90',
          'Proprietário Tipo': 'pj',
          'Status Veículo': 'ativo',
          'Status Seguro': 'com_seguro',
          'Código Interno': 'VEI-001',
          'Função': 'Entrega',
          'Família': 'Comercial',
          'Modalidade Compra': 'financiamento',
          'Preço NF': 95000.00,
          'Preço FIPE': 98000.00,
          'Data Vencimento Emplacamento': '2025-12-31',
          'Observações': 'Veículo em bom estado'
        },
        {
          'Placa *': 'XYZ9E87',
          'Marca': 'VOLKSWAGEN',
          'Modelo': 'GOL 1.0',
          'Chassi': '9BWZZZ377VT123456',
          'Renavam': '98765432109',
          'Ano Modelo': 2023,
          'Categoria': 'carro',
          'Combustível': 'Gasolina',
          'Código FIPE': '005432-1',
          'UF Emplacamento': 'RJ',
          'Localização': 'Filial 01',
          'Proprietário Nome': 'Outra Empresa SA',
          'Proprietário Documento': '98.765.432/0001-10',
          'Proprietário Tipo': 'pj',
          'Status Veículo': 'ativo',
          'Status Seguro': 'sem_seguro',
          'Código Interno': 'VEI-002',
          'Função': 'Apoio',
          'Família': 'Passeio',
          'Modalidade Compra': 'à vista',
          'Preço NF': 55000.00,
          'Preço FIPE': 58000.00,
          'Data Vencimento Emplacamento': '2025-06-15',
          'Observações': ''
        },
        {
          'Placa *': 'MOT1A23',
          'Marca': 'HONDA',
          'Modelo': 'CG 160 FAN',
          'Chassi': '9C2KC1100MR123456',
          'Renavam': '11223344556',
          'Ano Modelo': 2024,
          'Categoria': 'moto',
          'Combustível': 'Gasolina',
          'Código FIPE': '811002-3',
          'UF Emplacamento': 'BA',
          'Localização': 'Centro de Distribuição',
          'Proprietário Nome': 'Empresa Transportes ME',
          'Proprietário Documento': '11.222.333/0001-44',
          'Proprietário Tipo': 'pj',
          'Status Veículo': 'ativo',
          'Status Seguro': 'pendente',
          'Código Interno': 'MOT-001',
          'Função': 'Entrega Rápida',
          'Família': 'Moto',
          'Modalidade Compra': 'consórcio',
          'Preço NF': 14000.00,
          'Preço FIPE': 15000.00,
          'Data Vencimento Emplacamento': '2025-09-20',
          'Observações': 'Moto para entregas urbanas'
        }
      ];

      // Criar workbook e worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateData);

      // Definir larguras das colunas
      const columnWidths = [
        { wch: 12 },  // Placa
        { wch: 15 },  // Marca
        { wch: 25 },  // Modelo
        { wch: 20 },  // Chassi
        { wch: 15 },  // Renavam
        { wch: 12 },  // Ano Modelo
        { wch: 12 },  // Categoria
        { wch: 12 },  // Combustível
        { wch: 12 },  // Código FIPE
        { wch: 15 },  // UF Emplacamento
        { wch: 20 },  // Localização
        { wch: 30 },  // Proprietário Nome
        { wch: 22 },  // Proprietário Documento
        { wch: 18 },  // Proprietário Tipo
        { wch: 15 },  // Status Veículo
        { wch: 15 },  // Status Seguro
        { wch: 15 },  // Código Interno
        { wch: 15 },  // Função
        { wch: 12 },  // Família
        { wch: 18 },  // Modalidade Compra
        { wch: 12 },  // Preço NF
        { wch: 12 },  // Preço FIPE
        { wch: 25 },  // Data Vencimento Emplacamento
        { wch: 30 },  // Observações
      ];
      worksheet['!cols'] = columnWidths;

      // Criar aba de instruções
      const instructionsData = [
        { 'Campo': 'INSTRUÇÕES PARA PREENCHIMENTO', 'Descrição': '' },
        { 'Campo': '', 'Descrição': '' },
        { 'Campo': 'Placa *', 'Descrição': 'OBRIGATÓRIO. Formato: ABC1D23 (Mercosul) ou ABC-1234 (antigo)' },
        { 'Campo': 'Marca', 'Descrição': 'Nome da montadora (ex: FIAT, VOLKSWAGEN, HONDA)' },
        { 'Campo': 'Modelo', 'Descrição': 'Modelo completo do veículo' },
        { 'Campo': 'Chassi', 'Descrição': '17 caracteres alfanuméricos' },
        { 'Campo': 'Renavam', 'Descrição': '11 dígitos numéricos' },
        { 'Campo': 'Ano Modelo', 'Descrição': 'Ano do modelo (ex: 2024)' },
        { 'Campo': 'Categoria', 'Descrição': 'carro, moto, caminhao, utilitario, onibus, van, outro' },
        { 'Campo': 'Combustível', 'Descrição': 'Gasolina, Etanol, Flex, Diesel, Elétrico, Híbrido, GNV' },
        { 'Campo': 'Código FIPE', 'Descrição': 'Código da tabela FIPE (ex: 001504-0)' },
        { 'Campo': 'UF Emplacamento', 'Descrição': 'Sigla do estado (ex: SP, RJ, BA)' },
        { 'Campo': 'Localização', 'Descrição': 'Onde o veículo está alocado (ex: Matriz, Filial 01)' },
        { 'Campo': 'Proprietário Nome', 'Descrição': 'Nome completo ou razão social do proprietário' },
        { 'Campo': 'Proprietário Documento', 'Descrição': 'CPF ou CNPJ do proprietário' },
        { 'Campo': 'Proprietário Tipo', 'Descrição': 'pf (pessoa física) ou pj (pessoa jurídica)' },
        { 'Campo': 'Status Veículo', 'Descrição': 'ativo, inativo, em_manutencao, vendido, sinistrado' },
        { 'Campo': 'Status Seguro', 'Descrição': 'com_seguro, sem_seguro, pendente, vencido' },
        { 'Campo': 'Código Interno', 'Descrição': 'Código interno da empresa para o veículo' },
        { 'Campo': 'Função', 'Descrição': 'Finalidade do veículo (ex: Entrega, Apoio, Executivo)' },
        { 'Campo': 'Família', 'Descrição': 'Agrupamento (ex: Comercial, Passeio, Pesado)' },
        { 'Campo': 'Modalidade Compra', 'Descrição': 'à vista, financiamento, leasing, consórcio, aluguel' },
        { 'Campo': 'Preço NF', 'Descrição': 'Valor da nota fiscal (somente números)' },
        { 'Campo': 'Preço FIPE', 'Descrição': 'Valor da tabela FIPE (somente números)' },
        { 'Campo': 'Data Vencimento Emplacamento', 'Descrição': 'Data no formato AAAA-MM-DD (ex: 2025-12-31)' },
        { 'Campo': 'Observações', 'Descrição': 'Campo livre para observações' },
        { 'Campo': '', 'Descrição': '' },
        { 'Campo': 'IMPORTANTE', 'Descrição': 'Apenas o campo Placa é obrigatório. Os demais são opcionais.' },
        { 'Campo': '', 'Descrição': 'Os exemplos na aba "Modelo" servem apenas como referência.' },
        { 'Campo': '', 'Descrição': 'Apague as linhas de exemplo antes de preencher seus dados.' },
      ];

      const instructionsWorksheet = XLSX.utils.json_to_sheet(instructionsData);
      instructionsWorksheet['!cols'] = [{ wch: 30 }, { wch: 60 }];

      // Adicionar as abas ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo');
      XLSX.utils.book_append_sheet(workbook, instructionsWorksheet, 'Instruções');

      // Gerar e baixar o arquivo
      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `modelo_frota_veiculos_${today}.xlsx`);

      toast({
        title: 'Download iniciado',
        description: 'O modelo de planilha foi baixado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao gerar planilha modelo:', error);
      toast({
        title: 'Erro ao gerar modelo',
        description: 'Não foi possível gerar a planilha modelo. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownloadTemplate}
      className={className}
    >
      <FileSpreadsheet className="h-4 w-4 mr-2" />
      Baixar Modelo
    </Button>
  );
}
