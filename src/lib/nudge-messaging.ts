import Database from "@tauri-apps/plugin-sql";

// =============================================================================
// Nudge messaging — dynamic, stat-personalized copy for the premium nudge.
// =============================================================================
//
// TONE OF VOICE (the whole module lives by this):
// - Warm, casual, plain-spoken. Write like a friend who noticed your good
//   habit — never like a paywall, never like a marketing email.
// - Second person ("you", "your"). One concrete true number per message.
// - At most one emoji per message. Short sentences.
// - No guilt, no threats, no fake urgency, no countdown timers.
// - The ask is always open-source support ("keeps Blink Eye free for
//   everyone"), never ransom ("pay or lose out").
// - New users get celebrated ("day one of kinder eyes"), never shown zeros.
// - Snoozes, skips, and missed breaks are NEVER mentioned anywhere.
//
// STRUCTURE (for future multilingual support):
// - Every template has a stable `id`; copy swaps per locale without touching
//   logic. Slots are named (`{streak}`, `{totalBreaks}`, …) and filled at
//   show-time. Each locale ships its own pool plus its own BANNED_PHRASES.

export type NudgeVariant = "trial_ending" | "expired" | "winback";

export type NudgeTier = "milestone" | "streak" | "cumulative" | "relevance" | "fallback";

/// Stats the copy may touch. These are the "core things you can relate with
/// a user": effort (breaks), identity (streak), care (screen hours protected),
/// gentle urgency (days left, trial pool only), belonging (tenure).
export interface NudgeStats {
  totalBreaks: number;
  streak: number;
  bestStreak: number;
  screenHoursToday: number | null;
  daysLeft: number | null;
  tenureDays: number | null;
}

export interface NudgeTemplate {
  id: string;
  variants: NudgeVariant[];
  tier: NudgeTier;
  /// Milestone key this template celebrates (tier "milestone" only).
  milestone?: string;
  headline: string;
  body: string;
  cta: string;
}

export interface ComposedMessage {
  templateId: string;
  headline: string;
  body: string;
  cta: string;
}

/// Persisted freshness state (JSON in `premiumNudgeMessageBag` config key).
export interface BagState {
  bags: Record<string, string[]>;
  lastId: string | null;
}

/// Phrases no pooled string may contain (中文文案池). Enforced by tests —
/// add a line, and the suite checks it automatically.
export const BANNED_PHRASES: string[] = [
  "最后机会",
  "立即行动",
  "别错过",
  "你会失去",
  "失去访问",
  "立即付款",
  "马上购买",
  "否则",
  "赶快",
  "懒惰",
  "浪费",
  "可耻",
  "你在无视",
  "最终警告",
];

/// Every `{slot}` any template may use. Tests reject unknown slots.
export const KNOWN_SLOTS: string[] = [
  "totalBreaks",
  "streak",
  "bestStreak",
  "screenHours",
  "daysLeft",
  "daysLeftNote",
  "tenureDays",
];

export const STREAK_MIN = 2;
export const BREAKS_MIN = 5;
export const SCREEN_HOURS_MIN = 1;
export const STREAK_MILESTONES = [5, 10, 30];
const BREAK_CLUBS: Array<{ min: number; max: number; key: string }> = [
  { min: 50, max: 60, key: "club-50" },
  { min: 100, max: 115, key: "club-100" },
  { min: 250, max: 275, key: "club-250" },
];

