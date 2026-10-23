import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DEFAULT_CATEGORIES, INITIAL_TRANSACTIONS } from "./data";
import { Category, Transaction, Project } from "./types";
import SummaryCards from "./components/SummaryCards";
import FinancialCharts from "./components/FinancialCharts";
import TransactionForm from "./components/TransactionForm";
import CategoryManager from "./components/CategoryManager";
import ProjectManager from "./components/ProjectManager";
import ProjectStatsModal from "./components/ProjectStatsModal";
import AdminLogin from "./components/AdminLogin";
import { exportTransactionsToPDF } from "./components/PDFExporter";
import LucideIcon from "./components/LucideIcon";
import Pagination from "./components/Pagination";
import {
  initAuth,
  googleSignIn,
  logout,
} from "./lib/firebase";
import {
  findOrCreateSpreadsheet,
  fetchTransactionsFromSheets,
  saveTransactionsToSheets,
  fetchCategoriesFromSheets,
  saveCategoriesToSheets,
  fetchProjectsFromSheets,
  saveProjectsToSheets,
} from "./lib/googleSheets";

export default function App() {
  // --- STATE PERSISTENCE ---
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("finance_transactions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading transactions:", e);
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem("finance_categories");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading categories:", e);
      }
    }
    return DEFAULT_CATEGORIES;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem("finance_projects");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading projects:", e);
      }
    }
    return [
      { id: "proj-1", name: "Projeto Alfa" },
      { id: "proj-2", name: "Projeto Beta" }
    ];
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem("finance_isAdmin") === "true";
  });

  // --- FILTERS STATE ---
  const [selectedMonth, setSelectedMonth] = useState<string>("todos");
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("todos");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"todos" | "realizado" | "previsto">("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // --- MODALS STATE ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isProjectStatsOpen, setIsProjectStatsOpen] = useState(false);
  const [selectedProjectForStats, setSelectedProjectForStats] = useState<string>("");
  const [transactionIdToDelete, setTransactionIdToDelete] = useState<string | null>(null);

  // --- GOOGLE SHEETS SYNC STATE ---
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleSpreadsheetId, setGoogleSpreadsheetId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isLoadingFromSheets, setIsLoadingFromSheets] = useState(false);

  // Synchronize localStorage when state changes (as fallback or local copy)
  useEffect(() => {
    localStorage.setItem("finance_transactions", JSON.stringify(transactions));
  }, [transactions]);

   useEffect(() => {
    localStorage.setItem("finance_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("finance_projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("finance_isAdmin", String(isAdmin));
  }, [isAdmin]);

  // --- GOOGLE SHEETS SYNC ACTIONS ---
  
  // On Mount: Auto-initialize Auth and handle previously connected state
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        
        const storedId = localStorage.getItem("google_spreadsheet_id");
        if (storedId) {
          setGoogleSpreadsheetId(storedId);
          setIsLoadingFromSheets(true);
          setSyncStatus("syncing");
          try {
            const sheetCats = await fetchCategoriesFromSheets(token, storedId);
            if (sheetCats.length > 0) {
              setCategories(sheetCats);
            }
            const sheetProjs = await fetchProjectsFromSheets(token, storedId);
            if (sheetProjs.length > 0) {
              setProjects(sheetProjs);
            }
            const sheetTxs = await fetchTransactionsFromSheets(token, storedId);
            if (sheetTxs.length > 0) {
              setTransactions(sheetTxs);
            }
            setSyncStatus("success");
          } catch (err) {
            console.error("Erro ao carregar dados salvos da planilha:", err);
            setSyncStatus("error");
          } finally {
            setIsLoadingFromSheets(false);
          }
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setSyncStatus("idle");
      }
    );

    return () => unsubscribe();
  }, []);

  // Connect Google Account & Load Spreadsheet
  const handleGoogleConnect = async () => {
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        
        setIsLoadingFromSheets(true);
        // Find or create spreadsheet
        const id = await findOrCreateSpreadsheet(res.accessToken);
        setGoogleSpreadsheetId(id);
        
        // Load categories
        const sheetCats = await fetchCategoriesFromSheets(res.accessToken, id);
        if (sheetCats.length > 0) {
          setCategories(sheetCats);
        } else {
          // If sheets is empty, seed with current local categories
          await saveCategoriesToSheets(res.accessToken, id, categories);
        }

        // Load projects
        const sheetProjs = await fetchProjectsFromSheets(res.accessToken, id);
        if (sheetProjs.length > 0) {
          setProjects(sheetProjs);
        } else {
          // If sheets is empty, seed with current local projects
          await saveProjectsToSheets(res.accessToken, id, projects);
        }
        
        // Load transactions
        const sheetTxs = await fetchTransactionsFromSheets(res.accessToken, id);
        if (sheetTxs.length > 0) {
          setTransactions(sheetTxs);
        } else {
          // If sheets is empty, seed with current local transactions
          await saveTransactionsToSheets(res.accessToken, id, transactions);
        }
        
        setSyncStatus("success");
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus("error");
      setSyncError(err.message || "Falha na conexão com o Google");
    } finally {
      setIsLoadingFromSheets(false);
    }
  };

  // Disconnect Google Sheets
  const handleGoogleDisconnect = async () => {
    const confirmLogout = window.confirm("Deseja realmente desconectar da planilha do Google Sheets?");
    if (!confirmLogout) return;

    try {
      await logout();
      setGoogleUser(null);
      setGoogleToken(null);
      setGoogleSpreadsheetId(null);
      setSyncStatus("idle");
      
      // Reload from local storage
      const saved = localStorage.getItem("finance_transactions");
      if (saved) {
        setTransactions(JSON.parse(saved));
      } else {
        setTransactions(INITIAL_TRANSACTIONS);
      }
      
      const savedCats = localStorage.getItem("finance_categories");
      if (savedCats) {
        setCategories(JSON.parse(savedCats));
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }

      const savedProjs = localStorage.getItem("finance_projects");
      if (savedProjs) {
        setProjects(JSON.parse(savedProjs));
      } else {
        setProjects([
          { id: "proj-1", name: "Projeto Alfa" },
          { id: "proj-2", name: "Projeto Beta" }
        ]);
      }
    } catch (err) {
      console.error("Erro ao desconectar Google:", err);
    }
  };

  // Auto-sync Transactions to Google Sheets on changes
  useEffect(() => {
    if (!googleToken || !googleSpreadsheetId || isLoadingFromSheets) return;

    const syncData = async () => {
      setSyncStatus("syncing");
      try {
        await saveTransactionsToSheets(googleToken, googleSpreadsheetId, transactions);
        setSyncStatus("success");
      } catch (err: any) {
        console.error("Erro no auto-sync de transações:", err);
        setSyncStatus("error");
        setSyncError(err.message || "Erro de sincronização");
      }
    };

    const timer = setTimeout(() => {
      syncData();
    }, 1500);

    return () => clearTimeout(timer);
  }, [transactions, googleToken, googleSpreadsheetId, isLoadingFromSheets]);

  // Auto-sync Categories to Google Sheets on changes
  useEffect(() => {
    if (!googleToken || !googleSpreadsheetId || isLoadingFromSheets) return;

    const syncData = async () => {
      setSyncStatus("syncing");
      try {
        await saveCategoriesToSheets(googleToken, googleSpreadsheetId, categories);
        setSyncStatus("success");
      } catch (err: any) {
        console.error("Erro no auto-sync de categorias:", err);
        setSyncStatus("error");
        setSyncError(err.message || "Erro de sincronização");
      }
    };

    const timer = setTimeout(() => {
      syncData();
    }, 1500);

    return () => clearTimeout(timer);
  }, [categories, googleToken, googleSpreadsheetId, isLoadingFromSheets]);

  // Auto-sync Projects to Google Sheets on changes
  useEffect(() => {
    if (!googleToken || !googleSpreadsheetId || isLoadingFromSheets) return;

    const syncData = async () => {
      setSyncStatus("syncing");
      try {
        await saveProjectsToSheets(googleToken, googleSpreadsheetId, projects);
        setSyncStatus("success");
      } catch (err: any) {
        console.error("Erro no auto-sync de projetos:", err);
        setSyncStatus("error");
        setSyncError(err.message || "Erro de sincronização");
      }
    };

    const timer = setTimeout(() => {
      syncData();
    }, 1500);

    return () => clearTimeout(timer);
  }, [projects, googleToken, googleSpreadsheetId, isLoadingFromSheets]);

  // --- ADMIN SESSION ---
  const handleLoginSuccess = () => {
    setIsAdmin(true);
  };

  const handleLogout = () => {
    setIsAdmin(false);
  };

  // --- DYNAMIC FILTERS DATA ---
  // Extract unique available months from transactions list (Format: YYYY-MM)
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        monthsSet.add(tx.date.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // --- FILTERED TRANSACTIONS ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Month Filter (match YYYY-MM substring)
      const matchesMonth = selectedMonth === "todos" || t.date.startsWith(selectedMonth);

      // Category Filter (match category name)
      const matchesCategory = selectedCategory === "todos" || t.category === selectedCategory;

      // Project Filter (match project ID)
      const matchesProject = selectedProjectFilter === "todos" || t.project === selectedProjectFilter;

      // Status Filter
      const matchesStatus =
        selectedStatusFilter === "todos" ||
        (t.status || "realizado") === selectedStatusFilter;

      // Text Search Filter (matches description, payee, bank account, or invoice number)
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        t.description.toLowerCase().includes(query) ||
        (t.payee && t.payee.toLowerCase().includes(query)) ||
        (t.bankAccount && t.bankAccount.toLowerCase().includes(query)) ||
        (t.invoiceNumber && t.invoiceNumber.toLowerCase().includes(query));

      return matchesMonth && matchesCategory && matchesProject && matchesStatus && matchesSearch;
    }).sort((a, b) => b.date.localeCompare(a.date)); // Newest first
  }, [transactions, selectedMonth, selectedCategory, selectedProjectFilter, selectedStatusFilter, searchQuery]);

  // --- SUMMARIES FOR FILTERED DATA ---
  const totals = useMemo(() => {
    let totalInRealizado = 0;
    let totalOutRealizado = 0;
    let totalInPrevisto = 0;
    let totalOutPrevisto = 0;

    filteredTransactions.forEach((t) => {
      const isPrevisto = t.status === "previsto";
      if (t.type === "entrada") {
        if (isPrevisto) {
          totalInPrevisto += t.value;
        } else {
          totalInRealizado += t.value;
        }
      } else {
        if (isPrevisto) {
          totalOutPrevisto += t.value;
        } else {
          totalOutRealizado += t.value;
        }
      }
    });
    return {
      totalInRealizado,
      totalOutRealizado,
      totalInPrevisto,
      totalOutPrevisto,
    };
  }, [filteredTransactions]);

  // --- PAGINATION & ON-DEMAND QUERYING ---
  // Reset to first page when any search/filter criteria or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedCategory, selectedProjectFilter, selectedStatusFilter, searchQuery, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);

  // Paginated records slice queried on-demand
  const paginatedTransactions = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, activePage, pageSize]);

  // --- CRUD OPERATIONS ---
  // Create / Update Transaction
  const handleTransactionSubmit = (data: Omit<Transaction, "id"> & { id?: string }) => {
    if (data.id) {
      // Edit
      setTransactions((prev) =>
        prev.map((t) => (t.id === data.id ? { ...t, ...data } as Transaction : t))
      );
    } else {
      // Insert
      const newTx: Transaction = {
        ...data,
        id: `tx-${Date.now()}`
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  // Quick Liquidate (Previsto -> Realizado)
  const handleLiquidateTransaction = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "realizado" as const } : t))
    );
  };

  // Delete Transaction
  const handleDeleteTransaction = (id: string) => {
    setTransactionIdToDelete(id);
  };

  const handleConfirmDeleteTransaction = () => {
    if (transactionIdToDelete) {
      setTransactions((prev) => prev.filter((t) => t.id !== transactionIdToDelete));
      setTransactionIdToDelete(null);
    }
  };

  // Trigger Edit Modal
  const handleEditClick = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsFormOpen(true);
  };

  // Trigger Add Modal
  const handleAddClick = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  // Add Custom Category
  const handleAddCategory = (newCatData: Omit<Category, "id">) => {
    const newCat: Category = {
      ...newCatData,
      id: `cat-${Date.now()}`
    };
    setCategories((prev) => [...prev, newCat]);
  };

  // Delete Custom Category
  const handleDeleteCategory = (id: string) => {
    const catToDelete = categories.find((c) => c.id === id);
    if (!catToDelete) return;

    // Check if category is used in active transactions
    const isUsed = transactions.some((t) => t.category === catToDelete.name);
    if (isUsed) {
      alert(
        `A categoria "${catToDelete.name}" não pode ser excluída porque existem transações registradas com ela.`
      );
      return;
    }

    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Add Custom Project
  const handleAddProject = (projectName: string) => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: projectName
    };
    setProjects((prev) => [...prev, newProj]);
  };

  // Delete Custom Project
  const handleDeleteProject = (id: string) => {
    const projToDelete = projects.find((p) => p.id === id);
    if (!projToDelete) return;

    // Check if project is used in active transactions
    const isUsed = transactions.some((t) => t.project === id);
    if (isUsed) {
      alert(
        `O projeto "${projToDelete.name}" não pode ser excluído porque existem transações registradas vinculadas a ele.`
      );
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
    
    // Reset filters and views if deleted
    if (selectedProjectForStats === id) {
      setSelectedProjectForStats("");
    }
    if (selectedProjectFilter === id) {
      setSelectedProjectFilter("todos");
    }
  };

  // --- PDF EXPORT TRIGGER ---
  const handlePDFExport = async () => {
    await exportTransactionsToPDF({
      transactions: filteredTransactions,
      categories,
      selectedMonth,
      selectedCategory
    });
  };

  // --- DATE FORMATTER ---
  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // --- CURRENCY FORMATTER ---
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  // Helper to get category styling
  const getCategoryBadge = (catName: string) => {
    const cat = categories.find((c) => c.name === catName);
    const color = cat?.color || "#6B7280";
    const icon = cat?.icon || "HelpCircle";

    return (
      <span 
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <LucideIcon name={icon} size={12} />
        {catName}
      </span>
    );
  };

  // Pre-fill search filter helper
  const clearFilters = () => {
    setSelectedMonth("todos");
    setSelectedCategory("todos");
    setSelectedProjectFilter("todos");
    setSelectedStatusFilter("todos");
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#edf2f5] text-slate-950 font-sans antialiased selection:bg-[#009d7a]/10 selection:text-[#0c2c40] pb-16" id="app-root">
      
      {/* 1. Header Navigation Panel */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-4 py-4 md:px-8" id="main-header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo Title Group */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-10 h-10 rounded-xl object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "https://fbx.org.br/wp-content/uploads/2026/07/Gddsdroup.png";
              }}
            />
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-950">XNG - Controle Financeiro</h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Painel de Gestão Financeiro</p>
            </div>
          </div>

          {/* Action Header Group */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handlePDFExport}
              disabled={filteredTransactions.length === 0}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold rounded-lg hover:shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              id="export-pdf-btn"
            >
              <LucideIcon name="FileDown" size={14} className="text-slate-500" />
              <span>Exportar PDF</span>
            </button>

            {/* Admin Authenticator Component */}
            <AdminLogin 
              isAdmin={isAdmin}
              onLoginSuccess={handleLoginSuccess}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </header>

      {/* Main Core Layout Grid */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-8" id="main-content">

        {/* Google Sheets Sync Status Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4" id="sheets-sync-panel">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#009d7a] flex items-center justify-center font-bold">
              <LucideIcon name="Table" size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Planilha Google Sheets</h4>
              {googleUser ? (
                <p className="text-[11px] text-slate-500">
                  Sincronizado na conta <span className="font-semibold">{googleUser.email}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Os dados estão salvos no seu navegador. Conecte ao Google Sheets para gravar e ler de sua planilha.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {googleUser && googleSpreadsheetId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${googleSpreadsheetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <LucideIcon name="ExternalLink" size={12} />
                <span>Abrir Planilha</span>
              </a>
            )}

            {googleUser ? (
              <div className="flex items-center gap-2">
                {/* Sync Status Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                  {syncStatus === "syncing" && (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="text-amber-500 flex items-center justify-center"
                      >
                        <LucideIcon name="RefreshCw" size={12} />
                      </motion.div>
                      <span className="text-[10px] font-bold text-amber-600">Sincronizando...</span>
                    </>
                  )}
                  {syncStatus === "success" && (
                    <>
                      <LucideIcon name="CheckCircle2" size={12} className="text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-600">Sincronizado</span>
                    </>
                  )}
                  {syncStatus === "error" && (
                    <div className="flex items-center gap-1.5" title={syncError || undefined}>
                      <LucideIcon name="AlertCircle" size={12} className="text-rose-500" />
                      <span className="text-[10px] font-bold text-rose-600 truncate max-w-[150px]">
                        {syncError ? `Erro: ${syncError}` : "Erro ao Sincronizar"}
                      </span>
                    </div>
                  )}
                  {syncStatus === "idle" && (
                    <>
                      <LucideIcon name="Cloud" size={12} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500">Conectado</span>
                    </>
                  )}
                </div>

                <button
                  onClick={handleGoogleDisconnect}
                  className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/50 rounded-lg transition-colors cursor-pointer"
                >
                  Desconectar
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleConnect}
                disabled={syncStatus === "syncing"}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#009d7a] hover:bg-[#008264] text-white text-xs font-bold rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <LucideIcon name="Chrome" size={13} />
                <span>Conectar Planilha Google</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Section A: Summed up financial stats card */}
        <SummaryCards
          totalInRealizado={totals.totalInRealizado}
          totalOutRealizado={totals.totalOutRealizado}
          totalInPrevisto={totals.totalInPrevisto}
          totalOutPrevisto={totals.totalOutPrevisto}
        />

        {/* Section B: Cashflow Visualizations Charts */}
        <FinancialCharts transactions={filteredTransactions} categories={categories} />

        {/* Section C: List Filter Controllers */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4" id="filters-section">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <LucideIcon name="Filter" size={16} className="text-[#0c2c40]" />
                  Registros e Transações
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                  {filteredTransactions.length} {filteredTransactions.length === 1 ? "registro" : "registros"}
                </span>
              </div>
              <p className="text-xs text-slate-400">Gerencie, filtre e pesquise seu fluxo de caixa com paginação sob demanda</p>
            </div>

            {/* Quick Action Buttons for Admin / Normal user */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
              
              {/* Project Combo with Eye Icon */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 pl-3 pr-2 py-1 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projeto:</span>
                <select
                  value={selectedProjectForStats}
                  onChange={(e) => setSelectedProjectForStats(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none focus:ring-0 cursor-pointer max-w-[130px] truncate"
                >
                  <option value="">Selecione...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedProjectForStats}
                  onClick={() => setIsProjectStatsOpen(true)}
                  className={`p-1.5 rounded-lg transition-all shrink-0 ${
                    selectedProjectForStats 
                      ? "text-[#009d7a] hover:bg-slate-200/50 cursor-pointer" 
                      : "text-slate-300 cursor-not-allowed"
                  }`}
                  title="Visualizar balanço do projeto"
                >
                  <LucideIcon name="Eye" size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsProjectManagerOpen(true)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-all shrink-0 cursor-pointer"
                  title="Cadastrar e Gerenciar Projetos"
                >
                  <LucideIcon name="Plus" size={14} />
                </button>
              </div>

              <button
                onClick={() => setIsCategoryManagerOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                id="manage-categories-btn"
              >
                <LucideIcon name="Settings" size={14} />
                <span>Categorias</span>
              </button>

              {isAdmin && (
                <button
                  onClick={handleAddClick}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#009d7a] hover:bg-[#008264] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                  id="add-transaction-btn"
                >
                  <LucideIcon name="Plus" size={14} />
                  <span>Nova Transação</span>
                </button>
              )}
            </div>
          </div>

          {/* Filtering Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            
            {/* Search Input */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Buscar</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Descrição ou beneficiário..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#009d7a] focus:ring-1 focus:ring-[#009d7a]/10 rounded-xl text-xs transition-all outline-none"
                />
                <LucideIcon name="HelpCircle" size={14} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            {/* Month Filter */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mês de Referência</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#009d7a] focus:ring-1 focus:ring-[#009d7a]/10 rounded-xl text-xs transition-all outline-none text-slate-600"
              >
                <option value="todos">Todos os meses</option>
                {availableMonths.map((m) => {
                  const [year, month] = m.split("-");
                  const monthNames = [
                    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                  ];
                  const label = `${monthNames[parseInt(month) - 1]} / ${year}`;
                  return (
                    <option key={m} value={m}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Categoria</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#009d7a] focus:ring-1 focus:ring-[#009d7a]/10 rounded-xl text-xs transition-all outline-none text-slate-600"
              >
                <option value="todos">Todas as categorias</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Filter */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Projeto</label>
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#009d7a] focus:ring-1 focus:ring-[#009d7a]/10 rounded-xl text-xs transition-all outline-none text-slate-600 animate-none"
              >
                <option value="todos">Todos os projetos</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status (Situação) Filter */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Situação</label>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#009d7a] focus:ring-1 focus:ring-[#009d7a]/10 rounded-xl text-xs transition-all outline-none text-slate-600"
              >
                <option value="todos">Todas as situações</option>
                <option value="realizado">Somente Realizados (Liquidados)</option>
                <option value="previsto">Somente Previsões (Planejados)</option>
              </select>
            </div>

            {/* Clear Filter Button */}
            <div className="flex items-end">
              {(selectedMonth !== "todos" || selectedCategory !== "todos" || selectedProjectFilter !== "todos" || selectedStatusFilter !== "todos" || searchQuery !== "") ? (
                <button
                  onClick={clearFilters}
                  className="w-full py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-rose-100/50"
                >
                  <LucideIcon name="X" size={14} />
                  <span>Limpar Filtros</span>
                </button>
              ) : (
                <div className="w-full text-center text-[11px] text-slate-400 py-2.5 font-semibold bg-slate-50/50 border border-slate-100/80 rounded-xl">
                  Filtros Limpos
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Section D: Transactions Table List */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" id="transactions-table-section">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-wider text-slate-400">Data</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-wider text-slate-400">Descrição</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-wider text-slate-400">Categoria</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-wider text-slate-400">Beneficiário</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-wider text-slate-400">Conta</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 text-center">Situação</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 text-right">Valor</th>
                  {isAdmin && <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 text-center">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-xs">
                <AnimatePresence initial={false}>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 8 : 7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
                            <LucideIcon name="HelpCircle" size={24} />
                          </div>
                          <p className="font-semibold text-slate-700 text-sm">Nenhuma transação encontrada</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                            Não há registros correspondentes aos filtros selecionados.
                          </p>
                          {(selectedMonth !== "todos" || selectedCategory !== "todos" || searchQuery !== "") && (
                            <button
                              onClick={clearFilters}
                              className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 font-bold rounded-lg transition-all cursor-pointer"
                            >
                              Limpar filtros e buscar de novo
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((tx) => (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        {/* Data Column */}
                        <td className="px-6 py-4 font-medium text-slate-500 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>

                        {/* Description Column */}
                        <td className="px-6 py-4 font-bold text-slate-800">
                          <div className="flex flex-col">
                            <span>{tx.description}</span>
                            {tx.invoiceNumber && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 mt-0.5">
                                <LucideIcon name="FileText" size={11} className="text-slate-400 shrink-0" />
                                <span>NF: {tx.invoiceNumber}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category Column */}
                        <td className="px-6 py-4">
                          {getCategoryBadge(tx.category)}
                        </td>

                        {/* Beneficiary Column */}
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {tx.payee || <span className="text-slate-300">-</span>}
                        </td>

                        {/* Bank Account Column */}
                        <td className="px-6 py-4 text-slate-500 font-mono">
                          {tx.bankAccount || <span className="text-slate-300">-</span>}
                        </td>

                        {/* Status (Situação) Column */}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {(tx.status || "realizado") === "previsto" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100/60 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Previsão
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                              Realizado
                            </span>
                          )}
                        </td>

                        {/* Value Column (BRL formatted) */}
                        <td className={`px-6 py-4 text-right font-extrabold whitespace-nowrap ${
                          tx.type === "entrada" ? "text-emerald-600" : "text-rose-600"
                        }`}>
                          <span className="mr-1 text-[10px] font-normal opacity-80">
                            {tx.type === "entrada" ? "+" : "-"}
                          </span>
                          {formatBRL(tx.value)}
                        </td>

                        {/* Admin Action Operations */}
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1">
                              {(tx.status || "realizado") === "previsto" && (
                                <button
                                  onClick={() => handleLiquidateTransaction(tx.id)}
                                  className="p-1.5 rounded-lg text-amber-600 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                                  title="Marcar como Realizado (Liquidar)"
                                >
                                  <LucideIcon name="CheckCircle2" size={13} />
                                </button>
                              )}
                              <button
                                onClick={() => handleEditClick(tx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#0c2c40] hover:bg-[#0c2c40]/5 transition-colors cursor-pointer"
                                title="Editar Registro"
                              >
                                <LucideIcon name="Edit" size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Excluir Registro"
                              >
                                <LucideIcon name="Trash2" size={13} />
                              </button>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Table Footer with On-Demand Pagination */}
          <Pagination
            currentPage={activePage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredTransactions.length}
            onPageChange={(p) => {
              setCurrentPage(p);
              document.getElementById("transactions-table-section")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </section>

      </main>

      {/* --- ADD / EDIT TRANSACTION MODAL DIALOG --- */}
      <TransactionForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleTransactionSubmit}
        categories={categories}
        projects={projects}
        initialData={editingTransaction}
      />

      {/* --- CATEGORY CUSTOMIZER DIALOG --- */}
      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* --- PROJECT MANAGER DIALOG --- */}
      <ProjectManager
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        projects={projects}
        onAddProject={handleAddProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* --- PROJECT BALANCE STATS DIALOG --- */}
      <ProjectStatsModal
        isOpen={isProjectStatsOpen}
        onClose={() => setIsProjectStatsOpen(false)}
        project={projects.find((p) => p.id === selectedProjectForStats) || null}
        transactions={transactions}
        onLiquidateTransaction={isAdmin ? handleLiquidateTransaction : undefined}
      />

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {transactionIdToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-xl border border-slate-100"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                    <LucideIcon name="AlertTriangle" size={20} className="text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Excluir Registro</h3>
                    <p className="text-xs text-slate-450">Esta ação não poderá ser desfeita.</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Tem certeza que deseja excluir esta transação? Ela será removida permanentemente do histórico e do cálculo de saldo.
                </p>
              </div>

              <div className="bg-slate-50 px-6 py-3.5 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransactionIdToDelete(null)}
                  className="px-3.5 py-1.5 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteTransaction}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <LucideIcon name="Trash2" size={13} />
                  <span>Excluir</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
