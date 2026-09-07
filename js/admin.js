// 管理画面用ロジック (admin.js)

(function() {
  let currentData = BPB_DATA;
  const savedData = localStorage.getItem('bpb_custom_data');
  if (savedData) {
    try {
      currentData = JSON.parse(savedData);
    } catch(e) {
      console.error(e);
    }
  }

  // DOMエレメント
  const buildForm = document.getElementById('build-form');
  const formTitle = document.getElementById('form-title');
  const buildIdInput = document.getElementById('build-id');
  const buildClassSelect = document.getElementById('build-class');
  const buildRankSelect = document.getElementById('build-rank');
  const buildTitleInput = document.getElementById('build-title');
  
  const buildImageHidden = document.getElementById('build-image');
  const variantImageHidden = document.getElementById('variant-image');

  const buildDescInput = document.getElementById('build-description');
  const variantDescInput = document.getElementById('variant-description');
  const resetFormBtn = document.getElementById('reset-form-btn');
  const adminBuildList = document.getElementById('admin-build-list');
  
  const newTipInput = document.getElementById('new-tip-input');
  const addTipBtn = document.getElementById('add-tip-btn');
  const adminTipsList = document.getElementById('admin-tips-list');

  const exportDataJsBtn = document.getElementById('export-datajs-btn');
  const exportJsonBtn = document.getElementById('export-json-btn');
  const importJsonFile = document.getElementById('import-json-file');

  const profileTextInput = document.getElementById('profile-text-input');
  const saveProfileBtn = document.getElementById('save-profile-btn');

  // クラスドロップダウン初期化
  function initClassSelect() {
    buildClassSelect.innerHTML = '';
    currentData.classes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.icon} ${c.name}`;
      buildClassSelect.appendChild(opt);
    });
  }

  // --- ドラッグ＆ドロップ ＆ ファイル選択処理のセットアップ ---
  function setupDropZone(dropZoneId, fileInputId, hiddenInputId, previewWrapperId, previewImgId, clearBtnId) {
    const dropZone = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(fileInputId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const previewWrapper = document.getElementById(previewWrapperId);
    const previewImg = document.getElementById(previewImgId);
    const clearBtn = document.getElementById(clearBtnId);
    const dropContent = dropZone.querySelector('.drop-zone-content');

    dropZone.addEventListener('click', (e) => {
      if (e.target !== clearBtn) {
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleImageFile(e.target.files[0], hiddenInput, previewWrapper, previewImg, dropContent);
      }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt.files && dt.files[0]) {
        handleImageFile(dt.files[0], hiddenInput, previewWrapper, previewImg, dropContent);
      }
    });

    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hiddenInput.value = '';
      fileInput.value = '';
      previewImg.src = '';
      previewWrapper.style.display = 'none';
      dropContent.style.display = 'flex';
    });
  }

  // 画像を軽量リサイズ（圧縮）してBase64化する関数（ファイルサイズ肥大化防止）
  function handleImageFile(file, hiddenInput, previewWrapper, previewImg, dropContent) {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください。');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        // 最大幅 640px / 最大高さ 480px にリサイズして強力圧縮
        const maxWidth = 640;
        const maxHeight = 480;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG圧縮（画質0.65）で大幅軽量化（Base64サイズを数10KBに削減）
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.65);

        hiddenInput.value = resizedBase64;
        previewImg.src = resizedBase64;
        previewWrapper.style.display = 'block';
        dropContent.style.display = 'none';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function setImageState(imgUrl, hiddenInputId, previewWrapperId, previewImgId, dropZoneId) {
    const hiddenInput = document.getElementById(hiddenInputId);
    const previewWrapper = document.getElementById(previewWrapperId);
    const previewImg = document.getElementById(previewImgId);
    const dropZone = document.getElementById(dropZoneId);
    const dropContent = dropZone.querySelector('.drop-zone-content');

    hiddenInput.value = imgUrl || '';
    if (imgUrl) {
      previewImg.src = imgUrl;
      previewWrapper.style.display = 'block';
      dropContent.style.display = 'none';
    } else {
      previewImg.src = '';
      previewWrapper.style.display = 'none';
      dropContent.style.display = 'flex';
    }
  }

  setupDropZone('drop-zone-main', 'file-input-main', 'build-image', 'preview-wrapper-main', 'img-preview-main', 'clear-img-main');
  setupDropZone('drop-zone-variant', 'file-input-variant', 'variant-image', 'preview-wrapper-variant', 'img-preview-variant', 'clear-img-variant');

  // 変更データの保存 (LocalStorage)
  function saveData() {
    try {
      localStorage.setItem('bpb_custom_data', JSON.stringify(currentData));
    } catch(e) {
      console.warn("LocalStorage quota error", e);
      alert('【ご注意】ブラウザの保存容量上限を超えたため、ローカルへの自動保存に失敗しました。\n\n「📥 ネット公開用 data.js を保存」ボタンからファイルを出力して js/data.js に保存するか、不要な画像を削除してください。');
    }
    renderBuildList();
    renderTipsList();
  }

  // ビルド一覧のレンダリング
  function renderBuildList() {
    adminBuildList.innerHTML = '';

    if (currentData.builds.length === 0) {
      adminBuildList.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem;">登録されたビルドはありません。</div>`;
      return;
    }

    currentData.builds.forEach((build, index) => {
      const classObj = currentData.classes.find(c => c.id === build.classId);
      const className = classObj ? `${classObj.icon} ${classObj.name}` : build.classId;

      const item = document.createElement('div');
      item.style.cssText = 'background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px;';
      
      const rankTagClass = build.rank === 'S' ? 'tag-s' : (build.rank === 'A' ? 'tag-a' : 'tag-b');

      const isFirst = (index === 0);
      const isLast = (index === currentData.builds.length - 1);

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; flex: 1; overflow: hidden;">
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <button class="btn-icon" ${isFirst ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} onclick="window.moveBuildUp(${index})" title="上へ移動">▲</button>
            <button class="btn-icon" ${isLast ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} onclick="window.moveBuildDown(${index})" title="下へ移動">▼</button>
          </div>
          <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="rank-tag ${rankTagClass}">${build.rank}</span>
              <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">[${className}]</span>
              <strong style="font-size: 0.95rem;">${escapeHtml(build.title)}</strong>
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 6px; flex-shrink: 0;">
          <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;" onclick="window.editBuild('${build.id}')">編集</button>
          <button class="btn btn-danger" style="padding: 4px 10px; font-size: 0.8rem;" onclick="window.deleteBuild('${build.id}')">削除</button>
        </div>
      `;
      adminBuildList.appendChild(item);
    });
  }

  // 並び替え: 上へ移動
  window.moveBuildUp = function(index) {
    if (index <= 0) return;
    const temp = currentData.builds[index];
    currentData.builds[index] = currentData.builds[index - 1];
    currentData.builds[index - 1] = temp;
    saveData();
  };

  // 並び替え: 下へ移動
  window.moveBuildDown = function(index) {
    if (index >= currentData.builds.length - 1) return;
    const temp = currentData.builds[index];
    currentData.builds[index] = currentData.builds[index + 1];
    currentData.builds[index + 1] = temp;
    saveData();
  };

  // ビルドフォーム編集モード設定
  window.editBuild = function(id) {
    const build = currentData.builds.find(b => b.id === id);
    if (!build) return;

    formTitle.textContent = '✏️ ビルドの編集';
    buildIdInput.value = build.id;
    buildClassSelect.value = build.classId;
    buildRankSelect.value = build.rank;
    buildTitleInput.value = build.title || '';

    setImageState(build.image, 'build-image', 'preview-wrapper-main', 'img-preview-main', 'drop-zone-main');
    setImageState(build.variantImage, 'variant-image', 'preview-wrapper-variant', 'img-preview-variant', 'drop-zone-variant');

    buildDescInput.value = build.description || '';
    variantDescInput.value = build.variantDescription || '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ビルド削除
  window.deleteBuild = function(id) {
    if (confirm('このビルドを削除してもよろしいですか？')) {
      currentData.builds = currentData.builds.filter(b => b.id !== id);
      saveData();
      resetForm();
    }
  };

  // フォームリセット
  function resetForm() {
    formTitle.textContent = '➕ ビルドの新規追加';
    buildIdInput.value = '';
    buildForm.reset();

    setImageState('', 'build-image', 'preview-wrapper-main', 'img-preview-main', 'drop-zone-main');
    setImageState('', 'variant-image', 'preview-wrapper-variant', 'img-preview-variant', 'drop-zone-variant');
  }

  resetFormBtn.addEventListener('click', resetForm);

  // フォーム送信（新規作成・更新）
  buildForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = buildIdInput.value || 'build-' + Date.now();
    const newBuild = {
      id: id,
      classId: buildClassSelect.value,
      rank: buildRankSelect.value,
      title: buildTitleInput.value.trim(),
      image: buildImageHidden.value,
      description: buildDescInput.value.trim(),
      variantImage: variantImageHidden.value,
      variantDescription: variantDescInput.value.trim()
    };

    const existingIndex = currentData.builds.findIndex(b => b.id === id);
    if (existingIndex >= 0) {
      currentData.builds[existingIndex] = newBuild;
    } else {
      currentData.builds.push(newBuild);
    }

    saveData();
    resetForm();
    alert('ビルド情報を保存しました！');
  });

  // --- Tipsのレンダリング ＆ 追加・削除 ---
  function renderTipsList() {
    adminTipsList.innerHTML = '';
    currentData.tips.forEach((tip, idx) => {
      const li = document.createElement('li');
      li.style.cssText = 'background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 0.875rem;';
      li.innerHTML = `
        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${idx + 1}. ${escapeHtml(tip)}</span>
        <button class="btn btn-danger" style="padding: 2px 8px; font-size: 0.75rem;" onclick="window.deleteTip(${idx})">削除</button>
      `;
      adminTipsList.appendChild(li);
    });
  }

  addTipBtn.addEventListener('click', () => {
    const val = newTipInput.value.trim();
    if (val) {
      currentData.tips.push(val);
      newTipInput.value = '';
      saveData();
    }
  });

  window.deleteTip = function(index) {
    currentData.tips.splice(index, 1);
    saveData();
  };

  // --- 🍞 自己紹介・お知らせの保存 ---
  function initProfileSection() {
    if (profileTextInput) {
      profileTextInput.value = currentData.profile || '';
    }
  }

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
      if (profileTextInput) {
        currentData.profile = profileTextInput.value.trim();
        saveData();
        alert('トップ画面の自己紹介・お知らせを保存しました！');
      }
    });
  }

  // --- 🌐 ネット公開用 data.js エクスポート ---
  if (exportDataJsBtn) {
    exportDataJsBtn.addEventListener('click', () => {
      const jsContent = `// バックパックバトルズ ビルドまとめ データファイル (自動生成)\nconst BPB_DATA = ${JSON.stringify(currentData, null, 2)};\n`;
      const blob = new Blob([jsContent], { type: "text/javascript;charset=utf-8" });
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = URL.createObjectURL(blob);
      downloadAnchor.download = "data.js";
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      alert('「data.js」をダウンロードしました！\n\nこのファイルをプロジェクトの「js/data.js」に上書き保存し、サーバーへアップロードしてください。');
    });
  }

  // --- JSONエクスポート ---
  exportJsonBtn.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  // --- データ復元 (JSON/JS) インポート ---
  importJsonFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        let content = event.target.result;
        if (content.includes('const BPB_DATA =')) {
          content = content.replace(/^[^{]*const\s+BPB_DATA\s*=\s*/, '').replace(/;\s*$/, '');
        }
        const importedData = JSON.parse(content);
        if (importedData && importedData.builds && importedData.classes) {
          currentData = importedData;
          saveData();
          initClassSelect();
          initProfileSection();
          alert('データの復元・読み込みが完了しました！');
        } else {
          alert('無効なデータ形式のファイルです。');
        }
      } catch(err) {
        alert('ファイルの読み込みエラー: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  // --- データ初期化（リセット） ---
  const resetDataBtn = document.getElementById('reset-data-btn');
  if (resetDataBtn) {
    resetDataBtn.addEventListener('click', () => {
      if (confirm('ローカルの変更データをクリアして初期状態に戻しますか？\n（現在追加したビルド等は初期化されます）')) {
        localStorage.removeItem('bpb_custom_data');
        location.reload();
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // 初期化実行
  initClassSelect();
  initProfileSection();
  renderBuildList();
  renderTipsList();

})();
