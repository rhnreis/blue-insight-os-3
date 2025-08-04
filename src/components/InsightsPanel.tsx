import React from 'react';
import { Lightbulb, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface InsightsPanelProps {
  insights: string[];
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  const getInsightIcon = (index: number) => {
    const icons = [TrendingUp, Users, AlertTriangle, Lightbulb];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="h-4 w-4" />;
  };

  const getInsightVariant = (index: number) => {
    const variants = ['default', 'secondary', 'destructive', 'outline'] as const;
    return variants[index % variants.length];
  };

  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-dashboard-primary" />
          <span>Insights Automáticos</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum insight disponível no momento.</p>
              <p className="text-sm">Importe dados para gerar análises automáticas.</p>
            </div>
          ) : (
            insights.map((insight, index) => (
              <div 
                key={index}
                className="flex items-start space-x-3 p-4 rounded-lg bg-gradient-accent border border-border/50 hover:border-border transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  <Badge variant={getInsightVariant(index)} className="p-2">
                    {getInsightIcon(index)}
                  </Badge>
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed text-dashboard-text">
                    {insight}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightsPanel;