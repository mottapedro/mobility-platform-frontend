"use client";

import { useEffect } from 'react';

export function WebMCPIntegration() {
  useEffect(() => {
    // Valida se o contexto é o navegador e se a extensão WebMCP está ativa
    if (typeof window !== 'undefined' && 'WebMCP' in window) {
      // Configurado com o ciano elétrico característico da sua identidade visual
      const mcp = new (window as any).WebMCP({ color: '#00FFFF', position: 'bottom-right' });

      mcp.registerTool(
        'testar_matching_engine',
        'Dispara o request_offers para testar o roteamento de motoristas por zona de região.',
        {
          origin: { type: 'string', description: 'Endereço de origem no Rio de Janeiro' },
          destination: { type: 'string', description: 'Endereço de destino' }
        },
        async (args: any) => {
          try {
            // Roteia a requisição para o nosso backend estabilizado
            const response = await fetch('http://localhost:3000/api/rides/request_offers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                passengerId: "PASSENGER_ID_DE_TESTE", // Substitua por um ID válido do seu banco se necessário
                origin: args.origin,
                destination: args.destination,
                scheduledAt: new Date().toISOString()
              })
            });

            const data = await response.json();

            // Retorna a leitura estrutural direta para o agente de IA analisar
            return {
              content: [{
                type: "text",
                text: `Resultado do Matching: Status da viagem validado como ${data.status || 'ERRO_DESCONHECIDO'}. Payload: ${JSON.stringify(data)}`
              }]
            };
          } catch (error: any) {
            return { content: [{ type: "text", text: `Falha na comunicação de rede com o backend: ${error.message}` }] };
          }
        }
      );
      
      console.log("J.A.R.V.I.S.: WebMCP Tool 'testar_matching_engine' acoplada com sucesso.");
    }
  }, []);

  return null; // Componente fantasma na UI, focado apenas na injeção do agente
}