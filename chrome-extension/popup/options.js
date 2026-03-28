// 素材灵感助手 - Options Script

const API_URL_INPUT = document.getElementById('apiUrl')
const SAVE_BTN = document.getElementById('saveBtn')
const TEST_BTN = document.getElementById('testBtn')
const STATUS_DIV = document.getElementById('status')

// 加载设置
async function loadSettings() {
  chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
    if (response && response.apiUrl) {
      API_URL_INPUT.value = response.apiUrl
    }
  })
}

// 保存设置
SAVE_BTN.addEventListener('click', () => {
  const apiUrl = API_URL_INPUT.value.trim()
  
  chrome.runtime.sendMessage({ 
    action: 'saveSettings', 
    settings: { apiUrl } 
  }, () => {
    showStatus(true, '✅ 设置已保存')
  })
})

// 测试连接
TEST_BTN.addEventListener('click', async () => {
  const apiUrl = API_URL_INPUT.value.trim()
  
  try {
    const response = await fetch(`${apiUrl}/api/materials?sortBy=createdAt&sortOrder=desc`)
    
    if (response.ok) {
      showStatus(true, '✅ 连接成功！服务正常运行')
    } else {
      showStatus(false, '❌ 服务响应异常')
    }
  } catch (error) {
    showStatus(false, '❌ 连接失败，请检查地址是否正确')
  }
})

// 显示状态
function showStatus(success, message) {
  STATUS_DIV.className = `status ${success ? 'success' : 'error'}`
  STATUS_DIV.textContent = message
}

// 初始化
loadSettings()
