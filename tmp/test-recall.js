"use strict";
/**
 * Basic test for the new sequential recall logic
 * This demonstrates the functionality with sample data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRecallLogic = testRecallLogic;
const recallLogic_1 = require("./src/utils/recallLogic");
// Sample test data
const sampleOrders = [
    {
        COD_SUPORTE: 1,
        COD_CLIENTE: 101,
        COD_SERVICO_CLIENTE: 1001,
        NOME_CLIENTE: "João Silva",
        BAIRRO: "Centro",
        CIDADE: "São Paulo",
        CATEGORIA: "ATIVACAO", // GATILHO
        DATA_ABERTURA: "01/01/2024",
        HORA_ABERTURA: "09:00:00",
        DATA_FECHAMENTO: "01/01/2024",
        TECNICO: "Tech1"
    },
    {
        COD_SUPORTE: 2,
        COD_CLIENTE: 101,
        COD_SERVICO_CLIENTE: 1001,
        NOME_CLIENTE: "João Silva",
        BAIRRO: "Centro",
        CIDADE: "São Paulo",
        CATEGORIA: "SUPORTE NIVEL 1", // SUBSEQUENTE - should be a recall
        DATA_ABERTURA: "02/01/2024",
        HORA_ABERTURA: "14:30:00",
        DATA_FECHAMENTO: "02/01/2024",
        TECNICO: "Tech2"
    },
    {
        COD_SUPORTE: 3,
        COD_CLIENTE: 102,
        COD_SERVICO_CLIENTE: 1002,
        NOME_CLIENTE: "Maria Santos",
        BAIRRO: "Vila Nova",
        CIDADE: "Rio de Janeiro",
        CATEGORIA: "RECOLHIMENTO", // SUBSEQUENTE without previous GATILHO - should NOT be a recall
        DATA_ABERTURA: "01/01/2024",
        HORA_ABERTURA: "10:00:00",
        DATA_FECHAMENTO: "01/01/2024",
        TECNICO: "Tech3"
    },
    {
        COD_SUPORTE: 4,
        COD_CLIENTE: 103,
        COD_SERVICO_CLIENTE: 1003,
        NOME_CLIENTE: "Pedro Costa",
        BAIRRO: "Copacabana",
        CIDADE: "Rio de Janeiro",
        CATEGORIA: "MUDANÇA DE ENDEREÇO", // GATILHO (with accents - should normalize)
        DATA_ABERTURA: "01/01/2024",
        HORA_ABERTURA: "11:00:00",
        DATA_FECHAMENTO: "01/01/2024",
        TECNICO: "Tech1"
    },
    {
        COD_SUPORTE: 5,
        COD_CLIENTE: 103,
        COD_SERVICO_CLIENTE: 1003,
        NOME_CLIENTE: "Pedro Costa",
        BAIRRO: "Copacabana",
        CIDADE: "Rio de Janeiro",
        CATEGORIA: "OSCILAÇÃO", // SUBSEQUENTE (with accents) - should be a recall
        DATA_ABERTURA: "03/01/2024",
        HORA_ABERTURA: "16:15:00",
        DATA_FECHAMENTO: "03/01/2024",
        TECNICO: "Tech1"
    }
];
// Test the recall logic
function testRecallLogic() {
    console.log('=== Testing Sequential Recall Logic ===\n');
    const dateFilter = {
        dataInicio: new Date('2024-01-01'),
        dataFim: new Date('2024-01-03')
    };
    const result = (0, recallLogic_1.computeRecalls)(sampleOrders, dateFilter);
    console.log('Sample Orders:');
    sampleOrders.forEach(order => {
        console.log(`  ${order.COD_SUPORTE}: ${order.NOME_CLIENTE} - ${order.CATEGORIA} (${order.DATA_ABERTURA} ${order.HORA_ABERTURA})`);
    });
    console.log('\nRecall Analysis Results:');
    console.log(`  Total recall order IDs: ${result.recallOrderIds.size}`);
    console.log(`  Recall order IDs: [${Array.from(result.recallOrderIds).join(', ')}]`);
    console.log('\nExpected Results:');
    console.log('  - Order 2 (João Silva - SUPORTE NIVEL 1) should be a recall (follows ATIVACAO)');
    console.log('  - Order 3 (Maria Santos - RECOLHIMENTO) should NOT be a recall (no previous GATILHO)');
    console.log('  - Order 5 (Pedro Costa - OSCILAÇÃO) should be a recall (follows MUDANÇA DE ENDEREÇO)');
    console.log('\nDetailed Recall Pairs:');
    result.recallPairs.forEach(pair => {
        const recallOrder = sampleOrders.find(o => o.COD_SUPORTE === pair.ordemId);
        const triggerOrder = sampleOrders.find(o => o.COD_SUPORTE === pair.origemId);
        console.log(`  Recall: ${recallOrder?.CATEGORIA} (${pair.ordemId}) -> Trigger: ${triggerOrder?.CATEGORIA} (${pair.origemId}) [${pair.diffMinutes} minutes]`);
    });
    console.log('\nRecalls by Client:');
    result.recallsByClient.forEach((recalls, clientKey) => {
        console.log(`  Client ${clientKey}: ${recalls.length} recall(s)`);
        recalls.forEach(r => {
            const order = sampleOrders.find(o => o.COD_SUPORTE === r.ordemId);
            console.log(`    - ${order?.CATEGORIA} (${r.ordemId})`);
        });
    });
    // Validate expected results
    const hasRecall2 = result.recallOrderIds.has(2);
    const hasRecall3 = result.recallOrderIds.has(3);
    const hasRecall5 = result.recallOrderIds.has(5);
    console.log('\n=== Validation ===');
    console.log(`Order 2 is recall: ${hasRecall2} ✓`);
    console.log(`Order 3 is recall: ${hasRecall3} (should be false) ${!hasRecall3 ? '✓' : '✗'}`);
    console.log(`Order 5 is recall: ${hasRecall5} ✓`);
    if (hasRecall2 && !hasRecall3 && hasRecall5 && result.recallOrderIds.size === 2) {
        console.log('\n🎉 Test PASSED: Recall logic working correctly!');
        return true;
    }
    else {
        console.log('\n❌ Test FAILED: Unexpected results');
        return false;
    }
}
