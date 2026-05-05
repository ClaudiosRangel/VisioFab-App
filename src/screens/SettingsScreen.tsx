import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import { BASE_URL_KEY, DEFAULT_BASE_URL } from '../services/apiClient'
import OperationHeader from '../components/OperationHeader'

export default function SettingsScreen() {
  const nav = useNavigation()
  const [url, setUrl] = useState(DEFAULT_BASE_URL)

  useEffect(() => {
    AsyncStorage.getItem(BASE_URL_KEY).then((v) => { if (v) setUrl(v) })
  }, [])

  async function salvar() {
    await AsyncStorage.setItem(BASE_URL_KEY, url.trim())
    Alert.alert('Salvo', 'URL da API atualizada com sucesso.')
  }

  return (
    <View style={s.container}>
      <OperationHeader title="Configurações" onBack={() => nav.goBack()} />
      <View style={s.content}>
        <Text style={s.label}>URL da API</Text>
        <TextInput style={s.input} value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} placeholder="http://192.168.x.x:3333/api" />
        <Text style={s.hint}>Padrão: {DEFAULT_BASE_URL}</Text>
        <TouchableOpacity style={s.btn} onPress={salvar}>
          <Text style={s.btnText}>Salvar</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5FA' },
  content: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#fff' },
  hint: { fontSize: 12, color: '#999', marginTop: 4 },
  btn: { backgroundColor: '#14477E', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
