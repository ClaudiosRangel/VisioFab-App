import { useState, useCallback, useMemo } from 'react';
import { listarDocumentosComFiltro } from '@/services/firestoreService';
import { useAuth } from '@/context/AuthContext';
import { ordenarContagensPorData, buscarContagensPorOS } from '@/utils/roteiroUtils';
import type { ContagemProducao } from '@/types';

export default function useHistorico() {
  const { usuario } = useAuth();
  const [contagens, setContagens] = useState<ContagemProducao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');

  const carregar = useCallback(async () => {
    if (!usuario) return;
    try {
      const dados = await listarDocumentosComFiltro<ContagemProducao>(
        'contagens_producao', 'operadorId', '==', usuario.id,
      );
      setContagens(ordenarContagensPorData(dados));
    } catch {
      /* silently */
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

  const filtradas = useMemo(
    () => buscarContagensPorOS(contagens, busca),
    [contagens, busca],
  );

  return { loading, refreshing, busca, setBusca, filtradas, iniciar, onRefresh };
}
