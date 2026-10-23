import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Project } from "../types";
import LucideIcon from "./LucideIcon";

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onAddProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
}

export default function ProjectManager({
  isOpen,
  onClose,
  projects,
  onAddProject,
  onDeleteProject
}: ProjectManagerProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("O nome do projeto não pode ser vazio.");
      return;
    }

    // Check for duplicates
    const duplicate = projects.some(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      setError("Já existe um projeto com este nome.");
      return;
    }

    onAddProject(trimmedName);
    setName("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="project-manager-backdrop">
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
            id="project-manager-card"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#009d7a]/5 text-[#009d7a] flex items-center justify-center">
                  <LucideIcon name="Briefcase" size={16} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Gerenciar Projetos</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <LucideIcon name="X" size={18} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              {/* Left Column: Form to Add Project */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-[#0c2c40]">Novo Projeto</h4>
                
                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nome do Projeto
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Reforma Escritório, Site Clientes"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError("");
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-[#009d7a] focus:ring-1 focus:ring-[#009d7a]/10 rounded-xl text-xs transition-all outline-none"
                    />
                    {error && <span className="text-[11px] font-semibold text-rose-500 mt-1 block">{error}</span>}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#009d7a] hover:bg-[#008264] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LucideIcon name="Plus" size={14} />
                    <span>Cadastrar</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Existing Projects List */}
              <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6 flex flex-col h-full">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-500 mb-3">Projetos Ativos ({projects.length})</h4>
                
                <div className="space-y-2 overflow-y-auto max-h-[250px] pr-1 flex-1">
                  {projects.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-medium">
                      Nenhum projeto cadastrado
                    </div>
                  ) : (
                    projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="flex justify-between items-center p-2.5 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-all text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <LucideIcon name="Folder" size={14} className="text-slate-400" />
                          <span className="font-semibold text-slate-700">{proj.name}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteProject(proj.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title="Remover Projeto"
                        >
                          <LucideIcon name="Trash2" size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50/30">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-[#0c2c40] hover:bg-[#13405c] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
