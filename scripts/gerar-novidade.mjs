#!/usr/bin/env node
// ============================================================================
// Gera automaticamente 1 post de "Novidades" por execução:
//   1. Busca notícias recentes no Google News (RSS, sem precisar de chave)
//   2. Pede pro Gemini escrever um post original em cima delas
//   3. Salva o post na tabela `novidades` do Supabase
//
// Pensado para rodar 1x por semana via GitHub Actions (veja o workflow em
// .github/workflows/gerar-novidades.yml). Não precisa de nenhuma dependência
// além do Node 20+ (usa fetch nativo).
//
// Variáveis de ambiente obrigatórias:
//   GEMINI_API_KEY            chave da API do Gemini (Google AI Studio)
//   SUPABASE_URL               ex: https://fesejrbindspzafiyssm.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  a "service_role" key do projeto (Supabase →
//                               Project Settings → API). NUNCA é a anon key.
//   (a chave do Gemini pode ser tanto no formato antigo "AIza..." quanto no
//    novo "AQ.Ab..." — vai no cabeçalho x-goog-api-key, que aceita os dois)
// Opcionais:
//   GEMINI_MODEL   (default: gemini-3.6-flash)
//   TEMA_FORCADO   força um tema específico em vez de usar o rodízio semanal
//                  (valores: enem_vestibular | dicas_estudo | educacao_pe)
// ============================================================================

const GEMINI_API_KEY = requireEnv('GEMINI_API_KEY');
const SUPABASE_URL = requireEnv('SUPABASE_URL').replace(/\/+$/, '');
const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
// Se o modelo principal estiver sobrecarregado (erro 503 "high demand") ou
// não existir mais (404), o script tenta os seguintes, em ordem. Dá pra
// mudar a lista com a variável GEMINI_MODELOS_RESERVA (separada por vírgula).
const MODELOS_RESERVA = (process.env.GEMINI_MODELOS_RESERVA ||
  'gemini-3.8-flash,gemini-3.7-flash,gemini-3.5-flash,gemini-2.5-flash')
  .split(',').map((m) => m.trim()).filter(Boolean);
