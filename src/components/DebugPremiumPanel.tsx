import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface DebugInfo {
  // Trial (from Rust)
  installDate: string | null;
  trialDaysLeft: number | null;
  trialActive: boolean | null;
  clockManipulated: boolean | null;
  trialError: string | null;

  // License (from Rust)
  licenseKey: string | null;
  licenseStatus: string | null;
  isPaid: boolean | null;
  licenseError: string | null;

  // Raw data for debugging
  rawLicenseKey: string | null;
  rawLicenseStatus: string | null;
  rawPassword: string | null;

  // Premium (derived)
  isPremium: boolean | null;

  // Reminder settings (from Rust)
  intervalMins: number | null;
  durationSecs: number | null;
  reminderText: string | null;
  backgroundStyle: string | null;

  // Config (from Rust)
  isMultiMonitor: boolean | null;
  isStrictMode: boolean | null;
  isWorkdayEnabled: boolean | null;

  // Premium nudge (from Rust)
  nudgeEligible: boolean | null;
  nudgeReason: string | null;
  nudgeVariant: string | null;
  nudgeLastShown: string | null;
  nudgeCount30d: number | null;
  nudgeCountLifetime: number | null;
  nudgeSnoozedUntil: string | null;
  nudgeError: string | null;
}

/// Debug panel that verifies Rust crypto, premium, and install date logic.
/// ALL data comes from Rust Tauri commands — no frontend DB reads.
///
/// Hoisted to module scope (not defined during render) so the
/// `react-hooks/static-components` rule stays quiet for every section.
const DebugRow = ({
  label,
  value,
  warn,
}: {
  label: string;
  value: string | number | boolean | null;
  warn?: boolean;
}) => (
  <div
    className={`flex justify-between py-1 border-b border-white/10 ${warn ? "text-yellow-400" : ""}`}
  >
    <span className="text-gray-400">{label}</span>
    <span className="font-mono text-right">{String(value ?? "—")}</span>
  </div>
);

