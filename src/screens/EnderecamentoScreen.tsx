import React, { useState } from 'react'
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
  ValidarLocalizacaoResponse,
  ValidarProdutoResponse,
  ConfirmarEnderecamentoResponse,
} from '../types/wms'

type Nav = NativeStackNavigationProp<MainStackParamList>
type Route = RouteProp<MainStackParamList, 'Enderecamento'>

type Step = 'location' | 'product' | 'quantity'

export default function EnderecamentoScreen() {
  const nav = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const { showFeedback } = useFeedback()

  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('location')
  const [endereco, setEndereco] = useState<{ id: string; enderecoCompleto: string } | null>(null)
  const [produto, setProduto] = useState<ValidarProdutoResponse['produtoEsperado'] | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [totalEnderecados, setTotalEnderecados] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [lastResult, setLastResult] = useState<ConfirmarEnderecamentoResponse | null>(null)

  async function handleScanLocation(code: string) {
    setLoading(true)
    try {
      const { data } = await apiClient.post<ValidarLocalizacaoResponse>(
        '/enderecamento-wms/buscar-endereco-barcode',
        { barcode: code, notaEntradaId: params.notaEntradaId },
      )
      if (data.valido && data.endereco) {
        setEndereco(data.endereco)
        setStep('product')
        showFeedback('success')
      } else {
        Alert.alert('Localização inválida', data.mensagem || 'Endereço não reconhecido')
        showFeedback('warning')
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erro ao validar localização'
      Alert.alert('Erro', msg)
      showFeedback('error')
    } finally {
      setLoading(false)
    }
  }

  async function handleScanProduct(code: string) {
    setLoading(true)
    try {
      const { data } = await apiClient.post<ValidarProdutoResponse>(
        '/enderecamento-wms/buscar-produto-barcode',
        { barcode: code, notaEntradaId: params.notaEntradaId },
      )
      if (data.valido && data.produtoEsperado) {
        setProduto(data.produtoEsperado)
        setQuantidade(1)
        setStep('quantity')
        showFeedback('success')
      } else {
        Alert.alert('Produto inválido', data.mensagem || 'Produto não reconhecido')
        showFeedback('warning')
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erro ao validar produto'
      Alert.alert('Erro', msg)
      showFeedback('error')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmar() {
    if (!endereco || !produto) return
    setSubmitting(true)
    try {
      const { data } = await apiClient.post<ConfirmarEnderecamentoResponse>(
        '/enderecamento-wms/confirmar-coletor',
        { produtoId: produto.id, enderecoId: endereco.id, quantidade, notaEntradaId: params.notaEntradaId },
      )
      setLastResult(data)
      setTotalEnderecados((prev) => prev + 1)
      showFeedback('success')
      // Reset for next item
      setProduto(null)
      setStep('product')
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erro ao confirmar endereçamento'
      Alert.alert('Erro', msg)
      showFeedback('error')
    } finally {
      setSubmitting(false)
    }
  }

  function resetFlow() {
    setEndereco(null)
    setProduto(null)
    setStep('location')
    setLastResult(null)
  }

  return (
    <View style={s.container}>
      <OperationHeader
        title="Endereçamento"
        subtitle={endereco ? `📍 ${endereco.enderecoCompleto}` : 'Escanear localização'}
        onBack={() => nav.goBack()}
      />
      <ScrollView style={s.content} keyboardShouldPersistTaps="handled">
        <ProgressBar current={totalEnderecados} total={totalEnderecados || 1} label="Itens endereçados" />

        {/* Step indicators */}
        <View style={s.steps}>
          <View style={[s.stepDot, step === 'location' && s.stepActive]}>
            <Text style={s.stepNum}>1</Text>
          </View>
          <View style={s.stepLine} />
          <View style={[s.stepDot, step === 'product' && s.stepActive]}>
            <Text style={s.stepNum}>2</Text>
          </View>
          <View style={s.stepLine} />
          <View style={[s.stepDot, step === 'quantity' && s.stepActive]}>
            <Text style={s.stepNum}>3</Text>
          </View>
        </View>
        <View style={s.stepLabels}>
          <Text style={s.stepLabel}>Localização</Text>
          <Text style={s.stepLabel}>Produto</Text>
          <Text style={s.stepLabel}>Quantidade</Text>
        </View>

        {loading && (
          <View style={s.loadingRow}>
            <ActivityIndicator size="small" color="#14477E" />
            <Text style={s.loadingText}>Validando...</Text>
          </View>
        )}

        {lastResult && (
          <View style={s.resultCard}>
            <Text style={s.resultTitle}>✅ Endereçado com sucesso</Text>
            <Text style={s.resultInfo}>{lastResult.produto} → {lastResult.enderecoCompleto}</Text>
            <Text style={s.resultInfo}>Quantidade: {lastResult.quantidade}</Text>
          </View>
        )}

        {step === 'location' && !loading && (
          <View>
            <Text style={s.instruction}>Escanear código de barras da localização</Text>
            <BarcodeScanner onScan={handleScanLocation} placeholder="Escanear endereço..." />
          </View>
        )}

        {step === 'product' && !loading && (
          <View>
            <View style={s.infoCard}>
              <Text style={s.infoLabel}>Endereço selecionado:</Text>
              <Text style={s.infoValue}>{endereco?.enderecoCompleto}</Text>
            </View>
            <Text style={s.instruction}>Escanear código de barras do produto</Text>
            <BarcodeScanner onScan={handleScanProduct} placeholder="Escanear produto..." />
          </View>
        )}

        {step === 'quantity' && !loading && (
          <View style={s.quantitySection}>
            <View style={s.infoCard}>
              <Text style={s.infoLabel}>Endereço:</Text>
              <Text style={s.infoValue}>{endereco?.enderecoCompleto}</Text>
              <Text style={s.infoLabel}>Produto:</Text>
              <Text style={s.infoValue}>{produto?.nome} ({produto?.codigo})</Text>
            </View>
            <QuantityInput value={quantidade} onChange={setQuantidade} label="Quantidade a endereçar" min={1} />
            <View style={s.btnRow}>
              <TouchableOpacity style={s.btnCancel} onPress={() => setStep('product')}>
                <Text style={s.btnCancelText}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnConfirm} onPress={handleConfirmar} disabled={submitting}>
                <Text style={s.btnConfirmText}>{submitting ? 'Enviando...' : 'Confirmar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity style={s.resetBtn} onPress={resetFlow}>
          <Text style={s.resetText}>🔄 Reiniciar fluxo</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5FA' },
  content: { flex: 1, padding: 16 },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  stepDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  stepActive: { backgroundColor: '#14477E' },
  stepNum: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stepLine: { width: 40, height: 2, backgroundColor: '#ddd' },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  stepLabel: { fontSize: 11, color: '#888' },
  instruction: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  loadingText: { fontSize: 14, color: '#666' },
  resultCard: { backgroundColor: '#E8F8EF', borderRadius: 10, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#28C76F' },
  resultTitle: { fontSize: 15, fontWeight: '700', color: '#28C76F', marginBottom: 4 },
  resultInfo: { fontSize: 13, color: '#555' },
  infoCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, elevation: 1 },
  infoLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#333' },
  quantitySection: { marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancel: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  btnCancelText: { color: '#666', fontWeight: '600' },
  btnConfirm: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#14477E', alignItems: 'center' },
  btnConfirmText: { color: '#fff', fontWeight: '600' },
  resetBtn: { alignItems: 'center', padding: 12, marginTop: 16, marginBottom: 32 },
  resetText: { color: '#14477E', fontSize: 14, fontWeight: '600' },
})
