import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface Props {
  title: string
  subtitle?: string
  onBack: () => void
}

export default function OperationHeader({ title, subtitle, onBack }: Props) {
  return (
    <View style={s.container}>
      <TouchableOpacity onPress={onBack} style={s.backBtn}>
        <Text style={s.backText}>← Voltar</Text>
      </TouchableOpacity>
      <Text style={s.title}>{title}</Text>
      {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
    </View>
  )
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: '#14477E' },
  backBtn: { marginBottom: 4 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
})
