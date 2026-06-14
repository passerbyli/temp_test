const path = require('path');

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  apiKey: process.env.OPENAI_API_KEY,
  baseUrl: process.env.BASE_URL || 'http://localhost:11434/v1',
  model: process.env.MODEL || 'mimo',
  vaultRoot: path.resolve(__dirname, '..'),
  wikiRoot: path.resolve(__dirname, '..', 'wiki'),
  rawRoot: path.resolve(__dirname, '..', 'raw'),
  draftsRoot: path.resolve(__dirname, 'drafts'),
  schemeRoot: path.resolve(__dirname, '..', 'scheme'),
  maxAgentIterations: parseInt(process.env.MAX_ITERATIONS, 10) || 10,
  maxTokens: parseInt(process.env.MAX_TOKENS, 10) || 4096,
};
