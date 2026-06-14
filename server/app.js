require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { loadSchemeIndexes } = require('./knowledge/reader');

// 路由
const chatRouter = require('./routes/chat');
const knowledgeRouter = require('./routes/knowledge');
const searchRouter = require('./routes/search');

const app = express();

// --- 中间件 ---
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// --- 路由挂载 ---
app.use('/api/chat', chatRouter);
app.use('/api', knowledgeRouter);
app.use('/api/search', searchRouter);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 提供商识别 ---
function detectProvider(baseUrl) {
  if (!baseUrl) return '未配置';
  const url = baseUrl.toLowerCase();
  if (url.includes('deepseek')) return 'DeepSeek';
  if (url.includes('dashscope') || url.includes('aliyun')) return '通义千问 (阿里云)';
  if (url.includes('bigmodel') || url.includes('zhipu')) return '智谱 AI (GLM)';
  if (url.includes('moonshot') || url.includes('kimi')) return 'Moonshot (Kimi)';
  if (url.includes('baidu') || url.includes('qianfan')) return '百度千帆 (文心)';
  if (url.includes('volces') || url.includes('ark')) return '字节豆包';
  if (url.includes('xf-yun') || url.includes('spark')) return '讯飞星火';
  if (url.includes('siliconflow')) return '硅基流动 (SiliconFlow)';
  if (url.includes('localhost') || url.includes('127.0.0.1')) return '本地模型 (Ollama/vLLM)';
  return baseUrl;
}

// --- 启动 ---
console.log('🔄 正在加载知识库索引...');
loadSchemeIndexes();

app.listen(config.port, '0.0.0.0', () => {
  const keyConfigured = config.apiKey && config.apiKey !== 'your-api-key-here';
  const provider = detectProvider(config.baseUrl);
  console.log(`\n🚀 LLM Wiki 知识库问答服务已启动`);
  console.log(`   本地访问: http://localhost:${config.port}`);
  console.log(`   局域网访问: http://<你的IP>:${config.port}`);
  console.log(`   模型: ${config.model}`);
  console.log(`   提供商: ${provider}`);
  console.log(`   API: ${config.baseUrl}`);
  console.log(`   状态: ${keyConfigured ? '✅ API Key 已配置' : '❌ 请编辑 server/.env 填入 API Key'}`);
  if (!keyConfigured) {
    console.log(`\n   💡 快速配置：编辑 server/.env，参考 .env.example 中各大厂示例`);
  }
  console.log('');
});
