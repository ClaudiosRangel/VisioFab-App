// ─── Permissões ───────────────────────────────────────────────────────────────
export interface Permissoes {
  web_dashboard: boolean;
  web_importacao: boolean;
  web_maquinas: boolean;
  web_usuarios: boolean;
  web_relatorios: boolean;
  app_contagem: boolean;
  app_estoque_mp: boolean;
  app_camera_ocr: boolean;
  app_historico: boolean;
}

// ─── Níveis de acesso ────────────────────────────────────────────────────────
export type NivelAcesso = 'diretor' | 'administrador' | 'gerente' | 'operador';

// ─── Usuário ─────────────────────────────────────────────────────────────────
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  nivel: NivelAcesso;
  ativo: boolean;
  permissoes: Permissoes;
  processosIds?: string[];
  criadoEm: string;
  atualizadoEm: string;
}

// ─── Etapa do Roteiro ────────────────────────────────────────────────────────
export interface EtapaRoteiro {
  maquinaId: string;
  maquinaNome: string;
  ordem: number;
  concluida: boolean;
  concluidaEm?: string;
}

// ─── Ordem de Serviço ────────────────────────────────────────────────────────
export interface OrdemServico {
  id: string;
  maquinaId: string;
  os: string;
  cliente: string;
  produto: string;
  status: string;
  qtd: number;
  tiragem: number;
  entrega: string;
  matriz: string;
  qtdCores: number;
  tipoOp: string;
  pantone1: string;
  pantone2: string;
  pantone3: string;
  roteiro?: EtapaRoteiro[];
  etapaAtualIndex?: number;
  processoAtualId?: string;
  statusProducao: string;
  criadaEm: string;
  atualizadaEm: string;
}

// ─── Contagem de Produção ────────────────────────────────────────────────────
export interface ContagemProducao {
  id: string;
  osId: string;
  maquinaId: string;
  operadorId: string;
  operadorNome?: string;
  contadorInicial: number;
  contadorFinal: number;
  producaoCalculada: number;
  origemLeitura: 'manual' | 'ocr';
  fotoNumerador?: string;
  dataHora: string;
  etapaIndex: number;
  osNumero?: string;
  maquinaNome?: string;
  processoId?: string;
  criadaEm: string;
  atualizadaEm: string;
}
