import { motion } from "motion/react";
import LucideIcon from "./LucideIcon";

interface SummaryCardsProps {
  totalInRealizado: number;
  totalOutRealizado: number;
  totalInPrevisto: number;
  totalOutPrevisto: number;
}

export default function SummaryCards({
  totalInRealizado,
  totalOutRealizado,
  totalInPrevisto,
  totalOutPrevisto,
}: SummaryCardsProps) {
  const balanceRealizado = totalInRealizado - totalOutRealizado;
  const balanceProjetado = (totalInRealizado + totalInPrevisto) - (totalOutRealizado + totalOutPrevisto);
  const isPositiveRealizado = balanceRealizado >= 0;
  const isPositiveProjetado = balanceProjetado >= 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="summary-section">
      {/* Saldo em Conta - Deep navy background card with brand teal accent */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="col-span-1 md:col-span-6 lg:col-span-6 bg-[#0c2c40] border-t-4 border-[#009d7a] rounded-2xl p-6 text-white shadow-lg shadow-[#0c2c40]/10 flex flex-col justify-between relative overflow-hidden"
        id="balance-card"
      >
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#009d7a] rounded-full opacity-15 pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full justify-between gap-4">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                Saldo Realizado (Liquidado)
              </span>
              <span className="text-[10px] bg-teal-500/20 text-[#009d7a] px-2 py-0.5 rounded-full font-bold">
                Dinheiro em Caixa
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <h2 className="text-3xl md:text-4xl font-black tabular-nums tracking-tight text-white">
                {formatCurrency(balanceRealizado)}
              </h2>
            </div>
          </div>

          <div className="border-t border-slate-700/60 pt-3 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                Saldo Projetado (Com Previsões)
              </span>
              <span className={`text-sm font-extrabold tabular-nums block mt-0.5 ${isPositiveProjetado ? "text-[#009d7a]" : "text-rose-400"}`}>
                {formatCurrency(balanceProjetado)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium self-end">
              <span className={`w-1.5 h-1.5 rounded-full ${isPositiveRealizado ? "bg-[#009d7a]" : "bg-rose-400"}`} />
              {isPositiveRealizado ? "Conta saudável" : "Atenção: Saldo devedor"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Entradas Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="col-span-1 md:col-span-3 lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between gap-4"
        id="entries-summary-card"
      >
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Entradas Realizadas
          </span>
          <span className="text-2xl font-extrabold text-[#009d7a] tracking-tight block">
            + {formatCurrency(totalInRealizado)}
          </span>
        </div>
        <div className="border-t border-slate-100 pt-3">
          <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">
            Previsões de Entrada
          </span>
          <span className="text-xs font-bold text-slate-600 block mt-0.5">
            + {formatCurrency(totalInPrevisto)}
          </span>
          <div className="text-[10px] text-slate-400 mt-2.5 flex items-center gap-1">
            <LucideIcon name="TrendingUp" size={12} className="text-[#009d7a]" />
            <span>Faturamento realizado</span>
          </div>
        </div>
      </motion.div>

      {/* Saídas Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="col-span-1 md:col-span-3 lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between gap-4"
        id="exits-summary-card"
      >
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Saídas Realizadas
          </span>
          <span className="text-2xl font-extrabold text-rose-500 tracking-tight block">
            - {formatCurrency(totalOutRealizado)}
          </span>
        </div>
        <div className="border-t border-slate-100 pt-3">
          <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">
            Previsões de Saída
          </span>
          <span className="text-xs font-bold text-slate-600 block mt-0.5">
            - {formatCurrency(totalOutPrevisto)}
          </span>
          <div className="text-[10px] text-slate-400 mt-2.5 flex items-center gap-1">
            <LucideIcon name="TrendingDown" size={12} className="text-rose-400" />
            <span>Gastos liquidados</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
