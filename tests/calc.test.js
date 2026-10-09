import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularResumo, normalizarStatus } from '../src/js/calc.js';

test('normalizarStatus - variações de texto', () => {
  assert.equal(normalizarStatus('aceita'), 'aceita');
  assert.equal(normalizarStatus('Aceita'), 'aceita');
  assert.equal(normalizarStatus('aprovada'), 'aceita');
  assert.equal(normalizarStatus('recusada'), 'recusada');
  assert.equal(normalizarStatus('não aceita'), 'recusada');
  assert.equal(normalizarStatus(null), null);
  assert.equal(normalizarStatus(''), null);
});

test('calcularResumo - cenário básico sem limites', () => {
  const tipos = [
    { id: 't1', nome: 'Palestras', limiteMin: null }
  ];
  const atividades = [
    { id: 'a1', tipoId: 't1', nome: 'Palestra IA', minutos: 120, status: 'aceita' },
    { id: 'a2', tipoId: 't1', nome: 'Palestra Web', minutos: 60, status: null }, // em branco
    { id: 'a3', tipoId: 't1', nome: 'Palestra Cancelada', minutos: 180, status: 'recusada' }
  ];

  const res = calcularResumo({ totalExigidoMin: 300, tipos, atividades });

  // Oficial: só a1 (120)
  assert.equal(res.totalOficial, 120);
  // Previsto: a1 (120) + a2 (60) = 180
  assert.equal(res.totalPrevisto, 180);
  // Faltante oficial: 300 - 120 = 180
  assert.equal(res.faltante, 180);
  // Faltante previsto: 300 - 180 = 120
  assert.equal(res.faltantePrevisto, 120);
  assert.equal(res.excedenteCurso, 0);
  assert.equal(res.concluido, false);

  const t1 = res.porTipo[0];
  assert.equal(t1.aceitas, 120);
  assert.equal(t1.pendentes, 60);
  assert.equal(t1.recusadas, 180);
  assert.equal(t1.validas, 120);
  assert.equal(t1.excedente, 0);
});

test('calcularResumo - tipo com limite ultrapassado (excedente não conta no curso)', () => {
  const tipos = [
    { id: 't1', nome: 'Cursos Online', limiteMin: 3600 }, // limite 60h
    { id: 't2', nome: 'Extensão', limiteMin: 6000 }      // limite 100h
  ];

  const atividades = [
    // Aluno fez 80h de cursos online (ultrapassou o limite de 60h em 20h)
    { id: 'a1', tipoId: 't1', nome: 'Curso 1', minutos: 2400, status: 'aceita' }, // 40h
    { id: 'a2', tipoId: 't1', nome: 'Curso 2', minutos: 2400, status: 'aceita' }, // 40h
    // Aluno fez 30h de extensão
    { id: 'a3', tipoId: 't2', nome: 'Projeto Social', minutos: 1800, status: 'aceita' } // 30h
  ];

  // Curso exige 100h (6000 min)
  const res = calcularResumo({ totalExigidoMin: 6000, tipos, atividades });

  const t1 = res.porTipo[0];
  assert.equal(t1.aceitas, 4800); // 80h
  assert.equal(t1.validas, 3600); // travado em 60h
  assert.equal(t1.excedente, 1200); // 20h excedentes

  const t2 = res.porTipo[1];
  assert.equal(t2.aceitas, 1800); // 30h
  assert.equal(t2.validas, 1800);
  assert.equal(t2.excedente, 0);

  // Total do curso: t1 (60h / 3600min) + t2 (30h / 1800min) = 90h (5400min)
  // O excedente de 20h do t1 NÃO entra no total do curso!
  assert.equal(res.totalOficial, 5400);
  assert.equal(res.totalExcedenteTipos, 1200);
  assert.equal(res.faltante, 600); // falta 10h (600min)
  assert.equal(res.excedenteCurso, 0);
  assert.equal(res.concluido, false);
});

test('calcularResumo - conclusão e excedente geral do curso', () => {
  const tipos = [
    { id: 't1', nome: 'Cursos', limiteMin: 6000 },
    { id: 't2', nome: 'Eventos', limiteMin: 6000 }
  ];
  const atividades = [
    { id: 'a1', tipoId: 't1', nome: 'Curso 1', minutos: 6000, status: 'aceita' }, // 100h
    { id: 'a2', tipoId: 't2', nome: 'Evento 1', minutos: 3000, status: 'aceita' }  // 50h
  ];

  // Curso exige 120h (7200 min), aluno tem 150h válidas (9000 min)
  const res = calcularResumo({ totalExigidoMin: 7200, tipos, atividades });

  assert.equal(res.totalOficial, 9000);
  assert.equal(res.faltante, 0);
  assert.equal(res.excedenteCurso, 1800); // 30h excedentes no curso
  assert.equal(res.concluido, true);
  assert.equal(res.progresso, 1);
});
