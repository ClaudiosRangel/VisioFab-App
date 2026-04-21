import React from 'react';
import { View, Text, ActivityIndicator, Modal, StyleSheet } from 'react-native';

interface Props { visible: boolean; message?: string; }

export default function LoadingOverlay({ visible, message }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.box}>
          <ActivityIndicator size="large" color="#14477E" />
          {message && <Text style={s.msg}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  box: { backgroundColor: '#FFF', borderRadius: 12, padding: 32, alignItems: 'center', minWidth: 200 },
  msg: { marginTop: 16, fontSize: 14, color: 'rgba(47,43,61,0.7)', textAlign: 'center' },
});
