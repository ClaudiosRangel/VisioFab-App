import { useState, useCallback, useMemo } from 'react';
import { listarDocumentosComFiltro, listarDocumentos } from '@/services/firestoreService';
import { useAuth } from '@/context/AuthContext';
import type { OrdemServico, ContagemProducao } from '@/types';
import {
  isOSFinalizada,
  progresso,
  maquinaAtual,
  ordenarPorEntrega,
  buscarOS,
} from '@/utils/ordensUtils';

// Re-export for backward compatibility
export { isOSFinalizada, progresso, maquinaAtual } from '@/utils/ordensUtils';

type Aba = 'pendentes' | 'finalizadas';

export default function useOrdens() {
  const { usuario } = useAuth();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');
  const [aba, setAba] = useState<Aba>('pendentes');
  const [semProcesso, setSemProcesso] = useState(false);

  const carregar = useCallback(async () => {
    const ids = usuario?.processosIds ?? [];
    if (!ids.length) {
      setOrdens([]);
      setSemProcesso(true);
      return;
    }
    setSemProcesso(false);
    try {
      const dados = await listarDocumentosComFiltro<OrdemServico>(
        'ordens_servico', 'processoAtualId', 'in', ids,
      );
      const emProd = dados.filter(
        (o) => o.statusProducao === 'Em Produção' || o.statusProducao === 'Finalizado',
      );

      const contagens = await listarDocumentos<ContagemProducao>('contagens_producao');
      const meuId = usuario?.id ?? '';

      const disponiveis = emProd.filter((os) => {
        if (isOSFinalizada(os)) return true;
        const idx = os.etapaAtualIndex ?? 0;
        return !contagens.find(
          (c) => c.osId === os.id && c.etapaIndex === idx && c.operadorId !== meuId,
        );
      });

      setOrdens(ordenarPorEntrega(disponiveis));
    } catch {
      /* lista vazia */
    }
  }, [usuario]);

  const iniciar = useCallback(async () => {
    setLoading(true);
    await carregar();
    setLoading(false);
  }, [carregar]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }, [carregar]);

  const pendentes = useMemo(() => ordens.filter((o) => !isOSFinalizada(o)), [ordens]);
  const finalizadas = useMemo(() => ordens.filter((o) => isOSFinalizada(o)), [ordens]);

  const listaAtual = aba === 'pendentes' ? pendentes : finalizadas;

  const filtradas = useMemo(() => buscarOS(listaAtual, busca), [listaAtual, busca]);

  return {
    loading, refreshing, busca, setBusca, aba, setAba,
    semProcesso, pendentes, finalizadas, filtradas,
    iniciar, onRefresh,
  };
}
