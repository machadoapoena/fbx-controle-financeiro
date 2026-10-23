import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Category, Transaction, TransactionType, Project } from "../types";
import LucideIcon from "./LucideIcon";

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  categories: Category[];
  projects: Project[];
  initialData?: Transaction | null;
}

export default function TransactionForm({
  isOpen,
  onClose,
  onSubmit,
  categories,
  projects,
  initialData
}: TransactionFormProps) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [value, setValue] = useState<number | "">("");
  const [type, setType] = useState<TransactionType>("saida");
  const [payee, setPayee] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [status, setStatus] = useState<"realizado" | "previsto">("realizado");
  const [project, setProject] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");

  // Sync state if editing an existing record
  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setCategory(initialData.category);
      setDate(initialData.date);
      setValue(initialData.value);
      setType(initialData.type);
      setPayee(initialData.payee || "");
      setBankAccount(initialData.bankAccount || "");
      setStatus(initialData.status || "realizado");
      setProject(initialData.project || "");
      setInvoiceNumber(initialData.invoiceNumber || "");
    } else {
      // Set defaults for new record (sem dados fictícios)
      setDescription("");
      setCategory(categories[0]?.name || "");
      // Default to today
      const today = new Date().toISOString().split("T")[0];
      setDate(today);
      setValue("");
      setType("saida");
      setPayee("");
      setBankAccount("");
      setStatus("realizado");
      setProject("");
      setInvoiceNumber("");
    }
  }, [initialData, isOpen, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !category || !date || value === "" || value <= 0) {
      alert("Por favor, preencha todos os campos obrigatórios corretamente.");
      return;
    }

    onSubmit({
      id: initialData?.id, // include id if editing
      description,
      category,
      date,
      value: Number(value),
      type,
      payee,
      bankAccount,
      status,
      project: project || "",
      invoiceNumber: invoiceNumber.trim() ? invoiceNumber.trim() : undefined
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="transaction-form-backdrop">
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
            className="bg-white border border-slate-100 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden relative z-10 my-8"
            id="transaction-form-card"
          >
            {/* Form Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type === "entrada" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                  <LucideIcon name={initialData ? "Edit" : "Plus"} size={16} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {initialData ? "Editar Registro Financeiro" : "Nova Transação"}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <LucideIcon name="X" size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type & Status Switchers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type Switcher */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Tipo de Transação
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setType("entrada")}
                      className={`py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        type === "entrada"
                          ? "bg-white text-emerald-600 shadow-xs"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${type === "entrada" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                      Entrada (Receita)
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("saida")}
                      className={`py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        type === "saida"
                          ? "bg-white text-rose-600 shadow-xs"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${type === "saida" ? "bg-rose-500 animate-pulse" : "bg-slate-400"}`} />
                      Saída (Despesa)
                    </button>
                  </div>
                </div>

                {/* Status Switcher */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Situação do Lançamento
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setStatus("realizado")}
                      className={`py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        status === "realizado"
                          ? "bg-white text-teal-700 shadow-xs"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${status === "realizado" ? "bg-teal-500" : "bg-slate-400"}`} />
                      Realizado (Pago)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("previsto")}
                      className={`py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        status === "previsto"
                          ? "bg-white text-amber-700 shadow-xs"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${status === "previsto" ? "bg-amber-500 animate-pulse" : "bg-slate-400"}`} />
                      Previsto (Previsão)
                    </button>
                  </div>
                </div>
              </div>

              {/* Description & Value */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Descrição da Transação *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Compra supermercado, Salário, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#009d7a] focus:ring-1 focus:ring-[#009d7a]/10 rounded-xl text-xs transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    placeholder="0,00"
                    value={value}
                    onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#009d7a] focus:ring-1 focus:ring-[#009d7a]/10 rounded-xl text-xs font-bold text-slate-700 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Categoria *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#009d7a] focus:ring-1 focus:ring-[#009d7a]/10 rounded-xl text-xs transition-all outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#009d7a] focus:ring-1 focus:ring-[#009d7a]/10 rounded-xl text-xs transition-all outline-none text-slate-600"
                  />
                </div>
              </div>

              {/* Payee Name (Nome do Beneficiario) & Bank Account (Conta Bancaria) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nome do Beneficiário / Remetente
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Carrefour, Google, Nome da pessoa"
                    value={payee}
                    onChange={(e) => setPayee(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#009d7a] focus:ring-1 focus:ring-[#009d7a]/10 rounded-xl text-xs transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Conta Bancária (Origem / Destino)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: NuBank, Itaú Corrente, Caixa"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#009d7a] focus:ring-1 focus:ring-[#009d7a]/10 rounded-xl text-xs transition-all outline-none"
                  />
                </div>
              </div>

              {/* Project Association & Invoice Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Vincular a um Projeto (Opcional)
                  </label>
                  <select
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#009d7a] focus:ring-1 focus:ring-[#009d7a]/10 rounded-xl text-xs transition-all outline-none text-slate-600 font-medium"
                  >
                    <option value="">Nenhum projeto selecionado</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Número da Nota Fiscal (NF)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Digite o número da nota fiscal..."
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#009d7a] focus:ring-1 focus:ring-[#009d7a]/10 rounded-xl text-xs transition-all outline-none text-slate-700"
                    />
                    <div className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none">
                      <LucideIcon name="FileText" size={14} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer ${
                    type === "entrada"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-rose-600 hover:bg-rose-500"
                  }`}
                >
                  <span>{initialData ? "Salvar Alterações" : "Adicionar Transação"}</span>
                  <LucideIcon name="Check" size={14} />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
