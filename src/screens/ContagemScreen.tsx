import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Controller } from 'react-hook-form';
import type { OSStackParamList } from '../navigation/AppNavigator';
import useContagem from '../hooks/useContagem';
import { formatarDataHora } from '../utils/formatters';
import LoadingOverlay from '../components/LoadingOverlay';

type Nav = NativeStackNavigationProp<OSStackParamList, 'Contagem'>;
type Route = RouteProp<OSStackParamList, 'Contagem'>;

export default function ContagemScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { osId, etapaIndex, maquinaNome } = route.params;

  const {
    os,
    contagens,
    loading,
    saving,
    erro,
    producaoCalculada,
    totalJaProduzido,
    salvarContagem,
    executarFinalizacao,
    control,
    handleSubmit,
    formState,
  } = useContagem({ osId, etapaIndex });

  const isFormValid = formState.isValid;

  // Registrar contagem parcial
  const onRegistrar = async () => {
    const resultado = await salvarContagem();
    if (resultado.ok) {
      Alert.alert('Sucesso', 'Contagem registrada com sucesso!');
    } else {
      Alert.alert('Erro', resultado.erro || 'Erro ao registrar contagem.');
    }
  };

  // Finalizar etapa com confirmação
  const onFinalizar = () => {
    Alert.alert(
      'Confirmar Finalização',
      `Deseja finalizar a etapa na máquina ${maquinaNome}?\n\nTotal produzido: ${totalJaProduzido}\nContagens registradas: ${contagens.length}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            const resultado = await executarFinalizacao();
            if (resultado.ok) {
              Alert.alert('Sucesso', 'Etapa finalizada com sucesso!', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } else {
              Alert.alert('Erro', resultado.erro || 'Erro ao finalizar etapa.');
            }
          },
        },
      ],
      { cancelable: false },
    );
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
      <LoadingOverlay visible={saving} message="Salvando..." />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.flex}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backTxt}>{'← Voltar'}</Text>
          </TouchableOpacity>

          <Text style={s.title}>Registrar Contagem</Text>

          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>OS</Text>
              <Text style={s.infoValue}>{os?.os ?? '—'}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Máquina</Text>
              <Text style={s.infoValue}>{maquinaNome}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Etapa</Text>
              <Text style={s.infoValue}>{etapaIndex + 1}</Text>
            </View>
          </View>

          {/* Total já produzido */}
          {contagens.length > 0 && (
            <View style={s.totalCard}>
              <Text style={s.totalLabel}>Total já produzido ({contagens.length} contagem{contagens.length > 1 ? 's' : ''})</Text>
              <Text style={s.totalValue}>{totalJaProduzido}</Text>
            </View>
          )}

          {/* Histórico de contagens parciais */}
          {contagens.length > 0 && (
            <View style={s.historicoSection}>
              <Text style={s.historicoTitle}>Contagens Registradas</Text>
              {contagens.map((c, i) => (
                <View key={c.id ?? i} style={s.historicoItem}>
                  <View style={s.historicoRow}>
                    <Text style={s.historicoIdx}>#{i + 1}</Text>
                    <Text style={s.historicoVal}>{c.contadorInicial} → {c.contadorFinal}</Text>
                    <Text style={s.historicoProd}>= {c.producaoCalculada}</Text>
                  </View>
                  <Text style={s.historicoData}>{formatarDataHora(c.dataHora)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Form fields */}
          <View style={s.formSection}>
            <Controller
              control={control}
              name="contadorInicial"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View style={s.fieldGroup}>
                  <Text style={s.label}>Contador Inicial</Text>
                  <TextInput
                    style={[s.input, error && s.inputError]}
                    value={value != null ? String(value) : ''}
                    onChangeText={(text) => onChange(text ? parseInt(text, 10) : undefined)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="rgba(47,43,61,0.4)"
                  />
                  {error && <Text style={s.errorText}>{error.message}</Text>}
                </View>
              )}
            />

            <Controller
              control={control}
              name="contadorFinal"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View style={s.fieldGroup}>
                  <Text style={s.label}>Contador Final</Text>
                  <TextInput
                    style={[s.input, error && s.inputError]}
                    value={value != null ? String(value) : ''}
                    onChangeText={(text) => onChange(text ? parseInt(text, 10) : undefined)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="rgba(47,43,61,0.4)"
                  />
                  {error && <Text style={s.errorText}>{error.message}</Text>}
                </View>
              )}
            />
          </View>

          {/* Produção calculada */}
          {producaoCalculada != null && (
            <View style={s.resultCard}>
              <Text style={s.resultLabel}>Produção Calculada</Text>
              <Text style={s.resultValue}>{producaoCalculada}</Text>
            </View>
          )}

          {!!erro && (
            <View style={s.erroCard}>
              <Text style={s.erroText}>{erro}</Text>
            </View>
          )}

          {/* Two buttons: Registrar + Finalizar */}
          <View style={s.btnGroup}>
            <TouchableOpacity
              style={[s.btnRegistrar, (!isFormValid || saving) && s.btnDisabled]}
              onPress={handleSubmit(onRegistrar)}
              disabled={!isFormValid || saving}
            >
              <Text style={s.btnRegistrarTxt}>Registrar Contagem</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.btnFinalizar, saving && s.btnDisabled]}
              onPress={onFinalizar}
              disabled={saving}
            >
              <Text style={s.btnFinalizarTxt}>Finalizar Etapa</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7FA' },
  flex: { flex: 1 },
  center: { flex: 1, backgroundColor: '#F8F7FA', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  backBtn: { marginBottom: 12 },
  backTxt: { fontSize: 15, fontWeight: '600', color: '#14477E' },
  title: { fontSize: 22, fontWeight: '700', color: 'rgba(47,43,61,0.9)', marginBottom: 12 },
  infoCard: {
    backgroundColor: '#FFF', borderRadius: 6, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(47,43,61,0.12)',
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: 'rgba(47,43,61,0.7)' },
  infoValue: { fontSize: 14, fontWeight: '600', color: 'rgba(47,43,61,0.9)', flexShrink: 1, textAlign: 'right' },
  totalCard: {
    backgroundColor: 'rgba(20,71,126,0.06)', borderRadius: 6, padding: 14, marginBottom: 16,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(20,71,126,0.15)',
  },
  totalLabel: { fontSize: 13, color: 'rgba(47,43,61,0.7)', marginBottom: 4 },
  totalValue: { fontSize: 24, fontWeight: '700', color: '#14477E' },
  historicoSection: { marginBottom: 16 },
  historicoTitle: { fontSize: 14, fontWeight: '700', color: 'rgba(47,43,61,0.9)', marginBottom: 8 },
  historicoItem: {
    backgroundColor: '#FFF', borderRadius: 6, padding: 10, marginBottom: 6,
    borderWidth: 1, borderColor: 'rgba(47,43,61,0.08)',
  },
  historicoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  historicoIdx: { fontSize: 12, fontWeight: '700', color: 'rgba(47,43,61,0.5)', width: 28 },
  historicoVal: { fontSize: 13, color: 'rgba(47,43,61,0.9)', flex: 1 },
  historicoProd: { fontSize: 13, fontWeight: '700', color: '#28C76F' },
  historicoData: { fontSize: 11, color: 'rgba(47,43,61,0.4)', marginLeft: 28 },
  formSection: { marginBottom: 16 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: 'rgba(47,43,61,0.9)', marginBottom: 6 },
  input: {
    backgroundColor: '#FFF', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(47,43,61,0.12)',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: 'rgba(47,43,61,0.9)',
  },
  inputError: { borderColor: '#FF4C51' },
  errorText: { fontSize: 12, color: '#FF4C51', marginTop: 4 },
  resultCard: {
    backgroundColor: 'rgba(40,199,111,0.08)', borderRadius: 6, padding: 16, marginBottom: 16,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(40,199,111,0.2)',
  },
  resultLabel: { fontSize: 13, color: 'rgba(47,43,61,0.7)', marginBottom: 4 },
  resultValue: { fontSize: 28, fontWeight: '700', color: '#28C76F' },
  erroCard: {
    backgroundColor: 'rgba(255,76,81,0.08)', borderRadius: 6, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,76,81,0.2)',
  },
  erroText: { fontSize: 13, color: '#FF4C51', textAlign: 'center' },
  btnGroup: { gap: 10, marginTop: 8 },
  btnRegistrar: {
    backgroundColor: '#14477E', borderRadius: 6, paddingVertical: 14, alignItems: 'center',
  },
  btnRegistrarTxt: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  btnFinalizar: {
    backgroundColor: '#FFF', borderRadius: 6, paddingVertical: 14, alignItems: 'center',
    borderWidth: 2, borderColor: '#FF9F43',
  },
  btnFinalizarTxt: { fontSize: 16, fontWeight: '700', color: '#FF9F43' },
  btnDisabled: { opacity: 0.5 },
});
