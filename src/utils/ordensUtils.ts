import type { OrdemServico } from '@/types';

/** Filtra OS por statusProducao */
export function filtrarOSPorStatus(ordens: OrdemServico[], status: string): OrdemServico[] {
  return ordens.filter((o) => o.statusProducao === status);
}

/** Verifica se a OS tem roteiro completo ou status Finalizado */
export function isOSFinalizada(os: OrdemServico): boolean {
  return (
    os.statusProducao === 'Finalizado' ||
    (!!os.roteiro?.length && os.roteiro.every((e) => e.concluida))
  );
}

/** Retorna string de progresso "N/T" (etapas concluídas / total) */
export function progresso(os: OrdemServico): string {
  if (!os.roteiro?.length) return '0/0';
  return `${os.roteiro.filter((e) => e.concluida).length}/${os.roteiro.length}`;
}

/** Retorna o nome da máquina da etapa atual */
export function maquinaAtual(os: OrdemServico): string {
  if (!os.roteiro?.length || os.etapaAtualIndex == null) return '-';
  return os.roteiro[os.etapaAtualIndex]?.maquinaNome ?? '-';
}

/** Ordena OS por data de entrega crescente */
export function ordenarPorEntrega(ordens: OrdemServico[]): OrdemServico[] {
  return [...ordens].sort((a, b) => a.entrega.localeCompare(b.entrega));
}

/** Filtra OS por termo de busca (os, cliente, produto) case-insensitive */
export function buscarOS(ordens: OrdemServico[], termo: string): OrdemServico[] {
  const t = termo.trim().toLowerCase();
  if (!t) return ordens;
  return ordens.filter(
    (o) =>
      o.os.toLowerCase().includes(t) ||
      o.cliente.toLowerCase().includes(t) ||
      o.produto.toLowerCase().includes(t),
  );
}
