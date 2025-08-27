
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const N8NDataTester = () => {
  const { toast } = useToast();

  const testData = [
    {
      "user_id": null,
      "segurado": "RUELSO JOSE DA SILVA LOPES",
      "documento": "16765389504",
      "documento_tipo": "CPF",
      "data_nascimento": "",
      "seguradora": "Darwin Seguros S.A",
      "numero_apolice": "01010002024120011598",
      "inicio": "2024-12-27",
      "fim": "2025-01-26",
      "tipo": "Automóvel",
      "modelo_veiculo": "SPORTAGE LX 2.0 16V/ 2.0 16V FLEX AUT.",
      "placa": "PKX4A87",
      "ano_modelo": "2018",
      "premio": 338.74,
      "parcelas": 0,
      "valor_parcela": 0,
      "pagamento": "Cartão de crédito",
      "custo_mensal": 0,
      "vencimentos_futuros": [],
      "franquia": 6839.56,
      "condutor": "",
      "email": "ruelso@rcaldas.com.br",
      "telefone": "(11) 3512-7210",
      "status": "Ativa",
      "corretora": "R J S L - CORRETORA E ADMINISTRADORA DE SEGUROS LTDA",
      "cidade": "São Paulo",
      "uf": "SP",
      "coberturas": [
        {
          "descricao": "Colisão Perda Parcial",
          "lmi": 0
        },
        {
          "descricao": "Colisão Perda Total",
          "lmi": 0
        },
        {
          "descricao": "Roubo Perda Parcial",
          "lmi": 0
        },
        {
          "descricao": "Roubo Perda Total",
          "lmi": 0
        },
        {
          "descricao": "Furto Perda Parcial",
          "lmi": 0
        },
        {
          "descricao": "Furto Perda Total",
          "lmi": 0
        },
        {
          "descricao": "Incêndio Perda Parcial",
          "lmi": 0
        },
        {
          "descricao": "Incêndio Perda Total",
          "lmi": 0
        },
        {
          "descricao": "Alagamento Perda Parcial",
          "lmi": 0
        },
        {
          "descricao": "Alagamento Perda Total",
          "lmi": 0
        },
        {
          "descricao": "Danos pessoais",
          "lmi": 150000
        },
        {
          "descricao": "Danos morais",
          "lmi": 10000
        },
        {
          "descricao": "Danos materiais",
          "lmi": 150000
        },
        {
          "descricao": "Proteção para Terceiros",
          "lmi": 10000
        },
        {
          "descricao": "Passageiros",
          "lmi": 0
        },
        {
          "descricao": "Guincho 1000 km",
          "lmi": 0
        },
        {
          "descricao": "Carro reserva",
          "lmi": 0
        },
        {
          "descricao": "Vidros",
          "lmi": 0
        }
      ]
    }
  ];

  const simulateN8NWebhook = () => {
    console.log('🎯 Simulando envio de dados N8N...');
    
    // Disparar evento customizado que será capturado pelo usePersistedPolicies
    const event = new CustomEvent('n8n-policy-data', {
      detail: testData
    });
    
    window.dispatchEvent(event);
    
    toast({
      title: "🔄 Dados N8N Enviados",
      description: "Simulando dados do webhook N8N",
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Testador N8N
        </CardTitle>
        <CardDescription>
          Simula o envio de dados do webhook N8N para testar a persistência
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={simulateN8NWebhook}
          className="w-full"
          variant="outline"
        >
          📤 Simular Webhook N8N
        </Button>
        <div className="mt-4 text-sm text-gray-600">
          <p>Dados que serão enviados:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Segurado: RUELSO JOSE DA SILVA LOPES</li>
            <li>Seguradora: Darwin Seguros S.A</li>
            <li>Apólice: 01010002024120011598</li>
            <li>Veículo: SPORTAGE LX 2.0</li>
            <li>18 coberturas incluídas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default N8NDataTester;
