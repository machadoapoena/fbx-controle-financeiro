import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Transaction, Project } from "../types";
import LucideIcon from "./LucideIcon";
import { exportProjectReportToPDF } from "./PDFExporter";

interface ProjectStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  transactions: Transaction[];
  onLiquidateTransaction?: (id: string) => void;
}

export default function ProjectStatsModal({
  isOpen,
  onClose,
  project,
  transactions,
  onLiquidateTransaction
}: ProjectStatsModalProps) {
  
  // Calculate project metrics
  const projectStats = useMemo(() => {
    if (!project) return null;

    // Filter transactions associated with this project
    const projectTxs = transactions.filter((t) => t.project === project.id);

    let receitasRealizadas = 0;
    let receitasPrevistas = 0;
    let despesasRealizadas = 0;
    let despesasPrevistas = 0;

    projectTxs.forEach((t) => {
      const isPrevisto = t.status === "previsto";
      if (t.type === "entrada") {
        if (isPrevisto) {
          receitasPrevistas += t.value;
        } else {
          receitasRealizadas += t.value;
        }
      } else {
        if (isPrevisto) {
          despesasPrevistas += t.value;
        } else {
          despesasRealizadas += t.value;
        }
      }
    });

    const totalEntrada = receitasRealizadas + receitasPrevistas;
    const totalSaida = despesasRealizadas + despesasPrevistas;
    
    const saldoRealizado = receitasRealizadas - despesasRealizadas;
    const saldoProjetado = totalEntrada - totalSaida;

    return {
      transactionsList: projectTxs.sort((a, b) => b.date.localeCompare(a.date)),
      receitasRealizadas,
      receitasPrevistas,
      despesasRealizadas,
      despesasPrevistas,
      totalEntrada,
      totalSaida,
      saldoRealizado,
      saldoProjetado,
    };
  }, [project, transactions]);

  // Format currency
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handlePDFExport = async () => {
    if (!project || !projectStats) return;
    try {
      await exportProjectReportToPDF({
        project,
        transactions: projectStats.transactionsList,
        stats: {
          receitasRealizadas: projectStats.receitasRealizadas,
          receitasPrevistas: projectStats.receitasPrevistas,
          despesasRealizadas: projectStats.despesasRealizadas,
          despesasPrevistas: projectStats.despesasPrevistas,
          totalEntrada: projectStats.totalEntrada,
          totalSaida: projectStats.totalSaida,
          saldoRealizado: projectStats.saldoRealizado,
          saldoProjetado: projectStats.saldoProjetado,
        }
      });
    } catch (err) {
      console.warn("Erro ao gerar PDF do projeto:", err);
    }
  };

  if (!project || !projectStats) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="project-stats-backdrop">
          {/* Glass backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white border border-slate-100 w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden relative z-10 my-8"
            id="project-stats-card"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#0c2c40] text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <LucideIcon name="BarChart3" size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Balanço do Projeto</h3>
                  <p className="text-[10px] text-teal-200 font-semibold uppercase tracking-wider">{project.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <LucideIcon name="X" size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Financial Dashboard Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Income Summary Box */}
                <div className="bg-emerald-50/40 border border-emerald-100/50 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <LucideIcon name="TrendingUp" size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Total de Receitas</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-black text-emerald-700">
                      {formatBRL(projectStats.totalEntrada)}
                    </div>
                    <div className="text-[10px] text-emerald-600/80 font-medium space-y-0.5">
                      <div className="flex justify-between">
                        <span>Realizado:</span>
                        <span className="font-bold">{formatBRL(projectStats.receitasRealizadas)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Previsão:</span>
                        <span className="font-bold">{formatBRL(projectStats.receitasPrevistas)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expenses Summary Box */}
                <div className="bg-rose-50/40 border border-rose-100/50 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-rose-800">
                    <LucideIcon name="TrendingDown" size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Total de Despesas</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-black text-rose-700">
                      {formatBRL(projectStats.totalSaida)}
                    </div>
                    <div className="text-[10px] text-rose-600/80 font-medium space-y-0.5">
                      <div className="flex justify-between">
                        <span>Realizado:</span>
                        <span className="font-bold">{formatBRL(projectStats.despesasRealizadas)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Previsão:</span>
                        <span className="font-bold">{formatBRL(projectStats.despesasPrevistas)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Balance Summary Box */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-slate-700">
                    <LucideIcon name="Scale" size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Saldo Líquido / Projetado</span>
                  </div>
                  <div className="space-y-1">
                    <div className={`text-lg font-black ${projectStats.saldoProjetado >= 0 ? "text-teal-700" : "text-rose-700"}`}>
                      {formatBRL(projectStats.saldoProjetado)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium space-y-0.5">
                      <div className="flex justify-between">
                        <span>Saldo Realizado:</span>
                        <span className={`font-bold ${projectStats.saldoRealizado >= 0 ? "text-teal-600" : "text-rose-600"}`}>
                          {formatBRL(projectStats.saldoRealizado)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200/60 pt-0.5 mt-0.5">
                        <span>Saldo Projetado:</span>
                        <span className="font-bold">{formatBRL(projectStats.saldoProjetado)}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Project Ledger Transactions list */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <LucideIcon name="List" size={14} className="text-[#0c2c40]" />
                    Lançamentos deste Projeto ({projectStats.transactionsList.length})
                  </h4>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                  <div className="overflow-x-auto max-h-[250px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100/70 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/50">
                          <th className="px-4 py-2">Data</th>
                          <th className="px-4 py-2">Beneficiário</th>
                          <th className="px-4 py-2">Descrição</th>
                          <th className="px-4 py-2 text-center">Situação</th>
                          <th className="px-4 py-2 text-right">Valor</th>
                          {onLiquidateTransaction && <th className="px-4 py-2 text-center">Ações</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {projectStats.transactionsList.length === 0 ? (
                          <tr>
                            <td colSpan={onLiquidateTransaction ? 6 : 5} className="px-4 py-8 text-center text-slate-400 text-xs">
                              Nenhum lançamento vinculado a este projeto.
                            </td>
                          </tr>
                        ) : (
                          projectStats.transactionsList.map((tx) => {
                            const isPrevisto = tx.status === "previsto";
                            return (
                              <tr key={tx.id} className="hover:bg-slate-50 transition-colors text-xs">
                                <td className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-500">
                                  {formatDate(tx.date)}
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="font-semibold text-slate-700 truncate max-w-[150px]" title={tx.payee || "-"}>
                                    {tx.payee || <span className="text-slate-300">-</span>}
                                  </div>
                                  {tx.bankAccount && (
                                    <div className="text-[10px] text-slate-400 truncate max-w-[150px]" title={tx.bankAccount}>
                                      {tx.bankAccount}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="font-semibold text-slate-700 truncate max-w-[180px]">{tx.description}</div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                                    <span>{tx.category}</span>
                                    {tx.invoiceNumber && (
                                      <>
                                        <span>•</span>
                                        <span className="font-mono text-slate-500">NF: {tx.invoiceNumber}</span>
                                      </>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                  {isPrevisto ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100/40">
                                      Previsão
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-100/40">
                                      Realizado
                                    </span>
                                  )}
                                </td>
                                <td className={`px-4 py-2.5 text-right font-extrabold whitespace-nowrap ${
                                  tx.type === "entrada" ? "text-emerald-600" : "text-rose-600"
                                }`}>
                                  {tx.type === "entrada" ? "+" : "-"} {formatBRL(tx.value)}
                                </td>
                                {onLiquidateTransaction && (
                                  <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                    {isPrevisto ? (
                                      <button
                                        type="button"
                                        onClick={() => onLiquidateTransaction(tx.id)}
                                        className="p-1 text-amber-600 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors cursor-pointer"
                                        title="Liquidado (Realizado)"
                                      >
                                        <LucideIcon name="CheckCircle2" size={13} />
                                      </button>
                                    ) : (
                                      <span className="text-slate-300 text-[10px] font-medium">-</span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end items-center gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={handlePDFExport}
                className="px-4 py-2 bg-[#009d7a] hover:bg-[#008264] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                title="Exportar balanço do projeto em PDF"
              >
                <LucideIcon name="Printer" size={14} />
                <span>Imprimir PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#0c2c40] hover:bg-[#13405c] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Concluir
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
