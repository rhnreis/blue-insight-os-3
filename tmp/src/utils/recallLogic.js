"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeRecalls = computeRecalls;
const date_fns_1 = require("date-fns");
/**
 * Recall detection based on sequential category chains and dynamic time windows.
 *
 * Business Logic:
 * - GATILHOS: Categories that can trigger subsequent recalls
 * - SUBSEQUENTES: Categories that indicate a recall if preceded by a GATILHO
 * - Groups orders by (COD_CLIENTE, COD_SERVICO_CLIENTE)
 * - Uses DATA_ABERTURA + HORA_ABERTURA for temporal ordering
 * - Dynamic window = (endDate - startDate + 1) days
 * - Supports cascading recalls (a recall can trigger another recall)
 */
// Category sets for recall detection (normalized)
const GATILHOS = new Set([
    'ATIVACAO',
    'CARRO / SUPORTE TECNICO',
    'COMODATO ROTEADOR',
    'MUDANCA DE ENDERECO',
    'MUDANCA DE LOCAL',
    'OSCILACAO',
    'SENHA TROCA',
    'SUPORTE NIVEL 1',
    'SUPORTE NIVEL 2'
]);
const SUBSEQUENTES = new Set([
    'CARRO / SUPORTE TECNICO',
    'OSCILACAO',
    'RECOLHIMENTO',
    'RECOLHIMENTO A PEDIDO',
    'SUPORTE NIVEL 1',
    'SUPORTE NIVEL 2'
]);
/**
 * Normalizes category text by removing accents, converting to uppercase, and trimming
 */
function normalizeCategory(category) {
    if (!category)
        return '';
    return category
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remove diacritical marks
}
/**
 * Parse date and time from DATA_ABERTURA and HORA_ABERTURA fields
 * Returns null if parsing fails
 */
