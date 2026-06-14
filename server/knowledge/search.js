const fs = require('fs');
const path = require('path');
const config = require('../config');
const { listWikiFiles, readWikiFile, readSchemeIndex } = require('./reader');

/**
 * 全文搜索 wiki/ 下所有 Markdown 文件
 * @param {string} keyword - 搜索关键词
 * @param {string} [category] - 限定分类目录 (US, API, 技术知识, 等)
 * @returns {Array<{path, title, snippets, matchCount}>}
 */
function searchWikiFiles(keyword, category = '') {
  const files = category ? listWikiFiles(category) : getAllWikiFiles();
  const lowerKeyword = keyword.toLowerCase();
  const results = [];

  for (const relPath of files) {
    const filePath = path.join(config.wikiRoot, relPath);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const snippets = [];
      let matchCount = 0;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(lowerKeyword)) {
          matchCount++;
          // 获取匹配行的上下文（前后各1行）
          const start = Math.max(0, i - 1);
          const end = Math.min(lines.length - 1, i + 1);
          const snippet = lines.slice(start, end + 1).join('\n').trim();
          if (snippets.length < 3) { // 最多返回3个片段
            snippets.push({ line: i + 1, text: snippet });
          }
        }
      }

      if (matchCount > 0) {
        // 尝试从 frontmatter 或第一行提取标题
        const title = extractTitle(content, relPath);
        results.push({ path: relPath, title, snippets, matchCount });
      }
    } catch {
      // 跳过不可读文件
    }
  }

  // 按匹配次数排序
  results.sort((a, b) => b.matchCount - a.matchCount);
  return results;
}

/**
 * 搜索 US 索引
 */
function searchUSIndex(filters = {}) {
  const index = readSchemeIndex('us-index');
  if (!index) return [];

  let items = Array.isArray(index) ? index : (index.items || index.data || []);

  if (filters.id) {
    const id = filters.id.toUpperCase();
    items = items.filter(item => (item.id || '').toUpperCase().includes(id));
  }
  if (filters.module) {
    const mod = filters.module.toLowerCase();
    items = items.filter(item => (item.module || '').toLowerCase().includes(mod));
  }
  if (filters.status) {
    const status = filters.status.toLowerCase();
    items = items.filter(item => (item.status || '').toLowerCase().includes(status));
  }
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    items = items.filter(item =>
      (item.title || '').toLowerCase().includes(kw) ||
      (item.description || '').toLowerCase().includes(kw)
    );
  }

  return items;
}

/**
 * 搜索 API 索引
 */
function searchAPIIndex(filters = {}) {
  const index = readSchemeIndex('api-index');
  if (!index) return [];

  let items = Array.isArray(index) ? index : (index.items || index.data || []);

  if (filters.id) {
    const id = filters.id.toUpperCase();
    items = items.filter(item => (item.id || '').toUpperCase().includes(id));
  }
  if (filters.module) {
    const mod = filters.module.toLowerCase();
    items = items.filter(item => (item.module || '').toLowerCase().includes(mod));
  }
  if (filters.method) {
    const method = filters.method.toUpperCase();
    items = items.filter(item => (item.method || '').toUpperCase() === method);
  }
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    items = items.filter(item =>
      (item.title || '').toLowerCase().includes(kw) ||
      (item.path || '').toLowerCase().includes(kw) ||
      (item.description || '').toLowerCase().includes(kw)
    );
  }

  return items;
}

// --- 内部工具 ---

function getAllWikiFiles() {
  const results = [];
  walkDir(config.wikiRoot, results);
  return results;
}

function walkDir(dir, results) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      walkDir(fullPath, results);
    } else if (entry.name.endsWith('.md')) {
      results.push(path.relative(config.wikiRoot, fullPath));
    }
  }
}

function extractTitle(content, filePath) {
  // 先从 frontmatter 取 title
  const fmMatch = content.match(/^---\n[\s\S]*?title:\s*(.+)\n[\s\S]*?---/);
  if (fmMatch) return fmMatch[1].trim();
  // 再从第一个 # 标题取
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  // 兜底用文件名
  return path.basename(filePath, '.md');
}

module.exports = { searchWikiFiles, searchUSIndex, searchAPIIndex };
