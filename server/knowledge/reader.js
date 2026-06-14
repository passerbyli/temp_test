const fs = require('fs');
const path = require('path');
const config = require('../config');
const { parseFrontmatter } = require('./frontmatter');

// 启动时缓存 scheme 索引
const schemeCache = {};

function loadSchemeIndexes() {
  if (!fs.existsSync(config.schemeRoot)) {
    console.log('[reader] scheme/ 目录不存在，跳过索引加载');
    return;
  }

  const files = fs.readdirSync(config.schemeRoot).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const name = path.basename(file, '.json');
    try {
      const data = JSON.parse(fs.readFileSync(path.join(config.schemeRoot, file), 'utf-8'));
      schemeCache[name] = data;
      console.log(`[reader] 已加载 scheme: ${name} (${Array.isArray(data) ? data.length + ' 条' : 'object'})`);
    } catch (err) {
      console.error(`[reader] 加载 scheme/${file} 失败:`, err.message);
    }
  }
}

/**
 * 读取 scheme 索引（内存缓存）
 */
function readSchemeIndex(name) {
  if (!(name in schemeCache)) {
    // 尝试从磁盘读取
    const filePath = path.join(config.schemeRoot, `${name}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
      schemeCache[name] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      return null;
    }
  }
  return schemeCache[name] || null;
}

/**
 * 读取 wiki/ 下的 Markdown 文件并解析 frontmatter
 */
function readWikiFile(relativePath) {
  const filePath = path.join(config.wikiRoot, relativePath);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { meta, body } = parseFrontmatter(raw);
  return { meta, body, path: relativePath, raw };
}

/**
 * 列出 wiki/{category}/ 下所有 .md 文件（递归）
 */
function listWikiFiles(category = '') {
  const dir = path.join(config.wikiRoot, category);
  if (!fs.existsSync(dir)) return [];

  const results = [];
  walkDir(dir, results, config.wikiRoot);
  return results;
}

function walkDir(dir, results, root) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, results, root);
    } else if (entry.name.endsWith('.md')) {
      const relPath = path.relative(root, fullPath);
      results.push(relPath);
    }
  }
}

/**
 * 列出所有 wiki 分类目录
 */
function listWikiCategories() {
  if (!fs.existsSync(config.wikiRoot)) return [];
  return fs.readdirSync(config.wikiRoot, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .map(d => d.name);
}

/**
 * 重新加载 scheme 缓存（用于文件变化后刷新）
 */
function reloadSchemeCache() {
  Object.keys(schemeCache).forEach(k => delete schemeCache[k]);
  loadSchemeIndexes();
}

// ==================== 草稿暂存区 ====================

/**
 * 安全路径校验 — 只允许写入 draftsRoot 下
 */
function safeDraftPath(relativePath) {
  const resolved = path.resolve(config.draftsRoot, relativePath);
  if (!resolved.startsWith(config.draftsRoot)) {
    throw new Error(`路径不安全: ${relativePath}`);
  }
  return resolved;
}

/**
 * 将文件写入草稿暂存区（server/drafts/）
 * @param {string} relativePath - 相对于 wiki/ 的目标路径（也是 drafts/ 内的路径）
 * @param {string} content - Markdown 内容（含 frontmatter）
 * @returns {{ path, action, draftsPath }}
 */
function writeWikiFile(relativePath, content) {
  const filePath = safeDraftPath(relativePath);
  const exists = fs.existsSync(filePath);

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  return {
    path: relativePath,
    action: exists ? 'updated' : 'created',
    draftsPath: `server/drafts/${relativePath}`,
  };
}

/**
 * 列出草稿暂存区中待合并的文件
 * @returns {Array<{path, size, mtime}>}
 */
function listDrafts() {
  if (!fs.existsSync(config.draftsRoot)) return [];

  const results = [];
  walkDir(config.draftsRoot, results, config.draftsRoot);
  return results.map(relPath => {
    const fullPath = path.join(config.draftsRoot, relPath);
    const stat = fs.statSync(fullPath);
    return {
      path: relPath,
      size: stat.size,
      mtime: stat.mtime.toISOString(),
    };
  });
}

/**
 * 合并草稿到 wiki/（移动文件 + 重建索引）
 * @param {string} [target] - 指定文件路径，不传则合并全部
 * @returns {{ merged: number, rebuilt: object }}
 */
function mergeDrafts(target) {
  if (!fs.existsSync(config.draftsRoot)) {
    return { merged: 0, rebuilt: { usCount: 0, apiCount: 0 } };
  }

  const drafts = target ? [target] : listDrafts().map(d => d.path);
  let merged = 0;

  for (const relPath of drafts) {
    const srcPath = safeDraftPath(relPath);
    const destPath = path.join(config.wikiRoot, relPath);

    if (!fs.existsSync(srcPath)) continue;

    // 确保目标目录存在
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // 移动文件
    fs.copyFileSync(srcPath, destPath);
    fs.unlinkSync(srcPath);
    merged++;
  }

  // 清理空目录
  cleanEmptyDirs(config.draftsRoot);

  // 重建索引
  const rebuilt = rebuildSchemeIndex('all');

  return { merged, rebuilt };
}

/**
 * 递归清理空目录
 */
function cleanEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      cleanEmptyDirs(path.join(dir, entry.name));
    }
  }
  // 再检查一次（子目录可能已被清理）
  const remaining = fs.readdirSync(dir);
  if (remaining.length === 0 && dir !== config.draftsRoot) {
    fs.rmdirSync(dir);
  }
}

// ==================== Raw 数据访问 ====================

/**
 * 列出 raw/{category}/ 下的文件
 */
function listRawFiles(category = '') {
  const dir = path.join(config.rawRoot, category);
  if (!fs.existsSync(dir)) return [];

  const results = [];
  walkDir(dir, results, config.rawRoot);
  return results;
}

/**
 * 读取 raw/ 下的文本文件（.md, .txt, .json, .yaml, .yml）
 * .xlsx 等二进制文件只返回元信息
 */
function readRawFile(relativePath) {
  const filePath = path.resolve(config.rawRoot, relativePath);
  if (!filePath.startsWith(config.rawRoot)) {
    throw new Error(`路径不安全: ${relativePath}`);
  }
  if (!fs.existsSync(filePath)) return null;

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const textExts = ['.md', '.txt', '.json', '.yaml', '.yml'];

  if (textExts.includes(ext)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { path: relativePath, type: 'text', size: stat.size, content };
  }

  // 二进制文件只返回元信息
  return {
    path: relativePath,
    type: 'binary',
    ext,
    size: stat.size,
    content: `[二进制文件 ${ext}，${Math.round(stat.size / 1024)}KB，无法直接读取]`,
  };
}

// ==================== 索引重建 ====================

/**
 * 重建 scheme/ 索引（通过扫描 wiki/ 文件）
 * 无外部脚本依赖，纯 Node.js 实现
 */
function rebuildSchemeIndex(type = 'all') {
  const usItems = [];
  const apiItems = [];

  // 扫描所有 wiki Markdown 文件
  const allFiles = listWikiFiles();
  for (const relPath of allFiles) {
    const filePath = path.join(config.wikiRoot, relPath);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { meta } = parseFrontmatter(raw);

      if (!meta || !meta.id) continue;

      const id = meta.id.toUpperCase();
      if (id.startsWith('US-') && (type === 'all' || type === 'us')) {
        usItems.push({
          id: meta.id,
          title: meta.title || '',
          module: meta.module || '',
          status: meta.status || '',
          priority: meta.priority || '',
          version: meta.version || '',
          description: (meta.body || '').substring(0, 200),
          file: relPath,
        });
      } else if (id.startsWith('API-') && (type === 'all' || type === 'api')) {
        apiItems.push({
          id: meta.id,
          title: meta.title || '',
          module: meta.module || '',
          method: meta.method || '',
          path: meta.path || '',
          status: meta.status || '',
          description: (meta.body || '').substring(0, 200),
          file: relPath,
        });
      }
    } catch {
      // 跳过解析失败的文件
    }
  }

  // 写入 JSON 索引
  if (type === 'all' || type === 'us') {
    const usPath = path.join(config.schemeRoot, 'us-index.json');
    fs.writeFileSync(usPath, JSON.stringify(usItems, null, 2), 'utf-8');
  }
  if (type === 'all' || type === 'api') {
    const apiPath = path.join(config.schemeRoot, 'api-index.json');
    fs.writeFileSync(apiPath, JSON.stringify(apiItems, null, 2), 'utf-8');
  }

  // 重载缓存
  reloadSchemeCache();

  return { usCount: usItems.length, apiCount: apiItems.length };
}

module.exports = {
  loadSchemeIndexes,
  readSchemeIndex,
  readWikiFile,
  listWikiFiles,
  listWikiCategories,
  reloadSchemeCache,
  writeWikiFile,
  listDrafts,
  mergeDrafts,
  listRawFiles,
  readRawFile,
  rebuildSchemeIndex,
};
