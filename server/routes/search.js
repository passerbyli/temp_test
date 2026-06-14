const express = require('express');
const { searchWikiFiles } = require('../knowledge/search');

const router = express.Router();

/**
 * GET /api/search?keyword=登录&category=US
 * 全文搜索 wiki 文件
 */
router.get('/', (req, res) => {
  const { keyword, category } = req.query;

  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: 'keyword 是必填参数' });
  }

  const results = searchWikiFiles(keyword, category || '');
  res.json({ data: results, total: results.length, keyword });
});

module.exports = router;
