import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contagemSchema, type ContagemFormValues } from '@/schemas/contagemSchema';
import { obterDocumento, listarDocumentos } from '@/services/firestoreService';
import { finalizarEtapa, registrarContagemParcial } from '@/services/contagemService';
import { useAuth } from '@/context/AuthContext';
import type { OrdemServico, ContagemProducao } from '@/types';

interface Params {
  osId: string;
  etapaIndex: number;
}

export default function useContagem({ osId, etapaIndex }: Params) {
  const { usuario } = useAuth();

  const [os, setOS] = useState<OrdemServico | null>(null);
  const [contagens, setContagens] = useState<ContagemProducao[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  const { control, handleSubmit, formState, watch, reset } = useForm<ContagemFormValues>({
    resolver: zodResolver(contagemSchema),
    defaultValues: { contadorInicial: undefined, contadorFinal: undefined },
    mode: 'onChange',
  });

  // Real-time calculation
  const contadorInicial = watch('contadorInicial');
  const contadorFinal = watch('contadorFinal');

  const producaoCalculada =
    typeof contadorInicial === 'number' &&
    typeof contadorFinal === 'number' &&
    contadorFinal >= contadorInicial
      ? contadorFinal - contadorInicial
      : null;

  const totalJaProduzido = contagens.reduce((acc, c) => acc + c.producaoCalculada, 0);

  // Load OS + contagens on mount
  const carregar = useCallback(async () => {
    try {
      const doc = await obterDocumento<OrdemServico>('ordens_servico', osId);
      setOS(doc);
      const todas = await listarDocumentos<ContagemProducao>('contagens_producao');
      setContagens(
        todas
          .filter((c) => c.osId === osId && c.etapaIndex === etapaIndex)
          .sort((a, b) => a.dataHora.localeCompare(b.dataHora)),
      );
    } catch {
      setErro('Erro ao carregar OS');
    } finally {
      setLoading(false);
    }
  }, [osId, etapaIndex]);

  useEffect(() => {
    if (osId) carregar();
    else setLoading(false);
  }, [carregar, osId]);

  // Register partial count (does NOT finalize the step)
  const salvarContagem = useCallback(async (): Promise<{ ok: boolean; erro?: string }> => {
    if (!os || !usuario) return { ok: false, erro: 'Dados insuficientes' };

    const valores = watch();
    if (typeof valores.contadorInicial !== 'number' || typeof valores.contadorFinal !== 'number') {
      return { ok: false, erro: 'Preencha os campos corretamente' };
    }

    setSaving(true);
    setErro('');

    try {
      await registrarContagemParcial({
        osId,
        os,
        operadorId: usuario.id,
        operadorNome: usuario.nome,
        contadorInicial: valores.contadorInicial,
        contadorFinal: valores.contadorFinal,
        etapaIndex,
      });
      reset({ contadorInicial: undefined, contadorFinal: undefined });
      setLoading(true);
      await carregar();
      return { ok: true };
    } catch (e: any) {
      const msg = e?.message || 'Erro ao salvar contagem';
      setErro(msg);
      return { ok: false, erro: msg };
    } finally {
      setSaving(false);
    }
  }, [os, usuario, osId, etapaIndex, watch, reset, carregar]);

  // Finalization — called AFTER user confirms via Alert.alert
  const executarFinalizacao = useCallback(async (): Promise<{ ok: boolean; erro?: string }> => {
    if (!os || !usuario) return { ok: false, erro: 'Dados insuficientes' };

    // Use last contagem values for finalization (contadorFinal = contadorInicial = last final)
    const ult = contagens.length > 0 ? contagens[contagens.length - 1] : null;
    const cIni = ult ? ult.contadorFinal : 0;

    setSaving(true);
    setErro('');

    try {
      await finalizarEtapa({
        osId,
        os,
        operadorId: usuario.id,
        operadorNome: usuario.nome,
        contadorInicial: cIni,
        contadorFinal: cIni,
        etapaIndex,
      });
      return { ok: true };
    } catch (e: any) {
      const msg = e?.message || 'Erro ao finalizar etapa';
      setErro(msg);
      return { ok: false, erro: msg };
    } finally {
      setSaving(false);
    }
  }, [os, usuario, osId, etapaIndex, contagens]);

  return {
    os,
    contagens,
    loading,
    saving,
    erro,
    producaoCalculada,
    totalJaProduzido,
    salvarContagem,
    executarFinalizacao,
    control,
    handleSubmit,
    formState,
    watch,
  };
}
