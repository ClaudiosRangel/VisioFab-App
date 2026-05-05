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
import type { MainStackParamList, ItemVolume } from '../types/wms'

type Nav = NativeStackNavigationProp<MainStackParamList>
type Route = RouteProp<MainStackParamList, 'Embalagem'>

interface VolumeInfo {
  id: string
  codigo: number
  status: string
  itens: ItemVolume[]
  totalItens: number
  itensEmbalados: number
}

export default function EmbalagemScreen() {
  const nav = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const { showFeedback } = useFeedback()

  const [loading, setLoading] = useState(true)
  const [volume, setVolume] = useState<VolumeInfo | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [showQtyInput, setShowQtyInput] = useState(false)
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchVolume = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/volumes/${params.volumeId}`)
      setVolume(data)
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erro ao carregar volume'
      Alert.alert('Erro', msg)
      showFeedback('error')
    } finally {
      setLoading(false)
    }
  }, [params.volumeId, showFeedback])

  useEffect(() => { fetchVolume() }, [fetchVolume])

  function handleScan(code: string) {
    setScannedCode(code)
    setQuantidade(1)
    setShowQtyInput(true)
  }

  async function handleConfirmar() {
    if (!scannedCode) return
    setSubmitting(true)
    try {
      const { data } = await apiClient.post(`/volumes/${params.volumeId}/embalar-scanner`, {
        barcodeEscaneado: scannedCode,
        quantidade,
      })
      showFeedback('success')
      setScannedCode(null)
      setShowQtyInput(false)
      // Refresh volume data
      fetchVolume()
    } catch (e: any) {
      const status = e?.response?.status
      const msg = e?.response?.data?.message || 'Erro ao embalar item'

      if (status === 422) {
        // Handle specific 422 errors: wrong wave or quantity overflow
        Alert.alert('Atenção', msg)
        showFeedback('warning')
      } else {
        Alert.alert('Erro', msg)
        showFeedback('error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={s.container}>
        <OperationHeader title="Embalagem" onBack={() => nav.goBack()} />
        <View style={s.center}>
          <ActivityIndicator size="large" color="#14477E" />
          <Text style={s.loadingText}>Carregando...</Text>
        </View>
      </View>
    )
  }

  const embalados = volume?.itensEmbalados || 0
  const total = volume?.totalItens || 0

  return (
    <View style={s.container}>
      <OperationHeader
        title="Embalagem"
        subtitle={volume ? `Volume #${volume.codigo}` : undefined}
        onBack={() => nav.goBack()}
      />
      <ScrollView style={s.content} keyboardShouldPersistTaps="handled">
        <ProgressBar current={embalados} total={total} label="Itens embalados" />

        {/* Volume info */}
        {volume && (
          <View style={s.infoCard}>
            <Text style={s.infoTitle}>📦 Volume #{volume.codigo}</Text>
            <Text style={s.infoStatus}>Status: {volume.status}</Text>
            <Text style={s.infoDetail}>Onda: {params.ondaSeparacaoId.slice(0, 8)}...</Text>
          </View>
        )}

        {/* Pending items */}
        {volume?.itens && volume.itens.length > 0 && (
          <View style={s.listSection}>
            <Text style={s.sectionTitle}>Itens pendentes</Text>
            {volume.itens.map((item) => (
              <View key={item.id} style={s.itemCard}>
                <Text style={s.itemText}>Item: {item.itemSeparacaoId.slice(0, 8)}...</Text>
                <Text style={s.itemQty}>Qtd: {item.quantidade}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Scanner */}
        {showQtyInput && scannedCode ? (
          <View style={s.scanResult}>
            <Text style={s.scanLabel}>Código escaneado:</Text>
            <Text style={s.scanCode}>{scannedCode}</Text>
            <QuantityInput value={quantidade} onChange={setQuantidade} label="Quantidade" min={1} />
            <View style={s.btnRow}>
              <TouchableOpacity style={s.btnCancel} onPress={() => { setShowQtyInput(false); setScannedCode(null) }}>
                <Text style={s.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnConfirm} onPress={handleConfirmar} disabled={submitting}>
                <Text style={s.btnConfirmText}>{submitting ? 'Enviando...' : 'Embalar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={s.scanSection}>
            <Text style={s.instruction}>Escanear produto para embalar</Text>
            <BarcodeScanner onScan={handleScan} placeholder="Escanear produto..." />
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
  infoCard: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#7367F0', elevation: 1 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  infoStatus: { fontSize: 13, color: '#555', marginTop: 4 },
  infoDetail: { fontSize: 12, color: '#888', marginTop: 2 },
  listSection: { marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8 },
  itemCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  itemText: { fontSize: 13, color: '#333' },
  itemQty: { fontSize: 13, fontWeight: '600', color: '#14477E' },
  scanSection: { marginTop: 8 },
  instruction: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  scanResult: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginTop: 8, elevation: 1 },
  scanLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  scanCode: { fontSize: 18, fontWeight: '700', color: '#14477E', marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancel: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  btnCancelText: { color: '#666', fontWeight: '600' },
  btnConfirm: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#7367F0', alignItems: 'center' },
  btnConfirmText: { color: '#fff', fontWeight: '600' },
})
