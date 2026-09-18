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
      var row = Object.assign(
        {
          id: id,
          game: game,
          trigger: trigger,
          visitor_id: getVisitorId()
        },
        extra || {}
      );
      c.from('game_sessions')
        .insert(row)
        .then(function () {}, function () {});
    }
    return id;
  }

  function finishSession(sessionId, patch) {
    if (!sessionId) return;
    var c = getClient();
    if (!c) return;
    var update = Object.assign({ finished_at: new Date().toISOString() }, patch || {});
    c.from('game_sessions')
      .update(update)
      .eq('id', sessionId)
      .then(function () {}, function () {});
  }

  window.GameAnalytics = {
    startSession: startSession,
    finishSession: finishSession
  };
})();
