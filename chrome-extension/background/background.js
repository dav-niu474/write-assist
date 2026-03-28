// 素材灵感助手 - Background Script

// 默认API地址
const DEFAULT_API_URL = 'http://localhost:3000'

// 安装时创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  // 收藏页面
  chrome.contextMenus.create({
    id: 'savePage',
    title: '收藏当前页面',
    contexts: ['page']
  })
  
  // 收藏选中文字
  chrome.contextMenus.create({
    id: 'saveSelection',
    title: '收藏选中文字',
    contexts: ['selection']
  })
  
  // 收藏图片
  chrome.contextMenus.create({
    id: 'saveImage',
    title: '收藏图片',
    contexts: ['image']
  })
  
  // 收藏链接
  chrome.contextMenus.create({
    id: 'saveLink',
    title: '收藏链接',
    contexts: ['link']
  })
  
  console.log('素材灵感助手已安装')
})

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const settings = await getSettings()
  
  switch (info.menuItemId) {
    case 'savePage':
      await saveMaterial({
        type: 'LINK',
        title: tab?.title || '未命名页面',
        sourceUrl: tab?.url || '',
        content: ''
      }, settings.apiUrl)
      break
      
    case 'saveSelection':
      await saveMaterial({
        type: 'TEXT',
        title: info.selectionText?.slice(0, 50) || '选中文字',
        content: info.selectionText || '',
        sourceUrl: tab?.url || ''
      }, settings.apiUrl)
      break
      
    case 'saveImage':
      await saveMaterial({
        type: 'IMAGE',
        title: '图片收藏',
        sourceUrl: info.srcUrl || '',
        content: `图片来源: ${info.srcUrl}`
      }, settings.apiUrl)
      break
      
    case 'saveLink':
      await saveMaterial({
        type: 'LINK',
        title: info.linkUrl || '链接收藏',
        sourceUrl: info.linkUrl || ''
      }, settings.apiUrl)
      break
  }
})

// 保存素材到API
async function saveMaterial(data, apiUrl) {
  try {
    const response = await fetch(`${apiUrl || DEFAULT_API_URL}/api/materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    
    if (result.material) {
      // 显示成功通知
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '收藏成功',
        message: `"${data.title.slice(0, 30)}" 已保存到素材库`
      })
    } else {
      throw new Error('保存失败')
    }
  } catch (error) {
    console.error('Save material error:', error)
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '收藏失败',
      message: '请检查API服务是否正常运行'
    })
  }
}

// 获取设置
async function getSettings() {
  const result = await chrome.storage.sync.get(['apiUrl'])
  return {
    apiUrl: result.apiUrl || DEFAULT_API_URL
  }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveMaterial') {
    getSettings().then(settings => {
      saveMaterial(request.data, settings.apiUrl)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }))
    })
    return true // 保持消息通道开启
  }
  
  if (request.action === 'getSettings') {
    getSettings().then(settings => sendResponse(settings))
    return true
  }
  
  if (request.action === 'saveSettings') {
    chrome.storage.sync.set(request.settings)
      .then(() => sendResponse({ success: true }))
    return true
  }
})
