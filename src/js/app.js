import { store } from './store.js';
import { calcularResumo } from './calc.js';
import { parseHoras, formatHoras } from './horas.js';

// --- Toast Feedback ---
function mostrarToast(mensagem, tipo = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;

  const icone = tipo === 'success' ? '✔' : tipo === 'error' ? '✖' : 'ℹ';
  toast.innerHTML = `<span>${icone}</span><span>${escapeHtml(mensagem)}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- Gerenciador de Navegação ---
let viewAtual = 'home';

function mudarView(nomeView) {
  viewAtual = nomeView;

  // Atualizar botões da sidebar
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === nomeView);
  });

  // Atualizar seções
  document.querySelectorAll('.view').forEach(v => {
    v.classList.toggle('active', v.id === `view-${nomeView}`);
  });

  // Atualizar título do topo
  const titleEl = document.getElementById('page-title');
  const subtitleEl = document.getElementById('page-subtitle');

  switch (nomeView) {
    case 'home':
      titleEl.textContent = 'Resumo de Horas';
      subtitleEl.textContent = 'Acompanhe seu progresso e exigências do curso';
      break;
    case 'tipos':
      titleEl.textContent = 'Tipos de Atividades';
      subtitleEl.textContent = 'Grupos aceitos pela faculdade e limites de horas';
      break;
    case 'atividades':
      titleEl.textContent = 'Lançar Atividades';
      subtitleEl.textContent = 'Cadastre e gerencie suas atividades complementares realizadas';
      break;
    case 'relatorio':
      titleEl.textContent = 'Relatório Geral';
      subtitleEl.textContent = 'Visão completa separada por grupos e pronta para impressão';
      break;
    case 'config':
      titleEl.textContent = 'Configurações & Backup';
      subtitleEl.textContent = 'Defina a meta do curso e gerencie a segurança dos seus dados';
      break;
  }

  renderizarTudo();
}

// --- Renderizadores de Tela ---

function renderizarHome(resumo, dados) {
  // Sidebar info
  const sidebarCursoEl = document.getElementById('sidebar-curso-nome');
  if (sidebarCursoEl) sidebarCursoEl.textContent = dados.curso || 'Meu Curso';

  // Cards de resumo
  document.getElementById('card-exigido').textContent = formatHoras(resumo.totalExigidoMin);
  document.getElementById('card-oficial').textContent = formatHoras(resumo.totalOficial);
  document.getElementById('card-previsto').textContent = formatHoras(resumo.totalPrevisto);

  const cardFaltanteEl = document.getElementById('card-faltante');
  const cardFaltanteLabelEl = document.getElementById('card-faltante-label');
  const cardFaltanteSubEl = document.getElementById('card-faltante-sub');
  const cardFaltanteWrapper = document.getElementById('card-faltante-wrapper');

  if (resumo.concluido) {
    cardFaltanteWrapper.className = 'card card-success';
    cardFaltanteLabelEl.textContent = 'Meta Concluída!';
    if (resumo.excedenteCurso > 0) {
      cardFaltanteEl.textContent = `+${formatHoras(resumo.excedenteCurso)}`;
      cardFaltanteSubEl.textContent = 'Horas além do exigido';
    } else {
      cardFaltanteEl.textContent = '100%';
      cardFaltanteSubEl.textContent = 'Exigência atingida com sucesso';
    }
  } else {
    cardFaltanteWrapper.className = 'card card-warning';
    cardFaltanteLabelEl.textContent = 'Horas Faltantes';
    cardFaltanteEl.textContent = formatHoras(resumo.faltante);
    cardFaltanteSubEl.textContent = resumo.faltantePrevisto < resumo.faltante
      ? `Previsto faltar: ${formatHoras(resumo.faltantePrevisto)}`
      : 'Para atingir a meta';
  }

  // Progresso
  const percOficial = Math.round(resumo.progresso * 100);
  const percPrevisto = Math.round(resumo.progressoPrevisto * 100);

  const barFill = document.getElementById('progresso-bar-fill');
  const barPrevisto = document.getElementById('progresso-bar-previsto');
  const percentText = document.getElementById('progresso-percent-text');

  barFill.style.width = `${percOficial}%`;
  barFill.classList.toggle('concluido', resumo.concluido);
  barPrevisto.style.width = `${percPrevisto}%`;
  percentText.textContent = `${percOficial}% concluído`;

  const legendExcedente = document.getElementById('legend-excedente-curso');
  if (legendExcedente) {
    legendExcedente.style.display = resumo.concluido ? 'flex' : 'none';
  }

  // Tabela Home Tipos
  const tbody = document.getElementById('tabela-home-tipos');
  if (tbody) {
    if (resumo.porTipo.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--neutral-400); padding: 24px;">Nenhum tipo de atividade cadastrado ainda.</td></tr>`;
      return;
    }

    tbody.innerHTML = resumo.porTipo.map(t => {
      const limiteTexto = t.temLimite ? formatHoras(t.limiteMin) : '<span style="color: var(--neutral-400);">Sem limite</span>';
      const excedenteHtml = t.excedente > 0
        ? `<span class="badge badge-excedente" title="Excedeu o limite do tipo e não conta no total do curso">+${formatHoras(t.excedente)} excedente</span>`
        : `<span style="color: var(--neutral-400);">-</span>`;

      const percTipo = Math.round(t.progressoTipo * 100);

      return `
        <tr>
          <td><strong>${escapeHtml(t.nome)}</strong></td>
          <td>${formatHoras(t.aceitas)}</td>
          <td>${limiteTexto}</td>
          <td><strong style="color: var(--primary);">${formatHoras(t.validas)}</strong></td>
          <td>${excedenteHtml}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="flex: 1; height: 6px; background: var(--neutral-100); border-radius: 999px; overflow: hidden; max-width: 120px;">
                <div style="height: 100%; width: ${percTipo}%; background: ${t.validas >= (t.limiteMin || 0) && t.temLimite ? 'var(--success)' : 'var(--primary)'}; border-radius: 999px;"></div>
              </div>
              <span style="font-size: 11px; color: var(--neutral-500);">${percTipo}%</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
}

function renderizarTipos(resumo, dados) {
  const tbody = document.getElementById('tabela-tipos');
  if (!tbody) return;

  if (resumo.porTipo.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--neutral-400); padding: 24px;">Nenhum tipo cadastrado. Clique no botão acima para adicionar.</td></tr>`;
    return;
  }

  tbody.innerHTML = resumo.porTipo.map(t => {
    const limiteTexto = t.temLimite ? formatHoras(t.limiteMin) : '<span style="color: var(--neutral-400);">Sem limite</span>';
    return `
      <tr>
        <td><strong>${escapeHtml(t.nome)}</strong></td>
        <td>${limiteTexto}</td>
        <td>${t.totalAtividades} atividade(s)</td>
        <td>${formatHoras(t.aceitas)}</td>
        <td><strong style="color: var(--primary);">${formatHoras(t.validas)}</strong></td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm btn-editar-tipo" data-id="${t.id}">Editar</button>
          <button class="btn btn-danger btn-sm btn-excluir-tipo" data-id="${t.id}" style="margin-left: 6px;">Excluir</button>
        </td>
      </tr>
    `;
  }).join('');

  // Atualizar select do filtro e modal
  atualizarSelectsDeTipos(dados.tipos);
}

