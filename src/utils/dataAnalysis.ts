import { ServiceOrder, ClientRecall, TechnicianStats, CategoryStats, DashboardKPIs, DashboardFilters } from '@/types/dashboard';
import { parse, isWithinInterval } from 'date-fns';

export function parseExcelData(data: any[]): ServiceOrder[] {
  return data.map(row => ({
    COD_SUPORTE: Number(row.COD_SUPORTE),
    COD_CLIENTE: Number(row.COD_CLIENTE),
    NOME_CLIENTE: String(row.NOME_CLIENTE || ''),
    BAIRRO: String(row.BAIRRO || ''),
    CIDADE: String(row.CIDADE || ''),
    CATEGORIA: String(row.CATEGORIA || ''),
    DATA_ABERTURA: String(row.DATA_ABERTURA || ''),
    DATA_FECHAMENTO: String(row.DATA_FECHAMENTO || ''),
    TECNICO: String(row.TECNICO || '')
  }));
}

export function parseDate(dateString: string): Date | null {
  try {
    // Tenta diferentes formatos de data
    const formats = ['dd/MM/yyyy', 'dd-MM-yyyy', 'yyyy-MM-dd'];
    
    for (const format of formats) {
      try {
        return parse(dateString, format, new Date());
      } catch {
        continue;
      }
    }
    
    // Se nenhum formato funcionar, tenta parsing direto
    return new Date(dateString);
  } catch {
    return null;
  }
}

export function filterServiceOrders(
  orders: ServiceOrder[],
  filters: DashboardFilters
): ServiceOrder[] {
  return orders.filter(order => {
    const dataFechamento = parseDate(order.DATA_FECHAMENTO);
    
    // Se não conseguir parsear a data, pula o registro
    if (!dataFechamento || isNaN(dataFechamento.getTime())) {
      return false;
    }

    const matchBairro =
      !filters.bairro || order.BAIRRO === filters.bairro;

    const matchCidade =
      !filters.cidade || order.CIDADE === filters.cidade;

    const matchTecnico =
      !filters.tecnico || order.TECNICO === filters.tecnico;

    const matchCategoria =
      !filters.categoria || order.CATEGORIA === filters.categoria;

    // Se não há filtros de data, só verifica os outros filtros
    if (!filters.dataInicio && !filters.dataFim) {
      return matchBairro && matchCidade && matchTecnico && matchCategoria;
    }

    // Normalizar as datas para comparação (apenas a data, sem horário)
    const fechamentoNormalized = new Date(dataFechamento.getFullYear(), dataFechamento.getMonth(), dataFechamento.getDate());
    
    let matchDataInicio = true;
    let matchDataFim = true;
    
    if (filters.dataInicio) {
      const inicioNormalized = new Date(filters.dataInicio.getFullYear(), filters.dataInicio.getMonth(), filters.dataInicio.getDate());
      matchDataInicio = fechamentoNormalized >= inicioNormalized;
    }
    
    if (filters.dataFim) {
      const fimNormalized = new Date(filters.dataFim.getFullYear(), filters.dataFim.getMonth(), filters.dataFim.getDate());
      matchDataFim = fechamentoNormalized <= fimNormalized;
    }

    return (
      matchDataInicio &&
      matchDataFim &&
      matchBairro &&
      matchCidade &&
      matchTecnico &&
      matchCategoria
    );
  });
}


export function analyzeRecalls(orders: ServiceOrder[]): ClientRecall[] {
  const clientGroups = new Map<number, ServiceOrder[]>();
  
  orders.forEach(order => {
    const codCliente = order.COD_CLIENTE;
    if (!clientGroups.has(codCliente)) {
      clientGroups.set(codCliente, []);
    }
    clientGroups.get(codCliente)!.push(order);
  });
  
  return Array.from(clientGroups.entries())
    .filter(([_, ordens]) => ordens.length > 1)
    .map(([codCliente, ordens]) => ({
      codCliente,
      nomeCliente: ordens[0].NOME_CLIENTE,
      totalOrdens: ordens.length,
      ordens: ordens.sort((a, b) => {
        const dateA = parseDate(a.DATA_FECHAMENTO);
        const dateB = parseDate(b.DATA_FECHAMENTO);
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      })
    }))
    .sort((a, b) => b.totalOrdens - a.totalOrdens);
}

