/**
 * Gerenciador de estado e persistência de dados.
 * Suporta persistência nativa via Tauri (arquivo seguro em AppData)
 * e fallback automático para localStorage em ambiente web / dev.
 */

const STORAGE_KEY = 'controle_horas_complementares_dados_v1';

const ESTADO_PADRAO = {
  versao: 1,
  curso: 'Meu Curso',
  totalExigidoMin: 12000, // 200h por padrão
  tipos: [
    { id: 'tipo_1', nome: 'Cursos Online / Extensão', limiteMin: 3600 }, // 60h limite
    { id: 'tipo_2', nome: 'Palestras e Congressos', limiteMin: 2400 },   // 40h limite
    { id: 'tipo_3', nome: 'Atividades Voluntárias', limiteMin: null }    // Sem limite
  ],
  atividades: []
};

class Store {
  constructor() {
    this.dados = JSON.parse(JSON.stringify(ESTADO_PADRAO));
    this.listeners = new Set();
    this.isTauri = false;
  }

  /**
   * Registra uma função para ser chamada sempre que os dados mudarem.
   * @param {Function} fn
   * @returns {Function} Função para desinscrever
   */
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    for (const fn of this.listeners) {
      try {
        fn(this.dados);
      } catch (e) {
        console.error('Erro em listener do store:', e);
      }
    }
  }

  /**
   * Invoca comando Tauri se disponível.
   */
  async invokeTauri(comando, args = {}) {
    if (window.__TAURI__?.core?.invoke) {
      return await window.__TAURI__.core.invoke(comando, args);
    }
    if (window.__TAURI__?.invoke) {
      return await window.__TAURI__.invoke(comando, args);
    }
    return null;
  }

  /**
   * Inicializa e carrega os dados do Tauri ou localStorage.
   */
  async inicializar() {
    this.isTauri = !!(window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke);

    let carregado = null;

    if (this.isTauri) {
      try {
        const conteudo = await this.invokeTauri('carregar_dados');
        if (conteudo) {
          carregado = JSON.parse(conteudo);
        }
      } catch (err) {
        console.warn('Falha ao carregar dados do Tauri, tentando localStorage:', err);
      }
    }

    if (!carregado) {
      try {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          carregado = JSON.parse(local);
        }
      } catch (err) {
        console.warn('Falha ao ler localStorage:', err);
      }
    }

    if (carregado && typeof carregado === 'object') {
      this.dados = {
        versao: carregado.versao || 1,
        curso: carregado.curso || 'Meu Curso',
        totalExigidoMin: typeof carregado.totalExigidoMin === 'number' ? carregado.totalExigidoMin : 12000,
        tipos: Array.isArray(carregado.tipos) ? carregado.tipos : [],
        atividades: Array.isArray(carregado.atividades) ? carregado.atividades : []
      };
    } else {
      // Salva o padrão inicial
      await this.salvar();
    }

    this.notify();
    return this.dados;
  }

  /**
   * Salva os dados atuais.
   */
  async salvar() {
    const jsonStr = JSON.stringify(this.dados, null, 2);

    // Salva sempre no localStorage para redundância/cache rápido
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, jsonStr);
      } catch (e) {
        console.warn('Não foi possível salvar no localStorage:', e);
      }
    }

    // Salva no arquivo via Tauri
    if (this.isTauri) {
      try {
        await this.invokeTauri('salvar_dados', { conteudo: jsonStr });
      } catch (e) {
        console.error('Erro ao salvar dados no Tauri:', e);
      }
    }

    this.notify();
  }

  // --- Operações de Configuração ---

  async atualizarConfig({ curso, totalExigidoMin }) {
    if (curso !== undefined) this.dados.curso = String(curso).trim();
    if (totalExigidoMin !== undefined) {
      this.dados.totalExigidoMin = Math.max(0, Math.round(Number(totalExigidoMin) || 0));
    }
    await this.salvar();
  }

  // --- Operações de Tipos ---

  getTipos() {
    return this.dados.tipos;
  }

  getTipoPorId(id) {
    return this.dados.tipos.find(t => t.id === id) || null;
  }

  async adicionarTipo({ nome, limiteMin }) {
    const nomeLimpo = String(nome || '').trim();
    if (!nomeLimpo) throw new Error('O nome do tipo de atividade é obrigatório.');

    // Verificar se já existe com mesmo nome (case-insensitive)
    const jaExiste = this.dados.tipos.some(t => t.nome.toLowerCase() === nomeLimpo.toLowerCase());
    if (jaExiste) throw new Error(`Já existe um tipo cadastrado com o nome "${nomeLimpo}".`);

    const limite = (limiteMin !== null && limiteMin !== undefined && limiteMin !== '')
      ? Math.max(0, Math.round(Number(limiteMin)))
      : null;

    const novo = {
      id: 'tipo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      nome: nomeLimpo,
      limiteMin: limite
    };

    this.dados.tipos.push(novo);
    await this.salvar();
    return novo;
  }

  async atualizarTipo(id, { nome, limiteMin }) {
    const tipo = this.getTipoPorId(id);
    if (!tipo) throw new Error('Tipo de atividade não encontrado.');

    const nomeLimpo = String(nome || '').trim();
    if (!nomeLimpo) throw new Error('O nome do tipo de atividade é obrigatório.');

    const duplicado = this.dados.tipos.some(t => t.id !== id && t.nome.toLowerCase() === nomeLimpo.toLowerCase());
    if (duplicado) throw new Error(`Já existe outro tipo cadastrado com o nome "${nomeLimpo}".`);

    const limite = (limiteMin !== null && limiteMin !== undefined && limiteMin !== '')
      ? Math.max(0, Math.round(Number(limiteMin)))
      : null;

    tipo.nome = nomeLimpo;
    tipo.limiteMin = limite;

    await this.salvar();
    return tipo;
  }

  async excluirTipo(id) {
    const atividadesVinculadas = this.dados.atividades.filter(a => a.tipoId === id);
    if (atividadesVinculadas.length > 0) {
      throw new Error(
        `Não é possível excluir este tipo porque existem ${atividadesVinculadas.length} atividade(s) cadastrada(s) nele. Remova ou altere as atividades primeiro.`
      );
    }

    this.dados.tipos = this.dados.tipos.filter(t => t.id !== id);
    await this.salvar();
  }

  // --- Operações de Atividades ---

  getAtividades() {
    return this.dados.atividades;
  }

  getAtividadePorId(id) {
    return this.dados.atividades.find(a => a.id === id) || null;
  }

  async adicionarAtividade({ tipoId, nome, minutos, data, status }) {
    const nomeLimpo = String(nome || '').trim();
    if (!nomeLimpo) throw new Error('O nome da atividade é obrigatório.');

    if (!tipoId || !this.getTipoPorId(tipoId)) {
      throw new Error('Selecione um tipo de atividade válido.');
    }

    const min = Math.round(Number(minutos) || 0);
    if (min <= 0) throw new Error('Informe uma quantidade de horas maior que zero.');

    const nova = {
      id: 'atv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      tipoId,
      nome: nomeLimpo,
      minutos: min,
      data: data ? String(data).trim() : '',
      status: (status === 'aceita' || status === 'recusada') ? status : null
    };

    this.dados.atividades.unshift(nova);
    await this.salvar();
    return nova;
  }

  async atualizarAtividade(id, { tipoId, nome, minutos, data, status }) {
    const atv = this.getAtividadePorId(id);
    if (!atv) throw new Error('Atividade não encontrada.');

    const nomeLimpo = String(nome || '').trim();
    if (!nomeLimpo) throw new Error('O nome da atividade é obrigatório.');

    if (!tipoId || !this.getTipoPorId(tipoId)) {
      throw new Error('Selecione um tipo de atividade válido.');
    }

    const min = Math.round(Number(minutos) || 0);
    if (min <= 0) throw new Error('Informe uma quantidade de horas maior que zero.');

    atv.tipoId = tipoId;
    atv.nome = nomeLimpo;
    atv.minutos = min;
    atv.data = data ? String(data).trim() : '';
    atv.status = (status === 'aceita' || status === 'recusada') ? status : null;

    await this.salvar();
    return atv;
  }

  async alternarStatusAtividade(id, novoStatus) {
    const atv = this.getAtividadePorId(id);
    if (!atv) throw new Error('Atividade não encontrada.');

    atv.status = (novoStatus === 'aceita' || novoStatus === 'recusada') ? novoStatus : null;
    await this.salvar();
    return atv;
  }

  async excluirAtividade(id) {
    this.dados.atividades = this.dados.atividades.filter(a => a.id !== id);
    await this.salvar();
  }

  // --- Backup e Restauração ---

  exportarJSON() {
    return JSON.stringify(this.dados, null, 2);
  }

  async importarJSON(conteudoTexto) {
    let parsed;
    try {
      parsed = JSON.parse(conteudoTexto);
    } catch (e) {
      throw new Error('Arquivo de backup inválido: formato JSON corrompido.');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Arquivo de backup inválido: formato incompatível.');
    }

    if (!Array.isArray(parsed.tipos) || !Array.isArray(parsed.atividades)) {
      throw new Error('Arquivo de backup inválido: não contém a estrutura esperada de tipos e atividades.');
    }

    this.dados = {
      versao: parsed.versao || 1,
      curso: String(parsed.curso || 'Meu Curso'),
      totalExigidoMin: typeof parsed.totalExigidoMin === 'number' ? parsed.totalExigidoMin : 12000,
      tipos: parsed.tipos,
      atividades: parsed.atividades
    };

    await this.salvar();
    return this.dados;
  }

  async restaurarExemploPadrao() {
    this.dados = JSON.parse(JSON.stringify(ESTADO_PADRAO));
    await this.salvar();
  }
}

export const store = new Store();
