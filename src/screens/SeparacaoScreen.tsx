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
import type {
  MainStackParamList,
  ItemSeparacao,
  MotivoDivergencia,
  ConfirmarScannerResponse,
} from '../types/wms'

type Nav = NativeStackNavigationProp<MainStackParamList>
type Route = RouteProp<MainStackParamList, 'Separacao'>

const MOTIVOS: { value: MotivoDivergencia; label: string }[] = [
  { value: 'PRODUTO_NAO_ENCONTRADO', label: 'Produto não encontrado' },
  { value: 'QUANTIDADE_INSUFICIENTE', label: 'Quantidade insuficiente' },
  { value: 'AVARIA', label: 'Avaria' },
]

export default function SeparacaoScreen() {
  const nav = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const { showFeedback } = useFeedback()

  const [loading, setLoading] = useState(true)
  const [itens, setItens] = useState<ItemSeparacao[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [quantidade, setQuantidade] = useState(0)
  const [scannedCode, setScannedCode] = useState('')
  const [showQtyInput, setShowQtyInput] = useState(false)
  const [showMotivo, setShowMotivo] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchOnda = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/ondas-separacao/${params.ondaSeparacaoId}`)
      // Flatten items from all ordens
      const allItens: ItemSeparacao[] = []
      const ordens = data.ordens || data.data?.ordens || []
      for (const ordem of ordens) {
        const items = ordem.itens || []
        allItens.push(...items)
      }
      setItens(allItens)
      // Find first pending item
      const pendingIdx = allItens.findIndex((i) => i.status === 'PENDENTE')
      if (pendingIdx >= 0) setCurrentIndex(pendingIdx)
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erro ao carregar onda de separação'
      Alert.alert('Erro', msg)
      showFeedback('error')
    } finally {
      setLoading(false)
    }
  }, [params.ondaSeparacaoId, showFeedback])

  useEffect(() => { fetchOnda() }, [fetchOnda])

  const currentItem = itens[currentIndex] || null
  const separados = itens.filter((i) => i.status !== 'PENDENTE').length

  function handleScan(code: string) {
    if (!currentItem) return
    // Store scanned code and show quantity input
    setScannedCode(code)
    setQuantidade(currentItem.quantidadeSolicitada)
    setShowQtyInput(true)
    setShowMotivo(false)
  }

  async function handleConfirmar(motivo?: MotivoDivergencia) {
    if (!currentItem) return
    setSubmitting(true)
    try {
      const payload: any = {
        barcodeEscaneado: scannedCode || currentItem.produto?.codigo || '',
        quantidadeSeparada: quantidade,
      }
      if (motivo) payload.motivoDivergencia = motivo

      const { data } = await apiClient.post<ConfirmarScannerResponse>(
        `/itens-separacao/${currentItem.id}/confirmar-scanner`,
        payload,
      )

      showFeedback('success')
      setShowQtyInput(false)
      setShowMotivo(false)

      // Update local state
      setItens((prev) =>
        prev.map((item) =>
          item.id === currentItem.id
            ? { ...item, quantidadeSeparada: data.quantidadeSeparada, status: data.status as ItemSeparacao['status'] }
            : item,
        ),
      )

      // Check if wave is complete
      if (data.ordemSeparacao?.ondaConcluida) {
        Alert.alert('Concluído', 'Onda de separação finalizada!', [
          { text: 'OK', onPress: () => nav.goBack() },
        ])
        return
      }

      // Move to next pending item
      const nextIdx = itens.findIndex((i, idx) => idx > currentIndex && i.status === 'PENDENTE')
      if (nextIdx >= 0) {
        setCurrentIndex(nextIdx)
      } else {
        const firstPending = itens.findIndex((i) => i.status === 'PENDENTE')
        if (firstPending >= 0) setCurrentIndex(firstPending)
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erro ao confirmar separação'
      Alert.alert('Erro', msg)
      showFeedback('error')
    } finally {
      setSubmitting(false)
    }
  }

  function handleQuantityCheck() {
    if (!currentItem) return
    if (quantidade < currentItem.quantidadeSolicitada) {
      setShowMotivo(true)
    } else {
      handleConfirmar()
    }
  }

  if (loading) {
    return (
      <View style={s.container}>
        <OperationHeader title="Separação" onBack={() => nav.goBack()} />
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
        title="Separação (Picking)"
        subtitle={`Onda: ${params.ondaSeparacaoId.slice(0, 8)}...`}
        onBack={() => nav.goBack()}
      />
      <ScrollView style={s.content} keyboardShouldPersistTaps="handled">
        <ProgressBar current={separados} total={itens.length} label="Itens separados" />

        {/* Pick list */}
        <Text style={s.sectionTitle}>Lista de Separação</Text>
        {itens.map((item, idx) => (
          <View
            key={item.id}
            style={[
              s.pickCard,
              idx === currentIndex && s.pickCardCurrent,
              item.status !== 'PENDENTE' && s.pickCardDone,
            ]}
          >
            <View style={s.pickRow}>
              <View style={s.pickInfo}>
                <Text style={s.pickProduct}>{item.produto?.nome || 'Produto'}</Text>
                <Text style={s.pickAddress}>📍 {item.enderecoOrigem?.enderecoCompleto || '—'}</Text>
                <Text style={s.pickQty}>
                  Qtd: {item.quantidadeSeparada}/{item.quantidadeSolicitada} {item.produto?.unidade || ''}
                </Text>
              </View>
              <View style={[s.pickStatus, item.status === 'PENDENTE' ? s.statusPendente : s.statusSeparado]}>
                <Text style={s.pickStatusText}>
                  {item.status === 'PENDENTE' ? '⏳' : '✅'}
                </Text>
              </View>
            </View>
            {idx === currentIndex && <View style={s.currentIndicator}><Text style={s.currentText}>▶ ATUAL</Text></View>}
          </View>
        ))}

        {/* Scanner for current item */}
        {currentItem && currentItem.status === 'PENDENTE' && !showQtyInput && (
          <View style={s.scanSection}>
            <Text style={s.instruction}>
              Escanear: {currentItem.produto?.nome || 'produto'}
            </Text>
            <BarcodeScanner onScan={handleScan} placeholder="Escanear produto..." />
          </View>
        )}

        {/* Quantity input */}
        {showQtyInput && currentItem && (
          <View style={s.qtySection}>
            <QuantityInput
              value={quantidade}
              onChange={setQuantidade}
              label={`Quantidade (solicitada: ${currentItem.quantidadeSolicitada})`}
              min={0}
              max={currentItem.quantidadeSolicitada}
            />
            {showMotivo ? (
              <View>
                <Text style={s.motivoTitle}>Motivo da divergência:</Text>
                {MOTIVOS.map((m) => (
                  <TouchableOpacity
                    key={m.value}
                    style={s.motivoBtn}
                    onPress={() => handleConfirmar(m.value)}
                    disabled={submitting}
                  >
                    <Text style={s.motivoBtnText}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={s.btnRow}>
                <TouchableOpacity style={s.btnCancel} onPress={() => setShowQtyInput(false)}>
                  <Text style={s.btnCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnConfirm} onPress={handleQuantityCheck} disabled={submitting}>
                  <Text style={s.btnConfirmText}>{submitting ? 'Enviando...' : 'Confirmar'}</Text>
                </TouchableOpacity>
              </View>
            )}
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
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8 },
  pickCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 6, elevation: 1, borderLeftWidth: 3, borderLeftColor: '#ddd' },
  pickCardCurrent: { borderLeftColor: '#FF9F43', backgroundColor: '#FFF9F0' },
  pickCardDone: { borderLeftColor: '#28C76F', opacity: 0.7 },
  pickRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickInfo: { flex: 1 },
  pickProduct: { fontSize: 14, fontWeight: '600', color: '#333' },
  pickAddress: { fontSize: 12, color: '#888', marginTop: 2 },
  pickQty: { fontSize: 12, color: '#555', marginTop: 2 },
  pickStatus: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  statusPendente: { backgroundColor: '#FFF5E6' },
  statusSeparado: { backgroundColor: '#E8F8EF' },
  pickStatusText: { fontSize: 16 },
  currentIndicator: { marginTop: 6 },
  currentText: { fontSize: 11, fontWeight: '700', color: '#FF9F43' },
  scanSection: { marginTop: 16 },
  instruction: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  qtySection: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginTop: 12, elevation: 1 },
  motivoTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginTop: 12, marginBottom: 8 },
  motivoBtn: { backgroundColor: '#FFF5E6', borderRadius: 8, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: '#FF9F43' },
  motivoBtnText: { color: '#FF9F43', fontWeight: '600', textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancel: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  btnCancelText: { color: '#666', fontWeight: '600' },
  btnConfirm: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#14477E', alignItems: 'center' },
  btnConfirmText: { color: '#fff', fontWeight: '600' },
})
