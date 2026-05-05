import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface Props {
  current: number
  total: number
  label?: string
}

export default function ProgressBar({ current, total, label }: Props) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <View style={s.container}>
      {label && <Text style={s.label}>{label}</Text>}
      <View style={s.row}>
        <View style={s.barBg}>
          <View style={[s.barFill, { width: `${pct}%` }, pct === 100 && s.barComplete]} />
        </View>
        <Text style={s.text}>{current} / {total}</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 12, color: '#666', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barBg: { flex: 1, height: 10, backgroundColor: '#E8E8E8', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#14477E', borderRadius: 5 },
  barComplete: { backgroundColor: '#28C76F' },
  text: { fontSize: 13, fontWeight: '600', color: '#333', minWidth: 50, textAlign: 'right' },
})
