import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { apiClient } from '../services/apiClient'
import { useFeedback } from '../context/FeedbackContext'
import { useAuth } from '../context/AuthContext'
import OperationHeader from '../components/OperationHeader'
import EmptyState from '../components/EmptyState'
import type { OrdemServicoWms, MainStackParamList } from '../types/wms'

type Nav = NativeStackNavigationProp<MainStackParamList>

const OP_LABELS: Record<string, string> = {
  CONFERENCIA: 'Conferência', ENDERECAMENTO: 'Endereçamento', SEPARACAO: 'Separação',
  EMBALAGEM: 'Embalagem', CARREGAMENTO: 'Carregamento',
}
const OP_COLORS: Record<string, string> = {
  CONFERENCIA: '#14477E', ENDERECAMENTO: '#28C76F', SEPARACAO: '#FF9F43',
  EMBALAGEM: '#7367F0', CARREGAMENTO: '#00CFE8',
}

export default function ListaOSPendentesScreen() {
  const nav = useNavigation<Nav>()
  const { usuario } = useAuth()
  const { showFeedback } = useFeedback()
  const [lista, setLista] = useState<OrdemServicoWms[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOS = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/os-wms/pendentes/lista')
      setLista(data.data || [])
    } catch { showFeedback('error') }
    finally { setLoading(false) }
  }, [showFeedback])

  useEffect(() => { fetchOS() }, [fetchOS])

  async function onRefresh() { setRefreshing(true); await fetchOS(); setRefreshing(false) }

  async function assumir(os: OrdemServicoWms) {
    if (!usuario) return
    try {
      await apiClient.post(`/os-wms/assumir/${os.id}`, { funcionarioId: usuario.id })
      showFeedback('success')
      // Navigate to operation screen
      navigateToOperation(os)
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erro ao assumir OS'
      Alert.alert('Erro', msg)
      showFeedback('error')
      fetchOS() // Refresh list
    }
  }

  function navigateToOperation(os: OrdemServicoWms) {
    switch (os.operacao) {
      case 'CONFERENCIA':
        if (os.notaEntradaId) nav.navigate('ConferenciaEntrada', { notaId: os.notaEntradaId, osId: os.id })
        break
      case 'ENDERECAMENTO':
        if (os.notaEntradaId) nav.navigate('Enderecamento', { notaEntradaId: os.notaEntradaId, osId: os.id })
        break
      case 'SEPARACAO':
        if (os.ondaSeparacaoId) nav.navigate('Separacao', { ondaSeparacaoId: os.ondaSeparacaoId, osId: os.id })
        break
      case 'EMBALAGEM':
        if (os.ondaSeparacaoId) nav.navigate('Embalagem', { volumeId: '', ondaSeparacaoId: os.ondaSeparacaoId, osId: os.id })
        break
      case 'CARREGAMENTO':
        if (os.carregamentoId) nav.navigate('Carregamento', { carregamentoId: os.carregamentoId, osId: os.id })
        break
    }
  }

  const renderItem = ({ item: os }: { item: OrdemServicoWms }) => (
    <TouchableOpacity style={[s.card, { borderLeftColor: OP_COLORS[os.operacao] || '#999' }]} onPress={() => assumir(os)}>
      <View style={s.cardRow}>
        <Text style={s.osNum}>OS #{os.numero}</Text>
        <View style={[s.badge, { backgroundColor: OP_COLORS[os.operacao] || '#999' }]}>
          <Text style={s.badgeText}>{OP_LABELS[os.operacao] || os.operacao}</Text>
        </View>
      </View>
      <Text style={s.tipo}>{os.tipo}</Text>
      {os.notaEntrada && <Text style={s.nf}>NF {os.notaEntrada.numero} — {os.notaEntrada.fornecedor || '—'}</Text>}
      <Text style={s.action}>Toque para assumir →</Text>
    </TouchableOpacity>
  )

  return (
    <View style={s.container}>
      <OperationHeader title="OS Pendentes" subtitle={`${lista.length} ordem(ns) disponível(is)`} onBack={() => nav.goBack()} />
      <FlatList
        data={lista}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={!loading ? <EmptyState icon="📋" title="Nenhuma OS pendente" /> : null}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5FA' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 10, borderLeftWidth: 4, elevation: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  osNum: { fontSize: 16, fontWeight: '700', color: '#333' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  tipo: { fontSize: 12, color: '#999', marginBottom: 2 },
  nf: { fontSize: 13, color: '#555' },
  action: { fontSize: 11, color: '#14477E', marginTop: 6 },
})
