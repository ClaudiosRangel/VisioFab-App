import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const TOKEN_KEY = 'visiofab-wms-token'
export const BASE_URL_KEY = 'visiofab-api-base-url'
export const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://visiofav.onrender.com/api'

const apiClient = axios.create({
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach JWT + resolve base URL
apiClient.interceptors.request.use(async (config) => {
  const storedUrl = await AsyncStorage.getItem(BASE_URL_KEY)
  config.baseURL = storedUrl || DEFAULT_BASE_URL

  const token = await AsyncStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY)
    }
    return Promise.reject(error)
  },
)

export { apiClient }
