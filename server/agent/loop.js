const OpenAI = require('openai');
const config = require('../config');
const { tools, executeTool } = require('./tools');
const { SYSTEM_PROMPT } = require('./prompts');

// 超时时间（秒），可通过环境变量 AGENT_TIMEOUT_SEC 配置
const AGENT_TIMEOUT_MS = (parseInt(process.env.AGENT_TIMEOUT_SEC, 10) || 120) * 1000;

/**
 * Agentic 循环 — 核心！
 * 使用 OpenAI 兼容 API（支持 MiMo、Ollama、vLLM 等）
 *
 * @param {string} userMessage - 用户消息
 * @param {Array} history - 对话历史 [{role, content}]
 * @param {object} callbacks - 回调
 *   - onThinking(tool, args)  — 工具调用开始
 *   - onToolResult(tool, result) — 工具返回结果
 *   - onMessage(text) — 流式文本片段
 *   - onDone(summary) — 循环结束
 */
async function agentLoop(userMessage, history = [], callbacks = {}) {
  // 超时控制：整体任务限时
  return Promise.race([
    _agentLoopInner(userMessage, history, callbacks),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`任务超时（${AGENT_TIMEOUT_MS / 1000}秒），请缩短问题或稍后重试`)), AGENT_TIMEOUT_MS)
    ),
  ]).catch(err => {
    const errorText = `\n\n⚠️ ${err.message}`;
    callbacks.onMessage?.(errorText);
    callbacks.onDone?.({ iterations: 0, error: err.message, reason: 'timeout' });
    return { text: errorText, iterations: 0, usage: { inputTokens: 0, outputTokens: 0 }, error: err.message };
  });
}

async function _agentLoopInner(userMessage, history = [], callbacks = {}) {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });

  // 构建消息列表（system 消息放第一条）
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userMessage },
  ];

  let iterations = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let finalText = '';

  while (iterations < config.maxAgentIterations) {
    iterations++;

    try {
      const response = await client.chat.completions.create({
        model: config.model,
        max_tokens: config.maxTokens,
        tools: tools,
        messages: messages,
      });

      const choice = response.choices?.[0];
      if (!choice) {
        throw new Error('API 返回空响应');
      }

      const message = choice.message;

      // 累计 token 用量
      if (response.usage) {
        totalInputTokens += response.usage.prompt_tokens || 0;
        totalOutputTokens += response.usage.completion_tokens || 0;
      }

      // 处理文本内容
      if (message.content) {
        finalText += message.content;
        callbacks.onMessage?.(message.content);
      }

      // 处理工具调用
      const toolCalls = message.tool_calls || [];
      if (toolCalls.length === 0 || choice.finish_reason === 'stop') {
        // 最终回答
        callbacks.onDone?.({
          iterations,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          stopReason: choice.finish_reason,
        });
        return {
          text: finalText,
          iterations,
          usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
        };
      }

      // 将 assistant 消息（含 tool_calls）加入历史
      messages.push(message);

      // 执行所有工具调用
      for (const toolCall of toolCalls) {
        const fnName = toolCall.function.name;
        let fnArgs;
        try {
          fnArgs = JSON.parse(toolCall.function.arguments || '{}');
        } catch {
          fnArgs = {};
        }

        callbacks.onThinking?.(fnName, fnArgs);

        // 执行工具
        const toolResult = await executeTool(fnName, fnArgs);
        callbacks.onToolResult?.(fnName, toolResult.result);

        // 将工具结果加入历史
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResult.result,
        });
      }

    } catch (err) {
      console.error(`[agent] 迭代 ${iterations} 出错:`, err.message);
      const errorText = `\n\n⚠️ 处理出错: ${err.message}`;
      finalText += errorText;
      callbacks.onMessage?.(errorText);
      callbacks.onDone?.({
        iterations,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        error: err.message,
      });
      return {
        text: finalText,
        iterations,
        usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
        error: err.message,
      };
    }
  }

  // 达到最大迭代次数
  callbacks.onDone?.({
    iterations,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    reason: 'max_iterations',
  });
  return {
    text: finalText || '达到最大工具调用次数，请尝试更具体的问题。',
    iterations,
    usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
  };
}

module.exports = { agentLoop };