export const TEMPLATES: NudgeTemplate[] = [
  // ---- Shared milestone celebrations (work in every variant) ----
  {
    id: "ms-streak-5",
    variants: ["trial_ending", "expired", "winback"],
    tier: "milestone",
    milestone: "streak-5",
    headline: "连续 5 天——习惯开始成形了 🌟",
    body: "大多数人第二天就放弃了。高级版是我们回敬的高五：主题、多显示器，也让 Blink Eye 对所有人保持免费。",
    cta: "支持 Blink Eye",
  },
  {
    id: "ms-streak-10",
    variants: ["trial_ending", "expired", "winback"],
    tier: "milestone",
    milestone: "streak-10",
    headline: "两位数了：{streak} 天！🎉",
    body: "{streak} 天有意识地抬头看远处，这叫自律。升级高级版，就是在支持你这个连续记录背后的开源项目。",
    cta: "支持 Blink Eye",
  },
  {
    id: "ms-streak-30",
    variants: ["trial_ending", "expired", "winback"],
    tier: "milestone",
    milestone: "streak-30",
    headline: "{streak} 天，整整一个月对自己眼睛更温柔 🏆",
    body: "整整一个月都在照顾自己。高级版会员让下一个从第一天开始的人也能免费用。",
    cta: "支持 Blink Eye 并解锁高级版",
  },
  {
    id: "ms-club-50",
    variants: ["trial_ending", "expired", "winback"],
    tier: "milestone",
    milestone: "club-50",
    headline: "一起完成了 {totalBreaks} 次完整休息 💛",
    body: "50 次休息俱乐部达成——你有 {totalBreaks} 次选择了眼睛而不是屏幕。高级版是让这个俱乐部继续运转的方式。",
    cta: "支持 Blink Eye",
  },
  {
    id: "ms-club-100",
    variants: ["trial_ending", "expired", "winback"],
    tier: "milestone",
    milestone: "club-100",
    headline: "{totalBreaks} 次休息，三位数了！🌟",
    body: "你认真暂停了一百次。Blink Eye 免费开源——靠高级版维持下去。",
    cta: "支持 Blink Eye 并解锁高级版",
  },
  {
    id: "ms-club-250",
    variants: ["trial_ending", "expired", "winback"],
    tier: "milestone",
    milestone: "club-250",
    headline: "{totalBreaks} 次休息，传说级 🏆",
    body: "很少有人能完成 {totalBreaks} 次完整休息。这个项目就是为你这样的人存在的——高级版相当于小费罐。",
    cta: "支持 Blink Eye",
  },
  // ---- trial_ending: gentle urgency + warmth ----
  {
    id: "te-streak-1",
    variants: ["trial_ending"],
    tier: "streak",
    headline: "看看你，连续 {streak} 天了 🎉",
    body: "这习惯是真的在养成。{daysLeftNote} 高级版让工具箱保持锋利——主题、多显示器，还有更多。",
    cta: "查看高级版",
  },
  {
    id: "te-streak-2",
    variants: ["trial_ending"],
    tier: "streak",
    headline: "连续 {streak} 天——你的眼睛谢谢你",
    body: "保持住。{daysLeftNote} 升级高级版既能支持 Blink Eye，也能解锁全部功能。",
    cta: "查看高级版",
  },
  {
    id: "te-cum-1",
    variants: ["trial_ending"],
    tier: "cumulative",
    headline: "一起休息了 {totalBreaks} 次 💛",
    body: "你有 {totalBreaks} 次选择了自己的眼睛。{daysLeftNote} 高级版让 Blink Eye 对所有人保持免费。",
    cta: "查看高级版",
  },
  {
    id: "te-cum-2",
    variants: ["trial_ending"],
    tier: "cumulative",
    headline: "你已经坚持了 {totalBreaks} 次",
    body: "这样的坚持值得完整工具箱。{daysLeftNote} 主题、多显示器，还有我们的感谢。",
    cta: "支持 Blink Eye",
  },
  {
    id: "te-rel-1",
    variants: ["trial_ending"],
    tier: "relevance",
    headline: "今天屏幕使用 {screenHours} 小时",
    body: "而你依然抬头望了远处，这才是关键。{daysLeftNote} 高级版帮我们把这件事继续下去。",
    cta: "查看高级版",
  },
  {
    id: "te-fb-1",
    variants: ["trial_ending"],
    tier: "fallback",
    headline: "试用快结束了",
    body: "谢谢这几天和我们一起。{daysLeftNote} Blink Eye 免费开源——靠高级版维持。",
    cta: "查看高级版",
  },
  {
    id: "te-fb-2",
    variants: ["trial_ending"],
    tier: "fallback",
    headline: "试用结束前的小提示",
    body: "不催你，只是道谢。{daysLeftNote} 如果 Blink Eye 帮到了你的眼睛，高级版就是你回帮这个项目的方式。",
    cta: "支持 Blink Eye",
  },
  // ---- expired: welcome-back + "look what you built" ----
  {
    id: "ex-streak-1",
    variants: ["expired"],
    tier: "streak",
    headline: "连续 {streak} 天，还在继续 🎉",
    body: "试用结束了，但习惯不必结束。支持 Blink Eye 即可解锁高级功能。",
    cta: "支持 Blink Eye",
  },
  {
    id: "ex-streak-2",
    variants: ["expired"],
    tier: "streak",
    headline: "{streak} 天都在为眼睛坚持",
    body: "这个连续记录是你的，有没有试用都一样。高级版是让背后的项目活下去的方式。",
    cta: "支持 Blink Eye 并解锁高级版",
  },
  {
    id: "ex-cum-1",
    variants: ["expired"],
    tier: "cumulative",
    headline: "{totalBreaks} 次休息——看看你走了多远 💛",
    body: "每一次都是送给未来自己的礼物。高级版让这份礼物继续，给你也给所有人。",
    cta: "支持 Blink Eye",
  },
  {
    id: "ex-cum-2",
    variants: ["expired"],
    tier: "cumulative",
    headline: "你已经好好休息了 {totalBreaks} 次",
    body: "没多少人能做到。解锁主题和多显示器——同时让 Blink Eye 对所有人免费。",
    cta: "查看高级版",
  },
  {
    id: "ex-rel-1",
    variants: ["expired"],
    tier: "relevance",
    headline: "今天在屏幕前待了 {screenHours} 小时",
    body: "还好有人提醒你抬头看看远处。那个人靠高级版支持运转。",
    cta: "支持 Blink Eye",
  },
  {
    id: "ex-fb-1",
    variants: ["expired"],
    tier: "fallback",
    headline: "试用结束了——休息不必跟着结束",
    body: "不管有没有试用，Blink Eye 都免费。高级版只是解锁附加功能并支持项目。",
    cta: "支持 Blink Eye",
  },
  {
    id: "ex-fb-2",
    variants: ["expired"],
    tier: "fallback",
    headline: "还在，还在眨眼 💛",
    body: "你（休息得不错的）眼睛迎来新的一天。随时欢迎体验高级版。",
    cta: "查看高级版",
  },
  // ---- winback: missed-you + support framing ----
  {
    id: "wb-streak-1",
    variants: ["winback"],
    tier: "streak",
    headline: "连续 {streak} 天——我们注意到了 🎉",
    body: "我们有点想你了。高级版随时都为你保留——它也让 Blink Eye 保持免费。",
    cta: "查看高级版",
  },
  {
    id: "wb-streak-2",
    variants: ["winback"],
    tier: "streak",
    headline: "连续 {streak} 天，挺适合你",
    body: "回到完整工具箱：主题、多显示器，还有支持开源的那点暖意。",
    cta: "支持 Blink Eye",
  },
  {
    id: "wb-cum-1",
    variants: ["winback"],
    tier: "cumulative",
    headline: "{totalBreaks} 次休息，还在累加 💛",
    body: "你已经坚持很久了——佩服。高级版是我们回敬感谢的方式。",
    cta: "支持 Blink Eye",
  },
  {
    id: "wb-cum-2",
    variants: ["winback"],
    tier: "cumulative",
    headline: "还记得你的第一次休息吗？",
    body: "从那以后你已经休息了 {totalBreaks} 次。高级版让接下来每一次都能继续——为你，也为免费。",
    cta: "查看高级版",
  },
  {
    id: "wb-rel-1",
    variants: ["winback"],
    tier: "relevance",
    headline: "今天屏幕时间 {screenHours} 小时——和往常一样",
    body: "有些事一直没变，所以我们还在这里。高级版让我们留在这里。",
    cta: "支持 Blink Eye",
  },
  {
    id: "wb-fb-1",
    variants: ["winback"],
    tier: "fallback",
    headline: "好久没眨眼了 💛",
    body: "Blink Eye 仍然免费、仍然开源、仍然在提醒你。高级版是让它继续下去的方式。",
    cta: "查看高级版",
  },
  {
    id: "wb-fb-2",
    variants: ["winback"],
    tier: "fallback",
    headline: "水开了",
    body: "搬把椅子，好好休息一下。高级功能随时等你来。",
    cta: "支持 Blink Eye",
  },
];