const MODELOS = [GEMINI_MODEL, ...MODELOS_RESERVA.filter((m) => m !== GEMINI_MODEL)];

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Faltando a variável de ambiente ${name} (configure em Settings → Secrets and variables → Actions).`);
    process.exit(1);
  }
  return v;
}

// ---------- 1. Temas e o rodízio semanal ----------

const TEMAS = {
  enem_vestibular: {
    label: 'ENEM e vestibulares (SSA)',
    query: '(ENEM OR vestibular OR "SSA UPE" OR "SSA Pernambuco") when:7d',
    instrucaoExtra:
      'Foque em prazos, editais, mudanças na prova, datas de inscrição ou resultados do ENEM e de vestibulares como o SSA/UPE. Se não houver nada realmente novo nas notícias, escreva uma dica prática de preparação relacionada ao que foi encontrado.',
  },
  dicas_estudo: {
    label: 'Dicas de estudo e educação',
    query: '("técnica de estudo" OR "método de estudo" OR produtividade OR aprendizagem OR neurociência estudo) when:7d',
    instrucaoExtra:
      'Transforme as notícias em uma dica prática e aplicável para estudantes do ensino fundamental e médio, sempre citando de onde veio a informação (pesquisa, especialista, matéria).',
  },
  educacao_pe: {
    label: 'Educação em Recife/PE',
    query: '(educação OR escola OR "secretaria de educação") (Recife OR Pernambuco) when:7d',
    instrucaoExtra:
      'Foque em calendário escolar, iniciativas da Secretaria de Educação de PE/Recife, ou eventos educacionais locais relevantes para pais e alunos da região.',
  },
};

const ORDEM_TEMAS = ['enem_vestibular', 'dicas_estudo', 'educacao_pe'];

function temaDaSemana() {
  // "auto" (ou vazio) = usar o rodízio normal. O workflow manda "auto"
  // porque o GitHub não aceita opção de escolha em branco.
  const forcado = (process.env.TEMA_FORCADO || '').trim();
  if (forcado && forcado !== 'auto') {
    if (!TEMAS[forcado]) {
      console.error(`TEMA_FORCADO inválido: "${forcado}". Use um de: ${ORDEM_TEMAS.join(', ')} (ou "auto").`);
      process.exit(1);
    }
    return forcado;
  }
  // Tudo em UTC, pra não depender do fuso da máquina que estiver rodando.
  const hoje = new Date();
  const umJan = Date.UTC(hoje.getUTCFullYear(), 0, 1);
  const diasDoAno = Math.floor((Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()) - umJan) / 86400000);
  const semanaDoAno = Math.floor(diasDoAno / 7);
  return ORDEM_TEMAS[semanaDoAno % ORDEM_TEMAS.length];
}

// ---------- 2. Buscar notícias recentes (Google News RSS, sem API key) ----------

// Se o Google News falhar (403 pra IP de datacenter, instabilidade,
// timeout...), NÃO derrubamos a execução: seguimos com lista vazia, e o
// prompt já prevê esse caso escrevendo uma dica prática atemporal. É
// melhor publicar um post sem fontes do que ficar a semana toda sem post.
async function buscarNoticias(query, max = 6) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-BR`;
  let xml;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SalaDeEstudoBot/1.0)' },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.warn(`Aviso: Google News RSS respondeu ${res.status}. Seguindo sem notícias desta semana.`);
      return [];
    }
    xml = await res.text();
  } catch (err) {
    console.warn(`Aviso: não deu pra buscar notícias (${err.message}). Seguindo sem notícias desta semana.`);
    return [];
  }

  const itens = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRegex.exec(xml)) && itens.length < max) {
    const bloco = m[1];
    const titulo = extrairTag(bloco, 'title');
    const link = extrairTag(bloco, 'link');
    const pubDate = extrairTag(bloco, 'pubDate');
    const source = extrairTag(bloco, 'source');
    if (titulo && link) {
      itens.push({ titulo: decodificarHtml(titulo), link, pubDate, veiculo: decodificarHtml(source || '') });
    }
  }
  return itens;
}

function extrairTag(bloco, tag) {
  const m = bloco.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  if (!m) return '';
  return m[1].replace('<![CDATA[', '').replace(']]>', '').trim();
}

