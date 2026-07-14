# AI 办公室 - 像素风 2D 渲染技术文档

> 本文档描述如何用 Canvas 2D 实现一个像素风「AI 办公室」网页，包含完整的视觉规范和实现细节。

## 1. 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| HTML Canvas 2D | - | 像素风渲染 |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具 |
| Vitest | 1.x | 单元测试 |

无任何 UI 框架依赖（无 React/Vue），纯 Canvas 绑定 + DOM 侧栏。

## 2. 画布设置

```typescript
// 逻辑分辨率
const LOGIC_W = 960;
const LOGIC_H = 680;

// Canvas 自适应容器，DPR 适配高分屏
const dpr = window.devicePixelRatio || 1;
canvas.width = containerWidth * dpr;
canvas.height = containerHeight * dpr;
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

// 缩放：保持比例居中
const scale = Math.min(containerW / LOGIC_W, containerH / LOGIC_H);
ctx.translate((containerW - LOGIC_W * scale) / 2, (containerH - LOGIC_H * scale) / 2);
ctx.scale(scale, scale);
```

## 3. 页面布局

整体布局：左侧游戏视口（Canvas）+ 右侧信息栏（DOM）。

```
┌─────────────────────────────────────────────────────┐
│                    body (深色背景)                     │
│  ┌──────────────────────┐  ┌──────────────────────┐  │
│  │                      │  │                      │  │
│  │   Canvas 游戏视口     │  │   DOM 侧栏           │  │
│  │   960 × 680          │  │   人设卡 + 对话流      │  │
│  │                      │  │                      │  │
│  └──────────────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

CSS 关键样式：

```css
body {
  margin: 0;
  background: #1a1d26;          /* 深蓝灰背景 */
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-family: 'Courier New', monospace;
  color: #c0c0c0;
}

.game-wrap {
  display: flex;
  gap: 8px;
  border: 1px solid #2a2f3a;
  border-radius: 4px;
  padding: 8px;
}

.game-viewport {
  width: 75vw;     /* 左侧占 75% */
  height: 88vh;
  position: relative;
  background: #1e2128;
  border: 1px solid #2a2f3a;
  border-radius: 4px;
  overflow: hidden;
}

.sidebar {
  width: 340px;    /* 右侧固定 340px */
  height: 88vh;
  display: flex;
  flex-direction: column;
  border: 1px solid #2a2f3a;
  border-radius: 4px;
}
```

## 4. 办公室布局（区域配置）

采用区域配置数组，布局自动适配：

```typescript
interface ZoneConfig {
  name: string;      // 区域名
  ids: string[];     // 该区域的员工 ID
  cx: number;        // 中心 X
  cy: number;        // 中心 Y
  cols: number;      // 网格列数
  rows: number;      // 网格行数
  tint: string;      // 区域背景色（半透明）
}

const ZONES: ZoneConfig[] = [
  { name: "商业分析", ids: ["ba1","ba2"],             cx: 140, cy: 110, cols: 2, rows: 1, tint: "rgba(239,68,68,0.05)" },
  { name: "中台",     ids: ["mid"],                   cx: 480, cy: 90,  cols: 1, rows: 1, tint: "rgba(16,185,129,0.05)" },
  { name: "前端",     ids: ["fe1","fe2"],             cx: 820, cy: 110, cols: 2, rows: 1, tint: "rgba(245,158,11,0.05)" },
  { name: "后端",     ids: ["be1","be2","be3","be4","be5"], cx: 180, cy: 560, cols: 3, rows: 2, tint: "rgba(59,130,246,0.05)" },
  { name: "测试",     ids: ["qa1","qa2"],             cx: 780, cy: 560, cols: 2, rows: 1, tint: "rgba(236,72,153,0.05)" },
];
```

工位网格计算：

```typescript
function grid(cx, cy, cols, rows, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push([
      cx + (i % cols - (cols - 1) / 2) * 110,  // 水平间距 110px
      cy + (Math.floor(i / cols) - (rows - 1) / 2) * 90,  // 垂直间距 90px
    ]);
  }
  return pts;
}
```

## 5. 地板与背景

```typescript
// 1. 地板：浅灰底色 + 40px 网格线
ctx.fillStyle = "#d8dce4";
ctx.fillRect(0, 0, RW, RH);
ctx.strokeStyle = "#c8ccd4";
ctx.lineWidth = 1;
for (let x = 0; x < RW; x += 40) { /* 竖线 */ }
for (let y = 0; y < RH; y += 40) { /* 横线 */ }

