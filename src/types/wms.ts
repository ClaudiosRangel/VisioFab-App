// ─── Auth ────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  nome: string
  email: string
  perfil: string
  empresaId: string
}

export interface LoginResponse {
  token: string
  usuario: AuthUser
}

// ─── Ordem de Serviço WMS ────────────────────────────────────────────────
export interface OrdemServicoWms {
  id: string
  numero: number
  tipo: 'ENTRADA' | 'SAIDA'
  operacao: 'CONFERENCIA' | 'ENDERECAMENTO' | 'SEPARACAO' | 'EMBALAGEM' | 'CARREGAMENTO'
  status: 'ABERTO' | 'EXECUTANDO' | 'CONCLUIDO'
  funcionarioId: string | null
  notaEntradaId: string | null
  agendaWmsId: string | null
  ondaSeparacaoId: string | null
  carregamentoId: string | null
  horaInicio: string | null
  horaFim: string | null
  notaEntrada?: { numero: number; fornecedor: string | null } | null
  funcionario?: { nome: string; matricula: string } | null
}

export interface OSPendentesResponse {
  data: OrdemServicoWms[]
  total: number
}

// ─── Conferência de Entrada ──────────────────────────────────────────────
export interface ItemNotaEntrada {
  id: string
  item: number
  descricao: string
  codigoProduto: string | null
  unidade: string | null
  lote: string | null
}

export interface IniciarConferenciaResponse {
  nota: {
    id: string
    numero: number
    serie: string | null
    fornecedor: string | null
    fornecedorDoc: string | null
    status: string
  }
  itens: ItemNotaEntrada[]
}

export interface ConferirBarrasResponse {
  itemId: string
  descricao: string
  codigoProduto: string
  quantidadeNota: number
  quantidadeConferida: number
  divergencia: number
  status: 'CONFORME' | 'DIVERGENTE'
  tipoDivergencia: 'FALTA' | 'EXCESSO' | null
}

// ─── Endereçamento ───────────────────────────────────────────────────────
export interface ValidarLocalizacaoResponse {
  valido: boolean
  mensagem?: string
  endereco?: { id: string; enderecoCompleto: string }
}

export interface ValidarProdutoResponse {
  valido: boolean
  produtoEsperado: { id: string; nome: string; codigo: string; ean: string | null }
  barcodeEscaneado: string
  mensagem?: string
}

export interface ConfirmarEnderecamentoResponse {
  message: string
  enderecoCompleto: string
  produto: string
  quantidade: number
}

// ─── Separação ───────────────────────────────────────────────────────────
export interface ItemSeparacao {
  id: string
  produtoId: string
  produto?: { codigo: string; nome: string; unidade: string } | null
  enderecoOrigem?: { enderecoCompleto: string } | null
  quantidadeSolicitada: number
  quantidadeSeparada: number
  status: 'PENDENTE' | 'SEPARADO' | 'SEPARADO_PARCIAL'
}

export type MotivoDivergencia = 'PRODUTO_NAO_ENCONTRADO' | 'QUANTIDADE_INSUFICIENTE' | 'AVARIA'

export interface ConfirmarScannerResponse {
  id: string
  quantidadeSeparada: number
  status: string
  motivoDivergencia: MotivoDivergencia | null
  ordemSeparacao?: { ordemConcluida: boolean; ondaConcluida: boolean } | null
}

// ─── Embalagem ───────────────────────────────────────────────────────────
export interface ItemVolume {
  id: string
  volumeId: string
  itemSeparacaoId: string
  quantidade: number
}

// ─── Carregamento ────────────────────────────────────────────────────────
export interface Carregamento {
  id: string
  veiculoPlaca: string
  status: string
  totalVolumes: number
  volumesCarregados: number
}

export interface CarregarScannerResponse {
  id: string
  volumeCodigo: number
  avisoSequencia?: string
  carregamentoConcluido: boolean
  progresso: { totalVolumes: number; volumesCarregados: number }
}

// ─── Conferência de Saída ────────────────────────────────────────────────
export interface ConferirSaidaScannerResponse {
  id: string
  resultado: 'CONFORME' | 'DIVERGENTE'
  tipoDivergencia: 'FALTA' | 'EXCESSO' | null
  conferenciaFinalizada: boolean
  progresso: { totalItens: number; conferidos: number }
}

// ─── Inventário ──────────────────────────────────────────────────────────
export interface Inventario {
  id: string
  numero: number
  tipo: 'GERAL' | 'PARCIAL' | 'CICLICO'
  status: 'ABERTO' | 'EM_CONTAGEM' | 'CONCLUIDO'
}

export interface ItemInventario {
  id: string
  enderecoId: string
  produtoId: string
  saldoSistema: number
  saldoContado: number | null
  divergencia: number | null
  status: 'PENDENTE' | 'CONFORME' | 'DIVERGENTE'
  produto?: { id: string; codigo: string; nome: string } | null
  endereco?: { id: string; enderecoCompleto: string } | null
}

export interface ContarItemResponse {
  id: string
  saldoSistema: number
  saldoContado: number
  divergencia: number
  status: 'CONFORME' | 'DIVERGENTE'
}

// ─── Progress ────────────────────────────────────────────────────────────
export interface OperationProgress {
  current: number
  total: number
  percentage: number
}

// ─── API Error ───────────────────────────────────────────────────────────
export interface ApiError {
  message: string
  statusCode: number
}

// ─── Barcode Types ───────────────────────────────────────────────────────
export type BarcodeType = 'code128' | 'ean13' | 'qr'

// ─── Feedback ────────────────────────────────────────────────────────────
export type FeedbackType = 'success' | 'error' | 'warning'

// ─── Navigation ──────────────────────────────────────────────────────────
export type RootStackParamList = {
  Login: undefined
  Main: undefined
}

export type MainStackParamList = {
  Home: undefined
  Settings: undefined
  ListaOSPendentes: undefined
  HistoricoOS: undefined
  ConferenciaEntrada: { notaId: string; osId?: string }
  Enderecamento: { notaEntradaId: string; osId?: string }
  Separacao: { ondaSeparacaoId: string; osId?: string }
  Embalagem: { volumeId: string; ondaSeparacaoId: string; osId?: string }
  Carregamento: { carregamentoId: string; osId?: string }
  ConferenciaSaida: { conferenciaSaidaId: string; osId?: string }
  Inventario: { inventarioId: string; osId?: string }
}
