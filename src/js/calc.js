/**
 * Regras puras de negócio para cálculo de horas complementares.
 * Sem dependência de DOM, Tauri ou bibliotecas externas.
 */

/**
 * Normaliza o status da atividade:
 * - 'aceita'
 * - 'recusada'
 * - null (representa em branco / pendente de análise)
 *
 * @param {string|null|undefined} status
 * @returns {'aceita'|'recusada'|null}
 */
export function normalizarStatus(status) {
  if (!status) return null;
  const s = String(status).trim().toLowerCase();
  if (s === 'aceita' || s === 'aprovada' || s === 'aceito') return 'aceita';
  if (s === 'recusada' || s === 'nao_aceita' || s === 'não aceita' || s === 'rejeitada') return 'recusada';
  return null;
}

/**
 * Executa todos os cálculos para os tipos e resumo geral do curso.
 *
 * Regras principais:
 * 1. Total oficial conta apenas atividades com status 'aceita'.
 * 2. Total previsto conta atividades com status 'aceita' e pendentes (null / em branco).
 * 3. Atividades 'recusadas' nunca entram em nenhum total positivo.
 * 4. Para cada tipo, as horas que ultrapassarem o 'limiteMin' viram 'excedente' daquele tipo
 *    e NÃO contam para o total acumulado do curso.
 *
 * @param {Object} params
 * @param {number} params.totalExigidoMin - Total de minutos exigido pelo curso
 * @param {Array} params.tipos - Lista de tipos de atividade [{ id, nome, limiteMin }]
 * @param {Array} params.atividades - Lista de atividades [{ id, tipoId, nome, minutos, data, status }]
 * @returns {Object} Resumo com dados calculados por tipo e totais gerais do curso
 */
export function calcularResumo({ totalExigidoMin = 0, tipos = [], atividades = [] }) {
  const exigido = Math.max(0, Number(totalExigidoMin) || 0);

  // Mapeia atividades agrupadas e calcula valores por tipo
  const tiposCalculados = tipos.map(tipo => {
    const atividadesDoTipo = atividades.filter(a => a.tipoId === tipo.id);

    let aceitas = 0;
    let pendentes = 0;
    let recusadas = 0;

    for (const a of atividadesDoTipo) {
      const min = Math.max(0, Number(a.minutos) || 0);
      const st = normalizarStatus(a.status);
      if (st === 'aceita') {
        aceitas += min;
      } else if (st === 'recusada') {
        recusadas += min;
      } else {
        pendentes += min;
      }
    }

    const previstas = aceitas + pendentes;
    const temLimite = tipo.limiteMin !== null && tipo.limiteMin !== undefined && tipo.limiteMin >= 0;
    const limite = temLimite ? Number(tipo.limiteMin) : null;

    // Horas válidas respeitando o limite do tipo
    const validas = temLimite ? Math.min(aceitas, limite) : aceitas;
    const validasPrevistas = temLimite ? Math.min(previstas, limite) : previstas;

    // Excedentes dentro do tipo
    const excedente = temLimite ? Math.max(0, aceitas - limite) : 0;
    const excedentePrevisto = temLimite ? Math.max(0, previstas - limite) : 0;

    // Faltante para atingir o limite específico do tipo (se houver limite)
    const faltanteTipo = temLimite ? Math.max(0, limite - validas) : 0;
    const faltanteTipoPrevisto = temLimite ? Math.max(0, limite - validasPrevistas) : 0;

    const progressoTipo = temLimite && limite > 0 ? Math.min(1, validas / limite) : (validas > 0 ? 1 : 0);

    return {
      id: tipo.id,
      nome: tipo.nome,
      limiteMin: limite,
      temLimite,
      aceitas,
      pendentes,
      recusadas,
      previstas,
      validas,
      validasPrevistas,
      excedente,
      excedentePrevisto,
      faltanteTipo,
      faltanteTipoPrevisto,
      progressoTipo,
      atividades: atividadesDoTipo,
      totalAtividades: atividadesDoTipo.length
    };
  });

  // Totais do curso: somam apenas as horas válidas de cada tipo
  const totalOficial = tiposCalculados.reduce((acc, t) => acc + t.validas, 0);
  const totalPrevisto = tiposCalculados.reduce((acc, t) => acc + t.validasPrevistas, 0);
  const totalExcedenteTipos = tiposCalculados.reduce((acc, t) => acc + t.excedente, 0);

  const faltante = Math.max(0, exigido - totalOficial);
  const faltantePrevisto = Math.max(0, exigido - totalPrevisto);

  const excedenteCurso = Math.max(0, totalOficial - exigido);
  const excedenteCursoPrevisto = Math.max(0, totalPrevisto - exigido);

  const progresso = exigido > 0 ? Math.min(1, totalOficial / exigido) : 0;
  const progressoPrevisto = exigido > 0 ? Math.min(1, totalPrevisto / exigido) : 0;

  return {
    totalExigidoMin: exigido,
    totalOficial,
    totalPrevisto,
    totalExcedenteTipos,
    faltante,
    faltantePrevisto,
    excedenteCurso,
    excedenteCursoPrevisto,
    progresso,
    progressoPrevisto,
    concluido: exigido > 0 && totalOficial >= exigido,
    concluidoPrevisto: exigido > 0 && totalPrevisto >= exigido,
    porTipo: tiposCalculados
  };
}
