import { ServiceOrder, ClientRecall, TechnicianStats, CategoryStats, DashboardKPIs, DashboardFilters } from '@/types/dashboard';
import { parse } from 'date-fns';
import { computeRecalls, DateFilter } from './recallLogic';

export function parseExcelData(data: Record<string, unknown>[]): ServiceOrder[] {
  return data.map(row => ({
    COD_SUPORTE: Number(row.COD_SUPORTE),
    COD_CLIENTE: Number(row.COD_CLIENTE),
    COD_SERVICO_CLIENTE: row.COD_SERVICO_CLIENTE ? Number(row.COD_SERVICO_CLIENTE) : undefined,
    NOME_CLIENTE: String(row.NOME_CLIENTE || ''),
    BAIRRO: String(row.BAIRRO || ''),
    CIDADE: String(row.CIDADE || ''),
    CATEGORIA: String(row.CATEGORIA || ''),
    DATA_ABERTURA: row.DATA_ABERTURA,
    HORA_ABERTURA: row.HORA_ABERTURA ? String(row.HORA_ABERTURA) : undefined,
    DATA_FECHAMENTO: row.DATA_FECHAMENTO,
    TECNICO: String(row.TECNICO || '')
  }));
}

// Função ajustada para lidar com vários formatos e números do Excel
export function parseDate(dateValue: string | number | Date | null | undefined): Date | null {
  try {
    if (!dateValue) return null;

    // Se vier como número (serial do Excel)
    if (typeof dateValue === 'number') {
      return new Date((dateValue - 25569) * 86400 * 1000);
    }

    if (dateValue instanceof Date) return dateValue;

    const str = String(dateValue).trim();

    const formats = ['dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
    for (const format of formats) {
      const parsed = parse(str, format, new Date());
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Fallback para datas no formato nativo JS
    const fallback = new Date(str);
    return isNaN(fallback.getTime()) ? null : fallback;
  } catch {
    return null;
  }
}

export function filterServiceOrders(
  orders: ServiceOrder[],
  filters: DashboardFilters
): ServiceOrder[] {
  if (filters.dataInicio || filters.dataFim) {
    console.log('=== FILTROS DE DATA APLICADOS ===');
    console.log('DataInicio:', filters.dataInicio);
    console.log('DataFim:', filters.dataFim);
    console.log('Total de ordens:', orders.length);
  }

  return orders.filter(order => {
    const matchBairro = !filters.bairro || order.BAIRRO === filters.bairro;
    const matchCidade = !filters.cidade || order.CIDADE === filters.cidade;
    const matchTecnico = !filters.tecnico || order.TECNICO === filters.tecnico;
    const matchCategoria = !filters.categoria || order.CATEGORIA === filters.categoria;

    if (!filters.dataInicio && !filters.dataFim) {
      return matchBairro && matchCidade && matchTecnico && matchCategoria;
    }

    const dataFechamento = parseDate(order.DATA_FECHAMENTO);

    if (!dataFechamento || isNaN(dataFechamento.getTime())) {
      console.warn(`Data inválida na ordem ${order.COD_SUPORTE}: ${order.DATA_FECHAMENTO}`);
      return false;
    }

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

export function analyzeRecalls(orders: ServiceOrder[], dateFilter?: DateFilter): ClientRecall[] {
  // Use the new sequential recall logic
  const recallAnalysis = computeRecalls(orders, dateFilter || {});
  
  // Group recalled orders by client for the ClientRecall interface
  const clientGroups = new Map<number, ServiceOrder[]>();
  
  // First, identify all orders that are recalls
  const recallOrdersMap = new Map<number, ServiceOrder>();
  orders.forEach(order => {
    if (recallAnalysis.recallOrderIds.has(order.COD_SUPORTE)) {
      recallOrdersMap.set(order.COD_SUPORTE, order);
    }
  });
  
  // Group recall orders by client
  recallOrdersMap.forEach(order => {
    const codCliente = order.COD_CLIENTE;
    if (!clientGroups.has(codCliente)) {
      clientGroups.set(codCliente, []);
    }
    clientGroups.get(codCliente)!.push(order);
  });
  
  // Convert to ClientRecall format
  return Array.from(clientGroups.entries())
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

export function analyzeTechnicians(orders: ServiceOrder[], recalls: ClientRecall[], dateFilter?: DateFilter): TechnicianStats[] {
  const technicianMap = new Map<string, { total: number; recalls: number }>();
  
  // Get recall order IDs using the new logic
  const recallAnalysis = computeRecalls(orders, dateFilter || {});
  
  orders.forEach(order => {
    const tecnico = order.TECNICO;
    if (!technicianMap.has(tecnico)) {
      technicianMap.set(tecnico, { total: 0, recalls: 0 });
    }
    technicianMap.get(tecnico)!.total++;
    
    // Count recalls using the new sequential logic
    if (recallAnalysis.recallOrderIds.has(order.COD_SUPORTE)) {
      technicianMap.get(tecnico)!.recalls++;
    }
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

export function analyzeCategories(orders: ServiceOrder[], recalls: ClientRecall[], dateFilter?: DateFilter): CategoryStats[] {
  const categoryMap = new Map<string, { total: number; recalls: number }>();
  
  // Get recall order IDs using the new logic
  const recallAnalysis = computeRecalls(orders, dateFilter || {});
  
  orders.forEach(order => {
    const categoria = order.CATEGORIA;
    if (!categoryMap.has(categoria)) {
      categoryMap.set(categoria, { total: 0, recalls: 0 });
    }
    categoryMap.get(categoria)!.total++;
    
    // Count recalls using the new sequential logic
    if (recallAnalysis.recallOrderIds.has(order.COD_SUPORTE)) {
      categoryMap.get(categoria)!.recalls++;
    }
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

export function calculateKPIs(orders: ServiceOrder[], recalls: ClientRecall[], technicians: TechnicianStats[], dateFilter?: DateFilter): DashboardKPIs {
  const totalOrdens = orders.length;
  
  // Calculate total recalls using the new sequential logic
  const recallAnalysis = computeRecalls(orders, dateFilter || {});
  const totalRecalls = recallAnalysis.recallOrderIds.size;
  const percentualRecalls = totalOrdens > 0 ? (totalRecalls / totalOrdens) * 100 : 0;

  // Find client with most recalls based on (COD_CLIENTE, COD_SERVICO_CLIENTE) groups
  let clienteComMaisRecalls: { nome: string; quantidade: number } = { nome: 'N/A', quantidade: 0 };
  
  if (recallAnalysis.recallsByClient.size > 0) {
    let maxRecalls = 0;
    let bestClientName = 'N/A';
    
    for (const [groupKey, recallList] of recallAnalysis.recallsByClient) {
      if (recallList.length > maxRecalls) {
        maxRecalls = recallList.length;
        // Find a representative order to get client name
        const representativeOrder = orders.find(o => recallList.some(r => r.ordemId === o.COD_SUPORTE));
        bestClientName = representativeOrder?.NOME_CLIENTE || 'N/A';
      }
    }
    
    clienteComMaisRecalls = { nome: bestClientName, quantidade: maxRecalls };
  }

  const tecnicoComMaisRecalls = technicians.length > 0 ? technicians[0] : null;

  return {
    totalOrdens,
    totalRecalls,
    percentualRecalls,
    clienteComMaisRecalls,
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
        const dateKey = data.toISOString().split('T')[0];
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      }
    });
  });
  return Array.from(dateMap.entries())
    .map(([data, recalls]) => ({ data, recalls }))
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
}

export function analyzeRecallsByCityFromOrders(filteredOrders: ServiceOrder[], recalls: ClientRecall[], dateFilter?: DateFilter): { cidade: string; recalls: number }[] {
  // Get recall order IDs using the new sequential logic
  const recallAnalysis = computeRecalls(filteredOrders, dateFilter || {});
  
  const cityMap = new Map<string, number>();
  filteredOrders.forEach(ordem => {
    if (recallAnalysis.recallOrderIds.has(ordem.COD_SUPORTE)) {
      const cidade = ordem.CIDADE;
      cityMap.set(cidade, (cityMap.get(cidade) || 0) + 1);
    }
  });
  return Array.from(cityMap.entries())
    .map(([cidade, recalls]) => ({ cidade, recalls }))
    .sort((a, b) => b.recalls - a.recalls);
}

export function analyzeRecallsByDateFromOrders(filteredOrders: ServiceOrder[], recalls: ClientRecall[], dateFilter?: DateFilter): { data: string; recalls: number }[] {
  // Get recall order IDs using the new sequential logic
  const recallAnalysis = computeRecalls(filteredOrders, dateFilter || {});
  
  const dateMap = new Map<string, number>();
  filteredOrders.forEach(ordem => {
    if (recallAnalysis.recallOrderIds.has(ordem.COD_SUPORTE)) {
      const data = parseDate(ordem.DATA_FECHAMENTO);
      if (data && !isNaN(data.getTime())) {
        const dateKey = data.toISOString().split('T')[0];
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      }
    }
  });
  return Array.from(dateMap.entries())
    .map(([data, recalls]) => ({ data, recalls }))
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
}

export function analyzeRecallsByMonth(orders: ServiceOrder[], recalls: ClientRecall[], dateFilter?: DateFilter): { mes: string; totalOrdens: number; rechamadas: number; percentual: number }[] {
  const monthMap = new Map<string, { total: number; recalls: number }>();
  
  // Get recall order IDs using the new sequential logic
  const recallAnalysis = computeRecalls(orders, dateFilter || {});
  
  orders.forEach(order => {
    const data = parseDate(order.DATA_FECHAMENTO);
    if (data && !isNaN(data.getTime())) {
      const monthKey = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { total: 0, recalls: 0 });
      }
      monthMap.get(monthKey)!.total++;
      
      // Count recalls using the new sequential logic
      if (recallAnalysis.recallOrderIds.has(order.COD_SUPORTE)) {
        monthMap.get(monthKey)!.recalls++;
      }
    }
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
  insights.push(`No período selecionado, ${kpis.percentualRecalls.toFixed(1)}% dos clientes tiveram mais de uma ordem de serviço.`);
  if (kpis.clienteComMaisRecalls.quantidade > 0) {
    insights.push(`O cliente com maior número de rechamadas foi ${kpis.clienteComMaisRecalls.nome} com ${kpis.clienteComMaisRecalls.quantidade} ordens.`);
  }
  if (kpis.tecnicoComMaisRecalls.quantidade > 0) {
    insights.push(`O técnico com maior número de rechamadas foi ${kpis.tecnicoComMaisRecalls.nome} com ${kpis.tecnicoComMaisRecalls.quantidade} atendimentos repetidos.`);
  }
  if (categories.length > 0) {
    insights.push(`A categoria mais recorrente em rechamadas foi ${categories[0].categoria} com ${categories[0].recalls} ocorrências.`);
  }
  const clientesComRecalls = recalls.length;
  if (clientesComRecalls > 0) {
    insights.push(`${clientesComRecalls} clientes necessitaram de múltiplos atendimentos no período analisado.`);
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
  return Array.from(dates).sort().map(dateStr => new Date(dateStr));
}
