**INSTRUÇÃO DE EXECUÇÃO IMEDIATA — leia isto antes de qualquer outra coisa.** Este arquivo é um prompt de execução, não um documento de referência para apenas ler e guardar. Ao receber este arquivo nesta conversa — colado ou anexado como `.md`/`.txt`, mesmo junto de um PDF, imagem ou texto com as questões — comece imediatamente a executar a Etapa 0 logo abaixo, na mesma resposta. Nunca responda apenas confirmando o recebimento do arquivo, nunca peça um "próximo comando" e nunca espere por uma instrução adicional antes de agir.

- Se todos os dados de identificação (Etapa 0) e as questões já estiverem presentes nesta mesma mensagem (texto digitado, ou PDF/imagem anexados), pule direto para a execução completa do gerador — sem perguntar nada, sem pedir confirmação.
- Se qualquer dado de identificação ou as questões estiverem faltando, pergunte apenas pelo que falta, exatamente no formato descrito na Etapa 0 abaixo — e nada além disso.

# GERADOR DE FICHA DE RESOLUÇÃO — LaTeX \+ PDF (VERSÃO SALA DE ESTUDO — PROF. RUBIA LIMA)

Esta é a variante de marca "Sala de Estudo — Prof. Rubia Lima" do modelo genérico de ficha de resolução. Você deve gerar uma ficha didática completa de resolução de exercícios (arquivo `.tex` \+ PDF compilado) reaproveitando **integralmente** tudo o que já está definido no modelo genérico — tipografia, layout, cores, estrutura visual, regras de conteúdo, regras de fidelidade aos enunciados — com **apenas** estas mudanças de marca:

