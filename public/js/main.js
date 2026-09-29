const grid = document.getElementById('products-grid');
const emptyState = document.getElementById('empty-state');
const resultsCount = document.getElementById('results-count');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const categoryTabs = document.getElementById('category-tabs');

const platformInfo = {
  mercadolivre: { label: 'Mercado Livre', className: 'link-ml' },
  shopee: { label: 'Shopee', className: 'link-shopee' }
};

let activeCategory = '';

function renderProducts(products) {
  grid.innerHTML = '';

  if (products.length === 0) {
    emptyState.hidden = false;
    resultsCount.textContent = '';
    return;
  }

  emptyState.hidden = true;
  resultsCount.textContent = `${products.length} encontrada${products.length > 1 ? 's' : ''}`;

  const frag = document.createDocumentFragment();

  products.forEach((p) => {
    const card = document.createElement('article');
    card.className = 'product-card';

    const linksHtml = (p.links || [])
      .map((link) => {
        const info = platformInfo[link.platform] || { label: link.platform, className: '' };
        return `<a class="product-cta ${info.className}" href="/ir/${link.id}" target="_blank" rel="noopener sponsored">${info.label}</a>`;
      })
      .join('');

    card.innerHTML = `
      <img src="${p.image_url}" alt="${p.name}" loading="lazy">
      <div class="product-body">
        ${p.team ? `<span class="product-team">${p.team}</span>` : ''}
        <span class="product-name">${p.name}</span>
        <div class="product-links">${linksHtml || '<span class="product-meta">Sem link disponível</span>'}</div>
      </div>
    `;
    frag.appendChild(card);
  });

  grid.appendChild(frag);
}

async function loadProducts(search = '') {
  try {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (activeCategory) params.set('category', activeCategory);

    const res = await fetch(`/api/products${params.toString() ? `?${params}` : ''}`);
    const data = await res.json();
    renderProducts(data);
  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
    resultsCount.textContent = '';
    grid.innerHTML = '';
    emptyState.hidden = false;
    emptyState.textContent = 'Não foi possível carregar as camisas agora. Tenta de novo em instantes.';
  }
}

let debounceTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => loadProducts(searchInput.value.trim()), 300);
});

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearTimeout(debounceTimer);
  loadProducts(searchInput.value.trim());
});

categoryTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.category-tab');
  if (!btn) return;

  categoryTabs.querySelectorAll('.category-tab').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  activeCategory = btn.dataset.category;
  loadProducts(searchInput.value.trim());
});

loadProducts();

// Reportar link caído
const reportForm = document.getElementById('report-form');
const reportStatus = document.getElementById('report-status');

reportForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  reportStatus.textContent = 'Enviando...';

  const formData = new FormData(reportForm);
  const payload = {
    product_name: formData.get('product_name'),
    message: formData.get('message')
  };

  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Falha ao enviar');

    reportStatus.textContent = 'Reporte enviado! Vamos verificar assim que possível.';
    reportForm.reset();
  } catch (err) {
    console.error(err);
    reportStatus.textContent = 'Não foi possível enviar agora. Tenta de novo em instantes.';
  }
});
