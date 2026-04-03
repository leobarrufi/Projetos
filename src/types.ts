export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  description: string;
  platform?: string; // Uber, 99, Indriver, etc.
}

export interface DailySummary {
  date: string;
  income: number;
  expense: number;
  profit: number;
}

export const INCOME_CATEGORIES = [
  'Uber',
  '99',
  'Indriver',
  'Particular',
  'Outros'
];

export const EXPENSE_CATEGORIES = [
  'Combustível',
  'Manutenção',
  'Alimentação',
  'Seguro',
  'Limpeza',
  'Internet/Celular',
  'Estacionamento/Pedágio',
  'IPVA/Licenciamento',
  'Outros'
];
