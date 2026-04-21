import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import ListaOSScreen from '../screens/ListaOSScreen';
import DetalheOSScreen from '../screens/DetalheOSScreen';
import ContagemScreen from '../screens/ContagemScreen';
import HistoricoScreen from '../screens/HistoricoScreen';
import LoadingOverlay from '../components/LoadingOverlay';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  NaoAutorizado: undefined;
};

export type BottomTabParamList = {
  OrdensServicoTab: undefined;
  HistoricoTab: undefined;
};

export type OSStackParamList = {
  ListaOS: undefined;
  DetalheOS: { osId: string };
  Contagem: { osId: string; etapaIndex: number; maquinaNome: string };
};

export type HistoricoStackParamList = {
  Historico: undefined;
};

function NaoAutorizadoScreen() {
  return (
    <View style={s.center}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>{'🔒'}</Text>
      <Text style={s.title}>Acesso não autorizado</Text>
      <Text style={s.sub}>Você não possui permissão para acessar esta funcionalidade.</Text>
    </View>
  );
}

const OSStack = createNativeStackNavigator<OSStackParamList>();
function OSStackNavigator() {
  return (
    <OSStack.Navigator screenOptions={{ headerShown: false }}>
      <OSStack.Screen name="ListaOS" component={ListaOSScreen} />
      <OSStack.Screen name="DetalheOS" component={DetalheOSScreen} />
      <OSStack.Screen name="Contagem" component={ContagemScreen} />
    </OSStack.Navigator>
  );
}

const HistStack = createNativeStackNavigator<HistoricoStackParamList>();
function HistoricoStackNavigator() {
  return (
    <HistStack.Navigator screenOptions={{ headerShown: false }}>
      <HistStack.Screen name="Historico" component={HistoricoScreen} />
    </HistStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<BottomTabParamList>();
function BottomTabs() {
  const { usuario } = useAuth();
  const mostrarHistorico = usuario?.permissoes?.app_historico === true;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#14477E',
        tabBarInactiveTintColor: 'rgba(47,43,61,0.4)',
        tabBarStyle: { backgroundColor: '#FFF', borderTopColor: 'rgba(47,43,61,0.12)' },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="OrdensServicoTab"
        component={OSStackNavigator}
        options={{
          tabBarLabel: 'Ordens de Serviço',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{'📋'}</Text>,
        }}
      />
      {mostrarHistorico && (
        <Tab.Screen
          name="HistoricoTab"
          component={HistoricoStackNavigator}
          options={{
            tabBarLabel: 'Histórico',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{'🕐'}</Text>,
          }}
        />
      )}
    </Tab.Navigator>
  );
}

const Root = createNativeStackNavigator<RootStackParamList>();
export default function AppNavigator() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <LoadingOverlay visible message="Carregando..." />;
  const autenticado = !!usuario;
  const temPermissao = usuario?.permissoes?.app_contagem === true;
  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {!autenticado ? (
          <Root.Screen name="Login" component={LoginScreen} />
        ) : temPermissao ? (
          <Root.Screen name="Main" component={BottomTabs} />
        ) : (
          <Root.Screen name="NaoAutorizado" component={NaoAutorizadoScreen} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#F8F7FA', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 20, fontWeight: '700', color: 'rgba(47,43,61,0.9)', marginBottom: 8 },
  sub: { fontSize: 14, color: 'rgba(47,43,61,0.7)', textAlign: 'center', lineHeight: 22 },
});