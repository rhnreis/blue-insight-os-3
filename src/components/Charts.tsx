import React from 'react';
import { LabelList } from "recharts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ClientRecall, TechnicianStats, CategoryStats, ServiceOrder } from '@/types/dashboard';
import { analyzeRecallsByCityFromOrders, analyzeRecallsByDateFromOrders } from '@/utils/dataAnalysis';

interface ChartsProps {
  recalls: ClientRecall[];
  technicians: TechnicianStats[];
  categories: CategoryStats[];
  monthlyData: { mes: string; totalOrdens: number; rechamadas: number; percentual: number }[];
  filteredOrders: ServiceOrder[];
}

const Charts: React.FC<ChartsProps> = ({ recalls, technicians, categories, monthlyData, filteredOrders }) => {
  // Dados para gráfico de clientes com mais rechamadas (Top 10)
  const topClientsData = recalls.slice(0, 10).map(recall => ({
    nome: recall.nomeCliente.length > 20 
      ? recall.nomeCliente.substring(0, 20) + '...' 
      : recall.nomeCliente,
    nomeCompleto: recall.nomeCliente,
    rechamadas: recall.totalOrdens
  }));

  // Dados para gráfico de técnicos com mais rechamadas (Top 10)
  const topTechniciansData = technicians.slice(0, 10).map(tech => ({
    tecnico: tech.tecnico,
    rechamadas: tech.totalRecalls,
    total: tech.totalOrdens,
    percentual: tech.percentualRecalls
  }));

  // Dados para gráfico de barras horizontais de categorias
  const categoryBarData = categories.map(cat => ({
    categoria: cat.categoria,
    recalls: cat.recalls,
    percentual: cat.percentual
  }));

  // Dados para gráfico de rechamadas por cidade (usando dados filtrados)
  const cityRecallsData = analyzeRecallsByCityFromOrders(filteredOrders, recalls).slice(0, 10);

  // Dados para gráfico de linha - rechamadas por dia (usando dados filtrados)
  const dailyRecallsData = analyzeRecallsByDateFromOrders(filteredOrders, recalls);

  // Cores para os gráficos
  const colors = ['#0052CC', '#0066FF', '#3366FF', '#4D79FF', '#668CFF', '#809FFF', '#99B3FF', '#B3C6FF', '#CCD9FF', '#E6F0FF'];

  const chartConfig = {
    rechamadas: {
      label: "Rechamadas",
      color: "hsl(var(--chart-1))",
    },
    total: {
      label: "Total",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Rechamadas por Mês */}
      <Card className="shadow-card hover:shadow-elevated transition-shadow lg:col-span-2 w-full">
        <CardHeader>
          <CardTitle>Análise Mensal - Ordens de Serviço e Rechamadas</CardTitle>
        </CardHeader>
        <CardContent className="p-4 w-full">
          <ChartContainer config={chartConfig} className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md">
                          <div className="grid gap-2">
                            <div className="font-medium">{data.mes}</div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-dashboard-secondary" />
                              <span className="text-sm">
                                Total OS: {data.totalOrdens}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-destructive" />
                              <span className="text-sm">
                                Rechamadas: {data.rechamadas}
                              </span>
                            </div>
                            <div className="text-sm font-medium">
                              % Rechamadas: {data.percentual.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="totalOrdens"
                  fill="hsl(var(--dashboard-secondary))"
                  name="Total OS"
                  radius={[2, 2, 0, 0]}
                >
                  <LabelList dataKey="totalOrdens" position="top" fill="#000" fontSize={12} />
                </Bar>
                <Bar
                  dataKey="rechamadas"
                  fill="hsl(var(--destructive))"
                  name="Rechamadas"
                  radius={[2, 2, 0, 0]}
                >
                  <LabelList dataKey="rechamadas" position="top" fill="#000" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Clientes com Mais Rechamadas */}
      <Card className="shadow-card hover:shadow-elevated transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Top 10 Clientes com Mais Rechamadas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topClientsData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="nome" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={10}
                  stroke="hsl(var(--foreground))"
                />
                <YAxis stroke="hsl(var(--foreground))" />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <div className="grid gap-2">
                            <div className="font-medium">{data.nomeCompleto}</div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-dashboard-primary" />
                              <span className="text-sm">Rechamadas: {data.rechamadas}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="rechamadas" 
                  fill="hsl(var(--dashboard-primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Técnicos com Mais Rechamadas */}
      <Card className="shadow-card hover:shadow-elevated transition-shadow">
        <CardHeader>
          <CardTitle>Top 10 Técnicos - Rechamadas vs Total</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTechniciansData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="tecnico" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={10}
                  stroke="hsl(var(--foreground))"
                />
                <YAxis stroke="hsl(var(--foreground))" />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <div className="grid gap-2">
                            <div className="font-medium">{data.tecnico}</div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-destructive" />
                              <span className="text-sm">Rechamadas: {data.rechamadas}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-dashboard-secondary" />
                              <span className="text-sm">Total OS: {data.total}</span>
                            </div>
                            <div className="text-sm font-medium">
                              % Rechamadas: {data.percentual.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="rechamadas" fill="hsl(var(--destructive))" radius={[2, 2, 0, 0]} />
                <Bar dataKey="total" fill="hsl(var(--dashboard-secondary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Barras Horizontais - Rechamadas por Categoria */}
      <Card className="shadow-card hover:shadow-elevated transition-shadow">
        <CardHeader>
          <CardTitle>Rechamadas por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={categoryBarData} 
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--foreground))" />
                <YAxis 
                  type="category" 
                  dataKey="categoria" 
                  stroke="hsl(var(--foreground))"
                  width={80}
                />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <div className="grid gap-2">
                            <div className="font-medium">{data.categoria}</div>
                            <div className="text-sm">Rechamadas: {data.recalls}</div>
                            <div className="text-sm">Percentual: {data.percentual.toFixed(1)}%</div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="recalls" 
                  fill="hsl(var(--dashboard-primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Linha - Rechamadas por Dia */}
      <Card className="shadow-card hover:shadow-elevated transition-shadow lg:col-span-2 w-full">
      <CardHeader>
        <CardTitle>Evolução das Rechamadas por Dia</CardTitle>
      </CardHeader>
      <CardContent className="p-4 w-full">
        <ChartContainer config={chartConfig} className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyRecallsData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="data" 
                stroke="hsl(var(--foreground))"
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
              />
              <YAxis stroke="hsl(var(--foreground))" />
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <div className="grid gap-2">
                          <div className="font-medium">
                            {new Date(data.data).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-sm">Rechamadas: {data.recalls}</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="recalls" 
                stroke="hsl(var(--dashboard-primary))" 
                strokeWidth={3}
                dot={{ fill: "hsl(var(--dashboard-primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--dashboard-primary))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>

      {/* Gráfico de Rechamadas por Cidade */}
      <Card className="shadow-card hover:shadow-elevated transition-shadow">
        <CardHeader>
          <CardTitle>Top 10 Cidades com Mais Rechamadas</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityRecallsData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="cidade" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={10}
                  stroke="hsl(var(--foreground))"
                />
                <YAxis stroke="hsl(var(--foreground))" />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <div className="grid gap-2">
                            <div className="font-medium">{data.cidade}</div>
                            <div className="text-sm">Rechamadas: {data.recalls}</div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="recalls" 
                  fill="hsl(var(--dashboard-secondary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Performance dos Técnicos */}
      <Card className="shadow-card hover:shadow-elevated transition-shadow">
        <CardHeader>
          <CardTitle>Performance dos Técnicos (% Rechamadas)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTechniciansData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="tecnico" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={10}
                  stroke="hsl(var(--foreground))"
                />
                <YAxis 
                  stroke="hsl(var(--foreground))"
                  label={{ value: '% Rechamadas', angle: -90, position: 'insideLeft' }}
                />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <div className="grid gap-2">
                            <div className="font-medium">{data.tecnico}</div>
                            <div className="text-sm">% Rechamadas: {data.percentual.toFixed(1)}%</div>
                            <div className="text-sm">Total OS: {data.total}</div>
                            <div className="text-sm">Rechamadas: {data.rechamadas}</div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="percentual" 
                  fill="hsl(var(--dashboard-secondary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Charts;