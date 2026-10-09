# ⏱️ Controle de Horas Complementares

Aplicativo desktop **ultra leve e rápido** (~116 KB) para gerenciamento completo de horas complementares universitárias.

---

## 🚀 Como Iniciar o Aplicativo

Existem duas formas fáceis de abrir:

1. **Atalho na Área de Trabalho:** Dê dois cliques em **`Controle de Horas Complementares`** na sua Área de Trabalho.
2. **Ou pelo executável na pasta:** Dê dois cliques no arquivo **[`Iniciar.bat`](./Iniciar.bat)** nesta pasta.

O aplicativo abrirá em uma janela nativa e independente na sua tela, sem barras de navegador.

---

## 🎯 Principais Funcionalidades

### 1. 🏠 Resumo de Horas (Home)
- **Exigido pelo Curso:** visualização da meta total do seu curso.
- **Horas Feitas (Oficial):** soma apenas as horas de atividades com status **Aceita** (dentro do limite permitido por cada tipo).
- **Total Previsto:** soma oficial + atividades em análise (em branco).
- **Horas Faltantes:** cálculo automático de quanto falta para cumprir o curso. Se ultrapassar, exibe o **Excedente do Curso** com selo verde de Meta Cumprida.
- **Barra de Progresso:** acompanha visualmente a meta oficial e a previsão.
- **Aproveitamento por Tipo:** tabela que mostra o que foi feito, o limite de cada tipo, o que foi aproveitado e se houve **excedente individual** (o excedente do tipo é destacado e **não conta** para o total do curso, exatamente como solicitado!).

### 2. 🗂️ Tipos de Atividades
- Cadastre os grupos de atividades aceitos pela faculdade (ex: Cursos Online, Palestras, Voluntariado, Estágio Extra).
- Defina o **limite máximo de horas** para cada tipo (deixe em branco se a faculdade não impõe limite para aquele tipo).
- Altere ou exclua tipos (o sistema protege seus dados e bloqueia a exclusão caso ainda existam atividades lançadas naquele tipo).

### 3. ➕ Lançar Atividades
- Escolha o tipo de atividade.
- Digite o nome da atividade (ex: *Curso de Inglês Avançado*).
- Digite a quantidade de horas com total flexibilidade (aceita formatos como `20h`, `1,5`, `1.5`, `1h30`, `45min` ou formato relógio `1:30`).
- Informe a data da atividade.
- Escolha a validação:
  - **Em branco:** aguardando análise da coordenação (entra no Total Previsto).
  - **Aceita:** aprovada pela faculdade (entra no Total Oficial).
  - **Não aceita:** recusada (não conta em nenhum total).
- Alterne o status com **um clique** diretamente na tabela!
- Filtros rápidos por texto, tipo e status.

### 4. 📊 Relatório Completo
- Exibe todas as suas atividades agrupadas por tipo, com os subtotais, limites, aproveitamento e excedentes.
- Botão **Imprimir / Salvar PDF** já configurado para folha A4 limpa e profissional para entregar na faculdade.

### 5. ⚙️ Configurações & Backup
- Altere o nome do curso e a meta total exigida.
- **Exportar Backup (JSON):** baixa um arquivo com todos os seus dados para você guardar com total segurança no seu Google Drive, e-mail ou pendrive.
- **Importar Backup:** restaura seus dados a qualquer momento em caso de troca de computador.
- **Carregar Dados de Exemplo:** permite testar o aplicativo com dados prontos.

---

## 🧪 Testes Automatizados
O projeto conta com suíte completa de testes unitários sem dependências externas:
```bash
npm test
```
- Testa conversão e formatos flexíveis de horas (`parseHoras`, `formatHoras`).
- Testa regras matemáticas de teto por tipo, excedente não computado e regras do curso.
- Testa persistência, integridade do modelo de dados e restauração de backup.
