import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction, Category, Project } from "../types";
import { LOGO_BASE64 } from "../assets/logoBase64";

interface ExportPDFParams {
  transactions: Transaction[];
  categories: Category[];
  selectedMonth: string; // YYYY-MM or 'todos'
  selectedCategory: string; // Name or 'todos'
}

interface ExportProjectPDFParams {
  project: Project;
  transactions: Transaction[];
  stats: {
    receitasRealizadas: number;
    receitasPrevistas: number;
    despesasRealizadas: number;
    despesasPrevistas: number;
    totalEntrada: number;
    totalSaida: number;
    saldoRealizado: number;
    saldoProjetado: number;
  };
}

async function safeLoadImage(url?: string): Promise<string | null> {
  if (url && url.startsWith("data:image")) return url;
  return LOGO_BASE64 || null;
}

export async function exportTransactionsToPDF({
  transactions,
  categories,
  selectedMonth,
  selectedCategory
}: ExportPDFParams) {
  // Initialize jsPDF in portrait mode (A4 format)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const title = "RELATÓRIO FINANCEIRO";
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Calculate totals
  const totalIn = transactions
    .filter((t) => t.type === "entrada")
    .reduce((sum, t) => sum + t.value, 0);

  const totalOut = transactions
    .filter((t) => t.type === "saida")
    .reduce((sum, t) => sum + t.value, 0);

  const balance = totalIn - totalOut;

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  // 1. Primary Header banner (Modern Charcoal)
  doc.setFillColor(30, 41, 59); // Tailwind slate-800
  doc.rect(0, 0, 210, 40, "F");

  // Draw logo image safely from pre-verified base64
  if (LOGO_BASE64) {
    try {
      doc.addImage(LOGO_BASE64, "PNG", 175, 10, 20, 20);
    } catch (e) {
      console.warn("Could not add logo to transaction report PDF:", e);
    }
  }

  // Title in white
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("CONTROLE FINANCEIRO", 15, 20);

  // Subtitle / Metadata
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(226, 232, 240); // slate-200
  doc.text(`Gerado em: ${dateStr}`, 15, 28);
  doc.text("Sistema de Controle Financeiro - Vercel Admin Panel", 15, 34);

  // 2. Report Parameters & Filters info box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.rect(15, 48, 180, 22, "FD");

  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("FILTROS ATIVOS NO RELATÓRIO:", 20, 54);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Mês de Referência: ${selectedMonth === "todos" ? "Todos os meses" : selectedMonth}`, 20, 60);
  doc.text(`Categoria Selecionada: ${selectedCategory === "todos" ? "Todas as categorias" : selectedCategory}`, 20, 65);

  // 3. Quick Stats Cards in PDF
  // Card 1: Balance (Prominent)
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(15, 78, 56, 22, "F");
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SALDO ATUAL EM CONTA", 18, 83);
  doc.setFontSize(12);
  if (balance >= 0) {
    doc.setTextColor(16, 185, 129); // emerald green
  } else {
    doc.setTextColor(239, 68, 68); // rose red
  }
  doc.text(formatBRL(balance), 18, 93);

  // Card 2: Inputs
  doc.setFillColor(240, 253, 250); // teal-50
  doc.rect(77, 78, 56, 22, "F");
  doc.setTextColor(13, 148, 136); // teal-600
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOTAL ENTRADAS (+)", 80, 83);
  doc.setFontSize(12);
  doc.text(formatBRL(totalIn), 80, 93);

  // Card 3: Outputs
  doc.setFillColor(254, 242, 242); // red-50
  doc.rect(139, 78, 56, 22, "F");
  doc.setTextColor(220, 38, 38); // red-600
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOTAL SAÍDAS (-)", 142, 83);
  doc.setFontSize(12);
  doc.text(formatBRL(totalOut), 142, 93);

  // 4. Transactions List Header
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DEMONSTRATIVO DE TRANSAÇÕES", 15, 110);

  // Define table data and column widths
  const headers = [["Data", "Beneficiário", "Descrição", "Categoria", "Conta", "Tipo", "Valor"]];
  const tableRows = transactions.map((t) => {
    // Format date YYYY-MM-DD to DD/MM/YYYY
    const parts = t.date.split("-");
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : t.date;
    const descWithNF = t.invoiceNumber ? `${t.description} (NF: ${t.invoiceNumber})` : t.description;
    return [
      formattedDate,
      t.payee || "-",
      descWithNF,
      t.category,
      t.bankAccount || "-",
      t.type === "entrada" ? "Entrada" : "Saída",
      formatBRL(t.value)
    ];
  });

  // Call autoTable (must use typed or cast access to avoid typescript errors)
  autoTable(doc, {
    startY: 114,
    head: headers,
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 18 }, // Date
      1: { cellWidth: 32 }, // Payee
      2: { cellWidth: 42 }, // Description
      3: { cellWidth: 26 }, // Category
      4: { cellWidth: 26 }, // Bank Account
      5: { cellWidth: 16 }, // Type
      6: { cellWidth: 20, halign: "right" } // Value
    },
    didParseCell: (data: any) => {
      if (data.section === "body") {
        const rowType = Array.isArray(data.row.raw) ? data.row.raw[5] : data.row.cells?.[5]?.raw;

        if (data.column.index === 5) {
          if (rowType === "Entrada") {
            data.cell.styles.textColor = [16, 185, 129]; // Green
          } else {
            data.cell.styles.textColor = [239, 68, 68]; // Red
          }
          data.cell.styles.fontStyle = "bold";
        }

        if (data.column.index === 6) {
          if (rowType === "Entrada") {
            data.cell.styles.textColor = [16, 185, 129]; // Green
          } else {
            data.cell.styles.textColor = [239, 68, 68]; // Red
          }
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    willDrawCell: (data: any) => {
      if (data.section === "body") {
        const rowType = Array.isArray(data.row.raw) ? data.row.raw[5] : data.row.cells?.[5]?.raw;
        if (data.column.index === 5 || data.column.index === 6) {
          if (rowType === "Entrada") {
            doc.setTextColor(16, 185, 129); // Green
          } else {
            doc.setTextColor(239, 68, 68); // Red
          }
        }
      }
    },
    margin: { left: 15, right: 15 }
  });

  // 5. PDF Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Página ${i} de ${pageCount}`,
      210 / 2,
      287,
      { align: "center" }
    );
    doc.text(
      "Sistema de Controle Financeiro de Alta Performance",
      15,
      287
    );
  }

  // Save the PDF
  const filename = `relatorio_financeiro_${selectedMonth === "todos" ? "completo" : selectedMonth}.pdf`;
  doc.save(filename);
}