function safeInt(value: number | null, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback;
}

/// Which milestone (if any) the stats currently celebrate.
export function milestoneFor(stats: NudgeStats): string | null {
  const streak = safeInt(stats.streak);
  const total = safeInt(stats.totalBreaks);
  for (const m of STREAK_MILESTONES) {
    if (streak === m) return `streak-${m}`;
  }
  for (const club of BREAK_CLUBS) {
    if (total >= club.min && total < club.max) return club.key;
  }
  return null;
}

function daysLeftNote(stats: NudgeStats): string {
  const days = stats.daysLeft;
  if (days === null || !Number.isFinite(days) || days < 1 || days > 3) return "";
  return ` 高级版还剩 ${days} 天。`;
}

/// Fill every `{slot}` in a string. Total function: unknown slots are left
/// as-is (tests forbid them in pooled copy), numbers always render safely.
export function fillSlots(text: string, stats: NudgeStats): string {
  const values: Record<string, string> = {
    totalBreaks: String(safeInt(stats.totalBreaks)),
    streak: String(safeInt(stats.streak)),
    bestStreak: String(safeInt(stats.bestStreak)),
    screenHours: String(safeInt(stats.screenHoursToday)),
    daysLeft: String(safeInt(stats.daysLeft)),
    daysLeftNote: daysLeftNote(stats),
    tenureDays: String(safeInt(stats.tenureDays)),
  };
  return text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

function poolFor(variant: NudgeVariant): NudgeTemplate[] {
  return TEMPLATES.filter((t) => t.variants.includes(variant));
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/// Draw one template id from the per-variant+tier bag. The bag is persisted
/// (fresh webview every spawn, so in-memory bags can't survive) — draws are
/// without replacement, the bag refills + reshuffles on exhaustion, and a
/// refill never starts with the previously shown template when alternatives
/// exist. `random` is injectable for deterministic tests.
export function pickFromBag(
  candidateIds: string[],
  state: BagState,
  bagKey: string,
  random: () => number = Math.random,
): { id: string; state: BagState } {
  let bag = (state.bags[bagKey] ?? []).filter((id) => candidateIds.includes(id));
  if (bag.length === 0) {
    bag = shuffle(candidateIds, random);
    if (bag.length > 1 && bag[0] === state.lastId) {
      [bag[0], bag[1]] = [bag[1], bag[0]];
    }
  }
  const id = bag.shift() as string;
  return {
    id,
    state: { bags: { ...state.bags, [bagKey]: bag }, lastId: id },
  };
}

function wantedTier(stats: NudgeStats): NudgeTier {
  if (milestoneFor(stats) !== null) return "milestone";
  if (safeInt(stats.streak) >= STREAK_MIN) return "streak";
  if (safeInt(stats.totalBreaks) >= BREAKS_MIN) return "cumulative";
  if (
    stats.screenHoursToday !== null &&
    Number.isFinite(stats.screenHoursToday) &&
    stats.screenHoursToday >= SCREEN_HOURS_MIN
  ) {
    return "relevance";
  }
  return "fallback";
}

/// Compose the message for a nudge show: pick the strongest true tier,
/// draw fresh from its bag, fill slots. Pure and fully testable — the window
/// supplies stats and persists the returned bag state.
export function composeNudgeMessage(
  variant: NudgeVariant,
  stats: NudgeStats,
  bagState: BagState = { bags: {}, lastId: null },
  random: () => number = Math.random,
): { message: ComposedMessage; bagState: BagState } {
  const pool = poolFor(variant);
  const milestone = milestoneFor(stats);
  let tier = wantedTier(stats);
  let candidates = pool.filter(
    (t) =>
      t.tier === tier &&
      (tier !== "milestone" || t.milestone === milestone),
  );
  if (candidates.length === 0) {
    tier = "fallback";
    candidates = pool.filter((t) => t.tier === "fallback");
  }
  // Guaranteed non-empty: every variant pool ships ≥1 fallback template.
  const picked = pickFromBag(
    candidates.map((t) => t.id),
    bagState,
    `${variant}:${tier}`,
    random,
  );
  const template = candidates.find((t) => t.id === picked.id) as NudgeTemplate;
  return {
    message: {
      templateId: template.id,
      headline: fillSlots(template.headline, stats),
      body: fillSlots(template.body, stats),
      cta: template.cta,
    },
    bagState: picked.state,
  };
}

/// Today's screen-on hours from `UserScreenTime.db` (same query as
/// `useTimeCount`). Returns null when unreadable — the composer then falls
/// through to warmer tiers instead of rendering garbage.
export async function getTodayScreenHours(): Promise<number | null> {
  try {
    const db = await Database.load("sqlite:UserScreenTime.db");
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const records = (await db.select(
      "SELECT first_timestamp, second_timestamp FROM time_data WHERE date = ?",
      [dateStr],
    )) as Array<{ first_timestamp: number; second_timestamp: number }>;
    let totalMs = 0;
    for (const record of records) {
      const diff = record.second_timestamp - record.first_timestamp;
      if (diff > 0) totalMs += diff;
    }
    return Math.floor(totalMs / (3600 * 1000));
  } catch {
    return null;
  }
}

// =============================================================================
// Highlights — the "your Blink Eye story" recap shown above the ask.
// =============================================================================
//
// Same voice rules as the copy: only true, positive numbers. Zeros never
// render (a tile with 0 is dropped, a missing hero falls back to the logo).

export interface NudgeHero {
  /// Number to count up to.
  value: number;
  /// What the number counts ("breaks taken together").
  label: string;
  /// Felt translation of the number, or null when it would be meaningless.
  caption: string | null;
}

export type NudgeTileKind = "streak" | "bestStreak" | "tenure";

export interface NudgeTile {
  kind: NudgeTileKind;
  value: string;
  label: string;
}

export interface NudgeHighlights {
  hero: NudgeHero | null;
  tiles: NudgeTile[];
}

/// Human phrase for the total eye-rest time, e.g. "45 minutes", "7.3 hours".
export function formatRestTime(totalSeconds: number): string | null {
  const secs = safeInt(totalSeconds);
  if (secs < 60) return null;
  const minutes = Math.round(secs / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  const hours = secs / 3600;
  const shown = hours < 10 ? Math.round(hours * 10) / 10 : Math.round(hours);
  return `${shown} ${shown === 1 ? "hour" : "hours"}`;
}

/// Pick the recap the window celebrates. `breakSecs` is the configured break
/// length (null when unknown — the rest-time caption is then omitted).
export function nudgeHighlights(stats: NudgeStats, breakSecs: number | null): NudgeHighlights {
  const total = safeInt(stats.totalBreaks);
  const streak = safeInt(stats.streak);
  const best = safeInt(stats.bestStreak);
  const tenure = stats.tenureDays === null ? 0 : safeInt(stats.tenureDays);

  let hero: NudgeHero | null = null;
  if (total >= BREAKS_MIN) {
    const rest = breakSecs !== null && breakSecs > 0 ? formatRestTime(total * breakSecs) : null;
    hero = {
      value: total,
      label: total === 1 ? "break taken together" : "breaks taken together",
      caption: rest ? `≈ ${rest} your eyes got to rest` : null,
    };
  } else if (tenure >= 1) {
    hero = {
      value: tenure + 1,
      label: "days of kinder eyes",
      caption: "每个习惯都有起点——你的起点在这里。",
    };
  }

  const tiles: NudgeTile[] = [];
  if (streak >= 1) {
    tiles.push({ kind: "streak", value: `${streak}`, label: "day streak" });
  }
  if (best > streak && best >= STREAK_MIN) {
    tiles.push({ kind: "bestStreak", value: `${best}`, label: "best streak" });
  }
  if (tenure >= 1 && hero?.label !== "days of kinder eyes") {
    tiles.push({ kind: "tenure", value: `${tenure}`, label: tenure === 1 ? "day together" : "days together" });
  }
  return { hero, tiles };
}
