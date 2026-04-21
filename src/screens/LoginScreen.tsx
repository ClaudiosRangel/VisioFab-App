import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '../schemas/loginSchema';
import { useAuth } from '../context/AuthContext';
import LoadingOverlay from '../components/LoadingOverlay';

const ERROS_FIREBASE: Record<string, string> = {
  'auth/user-not-found': 'Email ou senha incorretos',
  'auth/wrong-password': 'Email ou senha incorretos',
  'auth/invalid-credential': 'Email ou senha incorretos',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
  'auth/user-disabled': 'Conta desabilitada. Contate o administrador',
  'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
};

export default function LoginScreen() {
  const { login } = useAuth();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema), defaultValues: { email: '', senha: '' },
  });
  async function onSubmit(data: LoginFormValues) {
    setCarregando(true); setErro('');
    try { await login(data.email, data.senha); }
    catch (e: any) { const msg = e?.message || ''; setErro(msg.includes('Acesso negado') ? msg : (ERROS_FIREBASE[e?.code] || 'Erro ao fazer login')); }
    finally { setCarregando(false); }
  }
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LoadingOverlay visible={carregando} message="Entrando..." />
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.header}><Text style={s.title}>VisioFab</Text><Text style={s.subtitle}>Monitoramento e Controle de Produção</Text></View>
        <View style={s.card}>
          <Text style={s.label}>Email <Text style={s.req}>*</Text></Text>
          <Controller name="email" control={control} render={({ field: { onChange, onBlur, value } }) => (
            <TextInput style={[s.input, errors.email && s.inputErr]} placeholder="seu@email.com" placeholderTextColor="rgba(47,43,61,0.4)" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} onBlur={onBlur} onChangeText={onChange} value={value} />
          )} />
          {errors.email && <Text style={s.err}>{errors.email.message}</Text>}
          <Text style={s.label}>Senha <Text style={s.req}>*</Text></Text>
          <Controller name="senha" control={control} render={({ field: { onChange, onBlur, value } }) => (
            <TextInput style={[s.input, errors.senha && s.inputErr]} placeholder="Sua senha" placeholderTextColor="rgba(47,43,61,0.4)" secureTextEntry onBlur={onBlur} onChangeText={onChange} value={value} />
          )} />
          {errors.senha && <Text style={s.err}>{errors.senha.message}</Text>}
          {erro ? <Text style={s.erroGeral}>{erro}</Text> : null}
          <TouchableOpacity style={s.btn} onPress={handleSubmit(onSubmit)}><Text style={s.btnTxt}>Entrar</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F7FA', padding: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '700', color: '#14477E', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(47,43,61,0.7)', textAlign: 'center' },
  card: { backgroundColor: '#FFF', borderRadius: 6, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: 'rgba(47,43,61,0.12)' },
  label: { fontSize: 13, fontWeight: '500', color: 'rgba(47,43,61,0.7)', marginBottom: 6, marginTop: 12 },
  req: { color: '#FF4C51' },
  input: { backgroundColor: '#FFF', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(47,43,61,0.12)', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: 'rgba(47,43,61,0.9)' },
  inputErr: { borderColor: '#FF4C51' },
  err: { color: '#FF4C51', fontSize: 12, marginTop: 4 },
  erroGeral: { color: '#FF4C51', fontSize: 13, textAlign: 'center', marginTop: 16 },
  btn: { backgroundColor: '#14477E', borderRadius: 6, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  btnTxt: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
