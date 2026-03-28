// 素材灵感助手 - Popup Script

const API_URL_INPUT = document.getElementById('apiUrl')
const STATUS_DIV = document.getElementById('status')
const SAVE_SETTINGS_BTN = document.getElementById('saveSettings')
const SAVE_PAGE_BTN = document.getElementById('savePage')
const SAVE_SELECTION_BTN = document.getElementById('saveSelection')

// 加载设置
async function loadSettings() {
  chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
    if (response) {
      API_URL_INPUT.value = response.apiUrl || 'http://localhost:3000'
      checkServerStatus(response.apiUrl)
    }
  })
}

// 保存设置
SAVE_SETTINGS_BTN.addEventListener('click', () => {
  const apiUrl = API_URL_INPUT.value.trim()
  chrome.runtime.sendMessage({ 
    action: 'saveSettings', 
    settings: { apiUrl } 
  }, () => {
    showStatus(true, '设置已保存')
    checkServerStatus(apiUrl)
  })
})

// 收藏当前页面
SAVE_PAGE_BTN.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  
  chrome.runtime.sendMessage({
    action: 'saveMaterial',
    data: {
      type: 'LINK',
      title: tab.title,
      sourceUrl: tab.url,
      content: ''
    }
  }, (response) => {
    if (response?.success) {
      showStatus(true, '✅ 页面已收藏！')
    } else {
      showStatus(false, '❌ 收藏失败')
    }
  })
})

// 收藏选中文本
SAVE_SELECTION_BTN.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  
  // 执行脚本获取选中文本
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection().toString()
  }, (results) => {
    const selection = results[0]?.result || ''
    
    if (!selection) {
      showStatus(false, '请先选中要收藏的文字')
      return
    }
    
    chrome.runtime.sendMessage({
      action: 'saveMaterial',
      data: {
        type: 'TEXT',
        title: selection.slice(0, 50),
        content: selection,
        sourceUrl: tab.url
      }
    }, (response) => {
      if (response?.success) {
        showStatus(true, '✅ 已收藏选中文本！')
      } else {
        showStatus(false, '❌ 收藏失败')
      }
    })
  })
})

// 检查服务器状态
async function checkServerStatus(apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/api/materials?sortBy=createdAt&sortOrder=desc`, {
      method: 'GET'
    })
    
    if (response.ok) {
      showStatus(true, '服务正常运行')
    } else {
      showStatus(false, '服务响应异常')
    }
  } catch (error) {
    showStatus(false, '无法连接到服务')
  }
}

// 显示状态
function showStatus(success, message) {
  STATUS_DIV.className = success ? 'status' : 'status error'
  STATUS_DIV.querySelector('.status-text').textContent = message
}

// 初始化
loadSettings()