function decodificarHtml(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// ---------- 3. Gerar o texto do post com o Gemini ----------

async function gerarPostComGemini(tema, noticias) {
  const listaNoticias = noticias
    .map((n, i) => `${i + 1}. "${n.titulo}" — ${n.veiculo || 'fonte não identificada'} (${n.link})`)
    .join('\n');

  const prompt = `Você escreve para o blog "Novidades" do site da Sala de Estudo, um reforço escolar em Recife (Profª Rubia Lima). O público são pais e alunos do ensino fundamental/médio.

Tema desta semana: ${TEMAS[tema].label}.
${TEMAS[tema].instrucaoExtra}

Aqui estão notícias recentes sobre o tema (pode usar como base, mas o texto final tem que ser TOTALMENTE ORIGINAL — nunca copie frases das notícias, apenas resuma as informações e ideias com suas próprias palavras):

${listaNoticias || '(nenhuma notícia relevante encontrada esta semana — escreva uma dica prática e atemporal sobre o tema)'}

Escreva em português do Brasil, tom acolhedor, direto e confiável (nunca alarmista, nunca clickbait). Responda SOMENTE com um JSON no formato:
{
  "titulo": "título curto e chamativo, sem clickbait, até 70 caracteres",
  "resumo": "1-2 frases resumindo o post, até 180 caracteres, para aparecer no card do site",
  "corpo": "3 a 5 parágrafos separados por \\n\\n, texto corrido, sem markdown, sem listas",
  "fontes": [{"titulo": "título da notícia usada", "veiculo": "nome do veículo", "link": "url"}]
}
Inclua em "fontes" apenas as notícias que você realmente usou como base (pode ser vazio se não usou nenhuma).`;

  // A chave vai no cabeçalho x-goog-api-key (e não em ?key= na URL): é a
  // forma recomendada pelo Google, evita a chave aparecer em log de URL e
  // funciona tanto com as chaves antigas (AIza...) quanto com as novas
  // (AQ.Ab...).
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          titulo: { type: 'STRING' },
          resumo: { type: 'STRING' },
          corpo: { type: 'STRING' },
          fontes: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                titulo: { type: 'STRING' },
                veiculo: { type: 'STRING' },
                link: { type: 'STRING' },
              },
            },
          },
        },
        required: ['titulo', 'resumo', 'corpo', 'fontes'],
      },
    },
  };

  // Percorre a lista de modelos. Em cada um: até 3 tentativas, com espera
  // crescente, porque 503 ("high demand") e 429 costumam passar sozinhos.
  // Se o modelo não existir (404) ou continuar indisponível, passa pro
  // próximo da lista em vez de desistir da semana inteira.
  let res = null;
  let ultimoErro = '';

  for (const modelo of MODELOS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;
    let deuCerto = false;

    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      let resposta;
      try {
        resposta = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(120000),
        });
      } catch (err) {
        ultimoErro = `${modelo}: falha de rede (${err.message})`;
        console.warn(`Erro de rede chamando ${modelo}: ${err.message}`);
        break;
      }

      if (resposta.ok) {
        res = resposta;
        deuCerto = true;
        if (modelo !== MODELOS[0]) console.log(`Gerado com o modelo reserva ${modelo}.`);
        break;
      }

      const texto = (await resposta.text()).slice(0, 400);
      ultimoErro = `${modelo} respondeu ${resposta.status}: ${texto}`;

      // 400/401/403 = problema na chave ou na requisição: trocar de modelo
      // não resolve, então para aqui com a mensagem original.
      if (resposta.status === 400 || resposta.status === 401 || resposta.status === 403) {
        throw new Error(`Gemini respondeu ${resposta.status} (problema na chave ou na requisição): ${texto}`);
      }
      // 404 = modelo não existe/não liberado pra essa chave: próximo da lista.
      if (resposta.status === 404) {
        console.warn(`Modelo ${modelo} não encontrado (404). Tentando o próximo.`);
        break;
      }
      if (tentativa === 3) {
        console.warn(`Modelo ${modelo} não respondeu depois de 3 tentativas (${resposta.status}). Tentando o próximo.`);
        break;
      }
      const espera = tentativa * 15000;
      console.warn(`${modelo} respondeu ${resposta.status}. Tentando de novo em ${espera / 1000}s (tentativa ${tentativa + 1}/3).`);
      await new Promise((r) => setTimeout(r, espera));
    }

    if (deuCerto) break;
  }

  if (!res) {
    throw new Error(`Nenhum modelo do Gemini respondeu. Modelos tentados: ${MODELOS.join(', ')}. Último erro — ${ultimoErro}`);
  }
  const json = await res.json();
  const textoGerado = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textoGerado) throw new Error('Gemini não retornou conteúdo. Resposta: ' + JSON.stringify(json).slice(0, 500));
  return JSON.parse(textoGerado);
}

// ---------- 3b. Conferir as fontes citadas ----------

