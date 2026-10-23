import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  writeBatch,
  Unsubscribe,
} from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "./firebase";
import { Transaction, Category, Project } from "../types";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorContext {
  operation: OperationType;
  path: string;
}

export function handleFirestoreError(error: unknown, context: FirestoreErrorContext): never {
  const err = error as { code?: string; message?: string };
  const message = `Firestore ${context.operation} falhou em ${context.path}: ${err?.message || "Erro desconhecido"}`;
  console.error(message, error);
  throw new Error(message);
}

/**
 * Sync or create user document in /users/{userId}
 */
export async function syncUserProfile(user: User): Promise<void> {
  const userRef = doc(db, "users", user.uid);
  const now = new Date().toISOString();
  try {
    await setDoc(
      userRef,
      {
        id: user.uid,
        email: user.email || "",
        displayName: user.displayName || "Usuário",
        role: user.email === "machadoapoena@gmail.com" ? "admin" : "user",
        updatedAt: now,
        createdAt: now,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, {
      operation: OperationType.WRITE,
      path: `users/${user.uid}`,
    });
  }
}

/**
 * Checks whether user has any transactions recorded in Firestore.
 */
export async function isFirestoreEmptyForUser(userId: string): Promise<boolean> {
  try {
    const q = query(collection(db, "transactions"), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.empty;
  } catch (error) {
    console.warn("Could not check if firestore is empty, defaulting to false:", error);
    return false;
  }
}

/**
 * Subscribe in real time to user's transactions.
 */
export function subscribeToTransactions(
  userId: string,
  onData: (txs: Transaction[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, "transactions"), where("userId", "==", userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          description: d.description || "",
          category: d.category || "Outros",
          date: d.date || "",
          value: Number(d.value) || 0,
          type: (d.type as "entrada" | "saida") || "saida",
          payee: d.payee || "",
          bankAccount: d.bankAccount || "",
          status: (d.status as "realizado" | "previsto") || "realizado",
          project: d.project || "",
          invoiceNumber: d.invoiceNumber || undefined,
        });
      });
      // Sort descending by date
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onData(list);
    },
    (error) => {
      console.error("Erro na escuta de transações do Firestore:", error);
      if (onError) onError(error as Error);
    }
  );
}

/**
 * Subscribe in real time to user's categories.
 */
export function subscribeToCategories(
  userId: string,
  onData: (cats: Category[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, "categories"), where("userId", "==", userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Category[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          name: d.name || "",
          color: d.color || "#6B7280",
          icon: d.icon || "HelpCircle",
        });
      });
      onData(list);
    },
    (error) => {
      console.error("Erro na escuta de categorias do Firestore:", error);
      if (onError) onError(error as Error);
    }
  );
}

/**
 * Subscribe in real time to user's projects.
 */
export function subscribeToProjects(
  userId: string,
  onData: (projs: Project[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, "projects"), where("userId", "==", userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Project[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          name: d.name || "",
        });
      });
      onData(list);
    },
    (error) => {
      console.error("Erro na escuta de projetos do Firestore:", error);
      if (onError) onError(error as Error);
    }
  );
}

/**
 * Saves or updates a transaction in Firestore.
 */
