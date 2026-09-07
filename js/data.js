// バックパックバトルズ ビルドまとめ 初期データ定義
const BPB_DATA = {
  siteTitle: "炊きパン’s BPBビルドまとめ",
  twitterLink: "https://x.com/",
  otherSites: [
    { name: "サイゼリヤガチャ", url: "../saizeriya-gacha/index.html" },
    { name: "ゲーム攻略メモ帳", url: "#" }
  ],
  classes: [
    { id: "engineer", name: "エンジニア", icon: "⚙️", color: "#0284c7" },
    { id: "ranger", name: "レンジャー", icon: "🏹", color: "#16a34a" },
    { id: "reaper", name: "リーパー", icon: "💀", color: "#9333ea" },
    { id: "pyromancer", name: "パイロマンサー", icon: "🔥", color: "#ea580c" },
    { id: "berserker", name: "バーサーカー", icon: "🪓", color: "#dc2626" },
    { id: "mage", name: "メイジ", icon: "🪄", color: "#2563eb" },
    { id: "adventurer", name: "アドベンチャラー", icon: "🧭", color: "#ca8a04" },
    { id: "general-late", name: "汎用(終盤)", icon: "🏆", color: "#475569" },
    { id: "general-mid", name: "汎用(中盤)", icon: "🛡️", color: "#64748b" }
  ],
  tips: [
    "スタミナ管理が最重要！消費スタミナと回復速度のバランスを意識しよう。",
    "バックパック内の星印（シナジーマス）を重ねることでアイテムの真価が発揮されます。",
    "ゴールドバッグは序盤の資金繰りを加速させるため早期購入がおすすめ。",
    "相手のバフ（クリティカル・毒など）を解除するクレンジングアイテムは終盤必須！",
    "合成レシピはショップ内で素材を隣り合わせに配置することで進行します。"
  ],
  builds: [
    {
      id: "build-cube-holy-lamp",
      classId: "engineer",
      rank: "S",
      title: "キューブホリスピランプ",
      image: "assets/sample_build_1.png",
      description: "【個人的最強ビルド】ルビークューブとホーリースピリット、ホーリーランプを組み合わせ、爆発的なバフと高速攻撃で敵を一瞬で圧倒するエンジニア最強の構成。",
      variantImage: "",
      variantDescription: ""
    }
  ]
};
