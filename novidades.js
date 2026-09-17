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
  } catch (e) {
    console.error(e);
    container.closest('.novidades-section')?.remove();
  }
}

function renderCardTeaser(post) {
  const tema = temaInfo(post.tema);
  return `
    <a class="bento-card card-feature novidade-card" href="novidades.html#${escaparHtml(post.slug)}">
      <span class="novidade-badge" style="background:${tema.cor}">${escaparHtml(tema.label)}</span>
      <h3>${escaparHtml(post.titulo)}</h3>
      <p style="margin-top:0.5rem;">${escaparHtml(post.resumo)}</p>
      <span class="novidade-data">${formatarDataNovidade(post.created_at)}</span>
    </a>`;
}

// ---------- página completa (novidades.html): todos os posts, expansíveis ----------

async function initNovidadesCompleto(containerId, quantidade = 30) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '<p class="novidades-carregando">Carregando novidades…</p>';
  try {
    const posts = await buscarNovidades(quantidade);
    if (!posts.length) {
      container.innerHTML = '<p class="novidades-carregando">Ainda não há novidades publicadas — volte em breve!</p>';
      return;
    }
    container.innerHTML = posts.map(renderCardCompleto).join('');

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
  const fontes = Array.isArray(post.fontes) ? post.fontes : [];
  const corpoParagrafos = (post.corpo || '')
    .split(/\n{2,}/)
    .map((p) => `<p>${escaparHtml(p)}</p>`)
    .join('');
  // As fontes aparecem só como nome do veículo, em texto — sem link.
  // Os links do Google News são enormes (redirecionamentos) e, quando a IA
  // erra, viram blocos de texto sem sentido. Aqui cortamos nomes longos
  // demais e mostramos no máximo 4.
  const nomesFontes = fontes
    .map((f) => String((f && (f.veiculo || f.titulo)) || '').trim())
    .filter((nome) => nome.length > 1 && nome.length <= 60)
    .slice(0, 4);
  const fontesHtml = nomesFontes.length
    ? `<div class="novidade-fontes"><strong>Fontes:</strong> ${nomesFontes.map(escaparHtml).join(' · ')}</div>`
    : '';

  return `
    <article class="bento-card card-full novidade-card-completo" data-slug="${escaparHtml(post.slug)}" style="grid-column: 1 / -1;">
      <div class="novidade-cabecalho" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'block' ? 'none' : 'block'">
        <span class="novidade-badge" style="background:${tema.cor}">${escaparHtml(tema.label)}</span>
        <span class="novidade-data">${formatarDataNovidade(post.created_at)}</span>
        <h3 style="margin: 0.5rem 0 0;">${escaparHtml(post.titulo)}</h3>
        <p style="margin-top:0.4rem; color:var(--color-text-muted);">${escaparHtml(post.resumo)} <span style="white-space:nowrap;">— ler mais +</span></p>
      </div>
      <div class="novidade-corpo" style="display:none; margin-top:1rem;">
        ${corpoParagrafos}
        ${fontesHtml}
      </div>
    </article>`;
}
