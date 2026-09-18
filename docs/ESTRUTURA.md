# Estrutura de pastas do site

Reorganizado em setembro/2026. Antes, 30+ arquivos de CSS, JS e imagem ficavam
soltos na raiz; agora tudo que o navegador baixa mora em `assets/`.

```
/                         só o que precisa estar na raiz
  index.html              home
  novidades.html          página de novidades
  admin.html              painel administrativo (PWA)
  admin-sw.js             service worker do PWA — TEM que ficar na raiz
                          (um service worker só controla a pasta dele pra baixo)
  manifest.webmanifest    manifesto do PWA
  favicon.ico             ícone da aba
  .nojekyll               impede o GitHub Pages de processar o site como Jekyll

assets/
  css/     styles.css · intro.css · novidades.css · admin.css · admin-gallery.css
  js/      intro.js · novidades.js
           game-loader.js · game-trigger.js          (sempre carregados)
           game-jogodavelha.js · game-analytics.js
           hangman-animation.js · hangman-gameplay.js · hangman-poses-inline.js
           mascote-pose-data.js                      (só sob demanda — ver abaixo)
           admin.js · admin-gallery.js · post-image-assets.js
  img/
    png/         imagens do site · png/novidades/ = ilustrações das notícias
    svg/         logo, seta do topo, mascote
    icons/       ícones da interface · icons/pwa/ = ícones do app instalável
  data/    hangman-words.json (palavras do jogo da forca)

docs/          documentação e prompts (não vai pro navegador)
ferramentas/   scripts avulsos de manutenção, usados só na máquina
scripts/       gerar-novidade.mjs (roda no GitHub Actions)
sql/           migrações avulsas
supabase/      configuração e edge functions do Supabase
```

## Minigames sob demanda

Os arquivos da forca e do jogo da velha somam ~425 KB. Eles **não** são mais
baixados em toda visita. O `assets/js/game-loader.js` (5 KB) fica sempre na
página, detecta o clique no fundo e só então baixa o resto — começando já no
**primeiro** clique de fundo (ou no primeiro clique na cabeça do mascote), pra
que o jogo abra sem espera quando o gatilho realmente acontecer.

A lista dos arquivos pesados está dentro do `game-loader.js`. Para adicionar um
minigame novo: inclua o arquivo nessa lista e registre o jogo em `GAMES`, no
`game-trigger.js`.

A biblioteca do Supabase (~120 KB) segue a mesma lógica no `index.html`: só é
baixada quando alguém passa o mouse ou clica no botão ADMIN.

## Ao mexer nos caminhos

Se algum arquivo mudar de lugar, lembre de conferir também:

- `admin-sw.js` → lista `SHELL_FILES` (e suba o `CACHE_NAME` pra v3, v4…,
  senão o PWA continua servindo o cache velho)
- `manifest.webmanifest` → caminhos dos ícones
- `assets/css/styles.css` → `url('../img/svg/…')` são relativos ao CSS
- `assets/js/novidades.js` → pasta das ilustrações
- `assets/js/hangman-animation.js` → `assets/data/hangman-words.json`
- `assets/js/game-loader.js` → lista dos arquivos dos jogos
- as meta tags `og:image` / `twitter:image` usam URL absoluta
