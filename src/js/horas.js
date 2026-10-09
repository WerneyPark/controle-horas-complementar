/**
 * Utilitários para conversão e formatação de horas / minutos.
 * Armazenamento interno é sempre em minutos inteiros para evitar problemas de ponto flutuante.
 */

/**
 * Converte string ou número para minutos inteiros.
 * Suporta formatos:
 * - "1.5" ou "1,5" -> 90
 * - "1h30", "1h 30", "1h30min", "1h 30m" -> 90
 * - "1:30" -> 90
 * - "2h", "2" -> 120
 * - "45min", "45m" -> 45
 * Retorna null se formato for inválido ou menor que 0.
 *
 * @param {string|number} input
 * @returns {number|null}
 */
export function parseHoras(input) {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') {
    if (isNaN(input) || input < 0) return null;
    return Math.round(input * 60);
  }

  const str = String(input).trim().toLowerCase();
  if (!str) return null;

  // Formato tipo "45min" ou "45m" (sem hora)
  const minOnlyMatch = str.match(/^(\d+)\s*(?:min|m)$/);
  if (minOnlyMatch) {
    const mins = parseInt(minOnlyMatch[1], 10);
    return isNaN(mins) || mins < 0 ? null : mins;
  }

  // Formato tipo "1h30", "1h 30min", "1h 30m", "2h"
  const hMinMatch = str.match(/^(\d+)\s*h(?:\s*(\d+)(?:\s*(?:min|m))?)?$/);
  if (hMinMatch) {
    const horas = parseInt(hMinMatch[1], 10);
    const mins = hMinMatch[2] ? parseInt(hMinMatch[2], 10) : 0;
    if (isNaN(horas) || isNaN(mins) || horas < 0 || mins < 0) return null;
    return horas * 60 + mins;
  }

  // Formato relógio "1:30" ou "01:30"
  const clockMatch = str.match(/^(\d+):(\d{1,2})$/);
  if (clockMatch) {
    const horas = parseInt(clockMatch[1], 10);
    const mins = parseInt(clockMatch[2], 10);
    if (isNaN(horas) || isNaN(mins) || horas < 0 || mins < 0) return null;
    return horas * 60 + mins;
  }

  // Formato decimal com vírgula ou ponto: "1.5", "1,5", "2"
  const decimalNormalized = str.replace(',', '.');
  if (/^\d+(\.\d+)?$/.test(decimalNormalized)) {
    const horasFloat = parseFloat(decimalNormalized);
    if (isNaN(horasFloat) || horasFloat < 0) return null;
    return Math.round(horasFloat * 60);
  }

  return null;
}

/**
 * Formata minutos inteiros para texto amigável: ex: 90 -> "1h30", 120 -> "2h", 45 -> "0h45", 0 -> "0h".
 * @param {number|null|undefined} minutos
 * @returns {string}
 */
export function formatHoras(minutos) {
  if (minutos === null || minutos === undefined || isNaN(minutos)) return '0h';
  const total = Math.max(0, Math.round(minutos));
  const h = Math.floor(total / 60);
  const m = total % 60;

  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

/**
 * Formata minutos inteiros para decimal com vírgula: ex: 90 -> "1,5h", 120 -> "2h".
 * @param {number|null|undefined} minutos
 * @returns {string}
 */
export function formatHorasDecimal(minutos) {
  if (minutos === null || minutos === undefined || isNaN(minutos)) return '0h';
  const total = Math.max(0, Math.round(minutos));
  const horasFloat = total / 60;
  // Se for inteiro: 2h
  if (horasFloat % 1 === 0) return `${horasFloat}h`;
  // Formatar com até 2 casas decimais, retirando zeros finais
  const str = horasFloat.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
  return `${str}h`;
}