// 2. 墙壁：顶部和两侧浅色条
ctx.fillStyle = "#e8ecf0";
ctx.fillRect(0, 0, RW, 20);     // 顶部墙
ctx.fillRect(0, 0, 20, RH);     // 左墙
ctx.fillRect(RW - 20, 0, 20, RH); // 右墙

// 3. 区域背景：圆角矩形 + 半透明底色 + 区域名
for (const zone of zones) {
  ctx.fillStyle = zone.tint;
  ctx.beginPath();
  ctx.roundRect(zone.x, zone.y, zone.w, zone.h, 10);
  ctx.fill();
  ctx.fillStyle = "rgba(60,70,90,0.45)";
  ctx.font = "13px sans-serif";
  ctx.fillText(zone.name, zone.x + 8, zone.y + 8);
}
```

## 6. 中央活动区

位于办公室中央，包含：

```typescript
// 活动区地板（虚线边框）
ctx.fillStyle = "rgba(245,240,230,0.5)";
ctx.beginPath();
ctx.roundRect(300, 220, 360, 280, 16);
ctx.fill();
ctx.strokeStyle = "rgba(180,170,150,0.4)";
ctx.setLineDash([8, 4]);
ctx.stroke();
ctx.setLineDash([]);

// ── 大会议桌 ──
ctx.fillStyle = "#6d5a3a";       // 桌面深色
ctx.fillRect(380, 300, 180, 80);
ctx.fillStyle = "#8b7355";       // 桌面浅色（内嵌）
ctx.fillRect(386, 306, 168, 68);
// 椅子（两侧各4把）
ctx.fillStyle = "#5a4a38";
ctx.fillRect(370, 310 + i * 18, 10, 14);  // 左侧
ctx.fillRect(560, 310 + i * 18, 10, 14);  // 右侧
// 桌牌（蓝色屏幕）
ctx.fillStyle = "#f0f0f0";
ctx.fillRect(430, 315, 80, 50);
ctx.fillStyle = "#4a7bbf";
ctx.fillRect(432, 317, 76, 46);

// ── 台球桌 ──
ctx.fillStyle = "#5a4a38";       // 框架
ctx.fillRect(350, 420, 130, 75);
ctx.fillStyle = "#2e7d32";       // 绿色台面
ctx.fillRect(354, 424, 122, 67);
// 球袋（四角 + 中央）
ctx.fillStyle = "#1a1a1a";
ctx.beginPath(); ctx.arc(358, 428, 4, 0, Math.PI * 2); ctx.fill();
// ... 共5个球袋
// 台球（彩色圆形）
const ballColors = ["#e53935","#fdd835","#1e88e5","#43a047","#ff7043","#8e24aa","#fff"];
for (let i = 0; i < 7; i++) {
  ctx.fillStyle = ballColors[i];
  ctx.beginPath();
  ctx.arc(390 + (i % 3) * 16, 445 + Math.floor(i / 3) * 16, 5, 0, Math.PI * 2);
  ctx.fill();
}

