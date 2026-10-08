// 管理画面用ロジック (admin.js) - 完全無損プレビュー・未作成画像自動検知・一括保存版

(function() {
  let currentData = BPB_DATA;

  // 保存データの読み込み
  const savedData = localStorage.getItem('bpb_custom_data');
  if (savedData) {
    try {
      currentData = JSON.parse(savedData);
    } catch(e) {
      console.error("Failed to parse bpb_custom_data", e);
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

  const historyTextInput = document.getElementById('history-text-input');
  const saveHistoryBtn = document.getElementById('save-history-btn');

  const profileTextInput = document.getElementById('profile-text-input');
  const saveProfileBtn = document.getElementById('save-profile-btn');

  const otherContactInput = document.getElementById('other-contact-input');
  const saveOtherContactBtn = document.getElementById('save-other-contact-btn');

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

    // 画像読み込みエラー時のフォールバック処理
    previewImg.addEventListener('error', () => {
      previewWrapper.style.display = 'none';
      dropContent.style.display = 'flex';
      const textSpan = dropContent.querySelector('span:last-child');
      if (textSpan) {
        textSpan.innerHTML = '<span style="color:#ef4444; font-weight:700;">⚠️ 画像ファイルが未保存です。<br>ここに画像を再アップロードしてください。</span>';
      }
    });
  }

  // 画像を軽量リサイズ（圧縮）してBase64化する関数
  function handleImageFile(file, hiddenInput, previewWrapper, previewImg, dropContent) {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください。');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
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

        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.80);

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
      alert('【ご注意】ブラウザの保存容量上限を超えました。「📥 ネット公開用 data.js を保存」ボタンからファイルを出力してください。');
    }
    renderBuildList();
    renderTipsList();
  }

  // ビルド一覧の描画
  function renderBuildList() {
    adminBuildList.innerHTML = '';

    if (currentData.builds.length === 0) {
      adminBuildList.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem; padding: 16px; text-align: center;">登録されたビルドはありません。</div>`;
      return;
    }

    currentData.classes.forEach(c => {
      const classBuilds = currentData.builds.filter(b => b.classId === c.id);
      if (classBuilds.length === 0) return;

      const groupContainer = document.createElement('div');
      groupContainer.style.cssText = 'margin-bottom: 16px; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px;';

      const groupHeader = document.createElement('div');
      groupHeader.style.cssText = 'font-size: 0.95rem; font-weight: 800; color: var(--text-main); margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid var(--border-color); padding-bottom: 6px;';
      groupHeader.innerHTML = `
        <span style="display: flex; align-items: center; gap: 6px;">${c.icon} ${escapeHtml(c.name)}</span>
        <span style="background: var(--primary-light); color: var(--primary); font-size: 0.75rem; font-weight: 800; padding: 2px 8px; border-radius: var(--radius-full);">${classBuilds.length}件</span>
      `;
      groupContainer.appendChild(groupHeader);

      const itemsList = document.createElement('div');
      itemsList.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

      classBuilds.forEach((build, classIndex) => {
        const item = document.createElement('div');
        item.style.cssText = 'background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; color: var(--text-main);';
        
        const rankTagClass = build.rank === 'S' ? 'tag-s' : (build.rank === 'A' ? 'tag-a' : 'tag-b');
        const isFirst = (classIndex === 0);
        const isLast = (classIndex === classBuilds.length - 1);

        const hasBase64 = (build.image && build.image.startsWith('data:image/')) || (build.variantImage && build.variantImage.startsWith('data:image/'));
        const pendingBadge = hasBase64 ? `<span style="background:#f59e0b; color:#0f172a; font-size:0.7rem; font-weight:800; padding:1px 6px; border-radius:4px; margin-left:4px;">未出力画像あり</span>` : '';

        item.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px; flex: 1; overflow: hidden;">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <button class="btn-icon" ${isFirst ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} onclick="window.moveBuildUp('${build.id}')" title="クラス内で上へ移動">▲</button>
              <button class="btn-icon" ${isLast ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} onclick="window.moveBuildDown('${build.id}')" title="クラス内で下へ移動">▼</button>
            </div>
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="rank-tag ${rankTagClass}">${build.rank}</span>
                <strong style="font-size: 0.9rem; color: var(--text-main);">${escapeHtml(build.title)}</strong>
                ${pendingBadge}
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 6px; flex-shrink: 0;">
            <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="window.editBuild('${build.id}')">編集</button>
            <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem;" onclick="window.deleteBuild('${build.id}')">削除</button>
          </div>
        `;
        itemsList.appendChild(item);
      });

      groupContainer.appendChild(itemsList);
      adminBuildList.appendChild(groupContainer);
    });
  }

  // 並び替え: 同一クラス内で上へ移動
  window.moveBuildUp = function(id) {
    const index = currentData.builds.findIndex(b => b.id === id);
    if (index < 0) return;
    const targetBuild = currentData.builds[index];

    let prevSameClassIndex = -1;
    for (let i = index - 1; i >= 0; i--) {
      if (currentData.builds[i].classId === targetBuild.classId) {
        prevSameClassIndex = i;
        break;
      }
    }

    if (prevSameClassIndex !== -1) {
      const temp = currentData.builds[index];
      currentData.builds[index] = currentData.builds[prevSameClassIndex];
      currentData.builds[prevSameClassIndex] = temp;
      saveData();
    }
  };

  // 並び替え: 同一クラス内で下へ移動
  window.moveBuildDown = function(id) {
    const index = currentData.builds.findIndex(b => b.id === id);
    if (index < 0) return;
    const targetBuild = currentData.builds[index];

    let nextSameClassIndex = -1;
    for (let i = index + 1; i < currentData.builds.length; i++) {
      if (currentData.builds[i].classId === targetBuild.classId) {
        nextSameClassIndex = i;
        break;
      }
    }

    if (nextSameClassIndex !== -1) {
      const temp = currentData.builds[index];
      currentData.builds[index] = currentData.builds[nextSameClassIndex];
      currentData.builds[nextSameClassIndex] = temp;
      saveData();
    }
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
    alert('ビルド情報を下書き保存しました！\n（※一覧に追加されました。画像の再設定が必要な場合は再度編集からアップロードしてください）');
  });

  function formatTextWithNewlines(str) {
    if (!str) return '';
    let text = str.replace(/\\n/g, '\n');
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  function formatTipsText(str) {
    if (!str) return '';
    let text = str.replace(/\\n/g, '\n').replace(/(\r?\n\s*)+/g, '\n').trim();
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  // --- Tipsのレンダリング ＆ 並び替え・追加・編集・削除 ---
  let editingTipIndex = -1;

  function renderTipsList() {
    adminTipsList.innerHTML = '';
    const total = currentData.tips.length;

    currentData.tips.forEach((tip, idx) => {
      const li = document.createElement('li');
      li.style.cssText = 'background: var(--bg-main); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px 12px; display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; font-size: 0.875rem; color: var(--text-main); word-break: break-word; overflow-wrap: anywhere;';
      
      const isFirst = (idx === 0);
      const isLast = (idx === total - 1);

      li.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 10px; flex: 1; overflow: hidden;">
          <div style="display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; margin-top: 1px;">
            <button class="btn-icon" ${isFirst ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} onclick="window.moveTipUp(${idx})" title="上へ移動">▲</button>
            <button class="btn-icon" ${isLast ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} onclick="window.moveTipDown(${idx})" title="下へ移動">▼</button>
          </div>
          <span style="flex: 1; white-space: normal; line-height: 1.5; margin-top: 2px;">
            <strong style="color: var(--primary); font-weight: 800;">${idx + 1}.</strong> ${formatTipsText(tip)}
          </span>
        </div>
        <div style="display: flex; gap: 6px; flex-shrink: 0; align-self: flex-start;">
          <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="window.editTip(${idx})">編集</button>
          <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="window.deleteTip(${idx})">削除</button>
        </div>
      `;
      adminTipsList.appendChild(li);
    });
  }

  window.editTip = function(index) {
    if (index >= 0 && index < currentData.tips.length) {
      editingTipIndex = index;
      newTipInput.value = currentData.tips[index];
      addTipBtn.textContent = '💾 Tipsを更新';
      addTipBtn.classList.remove('btn-secondary');
      addTipBtn.classList.add('btn-primary');
      newTipInput.focus();
    }
  };

  addTipBtn.addEventListener('click', () => {
    const val = newTipInput.value.trim();
    if (!val) return;

    if (editingTipIndex >= 0 && editingTipIndex < currentData.tips.length) {
      currentData.tips[editingTipIndex] = val;
      editingTipIndex = -1;
      addTipBtn.textContent = '＋ Tipsを追加';
      addTipBtn.classList.remove('btn-primary');
      addTipBtn.classList.add('btn-secondary');
    } else {
      currentData.tips.push(val);
    }
    newTipInput.value = '';
    saveData();
  });

  window.moveTipUp = function(index) {
    if (index <= 0 || index >= currentData.tips.length) return;
    const temp = currentData.tips[index];
    currentData.tips[index] = currentData.tips[index - 1];
    currentData.tips[index - 1] = temp;
    saveData();
  };

  window.moveTipDown = function(index) {
    if (index < 0 || index >= currentData.tips.length - 1) return;
    const temp = currentData.tips[index];
    currentData.tips[index] = currentData.tips[index + 1];
    currentData.tips[index + 1] = temp;
    saveData();
  };

  window.deleteTip = function(index) {
    if (confirm(`Tips #${index + 1} を削除してもよろしいですか？`)) {
      currentData.tips.splice(index, 1);
      if (editingTipIndex === index) {
        editingTipIndex = -1;
        newTipInput.value = '';
        addTipBtn.textContent = '＋ Tipsを追加';
        addTipBtn.classList.remove('btn-primary');
        addTipBtn.classList.add('btn-secondary');
      }
      saveData();
    }
  };

  // --- 📜 変更履歴の保存 ---
  function initHistorySection() {
    if (historyTextInput) {
      historyTextInput.value = currentData.history || '';
    }
  }

  if (saveHistoryBtn) {
    saveHistoryBtn.addEventListener('click', () => {
      if (historyTextInput) {
        currentData.history = historyTextInput.value.trim();
        saveData();
        alert('トップ画面の変更履歴を保存しました！');
      }
    });
  }

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

  // --- 🔗 他サイト・お問い合わせの保存 ---
  function initOtherContactSection() {
    if (otherContactInput) {
      otherContactInput.value = currentData.otherAndContact || '';
    }
  }

  if (saveOtherContactBtn) {
    saveOtherContactBtn.addEventListener('click', () => {
      if (otherContactInput) {
        currentData.otherAndContact = otherContactInput.value.trim();
        saveData();
        alert('「他サイト・問い合わせ」画面の内容を保存しました！');
      }
    });
  }

  // --- Base64データURIをBlobに変換するヘルパー ---
  function base64ToBlob(base64Str) {
    const parts = base64Str.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  }

  // --- 🌐 ネット公開用 data.js エクスポート & 画像ファイル自動分離保存 ---
  if (exportDataJsBtn) {
    exportDataJsBtn.addEventListener('click', async () => {
      // currentData のディープコピーを作成
      const exportData = JSON.parse(JSON.stringify(currentData));
      const newImageBlobs = {}; // { "assets/images/build-xxx.jpg": Blob }

      // データ内の Base64 画像を自動検出し、ファイルパスに変換＆Blob抽出
      exportData.builds.forEach(b => {
        if (b.image && b.image.startsWith('data:image/')) {
          const filePath = `assets/images/${b.id}.jpg`;
          newImageBlobs[filePath] = base64ToBlob(b.image);
          b.image = filePath;
        }
        if (b.variantImage && b.variantImage.startsWith('data:image/')) {
          const filePath = `assets/images/${b.id}_variant.jpg`;
          newImageBlobs[filePath] = base64ToBlob(b.variantImage);
          b.variantImage = filePath;
        }
      });

      const jsContent = `// バックパックバトルズ ビルドまとめ データファイル (自動生成)\nconst BPB_DATA = ${JSON.stringify(exportData, null, 2)};\n`;
      
      // 1. Chrome / Edge 向け File System Access API (直接保存)
      if ('showDirectoryPicker' in window) {
        try {
          alert('プロジェクトのルートフォルダ (backpack-battles-wiki) を選択してください。\n\ndata.js および新規画像が直接フォルダへ書き出されます。');
          const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
          
          // js/data.js の保存
          const jsDirHandle = await dirHandle.getDirectoryHandle('js', { create: true });
          const dataJsFileHandle = await jsDirHandle.getFileHandle('data.js', { create: true });
          const writable = await dataJsFileHandle.createWritable();
          await writable.write(jsContent);
          await writable.close();

          // 新規画像があれば assets/images/ へ保存
          const imagePaths = Object.keys(newImageBlobs);
          if (imagePaths.length > 0) {
            const assetsDirHandle = await dirHandle.getDirectoryHandle('assets', { create: true });
            const imagesDirHandle = await assetsDirHandle.getDirectoryHandle('images', { create: true });

            for (const filePath of imagePaths) {
              const filename = filePath.replace('assets/images/', '');
              const imgBlob = newImageBlobs[filePath];
              const imgFileHandle = await imagesDirHandle.getFileHandle(filename, { create: true });
              const imgWritable = await imgFileHandle.createWritable();
              await imgWritable.write(imgBlob);
              await imgWritable.close();
            }
          }

          // 保存完了後、currentData もパス化されたデータで更新
          currentData = exportData;
          saveData();

          alert('✨ プロジェクトフォルダへの「data.js」および画像の書き出し保存が完了しました！');
          return;
        } catch (err) {
          if (err.name === 'AbortError') {
            return;
          }
          console.warn('DirectoryPicker failed or declined, falling back to download:', err);
        }
      }

      // 2. フォールバック: ファイルダウンロード
      const blob = new Blob([jsContent], { type: "text/javascript;charset=utf-8" });
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = URL.createObjectURL(blob);
      downloadAnchor.download = "data.js";
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      const imagePaths = Object.keys(newImageBlobs);
      if (imagePaths.length > 0) {
        alert('「data.js」を出力しました。\n新規追加した画像ファイルも自動ダウンロードされますので、プロジェクトの「assets/images/」に保存してください。');
        for (const filePath of imagePaths) {
          const filename = filePath.replace('assets/images/', '');
          const imgBlob = newImageBlobs[filePath];
          const a = document.createElement('a');
          a.href = URL.createObjectURL(imgBlob);
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      } else {
        alert('「data.js」をダウンロードしました！\n\nこのファイルをプロジェクトの「js/data.js」に上書き保存してください。');
      }

      currentData = exportData;
      saveData();
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
          initHistorySection();
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
        localStorage.removeItem('bpb_pending_images');
        location.reload();
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

  // 初期化実行
  initThemeToggle();
  initClassSelect();
  initHistorySection();
  initProfileSection();
  initOtherContactSection();
  renderBuildList();
  renderTipsList();

})();
