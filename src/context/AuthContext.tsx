import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiClient, TOKEN_KEY } from '../services/apiClient'
import type { AuthUser, LoginResponse } from '../types/wms'

interface AuthContextData {
  usuario: AuthUser | null
  carregando: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<AuthUser | null>(null)
  const [carregando, setCarregando] = useState(true)

  // On mount, check for existing token
  useEffect(() => {
    ;(async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY)
        if (token) {
          // Validate token by fetching user info
          const { data } = await apiClient.get('/auth/me')
          setUsuario(data.usuario || data)
        }
      } catch {
        // Token invalid or expired
        await AsyncStorage.removeItem(TOKEN_KEY)
        setUsuario(null)
      } finally {
        setCarregando(false)
      }
    })()
  }, [])

  const login = useCallback(async (email: string, senha: string) => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, senha })
    await AsyncStorage.setItem(TOKEN_KEY, data.token)
    setUsuario(data.usuario)
  }, [])

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY)
    setUsuario(null)
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
