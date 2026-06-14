/**
 * LLM Wiki Chat UI — 前端交互逻辑
 */
(function () {
  'use strict';

  // --- DOM ---
  const chatContainer = document.getElementById('chatContainer');
  const messagesDiv = document.getElementById('messages');
  const welcomeDiv = document.getElementById('welcome');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const newChatBtn = document.getElementById('newChatBtn');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const chatHistory = document.getElementById('chatHistory');
  const quickLinks = document.getElementById('quickLinks');

  // --- 状态 ---
  let currentHistory = []; // 对话历史
  let isStreaming = false;
  let conversations = []; // 所有对话列表
  let currentConversationIdx = -1;

  // --- 初始化 ---
  function init() {
    // marked 配置
    if (window.marked) {
      marked.setOptions({ breaks: true, gfm: true });
    }

    // 事件绑定
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', handleKeydown);
    userInput.addEventListener('input', autoResize);
    newChatBtn.addEventListener('click', newChat);
    sidebarToggle.addEventListener('click', toggleSidebar);

    // 快捷入口
    quickLinks.addEventListener('click', handleQuickLink);

    // 示例问题
    document.querySelectorAll('.example-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        userInput.value = btn.dataset.q;
        sendMessage();
      });
    });

    // 检查连接状态
    checkConnection();
  }

  // --- 核心功能 ---

  async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || isStreaming) return;

    // 隐藏欢迎页
    welcomeDiv.style.display = 'none';

    // 显示用户消息
    appendMessage('user', text);
    userInput.value = '';
    autoResize();
    isStreaming = true;
    sendBtn.disabled = true;

    // 创建 AI 消息容器
    const aiMsgDiv = appendMessage('ai', '');
    const contentDiv = aiMsgDiv.querySelector('.message-content');

    // 添加思考指示器
    const thinkingEl = createThinkingIndicator('正在思考...');
    contentDiv.appendChild(thinkingEl);

    let fullText = '';
    let toolCallsHtml = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: currentHistory }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // 保留不完整的行

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.substring(7).trim();
          } else if (line.startsWith('data: ')) {
            const data = line.substring(6);
            try {
              const parsed = JSON.parse(data);
              handleSSEEvent(eventType, parsed, contentDiv, thinkingEl, {
                text: (t) => { fullText += t; },
                toolCalls: (h) => { toolCallsHtml += h; },
              });
            } catch {
              // 忽略解析错误
            }
            eventType = '';
          }
        }
      }

      // 渲染最终内容
      thinkingEl.remove();
      let finalHtml = toolCallsHtml;
      if (fullText) {
        finalHtml += renderMarkdown(fullText);
      }
      contentDiv.innerHTML = finalHtml || '<em>无回答内容</em>';

      // 保存到对话历史
      currentHistory.push({ role: 'user', content: text });
      currentHistory.push({ role: 'assistant', content: fullText });

    } catch (err) {
      thinkingEl.remove();
      contentDiv.innerHTML = `<span style="color: var(--error)">❌ 发送失败: ${err.message}</span>`;
    } finally {
      isStreaming = false;
      sendBtn.disabled = false;
      userInput.focus();
    }
  }

  function handleSSEEvent(event, data, contentDiv, thinkingEl, state) {
    switch (event) {
      case 'thinking':
        thinkingEl.innerHTML = `<span class="spinner"></span> 🔍 正在调用 ${data.tool}...`;
        break;

      case 'tool_result':
        // 折叠展示工具调用结果
        const toolHtml = createToolCallHtml(data.tool, data.result);
        contentDiv.insertBefore(toolHtml, thinkingEl);
        thinkingEl.innerHTML = `<span class="spinner"></span> 正在分析结果...`;
        break;

      case 'message':
        state.text(data.text);
        break;

      case 'done':
        // 完成，更新思考指示器
        thinkingEl.innerHTML = `✅ 完成 (${data.iterations || '?'} 轮工具调用)`;
        break;

      case 'error':
        contentDiv.appendChild(
          createEl('div', { style: 'color: var(--error); margin: 8px 0;' }, `⚠️ ${data.message}`)
        );
        break;
    }
  }

  // --- 快捷入口 ---

  async function handleQuickLink(e) {
    const link = e.target.closest('a');
    if (!link) return;
    e.preventDefault();

    const action = link.dataset.action;
    let query = '';

    switch (action) {
      case 'modules':
        query = '列出所有模块';
        break;
      case 'search-us':
        query = '列出所有 US 用户故事';
        break;
      case 'search-api':
        query = '列出所有 API 接口';
        break;
      case 'stats':
        query = '知识库的统计信息';
        break;
    }

    if (query) {
      userInput.value = query;
      sendMessage();
    }
  }

  // --- UI 辅助 ---

  function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `message message-${role}`;

    const content = document.createElement('div');
    content.className = 'message-content';

    if (role === 'user') {
      content.textContent = text;
    }
    // AI 的内容在流式完成后填充

    div.appendChild(content);
    messagesDiv.appendChild(div);
    scrollToBottom();
    return div;
  }

  function createThinkingIndicator(text) {
    const div = document.createElement('div');
    div.className = 'thinking-indicator';
    div.innerHTML = `<span class="spinner"></span> ${text}`;
    return div;
  }

  function createToolCallHtml(tool, result) {
    const div = document.createElement('div');
    div.className = 'tool-call';
    div.innerHTML = `
      <div class="tool-call-header" onclick="this.parentElement.classList.toggle('expanded')">
        <span class="tool-icon">🔧</span>
        <span class="tool-name">${escapeHtml(tool)}</span>
        <span class="expand-icon">▼</span>
      </div>
      <div class="tool-call-body">
        <pre>${escapeHtml(result)}</pre>
      </div>
    `;
    return div;
  }

  function renderMarkdown(text) {
    if (window.marked) {
      return `<div class="markdown-body">${marked.parse(text)}</div>`;
    }
    return `<pre>${escapeHtml(text)}</pre>`;
  }

  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function autoResize() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
  }

  function newChat() {
    currentHistory = [];
    messagesDiv.innerHTML = '';
    welcomeDiv.style.display = 'flex';
    userInput.value = '';
    userInput.focus();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function createEl(tag, attrs, text) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
    el.textContent = text;
    return el;
  }

  async function checkConnection() {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        document.getElementById('connectionStatus').textContent = '✅ 已连接';
      } else {
        document.getElementById('connectionStatus').textContent = '⚠️ 连接异常';
      }
    } catch {
      document.getElementById('connectionStatus').textContent = '❌ 无法连接';
    }
  }

  // --- 启动 ---
  init();
})();
