import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import LucideIcon from "./LucideIcon";

interface AdminLoginProps {
  isAdmin: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
}

export default function AdminLogin({ isAdmin, onLoginSuccess, onLogout }: AdminLoginProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLoginSuccess();
        setIsOpen(false);
        setPassword("");
      } else {
        setError(data.error || "Senha incorreta. Tente novamente.");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="admin-login-module">
      {isAdmin ? (
        <div className="flex items-center gap-2" id="admin-badge-container">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/60">
            <LucideIcon name="User" size={12} />
            Administrador
          </span>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-lg transition-all duration-200"
            title="Sair do modo administrador"
            id="logout-btn"
          >
            <LucideIcon name="LogOut" size={14} />
            <span>Sair</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0c2c40] hover:bg-[#13405c] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
          id="login-trigger-btn"
        >
          <LucideIcon name="Lock" size={13} />
          <span>Acesso Admin</span>
        </button>
      )}

      {/* Modal Backdrop and Box */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="login-modal-backdrop">
            {/* Dark glass backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white border border-slate-100 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative z-10 p-6"
              id="login-modal-card"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0c2c40]/5 flex items-center justify-center text-[#0c2c40]">
                    <LucideIcon name="Lock" size={16} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Autenticação de Administrador</h4>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <LucideIcon name="X" size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Insira a senha administrativa para liberar a inclusão, edição e exclusão de transações.
              </p>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Senha do Administrador
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-[#009d7a] focus:ring-1 focus:ring-[#009d7a]/20 rounded-xl text-sm transition-all outline-none"
                    />
                  </div>
                  {error && (
                    <span className="text-xs font-semibold text-rose-500 mt-1.5 flex items-center gap-1">
                      <LucideIcon name="AlertTriangle" size={12} />
                      {error}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 bg-[#0c2c40] hover:bg-[#13405c] text-white text-xs font-bold rounded-lg hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Entrando..." : "Confirmar"}
                    {!loading && <LucideIcon name="Check" size={14} />}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
