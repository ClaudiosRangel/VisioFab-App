import type { EtapaRoteiro, OrdemServico, ContagemProducao } from '@/types';

export type EstadoEtapa = 'concluida' | 'atual' | 'pendente';

/** Classifica uma etapa do roteiro */
export function classificarEtapa(
  etapa: EtapaRoteiro,
  index: number,
  etapaAtualIndex: number,
): EstadoEtapa {
  if (etapa.concluida) return 'concluida';
  if (index === etapaAtualIndex) return 'atual';
  return 'pendente';
}

/** Verifica se o botão "Registrar Contagem" deve ser visível */
export function botaoContagemVisivel(os: OrdemServico): boolean {
  if (!os.roteiro?.length || os.etapaAtualIndex == null) return false;
  const etapaAtual = os.roteiro[os.etapaAtualIndex];
  return !!etapaAtual && !etapaAtual.concluida;
}

/** Filtra contagens por operadorId */
export function filtrarContagensPorOperador(
  contagens: ContagemProducao[],
  operadorId: string,
): ContagemProducao[] {
  return contagens.filter((c) => c.operadorId === operadorId);
}

/** Ordena contagens por dataHora decrescente */
export function ordenarContagensPorData(contagens: ContagemProducao[]): ContagemProducao[] {
  return [...contagens].sort((a, b) => b.dataHora.localeCompare(a.dataHora));
}

/** Filtra contagens por número da OS (case-insensitive) */
export function buscarContagensPorOS(
  contagens: ContagemProducao[],
  termo: string,
): ContagemProducao[] {
  const t = termo.trim().toLowerCase();
  if (!t) return contagens;
  return contagens.filter((c) => (c.osNumero ?? '').toLowerCase().includes(t));
}
