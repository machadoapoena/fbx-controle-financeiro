export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind color class or hex color (e.g. '#3B82F6')
  icon: string;  // Name of lucide icon
}

export type TransactionType = 'entrada' | 'saida';

export interface Project {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  description: string;
  category: string; // Category ID or Name
  date: string;     // YYYY-MM-DD
  value: number;
  type: TransactionType;
  payee: string;       // Nome do beneficiário
  bankAccount: string; // Conta bancária
  status?: 'realizado' | 'previsto'; // Situação da transação (realizada ou previsão)
  project?: string;    // Nome ou ID do projeto associado
  invoiceNumber?: string; // Número da Nota Fiscal (NF)
}

export interface MonthlyStats {
  month: string;      // YYYY-MM
  entradas: number;
  saidas: number;
}

export interface CategoryStats {
  category: string;
  value: number;
  color: string;
}
