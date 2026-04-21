import React, { useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OSStackParamList } from '../navigation/AppNavigator';
import useOrdens from '../hooks/useOrdens';
import { progresso, maquinaAtual, isOSFinalizada } from '../utils/ordensUtils';
import EmptyState from '../components/EmptyState';
import type { OrdemServico } from '../types';

type Nav = NativeStackNavigationProp<OSStackParamList>;

export default function ListaOSScreen() {
  const nav = useNavigation<Nav>();
  const isFocused = useIsFocused();

  const {
    loading,
    refreshing,
    busca,
    setBusca,
    aba,
    setAba,
    semProcesso,
    pendentes,
    finalizadas,
    filtradas,
    iniciar,
    onRefresh,
  } = useOrdens();

  useEffect(() => {
    if (isFocused) iniciar();
  }, [isFocused, iniciar]);

  const emptyMessage = semProcesso
    ? 'Nenhum processo associado ao seu usuário.'
    : aba === 'pendentes'
      ? 'Nenhuma OS pendente'
      : 'Nenhuma OS finalizada';

  const handlePress = (item: OrdemServico) => {
    if (!isOSFinalizada(item)) {
      nav.navigate('DetalheOS', { osId: item.id });
    }
  };

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
        <Text style={s.title}>Ordens de Serviço</Text>

        <View style={s.tabs}>
          <TouchableOpacity
            style={[s.tab, aba === 'pendentes' && s.tabActive]}
            onPress={() => setAba('pendentes')}
          >
            <Text style={[s.tabTxt, aba === 'pendentes' && s.tabTxtActive]}>
              Pendentes ({pendentes.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, aba === 'finalizadas' && s.tabActive]}
            onPress={() => setAba('finalizadas')}
          >
            <Text style={[s.tabTxt, aba === 'finalizadas' && s.tabTxtActive]}>
              Finalizadas ({finalizadas.length})
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={s.search}
          placeholder="Buscar por OS, cliente ou produto..."
          placeholderTextColor="rgba(47,43,61,0.4)"
          value={busca}
          onChangeText={setBusca}
          autoCapitalize="none"
        />

        <FlatList
          data={filtradas}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#14477E"
            />
          }
          ListEmptyComponent={<EmptyState message={emptyMessage} />}
          contentContainerStyle={!filtradas.length ? { flexGrow: 1 } : undefined}
          renderItem={({ item }) => {
            const finalizada = isOSFinalizada(item);
            return (
              <TouchableOpacity
                style={[s.card, finalizada && s.cardFin]}
                onPress={() => handlePress(item)}
                disabled={finalizada}
              >
                <View style={s.row}>
                  <Text style={s.os}>{item.os}</Text>
                  <Text style={[s.badge, finalizada && s.badgeFin]}>
                    {finalizada ? '✓ Completa' : progresso(item)}
                  </Text>
                </View>
                <Text style={s.cliente}>{item.cliente}</Text>
                <Text style={s.produto}>{item.produto}</Text>
                <View style={s.row}>
                  <Text style={s.meta}>{'🏭'} {maquinaAtual(item)}</Text>
                  <Text style={s.meta}>{'📅'} {item.entrega}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
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
  tabs: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(47,43,61,0.06)',
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 4,
  },
  tabActive: {
    backgroundColor: '#FFF',
    elevation: 1,
    shadowColor: 'rgba(47,43,61,0.12)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
  },
  tabTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(47,43,61,0.5)',
  },
  tabTxtActive: {
    color: '#14477E',
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
  card: {
    backgroundColor: '#FFF',
    borderRadius: 6,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(47,43,61,0.12)',
  },
  cardFin: {
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  os: {
    fontSize: 16,
    fontWeight: '700',
    color: '#14477E',
  },
  badge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#14477E',
    backgroundColor: 'rgba(20,71,126,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  badgeFin: {
    color: '#28C76F',
    backgroundColor: 'rgba(40,199,111,0.12)',
  },
  cliente: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(47,43,61,0.9)',
    marginBottom: 2,
  },
  produto: {
    fontSize: 13,
    color: 'rgba(47,43,61,0.7)',
    marginBottom: 8,
  },
  meta: {
    fontSize: 12,
    color: 'rgba(47,43,61,0.7)',
  },
});
