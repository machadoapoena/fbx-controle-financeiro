import { Transaction, Category, Project } from "../types";

const SPREADSHEET_NAME = "XNG Finance - Controle de Fluxo de Caixa";

/**
 * Searches Google Drive for a spreadsheet with the designated name.
 * If found, returns its ID. Otherwise, returns null.
 */
async function searchSpreadsheet(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent(`name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Error searching spreadsheet:", errText);
    throw new Error(`Failed to search Google Drive: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/**
 * Creates a brand new Google Spreadsheet with three sheets: "Transações", "Categorias", and "Projetos".
 * Initializes headers on all sheets.
 */
async function createSpreadsheet(accessToken: string): Promise<string> {
  const url = "https://sheets.googleapis.com/v4/spreadsheets";
  
  const payload = {
    properties: {
      title: SPREADSHEET_NAME,
    },
    sheets: [
      {
        properties: {
          title: "Transações",
        },
      },
      {
        properties: {
          title: "Categorias",
        },
      },
      {
        properties: {
          title: "Projetos",
        },
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Error creating spreadsheet:", errText);
    throw new Error(`Failed to create spreadsheet: ${response.statusText}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;

  // Initialize spreadsheet headers
  await initializeHeaders(accessToken, spreadsheetId);

  return spreadsheetId;
}

/**
 * Ensures a specific sheet tab exists, adding it if missing.
 */
async function ensureSheetExists(accessToken: string, spreadsheetId: string, title: string): Promise<void> {
  try {
    // Check if sheet exists first by getting spreadsheet metadata
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(title))`;
    const getRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (getRes.ok) {
      const data = await getRes.json();
      const existingTitles = (data.sheets || []).map((s: any) => s.properties?.title);
      if (existingTitles.includes(title)) {
        return; // Already exists
      }
    }

    // Add sheet
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: title,
              },
            },
          },
        ],
      }),
    });
  } catch (error) {
    console.error(`Error ensuring sheet ${title} exists:`, error);
  }
}

/**
 * Sets headers for all sheets (Transações, Categorias, and Projetos)
 */
async function initializeHeaders(accessToken: string, spreadsheetId: string): Promise<void> {
  // Transações Sheet Headers
  const txHeaders = ["ID", "Tipo", "Descrição", "Valor", "Categoria", "Data", "Beneficiário", "Conta Bancária", "Situação", "Projeto", "Nota Fiscal"];
  const txUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("Transações!A1:K1")}?valueInputOption=USER_ENTERED`;
  
  const txRes = await fetch(txUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range: "Transações!A1:K1",
      majorDimension: "ROWS",
      values: [txHeaders],
    }),
  });

  if (!txRes.ok) {
    console.error("Failed to initialize Transações headers:", await txRes.text());
  }

  // Categorias Sheet Headers
  const catHeaders = ["ID", "Nome", "Cor", "Ícone"];
  const catUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("Categorias!A1:D1")}?valueInputOption=USER_ENTERED`;

  const catRes = await fetch(catUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range: "Categorias!A1:D1",
      majorDimension: "ROWS",
      values: [catHeaders],
    }),
  });

  if (!catRes.ok) {
    console.error("Failed to initialize Categorias headers:", await catRes.text());
  }

  // Ensure "Projetos" sheet is present
  await ensureSheetExists(accessToken, spreadsheetId, "Projetos");

  // Projetos Sheet Headers
  const projHeaders = ["ID", "Nome"];
  const projUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("Projetos!A1:B1")}?valueInputOption=USER_ENTERED`;

  const projRes = await fetch(projUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range: "Projetos!A1:B1",
      majorDimension: "ROWS",
      values: [projHeaders],
    }),
  });

  if (!projRes.ok) {
    console.error("Failed to initialize Projetos headers:", await projRes.text());
  }
}

/**
 * Finds the spreadsheet or creates a new one, returning the Spreadsheet ID.
 */
export async function findOrCreateSpreadsheet(accessToken: string): Promise<string> {
  // Check localStorage first
  const storedId = localStorage.getItem("google_spreadsheet_id");
  if (storedId) {
    try {
      // Simple verification fetch to check if sheet is still accessible
      const verifyUrl = `https://sheets.googleapis.com/v4/spreadsheets/${storedId}?fields=spreadsheetId`;
      const verifyRes = await fetch(verifyUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (verifyRes.ok) {
        return storedId;
      }
    } catch {
      // Stale or inaccessible ID, proceed to search Drive
    }
  }

  // Search on Drive
  let id = await searchSpreadsheet(accessToken);
  if (!id) {
    id = await createSpreadsheet(accessToken);
  }

  // Store in localStorage for faster subsequent loads
  localStorage.setItem("google_spreadsheet_id", id);
  return id;
}

/**
 * Fetches transactions from the Google Sheets spreadsheet.
 */