export async function saveTransactionToFirestore(userId: string, tx: Transaction): Promise<void> {
  const txRef = doc(db, "transactions", tx.id);
  const now = new Date().toISOString();
  try {
    await setDoc(
      txRef,
      {
        id: tx.id,
        description: tx.description,
        category: tx.category,
        date: tx.date,
        value: Number(tx.value) || 0,
        type: tx.type,
        payee: tx.payee || "",
        bankAccount: tx.bankAccount || "",
        status: tx.status || "realizado",
        project: tx.project || "",
        invoiceNumber: tx.invoiceNumber || "",
        userId: userId,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, {
      operation: OperationType.WRITE,
      path: `transactions/${tx.id}`,
    });
  }
}

/**
 * Deletes a transaction from Firestore.
 */
export async function deleteTransactionFromFirestore(txId: string): Promise<void> {
  const txRef = doc(db, "transactions", txId);
  try {
    await deleteDoc(txRef);
  } catch (error) {
    handleFirestoreError(error, {
      operation: OperationType.DELETE,
      path: `transactions/${txId}`,
    });
  }
}

/**
 * Saves a category to Firestore.
 */
export async function saveCategoryToFirestore(userId: string, cat: Category): Promise<void> {
  const catRef = doc(db, "categories", cat.id);
  try {
    await setDoc(
      catRef,
      {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        userId: userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, {
      operation: OperationType.WRITE,
      path: `categories/${cat.id}`,
    });
  }
}

/**
 * Deletes a category from Firestore.
 */
export async function deleteCategoryFromFirestore(catId: string): Promise<void> {
  const catRef = doc(db, "categories", catId);
  try {
    await deleteDoc(catRef);
  } catch (error) {
    handleFirestoreError(error, {
      operation: OperationType.DELETE,
      path: `categories/${catId}`,
    });
  }
}

/**
 * Saves a project to Firestore.
 */
export async function saveProjectToFirestore(userId: string, proj: Project): Promise<void> {
  const projRef = doc(db, "projects", proj.id);
  try {
    await setDoc(
      projRef,
      {
        id: proj.id,
        name: proj.name,
        userId: userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, {
      operation: OperationType.WRITE,
      path: `projects/${proj.id}`,
    });
  }
}

/**
 * Deletes a project from Firestore.
 */
export async function deleteProjectFromFirestore(projId: string): Promise<void> {
  const projRef = doc(db, "projects", projId);
  try {
    await deleteDoc(projRef);
  } catch (error) {
    handleFirestoreError(error, {
      operation: OperationType.DELETE,
      path: `projects/${projId}`,
    });
  }
}

/**
 * Migrates a complete set of transactions, categories, and projects to Firestore in chunks.
 * Ensures all existing spreadsheet or local data is safely transferred to Firestore.
 */
export async function migrateAllDataToFirestore(
  userId: string,
  data: {
    transactions: Transaction[];
    categories: Category[];
    projects: Project[];
  },
  onProgress?: (progress: { current: number; total: number; stage: string }) => void
): Promise<{ txCount: number; catCount: number; projCount: number }> {
  const now = new Date().toISOString();
  const total = data.transactions.length + data.categories.length + data.projects.length;
  let current = 0;

  // 1. Categories
  if (onProgress) onProgress({ current, total, stage: "Migrando categorias para o Firestore..." });
  const catBatches = chunkArray(data.categories, 300);
  for (const chunk of catBatches) {
    const batch = writeBatch(db);
    chunk.forEach((cat) => {
      const catRef = doc(db, "categories", cat.id);
      batch.set(
        catRef,
        {
          id: cat.id,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          userId: userId,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    });
    await batch.commit();
    current += chunk.length;
    if (onProgress) onProgress({ current, total, stage: "Categorias migradas com sucesso..." });
  }

  // 2. Projects
  if (onProgress) onProgress({ current, total, stage: "Migrando projetos para o Firestore..." });
  const projBatches = chunkArray(data.projects, 300);
  for (const chunk of projBatches) {
    const batch = writeBatch(db);
    chunk.forEach((proj) => {
      const projRef = doc(db, "projects", proj.id);
      batch.set(
        projRef,
        {
          id: proj.id,
          name: proj.name,
          userId: userId,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    });
    await batch.commit();
    current += chunk.length;
    if (onProgress) onProgress({ current, total, stage: "Projetos migrados com sucesso..." });
  }

  // 3. Transactions
  if (onProgress) onProgress({ current, total, stage: "Migrando transações da planilha para o Firestore..." });
  const txBatches = chunkArray(data.transactions, 300);
  for (const chunk of txBatches) {
    const batch = writeBatch(db);
    chunk.forEach((tx) => {
      const txRef = doc(db, "transactions", tx.id);
      batch.set(
        txRef,
        {
          id: tx.id,
          description: tx.description,
          category: tx.category,
          date: tx.date,
          value: Number(tx.value) || 0,
          type: tx.type,
          payee: tx.payee || "",
          bankAccount: tx.bankAccount || "",
          status: tx.status || "realizado",
          project: tx.project || "",
          invoiceNumber: tx.invoiceNumber || "",
          userId: userId,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    });
    await batch.commit();
    current += chunk.length;
    if (onProgress) onProgress({ current, total, stage: "Transações salvas no Firestore..." });
  }

  return {
    txCount: data.transactions.length,
    catCount: data.categories.length,
    projCount: data.projects.length,
  };
}

/**
 * Helper to divide an array into smaller chunks for Firestore batch limit (max 500 ops per commit).
 */
function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}