export async function exportProjectReportToPDF({
  project,
  transactions,
  stats
}: ExportProjectPDFParams) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  // 1. Primary Header banner (Dark Teal/Blue Theme #0c2c40)
  doc.setFillColor(12, 44, 64); // #0c2c40
  doc.rect(0, 0, 210, 40, "F");

  // Draw logo image safely from pre-verified base64
  if (LOGO_BASE64) {
    try {
      doc.addImage(LOGO_BASE64, "PNG", 175, 10, 20, 20);
    } catch (e) {
      console.warn("Could not add logo to project report PDF:", e);
    }
  }

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("BALANÇO DE PROJETO", 15, 18);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(204, 251, 241); // Teal text
  doc.text(`Projeto: ${project.name}`, 15, 26);

  // Metadata
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`Gerado em: ${dateStr}  |  Sistema de Controle Financeiro`, 15, 33);

  // 2. Overview Balance Box (Large)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.rect(15, 48, 180, 26, "FD");

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("RESUMO DO PROJETO", 20, 54);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Saldo Realizado: ${formatBRL(stats.saldoRealizado)}`, 20, 61);
  doc.text(`Saldo Projetado (Previsões incluídas): ${formatBRL(stats.saldoProjetado)}`, 20, 67);

  // Right side of overview box: Large Balance display
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("SALDO PROJETADO TOTAL", 130, 54);
  doc.setFontSize(14);
  if (stats.saldoProjetado >= 0) {
    doc.setTextColor(13, 148, 136); // Teal-600
  } else {
    doc.setTextColor(220, 38, 38); // Red-600
  }
  doc.text(formatBRL(stats.saldoProjetado), 130, 64);

  // 3. Quick Stats Cards (Inputs, Outputs, and Balances)
  // Card 1: Income (Total Entrada)
  doc.setFillColor(240, 253, 250); // teal-50
  doc.rect(15, 82, 56, 26, "F");
  doc.setTextColor(13, 148, 136); // teal-600
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("RECEITAS TOTAIS", 18, 87);
  doc.setFontSize(11);
  doc.text(formatBRL(stats.totalEntrada), 18, 94);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Realizado: ${formatBRL(stats.receitasRealizadas)}`, 18, 100);
  doc.text(`Previsão: ${formatBRL(stats.receitasPrevistas)}`, 18, 104);

  // Card 2: Expenses (Total Saída)
  doc.setFillColor(254, 242, 242); // red-50
  doc.rect(77, 82, 56, 26, "F");
  doc.setTextColor(220, 38, 38); // red-600
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("DESPESAS TOTAIS", 80, 87);
  doc.setFontSize(11);
  doc.text(formatBRL(stats.totalSaida), 80, 94);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Realizado: ${formatBRL(stats.despesasRealizadas)}`, 80, 100);
  doc.text(`Previsão: ${formatBRL(stats.despesasPrevistas)}`, 80, 104);

  // Card 3: Realized Balance
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(139, 82, 56, 26, "F");
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SALDO CONCLUÍDO", 142, 87);
  doc.setFontSize(11);
  if (stats.saldoRealizado >= 0) {
    doc.setTextColor(16, 185, 129); // emerald green
  } else {
    doc.setTextColor(239, 68, 68); // rose red
  }
  doc.text(formatBRL(stats.saldoRealizado), 142, 94);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Apenas lançamentos", 142, 100);
  doc.text("com status 'Realizado'", 142, 104);

  // 4. Ledger Table Header
  doc.setTextColor(12, 44, 64);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("LANÇAMENTOS E TRANSAÇÕES DO PROJETO", 15, 118);

  const headers = [["Data", "Beneficiário", "Descrição", "Categoria", "Situação", "Tipo", "Valor"]];
  const tableRows = transactions.map((t) => {
    const parts = t.date.split("-");
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : t.date;
    const descWithNF = t.invoiceNumber ? `${t.description} (NF: ${t.invoiceNumber})` : t.description;
    return [
      formattedDate,
      t.payee || "-",
      descWithNF,
      t.category,
      t.status === "previsto" ? "Previsão" : "Realizado",
      t.type === "entrada" ? "Receita" : "Despesa",
      formatBRL(t.value)
    ];
  });

  autoTable(doc, {
    startY: 122,
    head: headers,
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [12, 44, 64],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 20 }, // Date
      1: { cellWidth: 35 }, // Beneficiário
      2: { cellWidth: 40 }, // Descrição
      3: { cellWidth: 25 }, // Category
      4: { cellWidth: 20 }, // Status
      5: { cellWidth: 18 }, // Type
      6: { cellWidth: 22, halign: "right" } // Value
    },
    didParseCell: (data: any) => {
      if (data.section === "body") {
        const rowType = Array.isArray(data.row.raw) ? data.row.raw[5] : data.row.cells?.[5]?.raw;

        // Color coding for Type (index 5)
        if (data.column.index === 5) {
          if (rowType === "Receita") {
            data.cell.styles.textColor = [16, 185, 129]; // Green
          } else {
            data.cell.styles.textColor = [239, 68, 68]; // Red
          }
          data.cell.styles.fontStyle = "bold";
        }

        // Color coding for Value (index 6): Red for despesa, Green for receita
        if (data.column.index === 6) {
          if (rowType === "Receita") {
            data.cell.styles.textColor = [16, 185, 129]; // Green for receita
          } else {
            data.cell.styles.textColor = [239, 68, 68]; // Red for despesa
          }
          data.cell.styles.fontStyle = "bold";
        }

        // Color coding for Status (index 4)
        if (data.column.index === 4) {
          const statusRaw = Array.isArray(data.row.raw) ? data.row.raw[4] : data.row.cells?.[4]?.raw;
          if (statusRaw === "Previsão") {
            data.cell.styles.textColor = [217, 119, 6]; // Amber
          } else {
            data.cell.styles.textColor = [13, 148, 136]; // Teal
          }
        }
      }
    },
    willDrawCell: (data: any) => {
      if (data.section === "body") {
        const rowType = Array.isArray(data.row.raw) ? data.row.raw[5] : data.row.cells?.[5]?.raw;

        if (data.column.index === 5 || data.column.index === 6) {
          if (rowType === "Receita") {
            doc.setTextColor(16, 185, 129); // Green
          } else {
            doc.setTextColor(239, 68, 68); // Red
          }
        }

        if (data.column.index === 4) {
          const statusRaw = Array.isArray(data.row.raw) ? data.row.raw[4] : data.row.cells?.[4]?.raw;
          if (statusRaw === "Previsão") {
            doc.setTextColor(217, 119, 6);
          } else {
            doc.setTextColor(13, 148, 136);
          }
        }
      }
    },
    margin: { left: 15, right: 15 }
  });

  // Footer for pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Página ${i} de ${pageCount}`,
      210 / 2,
      287,
      { align: "center" }
    );
    doc.text(
      `Relatório de Projeto: ${project.name}`,
      15,
      287
    );
  }

  const filename = `balanco_projeto_${project.name.toLowerCase().replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}