export async function fetchTransactionsFromSheets(accessToken: string, spreadsheetId: string): Promise<Transaction[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("Transações!A2:K")}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Error reading transactions:", errText);
    throw new Error(`Failed to load transactions: ${response.statusText}`);
  }

  const data = await response.json();
  const rows = data.values || [];

  return rows.map((row: any[]): Transaction => {
    // Row column mapping:
    // 0: ID, 1: Tipo, 2: Descrição, 3: Valor, 4: Categoria, 5: Data, 6: Beneficiário, 7: Conta Bancária, 8: Situação, 9: Projeto, 10: Nota Fiscal
    const valueStr = row[3] || "0";
    const parsedValue = typeof valueStr === "string" 
      ? parseFloat(valueStr.replace(/\./g, "").replace(",", ".")) 
      : Number(valueStr);

    return {
      id: row[0] || "",
      type: (row[1] || "saida") as "entrada" | "saida",
      description: row[2] || "",
      value: isNaN(parsedValue) ? 0 : parsedValue,
      category: row[4] || "Outros",
      date: row[5] || "",
      payee: row[6] || "",
      bankAccount: row[7] || "",
      status: (row[8] || "realizado") as "realizado" | "previsto",
      project: row[9] || "",
      invoiceNumber: row[10] || undefined,
    };
  });
}

/**
 * Clears and rewrites all transactions to the spreadsheet.
 */
export async function saveTransactionsToSheets(accessToken: string, spreadsheetId: string, transactions: Transaction[]): Promise<void> {
  // First clear old data from row 2 downwards
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("Transações!A2:K")}:clear`;
  await fetch(clearUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (transactions.length === 0) return;

  // Build the list of rows to write
  const values = transactions.map((tx) => [
    tx.id,
    tx.type,
    tx.description,
    tx.value,
    tx.category,
    tx.date,
    tx.payee,
    tx.bankAccount,
    tx.status || "realizado",
    tx.project || "",
    tx.invoiceNumber || "",
  ]);

  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`Transações!A2:K${1 + transactions.length}`)}?valueInputOption=USER_ENTERED`;
  const response = await fetch(writeUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range: `Transações!A2:J${1 + transactions.length}`,
      majorDimension: "ROWS",
      values,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Error saving transactions to spreadsheet:", errText);
    throw new Error(`Failed to save transactions: ${response.statusText}`);
  }
}

/**
 * Fetches projects from the spreadsheet.
 */
export async function fetchProjectsFromSheets(accessToken: string, spreadsheetId: string): Promise<Project[]> {
  await ensureSheetExists(accessToken, spreadsheetId, "Projetos");

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("Projetos!A2:B")}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Error reading projects:", errText);
    throw new Error(`Failed to load projects: ${response.statusText}`);
  }

  const data = await response.json();
  const rows = data.values || [];

  return rows.map((row: any[]): Project => ({
    id: row[0] || "",
    name: row[1] || "",
  }));
}

/**
 * Clears and rewrites all projects to the spreadsheet.
 */
export async function saveProjectsToSheets(accessToken: string, spreadsheetId: string, projects: Project[]): Promise<void> {
  await ensureSheetExists(accessToken, spreadsheetId, "Projetos");

  // Clear old projects from row 2 downwards
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("Projetos!A2:B")}:clear`;
  await fetch(clearUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (projects.length === 0) return;

  const values = projects.map((proj) => [
    proj.id,
    proj.name,
  ]);

  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`Projetos!A2:B${1 + projects.length}`)}?valueInputOption=USER_ENTERED`;
  const response = await fetch(writeUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range: `Projetos!A2:B${1 + projects.length}`,
      majorDimension: "ROWS",
      values,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Error saving projects to spreadsheet:", errText);
    throw new Error(`Failed to save projects: ${response.statusText}`);
  }
}

/**
 * Fetches categories from the spreadsheet.
 */
export async function fetchCategoriesFromSheets(accessToken: string, spreadsheetId: string): Promise<Category[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("Categorias!A2:D")}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Error reading categories:", errText);
    throw new Error(`Failed to load categories: ${response.statusText}`);
  }

  const data = await response.json();
  const rows = data.values || [];

  return rows.map((row: any[]): Category => ({
    id: row[0] || "",
    name: row[1] || "",
    color: row[2] || "#6B7280",
    icon: row[3] || "HelpCircle",
  }));
}

/**
 * Clears and rewrites all categories to the spreadsheet.
 */
export async function saveCategoriesToSheets(accessToken: string, spreadsheetId: string, categories: Category[]): Promise<void> {
  // Clear old categories from row 2 downwards
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("Categorias!A2:D")}:clear`;
  await fetch(clearUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (categories.length === 0) return;

  const values = categories.map((cat) => [
    cat.id,
    cat.name,
    cat.color,
    cat.icon,
  ]);

  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`Categorias!A2:D${1 + categories.length}`)}?valueInputOption=USER_ENTERED`;
  const response = await fetch(writeUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range: `Categorias!A2:D${1 + categories.length}`,
      majorDimension: "ROWS",
      values,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Error saving categories to spreadsheet:", errText);
    throw new Error(`Failed to save categories: ${response.statusText}`);
  }
}
