import React, { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EnhancedDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  availableDates?: Date[];
  className?: string;
}

const EnhancedDatePicker: React.FC<EnhancedDatePickerProps> = ({
  value,
  onChange,
  placeholder = "Selecionar data",
  availableDates = [],
  className
}) => {
  const [inputValue, setInputValue] = useState(
    value ? format(value, "dd/MM/yyyy", { locale: ptBR }) : ""
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Tenta fazer o parsing da data conforme o usuário digita
    if (newValue.length === 10) { // dd/MM/yyyy
      try {
        const parsedDate = parse(newValue, "dd/MM/yyyy", new Date());
        if (isValid(parsedDate)) {
          onChange(parsedDate);
        }
      } catch {
        // Ignora erros de parsing
      }
    } else if (newValue === "") {
      onChange(undefined);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      setInputValue(format(date, "dd/MM/yyyy", { locale: ptBR }));
    } else {
      onChange(undefined);
      setInputValue("");
    }
    setIsOpen(false);
  };

  const handleInputBlur = () => {
    // Se o valor não for válido, restaura o valor anterior
    if (value) {
      setInputValue(format(value, "dd/MM/yyyy", { locale: ptBR }));
    } else {
      setInputValue("");
    }
  };

  // Função para desabilitar datas que não estão disponíveis
  const isDateDisabled = (date: Date) => {
    if (availableDates.length === 0) return false;
    
    const dateStr = date.toISOString().split('T')[0];
    return !availableDates.some(availableDate => 
      availableDate.toISOString().split('T')[0] === dateStr
    );
  };

  // Determina o range de datas para o calendário
  const dateRange = availableDates.length > 0 ? {
    from: new Date(Math.min(...availableDates.map(d => d.getTime()))),
    to: new Date(Math.max(...availableDates.map(d => d.getTime())))
  } : undefined;

  return (
    <div className={cn("flex gap-2", className)}>
      <Input
        type="text"
        placeholder="dd/mm/aaaa"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        className="flex-1"
        maxLength={10}
      />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            fromDate={dateRange?.from}
            toDate={dateRange?.to}
            initialFocus
            className="p-3 pointer-events-auto"
          />
          {availableDates.length > 0 && (
            <div className="p-3 border-t text-xs text-muted-foreground">
              Apenas datas com registros são selecionáveis
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default EnhancedDatePicker;