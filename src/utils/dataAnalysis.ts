import { ServiceOrder, ClientRecall, TechnicianStats, CategoryStats, DashboardKPIs, DashboardFilters } from '@/types/dashboard';
import { parse } from 'date-fns';

export function parseImportedData(data: Record<string, unknown>[]): ServiceOrder[] {
  return data.map(row => {
    // Normalize headers - handle common variations
    const normalizedRow: Record<string, unknown> = {};
    Object.keys(row).forEach(key => {
      const normalizedKey = key.trim()
        .replace(/\s+/g, '_')
        .toUpperCase()
        .replace(/DATA_ENCERRAMENTO/g, 'DATA_FECHAMENTO');
      normalizedRow[normalizedKey] = row[key];
    });

    // Parse dates and times
    const rawDateOpen = parseDateTime(
      normalizedRow.DATA_ABERTURA, 
      normalizedRow.HORA_ABERTURA
    );
    const rawDateClose = parseDateTime(
      normalizedRow.DATA_FECHAMENTO, 
      normalizedRow.HORA_FECHAMENTO
    );

    return {
      COD_SUPORTE: Number(normalizedRow.COD_SUPORTE),
      COD_CLIENTE: Number(normalizedRow.COD_CLIENTE),
      COD_SERVICO: normalizedRow.COD_SERVICO ? Number(normalizedRow.COD_SERVICO) : undefined,
      COD_SERVICO_CLIENTE: normalizedRow.COD_SERVICO_CLIENTE ? Number(normalizedRow.COD_SERVICO_CLIENTE) : undefined,
      NOME_CLIENTE: String(normalizedRow.NOME_CLIENTE || ''),
      ENDERECO: normalizedRow.ENDERECO ? String(normalizedRow.ENDERECO) : undefined,
      NUMERO: normalizedRow.NUMERO ? String(normalizedRow.NUMERO) : undefined,
      COMPLEMENTO: normalizedRow.COMPLEMENTO ? String(normalizedRow.COMPLEMENTO) : undefined,
      BAIRRO: String(normalizedRow.BAIRRO || ''),
      CIDADE: String(normalizedRow.CIDADE || ''),
      ESTADO: normalizedRow.ESTADO ? String(normalizedRow.ESTADO) : undefined,
      CATEGORIA: String(normalizedRow.CATEGORIA || ''),
      SUBCATEGORIA: normalizedRow.SUBCATEGORIA ? String(normalizedRow.SUBCATEGORIA) : undefined,
      DATA_ABERTURA: normalizedRow.DATA_ABERTURA,
      HORA_ABERTURA: normalizedRow.HORA_ABERTURA ? String(normalizedRow.HORA_ABERTURA) : undefined,
      DATA_FECHAMENTO: normalizedRow.DATA_FECHAMENTO,
      HORA_FECHAMENTO: normalizedRow.HORA_FECHAMENTO ? String(normalizedRow.HORA_FECHAMENTO) : undefined,
      TECNICO: String(normalizedRow.TECNICO || ''),
      TECNICO_AUXILIAR: normalizedRow.TECNICO_AUXILIAR ? String(normalizedRow.TECNICO_AUXILIAR) : undefined,
      DEFEITO: normalizedRow.DEFEITO ? String(normalizedRow.DEFEITO) : undefined,
      TIPO_ATENDIMENTO: normalizedRow.TIPO_ATENDIMENTO ? String(normalizedRow.TIPO_ATENDIMENTO) : undefined,
      OPERADOR: normalizedRow.OPERADOR ? String(normalizedRow.OPERADOR) : undefined,
      NOTA: normalizedRow.NOTA !== undefined ? normalizedRow.NOTA : undefined,
      BASE: normalizedRow.BASE ? String(normalizedRow.BASE) : undefined,
      RawDateOpen: rawDateOpen,
      RawDateClose: rawDateClose
    };
  });
}

// Enhanced date parsing function that handles both dates and times
export function parseDate(dateValue: unknown): Date | null {
  try {
    if (!dateValue) return null;

    // Se vier como número (serial do Excel)
    if (typeof dateValue === 'number') {
      return new Date((dateValue - 25569) * 86400 * 1000);
    }

    if (dateValue instanceof Date) return dateValue;

    const str = String(dateValue).trim();

    const formats = ['dd/MM/yyyy HH:mm:ss', 'dd/MM/yyyy HH:mm', 'dd/MM/yyyy', 'yyyy-MM-dd HH:mm:ss', 'yyyy-MM-dd HH:mm', 'yyyy-MM-dd', 'MM/dd/yyyy HH:mm:ss', 'MM/dd/yyyy HH:mm', 'MM/dd/yyyy'];
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

// Function to combine date and time strings
export function parseDateTime(dateValue: unknown, timeValue?: unknown): Date | null {
  try {
    if (!dateValue) return null;

    // If we have separate date and time values, combine them
    if (timeValue) {
      const dateStr = String(dateValue).trim();
      const timeStr = String(timeValue).trim();
      
      // Try to parse combined date and time
      const combinedStr = `${dateStr} ${timeStr}`;
      const combined = parseDate(combinedStr);
      if (combined) return combined;
    }

    // Fallback to just parsing the date
    return parseDate(dateValue);
  } catch {
    return parseDate(dateValue);
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

    const dataFechamento = order.RawDateClose || parseDate(order.DATA_FECHAMENTO);

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
        const dateA = a.RawDateClose || parseDate(a.DATA_FECHAMENTO);
        const dateB = b.RawDateClose || parseDate(b.DATA_FECHAMENTO);
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      })
    }))
    .sort((a, b) => b.totalOrdens - a.totalOrdens);
}

