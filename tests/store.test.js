import test from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../src/js/store.js';

test('store - adicionar tipo e bloquear exclusão se houver atividades vinculadas', async () => {
  await store.restaurarExemploPadrao();

  // Adiciona novo tipo
  const tipo = await store.adicionarTipo({ nome: 'Monitoria Acadêmica', limiteMin: 1800 });
  assert.ok(tipo.id);
  assert.equal(tipo.nome, 'Monitoria Acadêmica');
  assert.equal(tipo.limiteMin, 1800);

  // Adiciona atividade vinculada a esse tipo
  const atv = await store.adicionarAtividade({
    tipoId: tipo.id,
    nome: 'Monitoria de Algoritmos',
    minutos: 600,
    data: '2026-03-01',
    status: 'aceita'
  });
  assert.ok(atv.id);

  // Tentar excluir tipo deve lançar erro
  await assert.rejects(
    async () => {
      await store.excluirTipo(tipo.id);
    },
    /Não é possível excluir este tipo porque existem 1 atividade\(s\) cadastrada\(s\)/
  );

  // Remove a atividade primeiro
  await store.excluirAtividade(atv.id);

  // Agora a exclusão do tipo deve funcionar com sucesso
  await store.excluirTipo(tipo.id);
  assert.equal(store.getTipoPorId(tipo.id), null);
});

test('store - exportar e importar backup com validação', async () => {
  await store.restaurarExemploPadrao();
  await store.atualizarConfig({ curso: 'Engenharia Civil', totalExigidoMin: 18000 });

  const backupJson = store.exportarJSON();
  const parsed = JSON.parse(backupJson);
  assert.equal(parsed.curso, 'Engenharia Civil');
  assert.equal(parsed.totalExigidoMin, 18000);

  // Tentar importar JSON corrompido deve falhar
  await assert.rejects(
    async () => {
      await store.importarJSON('{ formato: invalido ');
    },
    /Arquivo de backup inválido/
  );

  // Importar backup válido
  const novoBackup = JSON.stringify({
    versao: 1,
    curso: 'Administração',
    totalExigidoMin: 9000,
    tipos: [{ id: 't_adm', nome: 'Estágio Extra', limiteMin: null }],
    atividades: [{ id: 'a_adm', tipoId: 't_adm', nome: 'Consultoria', minutos: 1200, status: 'aceita' }]
  });

  await store.importarJSON(novoBackup);
  assert.equal(store.dados.curso, 'Administração');
  assert.equal(store.dados.totalExigidoMin, 9000);
  assert.equal(store.dados.tipos.length, 1);
  assert.equal(store.dados.atividades.length, 1);
});
