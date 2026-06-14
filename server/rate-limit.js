/**
 * 轻量级并发控制 — 无外部依赖，内存级实现
 *
 * 三层防护：
 * 1. 限流器 (RateLimiter)  — 每 IP 每分钟最多 N 次请求
 * 2. 并发锁 (ConcurrencyLock) — 全局最多 M 个同时进行的 Agent 任务
 * 3. 超时控制 — Agent 循环单次最长运行 T 秒
 */

// --- 配置 ---
const LIMITS = {
  // 每 IP 每分钟最多请求次数
  rateLimitPerIP: parseInt(process.env.RATE_LIMIT_PER_IP, 10) || 10,
  // 全局最大并发 Agent 任务数
  maxConcurrency: parseInt(process.env.MAX_CONCURRENCY, 10) || 5,
  // 单次 Agent 任务最长运行时间（秒）
  agentTimeoutSec: parseInt(process.env.AGENT_TIMEOUT_SEC, 10) || 120,
  // 队列最大等待数（超出直接拒绝）
  maxQueueSize: parseInt(process.env.MAX_QUEUE_SIZE, 10) || 20,
};

// --- 1. 限流器：滑动窗口计数器 ---

const ipRequests = new Map(); // ip -> [timestamp, ...]

// 每分钟清理过期记录
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of ipRequests) {
    const fresh = times.filter(t => now - t < 60000);
    if (fresh.length === 0) ipRequests.delete(ip);
    else ipRequests.set(ip, fresh);
  }
}, 30000);

function checkRateLimit(ip) {
  const now = Date.now();
  const times = ipRequests.get(ip) || [];
  const fresh = times.filter(t => now - t < 60000);
  if (fresh.length >= LIMITS.rateLimitPerIP) {
    const retryAfter = Math.ceil((fresh[0] + 60000 - now) / 1000);
    return { allowed: false, retryAfter, remaining: 0 };
  }
  fresh.push(now);
  ipRequests.set(ip, fresh);
  return { allowed: true, retryAfter: 0, remaining: LIMITS.rateLimitPerIP - fresh.length };
}

// --- 2. 并发锁：信号量 ---

let activeTasks = 0;
const waitQueue = []; // { resolve, reject, ip }

function acquireConcurrency(ip) {
  return new Promise((resolve, reject) => {
    if (activeTasks < LIMITS.maxConcurrency) {
      activeTasks++;
      resolve();
      return;
    }
    if (waitQueue.length >= LIMITS.maxQueueSize) {
      reject(new Error('服务繁忙，请稍后重试'));
      return;
    }
    waitQueue.push({ resolve, reject, ip });
  });
}

function releaseConcurrency() {
  activeTasks--;
  if (waitQueue.length > 0) {
    const next = waitQueue.shift();
    activeTasks++;
    next.resolve();
  }
}

// --- 3. Express 中间件 ---

/**
 * 限流中间件 — 放在 /api/chat 路由上
 */
function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const { allowed, retryAfter, remaining } = checkRateLimit(ip);

  res.setHeader('X-RateLimit-Limit', LIMITS.rateLimitPerIP);
  res.setHeader('X-RateLimit-Remaining', remaining);

  if (!allowed) {
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      error: '请求过于频繁，请稍后再试',
      retryAfter,
    });
  }
  next();
}

/**
 * 并发控制中间件 — 包装 async handler
 * 使用方式：router.post('/', concurrencyControl, handler)
 */
function concurrencyControl(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  acquireConcurrency(ip)
    .then(() => {
      // 请求结束时释放（防止 finish + close 双重触发）
      let released = false;
      const safeRelease = () => {
        if (!released) { released = true; releaseConcurrency(); }
      };
      res.on('finish', safeRelease);
      res.on('close', safeRelease);
      next();
    })
    .catch((err) => {
      res.status(503).json({ error: err.message });
    });
}

module.exports = {
  LIMITS,
  rateLimitMiddleware,
  concurrencyControl,
  getStats: () => ({
    activeTasks,
    queueLength: waitQueue.length,
    rateLimitPerIP: LIMITS.rateLimitPerIP,
    maxConcurrency: LIMITS.maxConcurrency,
    agentTimeoutSec: LIMITS.agentTimeoutSec,
  }),
};
