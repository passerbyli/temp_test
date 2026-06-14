/**
 * OpenAI 兼容 API 工具定义 + 工具执行器
 *
 * 只读工具：搜索、查询、列出文件（无副作用）
 * 写入工具：仅 write_wiki_file 写入 server/drafts/ 暂存区
 *           不修改 wiki/，不重建索引，由用户在 Obsidian + CC 中手动处理
 */

const { searchWikiFiles, searchUSIndex, searchAPIIndex } = require('../knowledge/search');
const {
  readWikiFile, listWikiFiles, listWikiCategories,
  writeWikiFile, listDrafts,
  listRawFiles,
} = require('../knowledge/reader');

// --- OpenAI Function Calling 格式工具定义 ---

const tools = [
  {
    type: 'function',
    function: {
      name: 'search_wiki',
      description: '在 wiki 知识库中搜索关键词。返回匹配的文件列表和内容片段。适合用于发现相关知识文章。',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '搜索关键词' },
          category: {
            type: 'string',
            enum: ['US', 'API', '技术知识', '功能地图', '产品演进', '架构决策'],
            description: '限定搜索范围（可选）',
          },
        },
        required: ['keyword'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: '读取指定文件的完整内容。传入文件的相对路径（如 wiki/US/用户中心/US-001-登录.md，或 00-系统/模板/US模板.md）。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件相对路径' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_modules',
      description: '列出所有模块及其文件数量。适合了解知识库的整体结构。',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_us_index',
      description: '查询 US（用户故事）索引。支持按 id、标题、模块、状态等筛选。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'US 编号，如 US-001' },
          module: { type: 'string', description: '模块名' },
          status: { type: 'string', description: '状态' },
          keyword: { type: 'string', description: '标题关键词' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_api_index',
      description: '查询 API 索引。支持按 id、标题、模块、HTTP 方法等筛选。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'API 编号，如 API-001' },
          module: { type: 'string', description: '模块名' },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            description: 'HTTP 方法',
          },
          keyword: { type: 'string', description: '路径或标题关键词' },
        },
      },
    },
  },
  // --- 草稿工具 ---
  {
    type: 'function',
    function: {
      name: 'write_wiki_file',
      description: '将新文章写入草稿暂存区（server/drafts/），不会直接修改 wiki/。创建新文章时应参考 00-系统/模板/ 中的模板格式（先用 read_file 读取模板）。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '相对于 wiki/ 的目标路径，如 US/用户中心/US-003-密码重置.md' },
          content: { type: 'string', description: '完整的 Markdown 内容（含 YAML frontmatter）' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_drafts',
      description: '列出草稿暂存区（server/drafts/）中待处理的文章。',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_raw_files',
      description: '列出 raw/ 目录下的原始数据文件（Excel、代码仓文档等）。用于发现可导入的原始数据。',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['US', 'API', '代码仓'],
            description: '限定分类（可选）',
          },
        },
      },
    },
  },
];

// --- 工具执行器 ---

async function executeTool(name, input) {
  try {
    switch (name) {
      case 'search_wiki': {
        const results = searchWikiFiles(input.keyword, input.category || '');
        if (results.length === 0) {
          return { result: `未找到与 "${input.keyword}" 相关的 wiki 文件。` };
        }
        const formatted = results.slice(0, 10).map(r =>
          `📄 ${r.path}\n   标题: ${r.title} | 匹配 ${r.matchCount} 次\n` +
          r.snippets.map(s => `   L${s.line}: ${s.text.substring(0, 200)}`).join('\n')
        ).join('\n\n');
        return { result: `找到 ${results.length} 个匹配文件：\n\n${formatted}` };
      }

      case 'read_file': {
        const file = readWikiFile(input.path);
        if (!file) {
          return { result: `文件不存在: ${input.path}` };
        }
        const maxLen = 8000;
        let content = file.body || file.raw;
        if (content.length > maxLen) {
          content = content.substring(0, maxLen) + `\n\n... (文件截断，共 ${content.length} 字符)`;
        }
        return { result: `📄 ${input.path}\n\n${content}` };
      }

      case 'list_modules': {
        const categories = listWikiCategories();
        if (categories.length === 0) {
          return { result: '知识库暂无模块数据。wiki/ 目录下可能还没有内容。' };
        }
        const modules = categories.map(cat => {
          const files = listWikiFiles(cat);
          return `📁 ${cat} (${files.length} 个文件)\n` +
            files.slice(0, 10).map(f => `   - ${f}`).join('\n') +
            (files.length > 10 ? `\n   ... 还有 ${files.length - 10} 个文件` : '');
        }).join('\n\n');
        return { result: `知识库模块列表：\n\n${modules}` };
      }

      case 'query_us_index': {
        const results = searchUSIndex(input);
        if (results.length === 0) return { result: '未找到匹配的 US 记录。' };
        const formatted = results.slice(0, 20).map(item => {
          const parts = [];
          if (item.id) parts.push(`ID: ${item.id}`);
          if (item.title) parts.push(`标题: ${item.title}`);
          if (item.module) parts.push(`模块: ${item.module}`);
          if (item.status) parts.push(`状态: ${item.status}`);
          if (item.description) parts.push(`描述: ${item.description.substring(0, 150)}`);
          return parts.join(' | ');
        }).join('\n');
        return { result: `找到 ${results.length} 条 US 记录：\n\n${formatted}` };
      }

      case 'query_api_index': {
        const results = searchAPIIndex(input);
        if (results.length === 0) return { result: '未找到匹配的 API 记录。' };
        const formatted = results.slice(0, 20).map(item => {
          const parts = [];
          if (item.id) parts.push(`ID: ${item.id}`);
          if (item.method) parts.push(`方法: ${item.method}`);
          if (item.path) parts.push(`路径: ${item.path}`);
          if (item.title) parts.push(`标题: ${item.title}`);
          if (item.module) parts.push(`模块: ${item.module}`);
          return parts.join(' | ');
        }).join('\n');
        return { result: `找到 ${results.length} 条 API 记录：\n\n${formatted}` };
      }

      case 'write_wiki_file': {
        const { path: relPath, content } = input;
        if (!relPath || !content) {
          return { result: '缺少必填参数 path 或 content', isError: true };
        }
        const { action, draftsPath } = writeWikiFile(relPath, content);
        return { result: `✅ 已${action === 'created' ? '创建' : '更新'}草稿: ${draftsPath}` };
      }

      case 'list_drafts': {
        const drafts = listDrafts();
        if (drafts.length === 0) return { result: '暂存区为空。' };
        const formatted = drafts.map(d =>
          `📄 ${d.path}  (${Math.round(d.size / 1024)}KB)`
        ).join('\n');
        return { result: `暂存区草稿（共 ${drafts.length} 个）：\n\n${formatted}` };
      }

      case 'list_raw_files': {
        const rawFiles = listRawFiles(input.category || '');
        if (rawFiles.length === 0) {
          return { result: 'raw/ 目录下没有原始数据文件。' };
        }
        return { result: `raw/ 文件（共 ${rawFiles.length} 个）：\n\n${rawFiles.map(f => `📄 ${f}`).join('\n')}` };
      }

      default:
        return { result: `未知工具: ${name}`, isError: true };
    }
  } catch (err) {
    return { result: `工具执行出错 (${name}): ${err.message}`, isError: true };
  }
}

module.exports = { tools, executeTool };
