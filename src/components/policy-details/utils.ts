
export const getTypeLabel = (type: string) => {
  const types = {
    auto: 'Seguro Auto',
    vida: 'Seguro de Vida',
    saude: 'Seguro Saúde',
    empresarial: 'Empresarial',
    patrimonial: 'Patrimonial',
    acidentes_pessoais: 'Acidentes Pessoais'
  };
  return types[type] || type;
};