function parseAbertura(dataAbertura, horaAbertura) {
    try {
        if (!dataAbertura)
            return null;
        let dateStr = '';
        // Handle Excel serial numbers
        if (typeof dataAbertura === 'number') {
            const date = new Date((dataAbertura - 25569) * 86400 * 1000);
            dateStr = date.toISOString().split('T')[0];
        }
        else if (dataAbertura instanceof Date) {
            dateStr = dataAbertura.toISOString().split('T')[0];
        }
        else {
            const str = String(dataAbertura).trim();
            // Try parsing dd/mm/yyyy format
            const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(str);
            if (ddmmyyyy) {
                const [, day, month, year] = ddmmyyyy;
                dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            else {
                // Try other formats
                const parsed = (0, date_fns_1.parse)(str, 'dd/MM/yyyy', new Date());
                if (!isNaN(parsed.getTime())) {
                    dateStr = parsed.toISOString().split('T')[0];
                }
                else {
                    // Fallback to native Date parsing
                    const fallback = new Date(str);
                    if (!isNaN(fallback.getTime())) {
                        dateStr = fallback.toISOString().split('T')[0];
                    }
                    else {
                        return null;
                    }
                }
            }
        }
        // Add time component if available
        let timeStr = '00:00:00';
        if (horaAbertura) {
            const horaStr = String(horaAbertura).trim();
            // Handle HH:MM:SS or HH:MM formats
            const timeMatch = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(horaStr);
            if (timeMatch) {
                const [, hours, minutes, seconds = '00'] = timeMatch;
                timeStr = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
            }
        }
        const fullDateStr = `${dateStr}T${timeStr}`;
        const result = new Date(fullDateStr);
        return isNaN(result.getTime()) ? null : result;
    }
    catch {
        return null;
    }
}
/**
 * Computes recalls based on sequential category analysis
 *
 * @param orders - Array of service orders
 * @param dateFilter - Date range filter for recall candidates
 * @returns RecallAnalysis object with recall mappings and statistics
 */
function computeRecalls(orders, dateFilter) {
    const recallsByClient = new Map();
    const recallOrderIds = new Set();
    const recallPairs = [];
    if (!orders.length) {
        return { recallsByClient, recallOrderIds, recallPairs };
    }
    // Calculate dynamic window in milliseconds
    let windowMs = Infinity; // Default to no limit if no date filter
    if (dateFilter.dataInicio && dateFilter.dataFim) {
        const windowDays = Math.ceil((dateFilter.dataFim.getTime() - dateFilter.dataInicio.getTime()) / (24 * 60 * 60 * 1000)) + 1;
        windowMs = windowDays * 24 * 60 * 60 * 1000;
    }
    // Group orders by (COD_CLIENTE, COD_SERVICO_CLIENTE)
    const orderGroups = new Map();
    for (const order of orders) {
        // Skip orders with missing essential data
        if (!order.COD_CLIENTE || !order.CATEGORIA)
            continue;
        // Use COD_SERVICO_CLIENTE if available, otherwise default to COD_CLIENTE
        const serviceKey = order.COD_SERVICO_CLIENTE || order.COD_CLIENTE;
        const groupKey = `${order.COD_CLIENTE}-${serviceKey}`;
        if (!orderGroups.has(groupKey)) {
            orderGroups.set(groupKey, []);
        }
        orderGroups.get(groupKey).push(order);
    }
    // Process each group
    for (const [groupKey, groupOrders] of orderGroups) {
        // Parse dates and filter invalid orders
        const ordersWithDates = groupOrders
            .map(order => ({
            ...order,
            aberturaDate: parseAbertura(order.DATA_ABERTURA, order.HORA_ABERTURA),
            normalizedCategory: normalizeCategory(order.CATEGORIA)
        }))
            .filter(order => order.aberturaDate !== null)
            .sort((a, b) => a.aberturaDate.getTime() - b.aberturaDate.getTime());
        if (ordersWithDates.length < 2)
            continue;
        // Find recalls in this group
        for (let i = 0; i < ordersWithDates.length; i++) {
            const currentOrder = ordersWithDates[i];
            // Skip if current order is not a SUBSEQUENTE category
            if (!SUBSEQUENTES.has(currentOrder.normalizedCategory))
                continue;
            // Check if current order falls within the date filter (for recall candidates)
            const currentDate = currentOrder.aberturaDate;
            let isInDateRange = true;
            if (dateFilter.dataInicio || dateFilter.dataFim) {
                if (dateFilter.dataInicio && currentDate < dateFilter.dataInicio)
                    isInDateRange = false;
                if (dateFilter.dataFim && currentDate > dateFilter.dataFim)
                    isInDateRange = false;
            }
            if (!isInDateRange)
                continue;
            // Look for most recent previous GATILHO within window
            let foundTrigger = null;
            for (let j = i - 1; j >= 0; j--) {
                const previousOrder = ordersWithDates[j];
                const timeDiff = currentDate.getTime() - previousOrder.aberturaDate.getTime();
                // Stop searching if we exceed the window
                if (timeDiff > windowMs)
                    break;
                // Check if this is a valid trigger
                if (GATILHOS.has(previousOrder.normalizedCategory)) {
                    foundTrigger = previousOrder;
                    break; // Take the most recent trigger
                }
            }
            // If we found a trigger, this is a recall
            if (foundTrigger) {
                const diffMinutes = Math.round((currentDate.getTime() - foundTrigger.aberturaDate.getTime()) / (60 * 1000));
                const recallResult = {
                    ordemId: currentOrder.COD_SUPORTE,
                    origemId: foundTrigger.COD_SUPORTE,
                    diffMinutes
                };
                // Add to results
                if (!recallsByClient.has(groupKey)) {
                    recallsByClient.set(groupKey, []);
                }
                recallsByClient.get(groupKey).push(recallResult);
                recallOrderIds.add(currentOrder.COD_SUPORTE);
                recallPairs.push(recallResult);
            }
        }
    }
    return { recallsByClient, recallOrderIds, recallPairs };
}
