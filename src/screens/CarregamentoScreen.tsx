import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { apiClient } from '../services/apiClient'
import { useFeedback } from '../context/FeedbackContext'
import OperationHeader from '../components/OperationHeader'
import BarcodeScanner from '../components/BarcodeScanner'
import ProgressBar from '../components/ProgressBar'
import type { MainStackParamList, Carregamento, CarregarScannerResponse } from '../types/wms'

type Nav = NativeStackNavigationProp<MainStackParamList>
type Route = RouteProp<MainStackParamList, 'Carregamento'>

export default function CarregamentoScreen() {
  const nav = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const { showFeedback } = useFeedback()

  const [loading, setLoading] = useState(true)
  const [carregamento, setCarregamento] = useState<Carregamento | null>(null)
  const [concluido, setConcluido] = useState(false)
  const [lastResult, setLastResult] = useState<CarregarScannerResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchCarregamento = useCallback(async () => {
    try {
      const { data } = await apiClient.get<Carregamento>(`/carregamentos/${params.carregamentoId}`)
      setCarregamento(data)
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erro ao carregar dados do carregamento'
      Alert.alert('Erro', msg)
      showFeedback('error')
    } finally {
      setLoading(false)
    }
  }, [params.carregamentoId, showFeedback])

  useEffect(() => { fetchCarregamento() }, [fetchCarregamento])

  async function handleScan(code: string) {
    setSubmitting(true)
    try {
      const { data } = await apiClient.post<CarregarScannerResponse>(
        `/carregamentos/${params.carregamentoId}/carregar-scanner`,
        { barcodeVolume: code },
      )
      setLastResult(data)

      // Update local progress
      if (carregamento) {
        setCarregamento({
          ...carregamento,
          volumesCarregados: data.progresso.volumesCarregados,
          totalVolumes: data.progresso.totalVolumes,
        })
      }

      // Handle warnings
      if (data.avisoSequencia) {
        Alert.alert('Aviso de Sequência', data.avisoSequencia)
        showFeedback('warning')
      } else {
        showFeedback('success')
      }

      // Check if complete
      if (data.carregamentoConcluido) {
        setConcluido(true)
        showFeedback('success')
      }
    } catch (e: any) {
      const status = e?.response?.status
      const msg = e?.response?.data?.message || 'Erro ao carregar volume'
      const errorCode = e?.response?.data?.code

      if (errorCode === 'ALREADY_LOADED' || msg.toLowerCase().includes('já carregado')) {
        Alert.alert('Atenção', msg)
        showFeedback('warning')
      } else if (errorCode === 'WRONG_CARREGAMENTO' || msg.toLowerCase().includes('carregamento')) {
        Alert.alert('Erro', msg)
        showFeedback('error')
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
        <OperationHeader title="Carregamento" onBack={() => nav.goBack()} />
        <View style={s.center}>
          <ActivityIndicator size="large" color="#14477E" />
          <Text style={s.loadingText}>Carregando...</Text>
        </View>
      </View>
    )
  }

  if (concluido) {
    return (
      <View style={s.container}>
        <OperationHeader title="Carregamento" onBack={() => nav.goBack()} />
        <View style={s.center}>
          <Text style={s.completeIcon}>🚛✅</Text>
          <Text style={s.completeTitle}>Carregamento Concluído!</Text>
          <Text style={s.completeSubtitle}>
            Todos os volumes foram carregados com sucesso.
          </Text>
          {carregamento && (
            <Text style={s.completePlate}>Veículo: {carregamento.veiculoPlaca}</Text>
          )}
        </View>
      </View>
    )
  }

  const volumesCarregados = carregamento?.volumesCarregados || 0
  const totalVolumes = carregamento?.totalVolumes || 0

  return (
    <View style={s.container}>
      <OperationHeader
        title="Carregamento"
        subtitle={carregamento ? `Placa: ${carregamento.veiculoPlaca}` : undefined}
        onBack={() => nav.goBack()}
      />
      <ScrollView style={s.content} keyboardShouldPersistTaps="handled">
        <ProgressBar current={volumesCarregados} total={totalVolumes} label="Volumes carregados" />

        {/* Vehicle info */}
        {carregamento && (
          <View style={s.infoCard}>
            <Text style={s.infoTitle}>🚛 {carregamento.veiculoPlaca}</Text>
            <Text style={s.infoStatus}>Status: {carregamento.status}</Text>
            <Text style={s.infoDetail}>
              {volumesCarregados} de {totalVolumes} volumes carregados
            </Text>
          </View>
        )}

        {/* Last result */}
        {lastResult && (
          <View style={s.resultCard}>
            <Text style={s.resultTitle}>✅ Volume #{lastResult.volumeCodigo} carregado</Text>
            {lastResult.avisoSequencia && (
              <Text style={s.resultWarning}>⚠️ {lastResult.avisoSequencia}</Text>
            )}
          </View>
        )}

        {/* Scanner */}
        <View style={s.scanSection}>
          <Text style={s.instruction}>Escanear código de barras do volume</Text>
          <BarcodeScanner
            onScan={handleScan}
            enabled={!submitting}
            placeholder="Escanear volume..."
          />
          {submitting && (
            <View style={s.submittingRow}>
              <ActivityIndicator size="small" color="#14477E" />
              <Text style={s.submittingText}>Processando...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5FA' },
  content: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  completeIcon: { fontSize: 64, marginBottom: 16 },
  completeTitle: { fontSize: 22, fontWeight: '700', color: '#28C76F', marginBottom: 8 },
  completeSubtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
  completePlate: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 12 },
  infoCard: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#00CFE8', elevation: 1 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  infoStatus: { fontSize: 13, color: '#555', marginTop: 4 },
  infoDetail: { fontSize: 12, color: '#888', marginTop: 2 },
  resultCard: { backgroundColor: '#E8F8EF', borderRadius: 10, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#28C76F' },
  resultTitle: { fontSize: 15, fontWeight: '700', color: '#28C76F' },
  resultWarning: { fontSize: 13, color: '#FF9F43', marginTop: 4 },
  scanSection: { marginTop: 8 },
  instruction: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  submittingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 8 },
  submittingText: { fontSize: 14, color: '#666' },
})
