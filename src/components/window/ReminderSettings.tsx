import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { invoke } from "@tauri-apps/api/core";
import { entryForStyle } from "../../backgrounds/registry";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useTrigger } from "../../contexts/TriggerReRender";
import {
  IoTimer,
  IoHourglass,
  IoChatbubble,
  IoSave,
  IoEye,
  IoInformationCircleOutline,
  IoLockClosed,
  IoAlarm,
  IoStopwatch,
} from "react-icons/io5";
import { usePremiumFeatures } from "../../contexts/PremiumFeaturesContext";
import { useAccentColor } from "../../contexts/AccentColorContext";
import { usePremiumNudge } from "../../hooks/usePremiumNudge";
import { TimerStylePicker } from "../TimerStylePicker";
import {
  loadTimerStyle,
  saveTimerStyle,
  type TimerStyle,
} from "../reminder/timerStyle";

const FREQUENCY_OPTIONS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 45, 60, 90, 120];
const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120, 300];
const SNOOZE_LIMIT_OPTIONS = [0, 1, 2, 3, 5, 10, 15, 20];

type ReminderSettingsState = {
  interval: number;
  duration: number;
  reminderText: string;
  snoozesPerSession: number;
  snoozesPerDay: number;
};

function formatSnoozeLimit(value: number) {
  return value === 0 ? "不限" : String(value);
}

function SettingIconBadge({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex size-7 shrink-0 items-center justify-center rounded-md text-white shadow-sm"
      style={{ backgroundColor: color }}
    >
      {children}
    </div>
  );
}

function SettingRow({
  icon,
  label,
  description,
  children,
  controlClassName,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  children: React.ReactNode;
  controlClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon}
        <div className="space-y-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div
        className={
          controlClassName ??
          "flex w-full shrink-0 justify-end sm:w-auto sm:min-w-[180px]"
        }
      >
        {children}
      </div>
    </div>
  );
}

