import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { Usuario } from '../types';

interface AuthContextData {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const pronto = useRef(false);

  async function buscarUsuario(uid: string): Promise<Usuario | null> {
    const snap = await getDoc(doc(db, 'usuarios', uid));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Usuario;
  }

  useEffect(() => {
    // Força logout ao abrir o app (segurança)
    signOut(auth).catch(() => {}).finally(() => {
      pronto.current = true;
      setCarregando(false);
    });

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!pronto.current) return;
      if (!fbUser) { setUsuario(null); setCarregando(false); return; }

      try {
        const usr = await buscarUsuario(fbUser.uid);
        if (!usr || !usr.ativo) { await signOut(auth); setUsuario(null); }
        else setUsuario(usr);
      } catch {
        await signOut(auth);
        setUsuario(null);
      }
      setCarregando(false);
    });

    return () => unsub();
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, senha);
    const usr = await buscarUsuario(cred.user.uid);
    if (!usr) { await signOut(auth); throw new Error('Acesso negado. Usuário não cadastrado no sistema'); }
    if (!usr.ativo) { await signOut(auth); throw new Error('Acesso negado. Usuário inativo'); }
    setUsuario(usr);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextData {
  return useContext(AuthContext);
}
