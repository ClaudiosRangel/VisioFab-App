import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useFeedback } from '../context/FeedbackContext'
import LoadingOverlay from '../components/LoadingOverlay'

export default function LoginScreen() {
  const { login } = useAuth()
  const { showFeedback } = useFeedback()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function onSubmit() {
    if (!email.trim() || !senha.trim()) { setErro('Preencha email e senha'); return }
    setCarregando(true); setErro('')
    try {
      await login(email.trim(), senha)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erro ao fazer login'
      setErro(msg)
      showFeedback('error')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LoadingOverlay visible={carregando} message="Entrando..." />
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.logo}>📦</Text>
          <Text style={s.title}>VisioFab WMS</Text>
          <Text style={s.subtitle}>Coletor / App</Text>
        </View>
        <View style={s.card}>
          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <Text style={s.label}>Senha</Text>
          <TextInput style={s.input} placeholder="Sua senha" secureTextEntry value={senha} onChangeText={setSenha} />
          {erro ? <Text style={s.erro}>{erro}</Text> : null}
          <TouchableOpacity style={s.btn} onPress={onSubmit}>
            <Text style={s.btnText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F4F5FA' },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 48 },
  title: { fontSize: 28, fontWeight: '700', color: '#14477E', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#666' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 24, elevation: 2 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  erro: { color: '#FF4C51', fontSize: 13, marginTop: 8, textAlign: 'center' },
  btn: { backgroundColor: '#14477E', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