// ── 吧台 ──
ctx.fillStyle = "#5a4a38";
ctx.fillRect(530, 420, 100, 35);
// 吧凳（3个圆形）
for (let i = 0; i < 3; i++) {
  ctx.fillStyle = "#888";
  ctx.beginPath(); ctx.arc(545 + i * 28, 465, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#666";
  ctx.beginPath(); ctx.arc(545 + i * 28, 465, 5, 0, Math.PI * 2); ctx.fill();
}
// 酒瓶
ctx.fillStyle = "#1a1a1a";
ctx.fillRect(545, 428, 6, 16);
ctx.fillStyle = "#4caf50";
ctx.fillRect(565, 428, 6, 16);
```

## 7. 工位绘制

每个工位包含：木桌 + 显示器。

```typescript
for (const [x, y] of deskPositions) {
  // 木桌
  ctx.fillStyle = "#8a7252";
  ctx.fillRect(x - 35, y - 16, 70, 34);
  ctx.fillStyle = "#6a5a3f";       // 桌面内嵌
  ctx.fillRect(x - 33, y - 14, 66, 30);
  // 显示器
  ctx.fillStyle = "#1a1e28";       // 外框
  ctx.fillRect(x - 12, y - 28, 24, 14);
  ctx.fillStyle = "#2a3040";       // 屏幕
  ctx.fillRect(x - 10, y - 26, 20, 10);
}
```

## 8. 装饰物

```typescript
// ── 盆栽 ──
const plants = [[80,280],[920,280],[480,230],[80,560],[920,560]];
for (const [px, py] of plants) {
  ctx.fillStyle = "#4caf50";       // 绿叶
  ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#388e3c";       // 深绿叶
  ctx.beginPath(); ctx.arc(px, py - 5, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#795548";       // 花盆
  ctx.fillRect(px - 4, py + 6, 8, 8);
}

// ── 书架 ──
ctx.fillStyle = "#6d4c2f";         // 框架
ctx.fillRect(880, 300, 30, 70);
// 书本（彩色横条）
ctx.fillStyle = "#c75b39"; ctx.fillRect(883, 304, 24, 12);  // 红书
ctx.fillStyle = "#4a90d9"; ctx.fillRect(883, 320, 24, 12);  // 蓝书
ctx.fillStyle = "#f0c040"; ctx.fillRect(883, 336, 24, 12);  // 黄书

// ── 打印机 ──
ctx.fillStyle = "#555";
ctx.fillRect(50, 420, 40, 25);
ctx.fillStyle = "#888";
ctx.fillRect(52, 416, 36, 8);
```

## 9. 像素角色绘制

泡泡堂/ bombersman 风格：方块头 + 身体 + 腿 + 眼睛 + 名牌。

```typescript
function drawChar(ctx, x, y, color, name, talking, t) {
  const s = 2;                              // 像素缩放系数
  const bob = talking ? Math.sin(t * 8) * 2 : 0;  // 说话时上下弹跳

  // 影子
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.beginPath();
  ctx.ellipse(x, y + 16 * s, 8 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // 腿（深色）
  ctx.fillStyle = "#39414f";
  ctx.fillRect(x - 4 * s, y + 8 * s + bob, 3 * s, 8 * s);  // 左腿
  ctx.fillRect(x + 1 * s, y + 8 * s + bob, 3 * s, 8 * s);  // 右腿

  // 身体（角色主色）
  ctx.fillStyle = color;
  ctx.fillRect(x - 5 * s, y + bob, 10 * s, 8 * s);

  // 头部（肤色）
  ctx.fillStyle = "#f1c9a5";
  ctx.fillRect(x - 5 * s, y - 10 * s + bob, 10 * s, 10 * s);

  // 头发（角色主色）
  ctx.fillStyle = color;
  ctx.fillRect(x - 5 * s, y - 10 * s + bob, 10 * s, 4 * s);

  // 眼睛
  ctx.fillStyle = "#2b2f3a";
  ctx.fillRect(x - 3 * s, y - 6 * s + bob, 2 * s, 2 * s);  // 左眼
  ctx.fillRect(x + 1 * s, y - 6 * s + bob, 2 * s, 2 * s);  // 右眼

  // 名牌（白底黑字）
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  const tw = name.length * 4 * s + 4 * s;
  ctx.fillRect(x - tw / 2, y - 16 * s + bob, tw, 5 * s);
  ctx.fillStyle = "#000";
  ctx.font = `bold ${3.5 * s}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, x, y - 13.5 * s + bob);
}
```

颜色配置（角色主色，同时用于头发和身体）：

| 员工 | color (hex) | 视觉效果 |
|------|-------------|---------|
| 小商 | #e53935 | 红色 |
| 小新 | #ff7043 | 橙色 |
| 小台 | #00897b | 青绿色 |
| 小互 | #fdd835 | 黄色 |
| 小登 | #43a047 | 绿色 |
| 小后 | #1e88e5 | 蓝色 |
| 小服 | #5c6bc0 | 靛蓝色 |
| 小端 | #7e57c2 | 紫色 |
| 小基 | #8e24aa | 深紫色 |
| 小构 | #546e7a | 蓝灰色 |
| 小测A | #d81b60 | 粉红色 |
| 小测B | #ec407a | 浅粉色 |

## 10. 对话气泡

```typescript
function drawBubble(ctx, x, y, text) {
  const s = 2;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  const bw = Math.min(text.length * 4 * s + 8 * s, 120 * s);  // 最大宽度 240px
  const bh = 12 * s;
  const bx = x - bw / 2;
  const by = y - 28 * s;

  // 圆角矩形气泡
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 4 * s);
  ctx.fill();
  ctx.strokeStyle = "#c0c0c0";
  ctx.lineWidth = 1;
  ctx.stroke();

  // 文字
  ctx.fillStyle = "#333";
  ctx.font = `${3 * s}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, by + bh / 2);
}
```

## 11. 移动动画

角色状态机：

```
idle → moving → talking → returning → idle
```

```typescript
type MoveState = "idle" | "moving" | "talking" | "returning";

interface CharItem {
  id: string; name: string; color: string;
  x: number; y: number;           // 当前位置
  homeX: number; homeY: number;   // 工位原点
  targetX: number; targetY: number; // 目标位置
  state: MoveState;               // 当前状态
  moveT: number;                  // 动画累计时间
}

// 移动逻辑（每帧调用）
function updateMovement(dt) {
  const SPEED = 120;  // 像素/秒
  for (const c of chars.values()) {
    if (c.state === "moving") {
      // 从工位走向目标
      c.moveT += dt;
      const dx = c.targetX - c.homeX, dy = c.targetY - c.homeY;
      const dur = Math.sqrt(dx*dx + dy*dy) / SPEED;
      const p = Math.min(c.moveT / dur, 1);
      c.x = c.homeX + dx * p;
      c.y = c.homeY + dy * p;
      if (p >= 1) { c.state = "talking"; c.moveT = 0; }
    }
    else if (c.state === "returning") {
      // 从当前位置走回工位
      c.moveT += dt;
      const dx = c.homeX - c.x, dy = c.homeY - c.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 1) { c.state = "idle"; c.x = c.homeX; c.y = c.homeY; continue; }
      const dur = dist / SPEED;
      const p = Math.min(c.moveT / dur, 1);
      c.x += dx * p;
      c.y += dy * p;
      if (p >= 1) { c.state = "idle"; c.x = c.homeX; c.y = c.homeY; }
    }
  }
}

// 触发移动：显示气泡时随机选择一个目标
function showBubble(id, text) {
  bubbles.set(id, { text, expiresAt: now + 4000 });
  const c = chars.get(id);
  if (c && c.state === "idle") {
    const others = [...chars.values()].filter(o => o.id !== id);
    const target = others[Math.floor(Math.random() * others.length)];
    c.targetX = target.homeX + 35;   // 目标右侧偏移
    c.targetY = target.homeY + 10;
    c.state = "moving";
    c.moveT = 0;
  }
}

// 气泡过期后返回
// 在 animate 循环中：
if (now > bubble.expiresAt) {
  bubbles.delete(id);
  c.talking = false;
  c.state = "returning";   // 触发返回
  c.moveT = 0;
}
```

## 12. 员工数据结构

```typescript
interface Employee {
  id: string;       // 唯一标识（如 "ba1", "fe2", "be3"）
  role: string;     // 角色名（如 "商业分析", "前端"）
  name: string;     // 显示名（如 "小商", "小互"）
  color: number;    // 0xRRGGBB 格式颜色值
  persona: string;  // 人设描述（性格、口头禅等）
}
```

## 13. 对话脚本格式

```typescript
interface DialogueLine {
  speaker: string;    // 员工 ID（如 "ba1", "mid"）
  text: string;       // 对话内容
}

// 示例
const SCRIPTS: DialogueLine[] = [
  { speaker: "ba1", text: "我来上班打卡一下，要打卡才有效，这是重大人设。" },
  { speaker: "mid", text: "今天要把所有数据都同步到中台去，大家加油！" },
  // ...
];
```

## 14. 事件流

```
LocalMockEngine.start()
  → 按脚本顺序触发对话
  → EventBus.emit("dialogue", { speaker, text })
  → Office2D.showBubble(speaker, text)     // 角色头顶冒泡 + 触发移动
  → Sidebar.appendMessage(speaker, text)   // 侧栏追加对话记录
  → Store.addMessage(speaker, text)        // 状态存储
```

## 15. 侧栏 UI（DOM 实现）

```html
<div class="sidebar">
  <!-- 人设卡 -->
  <div class="profile-card">
    <h3 class="name">{employee.name}</h3>
    <span class="role">{employee.role}</span>
    <p class="persona">{employee.persona}</p>
  </div>
  <!-- 对话流 -->
  <div class="dialogue-flow">
    <div class="msg">
      <span class="speaker">{speakerName}</span>
      <span class="text">{text}</span>
    </div>
  </div>
</div>
```

侧栏样式要点：

```css
.sidebar { width: 340px; background: #1e2128; overflow-y: auto; }
.profile-card {
  background: #252a34;
  border: 1px solid #3a3f4a;
  border-radius: 4px;
  margin: 8px;
  padding: 16px;
}
.msg .speaker {
  font-size: 10px;
  color: #888;
  min-width: 40px;
  display: inline-block;
}
.msg .text {
  color: #c0c0c0;
  font-size: 12px;
}
```

## 16. 适配新团队

只需修改 `employees.ts` 中的 `EMPLOYEES` 数组：

1. 修改团队人数（增减数组元素）
2. 调整 `ZONES` 配置（区域位置、网格列数）
3. 布局自动适配，无需改渲染代码

## 17. 渲染顺序

每帧绘制顺序（从底层到顶层）：

1. 地板（浅灰 + 网格线）
2. 墙壁（顶部 + 两侧）
3. 区域背景（半透明圆角矩形 + 区域名）
4. 中央活动区（会议桌 + 台球桌 + 吧台）
5. 工位（木桌 + 显示器）
6. 装饰物（盆栽 + 书架 + 打印机）
7. 角色（按 y 坐标排序，实现遮挡关系）
8. 对话气泡

## 18. 性能优化

- 使用 `requestAnimationFrame` 驱动动画循环
- DPR 适配但只绘制一次（不在每帧重新设置 transform）
- 角色数量少（12个），无需空间分区
- 气泡 4 秒自动过期，避免堆积

## 19. 完整文件结构

```
src/
├── main.ts                    # 入口
├── engine/
│   ├── types.ts               # 类型定义
│   ├── employees.ts           # 员工数据
│   ├── scripts.ts             # 对话脚本
│   └── LocalMockEngine.ts     # 模拟引擎
├── scene/
│   └── Office2D.ts            # Canvas 渲染（全部绘制逻辑）
├── state/
│   ├── store.ts               # 状态管理
│   └── EventBus.ts            # 事件总线
└── ui/
    ├── Sidebar.ts             # 侧栏 DOM
    └── styles.css             # 全局样式
```