export function analyzeTechnicians(orders: ServiceOrder[], recalls: ClientRecall[]): TechnicianStats[] {
  const technicianMap = new Map<string, { total: number; recalls: number }>();
  
  // Contar total de ordens por técnico
  orders.forEach(order => {
    const tecnico = order.TECNICO;
    if (!technicianMap.has(tecnico)) {
      technicianMap.set(tecnico, { total: 0, recalls: 0 });
    }
    technicianMap.get(tecnico)!.total++;
  });
  
  // Contar recalls por técnico
  recalls.forEach(recall => {
    recall.ordens.forEach(ordem => {
      const tecnico = ordem.TECNICO;
      if (technicianMap.has(tecnico)) {
        technicianMap.get(tecnico)!.recalls++;
      }
    });
  });
  
  return Array.from(technicianMap.entries())
    .map(([tecnico, stats]) => ({
      tecnico,
      totalRecalls: stats.recalls,
      totalOrdens: stats.total,
      percentualRecalls: stats.total > 0 ? (stats.recalls / stats.total) * 100 : 0
    }))
    .sort((a, b) => b.totalRecalls - a.totalRecalls);
}

export function analyzeCategories(orders: ServiceOrder[], recalls: ClientRecall[]): CategoryStats[] {
  const categoryMap = new Map<string, { total: number; recalls: number }>();
  
  // Contar total por categoria
  orders.forEach(order => {
    const categoria = order.CATEGORIA;
    if (!categoryMap.has(categoria)) {
      categoryMap.set(categoria, { total: 0, recalls: 0 });
    }
    categoryMap.get(categoria)!.total++;
  });
  
  // Contar recalls por categoria
  recalls.forEach(recall => {
    recall.ordens.forEach(ordem => {
      const categoria = ordem.CATEGORIA;
      if (categoryMap.has(categoria)) {
        categoryMap.get(categoria)!.recalls++;
      }
    });
  });
  
  return Array.from(categoryMap.entries())
    .map(([categoria, stats]) => ({
      categoria,
      total: stats.total,
      recalls: stats.recalls,
      percentual: stats.total > 0 ? (stats.recalls / stats.total) * 100 : 0
    }))
    .sort((a, b) => b.recalls - a.recalls);
}

export function calculateKPIs(orders: ServiceOrder[], recalls: ClientRecall[], technicians: TechnicianStats[]): DashboardKPIs {
  const totalOrdens = orders.length;
  const totalRecalls = recalls.reduce((acc, recall) => acc + recall.totalOrdens, 0);
  const percentualRecalls = totalOrdens > 0 ? (totalRecalls / totalOrdens) * 100 : 0;
  
  const clienteComMaisRecalls = recalls.length > 0 ? recalls[0] : null;
  const tecnicoComMaisRecalls = technicians.length > 0 ? technicians[0] : null;
  
  return {
    totalOrdens,
    totalRecalls,
    percentualRecalls,
    clienteComMaisRecalls: {
      nome: clienteComMaisRecalls?.nomeCliente || 'N/A',
      quantidade: clienteComMaisRecalls?.totalOrdens || 0
    },
    tecnicoComMaisRecalls: {
      nome: tecnicoComMaisRecalls?.tecnico || 'N/A',
      quantidade: tecnicoComMaisRecalls?.totalRecalls || 0
    }
  };
}

export function analyzeRecallsByCity(recalls: ClientRecall[]): { cidade: string; recalls: number }[] {
  const cityMap = new Map<string, number>();
  
  recalls.forEach(recall => {
    recall.ordens.forEach(ordem => {
      const cidade = ordem.CIDADE;
      cityMap.set(cidade, (cityMap.get(cidade) || 0) + 1);
    });
  });
  
  return Array.from(cityMap.entries())
    .map(([cidade, recalls]) => ({ cidade, recalls }))
    .sort((a, b) => b.recalls - a.recalls);
}

export function analyzeRecallsByDate(recalls: ClientRecall[]): { data: string; recalls: number }[] {
  const dateMap = new Map<string, number>();
  
  recalls.forEach(recall => {
    recall.ordens.forEach(ordem => {
      const data = parseDate(ordem.DATA_FECHAMENTO);
      if (data && !isNaN(data.getTime())) {
        const dateKey = data.toISOString().split('T')[0]; // YYYY-MM-DD
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      }
    });
  });
  
  return Array.from(dateMap.entries())
    .map(([data, recalls]) => ({ data, recalls }))
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
}

export function analyzeRecallsByCityFromOrders(filteredOrders: ServiceOrder[], recalls: ClientRecall[]): { cidade: string; recalls: number }[] {
  // Criar set dos IDs de ordens que são rechamadas nos dados filtrados
  const recallOrderIds = new Set<number>();
  recalls.forEach(recall => {
    recall.ordens.forEach(ordem => {
      recallOrderIds.add(ordem.COD_SUPORTE);
    });
  });
  
  const cityMap = new Map<string, number>();
  
  // Contar apenas ordens filtradas que são rechamadas
  filteredOrders.forEach(ordem => {
    if (recallOrderIds.has(ordem.COD_SUPORTE)) {
      const cidade = ordem.CIDADE;
      cityMap.set(cidade, (cityMap.get(cidade) || 0) + 1);
    }
  });
  
  return Array.from(cityMap.entries())
    .map(([cidade, recalls]) => ({ cidade, recalls }))
    .sort((a, b) => b.recalls - a.recalls);
}