const ReminderSettings = () => {
  const { triggerUpdate } = useTrigger();
  const { fireTrigger } = usePremiumNudge();
  const { canAccessPremiumFeatures } = usePremiumFeatures();
  const { accentHex } = useAccentColor();
  const [interval, setInterval] = useState<number>(20);
  const [duration, setDuration] = useState<number>(20);
  const [reminderText, setReminderText] = useState<string>("");
  const [backgroundStyle, setBackgroundStyle] = useState<string>("");
  const [saved, setSaved] = useState<ReminderSettingsState>({
    interval: 20,
    duration: 20,
    reminderText: "",
    snoozesPerSession: 3,
    snoozesPerDay: 10,
  });
  const [isStrictModeEnabled, setIsStrictModeEnabled] = useState(false);
  const [timerStyle, setTimerStyle] = useState<TimerStyle>("circle");
  const [snoozesPerSession, setSnoozesPerSession] = useState(3);
  const [snoozesPerDay, setSnoozesPerDay] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings: {
          intervalMins: number | null;
          durationSecs: number | null;
          reminderText: string | null;
          backgroundStyle: string | null;
        } = await invoke("get_reminder_settings");

        const loaded: ReminderSettingsState = {
          interval: settings.intervalMins ?? 20,
          duration: settings.durationSecs ?? 20,
          reminderText: settings.reminderText ?? "",
          snoozesPerSession: 3,
          snoozesPerDay: 10,
        };

        const [sessionLimit, dayLimit] = await Promise.all([
          invoke<string | null>("get_config_string", {
            key: "snoozesAllowedPerSession",
          }),
          invoke<string | null>("get_config_string", {
            key: "snoozesAllowedPerDay",
          }),
        ]);

        if (sessionLimit !== null && sessionLimit !== "") {
          loaded.snoozesPerSession = Number(sessionLimit);
        }
        if (dayLimit !== null && dayLimit !== "") {
          loaded.snoozesPerDay = Number(dayLimit);
        }

        if (settings.backgroundStyle) setBackgroundStyle(settings.backgroundStyle);
        setInterval(loaded.interval);
        setDuration(loaded.duration);
        setReminderText(loaded.reminderText);
        setSnoozesPerSession(loaded.snoozesPerSession);
        setSnoozesPerDay(loaded.snoozesPerDay);
        setSaved(loaded);

        const strictMode = await invoke<boolean>("get_config_bool", {
          key: "usingStrictMode",
          defaultValue: false,
        });
        setIsStrictModeEnabled(strictMode);

        setTimerStyle(await loadTimerStyle());
      } catch (error) {
        console.error("Failed to load reminder settings:", error);
        toast.error("加载设置失败，请重试。", {
          duration: 2000,
          position: "bottom-right",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const isDirty =
    interval !== saved.interval ||
    duration !== saved.duration ||
    reminderText !== saved.reminderText ||
    snoozesPerSession !== saved.snoozesPerSession ||
    snoozesPerDay !== saved.snoozesPerDay;

  const handleSave = async () => {
    if (interval <= 0 || duration <= 0) {
      toast.error("间隔和时长都必须大于 0。", {
        duration: 2000,
        position: "bottom-right",
      });
      return;
    }

    const intervalChanged = interval !== saved.interval;
    const durationChanged = duration !== saved.duration;
    const textChanged = reminderText !== saved.reminderText;
    const sessionLimitChanged = snoozesPerSession !== saved.snoozesPerSession;
    const dayLimitChanged = snoozesPerDay !== saved.snoozesPerDay;

    if (
      !intervalChanged &&
      !durationChanged &&
      !textChanged &&
      !sessionLimitChanged &&
      !dayLimitChanged
    ) {
      return;
    }

    setIsSaving(true);
    try {
      if (intervalChanged) {
        await invoke("update_reminder_setting", {
          key: "blinkEyeReminderInterval",
          value: String(interval),
        });
      }
      if (durationChanged) {
        await invoke("update_reminder_setting", {
          key: "blinkEyeReminderDuration",
          value: String(duration),
        });
      }
      if (textChanged) {
        await invoke("update_reminder_setting", {
          key: "blinkEyeReminderScreenText",
          value: reminderText,
        });
      }
      if (sessionLimitChanged) {
        await invoke("update_reminder_setting", {
          key: "snoozesAllowedPerSession",
          value: String(snoozesPerSession),
        });
      }
      if (dayLimitChanged) {
        await invoke("update_reminder_setting", {
          key: "snoozesAllowedPerDay",
          value: String(snoozesPerDay),
        });
      }

      if (
        intervalChanged ||
        durationChanged ||
        textChanged ||
        sessionLimitChanged ||
        dayLimitChanged
      ) {
        await invoke("refresh_reminder_scheduler_settings");
      }

      setSaved({
        interval,
        duration,
        reminderText,
        snoozesPerSession,
        snoozesPerDay,
      });
      triggerUpdate();

      toast.success("提醒设置已保存", {
        duration: 1500,
        position: "bottom-right",
      });

      // Post-activity hint for the premium nudge (Rust decides; no-op when
      // ineligible, capped, or suppressed).
      fireTrigger("settings_saved");
    } catch (error) {
      console.error("Failed to save reminder settings:", error);
      toast.error("保存设置失败，请重试。", {
        duration: 2000,
        position: "bottom-right",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStrictModeChange = async (checked: boolean) => {
    try {
      await invoke("update_reminder_setting", {
        key: "usingStrictMode",
        value: String(checked),
      });
      setIsStrictModeEnabled(checked);
    } catch (error) {
      console.error("Failed to update strict mode:", error);
      toast.error("保存严格模式失败，请重试。", {
        duration: 2000,
        position: "bottom-right",
      });
    }
  };

  const handleTimerStyleChange = async (style: TimerStyle) => {
    const previous = timerStyle;
    setTimerStyle(style);
    try {
      await saveTimerStyle(style);
    } catch (error) {
      console.error("Failed to update timer style:", error);
      setTimerStyle(previous);
      toast.error("保存计时样式失败，请重试。", {
        duration: 2000,
        position: "bottom-right",
      });
    }
  };

  const openReminderWindow = () => {
    const isPremium = canAccessPremiumFeatures;
    const requestedStyle = isPremium ? backgroundStyle : "default";
    const entry = entryForStyle(requestedStyle);
    const webview = new WebviewWindow("reminder_monitor_0", {
      url: `/${entry}?config=${encodeURIComponent(JSON.stringify({ isPremium }))}`,
      title: "休息提醒 - Blink Eye",
      fullscreen: true,
      alwaysOnTop: true,
      skipTaskbar: true,
    });

    webview.once("tauri://error", (e) => {
      console.error("Error creating reminder window:", e);
    });
  };

  return (
    <div className="relative space-y-5 p-2 pb-24">
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        <SettingRow
          icon={
            <SettingIconBadge color={accentHex}>
              <IoTimer className="size-4" />
            </SettingIconBadge>
          }
          label="休息频率"
          description="多久收到一次休息提醒"
        >
          <Select
            value={String(interval)}
            onValueChange={(val) => setInterval(Number(val))}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full rounded-3xl bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>
                  {opt} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          icon={
            <SettingIconBadge color={accentHex}>
              <IoHourglass className="size-4" />
            </SettingIconBadge>
          }
          label="休息时长"
          description="休息界面停留的时长"
        >
          <Select
            value={String(duration)}
            onValueChange={(val) => setDuration(Number(val))}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full rounded-3xl bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>
                  {opt}s
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          icon={
            <SettingIconBadge color={accentHex}>
              <IoChatbubble className="size-4" />
            </SettingIconBadge>
          }
          label="提醒文案"
          description="休息界面上显示的文案"
          controlClassName="flex w-full justify-end sm:min-w-[320px] sm:max-w-lg"
        >
          <Input
            type="text"
            placeholder="停一下！望向远处，能走动就走动一下。"
            value={reminderText}
            onChange={(e) => setReminderText(e.target.value)}
            disabled={isLoading}
            className="bg-background/50 text-base"
          />
        </SettingRow>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <SettingRow
          icon={
            <SettingIconBadge color={accentHex}>
              <IoStopwatch className="size-4" />
            </SettingIconBadge>
          }
          label="计时样式"
          description="休息界面上倒计时的样式"
          controlClassName="flex w-full shrink-0 justify-end sm:w-auto"
        >
          <TimerStylePicker
            value={timerStyle}
            onChange={handleTimerStyleChange}
            accentColor={accentHex}
            disabled={isLoading}
          />
        </SettingRow>
      </div>

      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <Badge variant="secondary" className="gap-1.5 text-xs">
            <IoTimer className="size-3" />
            Every {interval} min
          </Badge>
          <span className="text-xs text-muted-foreground">→</span>
          <Badge variant="secondary" className="gap-1.5 text-xs">
            <IoHourglass className="size-3" />
            {duration}s break
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            onClick={openReminderWindow}
            variant="secondary"
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            <IoEye className="mr-2 size-4" />
            预览休息
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="关于预览"
                className="shrink-0 text-muted-foreground"
              >
                <IoInformationCircleOutline className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              预览只会打开一个窗口，即使已选多显示器；它不会测试所有显示器上的定时休息。
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="space-y-2">
        <div className="px-1">
          <h2 className="text-sm font-medium">跳过次数限制</h2>
          <p className="text-xs text-muted-foreground">
            控制能否跳过休息，以及每天可跳过几次。
          </p>
        </div>

        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          <SettingRow
            icon={
              <SettingIconBadge color={accentHex}>
                <IoAlarm className="size-4" />
              </SettingIconBadge>
            }
            label="单次休息稍后提醒次数"
            description="从应用启动到重启前允许跳过的次数（0 = 不限）"
          >
            <Select
              value={String(snoozesPerSession)}
              onValueChange={(val) => setSnoozesPerSession(Number(val))}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full rounded-3xl bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SNOOZE_LIMIT_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {formatSnoozeLimit(opt)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow
            icon={
              <SettingIconBadge color={accentHex}>
                <IoAlarm className="size-4" />
              </SettingIconBadge>
            }
            label="每日稍后提醒次数"
            description="每个自然日允许跳过的次数（0 = 不限）"
          >
            <Select
              value={String(snoozesPerDay)}
              onValueChange={(val) => setSnoozesPerDay(Number(val))}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full rounded-3xl bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SNOOZE_LIMIT_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {formatSnoozeLimit(opt)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow
            icon={
              <SettingIconBadge color={accentHex}>
                <IoLockClosed className="size-4" />
              </SettingIconBadge>
            }
            label="严格模式"
            description="休息时移除「跳过这次」按钮"
          >
            <Switch
              id="usingStrictMode"
              checked={isStrictModeEnabled}
              onCheckedChange={handleStrictModeChange}
              disabled={isLoading}
            />
          </SettingRow>
        </div>
      </div>

      {(isDirty || isSaving) && (
        <Button
          onClick={handleSave}
          disabled={isLoading || isSaving || !isDirty}
          className="fixed bottom-8 right-8 z-50 h-11 rounded-full px-6 text-sm text-white shadow-lg hover:opacity-90"
          style={{ backgroundColor: accentHex }}
        >
          <IoSave className="mr-2 size-4" />
          {isSaving ? "Saving…" : "保存更改"}
        </Button>
      )}
    </div>
  );
};

export default ReminderSettings;
