import React from 'react';
import { TrendingUp, Users, AlertTriangle, UserCheck, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardKPIs } from '@/types/dashboard';

interface KPICardsProps {
  kpis: DashboardKPIs;
}

const KPICards: React.FC<KPICardsProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card className="shadow-card hover:shadow-elevated transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Ordens</CardTitle>
          <BarChart3 className="h-4 w-4 text-dashboard-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-dashboard-text">
            {kpis.totalOrdens.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Ordens no período
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elevated transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Rechamadas</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {kpis.totalRecalls.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Ordens repetidas
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elevated transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">% de Rechamadas</CardTitle>
          <TrendingUp className="h-4 w-4 text-dashboard-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-dashboard-secondary">
            {kpis.percentualRecalls.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Sobre o total
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elevated transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cliente c/ Mais Recalls</CardTitle>
          <Users className="h-4 w-4 text-dashboard-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-dashboard-text truncate">
            {kpis.clienteComMaisRecalls.nome}
          </div>
          <p className="text-xs text-muted-foreground">
            {kpis.clienteComMaisRecalls.quantidade} ordens
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-elevated transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Técnico c/ Mais Recalls</CardTitle>
          <UserCheck className="h-4 w-4 text-dashboard-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-dashboard-text truncate">
            {kpis.tecnicoComMaisRecalls.nome}
          </div>
          <p className="text-xs text-muted-foreground">
            {kpis.tecnicoComMaisRecalls.quantidade} rechamadas
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default KPICards;