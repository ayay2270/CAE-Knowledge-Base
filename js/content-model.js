/* Content semantics shared by providers, add/edit, search and article rendering. */
const KBContent = {
  type: e => e.content_type === 'knowledge' ? 'knowledge' : 'troubleshooting',
  label: e => KBContent.type(e) === 'knowledge' ? '技術知識' : '問題排除',
  textFields: ['summary', 'technical_explanation', 'procedure', 'key_rules', 'symptom', 'root_cause', 'solution', 'verification', 'notes', 'reference_source'],
  fields(e) {
    return KBContent.type(e) === 'knowledge'
      ? [
        { id: 'summary', label: '知識摘要', required: true, rows: 3, hint: '用 1～3 句說明這篇知識的重點與用途。' },
        { id: 'technical_explanation', label: '技術說明', required: true, rows: 6, placeholder: '說明原理、定義、Engineering background、設定邏輯或判斷方式…' },
        { id: 'procedure', label: '操作 / 設定步驟', rows: 7, steps: true },
        { id: 'key_rules', label: '關鍵參數 / 判斷規則', rows: 5, placeholder: 'Rack 往下 Drop：\n- Rigid Wall normal → 朝上\n- Initial Velocity → 朝下' },
        { id: 'notes', label: '注意事項 / 限制', rows: 4, placeholder: '- Rigid Wall 只在法向有效側產生接觸\n- 若方向設定錯誤，有效側會反轉' }
      ]
      : [
        { id: 'symptom', label: '問題現象', required: true, rows: 5, placeholder: '描述遇到的問題現象、錯誤訊息、發生情境…', hint: '可用 `反引號` 標示指令或關鍵字、**粗體** 標示重點。' },
        { id: 'root_cause', label: '原因分析', required: true, rows: 5, placeholder: '說明造成問題的原因…' },
        { id: 'solution', label: '解決方法', required: true, rows: 7, steps: true },
        { id: 'verification', label: '驗證結果', rows: 4, placeholder: '重新執行後模型可正常與 Rigid Wall 接觸，無穿透現象，反力曲線合理。' },
        { id: 'notes', label: '注意事項', rows: 4 }
      ];
  },
  normalize(e) {
    const out = { ...e, content_type: KBContent.type(e) };
    for (const f of ['title', ...KBContent.textFields]) out[f] = String(e[f] || '').replace(/\r\n?/g, '\n');
    return out;
  },
  /* Keep inactive content as dormant data, so changing type never destroys authored text. */
  payload(e) {
    const n = KBContent.normalize(e);
    return { title: n.title, category: e.category, content_type: n.content_type,
      ...Object.fromEntries(KBContent.textFields.map(f => [f, n[f]])),
      tags: e.tags || [], failed_attempts: e.failed_attempts || [], images: e.images || [] };
  },
  badge(e) { return `<span class="k-content-type">${KBContent.label(e)}</span>`; }
};
