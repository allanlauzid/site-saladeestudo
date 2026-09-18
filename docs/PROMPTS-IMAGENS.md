# Imagens das Novidades — prompts prontos

11 ilustrações fixas. O `novidades.js` escolhe qual usar por palavras-chave do
título e do resumo do post; se nenhuma casar, usa a padrão do tema.

Salve os arquivos **nesta pasta** (`assets/img/png/novidades/`) com o nome exato da lista.
Formato final: `.webp`. Se o ChatGPT devolver `.png`, salve assim mesmo e peça
ao Claude para converter.

---

## PASSO 1 — cole isto uma vez no ChatGPT

```
Você vai criar uma série de 11 ilustrações para o blog "Novidades" do site de
um reforço escolar brasileiro (Sala de Estudo, Recife). Elas aparecem como
faixa no topo de cards, recortadas em 16:9, então o elemento principal precisa
ficar centralizado com margem de respiro nas bordas.

IDENTIDADE VISUAL (vale para todas):
- Ilustração vetorial chapada (flat design), traço limpo e grosso, geométrica
- Cores: azul royal forte (#004EB5) como cor dominante, amarelo ouro vibrante
  (#FFD100) como destaque, branco, e fundo cinza-azulado bem claro (#F8F9FA)
  com uma malha quadriculada sutil, como papel milimetrado
- Sem degradês, sem sombras realistas, sem 3D, sem brilho
- Figuras humanas, quando houver, são silhuetas azuis simples e estilizadas,
  sem rosto detalhado
- Tom: alegre, moderno, editorial, organizado — nada infantil demais

REGRAS RÍGIDAS:
- NENHUM texto, letra, número, palavra, logotipo ou marca d'água na imagem
- Nada de fotorrealismo
- Composição centralizada, com espaço vazio nas bordas (a imagem será cortada)
- Proporção 16:9 (1792x1024)

Para cada item que eu enviar, faça duas coisas:
1. Escreva o prompt de imagem completo em inglês, detalhando a cena dentro
   dessa identidade visual
2. Gere a imagem a partir desse prompt

Confirme que entendeu e aguarde a lista.
```

---

## PASSO 2 — envie os itens (um de cada vez, ou em blocos de 2 a 3)

| Arquivo | Cena |
|---|---|
| `enem-prova.webp` | Cartão-resposta de prova com bolinhas preenchidas, lápis apoiado em diagonal e uma prancheta |
| `enem-inscricao.webp` | Formulário de inscrição com carimbo de confirmação ao lado de um calendário com um dia circulado |
| `enem-resultado.webp` | Gráfico de barras em ascensão ao lado de uma prancheta com selo de aprovação e confetes discretos |
| `ssa-upe.webp` | Três degraus de escada, um livro em cada degrau, subindo até um diploma enrolado com fita no topo |
| `estudo-rotina.webp` | Planner semanal aberto com blocos de horário coloridos e um relógio redondo ao lado |
| `estudo-memoria.webp` | Cérebro estilizado com engrenagens dentro e uma lâmpada acesa, ligados por linhas de conexão |
| `estudo-leitura.webp` | Pilha de livros com um aberto no topo, marcador de página e um caderno de resumos ao lado |
| `estudo-foco.webp` | Mesa de estudo organizada com luminária acesa, caderno aberto e um celular virado para baixo |
| `escola-calendario.webp` | Calendário grande de parede com alguns dias marcados, mochila escolar encostada e um sino |
| `escola-recife.webp` | Skyline estilizado de Recife (prédios, ponte sobre o rio) ao fundo, com mochila e livro em primeiro plano |
| `novidades-geral.webp` | Megafone e um jornal dobrado, com pequenas estrelas indicando novidade |

---

## Como o site escolhe a imagem

Palavras-chave verificadas nesta ordem (a primeira que casar vence):

1. `ssa-upe` — ssa, upe, seriad
2. `enem-inscricao` — inscri, edital, isen, taxa, prazo, cronograma
3. `enem-resultado` — resultado, sisu, prouni, fies, aprovad, convoca, classifica, nota de corte
4. `enem-prova` — prova, gabarito, simulado, quest, redação do enem, tri
5. `estudo-memoria` — memór, neuroci, cérebro, retenção, revisão, aprendizagem
6. `estudo-foco` — foco, concentra, distra, procrastin, ansiedade, celular
7. `estudo-leitura` — leitura, resumo, anota, caderno, livro, interpretação, redação
8. `estudo-rotina` — rotina, cronograma de estudo, organiz, planejamento, horário, tempo, hábito
9. `escola-calendario` — calendário, volta às aulas, férias, matrícula, bimestre, semestre, greve
10. `escola-recife` — recife, pernambuco, secretaria de educação, rede estadual, rede municipal

Não casou nada → padrão do tema: `enem-prova`, `estudo-rotina` ou
`escola-recife`. Tema desconhecido → `novidades-geral`.

Arquivo que ainda não existe não quebra o card: o bloco da imagem se remove
sozinho e o post aparece só com texto, como está hoje.
