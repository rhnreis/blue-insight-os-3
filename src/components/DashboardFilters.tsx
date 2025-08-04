import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ServiceOrder, DashboardFilters as FilterType } from '@/types/dashboard';
import { getAvailableDates } from '@/utils/dataAnalysis';
import EnhancedDatePicker from './EnhancedDatePicker';

interface DashboardFiltersProps {
  orders: ServiceOrder[];
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  orders,
  filters,
  onFiltersChange
}) => {
  const uniqueBairros = [...new Set(orders.map(o => o.BAIRRO).filter(Boolean))].sort();
  const uniqueCidades = [...new Set(orders.map(o => o.CIDADE).filter(Boolean))].sort();
  const uniqueCategorias = [...new Set(orders.map(o => o.CATEGORIA).filter(Boolean))].sort();
  const uniqueTecnicos = [...new Set(orders.map(o => o.TECNICO).filter(Boolean))].sort();
  const availableDates = getAvailableDates(orders);

  const updateFilter = (key: keyof FilterType, value: any) => {
    const cleanValue = value === 'all' ? undefined : value;
    onFiltersChange({ ...filters, [key]: cleanValue });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof FilterType] !== undefined && filters[key as keyof FilterType] !== ''
  );

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span>Filtros</span>
        </CardTitle>
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFilters}
            className="text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Filtro de Bairro */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Bairro</label>
            <Select
              value={filters.bairro || 'all'}
              onValueChange={(value) => updateFilter('bairro', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os bairros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os bairros</SelectItem>
                {uniqueBairros.map(bairro => (
                  <SelectItem key={bairro} value={bairro}>
                    {bairro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Cidade */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cidade</label>
            <Select
              value={filters.cidade || 'all'}
              onValueChange={(value) => updateFilter('cidade', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as cidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as cidades</SelectItem>
                {uniqueCidades.map(cidade => (
                  <SelectItem key={cidade} value={cidade}>
                    {cidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Categoria */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <Select
              value={filters.categoria || 'all'}
              onValueChange={(value) => updateFilter('categoria', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {uniqueCategorias.map(categoria => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Técnico */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Técnico</label>
            <Select
              value={filters.tecnico || 'all'}
              onValueChange={(value) => updateFilter('tecnico', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os técnicos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os técnicos</SelectItem>
                {uniqueTecnicos.map(tecnico => (
                  <SelectItem key={tecnico} value={tecnico}>
                    {tecnico}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Data Início */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Início (Fechamento)</label>
            <EnhancedDatePicker
              value={filters.dataInicio}
              onChange={(date) => updateFilter('dataInicio', date)}
              placeholder="Selecionar data início"
              availableDates={availableDates}
            />
          </div>

          {/* Filtro de Data Fim */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Fim (Fechamento)</label>
            <EnhancedDatePicker
              value={filters.dataFim}
              onChange={(date) => updateFilter('dataFim', date)}
              placeholder="Selecionar data fim"
              availableDates={availableDates}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardFilters;