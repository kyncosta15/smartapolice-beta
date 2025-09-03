// Tipos TypeScript para o novo sistema de solicitações

export interface Employee {
  id: string;
  companyId: string;
  cpf: string;
  fullName: string;
  email?: string;
  phone?: string;
  status: 'ativo' | 'inativo' | 'pendente';
  createdAt: string;
}

export interface Dependent {
  id: string;
  employeeId: string;
  fullName: string;
  cpf?: string;
  birthDate?: string;
  relationship: 'conjuge' | 'filho' | 'outro';
  createdAt: string;
}

export interface PublicRequestToken {
  id: string;
  employeeId: string;
  token: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

export interface Request {
  id: string;
  protocolCode: string;
  employeeId?: string;
  kind: 'inclusao' | 'exclusao';
  status: 'recebido' | 'em_validacao' | 'concluido' | 'recusado';
  submittedAt?: string;
  draft: boolean;
  channel: 'whatsapp' | 'form';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface RequestItem {
  id: string;
  requestId: string;
  target: 'titular' | 'dependente';
  dependentId?: string;
  action: 'incluir' | 'excluir';
  notes?: string;
  createdAt: string;
}

export interface RequestFile {
  id: string;
  requestId: string;
  path: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  createdAt: string;
}

// Dados de entrada para as APIs
export interface GenerateLinkRequest {
  employeeCpf: string;
  validityDays?: number;
}

export interface ValidateTokenRequest {
  token: string;
}

export interface SaveDraftRequest {
  token: string;
  request: {
    kind: 'inclusao' | 'exclusao';
    items: {
      target: 'titular' | 'dependente';
      dependentId?: string;
      action: 'incluir' | 'excluir';
      notes?: string;
    }[];
    notes?: string;
    partialFiles?: string[];
  };
}

export interface SubmitRequestRequest {
  token: string;
  requestId: string;
}

// Resposta padrão da API
export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Dados retornados pela validação de token
export interface TokenValidationData {
  employee: Employee;
  dependents: Dependent[];
  hasActiveRequest?: boolean;
  activeRequest?: Request;
}

// Dados do link gerado
export interface GeneratedLink {
  link: string;
  whatsappMessage: string;
  expiresAt: string;
}