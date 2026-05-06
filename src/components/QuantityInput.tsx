import React from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'

interface Props {
  value: number
  onChange: (n: number) => void
  label: string
  min?: number
  max?: number
}

export default function QuantityInput({ value, onChange, label, min = 0, max }: Props) {
  const dec = () => onChange(Math.max(min, Math.round((value - 1) * 100) / 100))
  const inc = () => onChange(max !== undefined ? Math.min(max, Math.round((value + 1) * 100) / 100) : Math.round((value + 1) * 100) / 100)

  return (
    <View style={s.container}>
      <Text style={s.label}>{label}</Text>
      <View style={s.row}>
        <TouchableOpacity style={s.btn} onPress={dec}><Text style={s.btnText}>−</Text></TouchableOpacity>
        <TextInput
          style={s.input}
          keyboardType="decimal-pad"
          value={String(value)}
          onChangeText={(t) => {
            // Allow decimal input (comma or dot)
            const cleaned = t.replace(',', '.')
            if (cleaned === '' || cleaned === '.') return
            const n = parseFloat(cleaned)
            if (!isNaN(n)) onChange(Math.max(min, max !== undefined ? Math.min(max, n) : n))
          }}
        />
        <TouchableOpacity style={s.btn} onPress={inc}><Text style={s.btnText}>+</Text></TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 13, color: '#666', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#14477E', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 18, textAlign: 'center', fontWeight: '600' },
})
