import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { apiClient } from '../services/apiClient'
import { useFeedback } from '../context/FeedbackContext'
import OperationHeader from '../components/OperationHeader'
import BarcodeScanner from '../components/BarcodeScanner'
import ProgressBar from '../components/ProgressBar'
import QuantityInput from '../components/QuantityInput'
import type { MainStackParamList, ConferirSaidaScannerResponse } from '../types/wms'

type Nav = NativeStackNavigationProp<MainStackParamList>
type Route = RouteProp<MainStackParamList, 'ConferenciaSaida'>

interface ItemConferenciaSaida {
  id: string
  produtoId: string
  produto?: { codigo: string; nome: string; unidade: string } | null
  quantidadeEsperada: number
  quantidadeConferida: number
  status: 'PENDENTE' | 'CONFORME' | 'DIVERGENTE'
}

interface ConferenciaSaidaData {
  id: string
  status: string
  itens: ItemConferenciaSaida[]
}

export default function ConferenciaSaidaScreen() {
  const nav = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const { showFeedback } = useFeedback()

  const [loading, setLoading] = useState(true)
  const [conferencia, setConferencia] = useState<ConferenciaSaidaData | null>(null)
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [matchedItem, setMatchedItem] = useState<ItemConferenciaSaida | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [resultado, setResultado] = useState<ConferirSaidaScannerResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchConferencia = useCallback(async () => {
    try {
      const { data } = await apiClient.get<ConferenciaSaidaData>(
        `/conferencias-saida/${params.conferenciaSaidaId}`,
      )
      setConferencia(data)
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erro ao carregar conferência de saída'
      Alert.alert('Erro', msg)
      showFeedback('error')
    } finally {
      setLoading(false)
    }
  }, [params.conferenciaSaidaId, showFeedback])

  useEffect(() => { fetchConferencia() }, [fetchConferencia])

  function handleScan(code: string) {
    if (!conferencia) return
    // Find matching item by product code
    const item = conferencia.itens.find(
      (i) => i.produto?.codigo === code || i.produtoId === code,
    )
    if (item) {
      setScannedCode(code)
      setMatchedItem(item)
      setQuantidade(item.quantidadeEsperada - item.quantidadeConferida)
      setResultado(null)
    } else {
      Alert.alert('Produto não encontrado', 'O código escaneado não corresponde a nenhum item desta conferência.')
      showFeedback('warning')
    }
  }

  async function handleConfirmar() {
    if (!matchedItem) return
    setSubmitting(true)
    try {
      const { data } = await apiClient.patch<ConferirSaidaScannerResponse>(
        `/conferencias-saida/${params.conferenciaSaidaId}/itens/${matchedItem.id}`,
        { quantidadeConferida: quantidade },
      )
      setResultado(data)

      if (data.resultado === 'CONFORME') {
        showFeedback('success')
      } else {
        showFeedback('warning')
      }

      // Update local state
      setConferencia((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          itens: prev.itens.map((i) =>
            i.id === matchedItem.id
              ? { ...i, quantidadeConferida: quantidade, status: data.resultado }
              : i,
          ),
        }
      })

      setScannedCode(null)
      setMatchedItem(null)

      // Check if conference is complete
      if (data.conferenciaFinalizada) {
        Alert.alert('Concluído', 'Conferência de saída finalizada!', [
          { text: 'OK', onPress: () => nav.goBack() },
        ])
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erro ao conferir item'
      Alert.alert('Erro', msg)
      showFeedback('error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={s.container}>
        <OperationHeader title="Conferência de Saída" onBack={() => nav.goBack()} />
        <View style={s.center}>
          <ActivityIndicator size="large" color="#14477E" />
          <Text style={s.loadingText}>Carregando...</Text>
        </View>
      </View>
    )
  }

  const itens = conferencia?.itens || []
  const conferidos = itens.filter((i) => i.status !== 'PENDENTE').length

  return (
    <View style={s.container}>
      <OperationHeader
        title="Conferência de Saída"
        subtitle={`${conferidos} de ${itens.length} itens conferidos`}
        onBack={() => nav.goBack()}
      />
      <ScrollView style={s.content} keyboardShouldPersistTaps="handled">
        <ProgressBar current={conferidos} total={itens.length} label="Itens conferidos" />

        {/* Last result */}
        {resultado && (
          <View style={[s.resultCard, resultado.resultado === 'CONFORME' ? s.resultConforme : s.resultDivergente]}>
            <View style={[s.statusBadge, resultado.resultado === 'CONFORME' ? s.badgeConforme : s.badgeDivergente]}>
              <Text style={s.statusText}>{resultado.resultado}</Text>
            </View>
            {resultado.tipoDivergencia && (
              <Text style={s.divergenciaText}>Tipo: {resultado.tipoDivergencia}</Text>
            )}
          </View>
        )}

        {/* Scan + quantity input */}
        {matchedItem ? (
          <View style={s.scanResult}>
            <Text style={s.scanLabel}>Produto:</Text>
            <Text style={s.scanProduct}>{matchedItem.produto?.nome || matchedItem.produtoId}</Text>
            <Text style={s.scanInfo}>
              Esperado: {matchedItem.quantidadeEsperada} | Já conferido: {matchedItem.quantidadeConferida}
            </Text>
            <QuantityInput
              value={quantidade}
              onChange={setQuantidade}
              label="Quantidade conferida"
              min={0}
            />
            <View style={s.btnRow}>
              <TouchableOpacity style={s.btnCancel} onPress={() => { setMatchedItem(null); setScannedCode(null) }}>
                <Text style={s.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnConfirm} onPress={handleConfirmar} disabled={submitting}>
                <Text style={s.btnConfirmText}>{submitting ? 'Enviando...' : 'Confirmar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <BarcodeScanner onScan={handleScan} placeholder="Escanear produto..." />
        )}

        {/* Items list */}
        <Text style={s.sectionTitle}>Itens ({itens.length})</Text>
        {itens.map((item) => (
          <View key={item.id} style={[s.itemCard, item.status !== 'PENDENTE' && s.itemDone]}>
            <View style={s.itemRow}>
              <View style={s.itemInfo}>
                <Text style={s.itemName}>{item.produto?.nome || 'Produto'}</Text>
                <Text style={s.itemQty}>
                  {item.quantidadeConferida}/{item.quantidadeEsperada} {item.produto?.unidade || ''}
                </Text>
              </View>
              <View style={[
                s.itemBadge,
                item.status === 'CONFORME' ? s.badgeConforme :
                item.status === 'DIVERGENTE' ? s.badgeDivergente :
                s.badgePendente,
              ]}>
                <Text style={s.itemBadgeText}>
                  {item.status === 'PENDENTE' ? '⏳' : item.status === 'CONFORME' ? '✅' : '⚠️'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5FA' },
  content: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  resultCard: { borderRadius: 10, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
  resultConforme: { backgroundColor: '#E8F8EF', borderLeftColor: '#28C76F' },
  resultDivergente: { backgroundColor: '#FFF5E6', borderLeftColor: '#FF9F43' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeConforme: { backgroundColor: '#28C76F' },
  badgeDivergente: { backgroundColor: '#FF9F43' },
  badgePendente: { backgroundColor: '#E8E8E8' },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  divergenciaText: { fontSize: 13, color: '#FF9F43', marginTop: 6 },
  scanResult: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, elevation: 1 },
  scanLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  scanProduct: { fontSize: 16, fontWeight: '700', color: '#14477E', marginBottom: 4 },
  scanInfo: { fontSize: 13, color: '#555', marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancel: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  btnCancelText: { color: '#666', fontWeight: '600' },
  btnConfirm: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#14477E', alignItems: 'center' },
  btnConfirmText: { color: '#fff', fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginTop: 8, marginBottom: 8 },
  itemCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 6, elevation: 1 },
  itemDone: { opacity: 0.7 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#333' },
  itemQty: { fontSize: 12, color: '#555', marginTop: 2 },
  itemBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  itemBadgeText: { fontSize: 14 },
})
