// src/pages/AboutPage.tsx
import { getVersion } from "@tauri-apps/api/app";
import { open } from "@tauri-apps/plugin-shell";
import { useEffect, useState } from "react";
// Switched to perfectly filled, solid Ionicons
import {
  IoLogoGithub,
  IoGlobe,
  IoHeart,
  IoEye,
  IoPeople,
  IoShieldCheckmark,
  IoOpenOutline, // Kept outline ONLY for the tiny 10px external arrow to keep it sharp
  IoLogoWindows,
  IoLogoApple,
  IoBarChart,
  IoColorPalette,
  IoTimer,
  IoDesktop,
  IoMedkit,
  IoTrendingUp,
  IoCheckmarkCircle,
} from "react-icons/io5";
import { SiLinux } from "react-icons/si";
import { AppIcon } from "../AppIcon";
import { useAccentColor } from "../../contexts/AccentColorContext";

// ── Link card ────────────────────────────────────────────────────

function LinkCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <button
      onClick={() => open(href)}
      className="group flex items-center gap-3.5 rounded-xl border border-border/40 bg-transparent p-3 text-left transition-all hover:border-border/80 hover:bg-accent/30 active:scale-[0.98]"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/60 text-foreground/70 group-hover:text-foreground group-hover:bg-background shadow-sm transition-colors">
        <Icon className="text-[1.1rem]" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-heading text-[13px] font-semibold text-foreground tracking-wide flex items-center gap-1.5">
          {title}
          <IoOpenOutline className="text-[10px] text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
        </h3>
        <p className="font-heading text-[11px] text-muted-foreground mt-0.5 truncate">
          {description}
        </p>
      </div>
    </button>
  );
}

