---
inclusion: auto
---

# Padrões de Build e Deploy — VisioFab App (React Native / Expo)

## Gerar APK (para testes internos)

```bash
eas build --profile local-apk --platform android
```

Isso gera um APK com a API apontando para produção (`https://visiofav.onrender.com/api`).

## Profiles de Build (eas.json)

| Profile | Uso | Tipo | API URL |
|---------|-----|------|---------|
| `development` | Dev com hot reload | Dev Client | localhost |
| `preview` | Teste interno (APK) | APK | default |
| `local-apk` | APK produção | APK | https://visiofav.onrender.com/api |
| `production` | Play Store | AAB (App Bundle) | produção |

## Comandos Úteis

```bash
# Desenvolvimento local
npx expo start

# Gerar APK para teste
eas build --profile local-apk --platform android

# Gerar AAB para Play Store
eas build --profile production --platform android

# Submeter para Play Store
eas submit --platform android

# Rodar testes
npx jest --passWithNoTests
```

## Deploy para Produção (Play Store)

1. `eas build --profile production --platform android`
2. Aguardar build completar no EAS
3. `eas submit --platform android`

## Stack

- Expo SDK 54
- React Native 0.81
- React 19
- React Navigation 7
- react-hook-form + zod
- Axios para API calls
- expo-camera para scanner

## Padrões de Código

- Telas em `src/screens/`
- Hooks de dados em `src/hooks/` ou `src/data/`
- Navegação via React Navigation (native-stack)
- API base URL via `EXPO_PUBLIC_API_URL`

## Checklist Pré-Build

1. ✅ `npx jest --passWithNoTests` passa
2. ✅ Testar no emulador/dispositivo via `expo start`
3. ✅ Verificar que `EXPO_PUBLIC_API_URL` está correto no profile
4. ✅ Incrementar versão em `app.json` se necessário