export function analyzeRecallsByDateFromOrders(filteredOrders: ServiceOrder[], recalls: ClientRecall[]): { data: string; recalls: number }[] {
  // Criar set dos IDs de ordens que são rechamadas nos dados filtrados
  const recallOrderIds = new Set<number>();
  recalls.forEach(recall => {
    recall.ordens.forEach(ordem => {
      recallOrderIds.add(ordem.COD_SUPORTE);
    });
  });
  
  const dateMap = new Map<string, number>();
  
  // Contar apenas ordens filtradas que são rechamadas
  filteredOrders.forEach(ordem => {
    if (recallOrderIds.has(ordem.COD_SUPORTE)) {
      const data = parseDate(ordem.DATA_FECHAMENTO);
      if (data && !isNaN(data.getTime())) {
        const dateKey = data.toISOString().split('T')[0]; // YYYY-MM-DD
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      }
    }
  });
  
  return Array.from(dateMap.entries())
    .map(([data, recalls]) => ({ data, recalls }))
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
}

export function analyzeRecallsByMonth(orders: ServiceOrder[], recalls: ClientRecall[]): { mes: string; totalOrdens: number; rechamadas: number; percentual: number }[] {
  const monthMap = new Map<string, { total: number; recalls: number }>();
  
  // Contar total de ordens por mês
  orders.forEach(order => {
    const data = parseDate(order.DATA_FECHAMENTO);
    if (data && !isNaN(data.getTime())) {
      const monthKey = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { total: 0, recalls: 0 });
      }
      monthMap.get(monthKey)!.total++;
    }
  });
  
  // Contar rechamadas por mês
  recalls.forEach(recall => {
    recall.ordens.forEach(ordem => {
      const data = parseDate(ordem.DATA_FECHAMENTO);
      if (data && !isNaN(data.getTime())) {
        const monthKey = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
        if (monthMap.has(monthKey)) {
          monthMap.get(monthKey)!.recalls++;
        }
      }
    });
  });
  
  return Array.from(monthMap.entries())
    .map(([monthKey, stats]) => {
      const [year, month] = monthKey.split('-');
      const monthNames = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];
      return {
        mes: `${monthNames[parseInt(month) - 1]}/${year}`,
        totalOrdens: stats.total,
        rechamadas: stats.recalls,
        percentual: stats.total > 0 ? (stats.recalls / stats.total) * 100 : 0
      };
    })
    .sort((a, b) => {
      const [monthA, yearA] = a.mes.split('/');
      const [monthB, yearB] = b.mes.split('/');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const dateA = new Date(parseInt(yearA), monthNames.indexOf(monthA));
      const dateB = new Date(parseInt(yearB), monthNames.indexOf(monthB));
      return dateA.getTime() - dateB.getTime();
    });
}

export function generateInsights(kpis: DashboardKPIs, recalls: ClientRecall[], categories: CategoryStats[]): string[] {
  const insights: string[] = [];
  
  insights.push(
    `No período selecionado, ${kpis.percentualRecalls.toFixed(1)}% dos clientes tiveram mais de uma ordem de serviço.`
  );
  
  if (kpis.clienteComMaisRecalls.quantidade > 0) {
    insights.push(
      `O cliente com maior número de rechamadas foi ${kpis.clienteComMaisRecalls.nome} com ${kpis.clienteComMaisRecalls.quantidade} ordens.`
    );
  }
  
  if (kpis.tecnicoComMaisRecalls.quantidade > 0) {
    insights.push(
      `O técnico com maior número de rechamadas foi ${kpis.tecnicoComMaisRecalls.nome} com ${kpis.tecnicoComMaisRecalls.quantidade} atendimentos repetidos.`
    );
  }
  
  if (categories.length > 0) {
    insights.push(
      `A categoria mais recorrente em rechamadas foi ${categories[0].categoria} com ${categories[0].recalls} ocorrências.`
    );
  }
  
  const clientesComRecalls = recalls.length;
  if (clientesComRecalls > 0) {
    insights.push(
      `${clientesComRecalls} clientes necessitaram de múltiplos atendimentos no período analisado.`
    );
  }
  
  return insights;
}

export function getAvailableDates(orders: ServiceOrder[]): Date[] {
  const dates = new Set<string>();
  
  orders.forEach(order => {
    const fechamento = parseDate(order.DATA_FECHAMENTO);
    if (fechamento && !isNaN(fechamento.getTime())) {
      dates.add(fechamento.toISOString().split('T')[0]);
    }
  });
  
  return Array.from(dates)
    .sort()
    .map(dateStr => new Date(dateStr));
}