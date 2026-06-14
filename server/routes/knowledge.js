const express = require('express');
const { readWikiFile, readSchemeIndex, listWikiFiles, listWikiCategories } = require('../knowledge/reader');
const { searchUSIndex, searchAPIIndex } = require('../knowledge/search');
const { getStats: getSystemStats } = require('../rate-limit');

const router = express.Router();

/**
 * GET /api/us?id=US-001&module=用户中心&status=进行中
 * 查询 US 列表或详情
 */
router.get('/us', (req, res) => {
  const { id, module: mod, status, keyword } = req.query;

  // 如果指定了 id，尝试读取完整文件
  if (id) {
    const filters = { id };
    if (mod) filters.module = mod;
    const results = searchUSIndex(filters);
    if (results.length === 0) {
      return res.json({ data: [], total: 0 });
    }
    return res.json({ data: results, total: results.length });
  }

  // 否则返回列表
  const results = searchUSIndex({ module: mod, status, keyword });
  res.json({ data: results, total: results.length });
});

/**
 * GET /api/modules
 * 模块列表 + 统计
 */
router.get('/modules', (req, res) => {
  const categories = listWikiCategories();
  const modules = categories.map(cat => {
    const files = listWikiFiles(cat);
    return {
      name: cat,
      fileCount: files.length,
      files: files.slice(0, 50),
    };
  });
  res.json({ data: modules, total: modules.length });
});

/**
 * GET /api/stats
 * 知识库整体统计
 */
router.get('/stats', (req, res) => {
  const categories = listWikiCategories();
  const usIndex = readSchemeIndex('us-index');
  const apiIndex = readSchemeIndex('api-index');

  const usItems = Array.isArray(usIndex) ? usIndex : (usIndex?.items || usIndex?.data || []);
  const apiItems = Array.isArray(apiIndex) ? apiIndex : (apiIndex?.items || apiIndex?.data || []);

  let totalWikiFiles = 0;
  for (const cat of categories) {
    totalWikiFiles += listWikiFiles(cat).length;
  }

  res.json({
    wikiFiles: totalWikiFiles,
    categories: categories.length,
    usCount: usItems.length,
    apiCount: apiItems.length,
    schemeIndexes: ['us-index', 'api-index'].filter(
      name => readSchemeIndex(name) !== null
    ),
  });
});

/**
 * GET /api/system
 * 系统运行状态（并发数、队列、限流配置）
 */
router.get('/system', (req, res) => {
  const stats = getSystemStats();
  res.json({
    uptime: Math.floor(process.uptime()),
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    ...stats,
  });
});

module.exports = router;
