// ============================================================================
// Lê os posts de "Novidades" direto do Supabase (tabela `novidades`, gerada
// automaticamente toda semana — veja scripts/gerar-novidade.mjs) e desenha os
// cards. Usado tanto no teaser da home (index.html) quanto na página completa
// (novidades.html).
//
// A chave abaixo é a chave pública ("anon"/"publishable") do projeto — é
// normal ela aparecer no código do site; a tabela só permite LEITURA por essa
// chave (veja sql/001_criar_tabela_novidades.sql), então não tem risco de
// alguém escrever no banco com ela.
// ============================================================================

const NOVIDADES_SUPABASE_URL = 'https://fesejrbindspzafiyssm.supabase.co';
const NOVIDADES_SUPABASE_ANON_KEY = 'sb_publishable_mGEU6ouQVdIt1G97ENAq_w_tX8uknCK';

const NOVIDADES_TEMAS = {
  enem_vestibular: { label: 'ENEM & Vestibular', cor: 'var(--color-blue)' },
  dicas_estudo: { label: 'Dicas de Estudo', cor: '#0E9F6E' },
  educacao_pe: { label: 'Educação em PE', cor: '#D97706' },
};

async function buscarNovidades(limite) {
  const url = `${NOVIDADES_SUPABASE_URL}/rest/v1/novidades?select=*&order=created_at.desc&limit=${limite}`;
  const res = await fetch(url, {
    headers: {
      apikey: NOVIDADES_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${NOVIDADES_SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Não foi possível carregar as novidades (${res.status}).`);
  return res.json();
}

function formatarDataNovidade(iso) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return '';
  }
}

function temaInfo(tema) {
  return NOVIDADES_TEMAS[tema] || { label: 'Novidades', cor: 'var(--color-blue)' };
}

// ---------- ilustração do post ----------
// Cada post ganha uma imagem fixa, escolhida por palavras-chave do título e
// do resumo. Não depende de nada gerado pela IA nem de coluna nova no banco:
// funciona inclusive nos posts que já estão publicados. A ordem importa — o
// primeiro subtópico que casar vence — e, se nada casar, cai na imagem
// padrão do tema.
const NOVIDADES_PASTA_IMG = 'png/novidades/';

const NOVIDADES_SUBTOPICOS = [
  { img: 'ssa-upe',           termos: ['ssa', 'upe', 'seriad'] },
  { img: 'enem-inscricao',    termos: ['inscri', 'edital', 'isen', 'taxa', 'prazo', 'cronograma'] },
  { img: 'enem-resultado',    termos: ['resultado', 'sisu', 'prouni', 'fies', 'aprovad', 'convoca', 'classifica', 'nota de corte'] },
  { img: 'enem-prova',        termos: ['prova', 'gabarito', 'simulado', 'quest', 'redação do enem', 'tri'] },
  { img: 'estudo-memoria',    termos: ['memór', 'neuroci', 'cérebro', 'retenção', 'revisão', 'aprendizagem'] },
  { img: 'estudo-foco',       termos: ['foco', 'concentra', 'distra', 'procrastin', 'ansiedade', 'celular'] },
  { img: 'estudo-leitura',    termos: ['leitura', 'resumo', 'anota', 'caderno', 'livro', 'interpretação', 'redação'] },
  { img: 'estudo-rotina',     termos: ['rotina', 'cronograma de estudo', 'organiz', 'planejamento', 'horário', 'tempo', 'hábito'] },
  { img: 'escola-calendario', termos: ['calendário', 'volta às aulas', 'férias', 'matrícula', 'bimestre', 'semestre', 'greve'] },
  { img: 'escola-recife',     termos: ['recife', 'pernambuco', 'secretaria de educação', 'rede estadual', 'rede municipal'] },
];

const NOVIDADES_IMG_PADRAO = {
  enem_vestibular: 'enem-prova',
  dicas_estudo: 'estudo-rotina',
  educacao_pe: 'escola-recife',
};

function imagemDoPost(post) {
  const texto = ((post.titulo || '') + ' ' + (post.resumo || '')).toLowerCase();
  for (const sub of NOVIDADES_SUBTOPICOS) {
    if (sub.termos.some((termo) => texto.includes(termo))) {
      return NOVIDADES_PASTA_IMG + sub.img + '.webp';
    }
  }
  const padrao = NOVIDADES_IMG_PADRAO[post.tema] || 'novidades-geral';
  return NOVIDADES_PASTA_IMG + padrao + '.webp';
}

// ---------- hashtags do post ----------
// Geradas a partir do próprio texto do post, sem depender da IA: todas as
// entradas cujos termos aparecem no título/resumo entram, na ordem abaixo,
// até o limite de 5. Assim vale para os posts já publicados e para os
// futuros, sem risco de hashtag inventada.
const NOVIDADES_HASHTAGS = [
  { tag: 'ENEM',              termos: ['enem'] },
  { tag: 'SSA',               termos: ['ssa', 'seriad'] },
  { tag: 'UPE',               termos: ['upe'] },
  { tag: 'Vestibular',        termos: ['vestibular', 'processo seletivo'] },
  { tag: 'Inscricoes',        termos: ['inscri', 'edital', 'isen', 'taxa'] },
  { tag: 'Prazos',            termos: ['prazo', 'cronograma', 'data', 'calendário'] },
  { tag: 'Resultado',         termos: ['resultado', 'nota de corte', 'aprovad', 'convoca', 'classifica'] },
  { tag: 'SISU',              termos: ['sisu'] },
  { tag: 'ProUni',            termos: ['prouni'] },
  { tag: 'Redacao',           termos: ['redação'] },
  { tag: 'Simulado',          termos: ['simulado', 'gabarito', 'prova'] },
  { tag: 'Neurociencia',      termos: ['neuroci', 'cérebro'] },
  { tag: 'Memoria',           termos: ['memór', 'retenção', 'revisão'] },
  { tag: 'Foco',              termos: ['foco', 'concentra', 'distra', 'procrastin'] },
  { tag: 'Rotina',            termos: ['rotina', 'hábito', 'horário', 'planejamento', 'organiz'] },
  { tag: 'TecnicasDeEstudo',  termos: ['técnica de estudo', 'método de estudo', 'resumo', 'anota', 'leitura'] },
  { tag: 'Produtividade',     termos: ['produtiv', 'tempo', 'rendimento'] },
  { tag: 'Aprendizagem',      termos: ['aprendiz', 'aprender'] },
  { tag: 'Ansiedade',         termos: ['ansiedade', 'saúde mental', 'estresse'] },
  { tag: 'VoltaAsAulas',      termos: ['volta às aulas', 'matrícula', 'bimestre', 'semestre'] },
  { tag: 'Recife',            termos: ['recife'] },
  { tag: 'Pernambuco',        termos: ['pernambuco', ' pe '] },
  { tag: 'EscolaPublica',     termos: ['rede estadual', 'rede municipal', 'secretaria de educação', 'escola pública'] },
  { tag: 'EnsinoMedio',       termos: ['ensino médio'] },
  { tag: 'EnsinoFundamental', termos: ['ensino fundamental'] },
];

// Toda novidade recebe pelo menos a hashtag do seu tema.
const NOVIDADES_HASHTAG_TEMA = {
  enem_vestibular: 'ENEM',
  dicas_estudo: 'DicasDeEstudo',
  educacao_pe: 'EducacaoEmPE',
};

function hashtagsDoPost(post) {
  const texto = ' ' + ((post.titulo || '') + ' ' + (post.resumo || '') + ' ' + (post.corpo || '')).toLowerCase() + ' ';
  const tags = [];
  const doTema = NOVIDADES_HASHTAG_TEMA[post.tema];
  if (doTema) tags.push(doTema);
  for (const item of NOVIDADES_HASHTAGS) {
    if (tags.length >= 5) break;
    if (tags.indexOf(item.tag) !== -1) continue;
    if (item.termos.some((termo) => texto.includes(termo))) tags.push(item.tag);
  }
  if (tags.length === 0) tags.push('Novidades');
  return tags;
}

// Se o arquivo ainda não existir, o bloco da imagem se remove sozinho em vez
// de deixar um ícone de imagem quebrada no card.
function ativarFallbackDeImagem(container) {
  container.querySelectorAll('.novidade-media img').forEach(function (img) {
    img.addEventListener('error', function () {
      const media = img.closest('.novidade-media');
      if (media) media.remove();
    });
  });
}

function escaparHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ---------- teaser (index.html): últimos N posts, só o resumo, linkando pra página completa ----------

async function initNovidadesTeaser(containerId, quantidade = 3) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const posts = await buscarNovidades(quantidade);
    if (!posts.length) {
      container.closest('.novidades-section')?.remove();
      return;
    }
    container.innerHTML = posts.map(renderCardTeaser).join('');
    ativarFallbackDeImagem(container);
  } catch (e) {
    console.error(e);
    container.closest('.novidades-section')?.remove();
  }
}

function renderCardTeaser(post) {
  const tema = temaInfo(post.tema);
  return `
    <a class="bento-card card-feature novidade-card" href="novidades.html#${escaparHtml(post.slug)}">
      <span class="novidade-media"><img src="${escaparHtml(imagemDoPost(post))}" alt="" loading="lazy"></span>
      <span class="novidade-badge" style="background:${tema.cor}">${escaparHtml(tema.label)}</span>
      <h3>${escaparHtml(post.titulo)}</h3>
      <p style="margin-top:0.5rem;">${escaparHtml(post.resumo)}</p>
      <span class="novidade-data">${formatarDataNovidade(post.created_at)}</span>
    </a>`;
}

// ---------- página completa (novidades.html): todos os posts, expansíveis ----------

const MESES_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

// Monta os três seletores com as opções que realmente existem nos posts
// carregados — nada de oferecer "março de 2025" se não há post nesse mês.
function montarFiltros(filtrosEl, posts) {
  if (!filtrosEl) return;

  const anos = [...new Set(posts.map((p) => new Date(p.created_at).getFullYear()))]
    .filter((a) => !isNaN(a))
    .sort((a, b) => b - a);
  const meses = [...new Set(posts.map((p) => new Date(p.created_at).getMonth()))]
    .filter((m) => !isNaN(m))
    .sort((a, b) => a - b);
  const temas = [...new Set(posts.map((p) => p.tema))].filter(Boolean);

  function opcoes(lista, rotulo) {
    return lista.map((v) => `<option value="${escaparHtml(String(v.valor))}">${escaparHtml(v.texto)}</option>`).join('');
  }

  filtrosEl.innerHTML =
    '<label class="novidades-filtro"><span>Ano</span>' +
      '<select id="filtro-ano"><option value="">Todos</option>' +
      opcoes(anos.map((a) => ({ valor: a, texto: String(a) }))) + '</select></label>' +
    '<label class="novidades-filtro"><span>Mês</span>' +
      '<select id="filtro-mes"><option value="">Todos</option>' +
      opcoes(meses.map((m) => ({ valor: m, texto: MESES_PT[m].charAt(0).toUpperCase() + MESES_PT[m].slice(1) }))) + '</select></label>' +
    '<label class="novidades-filtro"><span>Assunto</span>' +
      '<select id="filtro-tema"><option value="">Todos</option>' +
      opcoes(temas.map((t) => ({ valor: t, texto: temaInfo(t).label }))) + '</select></label>' +
    '<button type="button" id="filtro-limpar" class="novidades-filtro-limpar" hidden>Limpar filtros</button>';
}

function aplicarFiltros(posts, filtros) {
  return posts.filter((p) => {
    const d = new Date(p.created_at);
    if (filtros.ano && d.getFullYear() !== Number(filtros.ano)) return false;
    if (filtros.mes !== '' && d.getMonth() !== Number(filtros.mes)) return false;
    if (filtros.tema && p.tema !== filtros.tema) return false;
    return true;
  });
}

async function initNovidadesCompleto(containerId, quantidade = 100) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const filtrosEl = document.getElementById('novidades-filtros');
  container.innerHTML = '<p class="novidades-carregando">Carregando novidades…</p>';
  try {
    const posts = await buscarNovidades(quantidade);
    if (!posts.length) {
      container.innerHTML = '<p class="novidades-carregando">Ainda não há novidades publicadas — volte em breve!</p>';
      return;
    }

    montarFiltros(filtrosEl, posts);

    function desenhar() {
      const filtros = {
        ano: (document.getElementById('filtro-ano') || {}).value || '',
        mes: (document.getElementById('filtro-mes') || {}).value ?? '',
        tema: (document.getElementById('filtro-tema') || {}).value || '',
      };
      const visiveis = aplicarFiltros(posts, filtros);
      const limpar = document.getElementById('filtro-limpar');
      if (limpar) limpar.hidden = !(filtros.ano || filtros.mes !== '' || filtros.tema);

      if (!visiveis.length) {
        container.innerHTML = '<p class="novidades-carregando">Nenhuma novidade com esses filtros. Tente outra combinação.</p>';
        return;
      }
      container.innerHTML = visiveis.map(renderCardCompleto).join('');
      ativarFallbackDeImagem(container);
    }

    if (filtrosEl) {
      filtrosEl.addEventListener('change', desenhar);
      filtrosEl.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'filtro-limpar') {
          ['filtro-ano', 'filtro-mes', 'filtro-tema'].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.value = '';
          });
          desenhar();
        }
      });
    }

    desenhar();

    // Se veio um link direto pra um post (novidades.html#slug), abre ele e rola até lá
    const alvo = decodeURIComponent(location.hash.replace('#', ''));
    if (alvo) {
      const item = container.querySelector(`[data-slug="${CSS.escape(alvo)}"]`);
      if (item) {
        item.querySelector('.novidade-corpo').style.display = 'block';
        item.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  } catch (e) {
    console.error(e);
    container.innerHTML = '<p class="novidades-carregando">Não foi possível carregar as novidades agora. Tente novamente mais tarde.</p>';
  }
}

function renderCardCompleto(post) {
  const tema = temaInfo(post.tema);
  const corpoParagrafos = (post.corpo || '')
    .split(/\n{2,}/)
    .map((p) => `<p>${escaparHtml(p)}</p>`)
    .join('');
  // No lugar das fontes, hashtags do assunto. As fontes continuam gravadas
  // no banco (rastreabilidade), só não aparecem mais no site.
  const hashtagsHtml = `<div class="novidade-hashtags">${hashtagsDoPost(post)
    .map((tag) => `<span class="novidade-hashtag">#${escaparHtml(tag)}</span>`)
    .join('')}</div>`;

  return `
    <article class="bento-card card-full novidade-card-completo" data-slug="${escaparHtml(post.slug)}" style="grid-column: 1 / -1;">
      <div class="novidade-cabecalho" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'block' ? 'none' : 'block'">
        <div class="novidade-media novidade-media-larga"><img src="${escaparHtml(imagemDoPost(post))}" alt="" loading="lazy"></div>
        <span class="novidade-badge" style="background:${tema.cor}">${escaparHtml(tema.label)}</span>
        <span class="novidade-data">${formatarDataNovidade(post.created_at)}</span>
        <h3 style="margin: 0.5rem 0 0;">${escaparHtml(post.titulo)}</h3>
        <p style="margin-top:0.4rem; color:var(--color-text-muted);">${escaparHtml(post.resumo)} <span style="white-space:nowrap;">— ler mais +</span></p>
      </div>
      <div class="novidade-corpo" style="display:none; margin-top:1rem;">
        ${corpoParagrafos}
        ${hashtagsHtml}
      </div>
    </article>`;
}
