// 素材灵感助手 - Content Script

// 注入浮动按钮
function createFloatingButton() {
  // 检查是否已存在
  if (document.getElementById('material-assist-btn')) return
  
  const btn = document.createElement('div')
  btn.id = 'material-assist-btn'
  btn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  `
  btn.title = '收藏到素材库'
  
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    showQuickSaveModal()
  })
  
  document.body.appendChild(btn)
}

// 显示快速保存弹窗
function showQuickSaveModal() {
  // 移除已存在的弹窗
  const existing = document.getElementById('material-quick-modal')
  if (existing) existing.remove()
  
  // 获取页面信息
  const pageInfo = {
    title: document.title,
    url: location.href,
    selection: window.getSelection()?.toString() || ''
  }
  
  const modal = document.createElement('div')
  modal.id = 'material-quick-modal'
  modal.innerHTML = `
    <div class="ma-modal-content">
      <div class="ma-modal-header">
        <span class="ma-modal-title">📝 快速收藏</span>
        <button class="ma-close-btn">&times;</button>
      </div>
      <div class="ma-modal-body">
        <div class="ma-form-group">
          <label>标题</label>
          <input type="text" id="ma-title" value="${escapeHtml(pageInfo.title)}" />
        </div>
        <div class="ma-form-group">
          <label>类型</label>
          <select id="ma-type">
            <option value="LINK">链接</option>
            <option value="TEXT">文本</option>
            <option value="INSPIRATION">灵感</option>
          </select>
        </div>
        <div class="ma-form-group">
          <label>备注</label>
          <textarea id="ma-note" placeholder="添加备注...">${escapeHtml(pageInfo.selection)}</textarea>
        </div>
      </div>
      <div class="ma-modal-footer">
        <button class="ma-btn ma-btn-secondary" id="ma-cancel">取消</button>
        <button class="ma-btn ma-btn-primary" id="ma-save">保存</button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // 绑定事件
  modal.querySelector('.ma-close-btn').addEventListener('click', () => modal.remove())
  modal.querySelector('#ma-cancel').addEventListener('click', () => modal.remove())
  modal.querySelector('#ma-save').addEventListener('click', () => {
    const data = {
      type: document.getElementById('ma-type').value,
      title: document.getElementById('ma-title').value,
      content: document.getElementById('ma-note').value,
      sourceUrl: pageInfo.url
    }
    
    chrome.runtime.sendMessage({ action: 'saveMaterial', data }, (response) => {
      if (response?.success) {
        showToast('✅ 保存成功！')
        modal.remove()
      } else {
        showToast('❌ 保存失败，请检查服务是否正常')
      }
    })
  })
  
  // 点击背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove()
  })
}

// 显示提示
function showToast(message) {
  const toast = document.createElement('div')
  toast.className = 'ma-toast'
  toast.textContent = message
  document.body.appendChild(toast)
  
  setTimeout(() => {
    toast.classList.add('ma-toast-show')
  }, 10)
  
  setTimeout(() => {
    toast.classList.remove('ma-toast-show')
    setTimeout(() => toast.remove(), 300)
  }, 2000)
}

// HTML转义
function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

// 监听选中文本后显示浮动按钮
document.addEventListener('mouseup', (e) => {
  const selection = window.getSelection()
  const text = selection?.toString().trim()
  
  // 移除已存在的选中文本按钮
  const existing = document.getElementById('ma-selection-btn')
  if (existing) existing.remove()
  
  if (text && text.length > 10) {
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    
    const btn = document.createElement('div')
    btn.id = 'ma-selection-btn'
    btn.innerHTML = '📝 收藏'
    btn.style.cssText = `
      position: fixed;
      left: ${rect.right + 10}px;
      top: ${rect.top + window.scrollY}px;
      z-index: 999999;
    `
    
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      chrome.runtime.sendMessage({
        action: 'saveMaterial',
        data: {
          type: 'TEXT',
          title: text.slice(0, 50),
          content: text,
          sourceUrl: location.href
        }
      }, (response) => {
        if (response?.success) {
          showToast('✅ 已收藏选中文字')
        }
        btn.remove()
      })
    })
    
    document.body.appendChild(btn)
    
    // 点击其他地方移除
    setTimeout(() => {
      document.addEventListener('click', function removeBtn() {
        const btn = document.getElementById('ma-selection-btn')
        if (btn) btn.remove()
        document.removeEventListener('click', removeBtn)
      })
    }, 100)
  }
})

// 页面加载完成后注入浮动按钮
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createFloatingButton)
} else {
  createFloatingButton()
}

console.log('素材灵感助手内容脚本已加载')