// ── Feature card ─────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  description,
  colorClass,
  bgClass,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className="flex items-start gap-3.5 p-1.5 rounded-lg transition-colors hover:bg-muted/30">
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-md ${bgClass} ${colorClass}`}
      >
        <Icon className="text-[1.1rem]" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <h3 className="font-heading text-[13px] font-semibold text-foreground tracking-wide">
          {title}
        </h3>
        <p className="font-heading text-[12px] text-muted-foreground mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}


// ── Benefit Pill ──

function BenefitPill({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/20 px-2.5 py-1">
      <Icon className="text-[12px] text-foreground/60" />
      <span className="font-heading text-[11px] font-medium text-foreground/80">
        {text}
      </span>
    </div>
  );
}

// ── Platform badge ───────────────────────────────────────────────

function PlatformBadge({
  icon: Icon,
  name,
}: {
  icon: React.ElementType;
  name: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-muted/30 px-2 py-1.5 border border-border/30">
      <Icon className="text-[12px] text-foreground/60" />
      <span className="font-heading text-[10px] font-medium tracking-wide text-foreground/80">
        {name}
      </span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────

const AboutPage = () => {
  const [version, setVersion] = useState<string>("");
  const { accentHex } = useAccentColor();

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  return (
    <div className="mx-auto max-w-4xlxl space-y-7 py-2 px-1">
      {/* ── Header / Hero ──────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md" />
            <AppIcon
              color={accentHex}
              className="relative size-14 rounded-xl p-1.5 shadow-sm border border-border/30 bg-background"
            />
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                blinkeye
              </h1>
              {version && (
                <span className="font-heading inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                  v{version}
                </span>
              )}
            </div>
            <a
              href="https://blinkeye.app"
              target="_blank"
              rel="noreferrer"
              className="font-heading text-[12px] font-medium text-muted-foreground hover:text-primary transition-colors w-fit mt-0.5"
            >
              blinkeye.app
            </a>
          </div>
        </div>

        <p className="font-heading text-[13px] leading-relaxed text-muted-foreground max-w-[600px]">
          The Open Source Eye Care & Break Time Reminder. Prevent eye strain,
          improve posture, and stay productive with smart reminders, screen time
          tracking, and task management.
        </p>
      </div>

      {/* ── Features Grid ────────────────────────── */}
      <section className="space-y-4 pt-2 border-t border-border/30">
        <h2 className="font-heading text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          核心功能
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <FeatureCard
            icon={IoEye}
            title="20-20-20 法则"
            description="每 20 分钟自动休息，缓解眼睛疲劳。"
            colorClass="text-emerald-600 dark:text-emerald-400"
            bgClass="bg-emerald-500/10"
          />
          <FeatureCard
            icon={IoBarChart}
            title="使用统计"
            description="记录每日屏幕使用时间，帮你平衡工作与休息。"
            colorClass="text-orange-600 dark:text-orange-400"
            bgClass="bg-orange-500/10"
          />
          <FeatureCard
            icon={IoTimer}
            title="番茄钟与工作日"
            description="把任务拆成时间块，规划整天的作息。"
            colorClass="text-sky-600 dark:text-sky-400"
            bgClass="bg-sky-500/10"
          />
          <FeatureCard
            icon={IoColorPalette}
            title="主题与个性化"
            description="按你的心情定制提醒界面、声音和文案。"
            colorClass="text-rose-600 dark:text-rose-400"
            bgClass="bg-rose-500/10"
          />
          <FeatureCard
            icon={IoDesktop}
            title="休息屏保"
            description="休息时播放的精美动态屏保，帮你真正放松。"
            colorClass="text-indigo-600 dark:text-indigo-400"
            bgClass="bg-indigo-500/10"
          />
          <FeatureCard
            icon={IoShieldCheckmark}
            title="隐私优先"
            description="完全本地运行，无需账号，不收集数据。"
            colorClass="text-violet-600 dark:text-violet-400"
            bgClass="bg-violet-500/10"
          />
        </div>
      </section>

      {/* ── Health & Productivity Benefits ────────── */}
      <section className="space-y-3 pt-2">
        <h2 className="font-heading text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          Blink Eye 如何帮你
        </h2>
        <div className="flex flex-wrap gap-2">
          <BenefitPill
            icon={IoMedkit}
            text="预防电脑视觉综合征"
          />
          <BenefitPill
            icon={IoCheckmarkCircle}
            text="改善姿势、减少重复性劳损"
          />
          <BenefitPill icon={IoTrendingUp} text="提升专注与效率" />
          <BenefitPill icon={IoHeart} text="促进心理放松" />
          <BenefitPill icon={IoTimer} text="养成健康用屏习惯" />
        </div>
      </section>

      {/* ── Links & Support ──────────────────────── */}
      <section className="space-y-3 pt-2 border-t border-border/30">
        <h2 className="font-heading text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          支持这个项目
        </h2>
        <p className="font-heading text-[12px] text-muted-foreground mb-3 leading-relaxed">
          Blink Eye is open-source. By purchasing a license, you unlock premium
          features (Usage Tracking, Themes, Task Manager) and fund future
          development.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <LinkCard
            icon={IoHeart}
            title="升级高级版"
            description="解锁全部功能并支持我们"
            href="https://blinkeye.app/pricing"
          />
          <LinkCard
            icon={IoLogoGithub}
            title="源代码"
            description="Star、Fork 或参与贡献"
            href="https://github.com/nomandhoni-cs/blink-eye"
          />
          <LinkCard
            icon={IoGlobe}
            title="官网"
            description="阅读文档"
            href="https://blinkeye.app"
          />
          <LinkCard
            icon={IoPeople}
            title="社区"
            description="加入讨论"
            href="https://tally.so/r/wo0ZrN"
          />
        </div>
      </section>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="flex items-center justify-between border-t border-border/30 pt-4 pb-2 mt-4">
        <div className="flex items-center gap-1.5">
          <PlatformBadge icon={IoLogoWindows} name="Windows" />
          <PlatformBadge icon={IoLogoApple} name="macOS" />
          <PlatformBadge icon={SiLinux} name="Linux" />
        </div>

        <div className="text-right">
          <p className="font-heading text-[11px] text-muted-foreground">
            Built by{" "}
            <button
              onClick={() => open("https://github.com/nomandhoni-cs")}
              className="font-semibold text-foreground/70 hover:text-foreground transition-colors"
            >
              Noman Dhoni
            </button>
          </p>
          <p className="font-heading text-[10px] text-muted-foreground/50 mt-0.5">
            GPL v3 License + Additional Commercial Restrictions ©{" "}
            {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
