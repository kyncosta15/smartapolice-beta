
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, X } from 'lucide-react';

interface LocationFilterProps {
  onFilterChange: (filters: { states: string[], cities: string[] }) => void;
}

export function LocationFilter({ onFilterChange }: LocationFilterProps) {
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  const states = [
    'São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Paraná',
    'Rio Grande do Sul', 'Pernambuco', 'Ceará', 'Santa Catarina', 'Goiás'
  ];

  const cities = {
    'São Paulo': ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto', 'Sorocaba'],
    'Rio de Janeiro': ['Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'Nova Iguaçu'],
    'Minas Gerais': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora']
  };

  const handleStateChange = (state: string) => {
    const newStates = [...selectedStates, state];
    setSelectedStates(newStates);
    onFilterChange({ states: newStates, cities: selectedCities });
  };

  const handleCityChange = (city: string) => {
    const newCities = [...selectedCities, city];
    setSelectedCities(newCities);
    onFilterChange({ states: selectedStates, cities: newCities });
  };

  const removeState = (state: string) => {
    const newStates = selectedStates.filter(s => s !== state);
    setSelectedStates(newStates);
    onFilterChange({ states: newStates, cities: selectedCities });
  };

  const removeCity = (city: string) => {
    const newCities = selectedCities.filter(c => c !== city);
    setSelectedCities(newCities);
    onFilterChange({ states: selectedStates, cities: newCities });
  };

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-sm font-medium">
          <MapPin className="h-4 w-4 mr-2 text-blue-600" />
          Filtros por Localização
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Select onValueChange={handleStateChange}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Selecionar estado" />
            </SelectTrigger>
            <SelectContent>
              {states.filter(state => !selectedStates.includes(state)).map((state) => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedStates.map((state) => (
              <Badge key={state} variant="secondary" className="text-xs">
                {state}
                <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeState(state)} />
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Select onValueChange={handleCityChange}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Selecionar cidade" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(cities).flat().filter(city => !selectedCities.includes(city)).map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedCities.map((city) => (
              <Badge key={city} variant="secondary" className="text-xs">
                {city}
                <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeCity(city)} />
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