function atualizarSelectsDeTipos(tipos) {
  const selectFiltro = document.getElementById('filtro-tipo');
  const selectModal = document.getElementById('atividade-tipo-id');

  const valorFiltroAtual = selectFiltro ? selectFiltro.value : '';
  const valorModalAtual = selectModal ? selectModal.value : '';

  if (selectFiltro) {
    selectFiltro.innerHTML = `<option value="">Todos os tipos</option>` +
      tipos.map(t => `<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join('');
    selectFiltro.value = valorFiltroAtual;
  }

  if (selectModal) {
    selectModal.innerHTML = `<option value="">Selecione um tipo...</option>` +
      tipos.map(t => `<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join('');
    selectModal.value = valorModalAtual;
  }
}

function renderizarAtividades(resumo, dados) {
  const tbody = document.getElementById('tabela-atividades');
  if (!tbody) return;

  const filtroBusca = (document.getElementById('filtro-busca')?.value || '').toLowerCase().trim();
  const filtroTipo = document.getElementById('filtro-tipo')?.value || '';
  const filtroStatus = document.getElementById('filtro-status')?.value || '';

  const listaFiltrada = dados.atividades.filter(a => {
    if (filtroBusca && !a.nome.toLowerCase().includes(filtroBusca)) return false;
    if (filtroTipo && a.tipoId !== filtroTipo) return false;
    if (filtroStatus) {
      if (filtroStatus === 'pendente' && a.status !== null) return false;
      if (filtroStatus !== 'pendente' && a.status !== filtroStatus) return false;
    }
    return true;
  });

  if (listaFiltrada.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--neutral-400); padding: 24px;">Nenhuma atividade encontrada com os filtros atuais.</td></tr>`;
    return;
  }

  tbody.innerHTML = listaFiltrada.map(a => {
    const tipo = dados.tipos.find(t => t.id === a.tipoId);
    const tipoNome = tipo ? tipo.nome : '<i style="color:var(--danger)">Tipo removido</i>';

    let badgeStatus = '';
    if (a.status === 'aceita') {
      badgeStatus = `<span class="badge badge-aceita btn-status-click" data-id="${a.id}" title="Clique para alterar status">✔ Aceita</span>`;
    } else if (a.status === 'recusada') {
      badgeStatus = `<span class="badge badge-recusada btn-status-click" data-id="${a.id}" title="Clique para alterar status">✖ Não aceita</span>`;
    } else {
      badgeStatus = `<span class="badge badge-pendente btn-status-click" data-id="${a.id}" title="Clique para alterar status">⏳ Em branco</span>`;
    }

    const dataFormatada = a.data ? a.data.split('-').reverse().join('/') : '<span style="color:var(--neutral-400)">-</span>';

    return `
      <tr>
        <td style="white-space: nowrap; font-size: 12px; color: var(--neutral-500);">${dataFormatada}</td>
        <td><span style="font-weight: 500;">${escapeHtml(tipoNome)}</span></td>
        <td><strong>${escapeHtml(a.nome)}</strong></td>
        <td><strong>${formatHoras(a.minutos)}</strong></td>
        <td>
          <div style="cursor: pointer; display: inline-block;">
            ${badgeStatus}
          </div>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-secondary btn-sm btn-editar-atividade" data-id="${a.id}">Editar</button>
          <button class="btn btn-danger btn-sm btn-excluir-atividade" data-id="${a.id}" style="margin-left: 6px;">Excluir</button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderizarRelatorio(resumo, dados) {
  const container = document.getElementById('relatorio-conteudo-grupos');
  if (!container) return;

  const printCursoInfo = document.getElementById('print-curso-info');
  if (printCursoInfo) {
    printCursoInfo.textContent = `Curso: ${dados.curso} | Exigido: ${formatHoras(resumo.totalExigidoMin)} | Feito Oficial: ${formatHoras(resumo.totalOficial)} | Status: ${resumo.concluido ? 'CONCLUÍDO' : `Faltam ${formatHoras(resumo.faltante)}`}`;
  }

  if (resumo.porTipo.length === 0) {
    container.innerHTML = `<div class="section-panel" style="padding: 24px; text-align: center; color: var(--neutral-400);">Nenhum tipo de atividade cadastrado para emitir relatório.</div>`;
    return;
  }

  container.innerHTML = resumo.porTipo.map(t => {
    const limiteTexto = t.temLimite ? formatHoras(t.limiteMin) : 'Ilimitado';
    const excedenteTexto = t.excedente > 0 ? ` | Excedente: +${formatHoras(t.excedente)}` : '';

    let linhasAtividades = '';
    if (t.atividades.length === 0) {
      linhasAtividades = `<tr><td colspan="4" style="text-align: center; color: var(--neutral-400); padding: 16px;">Nenhuma atividade lançada neste tipo.</td></tr>`;
    } else {
      linhasAtividades = t.atividades.map(a => {
        let statusBadge = '';
        if (a.status === 'aceita') statusBadge = '<span class="badge badge-aceita">Aceita</span>';
        else if (a.status === 'recusada') statusBadge = '<span class="badge badge-recusada">Não aceita</span>';
        else statusBadge = '<span class="badge badge-pendente">Em branco</span>';

        const dataStr = a.data ? a.data.split('-').reverse().join('/') : '-';

        return `
          <tr>
            <td style="width: 100px; color: var(--neutral-500); font-size: 12px;">${dataStr}</td>
            <td><strong>${escapeHtml(a.nome)}</strong></td>
            <td style="width: 100px;"><strong>${formatHoras(a.minutos)}</strong></td>
            <td style="width: 120px;">${statusBadge}</td>
          </tr>
        `;
      }).join('');
    }

    return `
      <div class="relatorio-grupo">
        <div class="relatorio-grupo-header">
          <div>
            <span class="relatorio-grupo-titulo">${escapeHtml(t.nome)}</span>
            <div style="font-size: 12px; color: var(--neutral-500); margin-top: 2px;">
              Limite: ${limiteTexto} | Aproveitadas: <strong>${formatHoras(t.validas)}</strong>${excedenteTexto}
            </div>
          </div>
          <div class="relatorio-grupo-metricas">
            <span>Total Cadastrado: <strong>${formatHoras(t.aceitas + t.pendentes + t.recusadas)}</strong></span>
            <span>Aceitas: <strong style="color: var(--success);">${formatHoras(t.aceitas)}</strong></span>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Atividade</th>
                <th>Horas</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${linhasAtividades}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');
}

function renderizarConfig(resumo, dados) {
  const inputCurso = document.getElementById('config-curso-nome');
  const inputTotal = document.getElementById('config-total-horas');

  if (inputCurso && document.activeElement !== inputCurso) {
    inputCurso.value = dados.curso || '';
  }
  if (inputTotal && document.activeElement !== inputTotal) {
    inputTotal.value = formatHoras(dados.totalExigidoMin);
  }
}

function renderizarTudo() {
  const dados = store.dados;
  const resumo = calcularResumo({
    totalExigidoMin: dados.totalExigidoMin,
    tipos: dados.tipos,
    atividades: dados.atividades
  });

  renderizarHome(resumo, dados);
  renderizarTipos(resumo, dados);
  renderizarAtividades(resumo, dados);
  renderizarRelatorio(resumo, dados);
  renderizarConfig(resumo, dados);
}

// --- Modais de Tipo ---

function abrirModalTipo(tipo = null) {
  const modal = document.getElementById('modal-tipo');
  const title = document.getElementById('modal-tipo-title');
  const idInput = document.getElementById('tipo-id');
  const nomeInput = document.getElementById('tipo-nome');
  const limiteInput = document.getElementById('tipo-limite');

  if (tipo) {
    title.textContent = 'Editar Tipo de Atividade';
    idInput.value = tipo.id;
    nomeInput.value = tipo.nome;
    limiteInput.value = tipo.limiteMin !== null ? formatHoras(tipo.limiteMin) : '';
  } else {
    title.textContent = 'Novo Tipo de Atividade';
    idInput.value = '';
    nomeInput.value = '';
    limiteInput.value = '';
  }

  modal.classList.add('active');
  setTimeout(() => nomeInput.focus(), 50);
}

function fecharModalTipo() {
  document.getElementById('modal-tipo')?.classList.remove('active');
}

// --- Modais de Atividade ---

function abrirModalAtividade(atv = null) {
  const modal = document.getElementById('modal-atividade');
  const title = document.getElementById('modal-atividade-title');
  const idInput = document.getElementById('atividade-id');
  const tipoSelect = document.getElementById('atividade-tipo-id');
  const nomeInput = document.getElementById('atividade-nome');
  const horasInput = document.getElementById('atividade-horas');
  const dataInput = document.getElementById('atividade-data');
  const statusSelect = document.getElementById('atividade-status');

  atualizarSelectsDeTipos(store.dados.tipos);

  if (atv) {
    title.textContent = 'Editar Atividade Lançada';
    idInput.value = atv.id;
    tipoSelect.value = atv.tipoId;
    nomeInput.value = atv.nome;
    horasInput.value = formatHoras(atv.minutos);
    dataInput.value = atv.data || '';
    statusSelect.value = atv.status || '';
  } else {
    title.textContent = 'Lançar Atividade Feita';
    idInput.value = '';
    if (store.dados.tipos.length > 0) {
      tipoSelect.value = store.dados.tipos[0].id;
    }
    nomeInput.value = '';
    horasInput.value = '';
    dataInput.value = new Date().toISOString().split('T')[0];
    statusSelect.value = '';
  }

  modal.classList.add('active');
  setTimeout(() => nomeInput.focus(), 50);
}

function fecharModalAtividade() {
  document.getElementById('modal-atividade')?.classList.remove('active');
}

// --- Inicialização e Event Listeners ---

document.addEventListener('DOMContentLoaded', async () => {
  // Inicializa o store
  await store.inicializar();

  // Escutar alterações do store
  store.subscribe(() => {
    renderizarTudo();
  });

  // Atualizar badge do footer caso seja Tauri
  const footerMode = document.getElementById('footer-storage-mode');
  if (footerMode) {
    footerMode.textContent = store.isTauri ? 'Desktop Nativo (Tauri)' : 'Armazenamento Local';
  }

  // Navegação
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      mudarView(btn.dataset.view);
    });
  });

  document.getElementById('btn-ir-tipos')?.addEventListener('click', () => {
    mudarView('tipos');
  });

  // Formulário Config
  document.getElementById('form-config')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const curso = document.getElementById('config-curso-nome').value;
    const totalStr = document.getElementById('config-total-horas').value;

    const minutos = parseHoras(totalStr);
    if (minutos === null) {
      mostrarToast('Formato de horas inválido. Ex: 200h, 150 ou 180.5', 'error');
      return;
    }

    try {
      await store.atualizarConfig({ curso, totalExigidoMin: minutos });
      mostrarToast('Configurações salvas com sucesso!');
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  });

  // CRUD Tipos
  document.getElementById('btn-novo-tipo')?.addEventListener('click', () => {
    abrirModalTipo();
  });

  document.getElementById('btn-fechar-modal-tipo')?.addEventListener('click', fecharModalTipo);
  document.getElementById('btn-cancelar-tipo')?.addEventListener('click', fecharModalTipo);

  document.getElementById('form-tipo')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('tipo-id').value;
    const nome = document.getElementById('tipo-nome').value;
    const limiteStr = document.getElementById('tipo-limite').value.trim();

    let limiteMin = null;
    if (limiteStr) {
      limiteMin = parseHoras(limiteStr);
      if (limiteMin === null) {
        mostrarToast('Formato do limite inválido. Ex: 60h, 40 ou 12h30', 'error');
        return;
      }
    }

    try {
      if (id) {
        await store.atualizarTipo(id, { nome, limiteMin });
        mostrarToast('Tipo de atividade atualizado com sucesso!');
      } else {
        await store.adicionarTipo({ nome, limiteMin });
        mostrarToast('Tipo de atividade cadastrado com sucesso!');
      }
      fecharModalTipo();
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  });

  document.getElementById('tabela-tipos')?.addEventListener('click', async (e) => {
    const btnEditar = e.target.closest('.btn-editar-tipo');
    if (btnEditar) {
      const tipo = store.getTipoPorId(btnEditar.dataset.id);
      if (tipo) abrirModalTipo(tipo);
      return;
    }

    const btnExcluir = e.target.closest('.btn-excluir-tipo');
    if (btnExcluir) {
      const id = btnExcluir.dataset.id;
      const tipo = store.getTipoPorId(id);
      if (!tipo) return;

      if (confirm(`Tem certeza que deseja excluir o tipo "${tipo.nome}"?`)) {
        try {
          await store.excluirTipo(id);
          mostrarToast('Tipo excluído com sucesso.');
        } catch (err) {
          mostrarToast(err.message, 'error');
        }
      }
    }
  });

  // CRUD Atividades
  document.getElementById('btn-nova-atividade')?.addEventListener('click', () => {
    if (store.dados.tipos.length === 0) {
      mostrarToast('Cadastre ao menos um tipo de atividade antes de lançar horas.', 'warning');
      mudarView('tipos');
      return;
    }
    abrirModalAtividade();
  });

  document.getElementById('btn-fechar-modal-atividade')?.addEventListener('click', fecharModalAtividade);
  document.getElementById('btn-cancelar-atividade')?.addEventListener('click', fecharModalAtividade);

  document.getElementById('form-atividade')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('atividade-id').value;
    const tipoId = document.getElementById('atividade-tipo-id').value;
    const nome = document.getElementById('atividade-nome').value;
    const horasStr = document.getElementById('atividade-horas').value;
    const data = document.getElementById('atividade-data').value;
    const status = document.getElementById('atividade-status').value;

    const minutos = parseHoras(horasStr);
    if (minutos === null || minutos <= 0) {
      mostrarToast('Informe uma quantidade de horas válida maior que zero (ex: 20h, 1h30).', 'error');
      return;
    }

    try {
      if (id) {
        await store.atualizarAtividade(id, { tipoId, nome, minutos, data, status });
        mostrarToast('Atividade atualizada com sucesso!');
      } else {
        await store.adicionarAtividade({ tipoId, nome, minutos, data, status });
        mostrarToast('Atividade lançada com sucesso!');
      }
      fecharModalAtividade();
    } catch (err) {
      mostrarToast(err.message, 'error');
    }
  });

  // Ações na tabela de atividades (Editar, Excluir e Clique para alternar status com 1 clique)
  document.getElementById('tabela-atividades')?.addEventListener('click', async (e) => {
    // Alternar status
    const btnStatus = e.target.closest('.btn-status-click');
    if (btnStatus) {
      const id = btnStatus.dataset.id;
      const atv = store.getAtividadePorId(id);
      if (atv) {
        // Ciclo rápido: null -> 'aceita' -> 'recusada' -> null
        let proximo = 'aceita';
        if (atv.status === 'aceita') proximo = 'recusada';
        else if (atv.status === 'recusada') proximo = null;

        await store.alternarStatusAtividade(id, proximo);
        const label = proximo === 'aceita' ? 'Aceita' : proximo === 'recusada' ? 'Não aceita' : 'Em branco';
        mostrarToast(`Status alterado para: ${label}`);
      }
      return;
    }

    const btnEditar = e.target.closest('.btn-editar-atividade');
    if (btnEditar) {
      const atv = store.getAtividadePorId(btnEditar.dataset.id);
      if (atv) abrirModalAtividade(atv);
      return;
    }

    const btnExcluir = e.target.closest('.btn-excluir-atividade');
    if (btnExcluir) {
      const id = btnExcluir.dataset.id;
      const atv = store.getAtividadePorId(id);
      if (!atv) return;

      if (confirm(`Excluir o lançamento "${atv.nome}" (${formatHoras(atv.minutos)})?`)) {
        await store.excluirAtividade(id);
        mostrarToast('Atividade removida com sucesso.');
      }
    }
  });

  // Filtros de atividades
  document.getElementById('filtro-busca')?.addEventListener('input', () => {
    renderizarAtividades(calcularResumo(store.dados), store.dados);
  });
  document.getElementById('filtro-tipo')?.addEventListener('change', () => {
    renderizarAtividades(calcularResumo(store.dados), store.dados);
  });
  document.getElementById('filtro-status')?.addEventListener('change', () => {
    renderizarAtividades(calcularResumo(store.dados), store.dados);
  });

  // Relatório - Impressão
  document.getElementById('btn-imprimir-relatorio')?.addEventListener('click', () => {
    window.print();
  });

  // Exportar Backup JSON
  document.getElementById('btn-exportar-backup')?.addEventListener('click', () => {
    const jsonStr = store.exportarJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dataHora = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `backup_horas_complementares_${dataHora}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast('Backup exportado com sucesso!');
  });

  // Importar Backup JSON
  document.getElementById('input-importar-backup')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Deseja realmente restaurar este backup? Os dados atuais serão substituídos pelos do arquivo.')) {
      e.target.value = '';
      return;
    }

    try {
      const texto = await file.text();
      await store.importarJSON(texto);
      mostrarToast('Backup restaurado com sucesso!');
      mudarView('home');
    } catch (err) {
      mostrarToast(err.message, 'error');
    } finally {
      e.target.value = '';
    }
  });

  // Carregar dados de exemplo
  document.getElementById('btn-carregar-exemplo')?.addEventListener('click', async () => {
    if (!confirm('Deseja carregar dados de demonstração para testar o sistema?')) return;

    const exemplo = {
      versao: 1,
      curso: 'Ciência da Computação',
      totalExigidoMin: 12000, // 200h
      tipos: [
        { id: 't_cursos', nome: 'Cursos Online e Extensão', limiteMin: 3600 }, // Limite 60h
        { id: 't_eventos', nome: 'Congressos e Palestras', limiteMin: 2400 },  // Limite 40h
        { id: 't_social', nome: 'Projetos Sociais e Voluntariado', limiteMin: null } // Sem limite
      ],
      atividades: [
        { id: 'a1', tipoId: 't_cursos', nome: 'Curso de Python Avançado', minutos: 2400, data: '2026-03-10', status: 'aceita' }, // 40h
        { id: 'a2', tipoId: 't_cursos', nome: 'Curso de Docker e Kubernetes', minutos: 1800, data: '2026-04-15', status: 'aceita' }, // 30h (atingiu 70h, passa 10h do limite de 60h!)
        { id: 'a3', tipoId: 't_eventos', nome: 'Semana Acadêmica de TI', minutos: 1200, data: '2026-05-20', status: 'aceita' }, // 20h
        { id: 'a4', tipoId: 't_eventos', nome: 'Palestra de Cibersegurança', minutos: 300, data: '2026-06-05', status: null }, // 5h pendente
        { id: 'a5', tipoId: 't_social', nome: 'Aulas de Inclusão Digital na Comunidade', minutos: 1800, data: '2026-07-12', status: 'aceita' }, // 30h
        { id: 'a6', tipoId: 't_cursos', nome: 'Curso de Desenho Gráfico', minutos: 600, data: '2026-08-01', status: 'recusada' } // 10h recusada
      ]
    };

    await store.importarJSON(JSON.stringify(exemplo));
    mostrarToast('Dados de exemplo carregados com sucesso!');
    mudarView('home');
  });

  // Render inicial
  renderizarTudo();
});
