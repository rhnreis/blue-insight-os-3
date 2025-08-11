export interface ServiceOrder {
  COD_SUPORTE: number;
  COD_CLIENTE: number;
  COD_SERVICO?: number;
  COD_SERVICO_CLIENTE?: number;
  NOME_CLIENTE: string;
  ENDERECO?: string;
  NUMERO?: string;
  COMPLEMENTO?: string;
  BAIRRO: string;
  CIDADE: string;
  ESTADO?: string;
  CATEGORIA: string;
  SUBCATEGORIA?: string;
  DATA_ABERTURA: string; // valor original
  HORA_ABERTURA?: string;
  DATA_FECHAMENTO: string; // originalmente DATA_ENCERRAMENTO no arquivo
  HORA_FECHAMENTO?: string;
  TECNICO: string;
  TECNICO_AUXILIAR?: string;
  DEFEITO?: string;
  TIPO_ATENDIMENTO?: string;
  OPERADOR?: string;
  NOTA?: string | number;
  BASE?: string;
  RawDateOpen?: Date; // calculada
  RawDateClose?: Date; // calculada
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