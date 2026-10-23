import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Category } from "../types";
import { AVAILABLE_COLORS, AVAILABLE_ICONS } from "../data";
import LucideIcon from "./LucideIcon";

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (cat: Omit<Category, "id">) => void;
  onDeleteCategory: (id: string) => void;
}

export default function CategoryManager({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory
}: CategoryManagerProps) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0]);
  const [error, setError] = useState("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("O nome da categoria não pode ser vazio.");
      return;
    }

    // Check for duplicate names
    const duplicate = categories.some(
      (cat) => cat.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      setError("Já existe uma categoria com este nome.");
      return;
    }

    onAddCategory({
      name: trimmedName,
      color: selectedColor,
      icon: selectedIcon
    });

    // Reset form
    setName("");
    setSelectedColor(AVAILABLE_COLORS[0]);
    setSelectedIcon(AVAILABLE_ICONS[0]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="category-manager-backdrop">
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
            id="category-manager-card"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0c2c40]/5 text-[#0c2c40] flex items-center justify-center">
                  <LucideIcon name="Settings" size={16} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Gerenciar Categorias Personalizadas</h3>
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
              {/* Left Column: Form to Add Category */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-[#0c2c40]">Nova Categoria</h4>
                
                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nome da Categoria
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Assinaturas, Mercado Livre"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError("");
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-[#009d7a] focus:ring-1 focus:ring-[#009d7a]/10 rounded-xl text-xs transition-all outline-none"
                    />
                    {error && <span className="text-[11px] font-semibold text-rose-500 mt-1 block">{error}</span>}
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Cor de Identificação
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {AVAILABLE_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`w-6 h-6 rounded-full transition-all border shrink-0 flex items-center justify-center cursor-pointer ${
                            selectedColor === color
                              ? "border-slate-800 scale-110 shadow-sm"
                              : "border-transparent hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        >
                          {selectedColor === color && (
                            <LucideIcon name="Check" size={12} className="text-white mix-blend-difference" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Icon Picker */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Ícone Ilustrativo
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {AVAILABLE_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setSelectedIcon(icon)}
                          className={`p-2 border rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                            selectedIcon === icon
                              ? "bg-[#0c2c40] border-[#0c2c40] text-white shadow-sm"
                              : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500"
                          }`}
                          title={icon}
                        >
                          <LucideIcon name={icon} size={15} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#009d7a] hover:bg-[#008264] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LucideIcon name="Plus" size={14} />
                    <span>Adicionar</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Existing Categories List */}
              <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6 flex flex-col h-full">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-500 mb-3">Categorias Ativas ({categories.length})</h4>
                
                <div className="space-y-2 overflow-y-auto max-h-[280px] pr-1 flex-1">
                  {categories.map((cat) => {
                    // Prevent deleting some core fallback categories like Outros if we want safety,
                    // but the user can delete most of them!
                    const isProtected = cat.name === "Outros";

                    return (
                      <div
                        key={cat.id}
                        className="flex justify-between items-center p-2 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-all text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: cat.color }}
                          >
                            <LucideIcon name={cat.icon} size={14} />
                          </div>
                          <span className="font-semibold text-slate-700">{cat.name}</span>
                        </div>

                        {!isProtected && (
                          <button
                            type="button"
                            onClick={() => onDeleteCategory(cat.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Remover Categoria"
                          >
                            <LucideIcon name="Trash2" size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
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
                Concluir
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