const DebugPremiumPanel: React.FC = () => {
  const [info, setInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const gather = async () => {
      const data: DebugInfo = {
        installDate: null,
        trialDaysLeft: null,
        trialActive: null,
        clockManipulated: null,
        trialError: null,
        licenseKey: null,
        licenseStatus: null,
        isPaid: null,
        licenseError: null,
        rawLicenseKey: null,
        rawLicenseStatus: null,
        rawPassword: null,
        isPremium: null,
        intervalMins: null,
        durationSecs: null,
        reminderText: null,
        backgroundStyle: null,
        isMultiMonitor: null,
        isStrictMode: null,
        isWorkdayEnabled: null,
        nudgeEligible: null,
        nudgeReason: null,
        nudgeVariant: null,
        nudgeLastShown: null,
        nudgeCount30d: null,
        nudgeCountLifetime: null,
        nudgeSnoozedUntil: null,
        nudgeError: null,
      };

      // 1. Trial info from Rust
      try {
        const trial = await invoke<{
          install_date: string | null;
          days_remaining: number;
          is_active: boolean;
          clock_manipulated: boolean;
        }>("get_trial_info");
        data.installDate = trial.install_date;
        data.trialDaysLeft = trial.days_remaining;
        data.trialActive = trial.is_active;
        data.clockManipulated = trial.clock_manipulated;
      } catch (e) {
        data.trialError = String(e);
      }

      // 2. License info from Rust
      try {
        const license = await invoke<{
          license_key: string | null;
          status: string | null;
          is_paid: boolean;
        }>("get_license_info");
        data.licenseKey = license.license_key;
        data.licenseStatus = license.status;
        data.isPaid = license.is_paid;
      } catch (e) {
        data.licenseError = String(e);
      }

      // 3. Combined premium
      data.isPremium = data.isPaid || data.trialActive;

      // 4. Reminder settings from Rust
      try {
        const settings = await invoke<{
          interval_mins: number | null;
          duration_secs: number | null;
          reminder_text: string | null;
          background_style: string | null;
        }>("get_reminder_settings");
        data.intervalMins = settings.interval_mins;
        data.durationSecs = settings.duration_secs;
        data.reminderText = settings.reminder_text;
        data.backgroundStyle = settings.background_style;
      } catch (e) {
        console.error("Failed to get reminder settings:", e);
      }

      // 5. Config booleans from Rust
      try {
        data.isMultiMonitor = await invoke<boolean>("get_config_bool", {
          key: "isMultiMonitorEnabled",
          defaultValue: false,
        });
        data.isStrictMode = await invoke<boolean>("get_config_bool", {
          key: "usingStrictMode",
          defaultValue: false,
        });
        data.isWorkdayEnabled = await invoke<boolean>("get_config_bool", {
          key: "isWorkdayEnabled",
          defaultValue: false,
        });
      } catch (e) {
        console.error("Failed to get config:", e);
      }

      // 6. Premium nudge state from Rust
      try {
        const nudge = await invoke<{
          eligible: boolean;
          reason: string;
          variant: string | null;
          lastShown: string | null;
          showCount30d: number;
          showCountLifetime: number;
          snoozedUntil: string | null;
        }>("get_premium_nudge_state");
        data.nudgeEligible = nudge.eligible;
        data.nudgeReason = nudge.reason;
        data.nudgeVariant = nudge.variant;
        data.nudgeLastShown = nudge.lastShown;
        data.nudgeCount30d = nudge.showCount30d;
        data.nudgeCountLifetime = nudge.showCountLifetime;
        data.nudgeSnoozedUntil = nudge.snoozedUntil;
      } catch (e) {
        data.nudgeError = String(e);
      }

      setInfo(data);
      setLoading(false);
    };

    gather();
  }, []);

  const refresh = () => {
    setLoading(true);
    setInfo(null);
    // Re-run the gather effect by remounting state below.
    window.location.reload();
  };

  const simulate = async (action: string, payload?: Record<string, string>) => {
    try {
      await invoke(action, payload);
    } catch (e) {
      console.error(`[DebugPremiumPanel] ${action} failed:`, e);
    }
  };

  if (loading) return <div className="p-4 text-sm">正在加载调试信息…</div>;
  if (!info) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[80vh] overflow-y-auto bg-black/90 text-white text-sm rounded-xl border border-white/20 p-4 z-50 font-sans">
      <h3 className="font-heading text-lg mb-3 font-semibold">
        调试：全部来自 Rust
      </h3>

      {info.clockManipulated && (
        <div className="bg-red-500/20 text-red-400 rounded-lg p-2 mb-3 text-xs">
          检测到系统时间被修改
        </div>
      )}
      {info.trialError && (
        <div className="bg-red-500/20 text-red-400 rounded-lg p-2 mb-3 text-xs">
          Trial: {info.trialError}
        </div>
      )}
      {info.licenseError && (
        <div className="bg-red-500/20 text-red-400 rounded-lg p-2 mb-3 text-xs">
          License: {info.licenseError}
        </div>
      )}

      <div className="mb-3">
        <h4 className="text-xs uppercase text-gray-500 mb-1">
          Trial (Rust get_trial_info)
        </h4>
        <DebugRow label="安装日期" value={info.installDate} />
        <DebugRow
          label="剩余天数"
          value={info.trialDaysLeft}
          warn={info.trialActive === true}
        />
        <DebugRow label="试用中" value={info.trialActive} />
        <DebugRow label="系统时间被修改" value={info.clockManipulated} />
      </div>

      <div className="mb-3">
        <h4 className="text-xs uppercase text-gray-500 mb-1">
          License (Rust get_license_info)
        </h4>
        <DebugRow
          label="状态"
          value={info.licenseStatus}
          warn={info.isPaid === true}
        />
        <DebugRow label="许可证密钥" value={info.licenseKey} />
        <DebugRow label="已付费" value={info.isPaid} />
      </div>

      <div className="mb-3">
        <h4 className="text-xs uppercase text-gray-500 mb-1">
          Premium (derived)
        </h4>
        <DebugRow label="是否高级版" value={info.isPremium} warn={info.isPremium === true} />
      </div>

      <div className="mb-3">
        <h4 className="text-xs uppercase text-gray-500 mb-1">
          Reminder (Rust get_reminder_settings)
        </h4>
        <DebugRow label="间隔（分钟）" value={info.intervalMins} />
        <DebugRow label="时长（秒）" value={info.durationSecs} />
        <DebugRow label="背景样式" value={info.backgroundStyle} />
        <DebugRow label="提醒文案" value={info.reminderText} />
      </div>

      <div className="mb-3">
        <h4 className="text-xs uppercase text-gray-500 mb-1">
          Config (Rust get_config_bool)
        </h4>
        <DebugRow label="多显示器" value={info.isMultiMonitor} />
        <DebugRow label="严格模式" value={info.isStrictMode} />
        <DebugRow label="已启用工作日" value={info.isWorkdayEnabled} />
      </div>

      <div className="mb-3">
        <h4 className="text-xs uppercase text-gray-500 mb-1">
          Nudge (Rust get_premium_nudge_state)
        </h4>
        {info.nudgeError && (
          <div className="bg-red-500/20 text-red-400 rounded-lg p-2 mb-2 text-xs">
            Nudge: {info.nudgeError}
          </div>
        )}
        <DebugRow label="符合条件" value={info.nudgeEligible} />
        <DebugRow label="原因" value={info.nudgeReason} />
        <DebugRow label="变体" value={info.nudgeVariant} />
        <DebugRow label="最近展示" value={info.nudgeLastShown} />
        <DebugRow label="显示近 30 天" value={info.nudgeCount30d} />
        <DebugRow label="显示累计" value={info.nudgeCountLifetime} />
        <DebugRow label="稍后提醒至" value={info.nudgeSnoozedUntil} />
      </div>

      <div className="mb-1">
        <h4 className="text-xs uppercase text-gray-500 mb-1">
          提示模拟器
        </h4>
        <p className="text-[11px] text-gray-500 mb-2">
          Preview opens instantly (dev only, bypasses eligibility and caps).
          Trigger buttons test the real gated path.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[
            {
              label: "预览提示窗",
              action: "debug_preview_nudge_window",
              payload: undefined,
            },
            {
              label: "触发休息提醒",
              action: "maybe_show_premium_nudge",
              payload: { trigger: "break_completed" },
            },
            {
              label: "触发统计提醒",
              action: "maybe_show_premium_nudge",
              payload: { trigger: "stats_viewed" },
            },
            {
              label: "记录稍后提醒",
              action: "record_premium_nudge_event",
              payload: { event: "snoozed" },
            },
          ].map(({ label, action, payload }) => (
            <button
              key={label}
              onClick={() => simulate(action, payload)}
              className="rounded-md border border-white/20 px-2 py-1 text-xs hover:bg-white/10"
            >
              {label}
            </button>
          ))}
          <button
            onClick={refresh}
            className="rounded-md border border-white/20 px-2 py-1 text-xs hover:bg-white/10"
          >
            刷新
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugPremiumPanel;
