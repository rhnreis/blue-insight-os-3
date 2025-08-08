type ServiceOrder = {
  COD_SUPORTE: number;
  COD_CLIENTE: number;
  NOME_CLIENTE: string;
  CATEGORIA: string;
  DATA_FECHAMENTO: string; // ou Date dependendo da sua estrutura
};

export function isRecallBasedOnScenario(currentOrder: ServiceOrder, previousOrder: ServiceOrder): boolean {
  const recallScenarios: Record<string, string[]> = {
    "ATIVAÇÃO SEGUIDA": [
      "CARRO / SUPORTE TÉCNICO",
      "OSCILAÇÃO",
      "RECOLHIMENTO",
      "RECOLHIMENTO A PEDIDO",
      "SUPORTE NIVEL 1",
      "SUPORTE NIVEL 2",
    ],
    "CARRO / SUPORTE SEGUIDO": [
      "CARRO / SUPORTE TÉCNICO",
      "OSCILAÇÃO",
      "RECOLHIMENTO",
      "RECOLHIMENTO A PEDIDO",
      "SUPORTE NIVEL 1",
      "SUPORTE NIVEL 2",
    ],
    "COMODATO ROTEADOR SEGUIDO": [
      "CARRO / SUPORTE TÉCNICO",
      "OSCILAÇÃO",
      "RECOLHIMENTO",
      "RECOLHIMENTO A PEDIDO",
      "SUPORTE NIVEL 1",
      "SUPORTE NIVEL 2",
    ],
    "MUDANÇA DE ENDEREÇO SEGUIDA": [
      "CARRO / SUPORTE TÉCNICO",
      "OSCILAÇÃO",
      "RECOLHIMENTO",
      "RECOLHIMENTO A PEDIDO",
      "SUPORTE NIVEL 1",
      "SUPORTE NIVEL 2",
    ],
    "MUDANÇA DE LOCAL SEGUIDA": [
      "CARRO / SUPORTE TÉCNICO",
      "OSCILAÇÃO",
      "RECOLHIMENTO",
      "RECOLHIMENTO A PEDIDO",
      "SUPORTE NIVEL 1",
      "SUPORTE NIVEL 2",
    ],
    "OSCILAÇÃO SEGUIDA": [
      "CARRO / SUPORTE TÉCNICO",
      "OSCILAÇÃO",
      "RECOLHIMENTO",
      "RECOLHIMENTO A PEDIDO",
      "SUPORTE NIVEL 1",
      "SUPORTE NIVEL 2",
    ],
    "SENHA TROCA": [
      "CARRO / SUPORTE TÉCNICO",
      "OSCILAÇÃO",
      "RECOLHIMENTO",
      "RECOLHIMENTO A PEDIDO",
      "SUPORTE NIVEL 1",
      "SUPORTE NIVEL 2",
    ],
    "SUPORTE NIVEL 1": [
      "CARRO / SUPORTE TÉCNICO",
      "OSCILAÇÃO",
      "RECOLHIMENTO",
      "RECOLHIMENTO A PEDIDO",
      "SUPORTE NIVEL 1",
      "SUPORTE NIVEL 2",
    ],
    "SUPORTE NIVEL 2": [
      "CARRO / SUPORTE TÉCNICO",
      "OSCILAÇÃO",
      "RECOLHIMENTO",
      "RECOLHIMENTO A PEDIDO",
      "SUPORTE NIVEL 1",
      "SUPORTE NIVEL 2",
    ],
  };

  const validPreviousCategories = recallScenarios[currentOrder.CATEGORIA];
  return validPreviousCategories ? validPreviousCategories.includes(previousOrder.CATEGORIA) : false;
}