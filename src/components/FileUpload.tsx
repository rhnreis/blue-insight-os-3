import React, { useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as XLSX from 'xlsx';
import { ServiceOrder } from '@/types/dashboard';
import { parseImportedData } from '@/utils/dataAnalysis';

interface FileUploadProps {
  onDataLoaded: (data: ServiceOrder[]) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, isLoading }) => {
  const [dragActive, setDragActive] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  const handleFiles = useCallback((files: FileList) => {
    const file = files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      setError('Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv)');
      return;
    }

    setError('');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let jsonData: Record<string, unknown>[];

        if (file.name.match(/\.csv$/)) {
          // Handle CSV files
          const csvText = data as string;
          const lines = csvText.split('\n').filter(line => line.trim());
          if (lines.length === 0) {
            setError('O arquivo CSV está vazio');
            return;
          }
          
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          jsonData = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const row: Record<string, unknown> = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            return row;
          });
        } else {
          // Handle Excel files
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet);
        }

        if (jsonData.length === 0) {
          setError('O arquivo está vazio ou não contém dados válidos');
          return;
        }

        // Validar se contém as colunas necessárias
        const requiredColumns = ['COD_SUPORTE', 'COD_CLIENTE', 'NOME_CLIENTE', 'CATEGORIA', 'TECNICO'];
        const firstRow = jsonData[0] as Record<string, unknown>;
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));

        if (missingColumns.length > 0) {
          setError(`Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}`);
          return;
        }

        const parsedData = parseImportedData(jsonData);
        onDataLoaded(parsedData);
      } catch (err) {
        setError('Erro ao processar o arquivo. Verifique se o formato está correto.');
        console.error('Erro ao processar arquivo:', err);
      }
    };

    if (file.name.match(/\.csv$/)) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsBinaryString(file);
    }
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  return (
    <div className="space-y-4">
      <Card className="border-dashed border-2 hover:border-primary transition-colors">
        <CardContent 
          className={`p-8 text-center ${dragActive ? 'bg-accent' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-gradient-primary rounded-full">
              <FileSpreadsheet className="h-8 w-8 text-white" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Importar Dados de Ordens de Serviço</h3>
              <p className="text-muted-foreground">
                Arraste e solte seu arquivo Excel ou CSV aqui ou clique para selecionar
              </p>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={isLoading}
              />
              <label htmlFor="file-upload">
                <Button 
                  variant="outline" 
                  className="cursor-pointer"
                  disabled={isLoading}
                  asChild
                >
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {isLoading ? 'Processando...' : 'Selecionar Arquivo'}
                  </span>
                </Button>
              </label>
              
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: .xlsx, .xls, .csv
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-accent/50">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">Estrutura esperada do arquivo:</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• <strong>COD_SUPORTE:</strong> Código único da ordem de serviço</p>
            <p>• <strong>COD_CLIENTE:</strong> Código único do cliente</p>
            <p>• <strong>NOME_CLIENTE:</strong> Nome completo do cliente</p>
            <p>• <strong>BAIRRO:</strong> Bairro do cliente</p>
            <p>• <strong>CIDADE:</strong> Cidade do cliente</p>
            <p>• <strong>CATEGORIA:</strong> Categoria da ordem (ex: ATIVACAO, REPARO)</p>
            <p>• <strong>DATA_ABERTURA:</strong> Data de abertura da OS (dd/mm/aaaa)</p>
            <p>• <strong>DATA_FECHAMENTO:</strong> Data de fechamento da OS (dd/mm/aaaa)</p>
            <p>• <strong>TECNICO:</strong> Nome do técnico responsável</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUpload;