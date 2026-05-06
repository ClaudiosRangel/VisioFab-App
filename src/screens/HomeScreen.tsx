import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, FlatList } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../services/apiClient'
import type { MainStackParamList, OrdemServicoWms } from '../types/wms'

type Nav = NativeStackNavigationProp<MainStackParamList>

const OPERATIONS = [
  { key: 'conf-entrada', label: 'Conferência\nde Entrada', icon: '📋', color: '#14477E', screen: 'ListaOSPendentes' },
  { key: 'enderecamento', label: 'Endereçamento', icon: '📍', color: '#28C76F', screen: 'ListaOSPendentes' },
  { key: 'separacao', label: 'Separação\n(Picking)', icon: '🛒', color: '#FF9F43', screen: 'ListaOSPendentes' },
  { key: 'embalagem', label: 'Embalagem', icon: '📦', color: '#7367F0', screen: 'ListaOSPendentes' },
  { key: 'carregamento', label: 'Carregamento', icon: '🚛', color: '#00CFE8', screen: 'ListaOSPendentes' },
  { key: 'conf-saida', label: 'Conferência\nde Saída', icon: '✅', color: '#EA5455', screen: 'ListaOSPendentes' },
  { key: 'inventario', label: 'Inventário', icon: '📊', color: '#636363', screen: 'ListaOSPendentes' },
] as const

const OP_LABELS: Record<string, string> = {
  CONFERENCIA: 'Conferência', ENDERECAMENTO: 'Endereçamento', SEPARACAO: 'Separação',
  EMBALAGEM: 'Embalagem', CARREGAMENTO: 'Carregamento',
}
const OP_COLORS: Record<string, string> = {
  CONFERENCIA: '#14477E', ENDERECAMENTO: '#28C76F', SEPARACAO: '#FF9F43',
  EMBALAGEM: '#7367F0', CARREGAMENTO: '#00CFE8',
}

export default function HomeScreen() {
  const nav = useNavigation<Nav>()
  const { usuario, logout } = useAuth()
  const [osPendentes, setOsPendentes] = useState(0)
  const [minhasOS, setMinhasOS] = useState<OrdemServicoWms[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function fetchPendentes() {
    try {
      const { data } = await apiClient.get('/os-wms/pendentes/lista')
      setOsPendentes(data.total || data.data?.length || 0)
    } catch { /* ignore */ }
  }

  async function fetchMinhasOS() {
    try {
      const { data } = await apiClient.get('/os-wms/minhas')
      setMinhasOS(data.data || [])
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchPendentes(); fetchMinhasOS() }, [])

  async function onRefresh() {
    setRefreshing(true)
    await Promise.all([fetchPendentes(), fetchMinhasOS()])
    setRefreshing(false)
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

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Olá, {usuario?.nome || 'Operador'}</Text>
          <Text style={s.subtitle}>VisioFab WMS — Coletor</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={() => nav.navigate('Settings')} style={s.iconBtn}>
            <Text style={s.iconText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={s.iconBtn}>
            <Text style={s.iconText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* OS Pendentes Card */}
      <TouchableOpacity style={s.osCard} onPress={() => nav.navigate('ListaOSPendentes')}>
        <Text style={s.osCount}>{osPendentes}</Text>
        <Text style={s.osLabel}>OS Pendentes</Text>
        <Text style={s.osAction}>Toque para ver →</Text>
      </TouchableOpacity>

      {/* Histórico */}
      <TouchableOpacity style={s.historicoBtn} onPress={() => nav.navigate('HistoricoOS')}>
        <Text style={s.historicoBtnIcon}>📜</Text>
        <Text style={s.historicoBtnText}>Meu Histórico de OS</Text>
        <Text style={s.historicoBtnArrow}>→</Text>
      </TouchableOpacity>

      {/* Minhas OS em Andamento */}
      {minhasOS.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Minhas OS em Andamento</Text>
          {minhasOS.map((os) => (
            <TouchableOpacity
              key={os.id}
              style={[s.minhaOsCard, { borderLeftColor: OP_COLORS[os.operacao] || '#999' }]}
              onPress={() => navigateToOperation(os)}
            >
              <View style={s.minhaOsRow}>
                <Text style={s.minhaOsNum}>OS #{os.numero}</Text>
                <View style={[s.minhaOsBadge, { backgroundColor: OP_COLORS[os.operacao] || '#999' }]}>
                  <Text style={s.minhaOsBadgeText}>{OP_LABELS[os.operacao] || os.operacao}</Text>
                </View>
              </View>
              {os.notaEntrada && <Text style={s.minhaOsNf}>NF {os.notaEntrada.numero} — {os.notaEntrada.fornecedor || '—'}</Text>}
              <Text style={s.minhaOsStatus}>{os.status === 'EXECUTANDO' ? '⏱ Executando' : '📂 Aberto'}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Quick Actions */}
      <Text style={s.sectionTitle}>Operações</Text>
      <View style={s.grid}>
        {OPERATIONS.map((op) => (
          <TouchableOpacity key={op.key} style={[s.opCard, { borderLeftColor: op.color }]} onPress={() => nav.navigate(op.screen as any)}>
            <Text style={s.opIcon}>{op.icon}</Text>
            <Text style={s.opLabel}>{op.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#14477E' },
  greeting: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8 },
  iconText: { fontSize: 22 },
  osCard: { margin: 16, backgroundColor: '#14477E', borderRadius: 12, padding: 20, alignItems: 'center' },
  osCount: { color: '#fff', fontSize: 48, fontWeight: '800' },
  osLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 4 },
  osAction: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, paddingBottom: 32 },
  opCard: { width: '47%', backgroundColor: '#fff', borderRadius: 10, padding: 16, borderLeftWidth: 4, elevation: 1 },
  opIcon: { fontSize: 28, marginBottom: 8 },
  opLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
  minhaOsCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginHorizontal: 16, marginBottom: 8, borderLeftWidth: 4, elevation: 1 },
  minhaOsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  minhaOsNum: { fontSize: 15, fontWeight: '700', color: '#333' },
  minhaOsBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  minhaOsBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  minhaOsNf: { fontSize: 13, color: '#555', marginTop: 2 },
  minhaOsStatus: { fontSize: 12, color: '#14477E', marginTop: 4 },
  historicoBtn: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 10, padding: 14, elevation: 1 },
  historicoBtnIcon: { fontSize: 22, marginRight: 12 },
  historicoBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#333' },
  historicoBtnArrow: { fontSize: 16, color: '#999' },
})
