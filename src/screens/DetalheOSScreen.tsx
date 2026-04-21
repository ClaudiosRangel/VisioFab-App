import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { OSStackParamList } from '../navigation/AppNavigator';
import { obterDocumento } from '../services/firestoreService';
import { classificarEtapa, botaoContagemVisivel } from '../utils/roteiroUtils';
import { formatarDataHora } from '../utils/formatters';
import EmptyState from '../components/EmptyState';
import type { OrdemServico, EtapaRoteiro } from '../types';

type Nav = NativeStackNavigationProp<OSStackParamList, 'DetalheOS'>;
type Route = RouteProp<OSStackParamList, 'DetalheOS'>;

export default function DetalheOSScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const isFocused = useIsFocused();
  const { osId } = route.params;

  const [os, setOs] = useState<OrdemServico | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const doc = await obterDocumento<OrdemServico>('ordens_servico', osId);
      setOs(doc);
    } catch {
      setOs(null);
    } finally {
      setLoading(false);
    }
  }, [osId]);

  useEffect(() => {
    if (isFocused) carregar();
  }, [isFocused, carregar]);

  const etapaAtualIndex = os?.etapaAtualIndex ?? 0;
  const roteiro = os?.roteiro ?? [];
  const temRoteiro = roteiro.length > 0;
  const roteiroCompleto = temRoteiro && roteiro.every((e) => e.concluida);
  const mostrarBotao = os ? botaoContagemVisivel(os) : false;

  const handleRegistrarContagem = () => {
    if (!os || !temRoteiro) return;
    const maquinaNome = roteiro[etapaAtualIndex]?.maquinaNome ?? '';
    navigation.navigate('Contagem', { osId, etapaIndex: etapaAtualIndex, maquinaNome });
  };

  const renderEtapa = ({ item, index }: { item: EtapaRoteiro; index: number }) => {
    const estado = classificarEtapa(item, index, etapaAtualIndex);

    return (
      <View
        style={[
          s.etapaCard,
          estado === 'atual' && s.etapaAtual,
          estado === 'pendente' && s.etapaPendente,
        ]}
      >
        <View style={s.etapaRow}>
          <View style={s.etapaNumero}>
            {estado === 'concluida' ? (
              <Text style={s.checkIcon}>{'✓'}</Text>
            ) : (
              <Text style={[s.etapaNumeroTxt, estado === 'pendente' && s.textDisabled]}>
                {index + 1}
              </Text>
            )}
          </View>

          <View style={s.etapaInfo}>
            <Text style={[s.etapaMaquina, estado === 'pendente' && s.textDisabled]}>
              {item.maquinaNome}
            </Text>
            {estado === 'concluida' && item.concluidaEm && (
              <Text style={s.etapaData}>Concluída em {formatarDataHora(item.concluidaEm)}</Text>
            )}
            {estado === 'atual' && <Text style={s.etapaAtualLabel}>Etapa Atual</Text>}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#14477E" />
      </View>
    );
  }

  if (!os) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.container}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backTxt}>{'← Voltar'}</Text>
          </TouchableOpacity>
          <EmptyState message="OS não encontrada" icon="⚠️" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>{'← Voltar'}</Text>
        </TouchableOpacity>

        <View style={s.header}>
          <Text style={s.osNumero}>{os.os}</Text>
          {roteiroCompleto && (
            <View style={s.badgeCompleto}>
              <Text style={s.badgeCompletoTxt}>{'✓ Roteiro Completo'}</Text>
            </View>
          )}
        </View>

        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Cliente</Text>
            <Text style={s.infoValue}>{os.cliente}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Produto</Text>
            <Text style={s.infoValue}>{os.produto}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Quantidade</Text>
            <Text style={s.infoValue}>{os.qtd}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Roteiro de Fabricação</Text>

        {!temRoteiro ? (
          <EmptyState message="Roteiro não definido para esta OS" icon="📋" />
        ) : (
          <FlatList
            data={roteiro}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderEtapa}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {mostrarBotao && (
          <TouchableOpacity style={s.btnContagem} onPress={handleRegistrarContagem}>
            <Text style={s.btnContagemTxt}>Registrar Contagem</Text>
          </TouchableOpacity>
        )}
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
  backBtn: {
    marginBottom: 12,
  },
  backTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: '#14477E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  osNumero: {
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(47,43,61,0.9)',
  },
  badgeCompleto: {
    backgroundColor: 'rgba(40,199,111,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeCompletoTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#28C76F',
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(47,43,61,0.12)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: 'rgba(47,43,61,0.7)',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(47,43,61,0.9)',
    flexShrink: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(47,43,61,0.9)',
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 16,
  },
  etapaCard: {
    backgroundColor: '#FFF',
    borderRadius: 6,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(47,43,61,0.12)',
  },
  etapaAtual: {
    backgroundColor: 'rgba(20,71,126,0.08)',
    borderColor: '#14477E',
  },
  etapaPendente: {
    opacity: 0.4,
  },
  etapaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etapaNumero: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(47,43,61,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  etapaNumeroTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(47,43,61,0.9)',
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28C76F',
  },
  etapaInfo: {
    flex: 1,
  },
  etapaMaquina: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(47,43,61,0.9)',
  },
  etapaData: {
    fontSize: 12,
    color: '#28C76F',
    marginTop: 2,
  },
  etapaAtualLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#14477E',
    marginTop: 2,
  },
  textDisabled: {
    color: 'rgba(47,43,61,0.4)',
  },
  btnContagem: {
    backgroundColor: '#14477E',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  btnContagemTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
