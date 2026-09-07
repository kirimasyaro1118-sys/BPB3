// バックパックバトルズ ビルドまとめ メインアプリケーションロジック

(function() {
  // 1. データ初期化（ローカル編集データがあれば最優先読み込み、無ければ data.js を初期値として利用）
  let currentData = BPB_DATA;
  const savedData = localStorage.getItem('bpb_custom_data');
  if (savedData) {
    try {
      currentData = JSON.parse(savedData);
    } catch(e) {
      console.warn("Failed to parse saved data from localStorage, fallback to BPB_DATA", e);
    }
  }

  let activeTabId = 'main';

  // DOM要素参照
  const randomTipsText = document.getElementById('random-tips-text');
  const tipsRefreshBtn = document.getElementById('tips-refresh-btn');
  const mainNavTabs = document.getElementById('main-nav-tabs');
  const pageTitleSection = document.getElementById('page-title-section');
  const rankSummaryCard = document.getElementById('rank-summary-card');
  const rankListS = document.getElementById('rank-list-s');
  const rankListA = document.getElementById('rank-list-a');
  const rankListB = document.getElementById('rank-list-b');
  const buildListContainer = document.getElementById('build-list-container');
  const backToTopBtn = document.getElementById('back-to-top-btn');
  const logoBtn = document.getElementById('logo-btn');

  // --- 🌟 世界累計来訪者カウンター機能 (CounterAPI連動) ---
  const COUNTER_API_URL = "https://api.counterapi.dev/v1/katad-apps/bpb-wiki-views";

  async function initGlobalCounter() {
    try {
      const response = await fetch(`${COUNTER_API_URL}/up`);
      if (response.ok) {
        const data = await response.json();
        const count = data.count || data.value || 1;
        updateGlobalCounterUI(count);
      } else {
        fetchCounterWithoutIncrement();
      }
    } catch (e) {
      console.warn("Global counter fetch failed, fallback to read mode.", e);
      fetchCounterWithoutIncrement();
    }
  }

  async function fetchCounterWithoutIncrement() {
    try {
      const response = await fetch(COUNTER_API_URL);
      if (response.ok) {
        const data = await response.json();
        const count = data.count || data.value || 1;
        updateGlobalCounterUI(count);
      } else {
        updateGlobalCounterUI("ー");
      }
    } catch(e) {
      updateGlobalCounterUI("ー");
    }
  }

  function updateGlobalCounterUI(value) {
    const el = document.getElementById('global-counter-value');
    if (!el) return;

    if (typeof value === 'number') {
      const formatted = value.toLocaleString();
      const html = formatted.split('').map(char => {
        if (char === ',') {
          return `<span class="counter-comma">,</span>`;
        }
        return `<span class="counter-digit">${char}</span>`;
      }).join('');
      el.innerHTML = html;
    } else {
      el.innerHTML = `<span class="counter-digit offline-dash">${value}</span>`;
    }
  }

  // カウンター初期化実行
  initGlobalCounter();

  // --- 2. ランダムTips処理 ---
  function updateRandomTips() {
    if (currentData.tips && currentData.tips.length > 0) {
      const randomIndex = Math.floor(Math.random() * currentData.tips.length);
      randomTipsText.textContent = currentData.tips[randomIndex];
    } else {
      randomTipsText.textContent = "Tipsはありません。";
    }
  }

  if (tipsRefreshBtn) {
    tipsRefreshBtn.addEventListener('click', updateRandomTips);
  }
  updateRandomTips();

  // --- 3. ナビゲーションの初期化 ＆ レンダリング ---
  function renderNavTabs() {
    mainNavTabs.innerHTML = '';

    // トップ
    const topTab = createTabElement('main', 'トップ', '🏠', true);
    mainNavTabs.appendChild(topTab);

    // クラス別 & 汎用 (エンジニアとアドベンチャラーを有効化)
    currentData.classes.forEach(c => {
      const isEnabled = (c.id === 'engineer' || c.id === 'adventurer');
      const label = isEnabled ? c.name : `${c.name}(準備中)`;
      const tab = createTabElement(c.id, label, c.icon, isEnabled);
      mainNavTabs.appendChild(tab);
    });

    // Tips
    const tipsTab = createTabElement('tips', 'Tips', '💡', true);
    mainNavTabs.appendChild(tipsTab);

    // ローカル管理者ページへのリンク（最右）
    const adminTab = document.createElement('a');
    adminTab.href = 'admin.html';
    adminTab.className = 'nav-tab';
    adminTab.style.marginLeft = 'auto';
    adminTab.style.color = '#d97706';
    adminTab.innerHTML = `<span>⚙️</span> 管理画面(自分用)`;
    mainNavTabs.appendChild(adminTab);
  }

  function createTabElement(id, label, icon, isEnabled) {
    const tab = document.createElement('div');
    if (isEnabled) {
      tab.className = `nav-tab ${activeTabId === id ? 'active' : ''}`;
      tab.dataset.tabId = id;
      tab.innerHTML = `<span>${icon}</span> <span>${label}</span>`;
      tab.addEventListener('click', () => switchTab(id));
    } else {
      tab.className = `nav-tab disabled`;
      tab.innerHTML = `<span>${icon}</span> <span>${label}</span>`;
    }
    return tab;
  }

  // タブ切り替え処理
  function switchTab(id) {
    activeTabId = id;
    
    // ナビゲーションアクティブ状態の更新
    document.querySelectorAll('.nav-tab').forEach(t => {
      if (t.dataset.tabId === id) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    renderPageContent(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  logoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('main');
  });

  // --- 4. ページメインコンテンツのレンダリング ---
  function renderPageContent(tabId) {
    buildListContainer.innerHTML = '';

    if (tabId === 'main') {
      renderMainTopPage();
    } else if (tabId === 'tips') {
      renderTipsPage();
    } else {
      renderClassBuildPage(tabId);
    }
  }

  // --- トップページ描画 ---
  function renderMainTopPage() {
    rankSummaryCard.style.display = 'none';
    
    pageTitleSection.innerHTML = `
      <h1 class="page-title">🍞 炊きパン’s BPBビルドまとめへようこそ！</h1>
      <p class="page-subtitle">バックパックバトルズ（Backpack Battles）のクラス別ビルドやおすすめ構成をまとめた個人Wikiです。</p>
    `;

    let html = `
      <div style="background: #fff; border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 32px; box-shadow: var(--shadow-md); margin-bottom: 32px;">
        <h2 style="font-size: 1.3rem; margin-bottom: 16px; color: var(--text-main);">📌 クラス・カテゴリを選択してビルドをチェック</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-top: 20px;">
    `;

    currentData.classes.forEach(c => {
      const isEnabled = (c.id === 'engineer' || c.id === 'adventurer');
      const count = currentData.builds.filter(b => b.classId === c.id).length;
      if (isEnabled) {
        html += `
          <div class="rank-item-link" onclick="window.switchTabGlobal('${c.id}')" style="padding: 16px; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 1.05rem; font-weight: 700;">${c.icon} ${c.name}</span>
            <span style="background: var(--primary-light); color: var(--primary); padding: 2px 10px; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 800;">${count} ビルド</span>
          </div>
        `;
      } else {
        html += `
          <div class="rank-item-link disabled" style="padding: 16px; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 1.05rem; font-weight: 700;">${c.icon} ${c.name}(準備中)</span>
            <span style="background: #e2e8f0; color: var(--text-muted); padding: 2px 10px; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 800;">-</span>
          </div>
        `;
      }
    });

    html += `
        </div>
      </div>
    `;

    // 🌟 自己紹介・プロフィールカードを下部空間に描画
    if (currentData.profile && currentData.profile.trim()) {
      html += `
        <div class="profile-card">
          <div class="profile-header">
            <span>🍞 管理者プロフィール / お知らせ</span>
          </div>
          <div class="profile-content">${formatTextWithNewlines(currentData.profile)}</div>
        </div>
      `;
    }
    
    buildListContainer.innerHTML = html;
  }

  // 全域関数としてタブ切替を公開
  window.switchTabGlobal = switchTab;

  // --- クラス別・汎用ビルドページ描画 ---
  function renderClassBuildPage(classId) {
    const classObj = currentData.classes.find(c => c.id === classId);
    const className = classObj ? `${classObj.icon} ${classObj.name}` : classId;

    pageTitleSection.innerHTML = `
      <h1 class="page-title">${className} ビルドまとめ</h1>
    `;

    // 該当クラスのビルドを抽出
    const classBuilds = currentData.builds.filter(b => b.classId === classId);

    // ランク別に分類
    const sBuilds = classBuilds.filter(b => b.rank === 'S');
    const aBuilds = classBuilds.filter(b => b.rank === 'A');
    const bBuilds = classBuilds.filter(b => b.rank === 'B');

    // 分類表（クイックナビ）の生成
    renderRankSummaryTable(sBuilds, aBuilds, bBuilds);
    rankSummaryCard.style.display = 'block';

    if (classBuilds.length === 0) {
      buildListContainer.innerHTML = `
        <div style="background: #fff; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 40px; text-align: center; color: var(--text-muted);">
          まだこのクラスのビルドは登録されていません。管理画面から登録してください。
        </div>
      `;
      return;
    }

    // ビルドカードの追加
    classBuilds.forEach(build => {
      buildListContainer.appendChild(createBuildCardElement(build));
    });
  }

  // 分類表（クイックナビ）のHTML描画
  function renderRankSummaryTable(sBuilds, aBuilds, bBuilds) {
    rankListS.innerHTML = createRankListItems(sBuilds);
    rankListA.innerHTML = createRankListItems(aBuilds);
    rankListB.innerHTML = createRankListItems(bBuilds);
  }

  function createRankListItems(builds) {
    if (builds.length === 0) {
      return `<li style="font-size: 0.8rem; color: var(--text-muted); padding: 4px 8px;">なし</li>`;
    }

    return builds.map(b => `
      <li class="rank-item-link" onclick="window.scrollToBuild('${b.id}')">
        <span>${escapeHtml(b.title)}</span>
        <span style="font-size: 0.75rem; color: var(--text-muted);">▶</span>
      </li>
    `).join('');
  }

  // ビルド位置へのスムーズスクロール
  window.scrollToBuild = function(buildId) {
    const target = document.getElementById(buildId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ビルドカードエレメント作成
  function createBuildCardElement(build) {
    const card = document.createElement('article');
    card.className = 'build-card';
    card.id = build.id;

    const rankTagClass = build.rank === 'S' ? 'tag-s' : (build.rank === 'A' ? 'tag-a' : 'tag-b');
    const defaultImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='220' viewBox='0 0 400 220'%3E%3Crect width='400' height='220' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3E%E7%94%BB%E5%83%8F%E3%81%AA%E3%81%97%3C/text%3E%3C/svg%3E";

    const buildImgSrc = build.image || defaultImg;

    // 派生構成が存在するかチェック（画像または説明が存在する場合）
    const hasVariant = !!(build.variantImage || (build.variantDescription && build.variantDescription.trim()));
    const variantImgSrc = build.variantImage || defaultImg;

    card.innerHTML = `
      <div class="build-card-header">
        <div class="build-title-group">
          <span class="rank-tag ${rankTagClass}">${build.rank}</span>
          <h2 class="build-title">${escapeHtml(build.title)}</h2>
        </div>
      </div>
      <div class="build-card-body">
        <div class="build-section-box">
          <div class="build-image-wrapper">
            <img src="${buildImgSrc}" alt="${escapeHtml(build.title)}" onerror="this.src='${defaultImg}'">
          </div>
          <p class="build-description">${formatTextWithNewlines(build.description)}</p>
        </div>

        ${hasVariant ? `
          <div class="build-section-box">
            <div class="section-label">🔀 派生構成</div>
            <div class="build-image-wrapper">
              <img src="${variantImgSrc}" alt="派生構成" onerror="this.src='${defaultImg}'">
            </div>
            <p class="build-description">${formatTextWithNewlines(build.variantDescription || '')}</p>
          </div>
        ` : ''}
      </div>
    `;

    return card;
  }

  // --- Tipsページ描画 ---
  function renderTipsPage() {
    rankSummaryCard.style.display = 'none';

    pageTitleSection.innerHTML = `
      <h1 class="page-title">💡 ゲーム攻略 Tips まとめ</h1>
      <p class="page-subtitle">バックパックバトルズを有利に進めるための知識とTips一覧です。</p>
    `;

    let html = `<div class="tips-grid">`;
    currentData.tips.forEach((tip, idx) => {
      html += `
        <div class="tips-card">
          <div class="tips-icon">💡</div>
          <div class="tips-content">
            <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); margin-bottom: 4px;">TIP #${idx + 1}</div>
            ${escapeHtml(tip)}
          </div>
        </div>
      `;
    });
    html += `</div>`;

    buildListContainer.innerHTML = html;
  }

  // --- 5. 右下 トップに戻るボタン処理 ---
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // エスケープ & 改行表示対応関数
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatTextWithNewlines(str) {
    if (!str) return '';
    let text = str.replace(/\\n/g, '\n');
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  // 初期化実行
  renderNavTabs();
  renderPageContent('main');

})();
