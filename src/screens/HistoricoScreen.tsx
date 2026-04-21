import React, { useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import useHistorico from '../hooks/useHistorico';
import { formatarDataHora } from '../utils/formatters';
import EmptyState from '../components/EmptyState';
import type { ContagemProducao } from '../types';

export default function HistoricoScreen() {
  const isFocused = useIsFocused();
  const { loading, refreshing, busca, setBusca, filtradas, iniciar, onRefresh } = useHistorico();

  useEffect(() => {
    if (isFocused) iniciar();
  }, [isFocused, iniciar]);

  const renderItem = ({ item }: { item: ContagemProducao }) => (
    <View style={s.card}>
      <View style={s.topRow}>
        <Text style={s.osNumero}>{item.osNumero ?? '—'}</Text>
        <View style={s.badge}>
          <Text style={s.badgeText}>{item.producaoCalculada}</Text>
        </View>
      </View>

      <Text style={s.maquina}>{item.maquinaNome ?? '—'}</Text>
      <Text style={s.etapa}>Etapa {(item.etapaIndex ?? 0) + 1}</Text>

      <View style={s.contRow}>
        <Text style={s.contVal}>{item.contadorInicial}</Text>
        <Text style={s.arrow}>→</Text>
        <Text style={s.contVal}>{item.contadorFinal}</Text>
      </View>

      <Text style={s.dataHora}>{formatarDataHora(item.dataHora)}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#14477E" />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.title}>Histórico de Contagens</Text>

        <TextInput
          style={s.search}
          placeholder="Buscar por número da OS..."
          placeholderTextColor="rgba(47,43,61,0.4)"
          value={busca}
          onChangeText={setBusca}
          autoCapitalize="none"
        />

        <FlatList
          data={filtradas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#14477E" />
          }
          ListEmptyComponent={<EmptyState message="Nenhuma contagem registrada" icon="🕐" />}
          contentContainerStyle={!filtradas.length ? s.emptyList : undefined}
        />
      </View>
    </SafeAreaView>
  );
}


const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F7FA',
  },
  center: {
    flex: 1,
    backgroundColor: '#F8F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(47,43,61,0.9)',
    marginBottom: 12,
  },
  search: {
    backgroundColor: '#FFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(47,43,61,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  emptyList: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 6,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(47,43,61,0.12)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  osNumero: {
    fontSize: 16,
    fontWeight: '700',
    color: '#14477E',
  },
  badge: {
    backgroundColor: 'rgba(40,199,111,0.12)',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#28C76F',
  },
  maquina: {
    fontSize: 13,
    color: 'rgba(47,43,61,0.7)',
    marginBottom: 2,
  },
  etapa: {
    fontSize: 12,
    color: 'rgba(47,43,61,0.5)',
    marginBottom: 10,
  },
  contRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contVal: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(47,43,61,0.9)',
  },
  arrow: {
    fontSize: 14,
    color: 'rgba(47,43,61,0.4)',
    marginHorizontal: 8,
  },
  dataHora: {
    fontSize: 12,
    color: 'rgba(47,43,61,0.5)',
  },
});
