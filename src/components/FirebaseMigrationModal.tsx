import { useState } from "react";
import { motion } from "motion/react";
import LucideIcon from "./LucideIcon";
import { Transaction, Category, Project } from "../types";
import { migrateAllDataToFirestore } from "../lib/firestoreService";
import {
  fetchTransactionsFromSheets,
  fetchCategoriesFromSheets,
  fetchProjectsFromSheets,
} from "../lib/googleSheets";

interface FirebaseMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  userEmail: string | null;
  googleToken: string | null;
  googleSpreadsheetId: string | null;
  currentTransactions: Transaction[];
  currentCategories: Category[];
  currentProjects: Project[];
  onMigrationComplete: () => void;
  onConnectGoogle: () => void;
}

export default function FirebaseMigrationModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  googleToken,
  googleSpreadsheetId,
  currentTransactions,
  currentCategories,
  currentProjects,
  onMigrationComplete,
  onConnectGoogle,
}: FirebaseMigrationModalProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationSource, setMigrationSource] = useState<"sheets" | "current">("sheets");
  const [progressStage, setProgressStage] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successSummary, setSuccessSummary] = useState<{
    txCount: number;
    catCount: number;
    projCount: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleStartMigration = async () => {
    const effectiveUserId = userId || "apoena-admin";

    setIsMigrating(true);
    setErrorMsg(null);
    setSuccessSummary(null);
    setProgressPercent(10);
    setProgressStage("Iniciando migração de dados...");

    try {
      let txsToMigrate = currentTransactions;
      let catsToMigrate = currentCategories;
      let projsToMigrate = currentProjects;

      // If user selected migrating directly from Google Sheets and is connected
      if (migrationSource === "sheets" && googleToken && googleSpreadsheetId) {
        setProgressStage("Lendo dados diretamente da sua planilha do Google Sheets...");
        setProgressPercent(20);

        try {
          const sheetCats = await fetchCategoriesFromSheets(googleToken, googleSpreadsheetId);
          if (sheetCats.length > 0) catsToMigrate = sheetCats;

          const sheetProjs = await fetchProjectsFromSheets(googleToken, googleSpreadsheetId);
          if (sheetProjs.length > 0) projsToMigrate = sheetProjs;

          const sheetTxs = await fetchTransactionsFromSheets(googleToken, googleSpreadsheetId);
          if (sheetTxs.length > 0) txsToMigrate = sheetTxs;
        } catch (sheetErr: any) {
          console.warn("Falha ao ler da planilha, utilizando dados carregados:", sheetErr);
          // If sheets fails, continue with current in-memory loaded transactions
        }
      }

      setProgressPercent(40);
      setProgressStage("Gravando coleções no Firebase Firestore...");

      const result = await migrateAllDataToFirestore(
        effectiveUserId,
        {
          transactions: txsToMigrate,
          categories: catsToMigrate,
          projects: projsToMigrate,
        },
        ({ current, total, stage }) => {
          setProgressStage(stage);
          const computed = 40 + Math.round((current / Math.max(1, total)) * 55);
          setProgressPercent(Math.min(98, computed));
        }
      );

      setProgressPercent(100);
      setProgressStage("Migração concluída com sucesso!");
      setSuccessSummary(result);
      onMigrationComplete();
    } catch (err: any) {
      console.error("Erro na migração para o Firebase:", err);
      setErrorMsg(err.message || "Erro desconhecido ao migrar para o Firestore.");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#0c2c40] to-[#009d7a] text-white flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-400">
              <LucideIcon name="Database" size={26} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Migração para o Firebase Firestore</h3>
              <p className="text-xs text-white/80">
                Transfira seus registros existentes da planilha para a nuvem segura do Firebase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isMigrating}
            className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 cursor-pointer disabled:opacity-50"
          >
            <LucideIcon name="X" size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Status info */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Conta Firebase / Admin:</span>
              <span className="font-bold text-slate-800">
                {userEmail || "Apoena Machado (Admin Ativo)"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Status da Planilha Google:</span>
              <span className="font-bold flex items-center gap-1">
                {googleSpreadsheetId ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <LucideIcon name="CheckCircle" size={12} /> Conectada ({currentTransactions.length} linhas)
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1">
                    <LucideIcon name="AlertCircle" size={12} /> Não vinculada (usando dados locais)
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Registros prontos para migrar:</span>
              <span className="font-bold text-[#009d7a]">
                {currentTransactions.length} transações • {currentCategories.length} categorias • {currentProjects.length} projetos
              </span>
            </div>
          </div>

          {/* Source selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Origem dos dados a migrar:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMigrationSource("sheets")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  migrationSource === "sheets"
                    ? "border-[#009d7a] bg-emerald-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <LucideIcon name="Table" size={16} className={migrationSource === "sheets" ? "text-[#009d7a]" : "text-slate-500"} />
                  <span className="text-xs font-bold text-slate-800">Da Planilha Google</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Importa as abas Transações, Categorias e Projetos
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMigrationSource("current")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  migrationSource === "current"
                    ? "border-[#009d7a] bg-emerald-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <LucideIcon name="HardDrive" size={16} className={migrationSource === "current" ? "text-[#009d7a]" : "text-slate-500"} />
                  <span className="text-xs font-bold text-slate-800">Do Painel Atual</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Migra os registros atualmente em exibição na tela
                </p>
              </button>
            </div>
          </div>

          {/* Connect Google sheets if needed */}
          {migrationSource === "sheets" && !googleToken && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
              <span className="text-amber-800">Sua planilha ainda não está vinculada.</span>
              <button
                type="button"
                onClick={onConnectGoogle}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold cursor-pointer"
              >
                Conectar Planilha
              </button>
            </div>
          )}

          {/* Migration Progress display */}
          {isMigrating && (
            <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700 flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <LucideIcon name="RefreshCw" size={14} className="text-[#009d7a]" />
                  </motion.div>
                  {progressStage}
                </span>
                <span className="text-[#009d7a]">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-[#009d7a] to-[#10B981] h-2.5 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Success summary display */}
          {successSummary && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <LucideIcon name="CheckCircle2" size={18} className="text-emerald-600" />
                <span>Migração concluída com sucesso!</span>
              </div>
              <p className="text-emerald-700">
                Foram gravados no Firebase Firestore:
              </p>
              <ul className="list-disc list-inside text-emerald-800 font-semibold space-y-0.5">
                <li>{successSummary.txCount} transações migradas</li>
                <li>{successSummary.catCount} categorias salvas</li>
                <li>{successSummary.projCount} projetos configurados</li>
              </ul>
              <p className="text-[11px] text-emerald-600 mt-1">
                Todas as alterações subsequentes agora são sincronizadas em tempo real na nuvem do Firestore.
              </p>
            </div>
          )}

          {/* Error display */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <LucideIcon name="AlertTriangle" size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Falha ao migrar dados:</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            disabled={isMigrating}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {successSummary ? "Fechar" : "Cancelar"}
          </button>

          <button
            type="button"
            onClick={handleStartMigration}
            disabled={isMigrating}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#009d7a] hover:bg-[#008264] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LucideIcon name="UploadCloud" size={16} />
            <span>{isMigrating ? "Migrando para Firestore..." : "Iniciar Migração Agora"}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
