import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import LoadingOverlay from '../components/LoadingOverlay'
import LoginScreen from '../screens/LoginScreen'
import HomeScreen from '../screens/HomeScreen'
import SettingsScreen from '../screens/SettingsScreen'
import ListaOSPendentesScreen from '../screens/ListaOSPendentesScreen'
import ConferenciaEntradaScreen from '../screens/ConferenciaEntradaScreen'
import EnderecamentoScreen from '../screens/EnderecamentoScreen'
import SeparacaoScreen from '../screens/SeparacaoScreen'
import EmbalagemScreen from '../screens/EmbalagemScreen'
import CarregamentoScreen from '../screens/CarregamentoScreen'
import ConferenciaSaidaScreen from '../screens/ConferenciaSaidaScreen'
import InventarioScreen from '../screens/InventarioScreen'
import type { RootStackParamList, MainStackParamList } from '../types/wms'

const RootStack = createNativeStackNavigator<RootStackParamList>()
const MainStack = createNativeStackNavigator<MainStackParamList>()

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Home" component={HomeScreen} />
      <MainStack.Screen name="Settings" component={SettingsScreen} />
      <MainStack.Screen name="ListaOSPendentes" component={ListaOSPendentesScreen} />
      <MainStack.Screen name="ConferenciaEntrada" component={ConferenciaEntradaScreen} />
      <MainStack.Screen name="Enderecamento" component={EnderecamentoScreen} />
      <MainStack.Screen name="Separacao" component={SeparacaoScreen} />
      <MainStack.Screen name="Embalagem" component={EmbalagemScreen} />
      <MainStack.Screen name="Carregamento" component={CarregamentoScreen} />
      <MainStack.Screen name="ConferenciaSaida" component={ConferenciaSaidaScreen} />
      <MainStack.Screen name="Inventario" component={InventarioScreen} />
    </MainStack.Navigator>
  )
}

export default function AppNavigator() {
  const { usuario, carregando } = useAuth()

  if (carregando) return <LoadingOverlay visible message="Carregando..." />

  const autenticado = !!usuario

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!autenticado ? (
          <RootStack.Screen name="Login" component={LoginScreen} />
        ) : (
          <RootStack.Screen name="Main" component={MainNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  )
}
