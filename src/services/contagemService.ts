import { criarDocumento, atualizarDocumento } from './firestoreService';
import type { OrdemServico, ContagemProducao } from '../types';

export interface ContagemParams {
  osId: string;
  os: OrdemServico;
  operadorId: string;
  operadorNome: string;
  contadorInicial: number;
  contadorFinal: number;
  etapaIndex: number;
}

export async function registrarContagemParcial(params: ContagemParams): Promise<void> {
  const { osId, os, operadorId, operadorNome, contadorInicial, contadorFinal, etapaIndex } = params;
  const etapa = os.roteiro![etapaIndex];
  const agora = new Date().toISOString();

  await criarDocumento<ContagemProducao>('contagens_producao', {
    osId,
    maquinaId: etapa.maquinaId,
    operadorId,
    operadorNome,
    processoId: os.processoAtualId ?? '',
    contadorInicial,
    contadorFinal,
    producaoCalculada: contadorFinal - contadorInicial,
    origemLeitura: 'manual',
    dataHora: agora,
    etapaIndex,
    osNumero: os.os,
    maquinaNome: etapa.maquinaNome,
  });
}

export async function finalizarEtapa(params: ContagemParams): Promise<void> {
  const { osId, os, operadorId, operadorNome, contadorInicial, contadorFinal, etapaIndex } = params;
  const etapa = os.roteiro![etapaIndex];
  const agora = new Date().toISOString();

  await criarDocumento<ContagemProducao>('contagens_producao', {
    osId,
    maquinaId: etapa.maquinaId,
    operadorId,
    operadorNome,
    processoId: os.processoAtualId ?? '',
    contadorInicial,
    contadorFinal,
    producaoCalculada: contadorFinal - contadorInicial,
    origemLeitura: 'manual',
    dataHora: agora,
    etapaIndex,
    osNumero: os.os,
    maquinaNome: etapa.maquinaNome,
  });

  const roteiro = [...os.roteiro!];
  roteiro[etapaIndex] = { ...roteiro[etapaIndex], concluida: true, concluidaEm: agora };

  const isUltima = etapaIndex >= roteiro.length - 1;
  const novoIndex = isUltima ? etapaIndex : etapaIndex + 1;

  try {
    await atualizarDocumento<OrdemServico>('ordens_servico', osId, {
      roteiro,
      etapaAtualIndex: novoIndex,
      maquinaId: roteiro[novoIndex].maquinaId,
    });
  } catch {
    throw new Error('Contagem salva, mas houve erro ao atualizar a OS. Contate o supervisor.');
  }
}
