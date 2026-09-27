const grid = document.getElementById('products-grid');
const emptyState = document.getElementById('empty-state');
const resultsCount = document.getElementById('results-count');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');

const platformLabel = {
  mercadolivre: 'Mercado Livre',
  shopee: 'Shopee'
};

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
    card.innerHTML = `
      <img src="${p.image_url}" alt="${p.name}" loading="lazy">
      <div class="product-body">
        ${p.team ? `<span class="product-team">${p.team}</span>` : ''}
        <span class="product-name">${p.name}</span>
        <span class="product-meta">Via ${platformLabel[p.platform] || p.platform}</span>
        <a class="product-cta" href="${p.affiliate_url}" target="_blank" rel="noopener sponsored">Ver oferta</a>
      </div>
    `;
    frag.appendChild(card);
  });

  grid.appendChild(frag);
}

async function loadProducts(search = '') {
  try {
    const res = await fetch(`/api/products${search ? `?search=${encodeURIComponent(search)}` : ''}`);
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
