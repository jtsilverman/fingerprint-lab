/**
 * DOM manipulation and results rendering.
 */

const CATEGORY_CLASSES = {
  rendering: 'cat-rendering',
  hardware: 'cat-hardware',
  network: 'cat-network',
  browser: 'cat-browser',
  security: 'cat-security',
};

export function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
}

export function showFingerprint(hash) {
  document.getElementById('fingerprint-hash').textContent = `Fingerprint: ${hash}`;
}

export function showScore(totalEntropy) {
  const gauge = document.getElementById('score-gauge');
  const uniqueness = Math.pow(2, totalEntropy);
  let label, cssClass;

  if (totalEntropy < 20) {
    label = 'Low';
    cssClass = 'score-low';
  } else if (totalEntropy <= 30) {
    label = 'Medium';
    cssClass = 'score-medium';
  } else {
    label = 'High';
    cssClass = 'score-high';
  }

  const formattedN = uniqueness > 1e9
    ? `${(uniqueness / 1e9).toFixed(1)}B`
    : uniqueness > 1e6
    ? `${(uniqueness / 1e6).toFixed(1)}M`
    : uniqueness > 1e3
    ? `${(uniqueness / 1e3).toFixed(0)}K`
    : Math.round(uniqueness).toString();

  gauge.innerHTML = `
    <div class="score-value ${cssClass}">${label} Identifiability</div>
    <div class="score-label">${totalEntropy.toFixed(1)} bits of entropy. Your browser is ~1 in ${formattedN}.</div>
  `;
}

export function renderResults(results) {
  const grid = document.getElementById('vector-grid');
  grid.innerHTML = '';

  for (const r of results) {
    const card = document.createElement('div');
    card.className = 'vector-card';
    const catClass = CATEGORY_CLASSES[r.category] || 'cat-browser';
    const truncatedValue = r.displayValue && r.displayValue.length > 60
      ? r.displayValue.substring(0, 60) + '...'
      : r.displayValue || r.value;

    const entropyText = r.entropy !== undefined
      ? `<div class="vector-entropy"><strong>${r.entropy.toFixed(1)}</strong> bits</div>`
      : '';

    card.innerHTML = `
      <div class="vector-header">
        <span class="vector-name">${r.name}</span>
        <span class="vector-category ${catClass}">${r.category}</span>
      </div>
      <div class="vector-value">${truncatedValue}</div>
      ${entropyText}
      <div class="vector-detail">
        <div class="detail-section">
          <h4>How it works</h4>
          <p>${r.description || ''}</p>
        </div>
        ${r.mitigation ? `
        <div class="detail-section">
          <h4>Mitigation</h4>
          <p>${r.mitigation}</p>
        </div>` : ''}
        <div class="detail-section">
          <h4>Raw value</h4>
          <div class="raw-value">${typeof r.value === 'object' ? JSON.stringify(r.value, null, 2) : r.value}</div>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      card.classList.toggle('expanded');
    });

    grid.appendChild(card);
  }

  document.getElementById('export-btn').style.display = 'inline-block';
}

export function showButtons() {
  document.getElementById('export-btn').style.display = 'inline-block';
}
