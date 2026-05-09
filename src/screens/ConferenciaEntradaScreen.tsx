import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { apiClient } from '../services/apiClient'
import { useFeedback } from '../context/FeedbackContext'
import OperationHeader from '../components/OperationHeader'
import BarcodeScanner from '../components/BarcodeScanner'
import ProgressBar from '../components/ProgressBar'
import QuantityInput from '../components/QuantityInput'
import type {
  MainStackParamList,
  ItemNotaEntrada,
  IniciarConferenciaResponse,
  ConferirBarrasResponse,
} from '../types/wms'

type Nav = NativeStackNavigationProp<MainStackParamList>
type Route = RouteProp<MainStackParamList, 'ConferenciaEntrada'>

export default function ConferenciaEntradaScreen() {
  const nav = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const { showFeedback } = useFeedback()

  const [loading, setLoading] = useState(true)
  const [itens, setItens] = useState<ItemNotaEntrada[]>([])
  const [notaInfo, setNotaInfo] = useState<IniciarConferenciaResponse['nota'] | null>(null)
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [lote, setLote] = useState('')
  const [validade, setValidade] = useState('')
  const [resultado, setResultado] = useState<ConferirBarrasResponse | null>(null)
  const [conferidos, setConferidos] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const iniciar = useCallback(async () => {
    try {
      const { data } = await apiClient.post<IniciarConferenciaResponse>(
        `/conferencia-entrada/iniciar/${params.notaId}`,
      )
      setNotaInfo(data.nota)
      setItens(data.itens)
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erro ao iniciar conferência'
      Alert.alert('Erro', msg)
      showFeedback('error')
    } finally {
      setLoading(false)
    }
  }, [params.notaId, showFeedback])

  useEffect(() => { iniciar() }, [iniciar])

  function handleScan(code: string) {
    setScannedCode(code)
    setQuantidade(1)
    setLote('')
    setValidade('')
    setResultado(null)
  }

  async function handleConfirmar() {
    if (!scannedCode) return
    setSubmitting(true)
    try {
      const payload: any = { codigoProduto: scannedCode, quantidade }
      if (lote.trim()) payload.lote = lote.trim()
      if (validade.trim()) payload.validade = validade.trim()

      const { data } = await apiClient.post<ConferirBarrasResponse>(
        `/conferencia-entrada/conferir-por-barras/${params.notaId}`,
        payload,
      )
      setResultado(data)
      const newConferidos = conferidos + 1
      setConferidos(newConferidos)

      if (data.status === 'CONFORME') {
        showFeedback('success')
      } else {
        showFeedback('warning')
      }

      setScannedCode(null)
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erro ao conferir item'
      Alert.alert('Erro', msg)
      showFeedback('error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleFinalizar() {
    setSubmitting(true)
    try {
      await apiClient.post(`/conferencia-entrada/confirmar/${params.notaId}`, {
        acaoDivergencia: 'APROVAR',
      })
      showFeedback('success')
      Alert.alert(
        'Conferência Finalizada',
        'Conferência aprovada com sucesso. OS de endereçamento criada.',
        [{ text: 'OK', onPress: () => nav.goBack() }],
      )
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erro ao finalizar conferência'
      Alert.alert('Erro', msg)
      showFeedback('error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={s.container}>
        <OperationHeader title="Conferência de Entrada" onBack={() => nav.goBack()} />
        <View style={s.center}>
          <ActivityIndicator size="large" color="#14477E" />
          <Text style={s.loadingText}>Carregando...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <OperationHeader
        title="Conferência de Entrada"
        subtitle={notaInfo ? `NF ${notaInfo.numero} — ${notaInfo.fornecedor || '—'}` : undefined}
        onBack={() => nav.goBack()}
      />
      <ScrollView style={s.content} keyboardShouldPersistTaps="handled">
        <ProgressBar current={conferidos} total={itens.length} label="Itens conferidos" />

        {resultado && (
          <View style={[s.resultCard, resultado.status === 'CONFORME' ? s.resultConforme : s.resultDivergente]}>
            <Text style={s.resultTitle}>{resultado.descricao}</Text>
            <Text style={s.resultQty}>
              Conferido: {resultado.quantidadeConferida} / Nota: {resultado.quantidadeNota}
            </Text>
            <View style={[s.statusBadge, resultado.status === 'CONFORME' ? s.badgeConforme : s.badgeDivergente]}>
              <Text style={s.statusText}>{resultado.status}</Text>
            </View>
          </View>
        )}

        {scannedCode ? (
          <View style={s.scanResult}>
            <Text style={s.scanLabel}>Código escaneado:</Text>
            <Text style={s.scanCode}>{scannedCode}</Text>
            <QuantityInput value={quantidade} onChange={setQuantidade} label="Quantidade" min={1} />
            <Text style={s.fieldLabel}>Lote (opcional)</Text>
            <TextInput style={s.fieldInput} placeholder="Ex: L2024-001" value={lote} onChangeText={setLote} />
            <Text style={s.fieldLabel}>Validade (opcional)</Text>
            <TextInput style={s.fieldInput} placeholder="Ex: 2025-12-31" value={validade} onChangeText={setValidade} />
            <View style={s.btnRow}>
              <TouchableOpacity style={s.btnCancel} onPress={() => setScannedCode(null)}>
                <Text style={s.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnConfirm} onPress={handleConfirmar} disabled={submitting}>
                <Text style={s.btnConfirmText}>{submitting ? 'Enviando...' : 'Confirmar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : conferidos >= itens.length && itens.length > 0 ? (
          <View style={s.finalizarSection}>
            <Text style={s.finalizarTitle}>✅ Todos os itens foram conferidos!</Text>
            <TouchableOpacity style={s.btnFinalizar} onPress={handleFinalizar} disabled={submitting}>
              <Text style={s.btnFinalizarText}>{submitting ? 'Finalizando...' : 'Finalizar Conferência'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnScanMore} onPress={() => setScannedCode(null)}>
              <Text style={s.btnScanMoreText}>Conferir mais itens</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <BarcodeScanner onScan={handleScan} placeholder="Escanear produto..." />
        )}

        {itens.length > 0 && (
          <View style={s.listSection}>
            <Text style={s.sectionTitle}>Itens da Nota ({itens.length})</Text>
            {itens.map((item) => (
              <View key={item.id} style={s.itemCard}>
                <Text style={s.itemDesc}>{item.descricao}</Text>
                <Text style={s.itemInfo}>
                  Código: {item.codigoProduto || '—'} | Unidade: {item.unidade || '—'}
                </Text>
              </View>
            ))}
          </View>
        )}
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
  resultTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 4 },
  resultQty: { fontSize: 13, color: '#555' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 8 },
  badgeConforme: { backgroundColor: '#28C76F' },
  badgeDivergente: { backgroundColor: '#FF9F43' },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  scanResult: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, elevation: 1 },
  scanLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  scanCode: { fontSize: 18, fontWeight: '700', color: '#14477E', marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancel: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  btnCancelText: { color: '#666', fontWeight: '600' },
  btnConfirm: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#14477E', alignItems: 'center' },
  btnConfirmText: { color: '#fff', fontWeight: '600' },
  fieldLabel: { fontSize: 13, color: '#666', marginBottom: 4, marginTop: 8 },
  fieldInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 4 },
  listSection: { marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8 },
  itemCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 6, elevation: 1 },
  itemDesc: { fontSize: 14, fontWeight: '600', color: '#333' },
  itemInfo: { fontSize: 12, color: '#888', marginTop: 2 },
  finalizarSection: { backgroundColor: '#E8F8EF', borderRadius: 10, padding: 20, marginBottom: 12, alignItems: 'center' as const },
  finalizarTitle: { fontSize: 16, fontWeight: '700', color: '#28C76F', marginBottom: 16, textAlign: 'center' as const },
  btnFinalizar: { backgroundColor: '#28C76F', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, width: '100%' as any, alignItems: 'center' as const, marginBottom: 10 },
  btnFinalizarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnScanMore: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', width: '100%' as any, alignItems: 'center' as const },
  btnScanMoreText: { color: '#666', fontSize: 14, fontWeight: '600' },
})
