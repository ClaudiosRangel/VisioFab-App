import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { Animated, StyleSheet, Dimensions } from 'react-native'
import type { FeedbackType } from '../types/wms'

const COLORS: Record<FeedbackType, string> = {
  success: '#28C76F',
  error: '#FF4C51',
  warning: '#FF9F43',
}

interface FeedbackContextData {
  showFeedback: (type: FeedbackType) => void
}

const FeedbackContext = createContext<FeedbackContextData>({} as FeedbackContextData)

export default function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [color, setColor] = useState<string>('transparent')
  const opacity = useRef(new Animated.Value(0)).current

  const showFeedback = useCallback((type: FeedbackType) => {
    setColor(COLORS[type])
    opacity.setValue(0.5)
    Animated.timing(opacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start()
  }, [opacity])

  return (
    <FeedbackContext.Provider value={{ showFeedback }}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: color, opacity, zIndex: 9999 },
        ]}
      />
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  return useContext(FeedbackContext)
}
