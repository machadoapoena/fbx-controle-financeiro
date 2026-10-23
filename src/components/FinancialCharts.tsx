import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Category, Transaction } from "../types";
import LucideIcon from "./LucideIcon";

interface FinancialChartsProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function FinancialCharts({ transactions, categories }: FinancialChartsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  // Calculate overall inflow/outflow for active transactions
  const totalInflow = transactions
    .filter((t) => t.type === "entrada")
    .reduce((sum, t) => sum + t.value, 0);

  const totalOutflow = transactions
    .filter((t) => t.type === "saida")
    .reduce((sum, t) => sum + t.value, 0);

  // Calculate expenditures per category for active transactions
  const spendingByCategory = transactions
    .filter((t) => t.type === "saida")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.value;
      return acc;
    }, {});

  // Map category names/IDs to their styling and total expenditure
  const categoryStats = categories.map((cat) => {
    const totalSpent = spendingByCategory[cat.name] || spendingByCategory[cat.id] || 0;
    return {
      name: cat.name,
      value: totalSpent,
      color: cat.color,
      icon: cat.icon
    };
  })
  .filter((stat) => stat.value > 0) // Only show categories with actual spending
  .sort((a, b) => b.value - a.value); // Sorted highest to lowest spending

  const maxCategorySpending = categoryStats.length > 0 ? Math.max(...categoryStats.map((s) => s.value)) : 1;
  const grandTotalCategorySpending = categoryStats.reduce((sum, s) => sum + s.value, 0);

  // Custom dual column representation for cashflow
  const maxCashflowValue = Math.max(totalInflow, totalOutflow, 1);
  const inHeightPercent = Math.max((totalInflow / maxCashflowValue) * 100, 3);
  const outHeightPercent = Math.max((totalOutflow / maxCashflowValue) * 100, 3);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all duration-200 hover:border-slate-300" id="charts-accordion-container">
      {/* Accordion Trigger Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none hover:bg-slate-50/50 transition-colors cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <div className="w-9 h-9 rounded-xl bg-[#009d7a]/10 text-[#009d7a] flex items-center justify-center">
            <LucideIcon name="BarChart3" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Gráficos de Fluxo de Caixa e Gastos
            </h3>
            <p className="text-xs text-slate-400">Clique para {isExpanded ? "recolher" : "visualizar"} o painel de gráficos e categorias</p>
          </div>

          {/* Quick summary badges visible only when collapsed */}
          {!isExpanded && (
            <div className="flex items-center gap-2 ml-0 md:ml-4 mt-1.5 md:mt-0">
              <span className="text-[10px] font-bold text-[#009d7a] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/50">
                Entradas: {formatCurrency(totalInflow)}
              </span>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100/50">
                Saídas: {formatCurrency(totalOutflow)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-md hidden sm:inline">
            {isExpanded ? "Recolher" : "Expandir"}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-500"
          >
            <LucideIcon name="ChevronDown" size={16} />
          </motion.div>
        </div>
      </button>

      {/* Accordion Expandable Panel Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-6 bg-slate-50/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="charts-container">
                
                {/* Chart 1: Cashflow (Entradas vs Saídas) */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between" id="cashflow-chart">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-1">
                      <LucideIcon name="TrendingUp" size={16} className="text-[#0c2c40]" />
                      Fluxo de Caixa (Entradas vs Saídas)
                    </h3>
                    <p className="text-[11px] text-slate-400 mb-4">Comparação direta do volume transacionado no período selecionado</p>
                  </div>

                  {/* Visual Dual Bars */}
                  <div className="h-48 flex items-end justify-around px-4 pb-4 border-b border-slate-100 relative">
                    {/* Subtle horizontal grid lines */}
                    <div className="absolute inset-x-0 top-0 h-px bg-slate-50 pointer-events-none" />
                    <div className="absolute inset-x-0 top-1/4 h-px bg-slate-50 pointer-events-none" />
                    <div className="absolute inset-x-0 top-2/4 h-px bg-slate-50 pointer-events-none" />
                    <div className="absolute inset-x-0 top-3/4 h-px bg-slate-50 pointer-events-none" />

                    {/* Entrada Bar */}
                    <div 
                      className="flex flex-col items-center gap-1.5 w-20 group relative z-10"
                      onMouseEnter={() => setHoveredBar("inflow")}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <div className="w-full bg-slate-50 hover:bg-emerald-50 rounded-t-md transition-all duration-300 relative flex items-end justify-center overflow-hidden" style={{ height: `${inHeightPercent * 1.2}px` }}>
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: "100%" }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="w-full bg-[#009d7a] rounded-t-md"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entradas</span>
                      <span className="text-[10px] font-bold text-[#009d7a] bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.5 rounded-md mt-0.5">
                        {formatCurrency(totalInflow)}
                      </span>

                      {/* Hover Tooltip */}
                      {hoveredBar === "inflow" && (
                        <div className="absolute -top-10 bg-slate-950 text-white text-[10px] py-1 px-2 rounded-md shadow-lg pointer-events-none z-20 whitespace-nowrap">
                          Faturamento: {formatCurrency(totalInflow)}
                        </div>
                      )}
                    </div>

                    {/* Saída Bar */}
                    <div 
                      className="flex flex-col items-center gap-1.5 w-20 group relative z-10"
                      onMouseEnter={() => setHoveredBar("outflow")}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <div className="w-full bg-slate-50 hover:bg-rose-50 rounded-t-md transition-all duration-300 relative flex items-end justify-center overflow-hidden" style={{ height: `${outHeightPercent * 1.2}px` }}>
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: "100%" }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="w-full bg-rose-500 rounded-t-md"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saídas</span>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100/50 px-1.5 py-0.5 rounded-md mt-0.5">
                        {formatCurrency(totalOutflow)}
                      </span>

                      {/* Hover Tooltip */}
                      {hoveredBar === "outflow" && (
                        <div className="absolute -top-10 bg-slate-950 text-white text-[10px] py-1 px-2 rounded-md shadow-lg pointer-events-none z-20 whitespace-nowrap">
                          Gastos totais: {formatCurrency(totalOutflow)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dynamic description indicator */}
                  <div className="mt-3 text-center">
                    {totalInflow > totalOutflow ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full font-bold border border-emerald-100/40">
                        <LucideIcon name="Check" size={11} />
                        Superávit de {formatCurrency(totalInflow - totalOutflow)} este período
                      </span>
                    ) : totalOutflow > totalInflow ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 px-3 py-0.5 rounded-full font-bold border border-rose-100/40">
                        <LucideIcon name="AlertTriangle" size={11} />
                        Déficit de {formatCurrency(totalOutflow - totalInflow)} este período
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 px-3 py-0.5 rounded-full font-bold border border-slate-100">
                        Fluxo equilibrado este período
                      </span>
                    )}
                  </div>
                </div>

                {/* Chart 2: Category expenditures list (Gastos Mensais por Categoria) */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between" id="category-chart">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-1">
                      <LucideIcon name="PieChart" size={16} className="text-[#0c2c40]" />
                      Gastos por Categoria (Saídas)
                    </h3>
                    <p className="text-[11px] text-slate-400 mb-4">Detalhamento proporcional dos gastos mensais em categorias personalizadas</p>
                  </div>

                  {categoryStats.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-6">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2 border border-slate-100">
                        <LucideIcon name="HelpCircle" size={20} />
                      </div>
                      <p className="text-xs font-medium text-slate-400 text-center">Nenhum gasto registrado no período</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[190px] overflow-y-auto pr-1 flex-1">
                      {categoryStats.map((stat, i) => {
                        const percentage = grandTotalCategorySpending > 0 ? (stat.value / grandTotalCategorySpending) * 100 : 0;
                        const barWidthPercent = (stat.value / maxCategorySpending) * 100;

                        return (
                          <div key={i} className="group/item">
                            <div className="flex justify-between items-center mb-1 text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <span 
                                  className="w-2.5 h-2.5 rounded-sm shrink-0 border border-black/5" 
                                  style={{ backgroundColor: stat.color }}
                                />
                                <span className="font-semibold text-slate-700">{stat.name}</span>
                                <span className="text-slate-400 font-normal">({percentage.toFixed(1)}%)</span>
                              </div>
                              <span className="font-bold text-slate-800">{formatCurrency(stat.value)}</span>
                            </div>
                            
                            {/* Progress track */}
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${barWidthPercent}%` }}
                                transition={{ duration: 0.5, delay: i * 0.05 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: stat.color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Display grand total spent across these categories */}
                  {categoryStats.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-500">Total de Despesas do Período</span>
                      <span className="font-extrabold text-slate-800 text-xs">{formatCurrency(grandTotalCategorySpending)}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