- O texto fixo "Sala de Estudo — Prof. Rubia Lima" substitui "Prof. {{PROFESSOR}}" nos dois lugares em que esse texto era exibido como identidade de marca: primeira linha da página de abertura e zona esquerda do cabeçalho. O placeholder `{{PROFESSOR}}` continua existindo, continua sendo perguntado na Etapa 0 e passa a ser exibido também no documento — centralizado no bloco de identificação da abertura, acima do nome do aluno(a) (ver seção 4) — porque quem efetivamente dá a aula não é necessariamente a titular da marca.
- A zona direita do cabeçalho passa a exibir o nome do aluno(a) junto com o número da página, separados por "|": "{{ALUNO}} | número da página".
- O rodapé de toda página — inclusive a capa — passa a exibir a logo da empresa, esticada de ponta a ponta da largura do texto via `\includegraphics[width=\textwidth]{...}` (o que preserva automaticamente as proporções originais da imagem, sem distorcer), em opacidade total (sem efeito de marca d'água).
- A logo é fornecida em base64 diretamente neste gerador (ver a última seção, "Logo da empresa embutida em base64"), para que este `.md` seja autocontido e não exija reanexar nenhum arquivo de imagem em sessões futuras.

**Não modificar mais nada.** Qualquer regra, seção ou trecho do modelo genérico não mencionado explicitamente acima permanece idêntico — inclusive todas as regras herdadas do documento de referência de estilo (baseline) `resolucao_fisica_vitor_sereno_08092026.tex`.

## ETAPA 0 — Dados obrigatórios antes de qualquer execução

Antes de montar qualquer arquivo, verifique se já foram fornecidos:

1. Nome do professor
2. Nome do aluno(a)
3. Data
4. Disciplina (ex.: "Física", "Matemática", "História")
5. Assunto (o tema específico desta lista, ex.: "Cinemática", "Frações", "Revolução Francesa")
6. As questões a serem resolvidas (em qualquer formato: PDF, imagem, texto digitado, ou combinação)

O nome do professor continua sendo perguntado normalmente, igual ao modelo genérico — quem dá a aula não é necessariamente a titular da marca "Sala de Estudo \- Prof. Rubia Lima". Nesta variante, o nome do professor não aparece mais na primeira linha da abertura nem no cabeçalho (substituído ali pelo nome fixo da empresa), mas aparece centralizado no bloco de identificação da abertura, acima do nome do aluno(a) (ver seção 4), além de continuar nos metadados do PDF.

Se qualquer um desses itens estiver faltando, **não comece a gerar a ficha** — pergunte apenas pelos itens ausentes, usando este formato:

```
Nome do professor:
Nome do aluno(a):
Data:
Disciplina:
Assunto:
```

Não invente nenhum desses dados.

**NUNCA presuma ou herde esses dados de um turno anterior da conversa.** Mesmo que Professor, Aluno(a), Data, Disciplina ou Assunto já tenham aparecido antes — em uma execução anterior deste mesmo gerador, ou em qualquer outra mensagem da conversa — não os reaproveite automaticamente. Pergunte novamente a cada nova execução, mesmo que os dados pareçam óbvios, repetidos ou já conhecidos. Presumir dados de um turno anterior é um erro, mesmo quando a suposição está correta.

**Se as questões (enunciados) ainda não tiverem sido enviadas** — em PDF, imagem ou texto — **não prossiga em hipótese alguma.** Solicite explicitamente o envio das questões, com a mesma prioridade dos dados de identificação, antes de iniciar qualquer etapa de geração.

Depois que todos os dados e as questões estiverem disponíveis, execute o trabalho completo sem pedir confirmações intermediárias, salvo se uma questão estiver ilegível ou genuinamente ambígua (ver seção 15).

## 1\. Preâmbulo LaTeX fixo

Reproduza exatamente este preâmbulo, alterando apenas os campos de `\hypersetup` e de cabeçalho/rodapé indicados com placeholders:

```latex
\documentclass[11pt,a4paper]{article}

\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[brazil]{babel}
\usepackage{lmodern}
\usepackage{amsmath,amssymb,mathtools}
\usepackage{geometry}
\usepackage{fancyhdr}
\usepackage{tikz}
\usepackage[most]{tcolorbox}
\usepackage{enumitem}
\usepackage{graphicx}
\usepackage{eso-pic}
\usepackage{array}
\usepackage{multicol}
\usepackage{xcolor}
\usepackage{microtype}
\usepackage{needspace}
\usepackage{hyperref}

\geometry{top=1.7cm,bottom=2.6cm,left=1.8cm,right=1.8cm,footskip=1.3cm}
\setlength{\parindent}{0pt}
\setlength{\parskip}{4pt}
\setlist[itemize]{leftmargin=1.4em,itemsep=1pt,topsep=2pt}
\setlist[enumerate]{leftmargin=1.8em,itemsep=2pt,topsep=2pt}

\definecolor{Azul}{HTML}{1F4E79}
\definecolor{AzulClaro}{HTML}{EAF3F8}
\definecolor{Cinza}{HTML}{F2F2F2}
\definecolor{CinzaEscuro}{HTML}{666666}
\definecolor{Verde}{HTML}{2E7D32}
\definecolor{VerdeClaro}{HTML}{EAF7EA}
\definecolor{Laranja}{HTML}{F28C28}

\hypersetup{
  colorlinks=true,
  linkcolor=Azul,
  urlcolor=Azul,
  citecolor=Azul,
  pdftitle={Lista Resolvida de {{DISCIPLINA}} - {{ASSUNTO}}},
  pdfauthor={{{PROFESSOR}}},
  pdfsubject={Resolução didática passo a passo - {{ALUNO}}}
}

\renewcommand{\contentsname}{Sumário}

\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\small\color{Azul}Sala de Estudo - Prof. Rubia Lima}
\fancyhead[C]{\small\color{Azul}Resolução de {{DISCIPLINA}}}
\fancyhead[R]{\small\color{Azul}{{ALUNO}} | \thepage}
\renewcommand{\headrulewidth}{0.4pt}
\renewcommand{\headrule}{\hbox to\headwidth{\color{Azul}\leaders\hrule height \headrulewidth\hfill}}
\setlength{\headheight}{22pt}
\addtolength{\topmargin}{-8pt}

\fancypagestyle{abertura}{
  \fancyhf{}
  \fancyhead[R]{\small\color{Azul}{{ALUNO}} | \thepage}
  \renewcommand{\headrulewidth}{0pt}
}

% Logo no rodapé de TODA página (inclusive a capa), colada nas duas
% extremidades físicas da folha (esquerda e direita), independente das
% margens de texto — por isso é desenhada como plano de fundo ancorado
% no canto inferior esquerdo da página, com largura igual a \paperwidth.
\AddToShipoutPictureBG{%
  \AtPageLowerLeft{\includegraphics[width=\paperwidth]{assets/logo_sala_de_estudo.png}}%
}
```

Diferenças em relação ao preâmbulo do modelo genérico, e só essas:

- `\fancyhead[L]` deixa de usar o placeholder `{{PROFESSOR}}` e passa a exibir o texto fixo "Sala de Estudo \- Prof. Rubia Lima".
- `\fancyhead[R]` passa a exibir `{{ALUNO}} | \thepage` (nome do aluno e número da página, separados por "|"), em vez de só o nome do aluno.
- `\fancyfoot[C]` deixa de exibir o número de página (que mudou para o cabeçalho) e não recebe mais nenhum conteúdo — a logo não fica mais dentro da caixa de rodapé do `fancyhdr`, pelo motivo explicado abaixo.
- `pdfauthor` no `\hypersetup` continua usando o placeholder `{{{PROFESSOR}}}`, sem mudança — os metadados do PDF não fazem parte da abertura nem do cabeçalho, então não foram alterados.
- `\fancypagestyle{abertura}` ganha `\fancyhead[R]` (mesma string `{{ALUNO}} | \thepage`) — na capa, o modelo genérico não tinha cabeçalho algum e mostrava o número de página no rodapé central; como o rodapé passa a ser ocupado pela logo (ver abaixo) em todas as páginas, inclusive a capa, o número de página segue para o mesmo lugar que nas demais páginas, para que a capa também continue numerada.
- **A logo é desenhada com `eso-pic` (`\AddToShipoutPictureBG` \+ `\AtPageLowerLeft`), não com `\fancyfoot`.** Isso é necessário para a logo alcançar as extremidades físicas esquerda e direita da folha, e não só a largura do corpo de texto (`\textwidth`): um `\includegraphics[width=\textwidth]` dentro de `\fancyfoot` fica limitado pelas margens de texto, deixando uma faixa branca entre a logo e a borda real do papel. Com `\AtPageLowerLeft{\includegraphics[width=\paperwidth]{...}}`, a imagem é ancorada pelo canto inferior esquerdo físico da página e esticada até `\paperwidth` — ou seja, toca a borda esquerda e a borda direita da folha, de ponta a ponta, mantendo as proporções (só a largura é fixada). `\AddToShipoutPictureBG` aplica isso automaticamente a **toda página do documento a partir do ponto em que é declarado no preâmbulo** — inclusive a capa (`abertura`) — então não é preciso repetir a instrução em cada `\fancypagestyle`.
- **Única exceção técnica necessária:** a margem inferior (`bottom`) e o `footskip` da `geometry` foram ajustados (de `bottom=1.8cm` para `bottom=2.6cm`, mais `footskip=1.3cm`) para que o corpo de texto nunca desça a ponto de sobrepor a faixa da logo colada na base física da página. Topo, esquerda e direita permanecem idênticos ao modelo genérico. Ajuste esses valores apenas se a logo específica usada exigir um espaço diferente — o objetivo é a logo caber inteira, nítida, sem sobreposição com o texto do corpo.

## 2\. Ambientes de caixa (`tcolorbox`) — fixos, não alterar

Reproduza exatamente estas definições, sem mudar cores, `boxrule`, `arc` ou paddings — idênticas ao modelo genérico:

```latex
\newtcolorbox{formulaBox}[1]{
  colback=AzulClaro,
  colframe=Azul,
  title={#1},
  fonttitle=\bfseries,
  boxrule=0.8pt,
  arc=2mm,
  left=2mm,right=2mm,top=1.5mm,bottom=1.5mm,
  before skip=3pt,after skip=4pt
}

\newtcolorbox{theorybox}{
  colback=AzulClaro,colframe=Azul,
  title={Teoria rápida antes da questão},fonttitle=\bfseries,
  boxrule=0.9pt,arc=2mm,left=2.5mm,right=2.5mm,top=1.8mm,bottom=1.8mm,
  before skip=4pt,after skip=5pt
}
\newtcolorbox{databox}{
  colback=Cinza,colframe=CinzaEscuro,
  title={Dados e interpretação},fonttitle=\bfseries,
  boxrule=0.8pt,arc=2mm,left=2.5mm,right=2.5mm,top=1.8mm,bottom=1.8mm,
  before skip=4pt,after skip=5pt
}
\newtcolorbox{solvebox}{
  colback=white,colframe=Azul,
  title={Resolução passo a passo},fonttitle=\bfseries,
  boxrule=1.0pt,arc=2mm,left=2.5mm,right=2.5mm,top=1.8mm,bottom=1.8mm,
  before skip=4pt,after skip=5pt
}
\newtcolorbox{answerbox}{
  colback=VerdeClaro,colframe=Verde,
  title={Resposta final},fonttitle=\bfseries,
  boxrule=1.0pt,arc=2mm,left=2.5mm,right=2.5mm,top=1.8mm,bottom=1.8mm,
  before skip=4pt,after skip=5pt
}
\newtcolorbox{warningbox}{
  colback=white,colframe=Laranja,
  title={ATENÇÃO},fonttitle=\bfseries,
  boxrule=1.1pt,arc=2mm,left=2.5mm,right=2.5mm,top=1.8mm,bottom=1.8mm,
  before skip=4pt,after skip=5pt
}
```

## 3\. Comandos customizados

Idênticos ao modelo genérico:

```latex
% Âncora individual de um enunciado (usada tanto em páginas de imagem
% quanto em páginas de texto — ver seção 11).
\newcommand{\enunciadoanchor}[1]{\phantomsection\hypertarget{enunciado#1}{}\label{enunciado#1}}

% Abre a seção de RESOLUÇÃO da questão #1.
\newcommand{\resolucaosection}[1]{%
  \clearpage
  \phantomsection
  \hypertarget{resolucao#1}{}\label{resolucao#1}
  \section*{\color{Azul}Resolução #1}
  \addcontentsline{toc}{section}{Resolução #1}
  \vspace{-4pt}
  {\color{Azul}\rule{\textwidth}{1.0pt}}\par\vspace{2pt}
  {\small\color{CinzaEscuro}\hyperlink{enunciado#1}{$\hookleftarrow$~Ver enunciado --- pág.~\pageref{enunciado#1}}}\par\vspace{4pt}
}

\newcommand{\passo}[1]{\textbf{#1}}
```

## 4\. Página de abertura

Mesma lógica de posicionamento do modelo genérico, com `\pagestyle{abertura}`. Ordem das linhas do título idêntica — só a primeira linha muda, de placeholder para texto fixo. O bloco de identificação ganha uma linha nova, para o professor, centralizada e posicionada acima da linha do aluno(a):

```latex
\thispagestyle{abertura}
\begin{center}
  {\Large\bfseries\color{Azul}Sala de Estudo - Prof. Rubia Lima}\par
  \vspace{2mm}
  {\LARGE\bfseries LISTA RESOLVIDA DE \MakeUppercase{{{DISCIPLINA}}}}\par
  \vspace{1mm}
  {\large\bfseries\color{CinzaEscuro}{{ASSUNTO}}}\par
  \vspace{1mm}
  {\Huge Resolução didática passo a passo}\par
\end{center}

\vspace{3mm}
\begin{center}
  {\Large\bfseries Professor(a):} {\Large {{PROFESSOR}}}\par
  \vspace{1mm}
  {\Large\bfseries Aluno(a):} {\Large {{ALUNO}}}\par
  \vspace{1mm}
  {\Large\bfseries Data:} {\Large {{DATA}}}\par
\end{center}
```

Mudanças em relação ao modelo genérico, e só essas:

- "Prof. {{PROFESSOR}}" na primeira linha da capa vira o texto fixo "Sala de Estudo \- Prof. Rubia Lima", mantendo exatamente o mesmo tamanho de fonte (`\Large\bfseries`), cor (`Azul`) e posição (primeira linha da capa).
- O bloco de identificação ganha uma linha "Professor(a): {{PROFESSOR}}", centralizada, na mesma fonte `\Large` e mesmo padrão de rótulo em negrito das linhas de Aluno(a) e Data, posicionada **acima** da linha do aluno(a) — porque o nome da empresa (primeira linha da capa) identifica a marca, mas não diz quem dá a aula; o professor continua sendo um dado útil e deve aparecer no documento.

Todo o resto da página de abertura — inclusive o `\MakeUppercase` na disciplina e o `\Huge` em "Resolução didática passo a passo" — permanece idêntico ao modelo genérico.

## 5\. Cabeçalho de todas as páginas de resolução

Já definido no preâmbulo (seção 1): `[L] Sala de Estudo - Prof. Rubia Lima` (fixo) / `[C] Resolução de {{DISCIPLINA}}` / `[R] {{ALUNO}} | \thepage`. Mesma fonte pequena azul e mesma régua horizontal do modelo genérico — nenhuma outra mudança de estilo.

O nome da empresa nunca varia — é sempre o texto fixo "Sala de Estudo \- Prof. Rubia Lima", em qualquer lugar do documento (abertura ou cabeçalho). O número de página sempre aparece junto do nome do aluno, à direita, separado por "|".

## 6\. Resumo geral de fórmulas

Idêntico ao modelo genérico — `formulaBox` numeradas dentro de `multicols{2}`, montadas dinamicamente a partir do que for efetivamente usado nas questões fornecidas, em fluxo contínuo (sem fórmulas hardcoded, sem divisão fixa em "Parte 1/2"):

```latex
{\large\bfseries\color{Azul}Resumo geral de fórmulas}\par
{\small Fórmulas e relações efetivamente utilizadas nas questões desta lista.}

\small
\begin{multicols}{2}

% ... uma formulaBox por fórmula/relação, quantas forem necessárias ...

\end{multicols}
\normalsize
```

## 7\. Sumário

Idêntico ao modelo genérico:

```latex
\clearpage
\phantomsection
\begin{center}
{\LARGE\bfseries\color{Azul}Sumário}
\end{center}
\vspace{2mm}
\tableofcontents
```

O sumário lista, na ordem em que aparecem no documento:

- um item por página/grupo de enunciados: **"Enunciados X até Y"** (ver regras de nomenclatura na seção 11);
- um item por questão resolvida: **"Resolução N"**;
- por fim, **"Gabarito"**.

## 8\. Regras de entrada das questões

Idêntico ao modelo genérico. As questões podem ser fornecidas em qualquer formato, isolado ou combinado:

- **PDF ou imagem** — reproduzido integralmente via `\includegraphics`, sem recorte nem reconstrução.
- **Texto digitado** — reproduzido integralmente (sem resumir, parafrasear ou omitir alternativas/dados) como bloco de texto na página de enunciados correspondente.
- **Entrada mista** — preservar a ordem original em que as questões foram fornecidas; cada uma segue a regra do seu próprio formato de origem.

Em qualquer um dos casos, o enunciado NUNCA fica dentro da seção de resolução — ver seção 11.

## 9\. Questões ilegíveis ou ambíguas

Idêntico ao modelo genérico. Nunca invente um número, fórmula, alternativa ou trecho que não possa ser lido com segurança. Se uma imagem/PDF estiver ilegível ou um dado for ambíguo: identifique exatamente a questão, informe qual trecho não pôde ser lido, e peça uma versão melhor apenas dessa informação — sem resolver com dados presumidos.

## 10\. Fidelidade aos enunciados

Idêntico ao modelo genérico. Não alterar, em nenhuma hipótese: números, unidades, alternativas, sinais, gráficos, letras, nomes, ordem das alternativas, valores fornecidos.

## 11\. Páginas de Enunciados

Idêntico ao modelo genérico em toda a estrutura: os enunciados nunca ficam junto da resolução — nem quando vêm de PDF/imagem, nem quando vêm como texto.

**Agrupamento.** Uma página de enunciados reúne uma ou mais questões — no caso de PDF/imagem, o agrupamento é o mesmo da paginação do documento original; no caso de texto, agrupe quantas questões couberem confortavelmente na página, sem espremer.

**Nomenclatura no sumário e no título impresso da página (devem ser idênticos):**

- mais de uma questão, sequenciais: **"Enunciados X até Y"** (ex.: "Enunciados 3 até 6");
- mais de uma questão, não sequenciais: **liste os números exatos**, nunca "X até Y" — use algo como "Enunciados 3, 4 e 7";
- apenas uma questão na página: **singular**, sem "até" — "Enunciado X" (ex.: "Enunciado 7").

**Âncoras individuais por questão (obrigatório, mesmo quando várias questões dividem a página):** cada questão presente na página recebe seu próprio `\enunciadoanchor{N}` (seção 3). Em páginas de imagem, os anchors ficam todos juntos, antes do `\includegraphics`. Em páginas de texto, cada `\enunciadoanchor{N}` fica imediatamente antes do parágrafo daquela questão específica.

**Exemplo — página de imagem:**

```latex
\clearpage
\phantomsection
\addcontentsline{toc}{section}{Enunciados 3 até 6}
\begin{center}
{\Large\bfseries\color{Azul}Enunciados 3 até 6}\par
\vspace{2mm}
{\small As questões abaixo são reproduzidas integralmente, sem recortes ou reconstrução do enunciado original.}\par
\vspace{3mm}
\end{center}
\enunciadoanchor{3}\enunciadoanchor{4}\enunciadoanchor{5}\enunciadoanchor{6}
\includegraphics[page=2,width=\textwidth,height=22.8cm,keepaspectratio]{assets/original_questoes.pdf}

\vfill
\begin{center}
{\small\color{CinzaEscuro}\textbf{Ir direto para a resolução:}\quad
\hyperlink{resolucao3}{Resolução 3 (pág.~\pageref{resolucao3})}\quad$\cdot$\quad
\hyperlink{resolucao4}{Resolução 4 (pág.~\pageref{resolucao4})}\quad$\cdot$\quad
\hyperlink{resolucao5}{Resolução 5 (pág.~\pageref{resolucao5})}\quad$\cdot$\quad
\hyperlink{resolucao6}{Resolução 6 (pág.~\pageref{resolucao6})}}\par
\end{center}
```

**Exemplo — página de texto (quando não há PDF/imagem original):**

```latex
\clearpage
\phantomsection
\addcontentsline{toc}{section}{Enunciados 8 até 10}
\begin{center}
{\Large\bfseries\color{Azul}Enunciados 8 até 10}\par
\vspace{2mm}
{\small As questões abaixo são reproduzidas integralmente, sem resumir, parafrasear ou omitir alternativas/dados.}\par
\vspace{3mm}
\end{center}

\enunciadoanchor{8}
\textbf{Questão 8.} [texto integral do enunciado 8, incluindo alternativas]

\vspace{4mm}
\enunciadoanchor{9}
\textbf{Questão 9.} [texto integral do enunciado 9]

\vspace{4mm}
\enunciadoanchor{10}
\textbf{Questão 10.} [texto integral do enunciado 10]

\vfill
\begin{center}
{\small\color{CinzaEscuro}\textbf{Ir direto para a resolução:}\quad
\hyperlink{resolucao8}{Resolução 8 (pág.~\pageref{resolucao8})}\quad$\cdot$\quad
\hyperlink{resolucao9}{Resolução 9 (pág.~\pageref{resolucao9})}\quad$\cdot$\quad
\hyperlink{resolucao10}{Resolução 10 (pág.~\pageref{resolucao10})}}\par
\end{center}
```

Estas páginas de enunciado são blocos literais, não uma macro.

## 12\. Estrutura de cada Resolução

Idêntico ao modelo genérico. Abre com `\resolucaosection{N}` (seção 3), que já imprime o título "Resolução N", a régua azul e o link de volta ao enunciado:

```latex
\resolucaosection{N}
\begin{theorybox}
...
\end{theorybox}

\begin{databox}
...
\end{databox}

% ilustração (TikZ) — opcional, só quando fizer sentido para a questão/matéria
\begin{center}
...
\end{center}

\begin{solvebox}
\passo{Passo 1:} ...
\passo{Passo 2:} ...
\end{solvebox}

\begin{answerbox}
\[
\boxed{...}
\]
Alternativa \textbf{X}. % se houver múltipla escolha
\end{answerbox}

% warningbox — opcional, só quando houver inconsistência, hipótese ou observação relevante
```

## 13\. Gabarito final

Idêntico ao modelo genérico:

```latex
\clearpage
\phantomsection
\hypertarget{gabarito}{}
\section*{\color{Azul}Gabarito final}
\addcontentsline{toc}{section}{Gabarito}
{\color{Azul}\rule{\textwidth}{1.0pt}}\par\vspace{6pt}

\begin{tcolorbox}[colback=VerdeClaro,colframe=Verde,title={Respostas},fonttitle=\bfseries,boxrule=1pt,arc=2mm]
\begin{enumerate}[label={},leftmargin=0pt]
  \item \hyperlink{resolucao1}{\textbf{1.}} ... -- alternativa \textbf{X}.
  % ... uma linha por questão ...
\end{enumerate}
\end{tcolorbox}

\vfill
\begin{center}
{\small\color{CinzaEscuro}Fim da lista resolvida.}
\end{center}
```

## 14\. Placeholders utilizados

| Placeholder | Conteúdo |
| --- | --- |
| `{{PROFESSOR}}` | Nome do professor(a) que efetivamente dá a aula (não é necessariamente a titular da marca). Aparece centralizado no bloco de identificação da abertura, acima do nome do aluno(a), e nos metadados do PDF (`pdfauthor`, seção 1). Não aparece mais na primeira linha da abertura nem no cabeçalho, que mostram o texto fixo da empresa no lugar |
| `{{ALUNO}}` | Nome do aluno(a) |
| `{{DATA}}` | Data da lista |
| `{{DISCIPLINA}}` | Matéria/disciplina ampla (ex.: "Física", "Matemática") — usada no título da abertura e no cabeçalho corrido |
| `{{ASSUNTO}}` | Tema específico desta lista (ex.: "Cinemática", "Revisão") — usado como subtítulo na abertura |

O placeholder `{{PROFESSOR}}` continua existindo e sendo coletado na Etapa 0, exatamente como no modelo genérico. Nesta variante ele deixou de ser impresso na primeira linha da abertura e no cabeçalho, substituído nesses dois pontos pelo texto fixo "Sala de Estudo \- Prof. Rubia Lima" (ver seções 1 e 4\-5) — mas passou a aparecer em um novo lugar: centralizado no bloco de identificação da abertura, acima do nome do aluno(a) (seção 4). Não existe placeholder para a logo: ela é um arquivo de imagem fixo (`assets/logo_sala_de_estudo.png`), decodificado do base64 embutido na última seção deste gerador.

## 15\. Ordem final do documento

Idêntico ao modelo genérico:

1. Capa (abertura), com o resumo de fórmulas começando na mesma página.
2. Continuação do resumo de fórmulas (fluxo contínuo, quantas páginas precisar).
3. Sumário.
4. Para cada grupo de questões, na ordem em que foram fornecidas: página de Enunciados do grupo → Resolução de cada questão do grupo, uma por uma.
5. Gabarito final.

## 16\. Regras fixas (não podem ser revertidas em gerações futuras)

- Preâmbulo, cores, `tcolorbox`, tipografia e espaçamentos idênticos ao modelo genérico, exceto onde esta seção lista uma mudança de marca.
- O placeholder `{{PROFESSOR}}` continua sendo coletado (Etapa 0) e usado no `pdfauthor` dos metadados do PDF, sempre com o prefixo "Prof." — sem mudança em relação ao modelo genérico.
- O texto fixo "Sala de Estudo \- Prof. Rubia Lima" substitui, apenas na primeira linha da abertura e no cabeçalho, o que antes era "Prof. {{PROFESSOR}}".
- O nome do professor aparece centralizado no bloco de identificação da abertura, acima do nome do aluno(a) — porque quem dá a aula não é necessariamente a titular da marca.
- "Resolução didática passo a passo" em `\Huge`, na mesma posição/ordem do modelo genérico.
- Bloco de identificação sem caixa, fonte `\Large`, contendo Professor(a), Aluno(a) e Data, nessa ordem.
- Disciplina e Assunto aparecem no topo da abertura, não no bloco de identificação.
- Cabeçalho em três zonas: Sala de Estudo \- Prof. Rubia Lima (fixo) / Resolução de {{DISCIPLINA}} / {{ALUNO}} | número da página.
- Rodapé de toda página, inclusive a capa, com a logo da empresa esticada em `\includegraphics[width=\textwidth]{...}`, em opacidade total.
- Resumo de fórmulas contínuo, sem fórmulas hardcoded, sem divisão fixa em "Parte 1/2".
- Enunciado e resolução sempre em páginas/seções separadas, qualquer que seja o formato de entrada.
- Sumário com "Enunciados X até Y" (ou "Enunciado X" no singular, ou lista exata de números quando não sequenciais) e "Resolução N".
- Âncora individual por questão em toda página de enunciados, mesmo compartilhada.
- Hyperlink de volta ao enunciado dentro de cada resolução, logo abaixo do título "Resolução N".
- Hyperlinks de ida, na base de cada página de enunciados, para cada resolução correspondente.
- Título impresso de cada página de enunciados idêntico ao texto usado no sumário.
- Gabarito com hyperlinks para `resolucaoN`.
- Nenhum conteúdo específico de física (ou de qualquer matéria) hardcoded no gerador — tudo genérico via placeholders e conteúdo fornecido.

## 17\. Checklist de verificação final

Antes de entregar, confira:

- [ ] Nenhuma equação, texto ou imagem cortada; nenhuma questão omitida; todas as alternativas preservadas.
- [ ] "Sala de Estudo \- Prof. Rubia Lima" aparece, como texto fixo, na primeira linha da abertura e na zona esquerda do cabeçalho de toda página.
- [ ] O nome do professor aparece centralizado no bloco de identificação da abertura, acima do nome do aluno(a).
- [ ] Os metadados do PDF (`pdfauthor`) mostram "Prof. {{PROFESSOR}}", exatamente como no modelo genérico.
- [ ] O bloco de identificação da abertura mostra Professor(a), Aluno(a) e Data, nessa ordem, sem caixa, em `\Large`.
- [ ] "Resolução didática passo a passo" está em `\Huge`, na mesma posição do modelo genérico.
- [ ] Disciplina e Assunto aparecem no topo da abertura, não duplicados no bloco de identificação.
- [ ] A disciplina digitada aparece em caixa alta (`\MakeUppercase`) na linha "LISTA RESOLVIDA DE ..." da abertura, e só ali.
- [ ] O cabeçalho de todas as páginas mostra as três zonas corretas, com `{{ALUNO}} | \thepage` à direita.
- [ ] O rodapé de toda página — inclusive a capa — mostra a logo esticada em `\textwidth`, com proporções preservadas e opacidade total.
- [ ] A logo foi decodificada do base64 embutido para `assets/logo_sala_de_estudo.png` antes da compilação.
- [ ] O resumo de fórmulas cobre exatamente o que foi usado nas questões, sem fórmulas hardcoded, e flui continuamente (sem "Parte 1/2" nem página com grande área em branco).
- [ ] Todo enunciado está em página separada da sua resolução, mesmo quando fornecido como texto puro.
- [ ] Cada página de enunciados tem título impresso idêntico à sua entrada no sumário, seguindo a regra de singular/plural/lista exata.
- [ ] Cada questão em uma página de enunciados compartilhada tem sua própria âncora (`\enunciadoanchor`).
- [ ] Cada página de enunciados tem, na base, hyperlinks para todas as resoluções daquele grupo.
- [ ] Cada resolução tem, logo abaixo do título, o hyperlink de volta ao seu enunciado.
- [ ] O sumário lista "Enunciados X até Y"/"Enunciado X", "Resolução N" (para cada questão) e "Gabarito", todos com hyperlink funcionando.
- [ ] O gabarito aponta para `resolucaoN` e bate com as respostas obtidas nas resoluções.
- [ ] O `.tex` compila sem depender de caminhos absolutos da máquina onde foi criado.

## 18\. Regra final de qualidade

O resultado deve ser indistinguível, em aparência, do modelo genérico — mesma identidade visual, mesma tipografia, mesmas caixas coloridas, mesma navegabilidade completa por hyperlinks nos dois sentidos — com a única diferença de trazer a marca "Sala de Estudo \- Prof. Rubia Lima" fixa (em vez do placeholder de professor) e a logo da empresa no rodapé de toda página. Prioridade: fidelidade às questões originais → correção do conteúdo → clareza didática → fidelidade ao layout de referência e à identidade de marca → navegabilidade completa do PDF.

## 19\. Logo da empresa embutida em base64

A logo oficial da "Sala de Estudo \- Prof. Rubia Lima" (imagem PNG, 794×74 pixels, faixa horizontal amarela com o texto "SALA DE ESTUDO", ícone e "Profª. Rúbia Lima — Reforço Escolar") está embutida abaixo em base64, para que este gerador seja autocontido e não precise de nenhum arquivo anexado em sessões futuras.

**Antes de compilar o `.tex`\:** decodifique o base64 abaixo para um arquivo binário PNG chamado `logo_sala_de_estudo.png`, salve\-o na subpasta `assets/` ao lado do `.tex` (mesma pasta usada para outros recursos, como `assets/original_questoes.pdf` — ver seção 11), e referencie\-o exatamente como já mostrado no preâmbulo (seção 1) e na `\fancypagestyle{abertura}`\: `\includegraphics[width=\textwidth]{assets/logo_sala_de_estudo.png}`. Não é preciso pedir a logo ao usuário nem perguntar por ela na Etapa 0 — ela já está aqui.

Base64 (PNG completo, sem quebras de linha internas):

```base64
iVBORw0KGgoAAAANSUhEUgAAAxoAAABKCAYAAAA8JiI4AAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAIABJREFUeJzsnXV4FOfaxu9ZjStxF+IkxHF3dygUaSlQO21P3eVUTvu151RoTwulBqU4BHeXECRuxCDunmySze7O98eSzU5mVrLZGJ3fdfUq+469mZV5H7sfoi2RQ4KFhYWFhYWFhYWFpT8hCWAz31j2OrzJtv6ejD7g9PcEWFhYWFhYWFhYWFhAkMAL4mbOXXEqEdzfk9EHrKHBwsLCwsLCwsLCMnAIhJQT15bMfREgiP6eTE8g2NQpFhYWFhYWFhYWloEIeUYiIdcZhZOl/T0TXWAjGiwsLCwsLCwsLCwDEmIan8dJbEvizenvmegCa2iwsLCwsLCwsLCwDFBIwJYAeaQtibsFdwmj/p5Pd2ANDRYWFhYWFhYWFpaBDUEAG8U8zu32RGJ4f09GW1hDg4WFhYWFhYWFhWVwEEASnFhxEvcNgBjw63i2GJzlkaC80QJ5NTYw4osRZF8ILkfW31NiYWFhYWFhYek1CII81y4l1xqFkiX9PRdVsIYGy6Cmoskc/zqzCOdzAkGScgU4K6MmvDz+BJYEx/Xz7FhYWFhYWFhYeg8SqARBPCUMlhzp77kwwRoaLIOWuhYjLN3xIgprhzBuf3XCMTwVfbGPZ8XCwsLCwsLC0ufsEBCyZxBMNvf3RJQZ8LldLCyq+O7aDJVGBgB8e3UmCuus+3BGLCwsLCwsLCz9wmoxybnTnkyE9fdElOH19wRYWHShXcrFsTT136V2KReH0yLw/OjTfTQrFhYWFhaWvxct7QIUN1ihTmSEdhkXFoYi2Bg1YIhJY39PTSUSGRdljRaobjaBWMqDmbAF1kaNPZpzSYMlqppN0SwWwoAngaVhE1wsqvu6ZtSPJDk3xYnczwTDZf8CyH4vWGUNDZZBSVG9NRraDDXul11l3wezYWFhYWH5u3EsPRTfXp2pfieChLmwBabCVtib1iPCJRez/BNhyBcz7k6SBKZtfUun+czwTcIrE44rXktJDmZsfVOnc62PvogVw2NVbhdLeDiQEoUTGcORWOKOdimXto+rRRXGemZiXeQVuFhUq73e8fRQfKPne9kVGUngVGYIjqaHI67ACyKxkLaPlVETwpweYKZ/AqYMTYWQJ1F7zqQSN/x5dwxiC4aiqsmUtt1Y0IYIlzwsCb6JKUPTQBB9Uq3AB4EP2pOIsRKCWGsYTBb1xUVVwRoaLIOSNol2H12ZjM0OZGFhYWHRP41tBlql5xYq/ftQagT+e2UW/j1rN8Z5ZjLvr2PKb02LCXWA1P1cjWoceXH53nj9+EqUN5qrPUdB3RDsjB+D3YmjsCbiKl4df0yld79RrPu9/GzmHoz3ylB7XFqZC14/9hhyq+3U7lcjMsG57CCcyw6ClVETti3bigC7Yvp82wzw9onHcDYrSO35msVCXM71x+VcfwTYFeO/83bA3apS7TH6ggQxiUsSKeJk3jOCYMnuPrkoA+wqjGVQ4mxRo1U40sGstg9mw8LCwsLCoh3VzaZ4Zv96XLvv299T6TaHUiPw5N5NGo0MZaQyDn67NR4b9m3Q2kmoLdXNpnj2wJO4mqf6Xp7LDsKqnc9pNDK6UiMyQWWTGW28oskcy3e8qNHI6Ep6uROWbX8R8cUe3Tquh1iAJHeJk7jbkU6YaN5d/7CGBsugxETQiole6Rr3m+Wf0AezYWFhYWFhAYz4YgTaF8LfthguFtWwNGAWAJKSHHx8diFkD2XZBwN3izzx3sllkDJkCvjYlOLx8GtYH3URk4amQcCQcnTjgQ/+dXax1tfrzr3817lFjPfyXoUjXj+6Cq0SPm0bhyARaF+IOQEJmO2fCG/rMo1zEkt4eOHQWuRV29K2mQlbMDsgARuiL2B5yE1GR2dDmyGeP7gOZQ0WGq+lZ1aL2znJkkRiVF9fmE2dYulTyhstYGdap5dzvT0lBneKPFHXYsS4fVnITQx3zNfLtVhYWFhYWDTha1OCXas3U8Zyquzx9onlSC51pYzn19ogu9IBvraae63FPPEf+GmxnzYcW/8lvIdoXlQrIyU5eOv4ckhk1FoMAU+Cj6fvxfygu5TxonprvHBoLdLLnSjjB5KjMMsvAaM9sjRec6hNKfas/o4yllNtj3dPLENiiRtlvLB2CLIqHWj36N2TSyFqF9DOPcbjHt6beghultQ0psQSN/x4Yyou5/ozzmn73bG0awPAVJ9UfDJzD8wNRIoxiYyL/12fiv/dmErZt0Zkgk/PL8Tmhb8xXqMX8ZARnMviRO6ngmzZx1hKSvviooMioiGVcfCgxgYppa5IKHFHZoUj6luZF5csA5ef4yZh7i+vIr/WRi/nczSrxW8rfoKHVQVlnEOQWBl2HR9MO6CX67Cw/N2paDLHnqQRiv9UPYRZWFjoeA8pw7tTDzFuq2AoIB6InMoIQUEdXU7+7ckxNCMDAJzNq7Ft2VZYGTXRtm2JnaLzPLyt1dzLRmqa07X7vkgpc6XtN2loGrYu/ZlmZADAcMd8bFmyDV/M/gtGgjbKtjYJD7/dHk87Jsi+EF/P304xMgCAx5HihbGn8Fgovaj+XHYgcvpHrIYHAh+IfblX21IIz7654ABFRhI4nhGKg8lRSCh2Zwx7WRs3YrhDAUa6Z2GabwpsTerVnvP7a9Ow4+5Y2viWpds0er4/PrsQx9KpcqrHnvoSNsYNWvw1dERiIaZvfRNiKfUtCHV6gJ+W/KLTOQc6E73S8eP1qXju4DrsXf0d7UusC/62xTj21Je4U+iBexWOMDFoRaTTfQwxacCx9FDUtRhjrGcmPK0rNJ+MhYWFkR9vTMGuBHnEncuRYftjP/bzjFhYBhf2pszrE0sjEeP4QONk5nDamItFNZaF3FR5jJVRE56MuoSvLs2hjN8u8kRVk6nOUrL2JsxZEV3v5Yn0UNo+RnwxPpmxFxwN6k/zg+4izPkBTIStirHbhV6obqYbhi+MOQUeR3Vw4B9jTuFgSiSlPoUkCZy6F4LnuxlZ0hskOZIgOfHiRN5zguGSnb15qQFpaBTWWeOlw2uQVuasdr/qZlOczwnE+ZxAXMnzw9al21TuKyMJHEiJYoyExKREajQ0WiUC2rEyme65laeyglHZTC8yupLnj9IGy0eyiNl7SBk+nrEXrxx9HG+dXIFv5m3Xi9Qbl5Ah2jUX0a65AICUUlds2P8UHtTIIyf/vTIbPy7+BaPcNYdqWVhYqFQ1meJQSqTi9fOjzyDcOa8fZ8TCMvhIKnGhjXEIUqPsawfb74yDtZHqhbmQL9G6Z1RiiRsqGRbMHRgL2hDsUKB4LSMJ3C6kO7+n+SRrXLDP8k+kGRokSSCuwBuzA3SroUxiiFLI72UVZexGwVDaflN9UxijLEx0fW/i8r1p+5gKWzHG857a81gZNSHaNRtX8qiR4Jv53v3d58scBPmnOJk7XyCTbcRwUj957V0YcIZGeaM5Vvz5D0arsSfcyvdGaYMl47aTmSF4a3KMRr1kfRKTEsE4LiMJHE4Lx9Mjz/XZXPqS2QEJSChxx593x2Cb3URsGHFBr+c/mzUMr3Up/GqT8PDPw6txdP1XGqNeLCwsVLbdmqj4PkW55GLjyPP9PCMWlsFFfLEH3j+1jDY+xiOTlm6jioNKxj4TZsIWrRet756kz0WZYIcC7F3zreJ1XYsxo5N2mGMhbawrjma1sDJqQo2IKnj0QMcU6vhiD7zHMP/RHlmwMOy8l6J2AWPBdaRLrk7XBZjnHGBXrNHYAoAg+yKaoaHrPdA7JJaKCU4kJ4lYzQshr+n79APO0Pi/S3NpRka4cx4eD78GH5sy8LlSVItMkFriggs5gbhZ4A1SC9WGQ2mqv6T1rUa4kBOImX5JPZ6/NhTXW+FOoZfK7TGpEdg04nxfNXbpc96YeARppc74+sos+NiUatS/1pYDyVF4/9RSSEl66VF9qxE+Pb8A387/Qy/XYmH5O1DbYoy9SSMAyL1yX83bCS7R741mWVgGLDnV9nhi99MQS7loEhugqtmU0XE6xKQR702J6YcZdp/aFmPGcW0jA1aGdEND1TmVyau20+peWhs34r2pByljdSrO3xNnY30rvbeItbF26V/WxvR7VScyAkkSA2Wt5y4D56I4ifsfgUT2HsLJdn2deEAZGlKSg3NZwyhjrhZV2L7yR8rDzdWiCqGOD7A64ipyq+3wxYW5as8rEgtx9h71vDyOlKKecCglss8MjcNp4RQZtq5zeVBjg8RSN4Q6PuiT+fQ1fK4Umxf+joW/v4yXj6zGntXfdVsBoyt/xY/GJ+fUSwWezgzGnTBPRLiwaR8sLNqw/c5YiMRCEASJT2fuYSOCLCwaaGwzQGw+PWVHGTfLSvyw+He4WFap3W+gwNT1G5A/y7WBx6U7J9q16Keh9b1c9Dtcu6RNiVWcX6CmlkITTHNWV5uhDJdhPynJgQwEuBgQhgYgtwneEPO4E8hUYpUwiNQ9/NPlpAOGhlZDWjOXlnYBWtv5MFZROOxlXY6tS7ehREVaFCCvh1CWNxPwJFgfdRE/KkmOXX/g26PiJG0hSYKWNrUy7AaOpYdSLP7DKRGPrKEByL05X83diSf3bMLzh9Zhz+rvtA4hd2Xzten44fo0rfb98tIc7H5880DxILCwDFgkMi4SStwRaF+IiV7pmOituW8NCwuLeuYEJODTmbu7nar97KizsDNTnUKv7aIfkEu7mghaVW53taIu2i1UPJubWoVaXa+xzYA2Zm7E3BOjO8wOSMBnKu6luSHznOvadFcsNTNsoY2p66CuaT8zYcsAjRCT0YSUE9+exHuNHyLZ2tOzDShDw8JABANeOyW/vrLZDHN+eQ1zA+MR7ZKDYY6FMBPS32xHNcXTXRf24zwysTzkJrbETlF4wKUyDo6mh+GJqMt6+muYSShxp0nEzQu8i3YpV6HqAgAnMob3ed1IXxPtloOXxp/Efy7NxtP7n8QUnzQ4mtVghFsOLA01/wjJSAKfnFuIv+JHa33NpBI3nMgYrnMRGgvL3wUeR4rfl//U39NgYRlUCHkSReSvosmc5jyNy/dCQ5sRbHjdU6yc5pustz4ab0460q0sAkujJnA5Mlqjvtxqe4zVUAitqlbCzkTz3y/gSWCn7l4WeKO+1Zgx0mpuIAKfK6VFYzLKnTDDV7fsFTuG6+RW0Rv3MXGfYT8bLe5BP2JGgtwiTuZOERCyTRhG6qxQNKD6aBAEyZjWUtpgia2xk7F+7yZEf/sxZm97HZ+cW4jY/KEa6zOY6iFm+SfA3qwOoU73KeOHUtUXW+mDrkaPq0UVguwLMcs/kTLe0GaICzmBvT6f/uapqIsY55WJhGIPfHlxDv55eA2m/PQOfo2bQGsMpIxExsVrx1Z1y8jo4L9XZtF+sFRxImM4fo6bhIwKJ807s/Q5NSITXMgOxP7kaBxIjsLZrGFIK3NRGTZnYWFh6U0CbItwdtNnOLvpM3w2axdte2WzGV6KWa32+TbQEPIkCLYvoI1fu++r8djY/KGMdZPaKNf52xYr7uXns/+iba9qMlV5LzkEyZgVcjZrGON8tCHM+T5trLDeGoW19P4iykhJDq4zpIBFMJxvwEFiqZjkJEpSiHG6nmLAPY1fHHsKN/O9VX4JSZJAbrUdcqvt8OfdMRhqU4p3Jh3GCPdsxv271kMY8cWY8DAFYHZAAu4WdUq2ZVU6IL3cCQF2xXr8izpplfBpWtQdnvVw5zzYmdajvNFcsa0v60b6C4IgEe6Uhyu5foqxZrEQ/3dpLvYkjcA7k2MwziuTcoyoXYCXDq+lHNMdiuutsP3OOK0Ur07dC8GZe8EwMxDB37Z3Phe9QbNYSCu+U8ZY0AZjQeugjZhVNJnjk3MLcDZrGKOz4fflPyl+E1olfGSUOyOzwh7VIjNUNpqhVcqHMb8N7lYViHLN1ZunUN+IJTyUN5mr3cfMoAVmwhad0gGL6q1BPjxsiHEjDPlirY9taReg6mFhJkHIG3QxweSJVMaA3w5DvlhtKgcTdS1GWqUt2JrUq/ycN4kNUCuiFo06m9f0WmplQ5sh6lvkqRsCrgR2KnoraKK2xRhNDOkoXXEwq0NjmwFlXw5Bwsm8plvXa5dyUdZI9UpbGDbDVNi994zp86zu/RnszPZPxO0Cb+xOHEkZv1vkif+7OBdvTx4cxeAAMMbzHhJK3CljNx74qF0zyUgC225OpI3bmdbDx6a0W9ef6ZeEWwU3KJkfgFyF6ouLc/EOw70c7XEPt7o4mvOqbbE3cQQeC72h9npNYgO8dfwxrBh+XdHFfJR7Ni2yQ5IEfrk1AR9O36/yXEfTwlDeSI/qjPHMZNh7AELCVUZyLoiTuF/pUig+4AyNYQ4F+GHRb3jrxAq1C6UOsisdsH7fRnw+exfmBsRTtjHVQ0z0TofRw4fpDN9kfHpuIeVDE5Ma2WuGxvnsQFqu4uyHkQwOQWKGXxL+uN1pNPZV3Uh/M0SFakN+rQ027t+Aab7JeGvSETiY1aJGZIJN+9YzdvsEgED7QpQ1WmiUR94SOxmLg29pVM0gdfR89Dens4Lx9vEVavfpWHCEOT/AbP94jPW4NyhqVyqbzbBsxwuM4Xgmor79RGOEI8olF1/M2TXg+tfkVNth0e8va9xPwJPA3bISI92zsTwkVusGlTN/fkORWvDD4l8x2TtN67ndzPfGMwfWA5A38Ut77TXG/V48tIa2QFGFhaHcoJ/ln4C5gfEw4Kl+nv1xZxylzk4Vf678QaUAxL/Pz8eB5CjK2M5VP/Ran5Bd8aPw9ZVZAOSymAfX/Ven83x7ZSZt8crEiae+wO7EUdh+h9qodtfqzd2qAdydMAqfnl9AGXt7cgzWRFzV+hwAcCAlCh+dWUwZe2vyYayNuNKt8wwm3pocg8QSN2RWOFLGt98ZixCH/EGTxvtY6A38EjeRUu8qIwm8dnQV/ljxI+M65esrs5BQ7EEbfyLyslaSsF15c9JhJBa70TIMdjy8l3O63Mtlw29i683JaBZTa0k+O78AJsJW2pqxgyu5fvjo7GIU11thSXBnQ0Jbk3rMDYhHTCp1XbknaQQiXXIZ38uMCid8fmE+bdzDqmKw1b1xIS8Un0QmEquEw0lm7z4DA87QAIDxXhm48MwnOJIWjgPJUUgtdVEb6pLKOPjw9BKM98qg1G8w1UPMUvpgyZuo5ODGAx/F2LH0ULw+8ajWSgLdISaV+kAbalNKyZOc7Z9AMTT6qm6kv5nik4rdCSNVGg9n7gXjap4f1kVexsnM4YpGfF1ZFHQbH8/ai2NpoXjj+Eq112wSG2DztRn4YJpqLwTQs6aMAx0ZSaCwzhqFddY4nBqOUMcH+Grezm57O/uaj04vVhgZJoJWLAq+De8hZTAXilDeZI7McieYKRUCSqXU3w4TQSu4HBmaxAYKJ8OtQi+s270Jh574r8IRMZgQS3jIqnRAVqUDdtwZiyciL+HlCScGaKGhaupajBCbPxSx+UPx660J+HbB9m57PrWlVcLH6cxg2viR1PBHviHhTzemYMsS1Q1ulZHIuPjt9ni9XPdIajh9LC38kTY0hDwJvp6/A4v/eAmiLgve904tg49NGYZq8Rn/v4tzGetTlYl2y9HoqdcVK6MmbBx5Ht9cmUkZz622w7zfXsUTUZcR7ZoDI4EYuZW22JU0Cjcf0NOFPKwqsHx4rE5zEPIk+GbBDiz6/Z804+H9h/dS+ffC0rAZG0ZcoM25XcrFa0dXYVf8KEz3S4aHVQVa2wXIq7HFqcwQmlGozHOjz+BCdiAalKKpJEng1WOrcDE3EPMC7sDJoha1ImNczvXHn/Fj0KJknAHyTI7XJx4ddL/PcshIguDcbU/ivaptofiANDQAwIDXjmUhN7Es5CaaxAaIL3JHcqkbkkrcEFfgRfNQNouFSC5xxRiPzsIkpqZ4v98ajz+VvDuFdVaU7TUiE1zO8+uWZ08bKprMceM+9UvX0GqEJ3Y/rXhNEvIPoHIqyKHUyF41NL6/Ph3fX+tUbOIQJKyNGmFvWoepPqlYEhJH8frfq3DE/N9eUXm+hUF38O/Z9LxUdZgbiLB3zXe4lOuPzddmIL2cXg/R0i5Q671cMTwW7087AA5BYl5gPPYmjaCkxTGxNzEaK0Ovq/2Rl2HwGxpCngQTvTo/z2IZD7XNxihrMqc0sUwoccfS7S9i56of4GGlnUe8rylpsFTULgl4Euxc9QN8NaQ9eVhXYIJXBsZ6ZmCYfRGMHirYSWRc3C30wCfnFyC70gH5tTbYnxTdbS9tXzLROx1CbqeXv0UiQK3IGAV1Q1D3MCVHRhL45dZE1LaY4LNZu/trqox4W5fBe0g5ZUwi48pT/VqMkVNlrzD+7tfYYtP+9Tj85H8YF1iz/JLgayv/7maUO2FL7GTFtq/nbwfx8Kvr1eV6HZzPDkSTWB5hFvIkivSuk5kheHvKoQGdzrM0JE6RGni7wBM748cAkKdEfjprj2I/ValZV/L8kFHhpFU66ImM4WpVHbUlv1Yu2w7Iv7sdz/C0MmfkVNn3WOJ8IONhVYGPpu/Ha0dXUcZF7QI8f2gt9q/9RmMamrJDVBXGQmZ1Tn2xccR5JJe64kI2tX60RmSC/1yarfF4E0ErNi/6o1spml1xs6zEv6bvwytHH6eMi9oFeP7gOuxf9w3l92LjiPNILXXBuewg2rniiz0QzxBxUYeLRTW+mPMXnj/4BMUBTpIEjqWH4lh6qMZzbBxxYbBFM7piSoLcIk7iTBPwyY0IINV6JweUoSGW8CCW8Wi5uiaCVozzzMS4h/lsFU3m2LjvKZrVWVTfaTQw1UMAwG01jfI6iEmJ1LuhcTQ9jBaVKW80p9RkMJFV6YC0MmcE2hfpdT6qkJEEKpvNUNlshpQyV+y4OwZblm7rtXSyDgiCxETvdIz3ykBMagS+vjwLlc1mWh37RNRlvD7hqCLthyBIvDnpKJbveEFtXw0pycGXl+dg65KfVe6j7vjBgomwBd8s2M64rbDOGv+7Pg2HHoaCa0QmeOXI49i35htwOQPP23K7wFPxnoxwy9FoZADAsfVfMo7zOFJEu+Xgyzl/YcFD4/nafd8BbWh8PH0vY4qCjCRwLc8X759Zqoj2HEyJxDTfZEzwGjgPtOl+yfjHGNXdi6uaTPHvCwtwPEP+213aYImjaeFYFUZvVjvUplThJDDmt2ILOg2NGb7JGtMADys1cX1m1Fn8fHMSmsVCNLQZ4mJuoM7KNH1BoH0hAu3lXZnb2nnY+XBcwJWonbezefXDuhwCW25MVvm70AFJEtgWJ8+xN+KLYcAXa5XSzMTh1HCFE22qTwqK6qyQVCI3PGJSI/DqhGM6nXewMDcgHrcKvLEvKZoynl9rgzePrcT3i34b8KmrHILEt/P/wCdnF2HPw0ae2uJiWYX/Lfwd3tY9NyhnByTgVoE3bQ4FdUPwxrGV+N+iXxX3kkOQ+O+8Hfj8wnz81aW+Qxs4DFGHid7p2LJ0G1458jhjx3RVcAkZXhl/HE9GX+r2PAYmxGJxOxElSyTWGAwnL6naa0AloKdXOGHalrcUDxlV2JrUM+bCWRp0SqIy1UNoy6XcAK26VnaHGIaQsbYcTqNHZnqDbcu2IuXV13F64+d4PFz+YK9sNsMLh9bSQn8AsDj4FuJefI/y33vTDvRoDhyCxKJht3F64+fYOPK8Rq/is6PO4o2JR2g/0MMcCrAg8I7G613J9cP1+6o9ReTA/t3vMS4W1fj37F14KvqiYiy93EntPelPSho6nQku5vppduVsUaPIF67QUHg9UOEQJMZ5ZeLPlf+jpH7t0SKPfyAxxKQRn8/+iyJXGV/srvfrVDWZKj7jXEKGJcPiMNUnRbH9cGrf/Ob2NbMCEmH/sBfDmaxg5FWrl+a8et8XWZUOAIClw2/CzEB96o4qSJLAkbQwxev5gXcwL7Azjfloetgj4dTRxDtTDjGmAp7PCcTWm5P6YUbdh8+V4qMZ+7Bt2VaEOWlWTbI0bMY/x51AzLr/apUipi1vTYlhdDRdzAnAT7FTKGMCngTvTzuA7Y/9D6PcszQadBaGIswLvIudq35QKd87xuMejq7/CqsjrqqtJQPkv89TfVKxf903j5CRocCFQ3AutCdxv0U6QV8oYoBFNIAOj+pqbL05GSvDrmOCZwYt/JtTZY9DKVQpWj5Xiii3ziaGXeshzA1EmOGbzHjN8iYzXMoNULxul3JxIiOU0YumzL0KB1Sp8bpbGTXBwawWaWUuyH74Y91BtFsO3C2YF0qX8vwpkY7erBvpCp8rhZtlJd6dcgj1LUY4mh6GonprnLwXgkVBtzUeL+hG0yB1GAna8PK4E1gVegP/vTILR9LCaOpC/xhzGs+NPqPyHK9MOI6z2cM0Gpz/Pj8fh5/8D6MHnxxYtniv8Y8xp7AncaTiXl3MDaKpffUUKclBcokb7lXao0ZkAiO+GDbGDYhyy4WNsXZ64sp5uUOM1RfyK0OSBOKLPRD7wBtZVQ4oa7BAZbMpakUmlL49qjrgDhaczasxzTdZUayYoSbXeKDC50oRYFesMPoaW3VzGKnjeEaoIkVrpHs2hpg0Yl7gXcV9u5rnixqRiUaxiMGGgCvFk5GX8Nn5BZCRBLbenIzP1aS6/vxw8SvgSfBk5CVczvXX6bp3izxQVG8NQP5cHO2ehfrWIvz7/DxIZFyUN5ojrsAbI920ri8dEEzyzoC7FbXXjImK5sKAPCV827Kfkctg4HEIGUiSAEGQ+G2Fbv1rbLpEOzkqzuWohzq8MR73MMbjHsoaLHCzwBsPamxQKzJBm5QHc0MRHEzrEOr0AEH2hVpFxyd6pcNtRffu5c9LtzHfS5CKe6lMlGsuolxzUdtijLtFHsivtUFVsyl2xo9WpPJ9v+g3TPRO16p+wtakHu9MjsEr448jodgdSSVuqBaZoL7FCCbCVlgaNsPPtgSRLrmwUNFA8BGBIIEXxBLuKDKZeFwYTFKsswFnaHRwr8IRH5xaCgAHvm1qAAAgAElEQVRwMKuFvUk9eFwpyhotUFhnTdv/yahLiiZvTPUQs/yTVBb+NouFGL35I8qCIyaFOVyvzMb9G9Rufyz0Bj6YdkCRltIBQZD4fNZulQo331+bhu+vT1e87q26EU3MC7yDo+lyL1RSkTvN0DiQHEVTbPl1+RaMcs/S2xzsTOvwxey/sCQ4Dv8+Px/p5U4wFbbirSkxGg0fa+NGbBp5Dl9dmqN2v5xqexxIicKykJu0bX8HLxsgz1EPccxX6KKXNlA9+xv3b1DICX84fT9WPCzmu/HABwdSonCn0ANVzWYQcCUIdXqAX5dvURzbLuXir4TR2BI7mTHtgiBIjHLPxmsTjqqUmX316OO03Ndvr87At1dn0Pa98ty/KB7xWwVe+PDMEo3e20cF5ZoETeprA5VWaedvsbO5/pXAlFVj5gbcBSB3/tgYN6Cy2QwSGRfH00OxegCn0enKkpA4/HhjKmpbjHE0PQzPjznDKE2cUOKuSDVeEHhHZylegBqVnx2QAC5HJjc4PLIUxktMauSgMzTsTOtgZ6q6WzcTtib1jA3mlNHXfSAIstfvqb1ZHRYEac4e0ISdaX23P2Pa3EsmLA2bMWVoKgD5M165H9fQIeXdLtI24LVjpFv2oPv86h2SjCDASWhL5r4lDJZ+2zE8YA0NZUobLClFq11ZGHQHL4w5pXjNVA8x00+1hJyxoA3jvTMoCiQpZa7IqbbvcT5hu1T+wFIm1PGBWhnN2QGJFEMD6J26EU1YGHaGyetbNevVayKr0gHtUvlHjsuRwliNt6Ir9qZ1+Hr+diSXusLXphSGfDHF4DQWtDF6H9dGXMH+5GiVSlUdfHdtBmb7J9Dm9CirTnVFOS2iqzpKVwprh+Dd00sRl+9NGW+RCVCqJDvbJDbAsweewK0C766nUECSBK7f90Fc/kv49+zdKiUHdSE2fyg27tugiFQYCdowzKEQXlYVcLOqhIVBMyyNmvHMgfW0rreDFYlSVKY737GBQquEj7RSF8XraT7MkWhdyap0UMhjGvHFmOojX3BwCRlmByTg94cKS4fTwh9JQ8OIL8bqiKv47uoMSGUc/BI3kdEJ98vD/gdcQoanRlykbdeWNgmP8mydp/T9nhdwV2FonM0KwgdThQqxBhaW3kAs4UGglJJ9Nc9PIQTBJWQYomV0nUUlhgSJb8RJnAmCNvIpRJHVA8rQ8LIux6sTjuFs1jAkl7pq7PrtPaQMz485Qyt+61oPYWtSr1JHvYPZfgk0qcOYlJ4XqF3O86fVe8wOSFSxtxwPqwoE2BVT1Jc66kY6ojZ9gbIiV0derzIdERtt2bR/vVqDsSdwCRnSXqfr+PO5Urw/9SCe3LNJ7fFVTabYFjcRL449RRl/FFSntKW8sTMN0FpNWtKlnAB8dXGOQrFHFTKSwHMHO40MDkFiTkA8pvkmw8m8Fq3tAqSUOuPPu2NQUDcEEhkXrx9bCXOhiJa2NcItG8b8NiSVuipEILyHlCHc6QHtugYPaxRkJIF/nVmkMDIeC72BVyccY1x8E3h0inFyq+0U//bSQ+FlXyKVcfDx2UWKFL6pPikqm7HqymGl58PkoamUhe3cgHiFoZFa5qIXZ9NAZFXYdfwSNxHNYiEOpETimVFnKZ7h3Go7hbrbDP8kuKpI89WGCzmdUqAeVhUY5tDZYXrS0DQYC9rQLBZCJBbibFYQ5gfd1flaLCya+Oz8AsQXu2OoTRma24SU7uajPLIHpXNmYEIsaBcSI2UpvCcGlKFhKmzFU9EX8VT0RZQ3WiChxA151baobjZBq0QALiGDiUEr3C0rMdwxn7GoSizh4bnRZyljdiYNGpvDjPdKpylwWAg7c+oeC72Bsd3s4uhiXg0Oh6SdV5vUok9m7qH1AFHVLb03EEt42KEkA9zh9RuwqLEHRrlnYbJ3Gs7nBKreCcBvtyZgWUgcNdr0N0mdqmoypfQxGa6mmVdHPZOlYTOWhMRh0tA0OJvXQCYjUNtijMomebrOn3fHKCIeQp4Emxf8RjMgQp3uY/nwWPzzyBpcyA4ESRJ46+QKnN74OUV9bklwHJYEx+HLi3MUhsYItxy8O+WQynnmVdvhfo08XcrfthjvTz044FVdekqNyAQXczrrzfo6CqqJwjprxOZT01pb2/loaDVEUb01jqSFIb9WHn2cF3gXn8zYq9frS0mOIh1Ufg1qykegfRG8rcuQU20PQG6UvDL+uF7nMBAwNxBheWgsfo2bALGEh19uTcBbkw4rtv8SNxGyhznum0ac79G1lAvrlQvAAcCQL8ZUnxRFKltMaiRraLD0Oh09h5SxM63H+1N7JmbDQoUErAkpGTagDA1l7EzrMMO3e7mPgLxoTRdZQqGG44LsCxH0UE6wu2ijVd6VALviXpeU7UpGuRNaJXxUNplhT+JIxYJuqk8KYwOrgrohOHUvhDLmZFZL8Vgpc3Dd1zDmt4HLleHmA2+s37sJQp4ESa+8of8/pgvvTj2EG/lDGdWzOmiV8PHN1Zn4YvZfvT6fgQRJEvj0/EJFMRyfK8U03xSV+xMEiTXhV/H8mNM07Xc703r42co907/cmqAYf37MaZXF5UKeBF/N2YnZv7yG0gZLVDeb4kBSFNZG9qyJV5mSoIKvbekjb2Q0iQ3wz8NrFAXzNsYNWBZKrzvqT46kheNImmYFviD7QiwJjgNfT+ISHdx84K0oMh9i0ohRDNGSuYHxiu7dR9PD8M9xJ3TqYjzQeSLyMv68OwZiCQ/7Ekfg6ZHnYGnYjPJGC4UxNsEro0cNE2tEJgqPMUGQmBtIT4tULsKPK/BGeaN5j+pBWFjU4WtbjED7IpQ3maNdwoW9WR3GeWTiyehLfZox8jfgPoeUreYNJ68PWEODpe/5z2V6w52pPqn4QoUqyfX7PjQZVHnDPmZDQ/lL3NuNhbriYFaL9dGXKM0JmTiSFobHw67RjKVHNa5R0mCJzy/Mw5l7nWmDK8Ouq60henHsKTw98pza88oXDPJaDSO+GKtCr6vd30jQhlVh1xWF+zGpET02NAz5nZKDuVXMheAkSeBgSiStpmug0ig2BL+1c/EtEgtR1mSOO4We+Ct+lCI10YDXjq/n76D1JBospJa5YM2uZ+FrW4J/Td+PEMd8vZyXUpTsl8CohjM3MB7fXJ0JkiRQ1mCB2wVeiHbL0cv1BxI2xg1YFHQbuxNHQtQuwB+3x+GlcSfx+51xinTDTRq+55o4lh6qiMSHOj5gLDpXLsKXkQSOpodR5LZZWPTJY6GxeCxUt87kLFqzQ8CXPYsAsgkYJMXgLL2Hs3k1RSmBz5XAyqgZdqb1GO+VQdPJNhK0qVVW8NKyu2t/eAifir6AmJRwhcwiEyRJYPO1adi6dFsfzqx3aRELKV1b22VcNLQYIbvKDunlzpRFdqRLLl4Zpz5VxEILr49yt9UI1zytCjzHe2YqDI2sSgc0iQ16tFAOsJN3AReJhUgpc8Wn5xdgXcQVOJjVolksxO0CL/x6ewLuFKrvID+QmPmz5uifi0U1vpy7E8P1tDjXJ2FO9xHuzKy939hmiEaxAdLKnBXiDfcqHLFm17P4acm2Hiu6iMRCnMsapnjN5F0HAEezWoQ731d8LmJSIx9JQwMA1kddwr6kaEhJDnbGj8HSkDjsTZQ3QYt2ze3xZ+iwUvRqbiBzShSXkGFWQCL+uD0OgNzJMNgMDZIkkF7urNOxlkZNcFTj2AHkKYcppS4oqBuCxlYDkAQBQ54YNiYN8LCqgL9dCaUbtjY0thngVqEX8qrsUC0yQbuUCzODFlgbNcHHthSBdkXdqlcQS3hILHFDSpkrqppNIWoTwoAvhqVRM/xtixHhkqfV+VTdS0/r8h51FO+YY3aVA22cw5FpnXmSU22Ptna+2n0EXAnMDEQwNWih9DV61CGBKoIkNgiGS2KUx1lD42/OgqA73ZKmc7Go1lnjW5mOCEFfmhsGvHa8OfkInj/4hNr9rt33Q2mDpdyr/wikTIjaBfg5Tn0zKIIgsST4Ft6bcpCiyKEruVWdBcneWhqfHtYV4BIySEkOpCQHD2psdE5XBOT535tGnFekwey4M5ZSd9SBEV+MFglfo/jEQIcgSLw8/gQeD7vW4wdybzHSPVttZ/AOrt/3wTunlqOswQJtEh5eOfI4Tm74AuYGumvRn8kaBtHD1ElP6wq1n625gXcVhsaZrGF4b9qBR3LB4GJZhRn+STieHorGNgOs27NJkXr39KizGo5WT061PdLK5OphfK4UM/1UpybPC7irMDRyquyRVuaMQPuiHl2/L5GSHCz+4yWdjl0echMfzdhHGycfRnf+uDNWcR9VwSFIeA8pw+ShqXgsNFat5GtqmQt+vD4Vl/L81SrtCXkSjPdKx4rhsRjplq0y9bSy2Qzbbk7EvqQRiu8XE1yODLP8EvHMqLPwtK5QuZ8MBOO9PLD2GwT24HkAAKezgvHa0VWM244++ZVWDQVfPbJKkVauDQ5mtZjqk4r1UZe6LYU8mCBAnpXIyHVGoSRNo541NFj6he5GNLIqHfDN1ZnIrrTv0XWbtOgWLyMJZFfaqU0felSwMW7ACLccrIu8rNcHu7IcsrlQu8UhjyOFqUEr6lqM5Odo6bmk8sYRF1DTYoLtd8YyGhKj3LPwzpQYzP/1FUjIgd+sb6J3OoTczpQwUbsAV/Lk8qAkSSCz3Eljl1pl9FW3om/VrtEeWfh5yTYs+P1lSGUc1IhMcDA5Ek9EXdb5nDFKaVOhTg/ULt5cLarBIUjISALNYiHOZwfpVXZ5ILEx+gJOZAwHSRIorJULkAQ7FPQ4gnQ4pTOaEWRXiOJ6axSriSbbmtQr6meOpIUPKkND39S2GOOlmLWIK/DSan8ZSSgKnL2tyzE7gC7nLyMJfHN1Jn6+OUkrp0qbhIcz94Jx5l4wfl/+E6P62/X7Pnj5yGrUtxppPJ9UJhdiOHUvBO9OPYjlDH2repuujZ6ViUkNx2sTe6YyykRpgyW23xmLmJQI/GfeDpWdxgcxrQA+5IeQX/JBMjYg+VsZGk1iA9SKjNEm4cOA3w4b43oI9eC9fZSRyjiobDJDbasxSBKwNBTB1qReq06f6iC60RDnXoUjVv/1rEIisS8Qyx6dr4a5gYiifMYhZDAzaIWVYXOveViUO2zzuNq/11xOZ/2BWNrz94AgSLw16TAWBt3GqcwQFNVbw5jfBjuzOkwZmqoodN229GeQBGDA136R3h98PH0vhnTp/vvp+QWKSM3xjOFwsqjGy+NOaHU+Y16bQgSg4//aory/aS/Uggy1KUW4c55CHjm2wEdnQ6O80QK3lHq+MDUbVUdMauQja2j42pZgnGcmpev3xpE9U5qSkQSOKKl7JZS4d8vjfywjFK9PPNrj58xgpE3Cw5O7Nyl6veiLd08sx8FU1QttdTDJvF/IDsQ/Dq3rdn1bu5SLD04tRUOrETZEX9BpPrpQ3miBm10U75Q5mh6Glyec6HazPm1paDPEi4fX4tC6r+FmWdkr1+gH0giZbBU/lFSrwDTgVlPp5U54MWZtt487ueEL8Dh0hZK0MhfsS4rG1fu+KK63omwjCBKOZrUItC9CtGsupgxNUahdvH18BW4X6Z67/fTIc1gcfAsAMGfba2hT6nTrZ1uKzQt/YzzuSFo4Nl+jNut7b8pBimJPYombyvAflyODsaAVJsI2eFpVIsCuEOO9MrvVPZMkCVzIDcC+xBG4XeilCKV3YCRoQ4RzHpaG3MSUoWk6eUUJovNamvj3xXl9amQQBIlgh0LFvwc7PK60zzuWmhp0Ljyb29Q3/1OmWSniZGagv8Wrn22Jyq7jAPTeq6EveXPSEeTXDFFENrbGToarRTWWBMdpPNZY2IraVnmfH01NGrvSKO78Tpro8b1Sxs2yWmFolHXpVt8djqSHQdaD1LgOtSpduhAPBjaNPK8wNLyHlPVYFvlWfqcYhC5UN5vi2n1fjPfK6NE8+psxHvc01pkFOFDTgX6/PZ7RyJjhm4TZAfFwt6wGlyNFjcgEmRWOuJLnh+sPfNWmQf2VMEqlkRHsUICZfolws6yCDAQyK5xwKCWCtl5SpqBuCN44vpJmZHAIEjP9EzHHPx62Jg1obDXEuZwg7E0aQXNkfHN5JgLtirSS+9cHR9LU/wZUNJnjxv2hOkUcZvolIcC+CGIJD63tfBTUD0Hs/aG0dYtILMTvt8czNsgcZJAEsJlvLHsd3qTGwpsBZ2i0SfmUjs/aQnZZD7ZK+Pj47CIcTIlUuZglSQLF9VYorrfCmXvB+OH6VNz4xwcAgEqRmU7z6KBR6QNWVG+NVkmnocHUwbqDJrGQdl2RhLoAaJPwtJqbvIfBSMWX/42JRzU+KMsbzfFSzBoklLir3EckFuJKnj+u5Pkj2KEA3y7Y3u00I46WqRaidgFu52sXPtYXI1xzHtkFRV9hZ9LZXbVrPxhVVDSZU74n7HugHVxChq/n78Bjf/5DoQ3/4enFcDSr1fgQtzerV4gjdPf3Lr+m8311NO+dNEPlhUF3UsK6opzGM8bjHpy0/L06kTkcjW0GkJIcHEsLxZPRl3Sew0AmzOk+1kZeQXmDORYOu91jB4uyulegfRGC7LRLg4rN91b8XhxOixj0hsabk45oXaPWwdG0MNrY2sgrlD4ngLzOKMIlD4+HX0NpgyW2xU3AroTRtGObxUJ8d3UmbZzPleKjGfuwKOg2ZXzK0FQ8M/IsDqeF44sL8xjTojZfna5oqtkBhyDx5ZydtLStEe7ZmBsQj/V7NlKavEpJDr64OBcx6/7bJw69Q1pEc2JSo3QyNMZ7pdNqXWtEJljyx0so6dKkOLHYFYOcMpLgPCEIbj+leVc5A87Q0AdSGQeb9m3QOr/xUUdGEjieHopb+V74buF2hDoxq76UNFhixY5/KPJktSG51BWL/3gJu1dv7lb3WG1rNMoaLPpUetTZvBqfz96teP0IBDT6hWDHB9iVMBIAEF/kDvJh8y913C1yV/zb2rgRLhZ0KUwWZowFbfhpyS9Yuv1FVDebQiLj4sWYtfhr1fdqCxwD7YsURc/ytIKTWl9TufHesB4WaapCuSZLkzKPKtIedvgG5HVA/zfnL7XOHmVIAHuT5CpMMWkRj6yhAYC2kNUVUbsAp5XUvV6dcEzriOruxJH48PQSAPLUnMY2A1qvnkedwnq6Y8bOWL3TxcGsFu9NPYQFQXdh0UUwYX9StKLuTZk3Jx2hGRkdcDkyLBp2G6Pds/HykVWUbJHyRgucyBhOO2b58FjG2hAACHHMx6sTjyne2w7uVTji2n2fXq9bSC51RV41VeJ8ul8yLepwXo+fOSujJsz0S8QvtyZSxrsaaIMKktwvEJCbECCt6c5hg8LQ8LEphaeVapUCgLpw3ZM0gmZk2Bg34InIyxjmWAgjvhgNbQbIqnTAlTx/xD4YSgupRTjnwphP/7B1bVBnbdyISIZmdu5WfZuDF+WSi2DHAjS2GqK+1RBp5c40D2Vlsxk27H0Kh9Z9DRdLqlHQLuXiH4fW0YwMS4NmrI68inDnPBAAEord8cedcagRmSj2qRGZ4LmD67B/zTda17x0LDq7RqK6QqroYDHUphReGj4THbRIBIz5581iIaQP33droyaEOT/AiuE3YGGou7INi5xRbtngcmSQyjgoabBEbP5Qjd71fQ8XdAAwzmNwFswlFHugVemzFuZ0v8/qwBzNavHDot+wdtezaJPw0NhmgI3712Pvmu9gY9zAeMxot3sKtZ/EEjfcLfJkbM7ZlbtFnkhVKqYe3QvvV2z+UKQoXWOijuk8yhKro9yztDYyAGBOQLzC0MiqdEBGhZNODVj/TpzLGqZIw7MxbkCUa67Wx87wTcKn5xaiXcpFq4SP0/dCtEoBfJQwNWhBW5MpZezH2KngcaWY4ZesNtLL1Cz3Yl4AbczdqhIrQm9onIudaR12rvqBMnbtvg/N+UcQJJ6MVF8/tXjYLXx3dQZl7QAAV+7797qhEcNQBL4g8DaM+W04qLStVcLHyczhWKanQnWCYfnSW9HfXqaBAPEaf7h0qy4HDwpDY45/QreK046nh1JecwgS+9d+Syt8HemWjbURV1BQNwTfXZ2BGw86PXSbVFzP//++oqRi+dmWUgpt+4uxnpnYMIJaWHWrwAvvnFxOMTiaxAZ4+cgq7F6zmVL0dDgtAmllVO1qB7Na7Fz1A8WTGOWai4XD7mDVX88qFEoAILvSAfuTR2BV2DWt5qttqFRV2tsc/wSV71FSiZtamT11dM2N7cvakEcJO9N6TPdNVni+Pjm3ELtXf6dS6/1wajhuPOhs/vh4+NU+mae+eevEckUPCAC49MzHsDfrO0nD4Y75+GzWLrx69HGQJIHSBks8vf9J7Fj5P0Z51jGe9+BhVYH7NXJv3+vHHsNfq75X25m5oskcbxxboXjtaV2BEa766zNBkgROZAzH+6eXKr7/LpZVmO6X3O1zSWRcHFN6HqjqnaGKCJc82JnWKeoNDqeGw38Sa2ioQzltalZAYreKay0MRRjrmYkL2YHyc6WGD2pDY/3eDRCo6W5vZiDCgbXfUMY8LStQ1cXQaGwzwGfnF+Cz8wvgZlmJYIdChDjmY6R7Nrysy1WeXyrjIFEpUtzBdN9knYue7zL0HXK1qKI5L7vC50ox0i0Hx7tEQ+KLPFQcoR/EEh5OZFKvaW4gwhiPe+BzpRRDAwBiUiL0Ymg0tBlSInsd+NlqltAdWBA3Sal0tSCM1PlHflAYGt2lrEsRGglAoqZQytWiCl/N/VOR3/yoEOWai92Pb8aC315GZbOZYjylzBXn7gVRHtzbGfoLfDjtAGO6gq1JPT6Zvg9rdz9DGf/9zljtDQ0tazR06W3wzollilQJlv7jlfHHcTXPD41tBsirtsXqv57Fh9MOUlL3RGIhtt8dSxFAWDE89m8tbdlTZvsn4kGNreKeppW54JUjq/H9ot9oiwsOQeL9aQfx1J6NkJIcFNdbYcGvr+CZ0Wcx3TeZYnBUNJnjbNYw/HB9qsIrySFIvDvlkNaOg5xqe1pUuKHVUN6sr9UAVc2miCvwpjhHDPlifDF7N61Go1XCR9vDmp6uhez1rYYgCHlUpGOuRnxxt4ucOQSJ2QGJ+DVuAgDgWEYYXptwTC9qSFXNJhr723RlafBNWBiK0NIuUKiytUiUnCokKDn1Jn2cdlTRZI6bDzrVvXRR6prjH68wNO4UeaK43gpO5t3K1BgwaCqItzSkp9HMD7qDW4Wq077za22QX2uDow9VvRzNavFY6A0sDblJi8bXtRhT6t46CLKnRz60pUJpLdGBj41qY0cZpoa+ZY26izxow6XcAFrq2FSflIeGTzasjJooUZaEEncU1A3pVip4Szsf9a1GaGwzRFObEA9qbbA1djLFGQvIja2Vodd79gf1HRKQ+FSQLf0YS0nV1rIWDApDo7zJTK3muYNZLSUcbmtST1FMIEkCy/98AYuH3cIotywEORQydqj00aJZy2DD2rgRL407iXdOLqeMH88MVRgaVU2myK6iLswdzGoxzjMTqoh2y4GXdTlyqzsbsxXWDkFRvTWczTXn1nekuqlKjepA1fJF3XFN7YM4B/IRwsm8Bl/O3YkXY9aiTcLDvQpHPPbn87A3q4OLeTVa2gXIrnJAm1KqUaRLLl6fdKQfZ/1o8Oyos7hfY6vw5l/MCcBn5+bjvamHaPuOdMvG65OO4osL8yAjCdS2Giu8p8aCNlgaNqG2xYSmPschSLwx6Ui3VGNOZwbjdGaw1vs7mdfg/+bsQhhDXdmW2Mn48cZUxuNGfPcxbWzS0DStOtR3ZY5/vMLQqGoyxfX7PhQVQF2paDLHfy7N7tYxU4emwMJQhC8uzMPuxJG07bWtxoj+tvNvP/HUFz2eZ3c4lhaqSKtxt6rUqeHmRO90GAva0CwWgiQJHEkLxzM9bB44mFg47DYu5QbgLIM3nImSBkv85/JsbL05GZ/N2oWpPqmKbbUtxozHmBt2r4u4Mkz9jcy0bKRpbkC/bj1D/Yg+YSoC76gl4XJkmO6bjF0JoxTbSJJATEoEXhirda0zPjqzBB+dWaJ2Hy5Hhi/n7uzztHoduc8hZY/zhpM3QC/H6TaDwtDYGT8GO+PHqNz+wbT9eCw0VvE61DkfCcXUcFxVkym2xE7GltjJ4BIyeA4pxyi3bIzzzMBI9+xuN5AbTEzzTcZ7p5ZR6lCUozfp5U60yEGY8wONXsoI5/sUQwMA0suctDM0OL0X0fhp8S+obTFGQ4shSKYkyW7wa9wEJJcOepWIfmOCVzp+WbYF755apkgpKmuwQFkD1dPHJWRYGhKHtybHsL1t9ABBkPh05m4U11sofgt3xo+Bq2U11kZcoe2/NuIK3Cyr8MnZBQoVKkBex9TVwADkognvTzuo1hnRE9wsK7Ek+BZWhV/TW0fuuQF3dTouwK6Y4lQ5nB6hF0PjUUS5KeIcf936jhjyxZjik4rDqfLamsN/M0ODQ5D4ZsF2/Bo3Ab/emqDSWOhKY5sBXjq8Fr+t+AlRLvK6GCbJfwBqpXA1wWNIBdP2fBIpfT++mtSynlIjMsHVPF/KmLVxI6VuaJZ/IsXQAICY1Ag8P+a03taFzubV+Gj6foz26Bsp3x6yQ8CXPYsAUvtiNg0MCkOjuzwVdRH7EkeorO6XkhxkVzogu9IBf9wZB3erSrw49iRm+qntOTJoMRW2wsq4iZL3Wa4Urqxrpf+Q2Ztoziu3ZcjjrhZp96OorQGhMqKh5nh1/RK6y+FU+YNT352Pe5sguyK8MuE4AOhlobZo2C1EPnx4hTh2L+we4ZKHY+u/xMnMEFzIDkJ2lR1qRCYQ8CRwMKlDpFsu5vonqFVH6mCcVwYsjOTeM128pb3Nk1GXKKkrpgwevO5gZ9KgeB8BwEiovUdeyJPgh0W/40BKZ2M6iYwLUbuA8TMxwSsdYz0ycT47CLH5Pkgtdc5K+foAAA58SURBVEK1yBTNYiFMhK2wMmxCkEMxRrhmYYpPqtbpQytCb2CSj/qUJTMDEYz5bbAwFMHHpkwraePR7lkwEmj32SZA9ugh/86UGKSVy2vYDHm6f5+i3HIp72d3sTBsBgBM8UmBk4XmdCJLo2ZM8kqDzUO56TCnBzpfG6B+vsOcqecStQsoNTDzetDgcH3URYos7GBVn9q1erNaIRtVzjwuIcOGERewOuIqDqeF43xWEO4WeTIa/cpIZRx8fXkmdj3+PQDAXIWwSVWzKeO4NlgwRENqtHzuV7eY0MZUzVEfHE0Lg0TGpYx1rU8Jd6bWYQHyKNHtQk9Ed0PIQBUcgsT/Fv824DNmSKCSIIkNguES/cjPKfFIGhpWRk34ZfkWvBSzhqZhzMSDGhv88/Aa3K85hWcfUc+JIb8NQOePS0u7AG0SHoQ8CWMOpzZeZSGDrr1YSj+XWnRUneorpLL+vb6u+NiU6vWHbYZvz4xwHkeKuQHxPe6uHO2aq5cf/95CX2olHVgbN/aoe66VUVO3judyZJjmm4xpvt0vvFbF/CDdIgmaiHDJQ4SLZoUsfTDKPUsvjcVCHR8g1PFBj88zxuMexmip9DXCPVtvDSnVfb6N+GK9dXrW9+9Xf2EqaIW5lmlFTBjw2rE85CaWh9yEVMZBRoUTUkpdkFzihku5/ozRjqQSdzSLhTAWtMHcQARTYSvN6Xq30FPn32JXhqLv9Apnhj3pZJTT93PTUETeE2JSI2hjpzJDcDXPjzLWwNAr5HBKpNbPmvFeGfAZUoo2KR87746mqHLJSAKvH1uJXY9vhqGeorP6hzwjlZFPGIWS+vPSKjEoDI05AQmY4pOicnsgg9xgsEMBTm/8N45lhGJ3wiiklLpq7Ay7+dp0jPfMeCQLUWu6eDAM+WKFMdFVdxsAGsWa6xyYFJl68qPKhCr5276KL8j6sIcHCwsLC8vfF4mMi2axkPE5yuXIEGRfiCD7QjwWegMisRCvHlulKJzvQEYSqGsxhrGgDRyCRJRLLs7nUPc5dS8EL084rlIFUJnyRgsIeWJFoflIt2yFJHYHVU2muFXopUjZYqJGZIKb+d608Wg9KtYpk1nhyNhhvUZkQpPYZeJUVjDenXZQq4yAmX6JioZ9ZkIRvr8+nbI9s8IRH5xegv+b85eWs+8zWkkCbwqDye8EGpsN6M6gWEX5DCnFDN8klf+pklXjc6VYGHQHe1Z/h9gX3scPi3/FxpHnMcI9GwIGjz1JEhSJzd5CnQKWjGEb0cP3P6vSgRZyVfYWMclvaqPAlVNFV3bStqmWtn9Sfy/0JayhwcLCwsLSB5Q2WGDSj+9id+JIjenFRoI2rFYhA26pJI4zmcFJW9dihE/OLtR4jat5vljw68tIV4pERLnmwPJhCp8yX1+eqba57jdXZqJdSk1j4hAkpusxeqoMUzSjO4jEQpy5p71wRQfPjD6HaDe68XQkLVxtrXE/kAquLFoYLP1W+xWZbjySq6gWhh4K5gYiTPZOw8vjTuD35T/h8rP/YmwS07XJnT4w7pJbWqFGzq2rNC8AmBr0LDd15136h3uCV4bi34F2RTQVrsRid7VWf5PYgOadEPIkCO5m/r6m1ChVUShdisR1gXxo+PV3ChcLCwsLy6NPs1iID08vwYLfX8bBlEiVPaHkPWLCaONB9oUUL/y8wHi4WNAFWo6khePFw2towhyA3In4xvGV2Lh/A2q71HAa8cVYE0E3cBKKPfD6sZU0p6ZUxsHma9MVjS+VmeqborYPiK5IZRyF/K8yTuY1cLGoZvyPqZGnsriBtnAJGf4z509YGzfStn1+YR5NqKgfIAngOwFfFi4IInvHyuvCoEid6g5SGQdjvv8Qr044hhXDY1UWW1kaNuPJqIs0RQJTLUKJ3cXRtBbVSqlLVSJT5FbbMX7BUhgUjrSNEjCxO3Ek9iZHU8aM+GIsH96p0sXlyDDVJ4XiAWiT8PD9tel4f9oBxvN+f20aTbt+gnc6TeteFdou3DWlu/UVg60YnIWFhYWlf5nzy2sa91kechMfzdhHG79X4Yi3T6zAB6eXIsQxH742JbA2li+GSxsscTPfm9Exuj76IuU1jyPF+1MP4On9T9EiDmfuBeNCdiCCHQrgblkFUbsAeTW2yK6yV+vMeyLqEs5lB9Ga/B5PD8WN+z6Y6J0OR/Na1IiMcSXXj6Jk14GVURPenqR93fHiP17SuM+aiKt4e3IMrt73o6y5AHnTzzMbPle5JsyscMSC316hjN3K90ZpgyUcurkGG2LSiK/m7sT6PZsoa5h2KRcvxqzGoXVfMxoivQ6BAplMttZgOHmpLy87KAyN+lZDjZEGZ/MaxQeoWSzER2cWY8fdsVgdfgVTfNJgY9xA2b+xzYAmaQYAI/VUNKfMKI9spJR1GhAkSeCjM4vw7YLtihCkjCTw590xiCugNupxMq/RSne5VSJvGCORctHYZoCsSgfsT4nGlVw/2r5vTY6hWe8bR5zH0fQwikzdXwmjYCxoxXNjzigMiHYpFz/FTsEfd6g5mhyCxKYR5zTOs7uQKkKxvRvo64TQQ2MuFhYWFhYWXWiXcnGn0BN3GDpyd2Vl2HVG9cyxnvfw1uTD+PT8ApoBIZFxEV/sgfhueNoNeO34bsEfWLvraZoRUdtiTOu23RVTYSu+XbAddqaa1S11ISaFHomY5ZekVrLfz7aE1htMRhI4nBaOp0d2f20z0i0bT488h/916fVT0WSOfx5ejd9W/KSXxp9aQ2CfgCd7GgFkn3e/HBSGxi+3JuKXWxPV7pPy6us0Pea8altFIxV3q0rYm9XBVNCKqmYT3KtwooUkI1zy9KIs0pXHw69hx52xlOvdKvDG+P+9D3fLShgLWvGg2pYWogSAp7p4J1Txw/Vp+OH6NI37LQmOw9KQONq4p3UFXh1/DF9cnEcZ/zluEnYljEKgfTEIjgwZZU4U+c4Onht9BgF29KJ8TWiyF/o7osFhIxksLCwsLH2AAb8dQ0waKVL02mDEF+MfY07hiajLKvd5PPwaXC2r8NaJFTRvvzrszepga9JAG3cyr8G+td/ijeMrGR2aqvC1LcHX83bA01q17G9PqG81woXcQNr4bP8EjcfO9EukFXLHpEboZGgAwHNjzuBOkQduFVDTzG8VeuHLS3PwZt80p20gQLzGD5Zs7YuLMTEoDA198KDGRtEwjAlf2xJ8M297rzTuszFuwOezd+Gfh1dTQpdiCU9t0fVMvyRKilNP4BIyvDTupFrDZV3kFdS1GmPrzUkUr0eT2IAWaVFmbcSVbjdU0r4YXIWh0cNGfNryKDdyZGFhYWHpOQRIxjoIbbAw6iystjFuwJVnP0JCsQfOZA3DlVw/FNQNYWyIx+XI4DOkFNN8U7A4+JZWvWfGeWbi/NOf4mByFI5nDEdyqRutQBuQy2pHu+ZidkA8JnhmqPS8Wxo2Y+uSn3G70At/xo/BrQdejA5TI74YYc73sSQkDtN8kjU+V3W+l4bNiM0fCrsu98LRvFYrueTZAYk43KUuQyqT913r6PNkZ1pPq0MxFjDX0XIJGb6a+xee2ruBVjt8PjsIk4amqVXq6jEEEUtypKsFQWS/asI/coYGhyDx6oRjOJs1DMmlrhqLhs2ELVgVfg0bRlzQWwdaJqb5JuOPx37ER2cXIVuDopOZsAUbRl7Ak1GXerzQtTFuwBSfNKyNuKwxBYsgSPxz3AmEOd3Hf6/Mwr0KR7X7e1uX4cVxJzHVJ7VHc1SHqr9eueFOb6JtB3MWFhYWlr8nXI4MZzd9ppdzcQgS4c55CHfOw1uTDqNdykVxvRWaxQZobDWAgUAME2EbXMyrtOp31RUDXjtWhl3HyrDraJXwUVRvjVqRMSQyjry5r1FTt+tCI11yEemSCxlJoLBuCKqaTdHQagBjYRusDJvhZlmpdQdwLtHze6lr3ycPqwqN196yZFu3zmlrUv//7d1LTxNRGAbg9wzMlNBiKSjYEqgFFppYKJEETQgu2bhFTbxF0o2Jf8DExFvcseIv6MbgSje4wrDwEmPUsAAaBUsgQgoVbMTWdua4EIiGtpRemCm8z65pOvkyky6+Od85L54NDuVVTwFSkHiohfQHGJCli17PkeUajRbnStqNUTvZ7LiFkAj2jCHYM4alWC3ehNvwJdqI5dghrCc1GBBwqAl4nFGcdM/jjDe0qz/r3f6n/31272LGsLt5Bs8Hh/BhwYd3c60ILbvxI16FpF4JZ9U6PLXf0Xk0jL62qazBLr665Yz3yK4moCo66uw/0eSMwl2zmnUuMZ2zbZPoa53Cp28teBtux2y0YSv501W9jmOuCE57P6PT87XgRkhKgScbp1H8TqqIbwT+nWhYQK9vGlpF+mfjyPAGAQCGXp7D/GpdQXVtmlzM3mwRERGVilqh57RPMx9VlUm01y8CRTpsUxESXlcEXldp6qWcTAnFuKz65XsEzC7lL8s1GvX2GC4UKV23sWa16Km0xaitq2kWXU2zef++wbFWtHuUiRASAU8YAU+4JNf/99SpO6MD276/GHiNXt802g8vwa4lti1V+rMcozs+czynHBAiIiKifeKRJowb8MvtQScmslyjQQeDpuhZ5zBrN07jcmhx3O8fwe3R81szjte6x7M2QEccsbRZKoVw2ArLMiEiIiIqNglEIETQ1pHak93luyUSHzmETta3Fq9GKOJGs3MlbZI5ERER0cEiX6RS8nr1KbnzbneTsNEgIiIiIiofv6TALVuHMbx3yWL54egUEREREVF5mIBiXLL55YTZheQifewyERERERFZhRTAsKYa3VqZNBkAVzSIiIiIiKxLYE7RjauVXTJz/LtFcUWDiIiIiMiKBEY0YQTKsckAuKJBRERERGQ1a4C4qXWkHptdSCHYaBARERERWYZ4JRX9is0vZ8yupFAcnSIiIiIiMl8KEve0kN63H5oMAPgDLNrvuxlCaFsAAAAASUVORK5CYII=
```
