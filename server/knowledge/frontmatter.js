const matter = require('gray-matter');

/**
 * 解析 Markdown 文件的 YAML frontmatter
 * @param {string} content - Markdown 原始内容
 * @returns {{ meta: object, body: string }}
 */
function parseFrontmatter(content) {
  const { data: meta, content: body } = matter(content);
  return { meta, body: body.trim() };
}

/**
 * 从文件路径读取并解析 frontmatter
 * @param {string} filePath - 文件绝对路径
 * @returns {{ meta: object, body: string }}
 */
function parseFrontmatterFile(filePath) {
  const fs = require('fs');
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseFrontmatter(content);
}

module.exports = { parseFrontmatter, parseFrontmatterFile };
