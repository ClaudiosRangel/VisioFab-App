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
import type { MainStackParamList, Inventario, ItemInventario, ContarItemResponse } from '../types/wms'

type Nav = NativeStackNavigationProp<MainStackParamList>
type Route = RouteProp<MainStackParamList, 'Inventario'>

type Step = 'address' | 'product' | 'count'

export default function InventarioScreen() {
  const nav = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const { showFeedback } = useFeedback()

  const [loading, setLoading] = useState(true)
  const [inventario, setInventario] = useState<Inventario | null>(null)
  const [itens, setItens] = useState<ItemInventario[]>([])
  const [step, setStep] = useState<Step>('address')
  const [filteredAddress, setFilteredAddress] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<ItemInventario | null>(null)
  const [saldoContado, setSaldoContado] = useState(0)
  const [lastResult, setLastResult] = useState<ContarItemResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchInventario = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/inventarios/${params.inventarioId}`)
      setInventario(data.inventario || data)
      setItens(data.itens || [])
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erro ao carregar inventário'
      Alert.alert('Erro', msg)
      showFeedback('error')
    } finally {
      setLoading(false)
    }
  }, [params.inventarioId, showFeedback])

  useEffect(() => { fetchInventario() }, [fetchInventario])

  function handleScanAddress(code: string) {
    // Filter items by scanned address
    const matching = itens.filter(
      (i) => i.endereco?.enderecoCompleto === code || i.enderecoId === code,
    )
    if (matching.length > 0) {
      setFilteredAddress(code)
      setStep('product')
      showFeedback('success')
    } else {
      Alert.alert('Endereço não encontrado', 'Nenhum item do inventário neste endereço.')
      showFeedback('warning')
    }
  }

  function handleScanProduct(code: string) {
    // Find matching item at the filtered address
    const addressItens = itens.filter(
      (i) => i.endereco?.enderecoCompleto === filteredAddress || i.enderecoId === filteredAddress,
    )
    const item = addressItens.find(
      (i) => i.produto?.codigo === code || i.produtoId === code,
    )
    if (item) {
      setSelectedItem(item)
      setSaldoContado(item.saldoSistema)
      setStep('count')
      setLastResult(null)
    } else {
      Alert.alert('Produto não encontrado', 'O código escaneado não corresponde a nenhum item neste endereço.')
      showFeedback('warning')
    }
  }

  async function handleContar() {
    if (!selectedItem) return
    setSubmitting(true)
    try {
      const { data } = await apiClient.patch<ContarItemResponse>(
        `/inventarios/${params.inventarioId}/itens/${selectedItem.id}/contar`,
        { saldoContado },
      )
      setLastResult(data)

      if (data.status === 'CONFORME') {
        showFeedback('success')
      } else {
        showFeedback('warning')
      }

      // Update local state
      setItens((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id
            ? { ...i, saldoContado: data.saldoContado, divergencia: data.divergencia, status: data.status }
            : i,
        ),
      )

      setSelectedItem(null)
      setStep('product')
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erro ao registrar contagem'
      Alert.alert('Erro', msg)
      showFeedback('error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={s.container}>
        <OperationHeader title="Inventário" onBack={() => nav.goBack()} />
        <View style={s.center}>
          <ActivityIndicator size="large" color="#14477E" />
          <Text style={s.loadingText}>Carregando...</Text>
        </View>
      </View>
    )
  }

  const conformes = itens.filter((i) => i.status === 'CONFORME').length
  const divergentes = itens.filter((i) => i.status === 'DIVERGENTE').length
  const contados = conformes + divergentes

  // Items at current address
  const addressItens = filteredAddress
    ? itens.filter((i) => i.endereco?.enderecoCompleto === filteredAddress || i.enderecoId === filteredAddress)
    : []

  return (
    <View style={s.container}>
      <OperationHeader
        title="Inventário"
        subtitle={inventario ? `#${inventario.numero} — ${inventario.tipo}` : undefined}
        onBack={() => nav.goBack()}
      />
      <ScrollView style={s.content} keyboardShouldPersistTaps="handled">
        <ProgressBar current={contados} total={itens.length} label="Itens contados" />

        {/* Conformes / Divergentes counters */}
        <View style={s.counters}>
          <View style={[s.counterCard, s.counterConforme]}>
            <Text style={s.counterNum}>{conformes}</Text>
            <Text style={s.counterLabel}>Conformes</Text>
          </View>
          <View style={[s.counterCard, s.counterDivergente]}>
            <Text style={s.counterNum}>{divergentes}</Text>
            <Text style={s.counterLabel}>Divergentes</Text>
          </View>
        </View>

        {/* Last result */}
        {lastResult && (
          <View style={[s.resultCard, lastResult.status === 'CONFORME' ? s.resultConforme : s.resultDivergente]}>
            <View style={[s.statusBadge, lastResult.status === 'CONFORME' ? s.badgeConforme : s.badgeDivergente]}>
              <Text style={s.statusText}>{lastResult.status}</Text>
            </View>
            <Text style={s.resultInfo}>
              Sistema: {lastResult.saldoSistema} | Contado: {lastResult.saldoContado} | Divergência: {lastResult.divergencia}
            </Text>
          </View>
        )}

        {/* Step: Scan address */}
        {step === 'address' && (
          <View>
            <Text style={s.instruction}>Escanear código de barras do endereço</Text>
            <BarcodeScanner onScan={handleScanAddress} placeholder="Escanear endereço..." />
          </View>
        )}

        {/* Step: Scan product */}
        {step === 'product' && (
          <View>
            <View style={s.addressCard}>
              <Text style={s.addressLabel}>📍 Endereço selecionado:</Text>
              <Text style={s.addressValue}>{filteredAddress}</Text>
              <TouchableOpacity onPress={() => { setFilteredAddress(null); setStep('address') }}>
                <Text style={s.changeLink}>Trocar endereço</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.instruction}>Escanear código de barras do produto</Text>
            <BarcodeScanner onScan={handleScanProduct} placeholder="Escanear produto..." />

            {/* Items at this address */}
            {addressItens.length > 0 && (
              <View style={s.listSection}>
                <Text style={s.sectionTitle}>Itens neste endereço ({addressItens.length})</Text>
                {addressItens.map((item) => (
                  <View key={item.id} style={[s.itemCard, item.status !== 'PENDENTE' && s.itemDone]}>
                    <Text style={s.itemName}>{item.produto?.nome || 'Produto'}</Text>
                    <Text style={s.itemDetail}>
                      Código: {item.produto?.codigo || '—'} | Sistema: {item.saldoSistema}
                    </Text>
                    {item.status !== 'PENDENTE' && (
                      <View style={[s.itemBadge, item.status === 'CONFORME' ? s.badgeConforme : s.badgeDivergente]}>
                        <Text style={s.itemBadgeText}>{item.status}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Step: Count */}
        {step === 'count' && selectedItem && (
          <View style={s.countSection}>
            <View style={s.addressCard}>
              <Text style={s.addressLabel}>📍 {filteredAddress}</Text>
            </View>
            <View style={s.productCard}>
              <Text style={s.productName}>{selectedItem.produto?.nome || 'Produto'}</Text>
              <Text style={s.productCode}>Código: {selectedItem.produto?.codigo || '—'}</Text>
              <Text style={s.productSystem}>Saldo sistema: {selectedItem.saldoSistema}</Text>
            </View>
            <QuantityInput
              value={saldoContado}
              onChange={setSaldoContado}
              label="Saldo contado"
              min={0}
            />
            <View style={s.btnRow}>
              <TouchableOpacity style={s.btnCancel} onPress={() => { setSelectedItem(null); setStep('product') }}>
                <Text style={s.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnConfirm} onPress={handleContar} disabled={submitting}>
                <Text style={s.btnConfirmText}>{submitting ? 'Enviando...' : 'Registrar Contagem'}</Text>
              </TouchableOpacity>
            </View>
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
  counters: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  counterCard: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  counterConforme: { backgroundColor: '#E8F8EF' },
  counterDivergente: { backgroundColor: '#FFF5E6' },
  counterNum: { fontSize: 24, fontWeight: '800', color: '#333' },
  counterLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  resultCard: { borderRadius: 10, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
  resultConforme: { backgroundColor: '#E8F8EF', borderLeftColor: '#28C76F' },
  resultDivergente: { backgroundColor: '#FFF5E6', borderLeftColor: '#FF9F43' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginBottom: 6 },
  badgeConforme: { backgroundColor: '#28C76F' },
  badgeDivergente: { backgroundColor: '#FF9F43' },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  resultInfo: { fontSize: 13, color: '#555' },
  instruction: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  addressCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, elevation: 1 },
  addressLabel: { fontSize: 12, color: '#888' },
  addressValue: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 2 },
  changeLink: { color: '#14477E', fontSize: 13, marginTop: 6 },
  listSection: { marginTop: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8 },
  itemCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 6, elevation: 1 },
  itemDone: { opacity: 0.7 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#333' },
  itemDetail: { fontSize: 12, color: '#888', marginTop: 2 },
  itemBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 6 },
  itemBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  countSection: { marginTop: 4 },
  productCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, elevation: 1 },
  productName: { fontSize: 16, fontWeight: '700', color: '#333' },
  productCode: { fontSize: 13, color: '#555', marginTop: 2 },
  productSystem: { fontSize: 13, color: '#14477E', fontWeight: '600', marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 32 },
  btnCancel: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  btnCancelText: { color: '#666', fontWeight: '600' },
  btnConfirm: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#14477E', alignItems: 'center' },
  btnConfirmText: { color: '#fff', fontWeight: '600' },
})
