/* =========================================================================
   Analytics dos minigames (easter eggs). Grava no Supabase quando cada
   partida comeca e quando termina, para alimentar a aba "Analytics (jogos)"
   do painel admin.

   Uso (chamado de dentro de game-trigger.js):
     var id = GameAnalytics.startSession('forca', 'fundo');
     GameAnalytics.finishSession(id, { outcome: 'concluido' });

   Se o Supabase nao estiver disponivel (offline, script bloqueado etc.),
   as funcoes nao quebram nada -- so deixam de gravar.
   ========================================================================= */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://fesejrbindspzafiyssm.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_mGEU6ouQVdIt1G97ENAq_w_tX8uknCK';
  var VISITOR_STORAGE_KEY = 'sde_visitor_id';

  var client = null;
  function getClient() {
    if (!client && window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      } catch (e) {
        client = null;
      }
    }
    return client;
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'id-' + Date.now().toString(16) + '-' + Math.random().toString(16).slice(2);
  }

  function getVisitorId() {
    try {
      var id = window.localStorage.getItem(VISITOR_STORAGE_KEY);
      if (!id) {
        id = makeId();
        window.localStorage.setItem(VISITOR_STORAGE_KEY, id);
      }
      return id;
    } catch (e) {
      // localStorage bloqueado (modo privado etc.) -- usa um id só desta execucao.
      return 'sessao-' + makeId();
    }
  }

  function startSession(game, trigger, extra) {
    var id = makeId();
    var c = getClient();
    if (c) {
      // Escrita por funcao (rpc), nao direto na tabela: o visitante do site
      // nao tem -- e nao pode ter -- permissao nenhuma em game_sessions, se
      // nao qualquer um com a chave publicavel leria a base de partidas.
      // Ver sql/003_rls_admin_exige_totp.sql.
      //
      // O parametro p_trigger vai para a coluna trigger_source. Ate 09/2026
      // este campo era enviado como "trigger", nome que nao existe na tabela,
      // e o insert falhava calado -- nenhuma partida chegou a ser gravada.
      c.rpc('registrar_partida', {
        p_id: id,
        p_game: game,
        p_trigger: trigger,
        p_visitor: getVisitorId()
      }).then(function () {}, function () {});
    }
    return id;
  }

  function finishSession(sessionId, patch) {
    if (!sessionId) return;
    var c = getClient();
    if (!c) return;
    c.rpc('finalizar_partida', {
      p_id: sessionId,
      p_outcome: (patch && patch.outcome) || 'concluido'
    }).then(function () {}, function () {});
  }

  window.GameAnalytics = {
    startSession: startSession,
    finishSession: finishSession
  };
})();
