/* ========================================================================
   Easter egg da forca — coreografia do mascote.
   Integração corrigida da coreografia aprovada, livro, slots e forca.

   O rig provisório baseado em linhas foi substituído pelas 23 poses
   aprovadas em mascote-pose-data.js (paths interpoláveis por GSAP),
   seguindo exatamente a coreografia validada em
   animacao-continua-mascote.html: sentado -> livro abaixado -> cabeça
   levantada -> apoio -> meio levantado -> em pé -> giro -> caminhada
   (8 ciclos) -> chegada neutra -> horror lateral -> horror frontal ->
   resignação -> reergue -> abre os braços -> desmontagem final.

   O livro permanece como peça de cenário, os slots ficam sob a cena e a
   forca é desenhada antes das poses de horror. A lógica de palavra e de
   acertos/erros continua reservada ao gameplay.

   Não há listener de ativação neste arquivo. A sequência é iniciada apenas
   por uma chamada externa a window.startHangmanGame(). O deslocamento do
   personagem (character-travel) e o acompanhamento de câmera (hangman-world)
   reaproveitam o mecanismo já aprovado nos checkpoints anteriores.
   ======================================================================== */
(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  var PIECES = {
    'leg-right': ['thigh-right-shape', 'shin-right-shape'],
    'arm-right': ['upper-arm-right-shape', 'forearm-right-shape'],
    'torso': ['torso-shape-allan'],
    'leg-left': ['thigh-left-shape', 'shin-left-shape'],
    'arm-left': ['upper-arm-left-shape', 'forearm-left-shape'],
    'head': ['head-shape-allan']
  };

  var PIECE_IDS = Object.keys(PIECES);
  var DISASSEMBLY_ROW_ORDER = ['head', 'torso', 'arm-left', 'arm-right', 'leg-left', 'leg-right'];

  /* Pontos locais da pose 23 usados como pivôs. O braço esquerdo usa a mão
     para prender no laço; a perna direita usa a extremidade inferior para a
     pose pendurada. Os demais pontos são ombros, quadris e centro da cabeça. */
  var PIECE_ANCHORS = {
    head: { x: 59.78, y: 11.78 },
    torso: { x: 45.2, y: 22.2 },
    'arm-left': { x: 61.0, y: 30.0 },
    'arm-right': { x: 28.0, y: 17.0 },
    'leg-left': { x: 52.0, y: 48.0 },
    'leg-right': { x: 52.0, y: 39.0 }
  };

  var WALK_FRAME_INDEXES = [8, 9, 10, 11, 12, 13, 14, 15];
  var WALK_CYCLES = 8;
  var STANDING_FRAME_INDEX = 5; /* "06 · Em pé neutro" */
  var WALK_COMPLETE_FRAME_INDEX = 16; /* "17 · Chegada neutra" */

  /* O personagem percorre uma distância maior que a câmera. Assim ele
     realmente avança para a direita no enquadramento enquanto toda a página
     acompanha o percurso como um cenário único. */
  var TRAVEL_X = 215;
  var CAMERA_X = 222;

  var BOOK_INITIAL_PATH = 'M9 20 L3 12';
  var BOOK_LOWERED_PATH = 'M17 29 L7 29';

  /* A chamada sem argumento usa a palavra padrão de seis letras. Palavras
     maiores comprimem campos e intervalos dentro da mesma largura de cena. */
  var DEFAULT_WORD_LENGTH = 6;
  var DEFAULT_WORD = 'ESTUDO';
  var DEFAULT_HINT = 'Atividade central da Sala de Estudo';
  /* O mascote deixa estes campos para trás enquanto caminha. Depois da
     compensação de câmera, eles terminam à esquerda dos seus pés. */
  var SLOT_START_X = 65;
  var SLOT_AREA_WIDTH = 160;
  var SLOT_GAP = 8;
  /* Alinha os campos da palavra à base horizontal da forca (y=83). */
  var SLOT_Y = 83;
  var SLOT_COLOR = '#0055d4';
  var SLOT_STROKE_WIDTH = 1.4;
  var REFERENCE_SLOT_WIDTH = 20;
  var MAX_WORD_CHARACTERS = 40;
  var MAX_WORD_LETTERS = 15;
  /* Centro vertical do laço: ele ocupa y=-25..-5. */
  var PIECE_ROW_CENTER_Y = -15;
  /* Um clique, toque ou tecla durante a sequência acelera a coreografia sem
     saltar poses. A velocidade normal volta a valer no próximo início. */
  var FAST_FORWARD_SCALE = 4;
  var MOBILE_LANDSCAPE_INTRO_MS = 2000;
  var FLOAT_DISTANCES = [2.1, 1.6, 2.4, 2.2, 2.7, 2.5];
  var FLOAT_DURATIONS = [3.6, 4.1, 4.5, 3.9, 4.7, 4.2];
  var FLOAT_ROTATIONS = [0, 0.8, 2, -2, 2.5, -2.5];
  var GALLOWS_PIECE_TARGETS = {
    head: { x: 290, y: -14, rotation: 0 },
    torso: { x: 290, y: 16, rotation: 0 },
    'arm-left': { x: 279, y: 18, rotation: -8 },
    'arm-right': { x: 301, y: 18, rotation: 8 },
    'leg-left': { x: 284, y: 55, rotation: -4 },
    'leg-right': { x: 297, y: 55, rotation: 4 }
  };

  /* Cinco poses montadas por Allan no Inkscape. Os centros, rotações e
     espelhamentos abaixo foram extraídos dos 30 grupos posicionados em
     mascote-montagem-5-poses-forca-feito.svg e convertidos para o sistema de
     coordenadas do mundo SVG do jogo. */
  var GALLOWS_POSES = [
    {
      'name': "balanco-em-l",
      'order': [
        "arm-left",
        "torso",
        "leg-left",
        "head",
        "arm-right",
        "leg-right"
      ],
      'targets': {
        'head': {
          'x': 315.362,
          'y': -10.596,
          'rotation': 0,
          'localAnchor': {
            'x': 59.78,
            'y': 11.78
          }
        },
        'torso': {
          'x': 328.848,
          'y': 7.796,
          'rotation': 21.847,
          'localAnchor': {
            'x': 45.2,
            'y': 22.2
          }
        },
        'arm-left': {
          'x': 315.254,
          'y': 8.429,
          'rotation': 0,
          'localAnchor': {
            'x': 61,
            'y': 30
          }
        },
        'arm-right': {
          'x': 505,
          'y': -15,
          'rotation': 8.788,
          'scaleY': -1,
          'localAnchor': {
            'x': 230.469,
            'y': 43.292
          }
        },
        'leg-left': {
          'x': 307.812,
          'y': 38.168,
          'rotation': 0,
          'localAnchor': {
            'x': 52,
            'y': 48
          }
        },
        'leg-right': {
          'x': 320.226,
          'y': 34.024,
          'rotation': 0,
          'localAnchor': {
            'x': 52,
            'y': 39
          }
        }
      },
      'attachedPiece': "arm-right"
    },
    {
      'name': "estrela-perna",
      'order': [
        "leg-right",
        "torso",
        "leg-left",
        "head",
        "arm-right",
        "arm-left"
      ],
      'targets': {
        'head': {
          'x': 286.274,
          'y': 53.259,
          'rotation': 0,
          'localAnchor': {
            'x': 59.78,
            'y': 11.78
          }
        },
        'torso': {
          'x': 292.601,
          'y': 14.62,
          'rotation': 28.997,
          'localAnchor': {
            'x': 45.2,
            'y': 22.2
          }
        },
        'arm-left': {
          'x': 295.922,
          'y': 37.253,
          'rotation': 22.021,
          'scaleY': -1,
          'localAnchor': {
            'x': 61,
            'y': 30
          }
        },
        'arm-right': {
          'x': 246.462,
          'y': 43.646,
          'rotation': -71.82,
          'scaleY': -1,
          'localAnchor': {
            'x': 28,
            'y': 17
          }
        },
        'leg-left': {
          'x': 257.327,
          'y': 2.399,
          'rotation': 68.242,
          'localAnchor': {
            'x': 52,
            'y': 48
          }
        },
        'leg-right': {
          'x': 505,
          'y': -15,
          'rotation': -155.474,
          'scaleY': -1,
          'localAnchor': {
            'x': -148.82,
            'y': -33.55
          }
        }
      },
      'attachedPiece': "leg-right"
    },
    {
      'name': "preguica-trave",
      'order': [
        "head",
        "torso",
        "arm-right",
        "arm-left",
        "leg-left",
        "leg-right"
      ],
      'targets': {
        'head': {
          'x': 314.141,
          'y': -35.22,
          'rotation': 0,
          'localAnchor': {
            'x': 59.78,
            'y': 11.78
          }
        },
        'torso': {
          'x': 327.504,
          'y': -13.278,
          'rotation': 33.336,
          'localAnchor': {
            'x': 45.2,
            'y': 22.2
          }
        },
        'arm-left': {
          'x': 505,
          'y': -15,
          'rotation': -79.777,
          'localAnchor': {
            'x': 82.704,
            'y': 215.272
          }
        },
        'arm-right': {
          'x': 303.156,
          'y': -39.24,
          'rotation': 117.573,
          'localAnchor': {
            'x': 28,
            'y': 17
          }
        },
        'leg-left': {
          'x': 310.153,
          'y': 18.773,
          'rotation': -29.888,
          'localAnchor': {
            'x': 52,
            'y': 48
          }
        },
        'leg-right': {
          'x': 314.778,
          'y': 18.796,
          'rotation': -28.189,
          'localAnchor': {
            'x': 52,
            'y': 39
          }
        }
      },
      'attachedPiece': "arm-left"
    },
    {
      'name': "enroscado-poste",
      'order': [
        "head",
        "torso",
        "arm-right",
        "leg-right",
        "arm-left",
        "leg-left"
      ],
      'targets': {
        'head': {
          'x': 312.446,
          'y': -15.245,
          'rotation': 0,
          'localAnchor': {
            'x': 59.78,
            'y': 11.78
          }
        },
        'torso': {
          'x': 326.997,
          'y': 6.495,
          'rotation': 30.724,
          'localAnchor': {
            'x': 45.2,
            'y': 22.2
          }
        },
        'arm-left': {
          'x': 306.435,
          'y': 3.895,
          'rotation': 140.347,
          'localAnchor': {
            'x': 61,
            'y': 30
          }
        },
        'arm-right': {
          'x': 340.393,
          'y': -8.871,
          'rotation': -150.397,
          'localAnchor': {
            'x': 28,
            'y': 17
          }
        },
        'leg-left': {
          'x': 302.308,
          'y': 35.13,
          'rotation': 3.141,
          'localAnchor': {
            'x': 52,
            'y': 48
          }
        },
        'leg-right': {
          'x': 505,
          'y': -15,
          'rotation': -93.806,
          'localAnchor': {
            'x': 90.552,
            'y': 229.834
          }
        }
      },
      'attachedPiece': "leg-right"
    },
    {
      'name': "bandeira-humana",
      'order': [
        "head",
        "torso",
        "leg-left",
        "leg-right",
        "arm-right",
        "arm-left"
      ],
      'targets': {
        'head': {
          'x': 343.589,
          'y': 8.676,
          'rotation': 0,
          'localAnchor': {
            'x': 59.78,
            'y': 11.78
          }
        },
        'torso': {
          'x': 307.272,
          'y': -6.044,
          'rotation': -50.777,
          'localAnchor': {
            'x': 45.2,
            'y': 22.2
          }
        },
        'arm-left': {
          'x': 329.426,
          'y': 12.517,
          'rotation': 31.136,
          'localAnchor': {
            'x': 61,
            'y': 30
          }
        },
        'arm-right': {
          'x': 505,
          'y': -15,
          'rotation': 168.773,
          'localAnchor': {
            'x': -132.599,
            'y': -16.013
          }
        },
        'leg-left': {
          'x': 292.18,
          'y': 8.525,
          'rotation': -20.585,
          'scaleY': -1,
          'localAnchor': {
            'x': 52,
            'y': 48
          }
        },
        'leg-right': {
          'x': 297.244,
          'y': -9.139,
          'rotation': 0,
          'scaleY': -1,
          'localAnchor': {
            'x': 52,
            'y': 39
          }
        }
      },
      'attachedPiece': "arm-right"
    }
  ];
  var activeGallowsPose = GALLOWS_POSES[0];
  var gallowsSwayTimeline = null;
  var gallowsSwayAngle = 0;

  var activeTimeline = null;
  var fastForwardUnlockTime = 0;
  var pageCamera = null;
  var fastForwardListenersAttached = false;
  var exitControl = null;
  var exitControlListenersAttached = false;
  var landscapeOverlay = null;
  var landscapeBlockersAttached = false;
  var mobileLandscapeActive = false;
  var mobileLandscapeStarted = false;
  var mobileLandscapeIntroElapsed = false;
  var mobileLandscapeIntroTimer = null;
  var mobileFullscreenOwned = false;
  var landscapeRequestToken = 0;
  var floatingPieceStates = [];
  var activeRound = null;
  var floatingAnimations = [];
  var floatingInteractionsAttached = false;
  /* "Peças penduradas" (ver movePieceToGallows): em vez de animar a mesma
     peça flutuante voando até a pose final na forca, ela some no lugar e
     surge uma cópia já plantada na posição certa. Essas cópias ficam
     guardadas aqui para serem removidas quando a rodada terminar/reiniciar. */
  var hungGhosts = [];
  var activeParts = null;
  var pageScrollLock = null;

  var WORD_BANK_URL = 'hangman-words.json';
  // Banco reserva, embutido no proprio arquivo (nao depende de fetch): usado quando
  // a pagina e aberta offline (file://) e o fetch do hangman-words.json e bloqueado
  // pelo navegador. Cobre os 13 topicos, entao o sorteio duplo continua variando
  // mesmo offline, so que dentro de um banco bem menor.
    var OFFLINE_FALLBACK_BANK = [
    {"topico": "Matérias escolares", "palavra": "artes", "charada": "Todo mundo me acha fácil até alguém pedir pra desenhar um cavalo de frente.", "charada2": "Ninguém estuda pra mim achando que vai ser reprovado, e é exatamente aí que a nota vem baixa.", "charada3": "Todo mundo acha que eu me resumo a sujar a mão de tinta e fazer vaso de argila."},
    {"topico": "Matérias escolares", "palavra": "biologia", "charada": "Todo mundo decorou o nome de uma organela só pra fazer meme, e ninguém mais lembra pra que ela serve.", "charada2": "Bagunço a mesa de exame de sangue e ainda assim explico por que seu pai é careca.", "charada3": "Sou a matéria que explica detalhadamente o porquê de você ter puxado o nariz grande do seu avô."},
    {"topico": "Matérias escolares", "palavra": "espanhol", "charada": "Todo brasileiro acha que me fala fluentemente só de colocar um 'ito' no final das palavras.", "charada2": "Ensino que 'exquisito' não quer dizer esquisito, e ainda assim ninguém aprende essa numa vida inteira.", "charada3": "Deixo todo mundo achando que arrasa na comunicação até precisar perguntar onde fica o banheiro de verdade."},
    {"topico": "Matérias escolares", "palavra": "filosofia", "charada": "Deixo um adolescente de 16 anos numa crise existencial só de perguntar 'o que é o ser'.", "charada2": "Faço um menino de 16 anos duvidar da própria existência, mas nunca duvidar do lanche da cantina.", "charada3": "Faço as perguntas mais difíceis da humanidade só pra você terminar a aula com dor de cabeça."},
    {"topico": "Matérias escolares", "palavra": "física", "charada": "Explico por que seu celular, entre todas as posições possíveis, sempre escolhe cair com a tela pra baixo.", "charada2": "Prevejo a trajetória de qualquer objeto no ar, menos a da sua paciência na aula de manhã cedo.", "charada3": "Te provo matematicamente que o tempo passa mais devagar só quando você está esperando o ônibus no ponto."},
    {"topico": "Matérias escolares", "palavra": "geografia", "charada": "Você sabe a capital de um país que nunca vai visitar, mas esquece onde estacionou o carro.", "charada2": "Sei quantos fusos horários separam você do primo que mora fora, mas não sei prever se vai chover amanhã.", "charada3": "Exijo que você saiba o nome de todas as pedras do chão, mas não te ensino a usar o GPS."},
    {"topico": "Matérias escolares", "palavra": "história", "charada": "Alguém decepcionado vive dizendo que eu me repito, mas ninguém repete a prova sobre mim se colar direito.", "charada2": "Ensino que tudo já aconteceu antes, inclusive você jurar que ia estudar 'com antecedência'.", "charada3": "Fico te lembrando dos piores erros da humanidade pra você fingir que não vai repeti-los na prova."},
    {"topico": "Matérias escolares", "palavra": "inglês", "charada": "Te deixo cantar um hit inteiro com pronúncia perfeita e travar solenemente na hora de pedir satisfação no aeroporto.", "charada2": "Deixo você dublar filme inteiro sozinho no quarto e travar solene na hora de pedir o cardápio em outro país.", "charada3": "Te obrigo a imitar sotaque de filme na frente do espelho pra no fim só balançar a cabeça calado."},
    {"topico": "Matérias escolares", "palavra": "literatura", "charada": "Fingir que te leu inteira antes da prova é praticamente uma segunda matéria à parte.", "charada2": "Transformo affair de personagem fictício em trauma real de leitor no capítulo 12.", "charada3": "Faço você chorar por causa de um papel impresso que narra a vida de alguém que nunca existiu."},
    {"topico": "Matérias escolares", "palavra": "matemática", "charada": "Toda vida adulta promete que você nunca mais vai precisar achar o valor de x, e a vida adulta mente descaradamente.", "charada2": "Prometo que a vida real usa regra de três todo dia, e a vida real nunca comprova isso na sua frente.", "charada3": "Sou o pesadelo que te faz juntar maçãs e melancias só pra perguntar que dia da semana é hoje."},
    {"topico": "Matérias escolares", "palavra": "português", "charada": "A única matéria em que 'mim fazer isso' está errado, mas sai natural na hora de falar.", "charada2": "Ensino a crase que ninguém usa, mas todo mundo finge saber quando cobra do colega.", "charada3": "Tenho mais exceções do que regras, só pra garantir que ninguém nunca saia ileso da prova."},
    {"topico": "Matérias escolares", "palavra": "química", "charada": "Sou a razão do professor falar 'não façam isso em casa' logo depois de fazer bem na sua frente.", "charada2": "Explico reação que muda de cor, mas nunca explico por que o cheiro do laboratório gruda na roupa até de noite.", "charada3": "Passo o ano te fazendo desenhar hexágonos no caderno pra no final explodir alguma coisa na sua mente."},
    {"topico": "Matérias escolares", "palavra": "redação", "charada": "Ninguém nunca viu um 1000 de verdade em mim, só ouviu falar, que nem disco voador.", "charada2": "Cobro conectivo variado, mas aceito 'além disso' repetido cinco vezes se a ideia for boa.", "charada3": "Sou a única folha pautada que te dá suor frio só de olhar para aquelas margens em branco."},
    {"topico": "Matérias escolares", "palavra": "sociologia", "charada": "Te ensinei a dizer 'isso é uma construção social' pra ganhar qualquer discussão no almoço de domingo.", "charada2": "Ensino que toda mesa de bar vira debate de sociedade, principalmente quando ninguém te pediu opinião.", "charada3": "Sou a culpada por você analisar criticamente até a briga do vizinho por causa do lixo na calçada."},
    {"topico": "Matemática", "palavra": "altura", "charada": "A desculpa clássica de quem não alcança a prateleira de cima do mercado.", "charada2": "Apareço na ficha médica, mas na fila do brinquedo do parque sou eu quem decide se você entra ou não.", "charada3": "Sou a única coisa que faz alguém mentir descaradamente no perfil do aplicativo sem nenhum peso na consciência."},
    {"topico": "Matemática", "palavra": "ângulo", "charada": "Toda selfie busca o melhor de mim antes de postar.", "charada2": "Tenho graus que ninguém sente na pele, ao contrário dos graus do termômetro em fevereiro.", "charada3": "Mudo completamente a visão de quem está segurando o celular só pra tentar disfarçar a papada na selfie."},
    {"topico": "Matemática", "palavra": "área", "charada": "O motivo de duas pessoas discutirem sobre quem tem o quintal maior.", "charada2": "Multiplico dois lados e ainda assim ninguém confia em mim pra saber se o sofá novo vai caber na sala.", "charada3": "Sou aquilo que o corretor de imóveis sempre aumenta um pouquinho pra tentar te vender o apartamento mais caro."},
    {"topico": "Matemática", "palavra": "cálculo", "charada": "Ninguém nunca resolveu um de mim de cabeça sem fingir que já sabia a resposta.", "charada2": "Também sou o nome de uma pedra chata no rim, e nenhuma das duas versões de mim é bem-vinda.", "charada3": "Sou a matéria que faz todo calouro prometer que vai largar o curso já na primeira semana de exatas."},
    {"topico": "Matemática", "palavra": "círculo", "charada": "Não tenho começo nem fim, e mesmo assim toda discussão de família parece terminar do mesmo jeito que eu.", "charada2": "Sou a forma que todo mundo desenha torta na lousa, mesmo usando o compasso.", "charada3": "Sou o grupo de cadeiras que o professor de dinâmica arruma só pra ninguém conseguir se esconder lá atrás."},
    {"topico": "Matemática", "palavra": "conta", "charada": "Sempre chega no fim do mês e nunca fecha do jeito que você espera.", "charada2": "Também sou aquele pedido que ninguém quer pegar primeiro no restaurante.", "charada3": "Faço todo mundo no bar olhar pro teto fingindo que não entendeu quanto falta pra pagar a saideira."},
    {"topico": "Matemática", "palavra": "distância", "charada": "Sempre parece menor no mapa do carro do que quando você está andando a pé.", "charada2": "Separo você do sofá até a geladeira, e mesmo assim pareço longa demais às 23h.", "charada3": "Sou a desculpa perfeita pra você dizer que não vai no aniversário daquele amigo lá do outro lado."},
    {"topico": "Matemática", "palavra": "divisão", "charada": "A pior parte de qualquer conta de restaurante em grupo.", "charada2": "Separo o time do recreio, e nunca sobra ninguém satisfeito com o resultado.", "charada3": "Fico responsável por destruir grandes amizades quando sobra um número ímpar de fatias na mesa da pizzaria."},
    {"topico": "Matemática", "palavra": "dobro", "charada": "O que você promete estudar amanhã depois de não estudar nada hoje.", "charada2": "Peço mais uma hora de sono e você me devolve duas vezes esse tempo no soneca.", "charada3": "Sou exatamente o tamanho do esforço que você promete fazer no semestre seguinte depois do boletim desastroso."},
    {"topico": "Matemática", "palavra": "equação", "charada": "Tenho um lado igual ao outro, mas isso não impede ninguém de me errar feio na prova.", "charada2": "Tenho incógnita, mas quem realmente não sabe o que fazer é quem começa a resolver sem ler o enunciado inteiro.", "charada3": "Sou o problema cheio de letras que te faz questionar pra que serve o abecedário afinal de contas."},
    {"topico": "Matemática", "palavra": "escala", "charada": "Reduzo o mundo inteiro pra caber numa folha de papel, mas ninguém confia em mim pra montar móvel.", "charada2": "Também sou aquela que o músico sobe e desce, e ninguém acerta de primeira.", "charada3": "Sou o motivo do seu carrinho de controle remoto parecer enorme na foto e minúsculo na sala de estar."},
    {"topico": "Matemática", "palavra": "estatística", "charada": "Prometo que a maioria concorda com você, mesmo quando ninguém perguntou a ninguém.", "charada2": "Digo que 1 em cada 2 pessoas não confia em mim, e a outra metade nem me leu direito.", "charada3": "Mostro em gráficos lindos que você não tem a menor chance de passar sem estudar, mas você ignora."},
    {"topico": "Matemática", "palavra": "fração", "charada": "Prometo uma parte do bolo, mas ninguém nunca concorda em como cortar direito.", "charada2": "Sou meio a meio, tipo aquele acordo de pizza que nunca é justo.", "charada3": "Faço o pedaço de cima brigar com o debaixo só pra complicar a vida de quem precisa do resultado."},
    {"topico": "Matemática", "palavra": "função", "charada": "Recebo uma entrada, devolvo uma saída, e ainda assim ninguém confia em mim sem conferir duas vezes.", "charada2": "Também sou aquele evento chique que ninguém quer ir, mas todo mundo confirma presença.", "charada3": "Traço um caminho todo torto num plano só pra você esquecer de qual lado fica a reta vertical."},
    {"topico": "Matemática", "palavra": "geometria", "charada": "A parte da matemática que finge que a vida é feita só de formas perfeitas.", "charada2": "Ensino ângulo e área, mas nunca ensino a estacionar o carro dentro da vaga certa.", "charada3": "Faço você passar horas tentando provar com esquadro que a figura é realmente igual à lousa."},
    {"topico": "Matemática", "palavra": "gráfico", "charada": "Consigo fazer qualquer notícia parecer mais dramática só mudando onde o eixo começa.", "charada2": "Também sou a novela que sobe de audiência bem no capítulo que todo mundo já sabia o final.", "charada3": "Sou aquela pizza colorida que o professor usa pra provar no telão que a sua turma é a pior."},
    {"topico": "Matemática", "palavra": "juros", "charada": "A razão de parcelar em 12x parecer uma boa ideia até o extrato chegar.", "charada2": "Cresço sozinho todo mês, sem pedir licença e sem avisar com antecedência.", "charada3": "Sou a força invisível que transforma a blusinha barata num pesadelo de doze meses no seu extrato do mês."},
    {"topico": "Matemática", "palavra": "largura", "charada": "Ninguém nunca mede direito antes de tentar passar o sofá pela porta.", "charada2": "Meço o quanto, mas nunca meço a paciência de quem tá tentando estacionar na vaga apertada.", "charada3": "Sou aquilo que você sempre ignora até entalar de lado na porta giratória do banco com a mochila pesada."},
    {"topico": "Matemática", "palavra": "média", "charada": "A nota que decide se você repete de ano ou faz aquela última prova puxada.", "charada2": "Também sou aquele papo de 'mais ou menos', que ninguém sabe se é elogio ou reclamação.", "charada3": "Sou o número mágico que você passa o semestre calculando só pra saber se pode dormir na última aula."},
    {"topico": "Matemática", "palavra": "medida", "charada": "Sem mim, todo mundo jura que a calça ainda serve.", "charada2": "Provo que a receita da vovó nunca tinha xícara padronizada, só 'olho'.", "charada3": "Fico responsável por estragar a receita do bolo quando você decide usar a xícara de café em vez da certa."},
    {"topico": "Matemática", "palavra": "metade", "charada": "Sempre sobra pro outro quando é hora de dividir a pizza.", "charada2": "Também sou aquele fone que só funciona de um lado, bem na hora que você mais precisa dos dois.", "charada3": "Sou exatamente o que você promete comer do pacote de bolacha antes de devorar as outras unidades sem perceber."},
    {"topico": "Matemática", "palavra": "moda", "charada": "O número que mais aparece, tipo aquela desculpa que todo mundo usa quando se atrasa.", "charada2": "Também sou aquela roupa que sai de linha e, dez anos depois, volta como 'tendência retrô'.", "charada3": "Sou aquilo que todo mundo adota achando que é super original, e no fim fica parecendo uniforme de escola."},
    {"topico": "Matemática", "palavra": "multiplicação", "charada": "A tabuada que ninguém decorou direito, mas todo mundo finge que sim.", "charada2": "Sou a conta rápida no papel, mas nunca consigo aumentar o tempo livre do seu fim de semana.", "charada3": "Transformo o seu pequeno atraso de cinco minutos num problema gigantesco até o final do primeiro tempo do jogo."},
    {"topico": "Matemática", "palavra": "número", "charada": "Existo em quantidade suficiente pra você nunca mais confiar de olho no troco do mercado.", "charada2": "Bato à porta em toda fila de banco, e ninguém nunca gosta de ouvir o meu.", "charada3": "Sou aquele que você jura que anotou certo, mas que te faz mandar mensagem pro zap errado de madrugada."},
    {"topico": "Matemática", "palavra": "perímetro", "charada": "A volta toda que você dá no quarteirão fingindo que está fazendo exercício.", "charada2": "Também sou aquela conversa que dá voltas e voltas sem nunca chegar no assunto principal.", "charada3": "Sou o muro inteiro da fofoca que você tem que contornar pra chegar no assunto que realmente importa na roda."},
    {"topico": "Matemática", "palavra": "peso", "charada": "A única coisa que a balança do banheiro sempre acha uma desculpa pra aumentar.", "charada2": "Também sou aquele climão que ninguém quer carregar depois de uma indireta mal dada.", "charada3": "Sou aquele detalhe que te faz andar igual a uma estátua torta segurando a mala cheia na escada."},
    {"topico": "Matemática", "palavra": "polígono", "charada": "Tenho vários lados, que nem toda discussão de família no grupo do WhatsApp.", "charada2": "Ganho mais um lado a cada nome novo, tipo aquele grupo de família que nunca para de crescer.", "charada3": "Sou a forma trêmula que aparece toda vez que você tenta desenhar sem régua nenhuma figura reta no caderno."},
    {"topico": "Matemática", "palavra": "porcentagem", "charada": "Apareço toda vez que alguém quer fingir que um desconto é maior do que é.", "charada2": "Prometo 100% de chance de chuva, e ainda assim ninguém sai de casa com guarda-chuva.", "charada3": "Sou a desculpa matemática que o mercado usa pra te vender pela mesma quantia no dia da promoção furada."},
    {"topico": "Matemática", "palavra": "probabilidade", "charada": "A razão de todo mundo achar que vai ganhar na loteria dessa vez.", "charada2": "Digo que é pouco provável, e mesmo assim é sempre o que acontece com você.", "charada3": "Mostro que a chance do pão cair virado pra baixo é imensa, e você ainda teima em soltar da mão."},
    {"topico": "Matemática", "palavra": "proporção", "charada": "Ninguém tira foto de comida sem tentar me manipular a favor do prato.", "charada2": "Também sou aquela fofoca que cresce um pouco a cada pessoa que conta pra frente.", "charada3": "Sou a desculpa matemática pra sua avó fazer prato pra dez pessoas mesmo quando só você vai almoçar lá."},
    {"topico": "Matemática", "palavra": "quadrado", "charada": "Tenho quatro lados iguais, e ainda assim chamam alguém sem noção de 'mais quadrado que eu'.", "charada2": "Também sou aquele parente que só sabe falar de boato requentado, sempre do mesmo jeito.", "charada3": "Sou o carimbo oficial de quem não tem gingado nenhum tentando acompanhar a coreografia estourada na balada da turma."},
    {"topico": "Matemática", "palavra": "raiz", "charada": "Debaixo da terra ou dentro de mim, ninguém gosta de ficar cavando até me encontrar.", "charada2": "Sou o motivo de toda calculadora ganhar um botão só pra mim, e mesmo assim ninguém confia de cabeça.", "charada3": "Fico escondida debaixo de um puxadinho rabiscado só pra ver o seu desespero na hora de tentar me tirar."},
    {"topico": "Matemática", "palavra": "retângulo", "charada": "Sou tipo um quadrado que decidiu esticar um pouco os braços.", "charada2": "Também sou o formato de toda tela que você já quebrou pelo menos uma vez na vida.", "charada3": "Sou o formato oficial de todos os potes da cozinha que escondem feijão congelado fingindo ser sobremesa gelada."},
    {"topico": "Matemática", "palavra": "sequência", "charada": "Netflix pergunta se você ainda está assistindo bem no meio de mim.", "charada2": "Também sou aquele áudio de WhatsApp que vem em cinco partes e ninguém escuta na ordem certa.", "charada3": "Sou aquela filinha de episódios que você promete que vai ser curta, mas que consome todo o seu descanso."},
    {"topico": "Matemática", "palavra": "soma", "charada": "Junto duas quantias e sempre sobra alguém no grupo do rango achando que pagou a mais.", "charada2": "Também sou aquele resumo de fim de mês que sempre dá menos do que devia.", "charada3": "Faço as continhas básicas parecerem um monstro quando o caixa te pede uma moedinha e você gagueja na fila."},
    {"topico": "Matemática", "palavra": "subtração", "charada": "O que sobra na carteira depois que você jura que ia economizar esse mês.", "charada2": "Tiro um número do outro, e ainda assim ninguém confia sem contar duas vezes nos dedos.", "charada3": "Sou o que acontece com a sua paciência cada vez que o colega de mesa pega emprestada a mesma caneta."},
    {"topico": "Matemática", "palavra": "tabela", "charada": "Organizo tudo em linhas e colunas, menos a vida de quem promete se organizar.", "charada2": "Também sou aquela planilha que prometem atualizar toda semana e nunca atualizam.", "charada3": "Sou aquele monte de quadrinhos preenchidos que ninguém lê direito, mas que o chefe adora aplaudir na apresentação da firma."},
    {"topico": "Matemática", "palavra": "triângulo", "charada": "Tenho três lados e ainda assim sou o instrumento mais esquecido da banda da escola.", "charada2": "Também sou o desenho que qualquer criança faz pra representar 'casa' sem nem tentar caprichar.", "charada3": "Sou o causador oficial das piores fofocas de escola quando a briga de casal resolve envolver uma terceira pessoa."},
    {"topico": "Matemática", "palavra": "vértice", "charada": "O canto onde dois lados se encontram, tipo você e aquele parente chato na mesma festa.", "charada2": "Também sou aquele momento exato em que a conversa vira discussão, sem ninguém perceber a hora.", "charada3": "Sou a quina exata e dolorosa onde o seu dedinho mindinho encontra o sofá de canto no escuro do quarto."},
    {"topico": "Matemática", "palavra": "volume", "charada": "Some no controle remoto bem na hora que o comercial começa mais alto que o programa.", "charada2": "Também sou aquele espaço que a mala nunca tem quando a viagem é de duas semanas.", "charada3": "Sou aquilo que a sua mochila decide ter em excesso justo no dia de entrar no transporte público superlotado."},
    {"topico": "Física", "palavra": "aceleração", "charada": "O que todo mundo faz no último quilômetro só pra não perder o compromisso que já está atrasado.", "charada2": "Aperto o passo quando o sinal fecha, e ainda assim chego atrasado igual todo mundo.", "charada3": "Faço você pisar fundo no último segundo só pra não ser o último a bater o ponto na catraca lenta."},
    {"topico": "Física", "palavra": "atração", "charada": "Faz dois corpos se aproximarem, e também é a desculpa de qualquer paquera capenga.", "charada2": "Também sou o motivo de dois ímãs vizinhos na geladeira nunca ficarem separados.", "charada3": "Sou a força magnética invisível que sempre faz o seu olho encontrar o prato mais caro do cardápio chique."},
    {"topico": "Física", "palavra": "atrito", "charada": "A razão de você escorregar justo quando tem gente olhando.", "charada2": "Também sou aquele barulho de sapato novo no chão que todo mundo escuta menos você.", "charada3": "Sou o que faz você derrapar com chinelo de borracha na calçada molhada, levando um susto daqueles na frente dos outros."},
    {"topico": "Física", "palavra": "calor", "charada": "A desculpa nacional pra não fazer absolutamente nada em janeiro.", "charada2": "Também sou a razão do ventilador virar item essencial de casa em dezembro.", "charada3": "Sou a desculpa clássica pra você trocar três camisas no dia e ainda reclamar que não adiantou nada do suor."},
    {"topico": "Física", "palavra": "campo", "charada": "Onde o time de futebol do bairro sempre jura que ia ganhar esse ano.", "charada2": "Também sou o time inteiro discordando da escalação, sem ninguém perguntar ao técnico.", "charada3": "Sou aquele gramado que parece infinito quando você precisa correr da bola e não tem preparo físico nenhum."},
    {"topico": "Física", "palavra": "circuito", "charada": "Preciso estar fechado pra funcionar, que nem aquela roda de amigos que nunca deixa ninguém novo entrar.", "charada2": "Também sou aquele fio de fone que insiste em dar nó sozinho no bolso.", "charada3": "Sou o caminho todo amarrado que o pisca-pisca faz, apagando inteiro se só uma lâmpada resolve queimar."},
    {"topico": "Física", "palavra": "corrente", "charada": "Passa pelo fio, e também é a razão de você nunca lembrar a senha do wifi de cor.", "charada2": "Também sou aquele grupo de amigos que só se junta de novo quando alguém casa ou morre.", "charada3": "Sou a única energia invisível que você tem pavor de encostar o dedo quando vai trocar o chuveiro pelado."},
    {"topico": "Física", "palavra": "eco", "charada": "Repito o que você gritou na montanha, mas nunca respondo quando te chamam pra lavar louça.", "charada2": "Também sou a sala vazia depois que a festa acaba e só sobra o barulho da louça.", "charada3": "Sou o fantasma acústico que insiste em repetir os seus foras mais vergonhosos no corredor vazio do apartamento."},
    {"topico": "Física", "palavra": "eletricidade", "charada": "Falta justo quando o capítulo da novela está no ápice.", "charada2": "Também sou o motivo do prédio inteiro descobrir quem tem gerador.", "charada3": "Sou a mágica que você só valoriza quando o seu celular pisca que vai desligar no meio daquela mensagem séria."},
    {"topico": "Física", "palavra": "energia", "charada": "Falta justo na hora que você mais precisa dela, tipo numa segunda-feira de manhã.", "charada2": "Também sou aquela que a criança tem de sobra às 22h, bem na hora de dormir.", "charada3": "Sou aquela disposição rara que some magicamente do corpo assim que você bota os pés no portão da firma."},
    {"topico": "Física", "palavra": "espaço", "charada": "O motivo de você nunca conseguir estacionar o carro igual ao vizinho.", "charada2": "Também sou o motivo da van do transporte escolar sempre jurar que cabe mais um.", "charada3": "Sou o que nunca sobra no cartão de memória quando você decide gravar o melhor momento do show de frente."},
    {"topico": "Física", "palavra": "força", "charada": "A desculpa de quem não consegue abrir o pote de azeitona sozinho.", "charada2": "Também sou o nome que dão pra qualquer academia que promete resultado em um mês.", "charada3": "Sou o que falta completamente na mão quando você desiste de abrir a lata de conservas dura e vai pro pão."},
    {"topico": "Física", "palavra": "gravidade", "charada": "A única força que nunca tira folga, nem nos fins de semana.", "charada2": "Também sou a palavra usada quando alguém tenta minimizar um problema sério dizendo 'não é nada demais'.", "charada3": "Sou a dona implacável que garante que a torrada sempre encontre o chão virada pra baixo na sua roupa limpa."},
    {"topico": "Física", "palavra": "ímã", "charada": "Atrai o metal, e também atrai foto de viagem que ninguém tira mais direito.", "charada2": "Também sou aquele que gruda mais lembrancinha de viagem na geladeira do que espaço realmente sobra.", "charada3": "Sou a pecinha de brinde grudada no fundo da geladeira segurando aquela conta atrasada pra todo mundo da casa chorar."},
    {"topico": "Física", "palavra": "inércia", "charada": "A vontade de continuar deitado no sofá exatamente como você já estava.", "charada2": "Também sou o motivo de todo mundo prometer academia em janeiro e sumir em fevereiro.", "charada3": "Sou a teoria que explica, sem você dizer uma palavra, a sua falta total de vontade de levantar no domingo frio."},
    {"topico": "Física", "palavra": "luz", "charada": "Apaga bem na cena mais assustadora do filme, nunca antes.", "charada2": "Também sou a primeira coisa que o vizinho reclama quando fica acesa até tarde.", "charada3": "Sou a primeira coisa a te abandonar no susto quando você finalmente entra no corredor escuro na sexta à noite."},
    {"topico": "Física", "palavra": "massa", "charada": "A desculpa científica de por que o pão não flutua na sua frente.", "charada2": "Também sou aquela que sobra na mão depois que a receita de pão pede 'sove até ficar lisinha'.", "charada3": "Sou a explicação oficial de quem sobe na balança depois do Natal e jura que a balança está estragada."},
    {"topico": "Física", "palavra": "movimento", "charada": "Sem mim, a academia perderia a única coisa que justifica a mensalidade.", "charada2": "Também sou o nome de qualquer campanha que promete mudar tudo e vira só figurinha de status.", "charada3": "Sou o que falta na sua rotina depois que a maratona do sofá substituiu a corrida na praça vazia."},
    {"topico": "Física", "palavra": "onda", "charada": "Chega, some, e sempre te pega de calças curtas justo na praia.", "charada2": "Também sou aquele boato que sobe rápido e ninguém lembra quem começou.", "charada3": "Sou a desculpa molhada do surfista fingido pra faltar na sexta de manhã afirmando que o mar chamou alto demais."},
    {"topico": "Física", "palavra": "óptica", "charada": "Estudo a luz e as ilusões, tipo aquele espelho de provador que sempre mente pra você.", "charada2": "Também sou o motivo de todo espelho de loja te fazer parecer mais alto que na vida real.", "charada3": "Sou a brincadeira visual que faz o asfalto quente parecer molhado, enganando de longe a sua sede gigante de verão."},
    {"topico": "Física", "palavra": "potência", "charada": "Quanto mais alta a minha, mais rápido a conta de luz assusta no fim do mês.", "charada2": "Também sou o argumento pra justifycar comprar o carro mais caro da concessionária.", "charada3": "Sou a promessa na caixa da furadeira novinha que chora e falha na primeira parede resistente do apê vizinho."},
    {"topico": "Física", "palavra": "pressão", "charada": "Sobe quando o chefe manda mensagem sexta às 18h.", "charada2": "Também sou aquela que sobe quando alguém liga perguntando 'cadê o relatório?'", "charada3": "Sou aquela bufada escandalosa que a panela na cozinha solta quando tá na beira de transformar o feijão em carvão."},
    {"topico": "Física", "palavra": "refração", "charada": "Faço um lápis parecer quebrado dentro d'água, sem nunca quebrar nada de verdade.", "charada2": "Também sou o motivo de o canudo parecer torto assim que entra no copo.", "charada3": "Faço a borda da piscina deixar o braço do nadador tortinho, como se tivesse quebrado em duas partes do nada."},
    {"topico": "Física", "palavra": "resistência", "charada": "Quanto mais eu tenho, mais difícil a corrente passa, e mais difícil você aceitar um não.", "charada2": "Também sou a última força de vontade antes de repetir o prato no rodízio.", "charada3": "Sou a qualidade que a chapinha de cabelo perde assim que você pisa desavisada na garoa fininha da noite inteira."},
    {"topico": "Física", "palavra": "som", "charada": "Baixa sozinho assim que o professor começa a falar algo importante.", "charada2": "Também sou o motivo do vizinho ligar o carro de madrugada só pra 'esquentar o motor'.", "charada3": "Sou o estrondo estourado do fone de camelô que jura ser de alta qualidade, mas só devolve zumbido no ouvido fechado."},
    {"topico": "Física", "palavra": "temperatura", "charada": "Discussão eterna de quem controla o ar-condicionado do escritório.", "charada2": "Também sou a primeira pergunta de qualquer mãe assim que alguém diz 'acho que tô ficando doente'.", "charada3": "Sou a eterna briga dos botões no painel do carro entre quem congela e quem derrete no banco do carona da frente."},
    {"topico": "Física", "palavra": "tempo", "charada": "Some rápido demais quando é fim de semana, e devagar demais numa reunião chata.", "charada2": "Também sou o assunto reserva de qualquer conversa de elevador quando ninguém tem mais nada a dizer.", "charada3": "Sou a grandeza que se arrasta igual tartaruga quando o micro-ondas mostra o último minuto do esquente da marmita amarrada."},
    {"topico": "Física", "palavra": "vácuo", "charada": "Lugar onde não existe nada, parecido com sua cabeça segunda de manhã antes do café.", "charada2": "Também sou aquele aparelho de limpar casa que promete facilidade e fica preso embaixo do sofá.", "charada3": "Sou a teoria perfeita do nada que você recebe de volta quando manda aquele cumprimento forçado pro crush lá na roda."},
    {"topico": "Física", "palavra": "velocidade", "charada": "O motivo de toda lombada existir.", "charada2": "Também sou o motivo de toda internet 'turbo' nunca parecer turbo o suficiente.", "charada3": "Sou a urgência que acorda sua alma na base do grito e faz você correr atrás da condução fechando a porta."},
    {"topico": "Química", "palavra": "ácido", "charada": "A razão do seu estômago reclamar depois daquele lanche às 2 da manhã.", "charada2": "Também sou o comentário de quem sempre acha um jeito de estragar o clima de qualquer conversa boa.", "charada3": "Sou o toque cortante da balinha que te faz fechar os dois olhos e prometer que não vai comer mais nenhuma verde."},
    {"topico": "Química", "palavra": "água", "charada": "Prometem que você deveria beber mais de mim o dia inteiro, e ninguém cumpre.", "charada2": "Também sou o motivo de toda garrafinha reutilizável ficar esquecida na bolsa, vazia, há dias.", "charada3": "Sou a salvadora prometida na garrafinha térmica que você volta com ela inteira intocada na mochila pesada da ida e volta."},
    {"topico": "Química", "palavra": "átomo", "charada": "Tão pequeno que ninguém nunca viu, e mesmo assim vive sendo citado em conversa de bar sobre o universo.", "charada2": "Sou usado pra descrever qualquer chance mínima, tipo 'nem uma partícula de paciência sobrou'.", "charada3": "Sou a gotícula teórica do universo que, junto das outras, faz o chulé do seu pé na meia molhada."},
    {"topico": "Química", "palavra": "base", "charada": "Meu oposto é ácido, e assim como toda discussão de política, a gente nunca concorda no meio termo.", "charada2": "Também sou aquela camada de maquiagem que promete durar o dia todo e não dura nem até o almoço.", "charada3": "Sou o troço pegajoso que amarga a língua inteira se você não enxaguar a espuma do dente antes de engolir forte."},
    {"topico": "Química", "palavra": "carbono", "charada": "Estou em todo ser vivo, e também na desculpa de todo mundo pra reduzir a pegada.", "charada2": "Também sou citado toda vez que alguém quer parecer consciente sem mudar nenhum hábito de verdade.", "charada3": "Sou a poeira teórica de lápis velho e churrasco de domingo, enfiado na culpa alheia sobre não reciclar garrafa suja plástica."},
    {"topico": "Química", "palavra": "combustão", "charada": "Preciso de oxigênio pra acontecer, que nem aquela fofoca que só pega fogo com plateia.", "charada2": "Também sou o motivo de churrasco sempre ter alguém se achando expert em acender carvão.", "charada3": "Sou a fervura na pele que faz seu rosto estourar num vermelho fogo ao escutar seu nome solto alto na sala cheia."},
    {"topico": "Química", "palavra": "composto", "charada": "Feito de mais de um elemento, que nem aquela receita de família que ninguém sabe explicar direito.", "charada2": "Também sou o nome de qualquer remédio de bula gigante que ninguém lê até o fim.", "charada3": "Sou a jantinha misturada misteriosa que sobrou do final de semana e voltou fervida na panela do fogão como se fosse nova."},
    {"topico": "Química", "palavra": "concentração", "charada": "Quanto mais eu tenho numa solução, mais forte ela fica, e é exatamente o que falta em você numa reunião de segunda.", "charada2": "Também sou a primeira coisa que qualquer notificação de celular consegue quebrar em meio segundo.", "charada3": "Sou a capacidade rara que foge voando da mente quando o relógio da parede decide parar de fazer o tique-taque baixo da prova."},
    {"topico": "Química", "palavra": "cristal", "charada": "Organizado até nos átomos, ao contrário do seu quarto.", "charada2": "Também sou o nome chique que dão pro copo caro que ninguém pode usar no dia a dia.", "charada3": "Sou aquela vidraça super delicada guardada na estante de casa que, se você encostar, desaba o mundo inteiro em estilhaços no tapete."},
    {"topico": "Química", "palavra": "elemento", "charada": "Tenho uma tabela inteira dedicada a mim, e ainda assim ninguém decora além de uns 5.", "charada2": "Também sou usado pra dizer que alguém é 'suspeito' numa festa sem provar nada.", "charada3": "Sou o quadradinho com letras isolado no papel que, num trabalho sério, vira piada pra enfeitar nome de bicho de estimação estranho."},
    {"topico": "Química", "palavra": "ferro", "charada": "Deixo a roupa lisinha, e também deixo o detector do aeroporto apitando bem na sua vez.", "charada2": "Também sou aquele eletrodoméstico que só sai do armário quando a roupa já tá quase no prazo de usar, amassada mesmo.", "charada3": "Sou aquele pesinho de mão quente da prateleira que, no mínimo deslize, amassa e queima aquela seda nova e sem troca sua."},
    {"topico": "Química", "palavra": "fórmula", "charada": "Todo mundo decora a minha e esquece pra que ela serve dois dias depois da prova.", "charada2": "Também sou usada pra chamar qualquer plano infalível que nunca funciona igual da segunda vez.", "charada3": "Sou aquela tripa de letrinhas e algarismos no braço suado do aluno fingido, esperando o professor olhar pro outro cantinho dali."},
    {"topico": "Química", "palavra": "gás", "charada": "Escapo da panela de pressão bem na hora que você tira os olhos dela.", "charada2": "Também sou aquele que acaba do botijão bem no meio do banho mais gelado do ano.", "charada3": "Sou o ar fedorento de repolho invisível que acaba na pressa na hora de fazer a panela do almoço ferver no fogão rápido."},
    {"topico": "Química", "palavra": "hidrogênio", "charada": "O elemento mais simples da tabela, mas ninguém lembra de mim até a aula sobre a água.", "charada2": "Também dou nome à bomba que ninguém quer ver de perto, nem na aula de história.", "charada3": "Sou a molécula simples da tabelinha que ninguém decora o resto inteiro e só sabe do vizinho balão e da tal da bomba."},
    {"topico": "Química", "palavra": "íon", "charada": "Um átomo que perdeu ou ganhou elétron, tipo você depois de uma treta no grupo da família.", "charada2": "Também sou usado pra design de nome de carro elétrico querendo parecer futurista.", "charada3": "Sou aquele sujeitinho minúsculo do teste de carga que, de tanto dar e tirar coisa do lado, deixou você de recuperação amarga."},
    {"topico": "Química", "palavra": "líquido", "charada": "Me ajeito em qualquer copo, ao contrário da sua vida financeira.", "charada2": "Também sou o estado do seu salário por volta do dia 20 de cada mês.", "charada3": "Sou o copão de refrigerante do cantinho do prato que jorra e se espalha certeiro no trabalho escolar imaculado da noite retrasada."},
    {"topico": "Química", "palavra": "metal", "charada": "Faz o detector de aeroporto apitar justo em você, nunca na pessoa da frente.", "charada2": "Também sou o gênero de música que o adolescente da casa liga bem alto pra incomodar todo mundo.", "charada3": "Sou a superfície fritadeira que, esquecida no sol, te marca bonito a perna distraída no banco do coletivo lá no fervo do calor."},
    {"topico": "Química", "palavra": "mistura", "charada": "Junto duas coisas sem virar uma terceira, tipo arroz com feijão que nunca vira arroz-feijão de vez.", "charada2": "Também sou aquele grupo de amigos formado só porque todo mundo tinha alguém em comum.", "charada3": "Sou o combo esquisito de refri, suco e bolacha dentro da sua barriga revolta, batendo alto e gritando pra voltar de vez do almoço."},
    {"topico": "Química", "palavra": "molécula", "charada": "Pequena demais pra você ver, grande o suficiente pra decidir se seu perfume é bom.", "charada2": "Também sou usada em qualquer propaganda de creme pra parecer mais científica do que realmente é.", "charada3": "Sou a ligação frouxa que o professor empurra no quadro gigante, enchendo seu caderno de pauzinho feio que vira teia de aranha solta."},
    {"topico": "Química", "palavra": "nitrogênio", "charada": "Sou a maior parte do ar que você respira, e ainda assim ninguém nunca fala de mim numa conversa de elevador.", "charada2": "Também sou usado pra deixar sorvete de restaurante chique parecendo experimento de laboratório.", "charada3": "Sou o balde de névoa no copo enfeitado do barmen, custando o triplo na sua mesa só porque espalha gelo no ar em volta de tudo."},
    {"topico": "Química", "palavra": "oxigênio", "charada": "A única coisa que todo mundo concorda que é essencial, e mesmo assim ninguém agradece por ela.", "charada2": "Também sou a desculpa clássica pra sair andando rápido de qualquer climão familiar: 'vou tomar um ar'.", "charada3": "Sou a brisa necessária que você esquece de puxar quando trava feio a perna pra tirar a foto segurando o fôlego sem parar."},
    {"topico": "Química", "palavra": "reação", "charada": "O motivo de todo experimento de escola prometer fumaça e nunca entregar.", "charada2": "Também sou o nome de qualquer vídeo de internet onde alguém só assiste outro vídeo e comenta.", "charada3": "Sou aquilo surpreso e instintivo que a mão faz estalando no seu rosto quando o primo decide contar o final estragado do seu filme."},
    {"topico": "Química", "palavra": "sal", "charada": "Aquele que sempre falta bem na hora que a comida já está pronta.", "charada2": "Também sou aquele que satura completamente qualquer pipoca de cinema.", "charada3": "Sou o vilão cristalizado que, no fundo quente do pacote da lanchonete, decide secar a saliva do desavisado numa golada de poeira só."},
    {"topico": "Química", "palavra": "sólido", "charada": "A única coisa que seu argumento numa discussão de família raramente é.", "charada2": "Também sou usado pra elogiar plano de vida que na prática ninguém seguiu até o fim do mês.", "charada3": "Sou a consistência indesejada do arroz encaroçado que o novato deixa queimar sozinho, duro e seco, no fundo da panela do fogão do grupo."},
    {"topico": "Química", "palavra": "solução", "charada": "Sempre pareço óbvia depois que alguém já te falou qual sou.", "charada2": "Também sou aquela resposta óbvia que só aparece depois que você já brigou horas sobre o problema.", "charada3": "Sou o truque simples com barbante e chiclete que o seu amigo folgado jura que vai consertar o retrovisor balançando do carro batido no poste."},
    {"topico": "Química", "palavra": "solvente", "charada": "Dissolvo qualquer coisa, menos aquela mancha teimosa que já virou parte da camisa.", "charada2": "Também sou usado em qualquer removedor de esmalte que deixa cheiro forte no cômodo inteiro.", "charada3": "Sou o pote mal cheiroso da embalagem que arde a narina do quarteirão inteiro, tudo pra limpar uns pingos de mancha azul sem sucesso de nada."},
    {"topico": "Química", "palavra": "substância", "charada": "Toda embalagem de produto de limpeza me esconde atrás de um nome que ninguém consegue pronunciar.", "charada2": "Também sou usada pra elogiar um argumento forte, mesmo quando ele não tem nada de concreto por trás.", "charada3": "Sou a gororoba verde neon que a propaganda jurava te fazer rejuvenescer doze anos de pele de seda macia lavando o rosto no banho raso."},
    {"topico": "Química", "palavra": "vapor", "charada": "Saio da panela e embaço o espelho bem na hora que você mais precisa se ver antes de sair.", "charada2": "Também sou a razão do espelho do banheiro nunca deixar você se ver direito logo depois do banho quente.", "charada3": "Sou o bafo superquente do chuveirão elétrico, que não avisa e gruda inteiro no espelho sem deixar você achar a ponta solta da toalha dali."},
    {"topico": "Biologia", "palavra": "animal", "charada": "Categoria que inclui você, mesmo que sua timeline discorde.", "charada2": "Também sou usado pra xingar alguém que corta fila sem pedir licença.", "charada3": "Sou a xingada clássica entre os dois irmãos irritantes correndo pela sala de casa esbarrando com tudo e tombando cadeira frouxa na frente da tia de longe."},
    {"topico": "Biologia", "palavra": "bactéria", "charada": "Vive numa maçaneta que ninguém nunca limpa direito.", "charada2": "Também sou a razão do celular do banheiro público parecer o objeto mais sujo do planeta.", "charada3": "Sou a coisinha encardida grudada há um semestre atrás da pia velha da geladeira, pronta pra causar desarranjo em quem beber no garrafão sujo alheio dela por ali."},
    {"topico": "Biologia", "palavra": "célula", "charada": "Tão pequena que ninguém vê, e mesmo assim sou citada em toda propaganda de creme anti-idade.", "charada2": "Também sou o nome de qualquer cadeia, presídio ou aquele quartinho de bagunça lá de casa.", "charada3": "Sou a unidade formiguinha preguiçosa que, no dia útil da folga da faxina toda do organismo, trava inteira e te deixa empacado no chão duro."},
    {"topico": "Biologia", "palavra": "cérebro", "charada": "Trabalha o dia inteiro sem parar, e mesmo assim esquece onde você colocou a chave de casa.", "charada2": "Também sou o apelido de quem sempre resolve o problema técnico da família de graça.", "charada3": "Sou a maquininha interna barulhenta que ferve só de olhar de novo os slides, mas que apaga no mesmo milissegundo depois que bate a janta gigante à meia luz."},
    {"topico": "Biologia", "palavra": "coração", "charada": "Dispara sozinho quando o crush curte sua última foto.", "charada2": "Também sou o emoji mais usado pra fingir concordar com uma foto que você nem olhou direito.", "charada3": "Sou o troço dentro da caixa que galopa igual cavalo indomável toda vez que você tenta puxar aquele papo constrangedor pela janela minúscula do caixa eletrônico sem senha à toa."},
    {"topico": "Biologia", "palavra": "corpo", "charada": "A coisa que você promete cuidar melhor toda segunda-feira de janeiro.", "charada2": "Também sou o motivo de toda roupa nova parecer mais apertada depois do fim de semana.", "charada3": "Sou o peso-morto arrastado que chora e protesta alto de manhã cedo assim que pisa pela primeira vez no dia no tatame sujo e molhado da esteira velha."},
    {"topico": "Biologia", "palavra": "digestão", "charada": "A razão de ninguém querer correr logo depois do almoço de domingo.", "charada2": "Também sou usada como desculpa pra tirar uma soneca logo depois do almoço.", "charada3": "Sou a usina entupida e lenta que decide dar as caras, cheia de azia braba e sonolenta."},
    {"topico": "Biologia", "palavra": "doença", "charada": "Sempre aparece na sexta-feira à noite, nunca durante a semana de trabalho.", "charada2": "Também sou o motivo de todo grupo de trabalho ficar sem resposta numa sexta-feira.", "charada3": "Sou a praga sorrateira que se instala sem dó na sua garganta bem na quinta à noite pro seu fim de semana na festa top furar de vez."},
    {"topico": "Biologia", "palavra": "ecossistema", "charada": "Um equilíbrio que se desfaz completamente quando um mosquito entra no seu quarto às 3 da manhã.", "charada2": "Também sou usado pra descrever qualquer grupo de amigos com uma dinâmica complicada demais de explicar.", "charada3": "Sou a dinâmica natural bagunçada da sua república de estudantes, onde até as embalagens de pizza do mês passado formam uma vizinhança harmoniosa e perigosa no canto do sofá."},
    {"topico": "Biologia", "palavra": "espécie", "charada": "Categoria que agrupa seres tão diferentes quanto você e seu primo que só aparece no Natal.", "charada2": "Também sou usada pra classificar aquele tipo raro de pessoa que responde mensagem na hora.", "charada3": "Sou a caixinha inventada de nome complicado pra cientista brigar e debater sobre onde se enquadra aquele pernilongo mutante gigante que não obedece nem à chinelada forte."},
    {"topico": "Biologia", "palavra": "evolução", "charada": "Levei milhões de anos pra chegar no polegar, e você ainda erra ao digitar no celular.", "charada2": "Também sou o nome de qualquer atualização de celular que promete melhorar e deixa mais lento.", "charada3": "Sou o grande salto de orgulho das cavernas até você, que se enroscou com o fone e agora está caído no meio da calçada."},
    {"topico": "Biologia", "palavra": "fotossíntese", "charada": "O processo que faz a planta comer luz do sol, coisa que você nunca conseguiu fazer nem com café.", "charada2": "Também sou citada toda vez que alguém tenta explicar por que devia ter mais plantas em casa e nunca rega nenhuma.", "charada3": "Sou a magia secreta que sua horta do fundo de quintal estaria fazendo se você não tivesse deixado tudo ali pra murchar no escuro total."},
    {"topico": "Biologia", "palavra": "fungo", "charada": "Cresço em qualquer lugar úmido, inclusive naquele pote de comida esquecido na geladeira.", "charada2": "Também sou a razão do pão de forma esquecido virar arte moderna em três dias.", "charada3": "Sou a mancha cinza no cantinho daquele requeijão abandonado, mostrando que até a sua prateleira tem vida cultural esquecida."},
    {"topico": "Biologia", "palavra": "gene", "charada": "A desculpa perfeita pra herdar o mau humor de manhã da família.", "charada2": "Também sou usado pra justificar por que a família inteira chega atrasada em tudo.", "charada3": "Sou o código oculto da sua família que justifica perfeitamente o seu mau gosto incorrigível pra piada ruim de pavê."},
    {"topico": "Biologia", "palavra": "habitat", "charada": "O lugar onde cada bicho vive, e também o motivo de reclamarem quando você invade o quarto do outro sem bater.", "charada2": "Também sou usado pra descrever o quarto de quem nunca deixa ninguém entrar sem avisar antes.", "charada3": "Sou aquele abismo caótico do seu quarto juvenil trancado onde nem a vassoura mágica da sua mãe ousa pisar."},
    {"topico": "Biologia", "palavra": "hormônio", "charada": "A desculpa perfeita pra explicar qualquer mudança de humor repentina.", "charada2": "Também sou culpado por aquela vontade repentina de doce às 23h de uma terça qualquer.", "charada3": "Sou a farra química no sangue que te faz odiar todo o planeta sem motivo nenhum no meio do café da tarde."},
    {"topico": "Biologia", "palavra": "músculo", "charada": "Prometido em janeiro, esquecido em fevereiro, junto com a inscrição da academia.", "charada2": "Também sou o motivo de toda foto de academia vir acompanhada de legenda motivacional.", "charada3": "Sou a carne dolorida da perna que jura protestar por três dias seguidos depois de um mísero lance de escada."},
    {"topico": "Biologia", "palavra": "natureza", "charada": "Chama você pra um passeio e depois te lembra que existe wi-fi em casa.", "charada2": "Também sou o cenário perfeito de toda foto que esconde o quanto o passeio foi cansativo.", "charada3": "Sou o programa roots do feriado que promete cachoeira limpa, mas entrega arranhão e um monte de picada de abelha."},
    {"topico": "Biologia", "palavra": "órgão", "charada": "Cada um de nós tem uma função, menos aquele que ninguém sabe pra que serve até o médico explicar.", "charada2": "Também sou usado pra chamar qualquer autoridade que ninguém sabe bem o que decide de verdade.", "charada3": "Sou a peça invisível da sua máquina interna que te faz questionar pra que serve depois de um escorregão na rua."},
    {"topico": "Biologia", "palavra": "osso", "charada": "Aguento o corpo inteiro de pé, e ainda assim ninguém me agradece até doer.", "charada2": "Também sou usado pra dizer que alguém 'não dá o braço a torcer' nem depois de perder a discussão.", "charada3": "Sou a barra de sustento escondida na sua canela que insiste em bater de frente na quina daquela gaveta da cozinha da avó assustada."},
    {"topico": "Biologia", "palavra": "planta", "charada": "Prometem que sou fácil de cuidar, e mesmo assim toda suculenta da sua casa já morreu.", "charada2": "Também sou usada pra decorar reunião de trabalho, sempre de plástico, sempre empoeirada.", "charada3": "Sou a colega verde fingida do lado do sofá que você comprou de plástico só pra não ter o trabalho de botar gota de torneira nela."},
    {"topico": "Biologia", "palavra": "proteína", "charada": "Prometo músculo pra quem toma, mas o shaker sujo na pia é a única coisa que realmente aparece.", "charada2": "Também sou o primeiro assunto de qualquer conversa sobre dieta que dura só até sexta-feira.", "charada3": "Sou o famoso milagre do whey de pote que seu amigo devora com gosto de farinha e areia na fé do bíceps bombado."},
    {"topico": "Biologia", "palavra": "pulmão", "charada": "Trabalho o tempo todo sem parar, e mesmo assim sou o primeiro a reclamar quando você sobe uma escada.", "charada2": "Também sou usado pra descrever quem grita o time inteiro do campo desde a arquibancada.", "charada3": "Sou o par de fole frouxo e ofegante que apita alto só de você tentar inflar a boia de piscina grande no verão."},
    {"topico": "Biologia", "palavra": "reprodução", "charada": "O assunto da aula que fazia todo mundo olhar pro teto fingindo interesse no ventilador.", "charada2": "Também sou o nome do botão que todo mundo aperta de novo achando que vai mudar o final do episódio.", "charada3": "Sou o segredo feio da multiplicação oculta dos boletos, que geram mais boletos enquanto você assiste televisão em paz."},
    {"topico": "Biologia", "palavra": "respiração", "charada": "Automática até alguém te lembrar dela, e então você não consegue parar de pensar nela.", "charada2": "Também sou a primeira coisa que esquecem de fazer direito na fila do banco quando o número não anda.", "charada3": "Sou o fôlego automático e silencioso que, quando você presta atenção, vira manual e irrita completamente o seu sossego."},
    {"topico": "Biologia", "palavra": "sangue", "charada": "Sobe na cabeça bem na hora que alguém mexe com você no grupo da família.", "charada2": "Também sou usado pra descrever qualquer disputa boba de jogo de tabuleiro em família.", "charada3": "Sou a gotinha vermelha escandalosa na ponta do dedo que faz o cara mais valentão da roda desmaiar na mesa da lanchonete suja."},
    {"topico": "Biologia", "palavra": "saúde", "charada": "Só vira prioridade de verdade depois que alguém te dá um susto no consultório.", "charada2": "Também sou o brinde mais repetido em qualquer aniversário de família, mesmo sem ninguém erguer a taça de verdade.", "charada3": "Sou a ausência divina de coriza e da tosse que você não deu a mínima até pegar aquele sereno maldito no rosto frio."},
    {"topico": "Biologia", "palavra": "vacina", "charada": "Uma picadinha rápida que sempre vem acompanhada de choro, seu ou de alguém do lado.", "charada2": "Também sou motivo de discussão de grupo de zap que ninguém consegue encerrar.", "charada3": "Sou a pequena marca do furo no ombro que a enfermeira aplica sem dó e faz até adulto maromba fechar o olho pra não chorar na sala."},
    {"topico": "Biologia", "palavra": "vida", "charada": "A única coisa que ninguém consegue devolver depois de reclamar dela o dia inteiro.", "charada2": "Também sou o nome do jogo de tabuleiro que sempre acaba em discussão antes do fim.", "charada3": "Sou a contagem chata do boleto do mês, e a correria bizarra atrás de pão, sem que ninguém tenha recebido o tutorial disso."},
    {"topico": "Biologia", "palavra": "vírus", "charada": "Se espalha mais rápido que fofoca de grupo de WhatsApp da família.", "charada2": "Também sou usado pra descrever aquele vídeo de gato que todo mundo compartilha no mesmo dia.", "charada3": "Sou o monstrinho sorrateiro do pen drive do amigo de sala que derrubou em cinco minutos todo o sistema operacional do seu notebook novinho."},
    {"topico": "Biologia", "palavra": "vitamina", "charada": "Existo na fruta, mas todo mundo prefere me tomar em comprimido mesmo assim.", "charada2": "Também sou usada pra vender suco de caixinha como se fosse remédio milagroso.", "charada3": "Sou o comprimido grande demais que arranha a garganta toda, engolido no desespero matinal, pra compensar todo o estrago do pastel da feira de ontem de tarde."},
    {"topico": "História", "palavra": "batalha", "charada": "Aquele confronto que os livros descrevem em páginas inteiras, mas que na vida real dura só alguns minutos.", "charada2": "Também sou usada pra descrever a fila do banco às vésperas do feriado.", "charada3": "Sou a labuta incansável contra a tampinha chata e vedada daquele vidro velho que escorrega da sua mão em todo almoço apertado de domingo."},
    {"topico": "História", "palavra": "colônia", "charada": "Território emprestado que o dono original nunca mais devolveu de bom grado.", "charada2": "Também sou o nome de qualquer perfume que promete durar o dia inteiro e não dura.", "charada3": "Sou o passado enroscado do chão da sua terra que teima em ser romantizado pelo livro, enquanto cobravam um preço salgado do lado de cá e de longe."},
    {"topico": "História", "palavra": "conquista", "charada": "Tomar posse de um território, ou aquela sensação de finalmente estacionar numa vaga difícil.", "charada2": "Também sou usada quando alguém finalmente arruma a gaveta que estava bagunçada há meses.", "charada3": "Sou o sentimento de orgulho exagerado que você tem quando finalmente consegue abrir o pote de palmito sem pedir socorro para ninguém."},
    {"topico": "História", "palavra": "constituição", "charada": "O documento que organiza as regras do país, tipo aquele regulamento do condomínio que ninguém lê até dar problema.", "charada2": "Também sou usada pra descrever o físico de quem treina há um mês e já se acha atleta.", "charada3": "Sou o famoso calhamaço de deveres e regrinhas esquecidas no fundo da gaveta que todo advogado na TV jura defender aos berros no tribunal de novela."},
    {"topico": "História", "palavra": "democracia", "charada": "Onde todo mundo vota, e depois metade reclama do resultado do mesmo jeito.", "charada2": "Também sou o método usado pra escolher o restaurante do grupo, mesmo sabendo que ninguém vai ficar satisfeito.", "charada3": "Sou o processo maravilhoso que permite ao síndico fazer o que bem entende depois que só cinco velhinhos participaram daquela reunião de condomínio vazia no andar do térreo fedorento."},
    {"topico": "História", "palavra": "ditador", "charada": "A pessoa que numa reunião de amigos decide o restaurante sem perguntar pra ninguém.", "charada2": "Também sou o apelido de quem sempre escolhe o filme sem perguntar a mais ninguém.", "charada3": "Sou o irmão mandão que escondeu o controle da TV, trancou todo mundo da própria família, e fez a lei absurda do videogame até a mãe chegar."},
    {"topico": "História", "palavra": "ditadura", "charada": "Quando uma pessoa só decide tudo, tipo aquele parente que manda no controle remoto.", "charada2": "Também sou o nome informal de qualquer chefia que decide escala de férias sem consultar ninguém.", "charada3": "Sou a regra incontestável do seu pai segurando a chave do carro, decretando, sem apelação e no grito."},
    {"topico": "História", "palavra": "eleição", "charada": "O dia em que todo mundo lembra que tem opinião política forte, só esse dia.", "charada2": "Também sou usada pra escolher quem lava a louça, sempre no grito, nunca por voto de verdade.", "charada3": "Sou a votação tensa no grupo do fim de semana que sempre termina empatada e sem ninguém ir a lugar nenhum."},
    {"topico": "História", "palavra": "era", "charada": "Um pedacinho enorme do tempo que os livros adoram nomear com uma palavra só.", "charada2": "Também sou usada pra descrever qualquer geração culpando a anterior por tudo.", "charada3": "Sou a palavra chique pra nomear aqueles três meses em que você jurou que ia ser fã de banda alternativa e usar boina."},
    {"topico": "História", "palavra": "escravidão", "charada": "A página mais pesada de qualquer livro didático, e a que menos tempo de aula recebe.", "charada2": "Sou o período mais sombrio e injusto da história do Brasil, quando pessoas eram tratadas como propriedade e não como gente.", "charada3": "Deixei marcas profundas na sociedade brasileira que ainda hoje explicam muita desigualdade que existe entre nós."},
    {"topico": "História", "palavra": "escravo", "charada": "A prova mais dolorosa de que o passado de um país nunca sai completamente das contas do presente.", "charada2": "Fui a pessoa injustamente forçada a trabalhar sem direito algum, tratada como propriedade de outra pessoa.", "charada3": "Sofri um dos maiores crimes da história humana, sendo comprado, vendido e explorado sem nenhum direito."},
    {"topico": "História", "palavra": "evento", "charada": "Aquilo que todo mundo marca no calendário e esquece de verdade duas semanas antes.", "charada2": "Também sou aquele que todo mundo confirma presença e cancela em cima da hora.", "charada3": "Sou o churrascão de sábado que promete cem pessoas, e no final só aparece o primo, o papagaio e duas latinhas quentes na geladeira."},
    {"topico": "História", "palavra": "golpe", "charada": "Quando alguém toma o poder sem pedir licença, ou aquela dor no dedão quando bate na quina da cama.", "charada2": "Também sou o nome de qualquer mensagem de banco falso pedindo seus dados no celular.", "charada3": "Sou aquela mensagem de número desconhecido chamando de 'mãe' e pedindo pix de mil reais numa terça-feira qualquer no horário de expediente."},
    {"topico": "História", "palavra": "governo", "charada": "Sempre culpado no bar, elogiado nunca.", "charada2": "Também sou culpado quando o sinal de trânsito demora mais que o normal pra abrir.", "charada3": "Sou a palavra solta que o seu tio usa para culpar todos os males do mundo, desde a gasolina cara até o pneu furado do carro."},
    {"topico": "História", "palavra": "guerra", "charada": "Começo por um motivo pequeno e termino virando capítulo de livro que ninguém quer estudar pra prova.", "charada2": "Também sou usada pra descrever qualquer discussão boba de jogo de videogame em família.", "charada3": "Sou a disputa armada com travesseiros que começa como uma brincadeira fofa e termina com a lâmpada do teto quebrada em mil pedaços."},
    {"topico": "História", "palavra": "imigrante", "charada": "Quem sai de um lugar em busca de uma vida melhor, e ainda assim é o primeiro a defender o time local de futebol.", "charada2": "Também sou aquele que chega numa cidade nova e diz que lá o pão era melhor.", "charada3": "Sou o mosquitinho chato que viaja de carona no para-brisa do seu carro só pra conhecer a outra ponta da rodovia intermunicipal."},
    {"topico": "História", "palavra": "império", "charada": "Tão grande que até hoje apareço em nome de restaurante querendo parecer chique.", "charada2": "Também sou usado no nome de qualquer academia que promete resultado em 30 dias.", "charada3": "Sou a fortaleza de caixas de papelão que o seu gato constrói no meio da sala, exigindo lealdade de todos os humanos da casa."},
    {"topico": "História", "palavra": "independência", "charada": "O dia em que um país decide que não precisa mais pedir permissão pra ninguém.", "charada2": "Também sou o dia em que o adolescente finalmente decide lavar a própria roupa sem pedir.", "charada3": "Sou a doce ilusão que você sente no momento em que paga seu primeiro boleto sem precisar de ajuda e já quer voltar pros pais."},
    {"topico": "História", "palavra": "monarquia", "charada": "Governo de família que passa o cargo de pai pra filho, tipo herança de bar de esquina.", "charada2": "Também sou usada pra descrever a família em que só uma pessoa decide o cardápio do Natal, sempre.", "charada3": "Sou o reinado absoluto do bebê caçula que dita a que horas todo mundo pode dormir e o que vai passar na TV."},
    {"topico": "História", "palavra": "povo", "charada": "A galera inteira, incluindo você reclamando do trânsito hoje de manhã.", "charada2": "Também sou usado pra dizer que 'todo mundo' concordou com algo que na real ninguém foi consultado.", "charada3": "Sou aquele grupo barulhento do fundão do ônibus que canta alto e jura que a viagem é um desfile de carnaval ambulante."},
    {"topico": "História", "palavra": "presidente", "charada": "A pessoa que todo mundo culpa no boteco, mesmo sem saber direito o que ela faz.", "charada2": "Também sou o apelido de quem sempre se mete a organizar o churrasco sem ninguém pedir.", "charada3": "Sou o título pomposo do aluno que lidera o trabalho do grupo, mas no fundo só quer o nome lá no alto da cartolina."},
    {"topico": "História", "palavra": "rei", "charada": "Nasci com o cargo garantido, sem nunca precisar mandar currículo.", "charada2": "Também sou o título que todo pai se dá quando conquista o controle remoto de volta.", "charada3": "Sou o jogador que coloca a coroa de papel no burguer-king e se acha o dono da praça de alimentação inteira na frente dos amigos."},
    {"topico": "História", "palavra": "república", "charada": "O tipo de governo que faz todo mundo brigar em grupo de família no dia da eleição.", "charada2": "Também sou o nome de qualquer casa de estudante com regra de limpeza que nunca é seguida.", "charada3": "Sou a casa de estudantes bagunceiros onde a pia tem mais copos sujos e vida inteligente do que a geladeira quebrada do corredor."},
    {"topico": "História", "palavra": "revolta", "charada": "Começo com um grupo cansado de aguentar calado, tipo o vizinho depois do terceiro churrasco barulhento seguido.", "charada2": "Também sou o sentimento de quem descobre que o cinema aumentou o preço da pipoca de novo.", "charada3": "Sou a fúria cega que domina a sala inteira quando o professor marca uma prova surpresa na véspera do feriado prolongado."},
    {"topico": "História", "palavra": "revolução", "charada": "Todo mundo promete fazer uma na segunda-feira, e a academia continua vazia.", "charada2": "Também sou o nome de qualquer produto de propaganda que promete mudar sua vida em uma semana.", "charada3": "Sou a promessa de mudança profunda que você faz de arrumar o guarda-roupa, mas acaba jogando tudo debaixo da cama mesmo."},
    {"topico": "História", "palavra": "século", "charada": "Cem anos, ou o tempo que parece ter passado desde a última vez que o wifi de casa funcionou direito.", "charada2": "Também sou usado pra exagerar o tempo que você esperou por uma resposta de mensagem.", "charada3": "Sou a medida de tempo perfeita pra definir o quanto o micro-ondas demora quando falta só um minuto pra comida esquentar."},
    {"topico": "História", "palavra": "tratado", "charada": "Um papel assinado prometendo paz, que nem aquele combinado de família que dura até o próximo Natal.", "charada2": "Também sou usado pra chamar qualquer acordo de família sobre quem paga a conta do restaurante.", "charada3": "Sou o acordo de paz não escrito de nunca mais tocar no assunto daquela viagem de família que deu tudo errado no meio do caminho."},
    {"topico": "Geografia", "palavra": "ambiente", "charada": "Tudo ao redor que a gente promete cuidar melhor, geralmente depois de assistir um documentário.", "charada2": "Também sou usado pra descrever qualquer escritório com clima estranho depois de uma reunião ruim.", "charada3": "Sou o cheiro de tensão que paira no ar quando alguém solta um comentário ácido sobre a sobremesa ruim da tia."},
    {"topico": "Geografia", "palavra": "bússola", "charada": "Aponto sempre pro norte, ao contrário de qualquer decisão que você tenta tomar sozinho.", "charada2": "Também sou o app de GPS que insiste em recalcular a rota mesmo você seguindo certinho.", "charada3": "Sou aquele mapinha mental perdido que te manda virar à esquerda quando o restaurante, claramente, estava na rua da direita."},
    {"topico": "Geografia", "palavra": "capital", "charada": "A cidade que todo mundo sabe o nome mesmo sem nunca ter visitado.", "charada2": "Também sou usada pra descrever aquele dinheiro guardado que some rápido assim que aparece uma promoção.", "charada3": "Sou aquela grande cidade cheia de oportunidades que todo mundo idolatra no cinema, mas que só te devolve trânsito lento e barulho."},
    {"topico": "Geografia", "palavra": "chuva", "charada": "Sempre decido cair bem na hora que você esqueceu o guarda-chuva em casa.", "charada2": "Também sou a desculpa perfeita pra cancelar qualquer plano de última hora.", "charada3": "Sou a desculpa perfeita que cai do céu pra você não ter que calçar tênis e ir suar na academia à noite."},
    {"topico": "Geografia", "palavra": "cidade", "charada": "Cheia de gente, e mesmo assim você sente falta de alguém pra conversar.", "charada2": "Também sou o assunto de quem se muda e não para de comparar tudo com o lugar antigo.", "charada3": "Sou a selva de concreto e semáforos que te faz cruzar com dezenas de estranhos sem saber o nome de ninguém na calçada."},
    {"topico": "Geografia", "palavra": "clima", "charada": "Sempre o primeiro assunto de conversa quando ninguém tem mais nada pra falar.", "charada2": "Também sou usado pra descrever o ambiente estranho depois de uma indireta mal recebida.", "charada3": "Sou o assunto de segurança que salva qualquer elevador silencioso do tédio antes de cada um sair no seu andar e desaparecer."},
    {"topico": "Geografia", "palavra": "continente", "charada": "Grande o suficiente pra caber um país inteiro que você nem sabia que existia.", "charada2": "Também sou usado, errado, pra exagerar distância de qualquer bairro mais afastado da cidade.", "charada3": "Sou a imensidão de terras que você acha pequena até precisar fazer as malas pra cruzar de avião no meio da classe econômica."},
    {"topico": "Geografia", "palavra": "deserto", "charada": "O lugar mais seco do mundo, e ainda assim mais organizado que sua geladeira no fim do mês.", "charada2": "Também sou usado pra descrever a geladeira dias antes de ir ao mercado.", "charada3": "Sou a paisagem árida que descreve exatamente o estado da sua carteira no meio do mês depois dos boletos caírem todos juntos."},
    {"topico": "Geografia", "palavra": "floresta", "charada": "Cheia de árvores que produzem o oxigênio que você respira sem nunca agradecer.", "charada2": "Também sou o nome de qualquer parque que a prefeitura promete reformar todo ano.", "charada3": "Sou o aglomerado de mato que a cidade inteira ama visitar em fotos, mas foge em pânico na primeira aparição de um bicho solto."},
    {"topico": "Geografia", "palavra": "fronteira", "charada": "A linha que dois países discutem, mas que o GPS do celular já decidiu sozinho.", "charada2": "Também sou usada pra marcar até onde vai a paciência de qualquer pai numa viagem longa de carro.", "charada3": "Sou a linha invisível desenhada com giz no banco de trás do carro pra evitar que os irmãos briguem durante a viagem longa."},
    {"topico": "Geografia", "palavra": "ilha", "charada": "Cercada de água por todo lado, que nem você depois de cancelar todos os compromissos do fim de semana.", "charada2": "Também sou o nome do fogão, sempre lotada de louça suja bem no meio da bancada.", "charada3": "Sou a mesa separada e minúscula no canto do refeitório que ninguém quer sentar, mas todo mundo acaba parando no dia que lota."},
    {"topico": "Geografia", "palavra": "latitude", "charada": "Uma linha imaginária que decide se seu verão vai ser de praia ou de casaco.", "charada2": "Também sou usada, errada, por qualquer um tentando parecer que entende de geografia numa conversa de bar.", "charada3": "Sou a régua esquisita que te ensinam a decorar e que você nunca mais vai usar na vida depois da prova bimestral."},
    {"topico": "Geografia", "palavra": "litoral", "charada": "A faixa de terra que todo mundo lota em janeiro e esquece o resto do ano.", "charada2": "Também sou o assunto principal de qualquer conversa de dezembro em diante.", "charada3": "Sou a promessa de paz e tranquilidade que só resulta em horas de congestionamento engolindo farofa e desviando de guarda-sóis."},
    {"topico": "Geografia", "palavra": "mapa", "charada": "Prometo o caminho mais rápido e te levo direto pro trânsito parado.", "charada2": "Também sou usado pra descrever qualquer plano detalhado que muda assim que a viagem realmente começa.", "charada3": "Sou o desenho colorido dobrado torto no porta-luvas que te joga num atalho de terra com a promessa de economizar cinco minutos."},
    {"topico": "Geografia", "palavra": "migração", "charada": "Sair de um lugar pra outro em busca de coisa melhor, que nem passarinho ou aquele primo que foi tentar a vida em outra cidade.", "charada2": "Também sou usada pra descrever quando todo mundo do grupo muda de rede social ao mesmo tempo.", "charada3": "Sou a troca anual de sofás que toda a família faz pra tentar achar o ponto perfeito da televisão antes do futebol começar."},
    {"topico": "Geografia", "palavra": "montanha", "charada": "O tamanho que qualquer problema pequeno vira na sua cabeça às 3 da manhã.", "charada2": "Também sou usada pra descrever a pilha de roupa suja que cresce até o fim de semana.", "charada3": "Sou o amontoado gigantesco de louça suja que nasce na pia logo depois de um jantar que deveria ser rápido e simples."},
    {"topico": "Geografia", "palavra": "oceano", "charada": "Grande demais pra atravessar nadando, mas pequeno o suficiente pra sumir com seu chinelo na primeira onda.", "charada2": "Também sou usado, exagerado, pra descrever qualquer distância entre você e a geladeira às 3 da manhã.", "charada3": "Sou o balde de lágrimas exageradas de quem descobre que a temporada da série favorita acabou no maior suspense de todos os tempos."},
    {"topico": "Geografia", "palavra": "país", "charada": "Tenho bandeira, hino e um grupo de WhatsApp inteiro discutindo política sobre mim.", "charada2": "Também sou usado pra dizer que 'lá fora é tudo melhor', mesmo sem nunca ter saído do bairro.", "charada3": "Sou a desculpa patriótica que as pessoas usam de quatro em quatro anos só pra pendurar bandeirinha verde e amarela na varanda de casa."},
    {"topico": "Geografia", "palavra": "planeta", "charada": "Sua casa inteira, girando sem parar, e ainda assim ninguém sente a velocidade.", "charada2": "Também sou usado pra dizer que alguém 'vive em outro mundo' quando ignora completamente a real.", "charada3": "Sou o pontinho perdido na galáxia que a professora de ciências jura que precisa de mais árvores, e você ainda joga lixo no chão."},
    {"topico": "Geografia", "palavra": "poluição", "charada": "O motivo do rio que era limpo na foto antiga da vovó não existir mais assim hoje.", "charada2": "Também sou usada pra descrever qualquer notificação inútil lotando a tela do celular.", "charada3": "Sou a cortina de fumaça preta do ônibus da frente que garante que sua camisa branca nova chegue cinza no destino final."},
    {"topico": "Geografia", "palavra": "população", "charada": "Todo mundo, incluindo aquele vizinho que você nunca viu a cara.", "charada2": "Também sou usada pra exagerar quantas pessoas realmente foram na festa de aniversário.", "charada3": "Sou a enorme massa de desconhecidos na rua do comércio empurrando uns aos outros por causa de uma suposta liquidação de calças."},
    {"topico": "Geografia", "palavra": "região", "charada": "Um pedaço do mapa que reclama que ninguém fala o sotaque dele direito na TV.", "charada2": "Também sou usada, num tom de deboche, pra apontar o sotaque de quem é de outro estado.", "charada3": "Sou a demarcação de bairro que a galera usa só pra se achar superior aos outros do outro lado da avenida principal."},
    {"topico": "Geografia", "palavra": "relevo", "charada": "A razão de a bicicleta ficar bem mais cansativa na volta pra casa.", "charada2": "Também sou usado pra descrever a cara de quem finalmente termina uma prova difícil.", "charada3": "Sou o buraco escondido na rua asfaltada que transforma o seu passeio de bicicleta numa verdadeira expedição cheia de surpresas dolorosas."},
    {"topico": "Geografia", "palavra": "rio", "charada": "Corro sem parar, ao contrário de você numa segunda de manhã.", "charada2": "Corto cidades e florestas serpenteando pelo relevo, e nunca paro de correr rumo ao mar.", "charada3": "Sou a água turva que corta a cidade e que você promete nunca nadar, mesmo no calor de 40 graus do verão."},
    {"topico": "Geografia", "palavra": "solo", "charada": "Onde tudo cresce, inclusive aquela grama que você promete cortar todo fim de semana.", "charada2": "Também sou usado pra descrever quem faz uma apresentação sozinho sem ninguém pra dividir o nervosismo.", "charada3": "Sou a superfície cimentada que os skatistas da praça amam desbravar com a paciência infinita de quem não tem medo de cair feio."},
    {"topico": "Geografia", "palavra": "terremoto", "charada": "Balanço o chão inteiro sem avisar, igual susto de notificação de banco de madrugada.", "charada2": "Também sou usado pra descrever o susto de qualquer notificação de cobrança inesperada.", "charada3": "Sou o balanço assustador da máquina de lavar roupas quando entra na fase de centrifugação e parece que vai sair andando pela lavanderia."},
    {"topico": "Geografia", "palavra": "território", "charada": "A linha imaginária que faz duas pessoas brigarem por um metro de terreno.", "charada2": "Também sou usado pra marcar até onde vai o lado da cama que cada um pode usar.", "charada3": "Sou a gaveta do guarda-roupa que o adolescente demarca com fita crepe, proibindo qualquer invasão pacífica por parte de pais curiosos."},
    {"topico": "Geografia", "palavra": "vale", "charada": "O ponto mais baixo entre duas montanhas, e também o motivo de a bicicleta parecer fácil só na descida.", "charada2": "Sou a área baixa cercada de montanhas, geralmente fértil, onde muitas cidades antigas resolveram se instalar.", "charada3": "Sou o espaço fundo e frio entre as almofadas do sofá onde as moedinhas de troco e as chaves de casa vão parar pra sempre."},
    {"topico": "Geografia", "palavra": "vento", "charada": "Viro sua sombrinha do avesso sem pedir licença.", "charada2": "Também sou usado pra descrever quem muda de ideia rápido demais numa conversa.", "charada3": "Sou o sopro invisível que joga a areia fina da praia exatamente dentro do olho daquela pessoa que acabou de abrir os óculos de sol."},
    {"topico": "Geografia", "palavra": "vulcão", "charada": "Fico quieto por anos e depois exploso do nada, que nem aquele parente numa discussão de família.", "charada2": "Também sou usado pra descrever qualquer pessoa calma até alguém mexer no prato dela.", "charada3": "Sou a panela de leite no fogo brando, que parece inofensiva e transborda numa erupção branca assim que você vira as costas."},
    {"topico": "Português e Literatura", "palavra": "adjetivo", "charada": "Dou qualidade a um substantivo, tipo aquele elogio que sua mãe manda com segunda intenção.", "charada2": "Também sou usado em excesso em qualquer legenda de foto de viagem.", "charada3": "Sou a palavra exagerada que você usa pra convencer seu amigo a assistir aquele filme medíocre que te fez perder duas horas da vida."},
    {"topico": "Português e Literatura", "palavra": "antônimo", "charada": "O oposto exato de uma palavra, igual você e aquele parente que discorda de tudo só por discordar.", "charada2": "Também sou usado pra descrever o humor de alguém antes e depois do café da manhã.", "charada3": "Sou a direção totalmente contrária que você toma sem querer só pra fingir que tem um senso de direção invejável no meio da rua."},
    {"topico": "Português e Literatura", "palavra": "autor", "charada": "A pessoa que decide o final da história antes de você, e nunca avisa com antecedência.", "charada2": "Também sou o crédito que ninguém lembra de dar quando repassa uma frase boa pra frente.", "charada3": "Sou o nome de letras miúdas na capa do livro que você nunca pronuncia certo, mas faz questão de citar pra parecer intelectual."},
    {"topico": "Português e Literatura", "palavra": "clímax", "charada": "O momento mais tenso da história, bem antes do final que todo mundo já desconfiava.", "charada2": "Também sou usado pra descrever o momento exato em que a churrasqueira finalmente pega fogo direito.", "charada3": "Sou aquele pico de fofoca onde a tia finalmente conta quem foi o real culpado pelo bolo estragado antes da briga voltar a esfriar."},
    {"topico": "Português e Literatura", "palavra": "conto", "charada": "Termino rápido demais, tipo aquele fim de semana bom.", "charada2": "Também sou usado pra chamar qualquer história exagerada que cresce cada vez que é contada de novo.", "charada3": "Sou a mentirinha rápida que você inventa sobre estar dobrando a esquina quando ainda está deitado na cama escolhendo a roupa."},
    {"topico": "Português e Literatura", "palavra": "crônica", "charada": "Conto um dia comum de um jeito que faz até fila de banco parecer interessante.", "charada2": "Também sou usada pra descrever a dor que aparece só quando o tempo esfria.", "charada3": "Sou a textão diário do seu vizinho nas redes sociais, exagerando as coisas mais chatas do condomínio como se fosse um grande evento."},
    {"topico": "Português e Literatura", "palavra": "enredo", "charada": "O motivo de você perder a hora de dormir assistindo 'só mais um episódio'.", "charada2": "Também sou usado pra descrever a confusão de qualquer fofoca contada por três pessoas diferentes.", "charada3": "Sou a teia confusa da sua explicação pra justificar por que o dever de casa foi devorado, de novo, pelo cachorro invisível da sua avó."},
    {"topico": "Português e Literatura", "palavra": "escrita", "charada": "A prova de que você pensou antes de falar, coisa rara nas redes sociais.", "charada2": "Também sou a letra que ninguém mais consegue ler direito desde que o teclado apareceu.", "charada3": "Sou o rabisco ilegível que sai da sua mão depois de três meses só apertando teclas no computador e no celular o dia todo."},
    {"topico": "Português e Literatura", "palavra": "frase", "charada": "Quando bem colocada, viro status de rede social por meses.", "charada2": "Também sou usada, incompleta, em qualquer discussão de WhatsApp que termina em mal-entendido.", "charada3": "Sou aquele amontoado de palavras sem sentido que você sussurra quando acorda assustado no meio de um pesadelo e tenta voltar a dormir."},
    {"topico": "Português e Literatura", "palavra": "gramática", "charada": "As regras que todo mundo segue errado no WhatsApp e certo só na prova.", "charada2": "Também sou usada pra corrigir os outros bem na hora que ninguém pediu opinião.", "charada3": "Sou o livro de regras odiado que adora ditar como você tem que usar o acento que nunca muda o som da sua voz na rua."},
    {"topico": "Português e Literatura", "palavra": "leitura", "charada": "Prometida toda virada de ano, esquecida já em fevereiro.", "charada2": "Também sou usada pra chamar qualquer interpretação errada de mensagem de texto.", "charada3": "Sou a passada de olho rápida que você dá no manual de instruções antes de amassar o papel e tentar montar tudo na base do improviso."},
    {"topico": "Português e Literatura", "palavra": "livro", "charada": "Prometido pra ser lido em uma semana, viro enfeite de estante por dois anos.", "charada2": "Também sou usado como peso de porta desde que ganhei capa dura de presente.", "charada3": "Sou o peso quadrado de papel que segura perfeitamente a porta do seu quarto pra ventar e que você sempre promete ler até o fim."},
    {"topico": "Português e Literatura", "palavra": "metáfora", "charada": "Comparo duas coisas sem usar \"como\", tipo chamar o trânsito de guerra sem ninguém realmente atirar em ninguém.", "charada2": "Também sou usada quando alguém não quer falar diretamente que o problema é com você.", "charada3": "Sou o balde de água fria figurativo que alguém te joga quando o seu plano genial pra ficar rico jogando na loteria dá errado."},
    {"topico": "Português e Literatura", "palavra": "narrador", "charada": "Sei de tudo, menos por que ninguém nunca confia totalmente em mim.", "charada2": "Também sou o apelido de quem sempre conta a história dos outros com mais detalhes que eles mesmos.", "charada3": "Sou a voz cansada da sua mãe te lembrando de todos os seus deslizes sempre que você ousa pedir pra dormir na casa de um amigo."},
    {"topico": "Português e Literatura", "palavra": "palavra", "charada": "Uma só já é capaz de estragar o clima de qualquer grupo de família.", "charada2": "Também sou aquela que falta na hora exata de terminar uma discussão com estilo.", "charada3": "Sou a única coisa que você solta na hora errada numa sala cheia de estranhos, garantindo que o eco seja eterno no seu pensamento."},
    {"topico": "Português e Literatura", "palavra": "personagem", "charada": "Vivo dramas emocionantes sem nunca ter que pagar boleto de verdade.", "charada2": "Também sou usado pra chamar alguém que sempre aparece com uma história diferente em cada festa.", "charada3": "Sou aquele papel heroico que você jura que interpretou na confusão da escola, mas que no fundo você só estava escondido atrás do pilar."},
    {"topico": "Português e Literatura", "palavra": "poema", "charada": "Digo em quatro linhas o que uma pessoa levaria uma noite inteira explicando por mensagem de voz.", "charada2": "Também sou usado, sem querer, quando alguém tenta se declarar e trava no meio da frase.", "charada3": "Sou o bloquinho de rimas românticas, espremido num bilhetinho amassado, que a garota amou e você nunca mais vai ter coragem de assinar."},
    {"topico": "Português e Literatura", "palavra": "poesia", "charada": "Consigo fazer até uma lista de compras parecer profunda se você quebrar as linhas do jeito certo.", "charada2": "Também sou usada pra descrever qualquer legenda de foto do pôr do sol na praia.", "charada3": "Sou a desculpa artística pras fotos borradas e sem foco do pôr do sol que entopem o seu feed de final de tarde domingo."},
    {"topico": "Português e Literatura", "palavra": "pronome", "charada": "Existo pra você não repetir o nome da pessoa cem vezes na mesma fofoca.", "charada2": "Também sou trocado errado bem na hora que alguém tenta parecer educado demais.", "charada3": "Sou a única coisinha solta na frase que você usa errado o tempo inteiro e faz o professor fechar os olhos de desespero."},
    {"topico": "Português e Literatura", "palavra": "protagonista", "charada": "Quem vive a história inteira sem nunca precisar dividir os créditos com ninguém.", "charada2": "Também sou usado pra descrever quem sempre puxa a história pro próprio lado numa roda de conversa.", "charada3": "Sou aquele amigo dramático que sempre faz questão de puxar os holofotes pra própria tragédia em todo grupo de conversa que entra."},
    {"topico": "Português e Literatura", "palavra": "rima", "charada": "Faço duas palavras diferentes soarem como se fossem feitas uma pra outra.", "charada2": "Também sou usada em qualquer propaganda de rádio que gruda na cabeça sem você querer.", "charada3": "Sou o truque barato que qualquer rapper de bairro usa no final das frases pra fingir que o verso teve algum sentido poético."},
    {"topico": "Português e Literatura", "palavra": "romance", "charada": "Sempre mais longo que o namoro que me inspirou.", "charada2": "Também sou usado, exagerado, pra descrever qualquer paquera que durou só um final de semana.", "charada3": "Sou o relacionamento clichê dos filmes da tarde em que todo mundo tromba no corredor da escola e derruba o caderno cheio de folhas soltas."},
    {"topico": "Português e Literatura", "palavra": "sílaba", "charada": "Um pedacinho da palavra, e o motivo de você travar bonito tentando ler um nome esquisito em voz alta.", "charada2": "Também sou usada pra separar o nome de bebê que os pais insistem em inventar.", "charada3": "Sou os pedacinhos que você usa cantando a palavra aos tropeços quando não tem certeza de como ela se escreve no final da redação."},
    {"topico": "Português e Literatura", "palavra": "sinônimo", "charada": "Uma palavra que significa quase a mesma coisa que outra, tipo dizer \"econômico\" em vez de \"pão-duro\".", "charada2": "Também sou usado quando alguém tenta suavizar uma crítica sem perder a educação.", "charada3": "Sou a palavra bonita que você joga no texto só pra o corretor ortográfico não encher de risco vermelho a sua obra-prima acadêmica."},
    {"topico": "Português e Literatura", "palavra": "substantivo", "charada": "Dou nome pra tudo, inclusive pra aquela coisa que você não lembra o nome e chama de 'treco'.", "charada2": "Também sou usado, sem querer, quando alguém esquece o nome de uma coisa e chama de 'aquilo lá'.", "charada3": "Sou a coisa, a pessoa ou aquele objeto inútil na estante que você nunca sabe o nome, então chama de treco pra todo mundo."},
    {"topico": "Português e Literatura", "palavra": "sujeito", "charada": "Quem pratica a ação na frase, e também aquele suspeito que sempre aparece em toda história de família mal contada.", "charada2": "Também sou usado, num tom de fofoca, pra apontar alguém sem falar o nome.", "charada3": "Sou o culpado da frase, aquele que carrega o peso da ação de ter comido escondido o último brigadeiro da travessa do final de semana."},
    {"topico": "Português e Literatura", "palavra": "texto", "charada": "Chego grande no grupo do trabalho e ninguém me lê inteiro antes de responder 'combinado'.", "charada2": "Também sou aquele que chega grande demais no grupo do trabalho numa sexta à noite.", "charada3": "Sou o bloco interminável de palavras sem parágrafo que te dá dor de cabeça no momento em que abre o chat do aplicativo de conversas."},
    {"topico": "Português e Literatura", "palavra": "verbo", "charada": "A palavra que faz a ação acontecer, mesmo quando você só promete e não faz nada.", "charada2": "Também sou o primeiro a sumir quando alguém tenta se explicar depois de errar.", "charada3": "Sou a ação rápida que some debaixo da mesa quando todo mundo precisa escolher quem vai apresentar a primeira parte da cartolina lá na frente."},
    {"topico": "Português e Literatura", "palavra": "verso", "charada": "Uma linha só, mas decido se o poema inteiro vai rimar ou não.", "charada2": "Também sou usado, decorado errado, em qualquer letra de música cantada no chuveiro.", "charada3": "Sou a linha solitária do refrão de uma música de festa que você grita a plenos pulmões achando que domina o palco inteiro."},
    {"topico": "Português e Literatura", "palavra": "vírgula", "charada": "Uma pausa pequena que muda o sentido da frase inteira, e também de qualquer herança mal escrita.", "charada2": "Também sou aquela que falta bem na hora de ler um contrato até o fim.", "charada3": "Sou a respiração dramática que você insere num texto pra tentar soar inteligente e só deixa quem está lendo sem ar no fim das contas."},
    {"topico": "Redação", "palavra": "argumento", "charada": "Aquilo que todo mundo jura ter na discussão de grupo de família, mas poucos realmente trazem.", "charada2": "Também sou usado quando alguém perde a discussão e muda de assunto na hora.", "charada3": "Sou a desculpa fajuta que todo aluno tem pronta pra explicar por que não deu tempo de finalizar a tarefa mais fácil do mundo."},
    {"topico": "Redação", "palavra": "citação", "charada": "Uma frase de outra pessoa que você usa pra parecer mais culto do que realmente é.", "charada2": "Também sou usada errada, atribuída à pessoa errada, em quase toda rede social.", "charada3": "Sou a frase chique que o estudante rouba da internet na última hora pra tentar impressionar a banca do vestibular na prova do Enem."},
    {"topico": "Redação", "palavra": "clareza", "charada": "A coisa que falta na explicação de qualquer manual de eletrônico.", "charada2": "Também sou o que falta em qualquer manual de montar móvel.", "charada3": "Sou o que falta em qualquer manual traduzido mal na internet e na sua explicação de matemática no quadro negro."},
    {"topico": "Redação", "palavra": "coerência", "charada": "A coisa que falta na desculpa de quem chega atrasado dizendo que 'o trânsito estava do nada'.", "charada2": "Também sou o que falta na desculpa de quem chega atrasado dizendo motivo diferente toda semana.", "charada3": "Sou o sentido exato que foge pela janela da sala de aula quando você tenta justificar sua ausência sem ter atestado médico nenhum."},
    {"topico": "Redação", "palavra": "coesão", "charada": "O motivo de um texto não parecer um monte de frases jogadas ao acaso, tipo esta explicação aqui.", "charada2": "Também sou o que mantém o grupo de amigos junto, mesmo sem ninguém saber explicar por quê.", "charada3": "Sou o milagre invisível que evita que a sua redação pareça um jogo de palavras jogadas num ventilador ligado no nível máximo."},
    {"topico": "Redação", "palavra": "conclusão", "charada": "Sempre escrita correndo, faltando dois minutos pra acabar o tempo de prova.", "charada2": "Também sou aquela que todo mundo já sabia antes mesmo de terminar de ler o resto.", "charada3": "Sou o fechamento de ouro do seu parágrafo que, na verdade, não resolveu problema nenhum e só repetiu o título de novo e de novo."},
    {"topico": "Redação", "palavra": "conectivo", "charada": "A palavrinha que costura uma ideia na outra, tipo aquele parente que sempre lembra de puxar assunto na mesa.", "charada2": "Também sou a palavra que salva qualquer história mal contada de virar bagunça total.", "charada3": "Sou a famosa cola invisível que segura o \"porém\" da sua reclamação e junta todas as suas lamentações num discurso chato só."},
    {"topico": "Redação", "palavra": "crítica", "charada": "O comentário que todo mundo faz depois que o problema já não tem mais solução.", "charada2": "Também sou aquela que ninguém pede, mas todo mundo dá de graça mesmo assim.", "charada3": "Sou a cutucada ácida disfarçada de conselho que chega sempre no grupo no momento em que você mais estava orgulhoso do próprio penteado."},
    {"topico": "Redação", "palavra": "dissertação", "charada": "O tipo de texto em que você precisa parecer seguro de algo que decidiu pensar cinco minutos atrás.", "charada2": "Também sou usada pra chamar qualquer explicação longa demais pra uma pergunta simples de sim ou não.", "charada3": "Sou aquele documento gigante que você enrola por meses na faculdade pra fingir que está pesquisando a fundo um assunto de três páginas."},
    {"topico": "Redação", "palavra": "intervenção", "charada": "A proposta de solução que todo mundo escreve no final sem nunca aplicar de verdade na própria vida.", "charada2": "Também sou aquela conversa que a família marca quando alguém exagera nos planos impossíveis.", "charada3": "Sou aquela proposta de salvar o mundo em três linhas de texto na prova do Enem sem que você precise levantar da sua própria cadeira escolar."},
    {"topico": "Redação", "palavra": "introdução", "charada": "A parte que ninguém lê com atenção, mas que decide se alguém vai continuar lendo o resto.", "charada2": "Também sou a parte que todo mundo pula direto pra ver o resultado final.", "charada3": "Sou a famosa frase engessada e bonita no início da festa que logo perde a pose quando a comida demora pra começar a ser servida."},
    {"topico": "Redação", "palavra": "objetividade", "charada": "Ir direto ao ponto, coisa que ninguém consegue fazer numa desculpa por chegar atrasado.", "charada2": "Também sou o que falta em qualquer resposta de político em entrevista.", "charada3": "Sou a reta invisível e impossível de ser traçada na história cheia de rodeios e drama que a sua vizinha de porta vem contar."},
    {"topico": "Redação", "palavra": "opinião", "charada": "Todo mundo tem uma, principalmente sobre assunto que não entende bem.", "charada2": "Também sou dada sem ninguém pedir, principalmente sobre futebol e política.", "charada3": "Sou a pitada a mais de tempero que ninguém pediu, mas que o intrometido faz questão de derramar no meio da roda gigante de fofoca."},
    {"topico": "Redação", "palavra": "parágrafo", "charada": "Recuo, ideia, ponto final — e ainda assim tem gente que escreve um texto inteiro sem nenhum de mim.", "charada2": "Também sou aquele que devia ter três linhas e vira um texto inteiro sozinho.", "charada3": "Sou o fôlego visual do leitor que você nega ao mandar uma mensagem gigantesca reclamando da professora, sem usar sequer um recuo pro texto respirar."},
    {"topico": "Redação", "palavra": "proposta", "charada": "Aquilo que ninguém pediu pra discutir, mas que virou obrigatório numa folha de prova.", "charada2": "Também sou aquela que todo mundo aceita animado e ninguém cumpre depois.", "charada3": "Sou aquele plano mirabolante que todo grupo aprova sorrindo na reunião, pra no final todo mundo jogar o planejamento na primeira gaveta velha que achar."},
    {"topico": "Redação", "palavra": "reflexão", "charada": "Aquele momento de pensar profundamente sobre a vida, geralmente às 2 da manhã sem motivo aparente.", "charada2": "Também sou aquela que aparece só depois que a decisão errada já foi tomada.", "charada3": "Sou a dor na consciência que bate bem devagarinho logo depois de devorar a terceira fatia de bolo que a mãe mandou você só experimentar."},
    {"topico": "Redação", "palavra": "repertório", "charada": "Aquelas referências que você guarda pra usar na hora certa, tipo aquela citação que ninguém sabe se é verdadeira mesmo.", "charada2": "Também sou usado pra chamar qualquer plano de conversa preparado antes de encontrar alguém importante.", "charada3": "Sou o saco de referências aleatórias que você carrega pra vomitar séries, livros e filmes num texto tentando provar que entende de geopolítica mundial."},
    {"topico": "Redação", "palavra": "tema", "charada": "Escolhido por alguém que nunca vai ler o que você escreveu sobre mim com tanto carinho quanto você escreveu.", "charada2": "Também sou aquele que ninguém escolhe, mas que decide o rumo da festa de aniversário infantil.", "charada3": "Sou a regra principal da festa à fantasia que sempre tem um convidado folgado jurando que o próprio pijama entra no conceito escolhido praquela noite."},
    {"topico": "Redação", "palavra": "tese", "charada": "A ideia que você defende com unhas e dentes, mesmo sem certeza nenhuma.", "charada2": "Também sou aquela ideia repetida tantas vezes que todo mundo já concorda só de cansaço.", "charada3": "Sou a ideia fixa que o aluno defende até o fim, suando frio, mesmo depois que o professor já provou no quadro que é fisicamente impossível acontecer."},
    {"topico": "Filosofia", "palavra": "conhecimento", "charada": "A única coisa que ninguém consegue tirar de você, exceto na hora da prova que você não estudou.", "charada2": "Também sou aquele que todo mundo finge ter numa discussão de bar sobre política.", "charada3": "Sou o tesouro invisível que todo pai cobra do boletim do filho, ignorando completamente que ele não presta atenção em metade da aula dada."},
    {"topico": "Filosofia", "palavra": "consciência", "charada": "Aquela voz que fala 'você devia estar estudando' bem na hora do episódio mais interessante da série.", "charada2": "Também sou aquela que pesa mais depois da segunda fatia de bolo.", "charada3": "Sou a sirene que não para de apitar dentro de você avisando que aquele décimo episódio de madrugada vai custar caríssimo na hora do seu despertador."},
    {"topico": "Filosofia", "palavra": "crença", "charada": "Aquilo que você aceita sem precisar de prova nenhuma, tipo achar que hoje vai ser o dia que a dieta começa de verdade.", "charada2": "Também sou aquela que todo mundo tem sobre qual time vai ser campeão nesse ano.", "charada3": "Sou a força teimosa que te faz segurar a superstição do pé direito antes de começar a prova que você, sinceramente, nunca estudou direito."},
    {"topico": "Filosofia", "palavra": "dilema", "charada": "Uma escolha difícil entre duas opções ruins, tipo decidir entre acordar cedo ou chegar atrasado de novo.", "charada2": "Também sou a escolha entre lavar a louça agora ou deixar pra 'daqui a pouco' que nunca chega.", "charada3": "Sou o momento torturante no balcão da sorveteria, trancando a fila, entre repetir o pistache do costume ou apostar no morango com limão duvidoso."},
    {"topico": "Filosofia", "palavra": "dúvida", "charada": "O motivo de você reler a mesma mensagem cinco vezes antes de enviar.", "charada2": "Também sou aquela que aparece bem na hora de apertar o botão de enviar o áudio.", "charada3": "Sou aquela pulguinha atrás da orelha na prova de múltipla escolha que transforma a certeza da alternativa 'A' no medo arrepiante de marcar a 'C' sem querer."},
    {"topico": "Filosofia", "palavra": "essência", "charada": "O que uma coisa realmente é por trás de toda aparência, tipo aquele perfume que promete durar o dia todo e não dura.", "charada2": "Também sou usada pra vender perfume que promete um cheiro que nunca é igual ao da loja.", "charada3": "Sou o miolo de chocolate incrível escondido debaixo daquela embalagem super barata do supermercado que todo mundo esnoba pela estética da prateleira baixa."},
    {"topico": "Filosofia", "palavra": "ética", "charada": "O que impede você de comer o último pedaço de bolo sem perguntar antes.", "charada2": "Também sou aquela que some na hora de furar fila achando que ninguém está vendo.", "charada3": "Sou a voz contida que não te deixa rir do tropeço feio do professor no meio da sala, mesmo sendo a coisa mais cômica da escola toda."},
    {"topico": "Filosofia", "palavra": "existência", "charada": "A pergunta que ataca você bem quando a luz apaga e você já está deitado tentando dormir.", "charada2": "Também sou questionada assim que a internet cai no meio de algo importante.", "charada3": "Sou o mistério pesado que te tira o sono às quatro da manhã, enquanto você olha pro ventilador girando e pensa no que é feito o vento do universo."},
    {"topico": "Filosofia", "palavra": "ideia", "charada": "Apareço do nada, geralmente às 2 da manhã, e sumo assim que você acorda pra me anotar.", "charada2": "Também sou aquela que parecia genial à noite e péssima na luz do dia seguinte.", "charada3": "Sou a lâmpada mágica e imaginária que brilha radiante na cabeça na hora do banho quente, e derrete na mesma hora que você se enxuga."},
    {"topico": "Filosofia", "palavra": "ilusão", "charada": "Uma percepção que engana os sentidos, tipo achar que vai estudar cedo só porque comprou uma agenda nova.", "charada2": "Também sou aquela de achar que só essa vez o desconto vale realmente a pena.", "charada3": "Sou o troco certinho de moedas prometido pelo padeiro e que nunca, absolutamente nunca, aparece na sua mão inteiramente como deveria ser no mercadinho do seu bairro."},
    {"topico": "Filosofia", "palavra": "liberdade", "charada": "A sensação de sexta-feira às 18h em ponto.", "charada2": "Também sou a sensação de tirar o sapato apertado assim que chega em casa.", "charada3": "Sou aquele suspiro farto e aliviado do momento em que o alarme da escola toca e decreta oficialmente o início das preciosas e esperadas férias da garotada."},
    {"topico": "Filosofia", "palavra": "lógica", "charada": "A sequência de raciocínio que todo mundo jura seguir, principalmente numa discussão que já perdeu o sentido.", "charada2": "Também sou aquela que ninguém segue quando o assunto é comida às 2 da manhã.", "charada3": "Sou a trilha óbvia e iluminada que você ignora completamente pra tentar abrir a embalagem plástica do pão com a boca em vez de usar uma simples tesoura."},
    {"topico": "Filosofia", "palavra": "moral", "charada": "A régua invisível que todo mundo usa pra julgar o comportamento dos outros, nunca o próprio.", "charada2": "Também sou aquela frase no fim da fábula que ninguém lembra até o professor explicar de novo.", "charada3": "Sou a lousa invisível de juiz que você carrega na testa pra julgar cada erro de percurso que os seus amigos cometem em pleno final de semana."},
    {"topico": "Filosofia", "palavra": "pensamento", "charada": "Aquilo que passa pela sua cabeça um segundo antes de você falar besteira mesmo assim.", "charada2": "Também sou aquele que some completamente na hora exata da prova.", "charada3": "Sou o balãozinho invisível em cima da sua cabeça que, graças ao bom senso divino, ninguém é capaz de ler as besteiras quando você fica de cara feia."},
    {"topico": "Filosofia", "palavra": "questionamento", "charada": "Aquela pergunta incômoda que ninguém faz até o final da reunião, quando já é tarde demais pra responder direito.", "charada2": "Também sou aquele que o grupo de família faz só depois que já é tarde demais pra mudar de ideia.", "charada3": "Sou a clássica mão levantada lá do fundo no segundo em que o professor diz a famosa frase mágica 'podem fechar os cadernos e ir para o intervalo'."},
    {"topico": "Filosofia", "palavra": "razão", "charada": "A parte de você que sabe que devia ter ido dormir mais cedo ontem.", "charada2": "Também sou aquela que ninguém quer dar em discussão de trânsito.", "charada3": "Sou a âncora pesada que você insiste em soltar, acabando com a farra, quando diz pros amigos que pular daquele telhado baixo de jeito nenhum é diversão."},
    {"topico": "Filosofia", "palavra": "realidade", "charada": "Aquilo que continua existindo mesmo depois que você fecha os olhos e finge que não viu.", "charada2": "Também sou aquela que bate assim que o alarme toca na segunda-feira.", "charada3": "Sou a pancada dura e sem alarde do extrato bancário zerado bem no meio do dia que você jura que seria perfeito pro consumo impulsivo da promoção na vitrine."},
    {"topico": "Filosofia", "palavra": "sentido", "charada": "O que você tenta encontrar na vida e também na última temporada de uma série que decidiu não explicar nada.", "charada2": "Também sou aquele que ninguém encontra tentando montar móvel sem manual.", "charada3": "Sou o destino claro do caminho longo que você perde completamente e fica perambulando quando começa a rolar o feed vazio do aplicativo na madrugada vazia e sem sono."},
    {"topico": "Filosofia", "palavra": "verdade", "charada": "Sempre dói mais que a mentira, mesmo sendo mais curta de contar.", "charada2": "Também sou aquela que escapa quando alguém pergunta 'quem comeu o último pedaço'.", "charada3": "Sou o raio certeiro que estraga a festa quando a criança mimada conta na frente de todo mundo exatamente por que a sua avó não gostou do prato principal."},
    {"topico": "Sociologia", "palavra": "cidadania", "charada": "Os direitos e deveres que todo mundo lembra dos direitos e esquece os deveres.", "charada2": "Também sou lembrada só quando alguém precisa tirar um documento com urgência.", "charada3": "Sou o pacote completo de etiqueta urbana invisível que o seu vizinho rasga ao meio quando decide furar a fila enorme no ponto de ônibus da cidade grande."},
    {"topico": "Sociologia", "palavra": "cidadão", "charada": "A pessoa que reclama do imposto e também reclama quando falta asfalto na rua.", "charada2": "Também sou usado, formal demais, quando alguém quer soar sério numa reclamação simples.", "charada3": "Sou o portador exigente do direito de reclamar na prefeitura por qualquer buraco."},
    {"topico": "Sociologia", "palavra": "classe", "charada": "Divido as pessoas por quanto dinheiro elas têm, mesmo quando ninguém quer admitir que reparou nisso.", "charada2": "Também sou usada pra chamar qualquer festa chique que serve salgadinho igual às outras.", "charada3": "Sou o título que separa o corredor vip da festa na roça, mesmo com a coxinha gelada sendo exatamente a mesma que servem pro povo do salão geral na tenda."},
    {"topico": "Sociologia", "palavra": "comunidade", "charada": "O grupo de vizinhos que só se fala de verdade quando falta água ou luz.", "charada2": "Também sou usada pra descrever qualquer grupo de fãs discutindo detalhe que só eles entendem.", "charada3": "Sou o ajuntamento caótico da rua debaixo."},
    {"topico": "Sociologia", "palavra": "costume", "charada": "O jeito de fazer as coisas que vira automático, tipo pôr sal antes mesmo de provar a comida.", "charada2": "Também sou aquele jeito de fazer as coisas que ninguém sabe mais explicar como começou.", "charada3": "Sou a mania velha de checar trinta vezes se o celular está no mesmo bolso de sempre, mesmo sabendo que nunca esteve lá naquele maldito lugar escuro e apertado."},
    {"topico": "Sociologia", "palavra": "cultura", "charada": "O motivo de cada família ter uma regra completamente diferente pra passar o Natal.", "charada2": "Também sou usada pra justificar qualquer comida estranha que a família insiste em servir no Natal.", "charada3": "Sou o combo de superstição da família que envolve não beber manga com leite, nem misturar chinelo virado pro chão num feriado sagrado, pelo amor da nossa santa tradição avózinha."},
    {"topico": "Sociologia", "palavra": "desigualdade", "charada": "A razão de duas pessoas nascerem no mesmo país e terem chances completamente diferentes.", "charada2": "Também sou usada pra descrever quem sempre pega o pedaço menor do bolo sem perceber.", "charada3": "Sou o triste contraste diário entre a mesa entupida de churrasco na sexta-feira do chefe de departamento e o prato com salsicha do funcionário cansado na cantina do escritório sujo."},
    {"topico": "Sociologia", "palavra": "direito", "charada": "Aquilo que você invoca bem alto assim que alguém tenta te prejudicar.", "charada2": "Também sou invocado bem alto na fila do banco assim que alguém tenta furar.", "charada3": "Sou a desculpa barata de quem vira o som do carro na máxima na calçada e jura que a rua é só dele."},
    {"topico": "Sociologia", "palavra": "diversidade", "charada": "Ter gente diferente reunida no mesmo lugar, tipo o grupo de família que ninguém entende como ainda funciona.", "charada2": "Também sou usada pra descrever qualquer grupo de amigos que discorda até de qual filme assistir.", "charada3": "Sou o bando eclético da rodinha da escola: a nerd de animes, o skatista bagunceiro."},
    {"topico": "Sociologia", "palavra": "estereótipo", "charada": "A ideia pronta que todo mundo tem sobre um grupo antes mesmo de conhecer alguém dele de verdade.", "charada2": "Também sou usado, sem pensar, pra julgar time de futebol adversário antes do jogo começar.", "charada3": "Sou a fantasia preguiçosa da comédia de TV que enfia todo fã de rock num porão sem banho."},
    {"topico": "Sociologia", "palavra": "família", "charada": "O grupo que você não escolhe, mas que aparece inteiro assim que alguém posta uma foto de herança.", "charada2": "Também sou usada pra descrever qualquer grupo de zap que ninguém tem coragem de silenciar de vez.", "charada3": "Sou o agrupamento barulhento de tios e sobrinhos que discute herança, futebol, política e maionese no mesmo grito."},
    {"topico": "Sociologia", "palavra": "grupo", "charada": "Aquele do WhatsApp que ninguém tem coragem de sair, só de silenciar.", "charada2": "Também sou usado pra chamar qualquer trabalho escolar em que uma pessoa faz tudo sozinha.", "charada3": "Sou o temido núcleo do trabalho de escola, em que um garoto estuda e arruma os slides, e os outros três torcem."},
    {"topico": "Sociologia", "palavra": "identidade", "charada": "A resposta que ninguém consegue dar rápido quando alguém pergunta 'me conta sobre você'.", "charada2": "Também sou aquela que ninguém lembra de levar exatamente no dia que mais precisa dela.", "charada3": "Sou o emaranhado complexo e estranho que você arrasta até a foto oficial da sua primeira CNH."},
    {"topico": "Sociologia", "palavra": "instituição", "charada": "Uma organização com regras próprias, tipo a família que tem lei não escrita sobre quem senta onde na mesa de Natal.", "charada2": "Também sou usada pra chamar qualquer empresa que muda de regra toda semana sem avisar ninguém.", "charada3": "Sou aquele prédio sério com regras mofadas onde burocratas de cara amarrada passam o dia te pedindo, sem a menor pressa do universo todo."},
    {"topico": "Sociologia", "palavra": "norma", "charada": "A regra que todo mundo segue sem nunca ter assinado nada, tipo separar o lixo só quando alguém está olhando.", "charada2": "Também sou aquela que todo mundo ignora até o fiscal aparecer.", "charada3": "Sou a cordinha vermelha esticada da segurança de museu que todos ultrapassam quando acham que o guarda da sala vizinha deu aquela espiada caprichosa no celular pra verificar alguma coisa aleatória."},
    {"topico": "Sociologia", "palavra": "poder", "charada": "Quem segura o controle remoto de verdade na casa.", "charada2": "Também sou disputado sempre que sobra o último pedaço de qualquer coisa boa na mesa.", "charada3": "Sou a chave invisível de ter na mão todos os chicletes que sobraram no pacote da saída escolar de sexta."},
    {"topico": "Sociologia", "palavra": "preconceito", "charada": "Julgar o livro pela capa antes mesmo de ler o título.", "charada2": "Também sou aquele que aparece escondido atrás de um elogio mal disfarçado.", "charada3": "Sou o pé atrás disfarçado de deboche quando a vizinha espia pela cortina o corte de cabelo moderno do vizinho."},
    {"topico": "Sociologia", "palavra": "religião", "charada": "O conjunto de crenças que sempre vira assunto proibido na mesa de almoço de domingo, e mesmo assim sempre aparece.", "charada2": "Também sou usada, errado, pra descrever qualquer time de futebol que alguém defende cegamente.", "charada3": "Sou a vela acesa por uma mãe zelosa no exato segundo em que ouve a zoeira barulhenta do primo fanático pelo time."},
    {"topico": "Sociologia", "palavra": "sociedade", "charada": "Todo mundo, inclusive quem jura que 'não liga pra opinião dos outros'.", "charada2": "Também sou culpada por qualquer decisão ruim que alguém não quer assumir sozinho.", "charada3": "Sou a mistura toda amontoada e confusa num metrô às seis, julgando as roupas uns dos outros e, na hora da confusão de sempre."},
    {"topico": "Sociologia", "palavra": "tradição", "charada": "Aquilo que a família repete todo ano só porque sempre foi assim, mesmo sem ninguém lembrar por quê.", "charada2": "Também sou aquela receita de família que só sai boa na mão de uma pessoa específica.", "charada3": "Sou o velho rito estagnado do pavê que todo mundo abomina da ceia farta de fim de ano."},
    {"topico": "Inglês e Espanhol", "palavra": "alfabeto", "charada": "Vinte e seis letrinhas que decidem toda discussão sobre como se escreve certo.", "charada2": "Também sou o motivo de qualquer lista de compras nunca seguir a ordem certa das letras.", "charada3": "Sou o grupinho decorado da escola que te ajuda a entender a confusão de códigos das estantes de uma livraria enorme."},
    {"topico": "Inglês e Espanhol", "palavra": "bilíngue", "charada": "Quem fala dois idiomas, e ainda assim trava igual todo mundo na hora de pedir a conta no restaurante.", "charada2": "Também sou o rótulo de embalagem que ninguém lê no verso porque já entendeu na frente.", "charada3": "Sou o charme especial da lanchonete falsa que finge sotaque de fast-food gringo só pra parecer mais chique."},
    {"topico": "Inglês e Espanhol", "palavra": "conversa", "charada": "Sempre fico mais interessante depois que alguém já foi embora e não pode mais participar de mim.", "charada2": "Também sou aquela que todo mundo jura que vai ter 'rapidinho' e dura a noite inteira.", "charada3": "Sou aquele pingue-pongue sem jeito na recepção do salão, cheio de elogios falsos e um silêncio constrangedor no meio."},
    {"topico": "Inglês e Espanhol", "palavra": "diálogo", "charada": "A parte do livro que você lê rápido só pra saber quem falou o quê.", "charada2": "Também sou aquele que dois grupos de WhatsApp têm ao mesmo tempo sem nenhum se falar de verdade.", "charada3": "Sou a encenação falsa ensaiada de duas pessoas no escritório concordando e rindo, mas que no fundo não se escutam por causa do fone de ouvido disfarçado."},
    {"topico": "Inglês e Espanhol", "palavra": "expressão", "charada": "Um jeito de dizer algo que não faz sentido nenhum traduzido ao pé da letra pra outro idioma.", "charada2": "Também sou aquela cara que todo mundo faz quando prova algo picante achando que ia ser suave.", "charada3": "Sou aquele trejeito cheio de caras e bocas que você joga no ar tentando encobrir que não entendeu absolutamente nada da frase dita em inglês pelo primo chato."},
    {"topico": "Inglês e Espanhol", "palavra": "fala", "charada": "A coisa que trava completamente na primeira vez que você precisa usar outro idioma de verdade.", "charada2": "Também sou aquela que todo mundo perde só de ver a conta do restaurante dividida errado.", "charada3": "Sou o som que foge misteriosamente da sua boca aberta bem na hora exata em que você se depara com o professor mandando você ler o texto da prova difícil."},
    {"topico": "Inglês e Espanhol", "palavra": "gíria", "charada": "A palavra que os mais velhos usam errado tentando parecer descolados.", "charada2": "Também sou usada errada por qualquer adulto tentando parecer jovem no grupo de família.", "charada3": "Sou a palavra descolada da rodinha do pátio que envelhece mal pra caramba e vira piada assim que seu tio tenta repetir num almoço fingindo ser moleque da rua moderna."},
    {"topico": "Inglês e Espanhol", "palavra": "idioma", "charada": "Aquele que você jura entender assistindo série com legenda, e trava completamente numa ligação de verdade.", "charada2": "Também sou usado, mal, quando alguém tenta impressionar usando só três palavras decoradas.", "charada3": "Sou aquele código misterioso que os garçons lá de fora usam só pra fingir que não sabem o quão perdido você está pedindo a comida mais barata do bife inteiro."},
    {"topico": "Inglês e Espanhol", "palavra": "intérprete", "charada": "Traduzo na hora, sem tempo pra pensar, tipo você tentando explicar uma piada que ninguém mais riu.", "charada2": "Também sou o papel de quem sempre precisa explicar a piada que ninguém entendeu na roda.", "charada3": "Sou a pessoa sortuda que sempre fica no meio da roda tentando traduzir o choro escandaloso do bebê pro resto da família que está morrendo de pânico na sala vazia."},
    {"topico": "Inglês e Espanhol", "palavra": "legenda", "charada": "A única razão de você entender o final do filme sem precisar admitir que não sabe o idioma.", "charada2": "Também sou aquela que aparece atrasada bem na cena mais importante do filme.", "charada3": "Sou a salvação branquinha no fundo da tela que, num golpe de gênio, desaparece nas cenas da neve clara."},
    {"topico": "Inglês e Espanhol", "palavra": "língua", "charada": "Também sou a parte da boca que enrola bonito na hora de pronunciar uma palavra difícil.", "charada2": "Também sou o motivo de qualquer sotaque forte virar imitação exagerada de amigo brincalhão.", "charada3": "Sou a culpada rebelde que escorrega direto e solta o trocadilho sujo na frente dos pais da namorada no minuto silencioso do jantar."},
    {"topico": "Inglês e Espanhol", "palavra": "pronúncia", "charada": "O motivo de você preferir mandar áudio a falar aquela palavra difícil em inglês.", "charada2": "Também sou aquela que trava justo na palavra mais fácil da frase inteira.", "charada3": "Sou aquele engasgo com a própria saliva que um estudante no intercâmbio solta na hora de pagar o salgado porque tentou caprichar demais no sotaque texano imitando filme ruim."},
    {"topico": "Inglês e Espanhol", "palavra": "significado", "charada": "O que uma palavra realmente quer dizer, coisa que o tradutor automático sempre erra na hora mais importante.", "charada2": "Também sou aquele que se perde completamente quando a piada é traduzida ao pé da letra.", "charada3": "Sou aquilo que se perde quando o aplicativo traduz ao pé da letra seu ditado popular favorito pro gringo."},
    {"topico": "Inglês e Espanhol", "palavra": "sotaque", "charada": "A prova de onde você nasceu, mesmo depois de anos tentando me esconder.", "charada2": "Também sou copiado errado por qualquer um tentando imitar região que não é a sua.", "charada3": "Sou a identidade rítmica arrastada da voz que o ator novato se esforça aos prantos pra apagar num teste de novela ruim."},
    {"topico": "Inglês e Espanhol", "palavra": "tradução", "charada": "Transformo uma piada engraçada em outro idioma numa frase sem graça nenhuma.", "charada2": "Também sou aquela que o aplicativo faz ao pé da letra e vira frase sem nexo nenhum.", "charada3": "Sou o desserviço cômico que a televisão fechada exibe embutido na dublagem forçada de briga ruim americana que, do nada."},
    {"topico": "Inglês e Espanhol", "palavra": "vocabulário", "charada": "Cresço muito rápido quando o assunto é xingamento em outro idioma.", "charada2": "Também sou aquele que aumenta bem rápido quando o assunto é resposta de discussão online.", "charada3": "Sou a bolsa infinita de palavras esquecidas, chiques e longas."},
    {"topico": "Artes", "palavra": "artista", "charada": "Quem transforma sentimento em obra, e também qualquer pessoa que decora o próprio bolo de aniversário torto com orgulho.", "charada2": "Também sou o apelido de quem enrola qualquer desculpa de um jeito bonito demais pra ser verdade.", "charada3": "Sou o aluno do fundão que transforma um chiclete mastigado e dois clipes quebrados numa escultura incrível no pé da carteira."},
    {"topico": "Artes", "palavra": "ator", "charada": "Finge sentir emoção profissionalmente, coisa que todo mundo já fez pelo menos uma vez numa festa chata.", "charada2": "Também sou o papel de quem finge gostar do presente feio no aniversário.", "charada3": "Sou aquele aluno que dá um show digno de prêmio e chora sem lágrima pra escapar da suspensão de sexta."},
    {"topico": "Artes", "palavra": "cena", "charada": "Um pedacinho da história que, fora de contexto, sempre parece mais dramático do que realmente é.", "charada2": "Também sou aquela que todo mundo faz quando o pedido do restaurante demora além da conta.", "charada3": "Sou aquele barraco maravilhoso e sem roteiro nenhum na porta da escola quando dois carros de pais atrasados tentam entrar na mesma vaga apertada da calçada."},
    {"topico": "Artes", "palavra": "cor", "charada": "O motivo de duas pessoas discutirem se aquele vestido é azul ou dourado.", "charada2": "Também sou escolhida errado bem na hora de pintar a parede e só descobrem depois de seca.", "charada3": "Sou aquilo que o garoto da loja jura ser azul turquesa envelhecido."},
    {"topico": "Artes", "palavra": "dança", "charada": "A primeira coisa que todo mundo jura que não sabe fazer, um segundo antes de fazer mesmo assim no casamento.", "charada2": "Também sou aquela que ninguém sabe o nome, mas todo mundo reconhece na hora que toca.", "charada3": "Sou o espasmo esquisito do tio da calça apertada em casamento chic que começa depois de alguns copos de cerveja na pista livre da festa fria demais."},
    {"topico": "Artes", "palavra": "desenho", "charada": "Sempre pareço mais fácil no vídeo do YouTube do que na sua própria mão.", "charada2": "Também sou aquele rabisco que a criança jura que é um cachorro e todo mundo finge reconhecer.", "charada3": "Sou o boneco de palito e a casinha com sol sorridente que todo adulto entediado rabisca na ata da reunião."},
    {"topico": "Artes", "palavra": "escultura", "charada": "Uma pedra que alguém teve paciência suficiente pra me transformar em outra coisa.", "charada2": "Também sou o resultado de horas de praia tentando fazer um castelo de areia decente.", "charada3": "Sou o amontoado deformado de argila esburacada que toda criança leva feliz no dia das mães."},
    {"topico": "Artes", "palavra": "instrumento", "charada": "Todo mundo me comprou pra aprender em 2020, e estou pegando poeira desde então.", "charada2": "Também sou usado, sem afinar, pela criançada logo cedo num domingo de sossego.", "charada3": "Sou a gaita surrada no fundo da mochila velha que você puxa no momento mais inoportuno do ônibus lotado, e ganha olhares mortais silenciosos de todos ao mesmo tempo."},
    {"topico": "Artes", "palavra": "melodia", "charada": "A parte da música que gruda na cabeça o dia inteiro mesmo você não lembrando a letra.", "charada2": "Também sou aquela que toca na loja e vira trilha sonora da sua semana inteira sem querer.", "charada3": "Sou o refrão instrumental daquela música chata de brinquedo infantil barato que não sai mais do cérebro exausto do pai que apertou sem querer."},
    {"topico": "Artes", "palavra": "museu", "charada": "O lugar mais silencioso que existe, até alguém esquecer de colocar o celular no silencioso.", "charada2": "Também sou o nome carinhoso que dão pra qualquer quarto cheio de coisa velha guardada.", "charada3": "Sou o depósito refinado de antiguidade que o aluno morre de bocejar em plena excursão do colégio sem conseguir fugir do frio e do sermão."},
    {"topico": "Artes", "palavra": "música", "charada": "Grudo na sua cabeça o dia inteiro depois de tocar só uma vez de manhã.", "charada2": "Também sou aquela que o vizinho escolhe pra malhar às 6h de um domingo.", "charada3": "Sou a culpada oficial por você perder totalmente o foco na leitura da apostila gorda, cantando alto o refrão dramático que eu enfio nos fones durante o pânico pré-vestibular."},
    {"topico": "Artes", "palavra": "obra", "charada": "Posso ser um quadro num museu, ou aquela reforma na rua que nunca termina.", "charada2": "Também sou o nome de qualquer conserto de casa que promete uma semana e vira três meses.", "charada3": "Sou a desgraça de marreta do vizinho aloprado acordado seis em ponto de domingo quente com poeira esparramada num projeto barulhento gigante do condomínio."},
    {"topico": "Artes", "palavra": "palco", "charada": "O lugar onde qualquer nervosismo vira parte do show, quer você queira ou não.", "charada2": "Também sou o centro das atenções de qualquer festa de aniversário de criança pequena.", "charada3": "Sou a plataforma torta iluminada da feira escolar, onde você travou as pernas suadas e gaguejou vestido de melancia sob os olhos e câmeras da arquibancada lotada e quente."},
    {"topico": "Artes", "palavra": "pincel", "charada": "A ferramenta que promete uma pintura perfeita, e sempre termina com mais tinta na sua roupa do que na tela.", "charada2": "Também sou trocado por qualquer coisa na mão de criança fazendo arte pela primeira vez.", "charada3": "Sou a varinha molhada colorida mágica que desce nas mãos erradas da sua prima pequena, garantindo arte nas paredes limpas num terror mudo da pintura abstrata."},
    {"topico": "Artes", "palavra": "pintura", "charada": "Posso valer uma fortuna ou parecer rabisco de criança, dependendo de quem assinou embaixo.", "charada2": "Também sou aquela que descasca da parede bem no canto que ninguém repara até visita chegar.", "charada3": "Sou a moldura que segura um quadro esquisito, fazendo o leigo se perguntar quem paga tanto por uma tela borrada."},
    {"topico": "Artes", "palavra": "retrato", "charada": "A versão sua que sai bem melhor no papel do que na selfie de verdade.", "charada2": "Também sou aquele quadro na sala que ninguém sabe dizer de quando é a foto.", "charada3": "Sou a recordação incômoda da juventude de aparelho feio estampada que os parentes mantêm exposta e firme, estragando o ego no almoço domingo na frente da namorada nova."},
    {"topico": "Artes", "palavra": "ritmo", "charada": "O que falta pra metade da pista de dança no casamento logo depois da primeira música mais animada.", "charada2": "Também sou perdido completamente na primeira aula de dança que alguém resolve tentar depois dos 30.", "charada3": "Sou o compasso sonoro que rege o corpo das pessoas na pista, exceto o seu tio, que sempre insiste em bater palma na contratempo e pisar no cadarço."},
    {"topico": "Artes", "palavra": "teatro", "charada": "Onde fingir sentimento na frente de estranhos é literalmente o trabalho.", "charada2": "Também sou usado pra chamar qualquer discussão exagerada de novela mexicana em pleno almoço de família.", "charada3": "Sou a sala cheia de tapete felpudo em que as cadeiras confortáveis ajudam os acompanhantes arrastados a cochilar profundo na maior cena da peça arrastada."},
    {"topico": "Matérias escolares", "palavra": "recreio", "charada": "Sou aquele momento mágico em que você finge que a escola é um clube e esquece que tem prova na próxima aula.", "charada2": "Represento a sua única chance de comer um salgado duvidoso enquanto fofoca sobre os professores no pátio lotado.", "charada3": "Fico no meio da manhã para salvar sua sanidade e fazer o tempo voar antes da tortura recomeçar."},
    {"topico": "Matérias escolares", "palavra": "boletim", "charada": "Chego no fim do bimestre trazendo verdades que você tenta esconder dos seus pais até o último segundo possível.", "charada2": "Sou um pedaço de papel que tem o poder místico de cancelar seu videogame e suas saídas no fim de semana.", "charada3": "Exibo seus números mais tristes em exatas, provando que o milagre que você esperava não aconteceu desta vez."},
    {"topico": "Matérias escolares", "palavra": "merenda", "charada": "Sou o verdadeiro motivo para muitos alunos saírem da cama cedo, especialmente quando o cardápio promete algo com salsicha.", "charada2": "Apareço no intervalo para saciar sua fome de adolescente com receitas criativas que desafiam a alta gastronomia escolar.", "charada3": "Causar filas quilométricas é o meu maior talento, e quem chega por último sempre corre o risco de ficar sem comer."},
    {"topico": "Matérias escolares", "palavra": "cola", "charada": "Sou o seu plano de emergência clandestino, escrito com letra minúscula na palma da mão ou na borracha.", "charada2": "Represento a sua tentativa desesperada de lembrar aquela fórmula complexa sem que o professor perceba meus movimentos suspeitos.", "charada3": "Vivo escondida debaixo da sua carteira, sendo a principal responsável pelo suor frio que você sente durante a avaliação."},
    {"topico": "Matérias escolares", "palavra": "formatura", "charada": "Sou a festa caríssima que você passa três anos pagando para poder usar uma roupa de aluguel e chorar abraçado com estranhos.", "charada2": "Represento o evento glorioso em que você finalmente se despede do ensino médio, jurando que vai sentir saudade de acordar cedo.", "charada3": "Marco o fim de uma era escolar com discursos longos e a entrega de um canudo que logo vai pegar poeira na estante."},
    {"topico": "Matemática", "palavra": "teorema", "charada": "Sou uma afirmação chique que alguém provou há séculos e agora você precisa decorar para não zerar a prova.", "charada2": "Exijo uma demonstração rigorosa e lógica, mas você prefere simplesmente aceitar que eu funciono para resolver o problema rapidamente.", "charada3": "Carrego o nome de gregos antigos que não tinham videogame e passavam o tempo inventando regras matemáticas para triângulos complexos."},
    {"topico": "Física", "palavra": "lente", "charada": "Sou o pedaço de vidro curvo que você coloca no rosto para finalmente conseguir ler o que está escrito no quadro.", "charada2": "Desvio a luz de forma estratégica para focar imagens, permitindo que a câmera do seu celular tire fotos maravilhosas nas férias.", "charada3": "Posso ser convergente ou divergente, trabalhando silenciosamente dentro de telescópios gigantescos para revelar estrelas que estão muito distantes daqui."},
    {"topico": "Química", "palavra": "elétron", "charada": "Sou a minúscula partícula negativa que vive correndo feito louca ao redor do núcleo sem nunca conseguir entrar definitivamente lá.", "charada2": "Carrego a energia elétrica que alimenta seu computador moderno, viajando rapidamente por fios de cobre sem que você me veja trabalhando.", "charada3": "Minha perda ou ganho em reações químicas define se um elemento vai se transformar em um herói brilhante ou num vilão instável."},
    {"topico": "Biologia", "palavra": "genética", "charada": "Sou a área específica da ciência que explica exatamente por que você herdou aquele nariz peculiar e o mau humor da sua avó.", "charada2": "Brinco com ervilhas amarelas e verdes escondidas em mosteiros antigos para descobrir finalmente como os traços dominantes esmagam os recessivos na biologia.", "charada3": "Carrego meus segredos mais sombrios em longas fitas de DNA, decidindo desde cedo quem vai ser loiro, alto ou propenso a usar óculos."},
    {"topico": "História", "palavra": "feudalismo", "charada": "Sou o sistema social medieval opressor onde você trabalhava no campo do senhor nobre em troca de não ser assassinado por invasores bárbaros.", "charada2": "Na minha época sombria de glória, a terra valia muito mais do que dinheiro, e cavaleiros pesados de armadura governavam grandes castelos gelados.", "charada3": "Prendi camponeses pobres na terra durante muitos séculos sob uma rígida pirâmide social que não permitia a absolutamente ninguém mudar de profissão nunca."},
    {"topico": "Geografia", "palavra": "globalização", "charada": "Sou o fenômeno comercial moderno que permite que você coma um belo sushi japonês escutando música coreana animada pelo seu celular fabricado na China.", "charada2": "Encurtei as distâncias do planeta conectando mercados internacionais rapidamente, mas também espalho facilmente qualquer crise financeira grave que aconteça de repente num país rico.", "charada3": "Transformei o mundo inteiro numa enorme aldeia conectada por cabos submarinos infinitos e voos internacionais lotados que nunca param de cruzar o céu azul."},
    {"topico": "Português e Literatura", "palavra": "vogal", "charada": "Sou o som perfeitamente limpo e indispensável que sai da sua boca aberta sem encontrar absolutamente nenhum obstáculo físico pelo caminho da fala humana.", "charada2": "Somos apenas cinco formadoras sonoras de sílabas, sendo completamente impossível pronunciar uma única palavra inteira em português escrito sem a nossa presença constante nela.", "charada3": "Carrego a energia principal da fala diária e sou quem sustenta os acentos agudos e os chapeuzinhos circunflexos nas palavras mais difíceis de escrever."},
    {"topico": "Português e Literatura", "palavra": "romantismo", "charada": "Sou o movimento literário intenso onde os autores deprimidos gostavam de chorar pelo amor impossível e morrer jovens de tuberculose no dramático segundo ato.", "charada2": "Adoro idealizar profundamente a figura do índio corajoso e focar em heróis nacionais perfeitos que enfrentam a natureza selvagem com muita bravura e honra cega.", "charada3": "Troquei a razão lógica pela emoção exagerada sem limites, inspirando poetas angustiados a escreverem longamente sobre o passado glorioso e sofrimentos amorosos incrivelmente intensos."},
    {"topico": "Redação", "palavra": "rascunho", "charada": "Sou a folha feia e cheia de riscos que guarda seus erros antes de você passar o texto a limpo.", "charada2": "Sirvo pra você testar ideias geniais e cortar palavras feias, sendo o herói que nunca chega ao professor.", "charada3": "Sou o laboratório rabiscado das suas palavras, cheio de setas apontando pra observações de última hora."},
    {"topico": "Redação", "palavra": "título", "charada": "Sou a cereja pequena do bolo textual que muitos alunos nervosos esquecem de colocar no topo da folha.", "charada2": "Não sou considerado obrigatório no exame mais famoso, mas algumas bancas me exigem centralizado na primeira linha.", "charada3": "Fico centralizado lá em cima, tentando resumir o tema com menos de cinco palavras sem atrapalhar o texto."},
    {"topico": "Filosofia", "palavra": "mito", "charada": "Sou a narrativa cheia de deuses zangados que explicava a chuva forte antes da ciência entrar em cena.", "charada2": "Antes do pensamento racional dominar a Grécia antiga, eu era a resposta disponível pra qualquer fenômeno da natureza.", "charada3": "Trago heróis, deuses e monstros bizarros pra transmitir lições antigas que ainda inspiram diretores de cinema hoje."},
    {"topico": "Inglês e Espanhol", "palavra": "dicionário", "charada": "Sou um tijolo de papel grosso cheio de páginas amareladas que resolve toda disputa sobre significado de palavra.", "charada2": "Listo todo o vocabulário em ordem alfabética pra tentar salvar o estudante desesperado na véspera da prova.", "charada3": "Reúno definições e classes gramaticais completas, mas fui rapidamente trocado por um aplicativo grátis no seu celular."},
    {"topico": "Inglês e Espanhol", "palavra": "fluência", "charada": "Sou o troféu que todo aluno busca por anos pra bater papo com um estrangeiro sem pausar pra pensar.", "charada2": "Represento o momento em que você para de traduzir tudo na cabeça e começa a pensar direto na outra língua.", "charada3": "Atingir meu nível significa entender piada e sotaque local sem precisar olhar pra legenda nenhuma vez."}
  ];
  var wordBankPromise = null;
  var wordBankCache = null;

  function isSequenceRunning() {
    return activeTimeline && activeTimeline.progress() < 1;
  }

  function handleFastForwardInput(event) {
    if (!isSequenceRunning()) return;
    if (event && event.target && event.target.closest &&
        event.target.closest('#hangman-exit-control')) return;

    /* Os controles ficam na captura da janela para que, durante a forca, o
       gesto não navegue por um link nem alcance o contador dos dez cliques. */
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    /* Antes do segundo espaço vazio da palavra aparecer na cena, o clique
       (teclado, mouse ou toque na tela) é apenas engolido acima -- ainda
       não acelera nada. */
    if (activeTimeline.time() < fastForwardUnlockTime) return;

    if (activeTimeline.timeScale() < FAST_FORWARD_SCALE) {
      activeTimeline.timeScale(FAST_FORWARD_SCALE);
      document.dispatchEvent(new CustomEvent('hangman:fast-forward', {
        detail: { timeScale: FAST_FORWARD_SCALE }
      }));
    }
  }

  function attachFastForwardControls() {
    if (fastForwardListenersAttached) return;
    window.addEventListener('pointerdown', handleFastForwardInput, true);
    window.addEventListener('click', handleFastForwardInput, true);
    window.addEventListener('keydown', handleFastForwardInput, true);
    fastForwardListenersAttached = true;
  }

  function detachFastForwardControls() {
    if (!fastForwardListenersAttached) return;
    window.removeEventListener('pointerdown', handleFastForwardInput, true);
    window.removeEventListener('click', handleFastForwardInput, true);
    window.removeEventListener('keydown', handleFastForwardInput, true);
    fastForwardListenersAttached = false;
  }

  function isExitControlEvent(event) {
    return Boolean(event && event.target && event.target.closest &&
      event.target.closest('#hangman-exit-control'));
  }

  function handleExitControlInput(event) {
    if (!isExitControlEvent(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    resetHangmanAnimation();
  }

  function ensureExitControl() {
    if (exitControl && exitControl.isConnected) return exitControl;

    exitControl = document.createElement('button');
    exitControl.id = 'hangman-exit-control';
    exitControl.type = 'button';
    exitControl.setAttribute('aria-label', 'Sair da animação');
    exitControl.title = 'Sair da animação';
    exitControl.style.cssText = [
      'position:fixed',
      'top:12px',
      'top:max(12px,env(safe-area-inset-top))',
      'right:12px',
      'right:max(12px,env(safe-area-inset-right))',
      'z-index:22000',
      'width:64px',
      'height:64px',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:0',
      'border:0',
      'background:transparent',
      'box-shadow:none',
      'cursor:pointer',
      'touch-action:manipulation'
    ].join(';');
    exitControl.innerHTML =
      '<svg viewBox="0 0 48 48" width="46" height="46" aria-hidden="true">' +
        '<path d="M12 12L36 36M36 12L12 36" fill="none" stroke="#dc2626" stroke-width="6" stroke-linecap="round"/>' +
      '</svg>';
    document.body.appendChild(exitControl);
    return exitControl;
  }

  function showExitControl() {
    ensureExitControl().style.display = 'flex';
    if (exitControlListenersAttached) return;
    window.addEventListener('pointerdown', handleExitControlInput, true);
    window.addEventListener('click', handleExitControlInput, true);
    exitControlListenersAttached = true;
  }

  function removeExitControl() {
    if (exitControlListenersAttached) {
      window.removeEventListener('pointerdown', handleExitControlInput, true);
      window.removeEventListener('click', handleExitControlInput, true);
      exitControlListenersAttached = false;
    }
    if (exitControl && exitControl.parentNode) {
      exitControl.parentNode.removeChild(exitControl);
    }
    exitControl = null;
  }

  function isMobileDevice() {
    var userAgent = navigator.userAgent || '';
    var userAgentData = navigator.userAgentData;
    return Boolean(userAgentData && userAgentData.mobile) ||
      /Android|iPhone|iPod|IEMobile|Opera Mini/i.test(userAgent) ||
      (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1);
  }

  function isLandscapeViewport() {
    return window.innerWidth > window.innerHeight;
  }

  function blockInputWhileWaitingForLandscape(event) {
    if (!mobileLandscapeActive) return;
    if (mobileLandscapeIntroElapsed && isLandscapeViewport()) return;
    if (event.target && event.target.closest &&
        event.target.closest('#hangman-exit-control')) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function attachLandscapeBlockers() {
    if (landscapeBlockersAttached) return;
    window.addEventListener('pointerdown', blockInputWhileWaitingForLandscape, true);
    window.addEventListener('click', blockInputWhileWaitingForLandscape, true);
    window.addEventListener('keydown', blockInputWhileWaitingForLandscape, true);
    landscapeBlockersAttached = true;
  }

  function detachLandscapeBlockers() {
    if (!landscapeBlockersAttached) return;
    window.removeEventListener('pointerdown', blockInputWhileWaitingForLandscape, true);
    window.removeEventListener('click', blockInputWhileWaitingForLandscape, true);
    window.removeEventListener('keydown', blockInputWhileWaitingForLandscape, true);
    landscapeBlockersAttached = false;
  }

  function ensureLandscapeOverlay() {
    if (landscapeOverlay && landscapeOverlay.isConnected) return landscapeOverlay;

    landscapeOverlay = document.createElement('div');
    landscapeOverlay.id = 'hangman-landscape-gate';
    landscapeOverlay.setAttribute('role', 'status');
    landscapeOverlay.setAttribute('aria-live', 'polite');
    landscapeOverlay.style.cssText = [
      'display:none',
      'position:absolute',
      'top:0',
      'left:0',
      'width:100vw',
      'height:100vh',
      'z-index:20000',
      'align-items:center',
      'justify-content:center',
      'padding:24px',
      'background:#f8f9fa',
      'color:#111827',
      'font-family:Inter,Arial,sans-serif',
      'text-align:center'
    ].join(';');
    landscapeOverlay.innerHTML =
      '<style>' +
        '@keyframes hangman-phone-turn{0%,20%{transform:rotate(0deg)}80%,100%{transform:rotate(90deg)}}' +
        '@keyframes hangman-turn-arrow{0%{stroke-dashoffset:120;opacity:.25}35%,100%{stroke-dashoffset:0;opacity:1}}' +
        '#hangman-landscape-gate .hangman-phone{transform-box:fill-box;transform-origin:center;animation:hangman-phone-turn 2s cubic-bezier(.65,0,.35,1) both}' +
        '#hangman-landscape-gate .hangman-turn-arrow{stroke-dasharray:120;animation:hangman-turn-arrow 2s ease-out both}' +
        '@media(prefers-reduced-motion:reduce){#hangman-landscape-gate .hangman-phone{animation:none;transform:rotate(90deg)}#hangman-landscape-gate .hangman-turn-arrow{animation:none;stroke-dashoffset:0}}' +
      '</style>' +
      '<div style="max-width:380px">' +
        '<svg viewBox="0 0 160 125" width="160" height="125" role="img" aria-label="Celular girando para a posição horizontal" style="display:block;margin:0 auto 12px;overflow:visible">' +
          '<path class="hangman-turn-arrow" d="M30 82C16 45 42 12 79 10C108 8 134 26 138 52" fill="none" stroke="#ffd100" stroke-width="8" stroke-linecap="round"/>' +
          '<path d="M128 43L139 53L144 38" fill="none" stroke="#ffd100" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<g class="hangman-phone">' +
            '<rect x="59" y="24" width="42" height="78" rx="8" fill="#0055d4"/>' +
            '<rect x="64" y="32" width="32" height="58" rx="3" fill="#f8f9fa"/>' +
            '<circle cx="80" cy="96" r="3" fill="#ffd100"/>' +
          '</g>' +
        '</svg>' +
        '<strong id="hangman-landscape-title" style="display:block;font:700 24px/1.15 Outfit,Inter,sans-serif;margin-bottom:10px">Gire o celular</strong>' +
        '<span id="hangman-landscape-message" style="display:block;font-size:16px;line-height:1.45">Use a tela na orientação horizontal para acompanhar a animação.</span>' +
      '</div>';
    document.body.appendChild(landscapeOverlay);
    return landscapeOverlay;
  }

  function showLandscapeOverlay(isIntro) {
    var overlay = ensureLandscapeOverlay();
    var title = overlay.querySelector('#hangman-landscape-title');
    var message = overlay.querySelector('#hangman-landscape-message');
    if (title) title.textContent = isIntro ? 'Prepare a tela' : 'Gire o celular';
    if (message) {
      message.textContent = isIntro
        ? 'A animação começará em modo horizontal.'
        : 'A animação continuará automaticamente na orientação horizontal.';
    }
    overlay.style.display = 'flex';
  }

  function hideLandscapeOverlay() {
    if (landscapeOverlay) landscapeOverlay.style.display = 'none';
  }

  function updateMobileLandscapeState() {
    if (!mobileLandscapeActive || !activeTimeline) return;

    if (!mobileLandscapeIntroElapsed) {
      detachFastForwardControls();
      attachLandscapeBlockers();
      showLandscapeOverlay(true);
      return;
    }

    if (!isLandscapeViewport()) {
      if (mobileLandscapeStarted) activeTimeline.pause();
      detachFastForwardControls();
      attachLandscapeBlockers();
      showLandscapeOverlay(false);
      return;
    }

    hideLandscapeOverlay();
    detachLandscapeBlockers();
    attachFastForwardControls();

    if (!mobileLandscapeStarted) {
      mobileLandscapeStarted = true;
      activeTimeline.play(0);
    } else if (activeTimeline.paused()) {
      activeTimeline.resume();
    }
  }

  function tryOrientationLock() {
    var orientation = window.screen && window.screen.orientation;
    if (!orientation || typeof orientation.lock !== 'function') {
      return Promise.resolve(false);
    }
    try {
      return orientation.lock('landscape').then(function () {
        return true;
      }).catch(function () {
        return false;
      });
    } catch (error) {
      return Promise.resolve(false);
    }
  }

  function requestMobileLandscapeLock() {
    var token = ++landscapeRequestToken;
    var root = document.documentElement;
    var requestFullscreen = root.requestFullscreen || root.webkitRequestFullscreen;
    var fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;

    function refreshOrientationState() {
      if (token !== landscapeRequestToken || !mobileLandscapeActive) return;
      window.setTimeout(updateMobileLandscapeState, 80);
    }

    if (!fullscreenElement && typeof requestFullscreen === 'function') {
      try {
        Promise.resolve(requestFullscreen.call(root)).then(function () {
          if (token !== landscapeRequestToken || !mobileLandscapeActive) return false;
          mobileFullscreenOwned = true;
          return tryOrientationLock();
        }).then(refreshOrientationState).catch(function () {
          return tryOrientationLock().then(refreshOrientationState);
        });
      } catch (error) {
        tryOrientationLock().then(refreshOrientationState);
      }
      return;
    }

    tryOrientationLock().then(refreshOrientationState);
  }

  function playTimelineWithMobileLandscape() {
    if (!isMobileDevice()) {
      attachFastForwardControls();
      activeTimeline.play(0);
      return;
    }

    mobileLandscapeActive = true;
    mobileLandscapeStarted = false;
    mobileLandscapeIntroElapsed = false;
    window.addEventListener('resize', updateMobileLandscapeState);
    window.addEventListener('orientationchange', updateMobileLandscapeState);

    /* A solicitação precisa acontecer imediatamente dentro do gesto que
       iniciou o jogo para os navegadores móveis aceitarem tela cheia. */
    requestMobileLandscapeLock();
    attachLandscapeBlockers();
    showLandscapeOverlay(true);
    mobileLandscapeIntroTimer = window.setTimeout(function () {
      mobileLandscapeIntroTimer = null;
      mobileLandscapeIntroElapsed = true;
      updateMobileLandscapeState();
    }, MOBILE_LANDSCAPE_INTRO_MS);
    updateMobileLandscapeState();
  }

  function releaseMobileLandscapeMode() {
    var hadMobileLandscapeSession = mobileLandscapeActive || mobileFullscreenOwned;
    landscapeRequestToken += 1;
    mobileLandscapeActive = false;
    mobileLandscapeStarted = false;
    mobileLandscapeIntroElapsed = false;
    if (mobileLandscapeIntroTimer !== null) {
      window.clearTimeout(mobileLandscapeIntroTimer);
      mobileLandscapeIntroTimer = null;
    }
    window.removeEventListener('resize', updateMobileLandscapeState);
    window.removeEventListener('orientationchange', updateMobileLandscapeState);
    detachLandscapeBlockers();
    hideLandscapeOverlay();

    if (landscapeOverlay && landscapeOverlay.parentNode) {
      landscapeOverlay.parentNode.removeChild(landscapeOverlay);
      landscapeOverlay = null;
    }

    var orientation = window.screen && window.screen.orientation;
    if (hadMobileLandscapeSession && orientation && typeof orientation.unlock === 'function') {
      try { orientation.unlock(); } catch (error) { /* Sem suporte no navegador. */ }
    }

    if (mobileFullscreenOwned) {
      var exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
      mobileFullscreenOwned = false;
      if (typeof exitFullscreen === 'function' &&
          (document.fullscreenElement || document.webkitFullscreenElement)) {
        try {
          var exitResult = exitFullscreen.call(document);
          if (exitResult && typeof exitResult.catch === 'function') {
            exitResult.catch(function () {});
          }
        } catch (error) { /* A saída pode já ter sido feita pelo usuário. */ }
      }
    }
  }

  function prefersReducedMotion() {
    return Boolean(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function lockPageScroll() {
    if (pageScrollLock) return;
    var root = document.documentElement;
    var body = document.body;
    pageScrollLock = {
      x: window.scrollX || window.pageXOffset || 0,
      y: window.scrollY || window.pageYOffset || 0,
      rootOverflow: root.style.overflow,
      rootOverscroll: root.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior
    };
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    root.style.overflow = 'hidden';
    root.style.overscrollBehavior = 'none';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    body.classList.add('hangman-scroll-locked');
  }

  function unlockPageScroll() {
    if (!pageScrollLock) return;
    var previous = pageScrollLock;
    pageScrollLock = null;
    var root = document.documentElement;
    var body = document.body;
    root.style.overflow = previous.rootOverflow;
    root.style.overscrollBehavior = previous.rootOverscroll;
    body.style.overflow = previous.bodyOverflow;
    body.style.overscrollBehavior = previous.bodyOverscroll;
    body.classList.remove('hangman-scroll-locked');
    window.scrollTo({ top: previous.y, left: previous.x, behavior: 'auto' });
  }

  function renderFloatingPiece(state) {
    if (!state || !state.piece || !window.gsap) return;
    window.gsap.set(state.piece, {
      x: state.baseX + state.emotionX,
      y: state.baseY + state.floatY + state.waveY + state.reactY + state.emotionY,
      rotation: state.rotation + state.emotionRotation,
      scaleX: state.scaleX,
      scaleY: state.scaleY,
      transformOrigin: state.transformOrigin || '50% 50%'
    });
  }

  function stopGallowsSway() {
    if (gallowsSwayTimeline) {
      gallowsSwayTimeline.kill();
      gallowsSwayTimeline = null;
    }
    gallowsSwayAngle = 0;
  }

  function startGallowsSway(parts) {
    var gsap = window.gsap;
    if (!gsap || gallowsSwayTimeline || !parts || !parts.gallows) return;
    var attached = activeGallowsPose.attachedPiece;
    gallowsSwayTimeline = gsap.timeline({ repeat: -1, yoyo: true });
    gallowsSwayTimeline.to({ angle: 0 }, {
      angle: 2.2,
      duration: prefersReducedMotion() ? 1.2 : 2.8,
      ease: 'sine.inOut',
      onUpdate: function () {
        var angle = this.targets()[0].angle;
        gallowsSwayAngle = angle;
        gsap.set(parts.gallows, { rotation: angle, transformOrigin: '290px 194px' });
        floatingPieceStates.forEach(function (state) {
          if (!state.hung || !state.ghost) return;
          gsap.set(state.ghost, { rotation: (state.hungRotation || 0) + angle * (state.pieceId === attached ? 0.9 : 0.65) });
        });
      }
    });
  }

  function stopFloatingPieces() {
    var gsap = window.gsap;

    stopGallowsSway();

    floatingAnimations.forEach(function (animation) {
      if (animation && typeof animation.kill === 'function') animation.kill();
    });
    floatingAnimations = [];

    floatingPieceStates.forEach(function (state) {
      if (state.reactionTimeline) state.reactionTimeline.kill();
      if (gsap) gsap.killTweensOf(state);
      if (state.piece) {
        state.piece.style.willChange = '';
        state.piece.style.visibility = '';
        state.piece.style.pointerEvents = '';
        if (gsap) gsap.set(state.piece, { opacity: 1 });
      }
    });
    floatingPieceStates = [];

    hungGhosts.forEach(function (ghost) {
      if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
    });
    hungGhosts = [];

    if (floatingInteractionsAttached) {
      window.removeEventListener('pointerdown', handleFloatingSlotInput, true);
      window.removeEventListener('pointerover', handleFloatingHover, true);
      document.removeEventListener('hangman:piece-react', handleFloatingPieceEvent);
      floatingInteractionsAttached = false;
    }
  }

  function findFloatingPiece(identifier) {
    if (typeof identifier === 'number' && Number.isFinite(identifier)) {
      return floatingPieceStates[Math.max(0, Math.min(
        floatingPieceStates.length - 1,
        Math.floor(identifier)
      ))] || null;
    }
    if (typeof identifier === 'string') {
      for (var i = 0; i < floatingPieceStates.length; i += 1) {
        if (floatingPieceStates[i].pieceId === identifier) return floatingPieceStates[i];
      }
    }
    return null;
  }

  function reactFloatingPiece(identifier) {
    var gsap = window.gsap;
    var state = findFloatingPiece(identifier);
    if (!gsap || !state || state.hung) return false;

    if (state.reactionTimeline) state.reactionTimeline.kill();
    gsap.killTweensOf(state, 'reactY');
    state.reactY = 0;

    var distance = prefersReducedMotion() ? 1 : 4;
    var render = function () { renderFloatingPiece(state); };
    state.reactionTimeline = gsap.timeline({
      onComplete: function () {
        state.reactionTimeline = null;
        document.dispatchEvent(new CustomEvent('hangman:piece-reacted', {
          detail: { index: state.index, pieceId: state.pieceId }
        }));
      }
    });
    state.reactionTimeline
      .to(state, {
        reactY: distance,
        duration: 0.18,
        ease: 'power2.out',
        onUpdate: render
      })
      .to(state, {
        reactY: 0,
        duration: 0.32,
        ease: 'power2.inOut',
        onUpdate: render
      });
    return true;
  }

  function handleFloatingSlotInput(event) {
    if (!floatingPieceStates.length || !event.target || !event.target.closest) return;
    var target = event.target.closest('[data-hangman-piece]');
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    reactFloatingPiece(target.getAttribute('data-hangman-piece'));
  }

  function handleFloatingHover(event) {
    if (!floatingPieceStates.length || !event.target || !event.target.closest) return;
    var target = event.target.closest('[data-hangman-piece]');
    if (!target || (event.relatedTarget && target.contains(event.relatedTarget))) return;
    reactFloatingPiece(target.getAttribute('data-hangman-piece'));
  }

  function handleFloatingPieceEvent(event) {
    var detail = event.detail || {};
    var identifier = detail.pieceId !== undefined ? detail.pieceId : detail.index;
    reactFloatingPiece(identifier);
  }

  function attachFloatingInteractions() {
    if (floatingInteractionsAttached) return;
    window.addEventListener('pointerdown', handleFloatingSlotInput, true);
    window.addEventListener('pointerover', handleFloatingHover, true);
    document.addEventListener('hangman:piece-react', handleFloatingPieceEvent);
    floatingInteractionsAttached = true;
  }

  function startFloatingPieces(rowTargets) {
    var gsap = window.gsap;
    if (!gsap || !rowTargets || !rowTargets.length) return;

    stopFloatingPieces();
    var reduced = prefersReducedMotion();

    floatingPieceStates = rowTargets.map(function (piece, index) {
      var state = {
        index: index,
        pieceId: activeGallowsPose.order[index] || DISASSEMBLY_ROW_ORDER[index],
        piece: piece,
        baseX: Number(gsap.getProperty(piece, 'x')) || 0,
        baseY: Number(gsap.getProperty(piece, 'y')) || 0,
        floatY: 0,
        waveY: 0,
        reactY: 0,
        emotionX: 0,
        emotionY: 0,
        emotionRotation: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        transformOrigin: '50% 50%',
        reactionTimeline: null,
        floatTimeline: null,
        hung: false
      };
      piece.setAttribute('data-hangman-piece', state.pieceId);
      piece.style.cursor = 'pointer';
      piece.style.willChange = 'transform';
      return state;
    });

    floatingPieceStates.forEach(function (state, index) {
      var distance = reduced ? 1 : FLOAT_DISTANCES[index];
      var rotation = reduced ? 0 : FLOAT_ROTATIONS[index];
      var duration = FLOAT_DURATIONS[index];
      var render = function () { renderFloatingPiece(state); };
      var floatingTimeline = gsap.timeline({
        repeat: -1,
        delay: index * 0.13
      });

      floatingTimeline
        .to(state, {
          floatY: -distance,
          rotation: -rotation,
          duration: duration * 0.25,
          ease: 'sine.inOut',
          onUpdate: render
        })
        .to(state, {
          floatY: distance,
          rotation: rotation,
          duration: duration * 0.5,
          ease: 'sine.inOut',
          onUpdate: render
        })
        .to(state, {
          floatY: 0,
          rotation: 0,
          duration: duration * 0.25,
          ease: 'sine.inOut',
          onUpdate: render
        });
      state.floatTimeline = floatingTimeline;
      floatingAnimations.push(floatingTimeline);
    });

    var waveDistance = reduced ? 1 : 3;
    var waveTimeline = gsap.timeline({ repeat: -1, repeatDelay: 5.5, delay: 5.5 });
    floatingPieceStates.forEach(function (state, index) {
      var render = function () { renderFloatingPiece(state); };
      var waveStart = index * 0.07;
      waveTimeline.to(state, {
        waveY: -waveDistance,
        duration: 0.24,
        ease: 'power2.out',
        onUpdate: render
      }, waveStart);
      waveTimeline.to(state, {
        waveY: 0,
        duration: 0.42,
        ease: 'sine.inOut',
        onUpdate: render
      }, waveStart + 0.24);
    });
    floatingAnimations.push(waveTimeline);
    attachFloatingInteractions();
  }

  function animateFloatingMood(type) {
    var gsap = window.gsap;
    if (!gsap || !floatingPieceStates.length) return false;
    var reduced = prefersReducedMotion();

    floatingPieceStates.forEach(function (state, index) {
      if (state.hung) return;
      gsap.killTweensOf(state, 'emotionX,emotionY,emotionRotation');
      state.emotionX = 0;
      state.emotionY = 0;
      state.emotionRotation = 0;
      var direction = index % 2 ? 1 : -1;
      var render = function () { renderFloatingPiece(state); };
      var tween = gsap.to(state, type === 'celebrate' ? {
        emotionX: direction * (reduced ? 0.5 : 1.8),
        emotionY: reduced ? -0.6 : -3.8,
        emotionRotation: direction * (reduced ? 1 : 7),
        duration: reduced ? 0.16 : 0.11,
        repeat: type === 'celebrate' ? -1 : (reduced ? 1 : 9),
        yoyo: true,
        ease: 'power1.inOut',
        onUpdate: render,
        onComplete: function () {
          state.emotionX = 0;
          state.emotionY = 0;
          state.emotionRotation = 0;
          render();
        }
      } : {
        emotionX: direction * (reduced ? 0.35 : 1.15),
        emotionY: direction * (reduced ? 0.15 : 0.45),
        emotionRotation: direction * (reduced ? 0.5 : 2.4),
        duration: reduced ? 0.14 : 0.075,
        repeat: reduced ? 1 : 9,
        yoyo: true,
        ease: 'none',
        onUpdate: render,
        onComplete: function () {
          state.emotionX = 0;
          state.emotionY = 0;
          state.emotionRotation = 0;
          render();
        }
      });
      floatingAnimations.push(tween);
    });
    return true;
  }

  /* Em vez de animar a MESMA peça flutuante voando até a pose final (a
     trajetória nunca ficou alinhada direito com a pose pendurada), a peça
     flutuante some com um fade rápido no lugar onde estava, e uma cópia
     dela nasce já plantada certinha na posição final (os mesmos valores de
     x/y/rotação/escala que a pose sorteada define), revelada com um
     pop + flash azul. Pro jogador parece uma peça só se teletransportando;
     na prática são duas elementos diferentes -- a "gambiarra" combinada
     com o Allan. */
  function movePieceToGallows(identifier, parts) {
    var gsap = window.gsap;
    var state = findFloatingPiece(identifier);
    if (!gsap || !state || state.hung) return false;
    var target = activeGallowsPose.targets[state.pieceId] || GALLOWS_PIECE_TARGETS[state.pieceId];
    if (!target) return false;

    state.hung = true;
    if (state.floatTimeline) state.floatTimeline.kill();
    if (state.reactionTimeline) state.reactionTimeline.kill();
    gsap.killTweensOf(state);

    var floatingPiece = state.piece;

    /* 1) A peça flutuante original só desaparece (fade), sem se mover. */
    gsap.to(floatingPiece, {
      opacity: 0,
      duration: prefersReducedMotion() ? 0.12 : 0.22,
      ease: 'power1.in',
      onComplete: function () {
        floatingPiece.style.visibility = 'hidden';
        floatingPiece.style.pointerEvents = 'none';
      }
    });

    /* 2) Uma cópia dela nasce escondida já na posição final da pose e é
       revelada com um pop (escala) + flash azul (drop-shadow). */
    var localAnchor = target.localAnchor || { x: 0, y: 0 };
    var finalScaleX = target.scaleX === undefined ? 1 : target.scaleX;
    var finalScaleY = target.scaleY === undefined ? 1 : target.scaleY;

    var ghost = floatingPiece.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.removeAttribute('data-hangman-piece');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.cursor = '';
    ghost.style.willChange = '';
    ghost.style.pointerEvents = 'none';
    if (floatingPiece.parentNode) floatingPiece.parentNode.appendChild(ghost);
    hungGhosts.push(ghost);
    state.ghost = ghost;
    state.hungRotation = target.rotation;

    gsap.set(ghost, {
      x: target.x - TRAVEL_X - localAnchor.x,
      y: target.y - localAnchor.y,
      rotation: target.rotation,
      scaleX: finalScaleX * 0.7,
      scaleY: finalScaleY * 0.7,
      transformOrigin: localAnchor.x + 'px ' + localAnchor.y + 'px',
      opacity: 0
    });
    ghost.style.filter = 'drop-shadow(0 0 0 rgba(0,85,212,0))';

    var reveal = gsap.timeline({
      onComplete: function () {
        document.dispatchEvent(new CustomEvent('hangman:piece-hung', {
          detail: { index: state.index, pieceId: state.pieceId }
        }));
      }
    });
    reveal
      .to(ghost, {
        opacity: 1,
        scaleX: finalScaleX,
        scaleY: finalScaleY,
        duration: prefersReducedMotion() ? 0.16 : 0.38,
        ease: 'back.out(2.2)'
      }, 0)
      .to(ghost, {
        filter: 'drop-shadow(0 0 10px rgba(0,85,212,0.95))',
        duration: 0.16,
        ease: 'power1.out'
      }, 0)
      .to(ghost, {
        filter: 'drop-shadow(0 0 0 rgba(0,85,212,0))',
        duration: 0.35,
        ease: 'power1.in'
      }, 0.16);

    floatingAnimations.push(reveal);
    return true;
  }

  function fearAndHangPiece(identifier) {
    if (!window.gsap) return false;
    animateFloatingMood('fear');
    var delayed = window.gsap.delayedCall(prefersReducedMotion() ? 0.2 : 0.78, function () {
      movePieceToGallows(identifier, activeParts);
    });
    floatingAnimations.push(delayed);
    return true;
  }

  var topicRevealStylesInjected = false;

  function ensureTopicRevealStyles() {
    if (topicRevealStylesInjected) return;
    topicRevealStylesInjected = true;
    var style = document.createElement('style');
    style.id = 'hangman-topic-reveal-styles';
    style.textContent =
      '#hangman-topic-reveal{position:absolute;' +
      'transform:translate(-50%,-50%);z-index:2147482000;color:#d1273f;font-family:"Caveat",cursive;' +
      'font-weight:700;text-decoration:underline;text-underline-offset:6px;' +
      'font-size:clamp(44px,6.8vw,68px);white-space:nowrap;pointer-events:none;}';
    document.head.appendChild(style);
  }

  /* O tópico ocupa um ponto do cenário, não da janela. Ele nasce à direita
     e chega exatamente ao centro mostrado no enquadramento final conforme a
     câmera desloca a página. */
  function ensureTopicReveal(finalCameraShift) {
    var el = document.getElementById('hangman-topic-reveal');
    if (!el) {
      ensureTopicRevealStyles();
      el = document.createElement('div');
      el.id = 'hangman-topic-reveal';
      el.setAttribute('aria-hidden', 'true');
      (pageCamera || ensurePageCamera()).appendChild(el);
    }
    var nav = document.querySelector('.navbar');
    if (nav) {
      var navRect = nav.getBoundingClientRect();
      el.style.top = (window.scrollY + navRect.top + navRect.height / 2) + 'px';
    }
    el.style.left = (window.scrollX + window.innerWidth / 2 + (finalCameraShift || 0)) + 'px';
    return el;
  }

  function hideTopicReveal() {
    var el = document.getElementById('hangman-topic-reveal');
    if (!el) return;
    el.textContent = '';
  }

  /* O jogo da velha desloca a página como um cenário único quando precisa
     abrir espaço lateral. A forca usa o mesmo princípio sem depender nem
     alterar o listener daquele jogo. */
  function ensurePageCamera() {
    if (pageCamera && pageCamera.isConnected) return pageCamera;

    pageCamera = document.getElementById('hangman-page-camera');
    if (pageCamera) return pageCamera;

    pageCamera = document.createElement('div');
    pageCamera.id = 'hangman-page-camera';
    pageCamera.style.willChange = 'transform';

    Array.prototype.slice.call(document.body.children).forEach(function (child) {
      pageCamera.appendChild(child);
    });
    document.body.appendChild(pageCamera);
    return pageCamera;
  }

  function collectParts() {
    var parts = {
      restCharacter: document.getElementById('rest-character'),
      rig: document.getElementById('character-rig'),
      world: document.getElementById('hangman-world'),
      travel: document.getElementById('character-travel'),
      svg: document.getElementById('mascote-animavel'),
      pageCamera: pageCamera,
      book: document.getElementById('hangman-book'),
      bookShape: document.getElementById('hangman-book-shape'),
      slots: document.getElementById('hangman-slots'),
      gallows: document.getElementById('hangman-gallows'),
      gallowsStrokes: Array.prototype.slice.call(document.querySelectorAll('#hangman-gallows .gallows-stroke')),
      floatingCard: document.querySelector('.card-equation'),
      hero: document.querySelector('.hero'),
      pieceEls: {},
      pathEls: {}
    };

    PIECE_IDS.forEach(function (pieceId) {
      parts.pieceEls[pieceId] = document.getElementById(pieceId);
      PIECES[pieceId].forEach(function (pathId) {
        parts.pathEls[pathId] = document.getElementById(pathId);
      });
    });

    return parts;
  }

  function hasCompleteRig(parts) {
    if (!parts.restCharacter || !parts.rig || !parts.world || !parts.travel ||
        !parts.svg || !parts.pageCamera ||
        !parts.book || !parts.bookShape || !parts.slots || !parts.gallows ||
        parts.gallowsStrokes.length !== 5) {
      return false;
    }
    return PIECE_IDS.every(function (pieceId) {
      if (!parts.pieceEls[pieceId]) return false;
      return PIECES[pieceId].every(function (pathId) {
        return !!parts.pathEls[pathId];
      });
    });
  }

  function clearSlots(slotsGroup) {
    while (slotsGroup.firstChild) {
      slotsGroup.removeChild(slotsGroup.firstChild);
    }
  }

  function isLetter(character) {
    return character.toLocaleLowerCase('pt-BR') !== character.toLocaleUpperCase('pt-BR');
  }

  function normalizeLetter(character) {
    return character.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase('pt-BR');
  }

  function createRound(input) {
    var rawWord = '';
    var hint = '';
    var hint2 = '';
    var hint3 = '';
    var topic = '';

    if (typeof input === 'string') {
      rawWord = input;
    } else if (input && typeof input === 'object') {
      rawWord = typeof input.word === 'string' ? input.word :
        (typeof input.palavra === 'string' ? input.palavra : '');
      hint = typeof input.hint === 'string' ? input.hint.trim() :
        (typeof input.charada === 'string' ? input.charada.trim() : '');
      hint2 = typeof input.hint2 === 'string' ? input.hint2.trim() :
        (typeof input.charada2 === 'string' ? input.charada2.trim() : '');
      hint3 = typeof input.hint3 === 'string' ? input.hint3.trim() :
        (typeof input.charada3 === 'string' ? input.charada3.trim() : '');
      topic = typeof input.topic === 'string' ? input.topic.trim() :
        (typeof input.topico === 'string' ? input.topico.trim() : '');
    } else if (typeof input !== 'undefined' && input !== null) {
      console.warn('A palavra da forca deve ser uma string ou um objeto { word, hint, topic }.');
      return null;
    }

    /* Sorteio de qual das dicas disponiveis aparece primeiro na tela (em
       vez de ser sempre a "charada" original). As demais entram no ciclo
       do botao vermelho, comecando pela proxima na ordem sorteada. */
    var hintPool = [hint, hint2, hint3].filter(function (value) {
      return typeof value === 'string' && value.trim();
    });
    if (hintPool.length > 1) {
      var shuffleStart = Math.floor(Math.random() * hintPool.length);
      hintPool = hintPool.slice(shuffleStart).concat(hintPool.slice(0, shuffleStart));
      hint = hintPool[0] || hint;
      hint2 = hintPool[1] || '';
      hint3 = hintPool[2] || '';
    }

    rawWord = rawWord.trim().replace(/\s+/g, ' ');
    if (!rawWord) {
      rawWord = DEFAULT_WORD;
      hint = hint || DEFAULT_HINT;
    }

    var characters = Array.from(rawWord.toLocaleUpperCase('pt-BR'));
    if (characters.length > MAX_WORD_CHARACTERS) {
      console.warn('A palavra da forca excede o limite de ' + MAX_WORD_CHARACTERS + ' caracteres.');
      return null;
    }

    var letters = characters.filter(isLetter);
    if (!letters.length) {
      console.warn('A palavra da forca precisa conter ao menos uma letra.');
      return null;
    }
    if (letters.length > MAX_WORD_LETTERS) {
      console.warn('A palavra da forca excede o limite de ' + MAX_WORD_LETTERS + ' letras jogáveis.');
      return null;
    }

    return {
      word: characters.join(''),
      normalizedWord: letters.map(normalizeLetter).join(''),
      hint: hint,
      hint2: hint2,
      hint3: hint3,
      topic: topic,
      characters: characters,
      letterCount: letters.length,
      isPlaceholder: false
    };
  }

  function buildSlots(slotsGroup, round) {
    clearSlots(slotsGroup);
    var safeLetterCount = Math.max(1, round.letterCount);
    /* Seis letras reproduzem exatamente o desenho aprovado: traço 20 e
       intervalo 8. Acima disso, os dois valores diminuem dentro das mesmas
       160 unidades, sem aumentar o mundo horizontal. */
    var spaceCount = round.characters.filter(function (character) {
      return character === ' ';
    }).length;
    var separatorCount = round.characters.filter(function (character) {
      return character !== '' && character !== ' ' && !isLetter(character);
    }).length;
    var spacingUnits = Math.max(0, round.characters.length - 1) +
      spaceCount * 1.5 + separatorCount * 2;
    var idealGap = Math.max(3, Math.min(
      SLOT_GAP,
      SLOT_GAP * DEFAULT_WORD_LENGTH / safeLetterCount
    ));
    var fittingGap = spacingUnits
      ? (SLOT_AREA_WIDTH - 5 * safeLetterCount) / spacingUnits
      : idealGap;
    var slotGap = Math.max(1.5, Math.min(idealGap, fittingGap));
    var spaceWidth = slotGap * 1.5;
    var separatorWidth = slotGap * 2;
    var characterWidths = round.characters.map(function (character) {
      if (isLetter(character) || character === '') return 0;
      return character === ' ' ? spaceWidth : separatorWidth;
    });
    var reservedCharacterWidth = characterWidths.reduce(function (sum, width) {
      return sum + width;
    }, 0);
    var totalGapWidth = slotGap * Math.max(0, round.characters.length - 1);
    var slotWidth = Math.min(
      REFERENCE_SLOT_WIDTH,
      (SLOT_AREA_WIDTH - reservedCharacterWidth - totalGapWidth) / safeLetterCount
    );
    slotWidth = Math.max(5, slotWidth);
    var cursorX = SLOT_START_X;
    var playableIndex = 0;

    round.characters.forEach(function (character, characterIndex) {
      var characterWidth = characterWidths[characterIndex] || slotWidth;
      if (!isLetter(character) && character !== '') {
        if (character !== ' ') {
          var separator = document.createElementNS(SVG_NS, 'text');
          separator.setAttribute('class', 'hangman-separator');
          separator.setAttribute('x', cursorX + characterWidth / 2);
          separator.setAttribute('y', SLOT_Y + 1);
          separator.setAttribute('fill', SLOT_COLOR);
          separator.setAttribute('font-size', 8);
          separator.setAttribute('font-weight', 700);
          separator.setAttribute('text-anchor', 'middle');
          separator.textContent = character;
          slotsGroup.appendChild(separator);
        }
        cursorX += characterWidth + slotGap;
        return;
      }

      var x1 = cursorX;
      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('class', 'hangman-slot');
      line.setAttribute('pathLength', '1');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', SLOT_Y);
      line.setAttribute('x2', x1 + slotWidth);
      line.setAttribute('y2', SLOT_Y);
      line.setAttribute('stroke', SLOT_COLOR);
      line.setAttribute('stroke-width', SLOT_STROKE_WIDTH);
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('fill', 'none');
      line.setAttribute('data-hangman-piece', DISASSEMBLY_ROW_ORDER[playableIndex] || '');
      line.setAttribute('data-slot-index', playableIndex);
      line.setAttribute('data-character-index', characterIndex);
      if (character) {
        line.setAttribute('data-letter', character);
        line.setAttribute('data-normalized-letter', normalizeLetter(character));
      }
      line.style.strokeDasharray = '1';
      line.style.strokeDashoffset = '1';
      slotsGroup.appendChild(line);

      /* Área transparente mais larga para clique/toque sem engrossar o traço. */
      var hitLine = document.createElementNS(SVG_NS, 'line');
      hitLine.setAttribute('class', 'hangman-slot-hit');
      hitLine.setAttribute('x1', x1);
      hitLine.setAttribute('y1', SLOT_Y);
      hitLine.setAttribute('x2', x1 + slotWidth);
      hitLine.setAttribute('y2', SLOT_Y);
      hitLine.setAttribute('stroke', 'transparent');
      hitLine.setAttribute('stroke-width', 12);
      hitLine.setAttribute('stroke-linecap', 'round');
      hitLine.setAttribute('pointer-events', 'stroke');
      hitLine.setAttribute('data-hangman-piece', DISASSEMBLY_ROW_ORDER[playableIndex] || '');
      hitLine.setAttribute('data-slot-index', playableIndex);
      hitLine.setAttribute('data-character-index', characterIndex);
      hitLine.style.cursor = 'pointer';
      slotsGroup.appendChild(hitLine);
      playableIndex += 1;
      cursorX += characterWidth + slotGap;
    });

    slotsGroup.setAttribute('aria-label', round.hint
      ? round.letterCount + ' letras. Dica: ' + round.hint
      : round.letterCount + ' letras');

    return {
      areaWidth: SLOT_AREA_WIDTH,
      slotWidth: slotWidth,
      slotGap: slotGap,
      travelX: TRAVEL_X,
      cameraX: CAMERA_X,
      gallowsShiftX: 0,
      walkCycles: WALK_CYCLES,
      rowCenters: DISASSEMBLY_ROW_ORDER.map(function (_pieceId, index) {
        var firstCenter = SLOT_START_X + REFERENCE_SLOT_WIDTH / 2;
        var lastCenter = SLOT_START_X + SLOT_AREA_WIDTH - REFERENCE_SLOT_WIDTH / 2;
        return firstCenter + (lastCenter - firstCenter) * index / (DISASSEMBLY_ROW_ORDER.length - 1);
      })
    };
  }

  function getFrames() {
    var data = window.MASCOT_POSES;
    return data && data.frames && data.frames.length ? data.frames : null;
  }

  function applyFrame(parts, frame) {
    frame.order.forEach(function (pieceId) {
      var piece = parts.pieceEls[pieceId];
      if (piece && piece.parentNode) {
        piece.parentNode.appendChild(piece);
      }
    });
    Object.keys(frame.paths).forEach(function (pathId) {
      var pathEl = parts.pathEls[pathId];
      if (pathEl) {
        pathEl.setAttribute('d', frame.paths[pathId]);
      }
    });
  }

  function applyOrder(parts, frame) {
    frame.order.forEach(function (pieceId) {
      var piece = parts.pieceEls[pieceId];
      if (piece && piece.parentNode) {
        piece.parentNode.appendChild(piece);
      }
    });
  }

  function tweenFrame(timeline, parts, frame, frameIndex, duration, explicitPosition) {
    var position = typeof explicitPosition === 'number' ? explicitPosition : timeline.duration();
    /* Muda apenas a ordem visual. Aplicar os paths completos aqui faria a
       pose saltar para o destino antes de o GSAP interpolar o atributo d. */
    timeline.call(function () {
      applyOrder(parts, frame);
    }, null, position);

    Object.keys(frame.paths).forEach(function (pathId) {
      var pathEl = parts.pathEls[pathId];
      if (!pathEl) return;
      timeline.to(pathEl, {
        attr: { d: frame.paths[pathId] },
        duration: duration,
        ease: (frameIndex >= 7 && frameIndex <= 16) ? 'sine.inOut' : 'power2.inOut'
      }, position);
    });

    return position;
  }

  function getHeroShiftPx(parts, cameraX) {
    var rect = parts.svg.getBoundingClientRect();
    var viewBox = parts.svg.viewBox && parts.svg.viewBox.baseVal;
    if (!viewBox || !viewBox.width || !rect.width) return 0;
    return cameraX * (rect.width / viewBox.width);
  }

  function buildTimeline(parts, frames, layout) {
    var gsap = window.gsap;
    var timeline = gsap.timeline({ paused: true });
    var heroShiftPx = getHeroShiftPx(parts, layout.cameraX);

    /* Pose inicial já aplicada de forma síncrona antes de o rig aparecer
       (ver startHangmanGame). Mantemos a pose 0 visível por sua duração
       aprovada antes de iniciar a transição para a pose seguinte. */
    timeline.to({}, { duration: frames[0].duration });

    for (var i = 1; i < WALK_FRAME_INDEXES[0]; i += 1) {
      var frameStart = tweenFrame(timeline, parts, frames[i], i, frames[i].duration);
      if (i === 1) {
        timeline.to(parts.bookShape, {
          attr: { d: BOOK_LOWERED_PATH },
          duration: frames[i].duration,
          ease: 'power2.inOut'
        }, frameStart);
      }
      if (i === STANDING_FRAME_INDEX) {
        timeline.call(function () {
          document.dispatchEvent(new CustomEvent('hangman:standing'));
        });
      }
    }

    var walkStart = timeline.duration();
    var cycleDuration = WALK_FRAME_INDEXES.reduce(function (sum, idx) {
      return sum + frames[idx].duration;
    }, 0);
    var totalWalkDuration = cycleDuration * layout.walkCycles;

    timeline.addLabel('walk-start', walkStart);
    timeline.to(parts.travel, {
      x: layout.travelX,
      duration: totalWalkDuration,
      ease: 'none'
    }, walkStart);
    timeline.to(parts.pageCamera, {
      x: -heroShiftPx,
      duration: totalWalkDuration,
      ease: 'none'
    }, walkStart);

    var topicEl = ensureTopicReveal(heroShiftPx);
    if (topicEl) topicEl.textContent = (activeRound && activeRound.topic) || '';

    /* Os frames da marcha usam o mesmo cursor temporal do deslocamento.
       Antes eles eram inseridos após o tween da câmera, causando o deslize
       estático denunciado por Allan. */
    var walkCursor = walkStart;
    for (var cycle = 0; cycle < layout.walkCycles; cycle += 1) {
      WALK_FRAME_INDEXES.forEach(function (idx) {
        tweenFrame(timeline, parts, frames[idx], idx, frames[idx].duration, walkCursor);
        walkCursor += frames[idx].duration;
      });
    }

    /* Cada espaço surge logo depois que o mascote passa por ele. */
    var slotNodes = Array.prototype.slice.call(parts.slots.querySelectorAll('.hangman-slot'));
    timeline.set(parts.slots, { autoAlpha: 1 }, walkStart);
    var slotAppearTimes = [];
    slotNodes.forEach(function (slot) {
      var slotCenter = (Number(slot.getAttribute('x1')) + Number(slot.getAttribute('x2'))) / 2;
      var passProgress = Math.max(0.12, Math.min(0.98, (slotCenter - 47) / layout.travelX));
      var appearAt = walkStart + totalWalkDuration * passProgress;
      slotAppearTimes.push(appearAt);
      timeline.to(slot, {
        strokeDashoffset: 0,
        duration: 0.2,
        ease: 'power1.out'
      }, appearAt);
    });

    /* Só libera o clique-para-acelerar depois que o segundo espaço vazio
       da palavra aparece na cena -- antes disso o clique (teclado, mouse
       ou toque) não tem efeito nenhum (ver handleFastForwardInput). */
    slotAppearTimes.sort(function (a, b) { return a - b; });
    fastForwardUnlockTime = slotAppearTimes.length >= 2
      ? slotAppearTimes[1] + 0.2
      : 0;

    /* Primeiro termina a passada e assume a pose neutra de chegada. */
    tweenFrame(
      timeline,
      parts,
      frames[WALK_COMPLETE_FRAME_INDEX],
      WALK_COMPLETE_FRAME_INDEX,
      frames[WALK_COMPLETE_FRAME_INDEX].duration,
      walkCursor
    );

    timeline.addLabel('walk-complete');
    timeline.call(function () {
      document.dispatchEvent(new CustomEvent('hangman:walk-complete'));
      document.dispatchEvent(new CustomEvent('hangman:camera-complete'));
    }, null, 'walk-complete');

    /* A forca já está desenhada no mundo desde o começo. Ela não recebe
       fade: entra gradualmente no enquadramento pelo próprio movimento da
       câmera e está completamente revelada quando o mascote termina a
       caminhada. */
    timeline.addLabel('gallows-reveal', 'walk-complete');
    timeline.call(function () {
      document.dispatchEvent(new CustomEvent('hangman:gallows-revealed'));
    }, null, 'gallows-reveal');

    /* O avanço rápido só existe para deixar a caminhada opcional; a partir
       daqui (pose de desmontagem + peças se organizando na fileira) a
       velocidade volta ao normal, mesmo que o jogador tenha acelerado a
       caminhada antes. Assim o "pular intro" não deixa o resto da cena
       (e, por tabela, nada que comece depois) correndo mais rápido. */
    timeline.call(function () {
      if (activeTimeline) activeTimeline.timeScale(1);
      detachFastForwardControls();
    }, null, 'gallows-reveal');

    for (var j = WALK_COMPLETE_FRAME_INDEX + 1; j < frames.length; j += 1) {
      tweenFrame(timeline, parts, frames[j], j, frames[j].duration);
    }

    /* Depois da pose de desmontagem, cada uma das seis peças lógicas vai
       para o campo correspondente. Os valores são calculados somente quando
       este trecho começa, portanto getBBox() já lê as formas finais da pose
       23. Cotovelos e joelhos continuam dentro dos grupos de braço/perna.
       Todas as peças terminam com o centro na mesma altura do laço. */
    var rowTargets = activeGallowsPose.order.map(function (pieceId) {
      return parts.pieceEls[pieceId];
    });
    /* Distribui os centros conforme a largura real de cada grupo, em vez de
       usar seis posições fixas. Isso mantém uma folga visível entre peças. */
    var rowGap = 9;
    var rowWidths = rowTargets.map(function (piece) {
      var box = piece.getBBox();
      return Math.max(10, box.width);
    });
    var rowTotalWidth = rowWidths.reduce(function (sum, width) { return sum + width; }, 0) +
      rowGap * Math.max(0, rowWidths.length - 1);
    var rowCursor = SLOT_START_X + SLOT_AREA_WIDTH / 2 - rowTotalWidth / 2;
    layout.rowCenters = rowWidths.map(function (width) {
      var center = rowCursor + width / 2;
      rowCursor += width + rowGap;
      return center;
    });
    var settleOvershoot = prefersReducedMotion() ? 0.5 : 1.5;
    timeline.addLabel('pieces-row');
    timeline.to(rowTargets, {
      x: function (index, piece) {
        var box = piece.getBBox();
        return layout.rowCenters[index] - layout.travelX - (box.x + box.width / 2);
      },
      y: function (index, piece) {
        var box = piece.getBBox();
        return PIECE_ROW_CENTER_Y - (box.y + box.height / 2) - settleOvershoot;
      },
      /* O deslocamento mantém o ritmo original; só antecipamos o início
         para não existir um intervalo vazio após a desmontagem. */
      duration: 0.8,
      stagger: 0.08,
      ease: 'power2.inOut'
    }, 'pieces-row');

    timeline.to(rowTargets, {
      y: '+=' + settleOvershoot,
      duration: 0.45,
      stagger: 0.08,
      ease: 'back.out(1.4)'
    }, '>-0.05');

    timeline.call(function () {
      detachFastForwardControls();
      /* Reforco de seguranca: garante que as pecas flutuando comecem
         sempre em velocidade normal, mesmo que o avanco rapido da
         caminhada nao tenha sido desfeito antes por algum motivo. */
      if (activeTimeline) activeTimeline.timeScale(1);
      startFloatingPieces(rowTargets);
      document.dispatchEvent(new CustomEvent('hangman:sequence-complete'));
    });

    return timeline;
  }

  function resetPose(parts, frames) {
    var gsap = window.gsap;

    unlockPageScroll();
    detachFastForwardControls();
    stopFloatingPieces();
    activeParts = parts;
    releaseMobileLandscapeMode();
    removeExitControl();

    if (activeTimeline) {
      activeTimeline.timeScale(1);
      activeTimeline.kill();
      activeTimeline = null;
    }

    if (parts.hero) {
      parts.hero.classList.remove('hangman-active');
    }
    if (parts.floatingCard) {
      gsap.set(parts.floatingCard, { autoAlpha: 1, y: 0 });
      parts.floatingCard.style.animation = '';
    }

    gsap.set([parts.world, parts.travel, parts.book, parts.pageCamera], { x: 0 });
    gsap.set(parts.gallows, { x: 0 });
    gsap.set(parts.gallows, { rotation: 0, transformOrigin: '290px 194px' });
    activeRound = null;
    hideTopicReveal();

    if (frames && frames[0]) {
      applyFrame(parts, frames[0]);
    }

    gsap.set(PIECE_IDS.map(function (pieceId) {
      return parts.pieceEls[pieceId];
    }), { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });

    gsap.set(parts.rig, { autoAlpha: 0 });
    gsap.set(parts.restCharacter, { autoAlpha: 1 });
    gsap.set(parts.book, { autoAlpha: 0 });
    gsap.set(parts.bookShape, { attr: { d: BOOK_INITIAL_PATH } });

    gsap.set(parts.slots, { autoAlpha: 0 });
    clearSlots(parts.slots);
    gsap.set(parts.gallows, { autoAlpha: 1 });
    gsap.set(parts.gallowsStrokes, {
      strokeDasharray: 1,
      strokeDashoffset: 0
    });
    document.dispatchEvent(new CustomEvent('hangman:reset'));
  }

  function startHangmanGame(options) {
    var gsap = window.gsap;
    ensurePageCamera();
    var parts = collectParts();
    var frames = getFrames();
    var round = createRound(options);

    var requestedPose = options && typeof options === 'object' ? options.gallowsPose : null;
    var poseIndex = Number.isInteger(Number(requestedPose)) ? Number(requestedPose) : Math.floor(Math.random() * GALLOWS_POSES.length);
    activeGallowsPose = GALLOWS_POSES[Math.max(0, Math.min(GALLOWS_POSES.length - 1, poseIndex))];

    if (!gsap) {
      console.warn('A animação da forca aguarda o carregamento do GSAP.');
      return null;
    }
    if (!frames) {
      console.warn('A animação da forca não encontrou os dados das 23 poses aprovadas (mascote-pose-data.js).');
      return null;
    }
    if (!round) return null;
    if (!hasCompleteRig(parts)) {
      console.warn('A animação da forca não encontrou o rig completo do mascote no index.html.');
      return null;
    }

    resetPose(parts, frames);
    lockPageScroll();
    activeRound = round;
    var layout = buildSlots(parts.slots, round);
    gsap.set(parts.gallows, { x: layout.gallowsShiftX });
    document.dispatchEvent(new CustomEvent('hangman:round-ready', {
      detail: {
        word: round.word,
        normalizedWord: round.normalizedWord,
        hint: round.hint,
        hint2: round.hint2,
        hint3: round.hint3,
        topic: round.topic,
        letterCount: round.letterCount,
        isPlaceholder: round.isPlaceholder,
        gallowsPose: poseIndex,
        gallowsPoseName: activeGallowsPose.name,
        gallowsOrder: activeGallowsPose.order.slice()
      }
    }));

    if (parts.hero) {
      parts.hero.classList.add('hangman-active');
    }
    if (parts.floatingCard) {
      /* Desce e sai da tela, em vez de sumir com fade. A animacao CSS
         "float" (styles.css) tambem mexe no transform em loop infinito,
         entao precisa ser neutralizada antes, senao ela briga com o
         GSAP e o card fica tremendo em vez de deslizar liso. */
      parts.floatingCard.style.animation = 'none';
      var floatingCardRect = parts.floatingCard.getBoundingClientRect();
      var floatingCardTravel = Math.max(
        window.innerHeight - floatingCardRect.top + 80,
        floatingCardRect.height + 80
      );
      gsap.to(parts.floatingCard, {
        y: floatingCardTravel,
        duration: 0.5,
        ease: 'power2.in',
        overwrite: true
      });
    }

    /* Troca instantânea entre a silhueta original e o rig aprovado.
       A pose 0 (sentado lendo) reproduz a mesma silhueta do mascote
       original, então a troca não gera flash nem duplicação visível. */
    gsap.set(parts.restCharacter, { autoAlpha: 0 });
    gsap.set(parts.rig, { autoAlpha: 1 });
    gsap.set(parts.book, { autoAlpha: 1 });

    activeTimeline = buildTimeline(parts, frames, layout);
    activeTimeline.timeScale(1);
    showExitControl();
    playTimelineWithMobileLandscape();
    return activeTimeline;
  }

  /* Sorteio duplo: primeiro sorteia o TOPICO (cada topico tem a mesma
     chance, nao importa quantas palavras ele tenha), depois sorteia a
     PALAVRA dentro do topico sorteado. O resultado ja vem com
     {palavra, charada, topico}, prontos pro createRound() usar como as
     duas dicas do round (topico + charada). */
  function loadWordBank() {
    if (wordBankPromise) return wordBankPromise;
    if (typeof fetch !== 'function') {
      wordBankCache = OFFLINE_FALLBACK_BANK.slice();
      wordBankPromise = Promise.resolve(wordBankCache);
      return wordBankPromise;
    }
    wordBankPromise = fetch(WORD_BANK_URL)
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        wordBankCache = Array.isArray(data) ? data : [];
        return wordBankCache;
      })
      .catch(function (err) {
        console.warn('A forca não conseguiu carregar ' + WORD_BANK_URL + ' (usando banco reserva offline):', err);
        wordBankCache = OFFLINE_FALLBACK_BANK.slice();
        return wordBankCache;
      });
    return wordBankPromise;
  }

  // Pre-carrega assim que o script roda, pra o banco ja estar pronto
  // quando o sorteio acontecer de verdade (evita esperar o fetch bem
  // na hora do clique que dispara o jogo).
  loadWordBank();

  function drawRandomWord(bank) {
    if (!bank || !bank.length) return null;
    var topics = [];
    bank.forEach(function (entry) {
      if (entry && entry.topico && topics.indexOf(entry.topico) === -1) {
        topics.push(entry.topico);
      }
    });
    if (!topics.length) return null;

    var sorteioTopico = topics[Math.floor(Math.random() * topics.length)];
    var palavrasDoTopico = bank.filter(function (entry) {
      return entry && entry.topico === sorteioTopico;
    });
    if (!palavrasDoTopico.length) return null;

    return palavrasDoTopico[Math.floor(Math.random() * palavrasDoTopico.length)];
  }

  function startRandomHangmanGame(options) {
    if (wordBankCache) {
      var sorteio = drawRandomWord(wordBankCache);
      return startHangmanGame(sorteio || options);
    }
    // Banco ainda carregando (raro, ja que o pre-carregamento comeca no
    // load do script): espera o fetch terminar e so entao inicia.
    loadWordBank().then(function (bank) {
      var sorteio = drawRandomWord(bank);
      startHangmanGame(sorteio || options);
    });
    return null;
  }

  function resetHangmanAnimation() {
    if (!window.gsap) return;
    ensurePageCamera();
    var parts = collectParts();
    var frames = getFrames();
    if (!hasCompleteRig(parts)) return;
    resetPose(parts, frames);
  }

  window.startHangmanGame = startHangmanGame;
  window.startRandomHangmanGame = startRandomHangmanGame;
  window.resetHangmanAnimation = resetHangmanAnimation;
  window.HangmanAnimation = {
    start: startHangmanGame,
    startRandom: startRandomHangmanGame,
    reset: resetHangmanAnimation,
    reactPiece: reactFloatingPiece,
    celebratePieces: function () { return animateFloatingMood('celebrate'); },
    fearAndHangPiece: fearAndHangPiece,
    hangPiece: movePieceToGallows,
    unlockScroll: unlockPageScroll,
    getRound: function () {
      if (!activeRound) return null;
      return {
        word: activeRound.word,
        normalizedWord: activeRound.normalizedWord,
        hint: activeRound.hint,
        hint2: activeRound.hint2,
        hint3: activeRound.hint3,
        topic: activeRound.topic,
        letterCount: activeRound.letterCount,
        isPlaceholder: activeRound.isPlaceholder,
        gallowsPose: GALLOWS_POSES.indexOf(activeGallowsPose),
        gallowsPoseName: activeGallowsPose.name,
        gallowsOrder: activeGallowsPose.order.slice()
      };
    },
    getTimeline: function () { return activeTimeline; },
    isActive: function () { return !!activeRound; }
  };

})();
