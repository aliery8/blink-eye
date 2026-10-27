import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useAccentColor } from "../../contexts/AccentColorContext";
import { usePremiumNudge } from "../../hooks/usePremiumNudge";
import {
  IoRocket,
  IoBarChart,
  IoSave,
  IoDownloadOutline,
  IoCloudUploadOutline,
  IoDiamond,
  IoEyeOutline,
} from "react-icons/io5";

const USAGE_LIMIT_OPTIONS = Array.from({ length: 24 }, (_, i) => i + 1);

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

const AllSettings = () => {
  const { accentHex } = useAccentColor();
  const { fireTrigger } = usePremiumNudge();
  const [timeLimit, setTimeLimit] = useState<number>(8);
  const [savedTimeLimit, setSavedTimeLimit] = useState<number>(8);
  const [isAutoStartEnabled, setIsAutoStartEnabled] = useState(false);
  const [isFullscreenReminderEnabled, setIsFullscreenReminderEnabled] =
    useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [trialLine, setTrialLine] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const savedLimit = await invoke<string | null>("get_config_string", {
          key: "usageTimeLimit",
        });
        if (savedLimit) {
          const limit = Number(savedLimit);
          setTimeLimit(limit);
          setSavedTimeLimit(limit);
        }

        const savedFullscreen = await invoke<string | null>(
          "get_config_string",
          { key: "fullscreenReminderEnabled" },
        );
        // Missing key means an upgraded install: default to the original
        // fullscreen behaviour.
        setIsFullscreenReminderEnabled(savedFullscreen !== "false");

        const runOnStartUp = await invoke<string | null>("get_config_string", {
          key: "isRunOnStartUpEnabledByDefault",
        });

        if (!runOnStartUp || runOnStartUp === "false") {
          await enable();
          await invoke("update_reminder_setting", {
            key: "isRunOnStartUpEnabledByDefault",
            value: "true",
          });
          toast.success("AutoStart Enabled by Default", {
            duration: 2000,
            position: "bottom-right",
          });
          setIsAutoStartEnabled(true);
        } else {
          const status = await isEnabled();
          setIsAutoStartEnabled(status);
        }

        try {
          const [license, trial] = await Promise.all([
            invoke<{ status: string | null }>("get_license_info"),
            invoke<{ is_active: boolean; days_remaining: number }>(
              "get_trial_info",
            ),
          ]);
          if (license.status === "active") {
            setTrialLine("Premium is active on this device");
          } else if (trial.is_active) {
            setTrialLine(
              `${trial.days_remaining} ${trial.days_remaining === 1 ? "day" : "days"} left in your free trial`,
            );
          } else {
            setTrialLine("Free trial ended");
          }
        } catch {
          // Trial/license readout is best-effort; the row stays hidden.
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast.error("加载设置失败，请稍后重试。", {
          duration: 2000,
          position: "bottom-right",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const isTimeLimitDirty = timeLimit !== savedTimeLimit;

  const handleAutoStartChange = async (checked: boolean) => {
    try {
      if (checked) {
        await enable();
        toast.success("Enabled Autostart", {
          duration: 2000,
          position: "bottom-right",
        });
      } else {
        await disable();
        toast.success("Disabled Autostart", {
          duration: 2000,
          position: "bottom-right",
        });
      }
      setIsAutoStartEnabled(checked);
    } catch (error) {
      console.error("Failed to update autostart status:", error);
    }
  };

  const handleFullscreenReminderChange = async (checked: boolean) => {
    const previous = isFullscreenReminderEnabled;
    setIsFullscreenReminderEnabled(checked);
    try {
      await invoke("update_reminder_setting", {
        key: "fullscreenReminderEnabled",
        value: checked ? "true" : "false",
      });
      // Pick the new value up without waiting for the scheduler's next
      // periodic settings reload.
      await invoke("refresh_reminder_scheduler_settings");
      toast.success(
        checked ? "已开启全屏提醒" : "已关闭全屏提醒，将只用系统通知提醒",
        { duration: 2000, position: "bottom-right" },
      );
    } catch (error) {
      console.error("Failed to update fullscreen reminder setting:", error);
      setIsFullscreenReminderEnabled(previous);
      toast.error("保存失败，请稍后重试。", {
        duration: 2000,
        position: "bottom-right",
      });
    }
  };

  const handleSaveLimit = async () => {
    if (isNaN(timeLimit) || timeLimit < 1 || timeLimit > 24) {
      toast.error("上限无效，请输入 1 到 24 之间的数字。", {
        duration: 2000,
        position: "bottom-right",
      });
      return;
    }

    try {
      await invoke("update_reminder_setting", {
        key: "usageTimeLimit",
        value: String(timeLimit),
      });
      setSavedTimeLimit(timeLimit);
      toast.success("屏幕使用上限已保存！", {
        duration: 2000,
        position: "bottom-right",
      });
      // Post-activity hint for the premium nudge (Rust decides).
      fireTrigger("settings_saved");
    } catch (error) {
      console.error("Failed to save limit:", error);
      toast.error("保存上限失败，请稍后重试。", {
        duration: 2000,
        position: "bottom-right",
      });
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const date = new Date().toISOString().slice(0, 10);
      const destination = await save({
        defaultPath: `blink-eye-backup-${date}.zip`,
        filters: [{ name: "Blink Eye Backup", extensions: ["zip"] }],
      });

      if (!destination) return;

      const result = await invoke<{ path: string; file_count: number }>(
        "export_user_data",
        { destinationPath: destination },
      );

      toast.success(`已导出 ${result.file_count} 个数据文件。`, {
        duration: 2500,
        position: "bottom-right",
      });
    } catch (error) {
      console.error("Failed to export data:", error);
      toast.error("Couldn't export data. Try again.", {
        duration: 2500,
        position: "bottom-right",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    try {
      setIsImporting(true);
      const source = await open({
        multiple: false,
        filters: [{ name: "Blink Eye Backup", extensions: ["zip"] }],
      });

      if (!source || Array.isArray(source)) return;

      const result = await invoke<{ file_count: number; backup_dir: string }>(
        "import_user_data",
        { sourcePath: source },
      );

      await invoke("refresh_reminder_scheduler_settings");

      toast.success(
        `Imported ${result.file_count} files. Relaunching to apply changes.`,
        { duration: 3000, position: "bottom-right" },
      );

      await relaunch();
    } catch (error) {
      console.error("Failed to import data:", error);
      toast.error("Couldn't import data. Check the backup file and try again.", {
        duration: 3000,
        position: "bottom-right",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-5 p-2">
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        <SettingRow
          icon={
            <SettingIconBadge color={accentHex}>
              <IoRocket className="size-4" />
            </SettingIconBadge>
          }
          label="开机启动"
          description="开机时启动 Blink Eye"
        >
          <Switch
            id="autostart"
            checked={isAutoStartEnabled}
            onCheckedChange={handleAutoStartChange}
            disabled={isLoading}
          />
        </SettingRow>

        <SettingRow
          icon={
            <SettingIconBadge color={accentHex}>
              <IoEyeOutline className="size-4" />
            </SettingIconBadge>
          }
          label="全屏休息提醒"
          description="开启后，到点会弹出全屏休息界面；关闭则只用系统通知提醒"
        >
          <Switch
            id="fullscreenReminder"
            checked={isFullscreenReminderEnabled}
            onCheckedChange={handleFullscreenReminderChange}
            disabled={isLoading}
          />
        </SettingRow>

        <SettingRow
          icon={
            <SettingIconBadge color={accentHex}>
              <IoBarChart className="size-4" />
            </SettingIconBadge>
          }
          label="每日屏幕使用上限"
          description="显示在使用时长图表上"
          controlClassName="flex w-full justify-end sm:min-w-[180px] sm:max-w-[200px]"
        >
          <Select
            value={String(timeLimit)}
            onValueChange={(val) => setTimeLimit(Number(val))}
            disabled={isLoading}
          >
            <SelectTrigger
              id="screenUsageLimit"
              className="w-full rounded-3xl bg-background/50"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USAGE_LIMIT_OPTIONS.map((hours) => (
                <SelectItem key={hours} value={String(hours)}>
                  {hours} {hours === 1 ? "hour" : "hours"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      </div>

      {trialLine !== null && (
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          <SettingRow
            icon={
              <SettingIconBadge color={accentHex}>
                <IoDiamond className="size-4" />
              </SettingIconBadge>
            }
            label="高级版试用"
            description={trialLine}
          >
            <Button variant="outline" asChild className="gap-2">
              <Link to="/activatelicense">查看高级版</Link>
            </Button>
          </SettingRow>
        </div>
      )}

      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        <SettingRow
          icon={
            <SettingIconBadge color={accentHex}>
              <IoDownloadOutline className="size-4" />
            </SettingIconBadge>
          }
          label="导出数据"
          description="Save settings, screen time, and todos (license stays on this device)"
        >
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={isLoading || isExporting || isImporting}
            className="gap-2"
          >
            <IoDownloadOutline className="size-4" />
            {isExporting ? "Exporting…" : "Export"}
          </Button>
        </SettingRow>

        <SettingRow
          icon={
            <SettingIconBadge color={accentHex}>
              <IoCloudUploadOutline className="size-4" />
            </SettingIconBadge>
          }
          label="导入数据"
          description="替换设置、屏幕使用时间和待办。许可证仍保留在本机。"
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={isLoading || isExporting || isImporting}
                className="gap-2"
              >
                <IoCloudUploadOutline className="size-4" />
                {isImporting ? "Importing…" : "Import"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>替换全部应用数据？</AlertDialogTitle>
                <AlertDialogDescription>
                  Importing will replace your settings, screen time, and todos
                  with the backup. Your license and install data on this device
                  are not changed. A copy of the replaced files is saved in the
                  app data folder before import. The app will relaunch when
                  finished.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleImportData}>
                  导入并重启
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SettingRow>
      </div>

      {isTimeLimitDirty && (
        <div className="flex justify-end">
          <Button
            onClick={handleSaveLimit}
            disabled={isLoading}
            className="gap-2 text-white hover:opacity-90"
            style={{ backgroundColor: accentHex }}
          >
            <IoSave className="size-4" />
            保存上限
          </Button>
        </div>
      )}
    </div>
  );
};

export default AllSettings;
