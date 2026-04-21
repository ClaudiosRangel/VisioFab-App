import {
  collection, doc, addDoc, getDoc, getDocs,
  updateDoc, deleteDoc, query, where, WhereFilterOp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface DocBase { id: string }

function agora(): string {
  return new Date().toISOString();
}

export async function criarDocumento<T extends DocBase>(
  colecao: string,
  dados: Omit<T, 'id' | 'criadoEm' | 'criadaEm' | 'atualizadoEm' | 'atualizadaEm'>,
): Promise<string> {
  const ts = agora();
  const ref = await addDoc(collection(db, colecao), {
    ...dados,
    criadoEm: ts,
    criadaEm: ts,
    atualizadoEm: ts,
    atualizadaEm: ts,
  });
  return ref.id;
}

export async function obterDocumento<T extends DocBase>(
  colecao: string,
  id: string,
): Promise<T | null> {
  const snap = await getDoc(doc(db, colecao, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T;
}

export async function listarDocumentos<T extends DocBase>(
  colecao: string,
): Promise<T[]> {
  const snap = await getDocs(collection(db, colecao));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

export async function listarDocumentosComFiltro<T extends DocBase>(
  colecao: string,
  campo: string,
  operador: WhereFilterOp,
  valor: unknown,
): Promise<T[]> {
  const q = query(collection(db, colecao), where(campo, operador, valor));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

export async function atualizarDocumento<T extends DocBase>(
  colecao: string,
  id: string,
  dados: Partial<Omit<T, 'id'>>,
): Promise<void> {
  const ts = agora();
  await updateDoc(doc(db, colecao, id), { ...dados, atualizadoEm: ts, atualizadaEm: ts });
}

export async function removerDocumento(colecao: string, id: string): Promise<void> {
  await deleteDoc(doc(db, colecao, id));
}
