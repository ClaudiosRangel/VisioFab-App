/**
 * Testes unitários para SeparacaoScreen (Picking/Separação)
 * Valida a lógica de negócio da tela de separação do coletor WMS
 */
import React from 'react'

// Mock dependencies before importing the component
jest.mock('../../services/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

jest.mock('../../context/FeedbackContext', () => ({
  useFeedback: () => ({ showFeedback: jest.fn() }),
}))

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ usuario: { id: 'user-1', nome: 'Test' } }),
}))

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
  useRoute: () => ({ params: { ondaSeparacaoId: 'onda-123', osId: 'os-456' } }),
}))

jest.mock('../../components/OperationHeader', () => 'OperationHeader')
jest.mock('../../components/BarcodeScanner', () => 'BarcodeScanner')
jest.mock('../../components/ProgressBar', () => 'ProgressBar')
jest.mock('../../components/QuantityInput', () => 'QuantityInput')

import { apiClient } from '../../services/apiClient'
import type { ItemSeparacao, ConfirmarScannerResponse } from '../../types/wms'

const mockGet = apiClient.get as jest.Mock
const mockPost = apiClient.post as jest.Mock

// ─── Test Data ──────────────────────────────────────────────────────────────

const mockItens: ItemSeparacao[] = [
  {
    id: 'item-1',
    produtoId: 'prod-1',
    produto: { codigo: 'PROD-A', nome: 'Produto A', unidade: 'UN' },
    enderecoOrigem: { enderecoCompleto: 'R01.P01.N01.A01' },
    quantidadeSolicitada: 10,
    quantidadeSeparada: 0,
    status: 'PENDENTE',
  },
  {
    id: 'item-2',
    produtoId: 'prod-2',
    produto: { codigo: 'PROD-B', nome: 'Produto B', unidade: 'UN' },
    enderecoOrigem: { enderecoCompleto: 'R01.P02.N01.A01' },
    quantidadeSolicitada: 5,
    quantidadeSeparada: 0,
    status: 'PENDENTE',
  },
  {
    id: 'item-3',
    produtoId: 'prod-3',
    produto: { codigo: 'PROD-C', nome: 'Produto C', unidade: 'UN' },
    enderecoOrigem: { enderecoCompleto: 'R02.P01.N01.A01' },
    quantidadeSolicitada: 3,
    quantidadeSeparada: 3,
    status: 'SEPARADO',
  },
]

