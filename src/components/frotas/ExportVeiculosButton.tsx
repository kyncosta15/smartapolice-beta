import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ExportVeiculosButton = () => {
  const handleExport = async () => {
    try {
      toast.loading("Exportando veículos...");
      
      const { data: veiculos, error } = await supabase
        .from('frota_veiculos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const exportData = {
        metadata: {
          exported_at: new Date().toISOString().split('T')[0],
          total_vehicles: veiculos?.length || 0,
          description: "Exportação completa dos veículos da frota"
        },
        veiculos: veiculos?.map(v => ({
          placa: v.placa,
          marca: v.marca,
          modelo: v.modelo,
          chassi: v.chassi,
          renavam: v.renavam,
          ano_modelo: v.ano_modelo,
          categoria: v.categoria,
          status_seguro: v.status_seguro,
          status_veiculo: v.status_veiculo,
          tipo_veiculo: v.tipo_veiculo,
          codigo_fipe: v.codigo_fipe,
          created_at: v.created_at,
          updated_at: v.updated_at
        }))
      };

      // Criar blob e fazer download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `veiculos-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success(`${veiculos?.length || 0} veículos exportados com sucesso!`);
    } catch (error) {
      console.error('Erro ao exportar veículos:', error);
      toast.dismiss();
      toast.error('Erro ao exportar veículos');
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Exportar JSON
    </Button>
  );
};
