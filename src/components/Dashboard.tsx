import React, { useState, useMemo } from 'react';
import { ServiceOrder, DashboardFilters as Filters, ClientRecall, TechnicianStats, CategoryStats, DashboardKPIs } from '@/types/dashboard';
import {
  filterServiceOrders,
  analyzeRecalls,
  analyzeTechnicians,
  analyzeCategories,
  calculateKPIs,
  generateInsights,
  analyzeRecallsByMonth
} from '@/utils/dataAnalysis';
import FileUpload from './FileUpload';
import KPICards from './KPICards';
import DashboardFilters from './DashboardFilters';
import Charts from './Charts';
import InsightsPanel from './InsightsPanel';

const Dashboard: React.FC = () => {
  const [originalData, setOriginalData] = useState<ServiceOrder[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [isLoading, setIsLoading] = useState(false);

  // Dados filtrados e análises computadas
  const analysisData = useMemo(() => {
    if (originalData.length === 0) {
      return {
        filteredOrders: [],
        recalls: [],
        technicians: [],
        categories: [],
        monthlyData: [],
        kpis: {
          totalOrdens: 0,
          totalRecalls: 0,
          percentualRecalls: 0,
          clienteComMaisRecalls: { nome: 'N/A', quantidade: 0 },
          tecnicoComMaisRecalls: { nome: 'N/A', quantidade: 0 }
        } as DashboardKPIs,
        insights: []
      };
    }

    const filteredOrders = filterServiceOrders(originalData, filters);
    
    // Prepare date filter for recall analysis
    const dateFilter = {
      dataInicio: filters.dataInicio,
      dataFim: filters.dataFim
    };
    
    const recalls = analyzeRecalls(filteredOrders, dateFilter);
    const technicians = analyzeTechnicians(filteredOrders, recalls, dateFilter);
    const categories = analyzeCategories(filteredOrders, recalls, dateFilter);
    const monthlyData = analyzeRecallsByMonth(filteredOrders, recalls, dateFilter);
    const kpis = calculateKPIs(filteredOrders, recalls, technicians, dateFilter);
    const insights = generateInsights(kpis, recalls, categories);

    return {
      filteredOrders,
      recalls,
      technicians,
      categories,
      monthlyData,
      kpis,
      insights
    };
  }, [originalData, filters]);

  const handleDataLoaded = (data: ServiceOrder[]) => {
    setIsLoading(true);
    setOriginalData(data);
    setFilters({}); // Reset filters when new data is loaded
    setIsLoading(false);
  };

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const hasData = originalData.length > 0;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Dashboard de Análise de Ordens de Serviço
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Análise inteligente de rechamadas e performance técnica para otimização de processos
          </p>
        </div>

        {/* Upload de Arquivo */}
        {!hasData && (
          <div className="max-w-4xl mx-auto">
            <FileUpload onDataLoaded={handleDataLoaded} isLoading={isLoading} />
          </div>
        )}

        {/* Dashboard Principal */}
        {hasData && (
          <>
            {/* KPIs */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-dashboard-text">
                  Indicadores Principais
                </h2>
                <div className="text-sm text-muted-foreground">
                  Total de registros: {originalData.length.toLocaleString()} | 
                  Filtrados: {analysisData.filteredOrders.length.toLocaleString()}
                </div>
              </div>
              <KPICards kpis={analysisData.kpis} />
            </div>

            {/* Filtros */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-dashboard-text">
                Filtros e Análise
              </h2>
              <DashboardFilters
                orders={originalData}
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </div>

            {/* Gráficos */}
            {analysisData.recalls.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-dashboard-text">
                  Análise Visual
                </h2>
                <Charts
                  recalls={analysisData.recalls}
                  technicians={analysisData.technicians}
                  categories={analysisData.categories}
                  monthlyData={analysisData.monthlyData}
                  filteredOrders={analysisData.filteredOrders}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="p-8 bg-gradient-accent rounded-lg border border-border/50">
                    <h3 className="text-lg font-semibold text-dashboard-text mb-2">
                      Nenhuma rechamada encontrada
                    </h3>
                    <p className="text-muted-foreground">
                      Os filtros aplicados não retornaram clientes com múltiplas ordens de serviço.
                      Isso é positivo! Tente ajustar os filtros para uma análise mais ampla.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Insights */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-dashboard-text">
                Insights e Recomendações
              </h2>
              <InsightsPanel insights={analysisData.insights} />
            </div>

            {/* Ação para novo upload */}
            <div className="text-center pt-8 border-t border-border/50">
              <button
                onClick={() => {
                  setOriginalData([]);
                  setFilters({});
                }}
                className="text-dashboard-primary hover:text-dashboard-secondary transition-colors underline"
              >
                Carregar novos dados
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;