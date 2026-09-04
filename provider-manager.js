(function(){
  'use strict';

  const META_STORAGE_KEY = 'se_api_provider_metadata_v1';
  const EDGE_FUNCTION = 'ai-provider-router';
  const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
  const ALL_KEYS = '__all__';
  const AUTO_MODEL = '__auto__';
  const RETRYABLE = new Set(['quota', 'auth', 'permission', 'model', 'temporary', 'network']);

  const PROVIDERS = {
    google: { name:'Google AI', baseUrl:'https://generativelanguage.googleapis.com/v1beta', protocol:'google' },
    openai: { name:'OpenAI', baseUrl:'https://api.openai.com/v1', protocol:'openai' },
    anthropic: { name:'Anthropic', baseUrl:'https://api.anthropic.com/v1', protocol:'anthropic' },
    openrouter: { name:'OpenRouter', baseUrl:'https://openrouter.ai/api/v1', protocol:'openai' },
    groq: { name:'Groq', baseUrl:'https://api.groq.com/openai/v1', protocol:'openai' },
    mistral: { name:'Mistral AI', baseUrl:'https://api.mistral.ai/v1', protocol:'openai' },
    xai: { name:'xAI', baseUrl:'https://api.x.ai/v1', protocol:'openai' },
    deepseek: { name:'DeepSeek', baseUrl:'https://api.deepseek.com/v1', protocol:'openai' },
    together: { name:'Together AI', baseUrl:'https://api.together.xyz/v1', protocol:'openai' },
    perplexity: { name:'Perplexity', baseUrl:'https://api.perplexity.ai', protocol:'openai' },
    fireworks: { name:'Fireworks AI', baseUrl:'https://api.fireworks.ai/inference/v1', protocol:'openai' },
    cohere: { name:'Cohere', baseUrl:'https://api.cohere.com/v2', protocol:'cohere' },
    huggingface: { name:'Hugging Face', baseUrl:'https://router.huggingface.co/v1', protocol:'openai' },
    custom: { name:'Compatível com OpenAI', baseUrl:'', protocol:'openai' },
    unknown: { name:'Provedor não identificado', baseUrl:'', protocol:'unknown' }
  };

  let client = null;
  let settings = {};
  let keys = [];
  let metadata = loadMetadata();
  let ready = false;
  let lastSuccess = null;
  let decisionResolver = null;
  let decisionReturnFocus = null;

  function byId(id){ return document.getElementById(id); }
  function escapeHtml(value){
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function(ch){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[ch];
    });
  }
  function loadMetadata(){
    try{ return JSON.parse(localStorage.getItem(META_STORAGE_KEY) || '{}') || {}; }
    catch(_err){ return {}; }
  }
  function saveMetadata(){
    try{ localStorage.setItem(META_STORAGE_KEY, JSON.stringify(metadata)); }
    catch(_err){}
  }
  function nowIso(){ return new Date().toISOString(); }
  function formatDate(iso){
    if(!iso) return 'Ainda não verificado';
    try{ return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(iso)); }
    catch(_err){ return 'Data indisponível'; }
  }
  function maskKey(value){
    if(!value || value.length < 9) return '••••••••';
    return value.slice(0,4) + '••••••••' + value.slice(-4);
  }
  function providerInfo(id){ return PROVIDERS[id] || PROVIDERS.unknown; }
  function normalizeBaseUrl(value){ return String(value || '').trim().replace(/\/+$/,''); }
  function providerFromHost(baseUrl){
    if(!baseUrl) return '';
    try{
      const host = new URL(baseUrl).hostname.toLowerCase();
      if(host.includes('googleapis.com')) return 'google';
      if(host.includes('openai.com')) return 'openai';
      if(host.includes('anthropic.com')) return 'anthropic';
      if(host.includes('openrouter.ai')) return 'openrouter';
      if(host.includes('groq.com')) return 'groq';
      if(host.includes('mistral.ai')) return 'mistral';
      if(host.includes('x.ai')) return 'xai';
      if(host.includes('deepseek.com')) return 'deepseek';
      if(host.includes('together.xyz')) return 'together';
      if(host.includes('perplexity.ai')) return 'perplexity';
      if(host.includes('fireworks.ai')) return 'fireworks';
      if(host.includes('cohere.com')) return 'cohere';
      if(host.includes('huggingface.co')) return 'huggingface';
      return 'custom';
    }catch(_err){ return ''; }
  }
  function detectProvider(keyValue, baseUrl){
    const byHost = providerFromHost(baseUrl);
    if(byHost) return byHost;
    const value = String(keyValue || '').trim();
    if(/^AIza[\w-]{20,}$/i.test(value)) return 'google';
    if(/^sk-ant-/i.test(value)) return 'anthropic';
    if(/^sk-or-v1-/i.test(value)) return 'openrouter';
    if(/^gsk_/i.test(value)) return 'groq';
    if(/^xai-/i.test(value)) return 'xai';
    if(/^hf_/i.test(value)) return 'huggingface';
    if(/^co[_-]/i.test(value)) return 'cohere';
    if(/^sk-(proj-|svcacct-)?/i.test(value)) return 'openai';
    return 'unknown';
  }
  function modelType(modelId, methods){
    const id = String(modelId || '').toLowerCase();
    const joined = (methods || []).join(' ').toLowerCase();
    if(/image|imagen|dall-e|flux|recraft|stable.?diffusion|sdxl|ideogram/.test(id) || /predict|image/.test(joined)) return 'imagem';
    if(/embedding|moderation|rerank|whisper|transcri|speech|tts|audio|realtime|live/.test(id)) return 'outro';
    return 'texto';
  }
  function normalizeModels(items){
    const map = new Map();
    (items || []).forEach(function(item){
      const rawId = typeof item === 'string' ? item : (item.id || item.name || item.model || '');
      const id = String(rawId).replace(/^models\//,'').trim();
      if(!id) return;
      const methods = item.supportedGenerationMethods || item.methods || [];
      const type = item.type || modelType(id, methods);
      if(type === 'outro') return;
      map.set(id, { id:id, type:type, label:item.displayName || item.label || id });
    });
    return Array.from(map.values()).sort(function(a,b){
      return a.type.localeCompare(b.type) || a.label.localeCompare(b.label, 'pt-BR');
    });
  }
  function classifyError(error){
    if(error && error.category) return error.category;
    const status = Number(error && error.status) || 0;
    const message = String(error && error.message || '').toLowerCase();
    if(status === 401 || /invalid.*key|api key.*invalid|unauth/.test(message)) return 'auth';
    if(status === 403 || /permission|forbidden|not allowed/.test(message)) return 'permission';
    if(status === 404 || /model.*not found|model.*unavailable/.test(message)) return 'model';
    if(status === 429 || /quota|rate limit|resource_exhausted|billing/.test(message)) return 'quota';
    if(status >= 500 || /temporar|timeout|overloaded|unavailable/.test(message)) return 'temporary';
    if(/failed to fetch|network|cors/.test(message)) return 'network';
    if(/safety|blocked|policy|content/.test(message)) return 'content';
    if(status === 400 || /invalid argument|parameter|prompt/.test(message)) return 'request';
    return 'unknown';
  }
  function categoryMessage(category){
    return ({
      auth:'a chave foi recusada', permission:'a chave não tem permissão para esse modelo',
      model:'o modelo não está disponível', quota:'a cota ou o limite da chave foi atingido',
      temporary:'o provedor está temporariamente indisponível', network:'não foi possível alcançar o provedor',
      content:'o conteúdo foi bloqueado pelo provedor', request:'os parâmetros ou o prompt foram recusados',
      unknown:'ocorreu um erro não identificado'
    })[category] || 'ocorreu um erro';
  }
  function createApiError(message, status, category){
    const error = new Error(message || 'Falha na API.');
    error.status = status || 0;
    error.category = category || classifyError(error);
    return error;
  }
  async function jsonRequest(url, options){
    let response;
    try{ response = await fetch(url, options); }
    catch(_err){ throw createApiError('Não foi possível alcançar o provedor.', 0, 'network'); }
    let data = null;
    try{ data = await response.json(); }catch(_err){}
    if(!response.ok){
      const safeMessage = data && data.error && (data.error.message || data.error.type) || data && data.message || ('Erro HTTP ' + response.status);
      throw createApiError(safeMessage, response.status);
    }
    return data || {};
  }
  function getMeta(key){
    const stored = metadata[key.id] || {};
    const provider = key.provider || stored.provider || detectProvider(key.key, key.baseUrl || stored.baseUrl);
    return {
      provider:provider,
      baseUrl:normalizeBaseUrl(key.baseUrl || stored.baseUrl || providerInfo(provider).baseUrl),
      models:normalizeModels(key.models || stored.models || []),
      checkedAt:key.modelsCheckedAt || stored.checkedAt || '',
      note:stored.note || ''
    };
  }
  function setMeta(keyId, patch){
    metadata[keyId] = Object.assign({}, metadata[keyId] || {}, patch);
    saveMetadata();
  }
  async function refreshKeys(){
    const result = await client.from('gemini_api_keys').select('*').order('created_at');
    if(result.error) throw createApiError('Não foi possível carregar as API Keys.', 0, 'network');
    keys = (result.data || []).map(function(row){
      const rowModels = Array.isArray(row.models_cache) ? row.models_cache : [];
      return {
        id:row.id, label:row.label || 'API Key', key:row.api_key || '', active:row.active !== false,
        provider:row.provider || '', baseUrl:row.base_url || '', models:rowModels,
        modelsCheckedAt:row.models_checked_at || '', createdAt:row.created_at || ''
      };
    });
    return keys;
  }
  async function updateDbMetadata(key, meta){
    const payload = {
      provider:meta.provider, base_url:meta.baseUrl || null, key_mask:maskKey(key.key),
      models_cache:meta.models || [], models_checked_at:meta.checkedAt || null
    };
    try{ await client.from('gemini_api_keys').update(payload).eq('id', key.id); }catch(_err){}
  }
  function isMockMode(){
    try{ return new URLSearchParams(location.search).get('mockProviders') === '1'; }
    catch(_err){ return false; }
  }
  function mockModels(provider){
    if(provider === 'google') return normalizeModels([
      {id:'gemini-3.6-flash',type:'texto'}, {id:'gemini-3.1-flash-image',type:'imagem'}
    ]);
    if(provider === 'anthropic') return normalizeModels([{id:'claude-sonnet',type:'texto'}]);
    return normalizeModels([{id:'modelo-texto-disponivel',type:'texto'},{id:'modelo-imagem-disponivel',type:'imagem'}]);
  }
  async function invokeEdge(action, body){
    if(isMockMode()) return null;
    try{
      const response = await client.functions.invoke(EDGE_FUNCTION, { body:Object.assign({action:action},body) });
      if(response && !response.error && response.data && response.data.ok) return response.data;
      return null;
    }catch(_err){ return null; }
  }
  async function listModelsDirect(key, meta){
    const provider = meta.provider;
    const info = providerInfo(provider);
    const baseUrl = normalizeBaseUrl(meta.baseUrl || info.baseUrl);
    if(provider === 'unknown' || !baseUrl) throw createApiError('Informe um endpoint compatível para identificar esse provedor.', 0, 'request');
    if(provider === 'google'){
      const data = await jsonRequest(baseUrl + '/models?pageSize=1000', { headers:{'x-goog-api-key':key.key} });
      return normalizeModels(data.models || []);
    }
    if(provider === 'anthropic'){
      const data = await jsonRequest(baseUrl + '/models?limit=1000', { headers:{'x-api-key':key.key,'anthropic-version':'2023-06-01'} });
      return normalizeModels(data.data || []);
    }
    if(provider === 'cohere'){
      const data = await jsonRequest(baseUrl + '/models', { headers:{Authorization:'Bearer ' + key.key} });
      return normalizeModels(data.models || data.data || []);
    }
    const data = await jsonRequest(baseUrl + '/models', { headers:{Authorization:'Bearer ' + key.key} });
    return normalizeModels(data.data || data.models || []);
  }
  async function verifyKeyModels(key, notify){
    const current = getMeta(key);
    const detected = detectProvider(key.key, current.baseUrl);
    const provider = detected !== 'unknown' ? detected : current.provider;
    const baseUrl = current.baseUrl || providerInfo(provider).baseUrl;
    let models;
    if(isMockMode()){
      models = mockModels(provider);
    }else{
      const edge = await invokeEdge('listModels',{keyId:key.id,provider:provider,baseUrl:baseUrl});
      models = edge ? normalizeModels(edge.models || []) : await listModelsDirect(key,{provider:provider,baseUrl:baseUrl});
    }
    const meta = {provider:provider,baseUrl:baseUrl,models:models,checkedAt:nowIso(),note:''};
    setMeta(key.id, meta);
    await updateDbMetadata(key, meta);
    if(notify) showToast('Modelos atualizados para “' + key.label + '”.','ok');
    return meta;
  }
  async function verifyOne(key, notify){
    try{ return await verifyKeyModels(key, notify); }
    catch(error){
      const meta = getMeta(key);
      meta.checkedAt = nowIso();
      meta.note = categoryMessage(classifyError(error));
      setMeta(key.id, meta);
      if(notify) showToast('Não foi possível verificar “' + key.label + '”: ' + meta.note + '.','error');
      return meta;
    }
  }
  async function verifyAll(notify){
    const button = byId('btnVerifyModels');
    if(button) button.disabled = true;
    const selectedId = byId('keySelect') && byId('keySelect').value;
    const selected = selectedId ? keys.filter(function(k){ return k.id === selectedId; }) : keys.slice();
    for(const key of selected.length ? selected : keys){ await verifyOne(key, notify); }
    renderAll();
    if(button) button.disabled = false;
  }
  function keyDisplay(key){
    const meta = getMeta(key);
    return key.label + ' · ' + providerInfo(meta.provider).name + ' · ' + maskKey(key.key);
  }
  function renderKeyList(){
    const select = byId('keySelect');
    const list = byId('keyList');
    const current = settings.active_key_id || (keys[0] && keys[0].id) || '';
    select.innerHTML = '';
    list.innerHTML = '';
    if(!keys.length){
      select.innerHTML = '<option value="">Nenhuma key cadastrada</option>';
      list.innerHTML = '<p class="admin-desc" style="margin:0;">Nenhuma API Key cadastrada ainda.</p>';
      return;
    }
    keys.forEach(function(key){
      const meta = getMeta(key);
      const option = document.createElement('option');
      option.value = key.id;
      option.textContent = keyDisplay(key);
      option.selected = key.id === current;
      select.appendChild(option);
      const row = document.createElement('div');
      row.className = 'key-row' + (key.id === current ? ' active' : '');
      row.innerHTML =
        '<span class="key-label">' + escapeHtml(key.label) + '</span>' +
        '<span class="key-masked">' + escapeHtml(maskKey(key.key)) + '</span>' +
        '<span class="key-active-pill">' + escapeHtml(providerInfo(meta.provider).name) + '</span>' +
        '<span class="key-masked">' + meta.models.length + ' modelo(s)</span>' +
        '<span class="key-actions">' +
          '<button class="abtn small secondary" data-verify-key="' + escapeHtml(key.id) + '" type="button">Verificar</button>' +
          '<button class="abtn small ghost" data-remove-key="' + escapeHtml(key.id) + '" type="button">Remover</button>' +
        '</span>';
      list.appendChild(row);
    });
    list.querySelectorAll('[data-verify-key]').forEach(function(button){
      button.addEventListener('click', async function(){
        const key = keys.find(function(item){ return item.id === button.dataset.verifyKey; });
        if(key){ button.disabled = true; await verifyOne(key,true); renderAll(); }
      });
    });
    list.querySelectorAll('[data-remove-key]').forEach(function(button){
      button.addEventListener('click', async function(){
        const id = button.dataset.removeKey;
        if(!confirm('Remover esta API Key?')) return;
        const result = await client.from('gemini_api_keys').delete().eq('id',id);
        if(result.error){ showToast('Não foi possível remover a API Key.','error'); return; }
        delete metadata[id]; saveMetadata();
        await refreshKeys(); renderAll();
      });
    });
  }
  function modelsForKeys(keyIds, type){
    const map = new Map();
    keys.filter(function(k){ return !keyIds || keyIds.includes(k.id); }).forEach(function(key){
      getMeta(key).models.filter(function(model){ return model.type === type; }).forEach(function(model){
        if(!map.has(model.id)) map.set(model.id,model);
      });
    });
    return Array.from(map.values()).sort(function(a,b){ return a.label.localeCompare(b.label,'pt-BR'); });
  }
  function renderGeneratorOptions(){
    const keySelect = byId('genKeySelect');
    const modelSelect = byId('genModelSelect');
    const type = byId('genType').value;
    const previousKey = keySelect.value || ALL_KEYS;
    const previousModel = modelSelect.value || AUTO_MODEL;
    keySelect.innerHTML = '<option value="' + ALL_KEYS + '">Todos</option>';
    keys.forEach(function(key){
      const option = document.createElement('option'); option.value=key.id; option.textContent=keyDisplay(key); keySelect.appendChild(option);
    });
    keySelect.value = keys.some(function(k){return k.id===previousKey;}) ? previousKey : ALL_KEYS;
    const selectedIds = keySelect.value === ALL_KEYS ? null : [keySelect.value];
    const models = modelsForKeys(selectedIds,type);
    modelSelect.innerHTML = '<option value="' + AUTO_MODEL + '">Automático (melhor disponível)</option>';
    models.forEach(function(model){
      const option=document.createElement('option'); option.value=model.id; option.textContent=model.label; modelSelect.appendChild(option);
    });
    modelSelect.value = models.some(function(m){return m.id===previousModel;}) ? previousModel : AUTO_MODEL;
    renderSelectionSummary();
  }
  function renderSelectionSummary(){
    const keyId = byId('genKeySelect').value;
    const modelId = byId('genModelSelect').value;
    const type = byId('genType').value;
    const keyText = keyId === ALL_KEYS ? 'todas as chaves compatíveis' : keyDisplay(keys.find(function(k){return k.id===keyId;}) || {label:'Nenhuma',key:''});
    const modelText = modelId === AUTO_MODEL ? 'seleção automática' : modelId;
    byId('genSelectionSummary').innerHTML = '<strong>' + (type === 'imagem' ? 'Imagem' : 'Texto') + '</strong> · ' + escapeHtml(keyText) + ' · ' + escapeHtml(modelText);
  }
  function renderCatalog(){
    const catalog = byId('providerModelCatalog');
    catalog.innerHTML = '';
    if(!keys.length){ catalog.innerHTML='<p class="admin-desc">Cadastre uma API Key para visualizar modelos.</p>'; return; }
    keys.forEach(function(key){
      const meta = getMeta(key);
      const card = document.createElement('div'); card.className='provider-card';
      const tags = meta.models.length ? meta.models.map(function(model){
        return '<span class="model-tag ' + (model.type === 'imagem' ? 'image' : '') + '">' + escapeHtml(model.label) + ' · ' + (model.type === 'imagem' ? 'imagem' : 'texto') + '</span>';
      }).join('') : '<span class="provider-card-meta">Nenhum modelo verificado.</span>';
      card.innerHTML = '<div class="provider-card-head"><div><div class="provider-card-title">' + escapeHtml(key.label) + '</div><div class="provider-card-meta">' + escapeHtml(providerInfo(meta.provider).name) + ' · ' + escapeHtml(maskKey(key.key)) + '</div></div><div class="provider-card-meta">' + escapeHtml(formatDate(meta.checkedAt)) + '</div></div><div class="model-tags">' + tags + '</div>' + (meta.note ? '<div class="provider-card-meta" style="margin-top:8px;">' + escapeHtml(meta.note) + '</div>' : '');
      catalog.appendChild(card);
    });
    const latest = keys.map(function(k){return getMeta(k).checkedAt;}).filter(Boolean).sort().pop();
    byId('modelsLastChecked').textContent = latest ? 'Última verificação: ' + formatDate(latest) : 'Modelos ainda não verificados';
  }
  function renderAll(){ renderKeyList(); renderGeneratorOptions(); renderCatalog(); }
  function showToast(message, tone){
    const region = byId('providerToastRegion');
    const toast = document.createElement('div');
    toast.className = 'provider-toast ' + (tone || '');
    toast.setAttribute('role', tone === 'error' ? 'alert' : 'status');
    toast.textContent = message;
    region.appendChild(toast);
    setTimeout(function(){ toast.remove(); }, 6500);
  }
  function closeDecision(value){
    const modal = byId('providerDecisionModal');
    modal.hidden = true;
    document.removeEventListener('keydown',trapDecisionKeys,true);
    if(decisionReturnFocus && decisionReturnFocus.focus) decisionReturnFocus.focus();
    const resolve = decisionResolver; decisionResolver=null; decisionReturnFocus=null;
    if(resolve) resolve(value);
  }
  function trapDecisionKeys(event){
    const modal=byId('providerDecisionModal'); if(modal.hidden) return;
    if(event.key === 'Escape'){ event.preventDefault(); closeDecision(false); return; }
    if(event.key !== 'Tab') return;
    const focusable=[byId('providerDecisionNo'),byId('providerDecisionYes')];
    const index=focusable.indexOf(document.activeElement);
    if(event.shiftKey && index <= 0){ event.preventDefault(); focusable[1].focus(); }
    else if(!event.shiftKey && index === focusable.length-1){ event.preventDefault(); focusable[0].focus(); }
  }
  function askForFailover(type, category){
    const modal=byId('providerDecisionModal');
    decisionReturnFocus=document.activeElement;
    byId('providerDecisionMessage').textContent='A geração de ' + (type === 'imagem' ? 'imagem' : 'texto') + ' falhou porque ' + categoryMessage(category) + '. Posso procurar outra API Key ou outro modelo compatível?';
    modal.hidden=false;
    document.addEventListener('keydown',trapDecisionKeys,true);
    setTimeout(function(){byId('providerDecisionYes').focus();},0);
    return new Promise(function(resolve){ decisionResolver=resolve; });
  }
  function cloneWithoutListeners(id){
    const oldNode=byId(id); if(!oldNode) return null;
    const clone=oldNode.cloneNode(true); oldNode.replaceWith(clone); return clone;
  }
  async function addKey(){
    const value=byId('newKeyValue').value.trim();
    const label=byId('newKeyLabel').value.trim() || ('Key ' + (keys.length+1));
    const baseUrl=normalizeBaseUrl(byId('newKeyBaseUrl').value);
    const provider=detectProvider(value,baseUrl);
    const status=byId('keyStatus');
    if(!value){ status.textContent='Cole uma API Key antes de adicionar.'; status.className='admin-status err'; return; }
    const id='k'+Date.now();
    const result=await client.from('gemini_api_keys').insert({id:id,label:label,api_key:value,active:true});
    if(result.error){ status.textContent='Não foi possível adicionar a API Key.'; status.className='admin-status err'; return; }
    setMeta(id,{provider:provider,baseUrl:baseUrl || providerInfo(provider).baseUrl,models:[],checkedAt:'',note:''});
    byId('newKeyLabel').value=''; byId('newKeyValue').value=''; byId('newKeyBaseUrl').value=''; byId('newKeyProvider').value=PROVIDERS.unknown.name;
    status.textContent='API Key “'+label+'” adicionada. Verificando os modelos disponíveis…'; status.className='admin-status';
    await refreshKeys();
    const key=keys.find(function(item){return item.id===id;});
    if(key) await verifyOne(key,false);
    status.textContent='API Key “'+label+'” cadastrada como '+providerInfo(getMeta(key || {id:id,key:value}).provider).name+'.'; status.className='admin-status ok';
    renderAll();
  }
  async function setActiveKey(id){
    settings.active_key_id=id;
    try{ await client.from('settings').update({active_key_id:id}).eq('id',true); }catch(_err){}
    renderKeyList();
  }
  function configureEvents(){
    const keySelect=cloneWithoutListeners('keySelect');
    const addButton=cloneWithoutListeners('btnAddKey');
    const showButton=cloneWithoutListeners('btnShowNewKey');
    if(keySelect) keySelect.addEventListener('change',function(){setActiveKey(this.value);});
    if(addButton) addButton.addEventListener('click',addKey);
    if(showButton) showButton.addEventListener('click',function(){
      const field=byId('newKeyValue'); const showing=field.type==='text'; field.type=showing?'password':'text'; this.textContent=showing?'Mostrar':'Ocultar';
    });
    ['newKeyValue','newKeyBaseUrl'].forEach(function(id){
      byId(id).addEventListener('input',function(){
        const provider=detectProvider(byId('newKeyValue').value,byId('newKeyBaseUrl').value);
        byId('newKeyProvider').value=providerInfo(provider).name;
      });
    });
    byId('btnVerifyModels').addEventListener('click',function(){verifyAll(true);});
    byId('btnShowAllModels').addEventListener('click',function(){
      const catalog=byId('providerModelCatalog'); catalog.hidden=!catalog.hidden;
      this.setAttribute('aria-expanded',String(!catalog.hidden)); this.textContent=catalog.hidden?'Mostrar todos os modelos':'Ocultar modelos';
    });
    byId('genKeySelect').addEventListener('change',renderGeneratorOptions);
    byId('genModelSelect').addEventListener('change',renderSelectionSummary);
    byId('genType').addEventListener('change',renderGeneratorOptions);
    byId('providerDecisionYes').addEventListener('click',function(){closeDecision(true);});
    byId('providerDecisionNo').addEventListener('click',function(){closeDecision(false);});
  }
  function candidatesFor(type, fallbackModel){
    const selectedKey=byId('genKeySelect').value;
    const selectedModel=byId('genModelSelect').value;
    const preferredKeys=selectedKey===ALL_KEYS ? keys.slice() : keys.filter(function(k){return k.id===selectedKey;});
    const remainingKeys=keys.filter(function(k){return !preferredKeys.some(function(p){return p.id===k.id;});});
    const orderedKeys=preferredKeys.concat(remainingKeys);
    const combos=[]; const seen=new Set();
    function add(key,model){ const token=key.id+'::'+model; if(!seen.has(token)){seen.add(token);combos.push({key:key,model:model});} }
    orderedKeys.forEach(function(key){
      const available=getMeta(key).models.filter(function(model){return model.type===type;});
      if(selectedModel!==AUTO_MODEL && available.some(function(m){return m.id===selectedModel;})) add(key,selectedModel);
      available.forEach(function(model){add(key,model.id);});
      if(!available.length && fallbackModel) add(key,fallbackModel);
    });
    return combos;
  }
  async function generateDirect(candidate,type,prompt){
    const key=candidate.key; const meta=getMeta(key); const provider=meta.provider; const info=providerInfo(provider); const baseUrl=normalizeBaseUrl(meta.baseUrl||info.baseUrl);
    if(provider==='google'){
      const data=await jsonRequest(baseUrl+'/models/'+encodeURIComponent(candidate.model)+':generateContent',{
        method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key.key},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:type==='imagem'?{responseModalities:['IMAGE','TEXT']}:undefined})
      });
      const parts=data.candidates&&data.candidates[0]&&data.candidates[0].content&&data.candidates[0].content.parts||[];
      if(type==='imagem'){
        const image=parts.find(function(part){return part.inlineData;});
        if(!image) throw createApiError('A API não retornou uma imagem.',400,'request');
        return 'data:'+image.inlineData.mimeType+';base64,'+image.inlineData.data;
      }
      const text=parts.map(function(part){return part.text||'';}).join('\n').trim();
      if(!text) throw createApiError('A API não retornou texto.',400,'request');
      return text;
    }
    if(provider==='anthropic'){
      if(type==='imagem') throw createApiError('Esse provedor não oferece geração de imagem neste adaptador.',404,'model');
      const data=await jsonRequest(baseUrl+'/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key.key,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:candidate.model,max_tokens:4096,messages:[{role:'user',content:prompt}]})});
      return (data.content||[]).map(function(part){return part.text||'';}).join('\n').trim();
    }
    if(provider==='cohere'){
      if(type==='imagem') throw createApiError('Esse provedor não oferece geração de imagem neste adaptador.',404,'model');
      const data=await jsonRequest(baseUrl+'/chat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key.key},body:JSON.stringify({model:candidate.model,messages:[{role:'user',content:prompt}]})});
      return data.message&&data.message.content&&data.message.content.map(function(part){return part.text||'';}).join('\n').trim() || data.text || '';
    }
    if(!baseUrl) throw createApiError('Informe o endpoint compatível desse provedor.',400,'request');
    if(type==='imagem'){
      const data=await jsonRequest(baseUrl+'/images/generations',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key.key},body:JSON.stringify({model:candidate.model,prompt:prompt,response_format:'b64_json'})});
      const image=data.data&&data.data[0];
      if(image&&image.b64_json) return 'data:image/png;base64,'+image.b64_json;
      if(image&&image.url) return image.url;
      throw createApiError('A API não retornou uma imagem.',400,'request');
    }
    const data=await jsonRequest(baseUrl+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key.key},body:JSON.stringify({model:candidate.model,messages:[{role:'user',content:prompt}]})});
    return data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content || '';
  }
  async function invokeGeneration(candidate,type,prompt){
    if(isMockMode()){
      if(prompt.indexOf('__SIMULATE_RETRYABLE_FAILURE__')>=0 && !candidate.__retried){ candidate.__retried=true; throw createApiError('Falha simulada de cota.',429,'quota'); }
      return type==='imagem'?'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzAwNEVCNSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTA1IiBmaWxsPSIjRkZEMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5UZXN0ZTwvdGV4dD48L3N2Zz4=':'Conteúdo de teste gerado sem chamada externa.';
    }
    const edge=await invokeEdge('generate',{keyId:candidate.key.id,provider:getMeta(candidate.key).provider,baseUrl:getMeta(candidate.key).baseUrl,type:type,model:candidate.model,prompt:prompt});
    if(edge && edge.result) return edge.result;
    return generateDirect(candidate,type,prompt);
  }
  async function generate(type,prompt,options){
    lastSuccess=null;
    const combos=candidatesFor(type,options&&options.fallbackModel);
    if(!combos.length) throw createApiError('Nenhuma combinação de API Key e modelo está disponível para '+(type==='imagem'?'imagem':'texto')+'.',404,'model');
    const automatic=!!byId('genFailover').checked;
    let lastError=null;
    for(let index=0;index<combos.length;index++){
      const candidate=combos[index];
      try{
        const result=await invokeGeneration(candidate,type,prompt);
        lastSuccess={keyLabel:candidate.key.label,provider:providerInfo(getMeta(candidate.key).provider).name,model:candidate.model,type:type};
        return result;
      }catch(error){
        lastError=error;
        const category=classifyError(error);
        if(!RETRYABLE.has(category) || index===combos.length-1) throw error;
        const next=combos[index+1];
        const message='A geração de '+(type==='imagem'?'imagem':'texto')+' falhou porque '+categoryMessage(category)+'. Vou tentar '+next.key.label+' com '+next.model+'.';
        if(automatic){ showToast(message,'error'); }
        else{
          const approved=await askForFailover(type,category);
          if(!approved) throw createApiError('A procura por outra chave ou modelo foi cancelada.',0,'request');
        }
      }
    }
    throw lastError || createApiError('Todas as combinações disponíveis falharam.',0,'unknown');
  }
  async function init(options){
    if(ready) return;
    client=options.sb; settings=options.settings||{};
    configureEvents();
    await refreshKeys();
    renderAll();
    ready=true;
    const stale=keys.filter(function(key){
      const checked=getMeta(key).checkedAt; return !checked || Date.now()-new Date(checked).getTime()>CACHE_TTL_MS;
    });
    if(stale.length){
      setTimeout(async function(){ for(const key of stale){await verifyOne(key,false);} renderAll(); },150);
    }
  }

  window.ProviderManager={
    init:init, isReady:function(){return ready;}, generate:generate,
    getLastSuccess:function(){return lastSuccess;}, detectProvider:detectProvider,
    classifyError:classifyError, verifyAll:verifyAll, showToast:showToast,
    _test:{normalizeModels:normalizeModels,modelType:modelType,providerInfo:providerInfo,candidatesFor:candidatesFor}
  };
})();
