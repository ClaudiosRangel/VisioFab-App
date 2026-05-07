import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import { BASE_URL_KEY, DEFAULT_BASE_URL, apiClient } from '../services/apiClient'
import OperationHeader from '../components/OperationHeader'
import { useAuth } from '../context/AuthContext'

export default function SettingsScreen() {
  const nav = useNavigation()
  const { usuario } = useAuth()
  const [url, setUrl] = useState(DEFAULT_BASE_URL)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(BASE_URL_KEY).then((v) => { if (v) setUrl(v) })
  }, [])

  async function salvar() {
    await AsyncStorage.setItem(BASE_URL_KEY, url.trim())
    Alert.alert('Salvo', 'URL da API atualizada com sucesso.')
  }

  async function alterarSenha() {
    if (!senhaAtual || !novaSenha) { Alert.alert('Erro', 'Preencha todos os campos'); return }
    if (novaSenha.length < 6) { Alert.alert('Erro', 'Nova senha deve ter pelo menos 6 caracteres'); return }
    if (novaSenha !== confirmarSenha) { Alert.alert('Erro', 'As senhas não conferem'); return }
    setSalvandoSenha(true)
    try {
      await apiClient.put(`/usuarios/${usuario?.id}`, { senha: novaSenha })
      Alert.alert('Sucesso', 'Senha alterada com sucesso!')
      setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('')
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.message || 'Falha ao alterar senha')
    } finally {
      setSalvandoSenha(false)
    }
  }

  return (
    <View style={s.container}>
      <OperationHeader title="Configurações" onBack={() => nav.goBack()} />
      <View style={s.content}>
        {/* Alterar Senha */}
        <Text style={s.sectionTitle}>🔒 Alterar Senha</Text>
        <TextInput style={s.input} placeholder="Senha atual" secureTextEntry value={senhaAtual} onChangeText={setSenhaAtual} />
        <TextInput style={[s.input, { marginTop: 8 }]} placeholder="Nova senha (mín. 6 caracteres)" secureTextEntry value={novaSenha} onChangeText={setNovaSenha} />
        <TextInput style={[s.input, { marginTop: 8 }]} placeholder="Confirmar nova senha" secureTextEntry value={confirmarSenha} onChangeText={setConfirmarSenha} />
        <TouchableOpacity style={s.btn} onPress={alterarSenha} disabled={salvandoSenha}>
          <Text style={s.btnText}>{salvandoSenha ? 'Salvando...' : 'Alterar Senha'}</Text>
        </TouchableOpacity>

        <View style={s.divider} />

        {/* URL da API */}
        <Text style={s.sectionTitle}>⚙️ URL da API</Text>
        <TextInput style={s.input} value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} placeholder="http://192.168.x.x:3333/api" />
        <Text style={s.hint}>Padrão: {DEFAULT_BASE_URL}</Text>
        <TouchableOpacity style={[s.btn, { backgroundColor: '#666' }]} onPress={salvar}>
          <Text style={s.btnText}>Salvar URL</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5FA' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12, marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#fff' },
  hint: { fontSize: 12, color: '#999', marginTop: 4 },
  btn: { backgroundColor: '#14477E', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 24 },
})
