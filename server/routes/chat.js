const express = require('express');
const { agentLoop } = require('../agent/loop');
const { rateLimitMiddleware, concurrencyControl } = require('../rate-limit');

const router = express.Router();

/**
 * POST /api/chat
 * SSE 流式 Agentic 对话
 *
 * Body: { message: string, history?: Array<{role, content}> }
 * Response: text/event-stream
 *
 * 中间件：限流 + 并发控制
 */
router.post('/', rateLimitMiddleware, concurrencyControl, async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message 是必填参数' });
  }

  // 设置 SSE 头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // 发送 SSE 事件的辅助函数
  function sendEvent(event, data) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  try {
    const result = await agentLoop(message, history, {
      onThinking(tool, args) {
        sendEvent('thinking', { tool, args });
      },
      onToolResult(tool, result) {
        sendEvent('tool_result', { tool, result });
      },
      onMessage(text) {
        sendEvent('message', { text });
      },
      onDone(summary) {
        sendEvent('done', summary);
      },
    });
  } catch (err) {
    console.error('[chat] SSE 对话出错:', err.message);
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
});

module.exports = router;