export function analyzeTechnicians(orders: ServiceOrder[], recalls: ClientRecall[]): TechnicianStats[] {
  const technicianMap = new Map<string, { total: number; recalls: number }>();
  orders.forEach(order => {
    const tecnico = order.TECNICO;
    if (!technicianMap.has(tecnico)) {
      technicianMap.set(tecnico, { total: 0, recalls: 0 });
    }
    technicianMap.get(tecnico)!.total++;
  });

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
  orders.forEach(order => {
    const categoria = order.CATEGORIA;
    if (!categoryMap.has(categoria)) {
      categoryMap.set(categoria, { total: 0, recalls: 0 });
    }
    categoryMap.get(categoria)!.total++;
  });

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
      const data = ordem.RawDateClose || parseDate(ordem.DATA_FECHAMENTO);
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

export function analyzeRecallsByCityFromOrders(filteredOrders: ServiceOrder[], recalls: ClientRecall[]): { cidade: string; recalls: number }[] {
  const recallOrderIds = new Set<number>();
  recalls.forEach(recall => {
    recall.ordens.forEach(ordem => {
      recallOrderIds.add(ordem.COD_SUPORTE);
    });
  });
  const cityMap = new Map<string, number>();
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
  const recallOrderIds = new Set<number>();
  recalls.forEach(recall => {
    recall.ordens.forEach(ordem => {
      recallOrderIds.add(ordem.COD_SUPORTE);
    });
  });
  const dateMap = new Map<string, number>();
  filteredOrders.forEach(ordem => {
    if (recallOrderIds.has(ordem.COD_SUPORTE)) {
      const data = ordem.RawDateClose || parseDate(ordem.DATA_FECHAMENTO);
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

export function analyzeRecallsByMonth(orders: ServiceOrder[], recalls: ClientRecall[]): { mes: string; totalOrdens: number; rechamadas: number; percentual: number }[] {
  const monthMap = new Map<string, { total: number; recalls: number }>();
  orders.forEach(order => {
    const data = order.RawDateClose || parseDate(order.DATA_FECHAMENTO);
    if (data && !isNaN(data.getTime())) {
      const monthKey = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { total: 0, recalls: 0 });
      }
      monthMap.get(monthKey)!.total++;
    }
  });
  recalls.forEach(recall => {
    recall.ordens.forEach(ordem => {
      const data = ordem.RawDateClose || parseDate(ordem.DATA_FECHAMENTO);
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
    const fechamento = order.RawDateClose || parseDate(order.DATA_FECHAMENTO);
    if (fechamento && !isNaN(fechamento.getTime())) {
      dates.add(fechamento.toISOString().split('T')[0]);
    }
  });
  return Array.from(dates).sort().map(dateStr => new Date(dateStr));
}

// New function to compute recalls based on time windows
export function computeRecalls(orders: ServiceOrder[], janelaMinutos: number = 1440): ServiceOrder[] {
  if (orders.length === 0) return [];

  // Group orders by client and optionally by service code
  const clientGroups = new Map<string, ServiceOrder[]>();
  
  orders.forEach(order => {
    // Use COD_CLIENTE and COD_SERVICO_CLIENTE as grouping key when available
    const groupKey = order.COD_SERVICO_CLIENTE 
      ? `${order.COD_CLIENTE}_${order.COD_SERVICO_CLIENTE}`
      : String(order.COD_CLIENTE);
      
    if (!clientGroups.has(groupKey)) {
      clientGroups.set(groupKey, []);
    }
    clientGroups.get(groupKey)!.push(order);
  });

  const recallOrders: ServiceOrder[] = [];

  // Analyze each client group for recalls
  clientGroups.forEach(clientOrders => {
    // Sort orders by close date
    const sortedOrders = clientOrders
      .filter(order => {
        const closeDate = order.RawDateClose || parseDate(order.DATA_FECHAMENTO);
        return closeDate && !isNaN(closeDate.getTime());
      })
      .sort((a, b) => {
        const dateA = a.RawDateClose || parseDate(a.DATA_FECHAMENTO);
        const dateB = b.RawDateClose || parseDate(b.DATA_FECHAMENTO);
        return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
      });

    // Check each order against the previous one for recalls
    for (let i = 1; i < sortedOrders.length; i++) {
      const currentOrder = sortedOrders[i];
      const previousOrder = sortedOrders[i - 1];

      const currentOpenDate = currentOrder.RawDateOpen || parseDate(currentOrder.DATA_ABERTURA);
      const previousCloseDate = previousOrder.RawDateClose || parseDate(previousOrder.DATA_FECHAMENTO);

      if (currentOpenDate && previousCloseDate) {
        const diffMinutes = (currentOpenDate.getTime() - previousCloseDate.getTime()) / (1000 * 60);
        
        // If the time difference is within the window, mark as recall
        if (diffMinutes >= 0 && diffMinutes <= janelaMinutos) {
          recallOrders.push(currentOrder);
        }
      }
    }
  });

  return recallOrders;
}
