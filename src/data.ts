import { Category, Transaction } from "./types";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-salary", name: "Salário", color: "#10B981", icon: "DollarSign" }, // Green
  { id: "cat-food", name: "Alimentação", color: "#F59E0B", icon: "Utensils" }, // Amber
  { id: "cat-housing", name: "Moradia", color: "#3B82F6", icon: "Home" },     // Blue
  { id: "cat-transport", name: "Transporte", color: "#6366F1", icon: "Car" }, // Indigo
  { id: "cat-health", name: "Saúde", color: "#EF4444", icon: "Activity" },     // Red
  { id: "cat-leisure", name: "Lazer", color: "#8B5CF6", icon: "Sparkles" },   // Purple
  { id: "cat-others", name: "Outros", color: "#6B7280", icon: "HelpCircle" }   // Gray
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    description: "Salário Mensal Principal",
    category: "Salário",
    date: "2026-07-05",
    value: 6500.00,
    type: "entrada",
    payee: "Google Inc.",
    bankAccount: "Itaú Unibanco"
  },
  {
    id: "tx-2",
    description: "Aluguel do Apartamento",
    category: "Moradia",
    date: "2026-07-10",
    value: 1800.00,
    type: "saida",
    payee: "Imobiliária Prime",
    bankAccount: "Itaú Unibanco"
  },
  {
    id: "tx-3",
    description: "Supermercado Mensal",
    category: "Alimentação",
    date: "2026-07-11",
    value: 742.50,
    type: "saida",
    payee: "Carrefour S/A",
    bankAccount: "NuBank"
  },
  {
    id: "tx-4",
    description: "Abastecimento Carro",
    category: "Transporte",
    date: "2026-07-14",
    value: 195.00,
    type: "saida",
    payee: "Posto Ipiranga",
    bankAccount: "Itaú Unibanco"
  },
  {
    id: "tx-5",
    description: "Freelance Desenvolvimento Web",
    category: "Salário",
    date: "2026-07-18",
    value: 2400.00,
    type: "entrada",
    payee: "Empresa XPTO",
    bankAccount: "NuBank"
  },
  {
    id: "tx-6",
    description: "Plano de Saúde",
    category: "Saúde",
    date: "2026-07-20",
    value: 480.00,
    type: "saida",
    payee: "Amil Saúde",
    bankAccount: "NuBank"
  },
  {
    id: "tx-7",
    description: "Jantar de Aniversário",
    category: "Lazer",
    date: "2026-07-22",
    value: 320.00,
    type: "saida",
    payee: "Fogo de Chão",
    bankAccount: "NuBank"
  },
  {
    id: "tx-8",
    description: "Fatura Telefone & Internet",
    category: "Outros",
    date: "2026-07-24",
    value: 159.90,
    type: "saida",
    payee: "Claro Telecom",
    bankAccount: "Itaú Unibanco"
  },
  // June entries to populate monthly comparisons
  {
    id: "tx-9",
    description: "Salário Mensal Principal",
    category: "Salário",
    date: "2026-06-05",
    value: 6500.00,
    type: "entrada",
    payee: "Google Inc.",
    bankAccount: "Itaú Unibanco"
  },
  {
    id: "tx-10",
    description: "Aluguel do Apartamento",
    category: "Moradia",
    date: "2026-06-10",
    value: 1800.00,
    type: "saida",
    payee: "Imobiliária Prime",
    bankAccount: "Itaú Unibanco"
  },
  {
    id: "tx-11",
    description: "Supermercado Mensal",
    category: "Alimentação",
    date: "2026-06-11",
    value: 689.10,
    type: "saida",
    payee: "Carrefour S/A",
    bankAccount: "NuBank"
  },
  {
    id: "tx-12",
    description: "Cinema e Lanches",
    category: "Lazer",
    date: "2026-06-15",
    value: 110.00,
    type: "saida",
    payee: "Cinemark",
    bankAccount: "NuBank"
  },
  {
    id: "tx-13",
    description: "Medicamentos Farmácia",
    category: "Saúde",
    date: "2026-06-18",
    value: 84.50,
    type: "saida",
    payee: "Droga Raia",
    bankAccount: "NuBank"
  },
  {
    id: "tx-14",
    description: "Venda de Monitor Antigo",
    category: "Outros",
    date: "2026-06-22",
    value: 500.00,
    type: "entrada",
    payee: "Comprador Particular",
    bankAccount: "Itaú Unibanco"
  }
];

export const AVAILABLE_ICONS = [
  "DollarSign",
  "Utensils",
  "Home",
  "Car",
  "Activity",
  "Sparkles",
  "HelpCircle",
  "ShoppingBag",
  "GraduationCap",
  "Gift",
  "TrendingUp",
  "Briefcase"
];

export const AVAILABLE_COLORS = [
  "#10B981", // Green
  "#F59E0B", // Amber
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#14B8A6", // Teal
  "#84CC16", // Lime
  "#6B7280", // Gray
  "#78350F"  // Brown
];
