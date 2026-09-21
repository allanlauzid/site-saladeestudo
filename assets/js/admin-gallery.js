(function () {
  const BUCKET = 'post-images';
  const FOLDER = 'gallery';
  const MAX_SIZE = 10 * 1024 * 1024;
  const COPY_ICON = '<svg class="abtn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"></path></svg>';
  let paused = false;

  function status(text, type) {
    const el = document.getElementById('galleryStatus');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'admin-status' + (type ? ' ' + type : '');
  }

  function title(name) {
    const labels = {
      'logo-mascote.png': 'Mascote sentado',
      'seta-amarela.png': 'Seta amarela',
      'seta-amarela-logo.png': 'Seta amarela com logo',
      'logo-sem-ano.png': 'Logo sem ano'
    };
    const clean = String(name).replace(/^\d+(?:-\d+)?-/, '');
    return labels[clean] || clean.replace(/\.png$/i, '').replace(/[-_]+/g, ' ');
  }

  function size(bytes) {
    const value = Number(bytes) || 0;
    return value < 1024 * 1024
      ? (value / 1024).toFixed(1).replace('.0', '') + ' KB'
      : (value / 1024 / 1024).toFixed(1).replace('.0', '') + ' MB';
  }

  function button(label, style, action, icon) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'abtn ' + style + ' small';
    el.innerHTML = (icon || '') + '<span class="abtn-label"></span>';
    el.querySelector('.abtn-label').textContent = label;
    el.addEventListener('click', function () { action(el); });
    return el;
  }

  function setButtonLabel(el, text) {
    const label = el.querySelector('.abtn-label');
    if (label) label.textContent = text;
    else el.textContent = text;
  }

  async function copyImage(item, el) {
    const old = el.querySelector('.abtn-label').textContent;
    el.disabled = true;
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setButtonLabel(el, 'Copiada!');
      status('Imagem copiada para a área de transferência.', 'ok');
    } catch (error) {
      console.error(error);
      status('Não foi possível copiar a imagem.', 'err');
    } finally {
      setTimeout(function () { setButtonLabel(el, old); el.disabled = false; }, 1200);
    }
  }

  async function copyUrl(item, el) {
    const old = el.querySelector('.abtn-label').textContent;
    el.disabled = true;
    try {
      const result = await sb.storage.from(BUCKET).createSignedUrl(item.path, 604800);
      if (result.error) throw result.error;
      await navigator.clipboard.writeText(result.data.signedUrl);
      setButtonLabel(el, 'URL copiada!');
      status('URL copiada. Por segurança, este endereço é válido por 7 dias.', 'ok');
    } catch (error) {
      console.error(error);
      status('Não foi possível copiar a URL da imagem.', 'err');
    } finally {
      setTimeout(function () { setButtonLabel(el, old); el.disabled = false; }, 1200);
    }
  }

  async function download(item, el) {
    el.disabled = true;
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      status('Download iniciado.', 'ok');
    } catch (error) {
      console.error(error);
      status('Não foi possível baixar a imagem.', 'err');
    } finally {
      el.disabled = false;
    }
  }

  async function remove(item, el) {
    // Confirmação dupla + código TOTP (mesmo fluxo usado para excluir
    // temas), definido no script principal do painel (admin.html).
    if (typeof window.confirmDestructiveAction !== 'function') {
      status('Não foi possível excluir: recurso de confirmação indisponível.', 'err');
      return;
    }
    const ok = await window.confirmDestructiveAction('Excluir "' + item.title + '" da galeria?');
    if (!ok) return;

    el.disabled = true;
    const result = await sb.storage.from(BUCKET).remove([item.path]);
    if (result.error) {
      status('Não foi possível deletar a imagem.', 'err');
      el.disabled = false;
      return;
    }
    status('Imagem deletada da galeria.', 'ok');
    await load(true);
  }

  function render(items) {
    const grid = document.getElementById('galleryGrid');
    grid.replaceChildren();
    grid.classList.toggle('is-paused', paused);
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'gallery-empty';
      empty.textContent = 'A galeria ainda está vazia. Selecione um ou mais PNGs para começar.';
      grid.appendChild(empty);
      return;
    }

    items.forEach(function (item, index) {
      const card = document.createElement('article');
      card.className = 'gallery-item';
      const stage = document.createElement('div');
      stage.className = 'gallery-stage';
      const image = document.createElement('img');
      image.className = 'gallery-image';
      image.src = item.url;
      image.alt = item.title;
      image.style.setProperty('--gallery-delay', (-index * 0.63) + 's');
      stage.appendChild(image);
      const details = document.createElement('div');
      details.className = 'gallery-details';
      const heading = document.createElement('h3');
      heading.className = 'gallery-name';
      heading.textContent = item.title;
      const meta = document.createElement('p');
      meta.className = 'gallery-meta';
      meta.textContent = 'PNG · ' + size(item.size);
      const actions = document.createElement('div');
      actions.className = 'gallery-actions';
      actions.append(
        button('Copiar imagem', 'secondary', function (el) { copyImage(item, el); }, COPY_ICON),
        button('Copiar URL', 'secondary', function (el) { copyUrl(item, el); }, COPY_ICON),
        button('Excluir', 'ghost', function (el) { remove(item, el); })
      );
      details.append(heading, meta, actions);
      card.append(stage, details);
      grid.appendChild(card);
    });
  }

  async function load(keepStatus) {
    const grid = document.getElementById('galleryGrid');
    if (!grid || typeof sb === 'undefined') return;
    if (!keepStatus) status('Carregando galeria...');
    const listed = await sb.storage.from(BUCKET).list(FOLDER, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });
    if (listed.error) {
      status('Não foi possível carregar a galeria.', 'err');
      return;
    }
    const items = [];
    for (const file of listed.data.filter(function (entry) { return entry.name.endsWith('.png'); })) {
      const path = FOLDER + '/' + file.name;
      const signed = await sb.storage.from(BUCKET).createSignedUrl(path, 3600);
      if (!signed.error) items.push({
        name: file.name,
        path: path,
        title: title(file.name),
        size: file.metadata && file.metadata.size,
        url: signed.data.signedUrl
      });
    }
    render(items);
    if (!keepStatus) status(items.length + (items.length === 1 ? ' imagem hospedada.' : ' imagens hospedadas.'));
  }

  async function upload() {
    const input = document.getElementById('galleryFileInput');
    const action = document.getElementById('btnGalleryUpload');
    const files = Array.from(input.files || []);
    if (!files.length) {
      status('Selecione pelo menos uma imagem PNG.', 'err');
      return;
    }
    if (files.some(function (file) { return file.type !== 'image/png' || file.size > MAX_SIZE; })) {
      status('Use apenas imagens PNG de até 10 MB.', 'err');
      return;
    }
    input.disabled = true;
    action.disabled = true;
    let count = 0;
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const path = FOLDER + '/' + Date.now() + '-' + index + '-' + file.name;
      const result = await sb.storage.from(BUCKET).upload(path, file, { contentType: 'image/png' });
      if (!result.error) count += 1;
    }
    input.value = '';
    input.disabled = false;
    action.disabled = false;
    await load(true);
    status(count + (count === 1 ? ' imagem hospedada.' : ' imagens hospedadas.'), 'ok');
  }

  window.loadGallery = load;
  window.addEventListener('DOMContentLoaded', function () {
    const uploadButton = document.getElementById('btnGalleryUpload');
    const motionButton = document.getElementById('btnGalleryMotion');
    const grid = document.getElementById('galleryGrid');
    if (uploadButton) uploadButton.addEventListener('click', upload);
    if (motionButton) {
      motionButton.addEventListener('click', function () {
        paused = !paused;
        grid.classList.toggle('is-paused', paused);
        motionButton.setAttribute('aria-pressed', String(paused));
        motionButton.textContent = paused ? 'Retomar movimento' : 'Pausar movimento';
      });
    }
  });
}());