function validarFontes(fontes, noticias) {
  if (!Array.isArray(fontes) || fontes.length === 0) return [];
  const linksReais = new Set(noticias.map((n) => n.link));
  const validas = [];

  for (const f of fontes) {
    if (!f || typeof f !== 'object') continue;
    const link = String(f.link || '').trim();
    const veiculo = String(f.veiculo || '').trim();
    const titulo = String(f.titulo || '').trim();

    // A notícia precisa ser uma das que o script buscou.
    if (!linksReais.has(link)) continue;
    // Nome de veículo/título gigante é sinal de texto inventado.
    if (veiculo.length > 60 || titulo.length > 160) continue;
    if (!/^https?:\/\//i.test(link)) continue;

    validas.push({ titulo: titulo.slice(0, 160), veiculo: veiculo.slice(0, 60), link });
    if (validas.length === 4) break;
  }

  const descartadas = fontes.length - validas.length;
  if (descartadas > 0) {
    console.warn(`${descartadas} fonte(s) descartada(s) por não corresponderem às notícias buscadas.`);
  }
  return validas;
}

// ---------- 4. Salvar no Supabase ----------

function gerarSlug(titulo) {
  const base = titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const dataCurta = new Date().toISOString().slice(0, 10);
  return `${dataCurta}-${base}`.slice(0, 120);
}

async function inserir(registro) {
  return fetch(`${SUPABASE_URL}/rest/v1/novidades`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(registro),
    signal: AbortSignal.timeout(30000),
  });
}

async function salvarNoSupabase(registro) {
  let res = await inserir(registro);

  // 409 = já existe um post com esse slug (acontece se o workflow for
  // rodado duas vezes no mesmo dia e a IA repetir o título). Em vez de
  // falhar, salva com um sufixo curto.
  if (res.status === 409) {
    const sufixo = String(Date.now()).slice(-4);
    console.warn(`Já existe um post com o slug "${registro.slug}". Salvando como "${registro.slug}-${sufixo}".`);
    res = await inserir({ ...registro, slug: `${registro.slug}-${sufixo}`.slice(0, 120) });
  }

  if (!res.ok) {
    const texto = await res.text();
    throw new Error(`Supabase respondeu ${res.status} ao inserir: ${texto.slice(0, 500)}`);
  }
}

// ---------- main ----------

async function main() {
  const tema = temaDaSemana();
  console.log(`Tema desta execução: ${tema} (${TEMAS[tema].label})`);

  let noticias = await buscarNoticias(TEMAS[tema].query);
  if (noticias.length === 0) {
    // O filtro de data (when:7d) às vezes devolve lista vazia. Tenta de
    // novo sem ele, aceitando notícias um pouco mais antigas.
    const semFiltroDeData = TEMAS[tema].query.replace(/\s*when:\d+[dhm]\s*/i, ' ').trim();
    if (semFiltroDeData !== TEMAS[tema].query) {
      console.log('Nenhuma notícia dos últimos 7 dias. Buscando sem o filtro de data...');
      noticias = await buscarNoticias(semFiltroDeData);
    }
  }
  console.log(`Notícias encontradas: ${noticias.length}`);

  const post = await gerarPostComGemini(tema, noticias);

  // Trava anti-invenção: a IA só pode citar como fonte uma notícia que o
  // script realmente buscou. Se ela inventar (o que acontece quando a busca
  // volta vazia), a fonte é descartada em vez de virar lixo no site.
  post.fontes = validarFontes(post.fontes, noticias);

  // A tabela exige titulo/resumo/corpo não nulos: se a IA devolver algo
  // vazio, é melhor falhar aqui com mensagem clara do que gravar lixo.
  for (const campo of ['titulo', 'resumo', 'corpo']) {
    if (!post[campo] || !String(post[campo]).trim()) {
      throw new Error(`O Gemini devolveu "${campo}" vazio. Resposta: ${JSON.stringify(post).slice(0, 500)}`);
    }
  }
  console.log(`Post gerado: "${post.titulo}"`);

  const registro = {
    tema,
    titulo: String(post.titulo).trim().slice(0, 200),
    resumo: String(post.resumo).trim().slice(0, 400),
    corpo: String(post.corpo).trim(),
    fontes: Array.isArray(post.fontes) ? post.fontes : [],
    slug: gerarSlug(post.titulo),
  };

  await salvarNoSupabase(registro);
  console.log('Post salvo no Supabase com sucesso.');
}

main().catch((err) => {
  console.error('Falhou ao gerar a novidade:', err);
  process.exit(1);
});