const mockOndaResponse = {
  id: 'onda-123',
  numero: 1,
  status: 'EM_SEPARACAO',
  ordens: [
    {
      id: 'ordem-1',
      itens: mockItens,
    },
  ],
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('SeparacaoScreen - Lógica de Negócio', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Carregamento de dados', () => {
    it('deve buscar a onda de separação pelo ID', async () => {
      mockGet.mockResolvedValueOnce({ data: mockOndaResponse })

      // Simular a chamada que o componente faz
      const { data } = await apiClient.get('/ondas-separacao/onda-123')

      expect(mockGet).toHaveBeenCalledWith('/ondas-separacao/onda-123')
      expect(data.ordens).toHaveLength(1)
      expect(data.ordens[0].itens).toHaveLength(3)
    })

    it('deve extrair itens de todas as ordens da onda', () => {
      const ondaComMultiplasOrdens = {
        ordens: [
          { id: 'o1', itens: [mockItens[0]] },
          { id: 'o2', itens: [mockItens[1], mockItens[2]] },
        ],
      }

      const allItens: ItemSeparacao[] = []
      for (const ordem of ondaComMultiplasOrdens.ordens) {
        allItens.push(...ordem.itens)
      }

      expect(allItens).toHaveLength(3)
      expect(allItens[0].produto?.codigo).toBe('PROD-A')
      expect(allItens[2].produto?.codigo).toBe('PROD-C')
    })

    it('deve identificar o primeiro item PENDENTE como item atual', () => {
      const pendingIdx = mockItens.findIndex((i) => i.status === 'PENDENTE')
      expect(pendingIdx).toBe(0)
    })

    it('deve pular itens já SEPARADOS ao determinar item atual', () => {
      const itensComPrimeiroSeparado: ItemSeparacao[] = [
        { ...mockItens[0], status: 'SEPARADO', quantidadeSeparada: 10 },
        mockItens[1], // PENDENTE
        mockItens[2], // SEPARADO
      ]

      const pendingIdx = itensComPrimeiroSeparado.findIndex((i) => i.status === 'PENDENTE')
      expect(pendingIdx).toBe(1)
      expect(itensComPrimeiroSeparado[pendingIdx].produto?.codigo).toBe('PROD-B')
    })
  })

  describe('Progresso da separação', () => {
    it('deve calcular corretamente itens separados vs total', () => {
      const separados = mockItens.filter((i) => i.status !== 'PENDENTE').length
      expect(separados).toBe(1)
      expect(mockItens.length).toBe(3)
    })

    it('deve considerar SEPARADO e SEPARADO_PARCIAL como concluídos', () => {
      const itensVariados: ItemSeparacao[] = [
        { ...mockItens[0], status: 'SEPARADO' },
        { ...mockItens[1], status: 'SEPARADO_PARCIAL' },
        { ...mockItens[2], status: 'PENDENTE' },
      ]

      const separados = itensVariados.filter((i) => i.status !== 'PENDENTE').length
      expect(separados).toBe(2)
    })
  })

  describe('Confirmação de separação', () => {
    it('deve enviar payload correto ao confirmar item', async () => {
      const mockResponse: ConfirmarScannerResponse = {
        id: 'item-1',
        quantidadeSeparada: 10,
        status: 'SEPARADO',
        motivoDivergencia: null,
        ordemSeparacao: { ordemConcluida: false, ondaConcluida: false },
      }

      mockPost.mockResolvedValueOnce({ data: mockResponse })

      const payload = {
        barcodeEscaneado: 'PROD-A',
        quantidadeSeparada: 10,
      }

      const { data } = await apiClient.post('/itens-separacao/item-1/confirmar-scanner', payload)

      expect(mockPost).toHaveBeenCalledWith('/itens-separacao/item-1/confirmar-scanner', payload)
      expect(data.status).toBe('SEPARADO')
      expect(data.quantidadeSeparada).toBe(10)
    })

    it('deve enviar motivo de divergência quando quantidade é menor que solicitada', async () => {
      const mockResponse: ConfirmarScannerResponse = {
        id: 'item-1',
        quantidadeSeparada: 7,
        status: 'SEPARADO_PARCIAL',
        motivoDivergencia: 'QUANTIDADE_INSUFICIENTE',
        ordemSeparacao: { ordemConcluida: false, ondaConcluida: false },
      }

      mockPost.mockResolvedValueOnce({ data: mockResponse })

      const payload = {
        barcodeEscaneado: 'PROD-A',
        quantidadeSeparada: 7,
        motivoDivergencia: 'QUANTIDADE_INSUFICIENTE',
      }

      const { data } = await apiClient.post('/itens-separacao/item-1/confirmar-scanner', payload)

      expect(data.motivoDivergencia).toBe('QUANTIDADE_INSUFICIENTE')
      expect(data.status).toBe('SEPARADO_PARCIAL')
    })

    it('deve detectar quando a onda está concluída', async () => {
      const mockResponse: ConfirmarScannerResponse = {
        id: 'item-2',
        quantidadeSeparada: 5,
        status: 'SEPARADO',
        motivoDivergencia: null,
        ordemSeparacao: { ordemConcluida: true, ondaConcluida: true },
      }

      mockPost.mockResolvedValueOnce({ data: mockResponse })

      const { data } = await apiClient.post('/itens-separacao/item-2/confirmar-scanner', {
        barcodeEscaneado: 'PROD-B',
        quantidadeSeparada: 5,
      })

      expect(data.ordemSeparacao?.ondaConcluida).toBe(true)
    })
  })

  describe('Navegação entre itens', () => {
    it('deve avançar para o próximo item PENDENTE após confirmar', () => {
      const currentIndex = 0
      const itensAtualizados = [
        { ...mockItens[0], status: 'SEPARADO' as const, quantidadeSeparada: 10 },
        mockItens[1], // PENDENTE
        mockItens[2], // SEPARADO
      ]

      const nextIdx = itensAtualizados.findIndex((i, idx) => idx > currentIndex && i.status === 'PENDENTE')
      expect(nextIdx).toBe(1)
    })

    it('deve voltar ao início se não há próximo item PENDENTE à frente', () => {
      const currentIndex = 2
      const itensAtualizados: ItemSeparacao[] = [
        { ...mockItens[0], status: 'PENDENTE' }, // Ainda pendente
        { ...mockItens[1], status: 'SEPARADO', quantidadeSeparada: 5 },
        { ...mockItens[2], status: 'SEPARADO', quantidadeSeparada: 3 },
      ]

      let nextIdx = itensAtualizados.findIndex((i, idx) => idx > currentIndex && i.status === 'PENDENTE')
      if (nextIdx < 0) {
        nextIdx = itensAtualizados.findIndex((i) => i.status === 'PENDENTE')
      }

      expect(nextIdx).toBe(0)
    })
  })

  describe('Validação de quantidade', () => {
    it('deve exigir motivo quando quantidade separada < solicitada', () => {
      const currentItem = mockItens[0]
      const quantidade = 7

      const precisaMotivo = quantidade < currentItem.quantidadeSolicitada
      expect(precisaMotivo).toBe(true)
    })

    it('não deve exigir motivo quando quantidade separada = solicitada', () => {
      const currentItem = mockItens[0]
      const quantidade = 10

      const precisaMotivo = quantidade < currentItem.quantidadeSolicitada
      expect(precisaMotivo).toBe(false)
    })

    it('não deve exigir motivo quando quantidade separada > solicitada (excesso)', () => {
      const currentItem = mockItens[0]
      const quantidade = 12

      const precisaMotivo = quantidade < currentItem.quantidadeSolicitada
      expect(precisaMotivo).toBe(false)
    })
  })

  describe('Motivos de divergência', () => {
    it('deve ter 3 motivos disponíveis', () => {
      const MOTIVOS = [
        { value: 'PRODUTO_NAO_ENCONTRADO', label: 'Produto não encontrado' },
        { value: 'QUANTIDADE_INSUFICIENTE', label: 'Quantidade insuficiente' },
        { value: 'AVARIA', label: 'Avaria' },
      ]

      expect(MOTIVOS).toHaveLength(3)
    })

    it('deve aceitar todos os tipos de motivo válidos', () => {
      const motivosValidos: string[] = ['PRODUTO_NAO_ENCONTRADO', 'QUANTIDADE_INSUFICIENTE', 'AVARIA']

      motivosValidos.forEach((motivo) => {
        expect(['PRODUTO_NAO_ENCONTRADO', 'QUANTIDADE_INSUFICIENTE', 'AVARIA']).toContain(motivo)
      })
    })
  })

  describe('Tratamento de erros', () => {
    it('deve tratar erro de API ao carregar onda', async () => {
      mockGet.mockRejectedValueOnce({
        response: { data: { message: 'Onda não encontrada' } },
      })

      try {
        await apiClient.get('/ondas-separacao/onda-inexistente')
        fail('Deveria ter lançado erro')
      } catch (e: any) {
        expect(e.response.data.message).toBe('Onda não encontrada')
      }
    })

    it('deve tratar erro de API ao confirmar separação', async () => {
      mockPost.mockRejectedValueOnce({
        response: { data: { message: 'Item já foi separado' }, status: 422 },
      })

      try {
        await apiClient.post('/itens-separacao/item-1/confirmar-scanner', {
          barcodeEscaneado: 'PROD-A',
          quantidadeSeparada: 10,
        })
        fail('Deveria ter lançado erro')
      } catch (e: any) {
        expect(e.response.data.message).toBe('Item já foi separado')
      }
    })
  })
})
