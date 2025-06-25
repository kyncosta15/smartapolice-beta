import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button"
import { FilePlus, File, X } from 'lucide-react';
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PolicyExtractor } from '@/utils/policyExtractor';

interface EnhancedPDFUploadProps {
  onPolicyExtracted: (policy: any) => void;
}

export function EnhancedPDFUpload({ onPolicyExtracted }: EnhancedPDFUploadProps) {
  const [policies, setPolicies] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) {
      console.warn("Nenhum arquivo foi selecionado.");
      return;
    }

    for (const file of acceptedFiles) {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      
      try {
        // Simulate PDF processing with more realistic extraction
        const extractedData = PolicyExtractor.extractCompletePolicy(file.name);
        
        // Simulate processing progress
        for (let progress = 0; progress <= 100; progress += 20) {
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        const newPolicy = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name.replace('.pdf', ''),
          file: file,
          type: extractedData.type,
          insurer: extractedData.insurer,
          premium: extractedData.premium,
          monthlyAmount: extractedData.monthlyAmount,
          startDate: extractedData.startDate,
          endDate: extractedData.endDate,
          policyNumber: extractedData.policyNumber,
          paymentFrequency: extractedData.paymentFrequency,
          extractedAt: new Date().toISOString(),
          status: 'ativo' as const
        };

        setPolicies(prev => [...prev, newPolicy]);
        onPolicyExtracted(newPolicy);

        setUploadProgress(prev => {
          const { [file.name]: removed, ...rest } = prev;
          return rest;
        });
      } catch (error) {
        console.error("Erro ao processar o arquivo:", file.name, error);
        setUploadProgress(prev => {
          const { [file.name]: removed, ...rest } = prev;
          return rest;
        });
      }
    }

    setUploadProgress({});
  }, [onPolicyExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 10,
  });

  const fileCount = Object.keys(uploadProgress).length;

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Upload de Apólices</CardTitle>
          <CardDescription>
            Arraste e solte os arquivos PDF ou clique para selecionar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div {...getRootProps()} className="relative border-2 border-dashed rounded-md p-6 cursor-pointer hover:bg-gray-50 transition-colors">
            <input {...getInputProps()} />
            <div className="text-center">
              <FilePlus className="h-6 w-6 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                {isDragActive ? 'Solte os arquivos aqui...' : `Arraste e solte os arquivos PDF ou clique para selecionar`}
              </p>
            </div>
          </div>

          {fileCount > 0 && (
            <div className="mt-4">
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <File className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-700">{fileName}</p>
                    </div>
                    <p className="text-xs text-gray-500">{progress}%</p>
                  </div>
                  <Progress value={progress} className="mt-1" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          {fileCount > 0 && (
            <p className="text-sm text-gray-500">Processando {fileCount} arquivo(s)...</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
