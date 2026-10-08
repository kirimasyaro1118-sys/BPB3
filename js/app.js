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

  // --- 🌟 世界累計来訪者カウンター機能 (二重API＋ローカルフォールバック対応) ---
  async function initGlobalCounter() {
    // 1. メインAPI: Abacus Counter API
    try {
      const response = await fetch("https://abacus.jasoncameron.dev/hit/katad-bpb-wiki/pageviews");
      if (response.ok) {
        const data = await response.json();
        const count = data.value || data.count;
        if (typeof count === 'number' && count > 0) {
          updateGlobalCounterUI(count);
          return;
        }
      }
    } catch (e) {
      console.warn("Primary counter API failed, trying secondary...", e);
    }

    // 2. サブAPI: CounterAPI.dev
    try {
      const response = await fetch("https://api.counterapi.dev/v1/katad-bpb-wiki/pageviews/up");
      if (response.ok) {
        const data = await response.json();
        const count = data.count || data.value;
        if (typeof count === 'number' && count > 0) {
          updateGlobalCounterUI(count);
          return;
        }
      }
    } catch (e) {
      console.warn("Secondary counter API failed, fallback to local counter...", e);
    }

    // 3. ローカルフォールバック（オフライン・通信ブロック時）
    let localCount = parseInt(localStorage.getItem('bpb_visit_counter') || '10', 10);
    localCount++;
    localStorage.setItem('bpb_visit_counter', localCount.toString());
    updateGlobalCounterUI(localCount);
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

  // --- 2. 自動ランダムTips更新 (テキスト長さに応じた自動横スライドアニメーション・一時停止/再生・手動スワイプ対応) ---
  let currentTipIndex = -1;
  let tipsTimeoutId = null;
  let isTipsPaused = false;

  const tipsToggleBtn = document.getElementById('tips-toggle-btn');
  const tipsTextContainer = randomTipsText ? randomTipsText.parentElement : null;

  function updateRandomTips() {
    if (!currentData.tips || currentData.tips.length === 0) {
      if (randomTipsText) randomTipsText.textContent = "Tipsはありません。";
      return;
    }

    let nextIndex;
    if (currentData.tips.length === 1) {
      nextIndex = 0;
    } else {
      do {
        nextIndex = Math.floor(Math.random() * currentData.tips.length);
      } while (nextIndex === currentTipIndex);
    }
    currentTipIndex = nextIndex;

    const newTipText = currentData.tips[nextIndex].replace(/\\n|\n/g, ' ');

    if (randomTipsText) {
      randomTipsText.classList.remove('animate-marquee');
      randomTipsText.style.transform = 'none';
      if (tipsTextContainer) {
        tipsTextContainer.classList.remove('is-overflowing');
        tipsTextContainer.scrollLeft = 0;
      }

      randomTipsText.textContent = newTipText;
      void randomTipsText.offsetWidth; // リフロー発生

      let displayDuration = 10000; // デフォルト10秒表示

      if (tipsTextContainer) {
        const containerWidth = tipsTextContainer.clientWidth;
        const textWidth = randomTipsText.scrollWidth;

        // テキストがコンテナ幅より長い場合は左寄せにし、横スライドアニメーション（マーキー）を動的に計算して適用
        if (textWidth > containerWidth + 6) {
          tipsTextContainer.classList.add('is-overflowing');
          const overflowDistance = textWidth - containerWidth + 24;
          // スライド速度 (ピクセル/秒) を調整して読みやすいアニメーション時間を決定
          const durationSeconds = Math.max(8, Math.round(overflowDistance / 35 + 4));

          randomTipsText.style.setProperty('--marquee-distance', `-${overflowDistance}px`);
          randomTipsText.style.setProperty('--marquee-duration', `${durationSeconds}s`);
          randomTipsText.classList.add('animate-marquee');

          // アニメーション完了後に少し間を置いて次のTipsへ切り替え
          displayDuration = (durationSeconds + 2) * 1000;
        } else {
          // 幅に収まる場合（PC等のワイド画面）は中央揃え
          tipsTextContainer.classList.remove('is-overflowing');
        }
      }

      scheduleNextTip(displayDuration);
    }
  }

  function scheduleNextTip(delayMs) {
    if (tipsTimeoutId) clearTimeout(tipsTimeoutId);
    if (!isTipsPaused) {
      tipsTimeoutId = setTimeout(() => {
        updateRandomTips();
      }, delayMs);
    }
  }

  function toggleTipsPlayback() {
    isTipsPaused = !isTipsPaused;
    if (tipsToggleBtn) {
      if (isTipsPaused) {
        if (tipsTimeoutId) clearTimeout(tipsTimeoutId);
        tipsToggleBtn.innerHTML = '▶';
        tipsToggleBtn.title = '自動切り替えを再開';
        tipsToggleBtn.classList.add('paused');
      } else {
        tipsToggleBtn.innerHTML = '⏸';
        tipsToggleBtn.title = '自動切り替えを停止';
        tipsToggleBtn.classList.remove('paused');
        updateRandomTips();
      }
    }
  }

  if (tipsToggleBtn) {
    tipsToggleBtn.addEventListener('click', toggleTipsPlayback);
  }

  updateRandomTips();

  // --- 3. ナビゲーションの初期化 ＆ レンダリング ---
  function renderNavTabs() {
    mainNavTabs.innerHTML = '';

    // トップ
    const topTab = createTabElement('main', 'トップ', '🏠', true);
    mainNavTabs.appendChild(topTab);

    // クラス別 & 汎用 (全クラス有効化)
    currentData.classes.forEach(c => {
      const tab = createTabElement(c.id, c.name, c.icon, true);
      mainNavTabs.appendChild(tab);
    });

    // Tips
    const tipsTab = createTabElement('tips', 'Tips', '💡', true);
    mainNavTabs.appendChild(tipsTab);
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

  const navOtherContact = document.getElementById('nav-other-contact');
  if (navOtherContact) {
    navOtherContact.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('other-contact');
    });
  }

  // --- 4. ページメインコンテンツのレンダリング ---
  function renderPageContent(tabId) {
    buildListContainer.innerHTML = '';

    if (tabId === 'main') {
      renderMainTopPage();
    } else if (tabId === 'tips') {
      renderTipsPage();
    } else if (tabId === 'other-contact') {
      renderOtherContactPage();
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
      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 32px; box-shadow: var(--shadow-md); margin-bottom: 32px;">
        <h2 style="font-size: 1.3rem; margin-bottom: 16px; color: var(--text-main);">📌 クラス・カテゴリを選択してビルドをチェック</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-top: 20px;">
    `;

    currentData.classes.forEach(c => {
      const count = currentData.builds.filter(b => b.classId === c.id).length;
      html += `
        <div class="rank-item-link" onclick="window.switchTabGlobal('${c.id}')" style="padding: 16px; display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 1.05rem; font-weight: 700;">${c.icon} ${c.name}</span>
          <span style="background: var(--primary-light); color: var(--primary); padding: 2px 10px; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 800;">${count} ビルド</span>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    // 📜 変更履歴カードを管理者プロフィールの1つ上に描画
    if (currentData.history && currentData.history.trim()) {
      html += `
        <div class="profile-card" style="margin-top: 32px;">
          <div class="profile-header">
            <span>📜 変更履歴</span>
          </div>
          <div class="profile-content">${formatTextWithNewlines(currentData.history)}</div>
        </div>
      `;
    }

    // 🌟 自己紹介・プロフィールカードを下部空間に描画
    if (currentData.profile && currentData.profile.trim()) {
      html += `
        <div class="profile-card" style="margin-top: 24px;">
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
            <div class="tips-header">TIP #${idx + 1}</div>
            <div class="tips-body">${formatTipsText(tip)}</div>
          </div>
        </div>
      `;
    });
    html += `</div>`;

    buildListContainer.innerHTML = html;
  }

  // --- 他サイト・お問い合わせページ描画 ---
  function renderOtherContactPage() {
    rankSummaryCard.style.display = 'none';

    pageTitleSection.innerHTML = `
      <h1 class="page-title">🔗 他サイト紹介・お問い合わせ</h1>
      <p class="page-subtitle">管理者が作成した関連サイトおよびお問い合わせ窓口の一覧です。</p>
    `;

    const contentText = currentData.otherAndContact || "内容が登録されていません。管理画面から編集してください。";

    let html = `
      <div class="profile-card" style="margin-top: 0;">
        <div class="profile-header">
          <span>🔗 他サイト紹介 / お問い合わせ</span>
        </div>
        <div class="profile-content">${formatTextWithNewlines(contentText)}</div>
      </div>
    `;

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

  // エスケープ & 改行・安全なURL自動リンク表示対応関数
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
    let escaped = escapeHtml(text);

    // 1. [表示テキスト](URL) マークダウン形式の変換
    escaped = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\.\.?\/[^\s)]+)\)/g, (match, label, url) => {
      const isExternal = url.startsWith('http');
      const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${url}" ${targetAttr} class="inline-link">${label}</a>`;
    });

    // 2. 生URL (https://... や相対パス ../...) の自動リンク変換
    const rawUrlRegex = /(https?:\/\/[^\s<)]+|\.\.?\/[^\s<)]+)/g;
    escaped = escaped.replace(rawUrlRegex, (match) => {
      if (match.includes('href=')) return match;
      let cleanUrl = match.replace(/[).,;:!]+$/, '');
      let trailing = match.substring(cleanUrl.length);
      const isExternal = cleanUrl.startsWith('http');
      const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${cleanUrl}" ${targetAttr} class="inline-link">${cleanUrl}</a>` + trailing;
    });

    return escaped.replace(/\n/g, '<br>');
  }

  // Tips用の段落・空行スペースを除去するフォーマット関数
  function formatTipsText(str) {
    if (!str) return '';
    let text = str.replace(/\\n/g, '\n').replace(/(\r?\n\s*)+/g, '\n').trim();
    return formatTextWithNewlines(text);
  }

  // --- 🌙 テーマ切替（ダークモード / ライトモード）機能 ---
  function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    const savedTheme = localStorage.getItem('bpb_theme') || 'light';
    
    applyTheme(savedTheme);

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('bpb_theme', newTheme);
      });
    }
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
      document.documentElement.removeAttribute('data-theme');
    }
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      toggleBtn.title = theme === 'dark' ? 'ライトモードに切替' : 'ダークモードに切替';
    }
  }

  // PC用マウスホイールでの横スクロールイベント
  const navScrollWrapper = document.querySelector('.nav-scroll-wrapper');
  if (navScrollWrapper) {
    navScrollWrapper.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        navScrollWrapper.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  // 初期化実行
  initThemeToggle();
  renderNavTabs();
  renderPageContent('main');

})();
