import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHoras, formatHoras, formatHorasDecimal } from '../src/js/horas.js';

test('parseHoras - números e decimais', () => {
  assert.equal(parseHoras(1.5), 90);
  assert.equal(parseHoras(2), 120);
  assert.equal(parseHoras('1.5'), 90);
  assert.equal(parseHoras('1,5'), 90);
  assert.equal(parseHoras('0.25'), 15);
  assert.equal(parseHoras('0,5'), 30);
  assert.equal(parseHoras('2'), 120);
});

test('parseHoras - formatos amigáveis com h e min', () => {
  assert.equal(parseHoras('1h30'), 90);
  assert.equal(parseHoras('1h 30'), 90);
  assert.equal(parseHoras('1h30min'), 90);
  assert.equal(parseHoras('1h 30m'), 90);
  assert.equal(parseHoras('2h'), 120);
  assert.equal(parseHoras('45min'), 45);
  assert.equal(parseHoras('45m'), 45);
});

test('parseHoras - formato relógio', () => {
  assert.equal(parseHoras('1:30'), 90);
  assert.equal(parseHoras('01:30'), 90);
  assert.equal(parseHoras('0:45'), 45);
});

test('parseHoras - entradas inválidas ou vazias', () => {
  assert.equal(parseHoras(null), null);
  assert.equal(parseHoras(''), null);
  assert.equal(parseHoras('abc'), null);
  assert.equal(parseHoras('-5'), null);
  assert.equal(parseHoras(-2), null);
});

test('formatHoras - exibe horas e minutos', () => {
  assert.equal(formatHoras(0), '0h');
  assert.equal(formatHoras(60), '1h');
  assert.equal(formatHoras(90), '1h30');
  assert.equal(formatHoras(45), '0h45');
  assert.equal(formatHoras(125), '2h05');
  assert.equal(formatHoras(null), '0h');
});

test('formatHorasDecimal - exibe decimal com vírgula', () => {
  assert.equal(formatHorasDecimal(0), '0h');
  assert.equal(formatHorasDecimal(60), '1h');
  assert.equal(formatHorasDecimal(90), '1,5h');
  assert.equal(formatHorasDecimal(45), '0,75h');
  assert.equal(formatHorasDecimal(120), '2h');
});
