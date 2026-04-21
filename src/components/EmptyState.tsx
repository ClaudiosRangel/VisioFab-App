import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props { message: string; icon?: string; }

export default function EmptyState({ message, icon = '📋' }: Props) {
  return (
    <View style={s.root}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.msg}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 64 },
  icon: { fontSize: 48, marginBottom: 16 },
  msg: { fontSize: 16, color: 'rgba(47,43,61,0.7)', textAlign: 'center', lineHeight: 24 },
});
