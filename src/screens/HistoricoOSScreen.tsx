import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { apiClient } from '../services/apiClient'
import OperationHeader from '../components/OperationHeader'
import type { MainStackParamList, OrdemServicoWms } from '../types/wms'

type Nav = NativeStackNavigationProp<MainStackParamList>

interface OSHistorico extends OrdemServicoWms {
  tempoExecucaoMinutos: number
  notaEntrada?: { numero: number; fornecedor: string | null } | null
}

const OP_LABELS: Record<string, string> = {
  CONFERENCIA: 'Conferência', ENDERECAMENTO: 'Endereçamento', SEPARACAO: 'Separação',
  EMBALAGEM: 'Embalagem', CARREGAMENTO: 'Carregamento',
}
const OP_COLORS: Record<string, string> = {
  CONFERENCIA: '#14477E', ENDERECAMENTO: '#28C76F', SEPARACAO: '#FF9F43',
  EMBALAGEM: '#7367F0', CARREGAMENTO: '#00CFE8',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR')
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function getToday(): string {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export default function HistoricoOSScreen() {
  const nav = useNavigation<Nav>()
  const [data, setData] = useState<OSHistorico[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(getToday())
  const [total, setTotal] = useState(0)

  const fetchHistorico = useCallback(async () => {
    setLoading(true)
    try {
      const { data: resp } = await apiClient.get('/os-wms/historico', {
        params: { data: selectedDate },
      })
      setData(resp.data || [])
      setTotal(resp.total || 0)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [selectedDate])

  useEffect(() => { fetchHistorico() }, [fetchHistorico])

  function renderItem({ item }: { item: OSHistorico }) {
    return (
      <View style={[s.card, { borderLeftColor: OP_COLORS[item.operacao] || '#999' }]}>
        <View style={s.cardHeader}>
          <Text style={s.osNum}>OS #{item.numero}</Text>
          <View style={[s.badge, { backgroundColor: OP_COLORS[item.operacao] || '#999' }]}>
            <Text style={s.badgeText}>{OP_LABELS[item.operacao] || item.operacao}</Text>
          </View>
        </View>
        {item.notaEntrada && (
          <Text style={s.nfText}>NF {item.notaEntrada.numero} — {item.notaEntrada.fornecedor || '—'}</Text>
        )}
        <View style={s.cardFooter}>
          <Text style={s.timeText}>
            {item.horaInicio ? formatTime(item.horaInicio) : '—'} → {item.horaFim ? formatTime(item.horaFim) : '—'}
          </Text>
          <Text style={s.durationText}>⏱ {item.tempoExecucaoMinutos} min</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <OperationHeader title="Histórico de OS" onBack={() => nav.goBack()} />

      {/* Date selector */}
      <View style={s.dateSelector}>
        <TouchableOpacity style={s.dateBtn} onPress={() => setSelectedDate(addDays(selectedDate, -1))}>
          <Text style={s.dateBtnText}>◀</Text>
        </TouchableOpacity>
        <View style={s.dateDisplay}>
          <Text style={s.dateText}>{formatDate(selectedDate + 'T12:00:00')}</Text>
          {selectedDate === getToday() && <Text style={s.todayBadge}>Hoje</Text>}
        </View>
        <TouchableOpacity
          style={[s.dateBtn, selectedDate === getToday() && s.dateBtnDisabled]}
          onPress={() => { if (selectedDate !== getToday()) setSelectedDate(addDays(selectedDate, 1)) }}
          disabled={selectedDate === getToday()}
        >
          <Text style={[s.dateBtnText, selectedDate === getToday() && s.dateBtnTextDisabled]}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={s.summary}>
        <Text style={s.summaryText}>{total} OS concluída{total !== 1 ? 's' : ''}</Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#14477E" />
        </View>
      ) : data.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyText}>Nenhuma OS concluída nesta data</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
        />
      )}
    </View>
  )
}


const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  dateBtn: { padding: 12, borderRadius: 8, backgroundColor: '#f0f0f0' },
  dateBtnDisabled: { opacity: 0.4 },
  dateBtnText: { fontSize: 18, color: '#14477E', fontWeight: '700' },
  dateBtnTextDisabled: { color: '#999' },
  dateDisplay: { flex: 1, alignItems: 'center' },
  dateText: { fontSize: 16, fontWeight: '700', color: '#333' },
  todayBadge: { fontSize: 11, color: '#28C76F', fontWeight: '600', marginTop: 2 },
  summary: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  summaryText: { fontSize: 13, color: '#666' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, borderLeftWidth: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  osNum: { fontSize: 15, fontWeight: '700', color: '#333' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  nfText: { fontSize: 13, color: '#555', marginBottom: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeText: { fontSize: 12, color: '#888' },
  durationText: { fontSize: 12, color: '#14477E', fontWeight: '600' },
  emptyText: { fontSize: 14, color: '#999' },
})
