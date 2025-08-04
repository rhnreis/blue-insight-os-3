export interface ServiceOrder {
  COD_SUPORTE: number;
  COD_CLIENTE: number;
  NOME_CLIENTE: string;
  BAIRRO: string;
  CIDADE: string;
  CATEGORIA: string;
  DATA_ABERTURA: string;
  DATA_FECHAMENTO: string;
  TECNICO: string;
}

export interface ClientRecall {
  codCliente: number;
  nomeCliente: string;
  totalOrdens: number;
  ordens: ServiceOrder[];
}

export interface TechnicianStats {
  tecnico: string;
  totalRecalls: number;
  totalOrdens: number;
  percentualRecalls: number;
}

export interface CategoryStats {
  categoria: string;
  total: number;
  recalls: number;
  percentual: number;
}

export interface DashboardFilters {
  bairro?: string;
  cidade?: string;
  categoria?: string;
  tecnico?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

export interface DashboardKPIs {
  totalOrdens: number;
  totalRecalls: number;
  percentualRecalls: number;
  clienteComMaisRecalls: {
    nome: string;
    quantidade: number;
  };
  tecnicoComMaisRecalls: {
    nome: string;
    quantidade: number;
  };
}