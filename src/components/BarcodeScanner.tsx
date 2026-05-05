import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import type { BarcodeType } from '../types/wms'

interface Props {
  onScan: (code: string) => void
  barcodeTypes?: BarcodeType[]
  enabled?: boolean
  placeholder?: string
}

const TYPE_MAP: Record<BarcodeType, string> = {
  code128: 'code128',
  ean13: 'ean13',
  qr: 'qr',
}

export default function BarcodeScanner({ onScan, barcodeTypes = ['code128', 'ean13', 'qr'], enabled = true, placeholder = 'Ou digite o código...' }: Props) {
  const [permission, requestPermission] = useCameraPermissions()
  const [manualCode, setManualCode] = useState('')
  const [showManualHint, setShowManualHint] = useState(false)
  const lastScan = useRef<string>('')
  const lastScanTime = useRef<number>(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (enabled) {
      timeoutRef.current = setTimeout(() => setShowManualHint(true), 5000)
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [enabled])

  const handleBarcode = (result: { data: string }) => {
    if (!enabled) return
    const now = Date.now()
    // Debounce: ignore same code within 1 second
    if (result.data === lastScan.current && now - lastScanTime.current < 1000) return
    lastScan.current = result.data
    lastScanTime.current = now
    setShowManualHint(false)
    onScan(result.data)
  }

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim())
      setManualCode('')
    }
  }

  if (!permission?.granted) {
    return (
      <View style={s.container}>
        <Text style={s.permText}>Permissão de câmera necessária</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnText}>Permitir Câmera</Text>
        </TouchableOpacity>
        <TextInput
          style={s.input}
          placeholder={placeholder}
          value={manualCode}
          onChangeText={setManualCode}
          onSubmitEditing={handleManualSubmit}
          returnKeyType="done"
        />
      </View>
    )
  }

  return (
    <View style={s.container}>
      {enabled && (
        <View style={s.cameraWrap}>
          <CameraView
            style={s.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: barcodeTypes.map((t) => TYPE_MAP[t]) as any }}
            onBarcodeScanned={handleBarcode}
          />
          <View style={s.overlay}>
            <View style={s.scanArea} />
          </View>
        </View>
      )}
      {showManualHint && (
        <Text style={s.hint}>Não conseguiu escanear? Tente digitar manualmente.</Text>
      )}
      <TextInput
        style={s.input}
        placeholder={placeholder}
        value={manualCode}
        onChangeText={setManualCode}
        onSubmitEditing={handleManualSubmit}
        returnKeyType="done"
        autoCapitalize="none"
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { marginBottom: 12 },
  cameraWrap: { height: 200, borderRadius: 8, overflow: 'hidden', marginBottom: 8, position: 'relative' },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanArea: { width: 220, height: 120, borderWidth: 2, borderColor: '#28C76F', borderRadius: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff' },
  hint: { fontSize: 12, color: '#FF9F43', textAlign: 'center', marginBottom: 6 },
  permText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 8 },
  permBtn: { backgroundColor: '#14477E', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  permBtnText: { color: '#fff', fontWeight: '600' },
})
