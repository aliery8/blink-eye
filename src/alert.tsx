import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { XIcon } from "lucide-react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { invoke } from "@tauri-apps/api/core";
import { Ticker } from "@tombcato/smart-ticker";
import "@tombcato/smart-ticker/style.css";
import logo from "./assets/newIcon.png";
import { Button } from "./components/ui/button";
import AllSetText from "./components/AllSetText";
import "./index.css";

const Alert = () => {
  const [timeLeft, setTimeLeft] = useState(13);
  const [showAllSet, setShowAllSet] = useState(true);
  const window = getCurrentWebviewWindow();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAllSet(false);

      const countdownTimer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            window.close();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownTimer);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = async () => {
    try {
      // 用户主动叉掉小窗：取消这一次即将开始的全屏提醒，并重新开始计时。
      // 倒计时自动关闭走的是 window.close()，不会取消提醒。
      await invoke("dismiss_before_alert");
    } catch (error) {
      console.error("[Alert] dismiss_before_alert failed:", error);
    }
    await window.close();
  };

  return (
    <div className="h-screen w-full opacity-90 flex items-center justify-between bg-black/70 rounded-2xl px-4 backdrop-blur-3xl border border-white/10 animate-in slide-in-from-top duration-300">
      {!showAllSet && (
        <img
          src={logo}
          className="h-12 w-12 animate-in slide-in-from-top duration-300"
          alt="Blink Eye"
        />
      )}

      <div className="font-heading text-white text-6xl mx-auto flex items-center justify-center">
        {showAllSet ? (
          <div className="p-10">
            <AllSetText />
          </div>
        ) : timeLeft > 0 ? (
          <div className="flex items-center justify-center tabular-nums animate-in slide-in-from-top duration-300">
            {/* Comments must be inside the HTML/JSX elements! */}
            <span className="mr-1">00:</span>
            <Ticker
              value={String(timeLeft).padStart(2, "0")}
              duration={500}
              easing="easeInOut"
              characterLists={["0123456789"]}
              charWidth={0.8}
              className="!font-heading tabular-nums"
            />
          </div>
        ) : (
          <div className="flex items-center tabular-nums">
            <span className="mr-1">00:</span>
            <span>00</span>
          </div>
        )}
      </div>

      {!showAllSet && (
        <Button
          onClick={handleClose}
          className="rounded-lg h-10 w-10 animate-in slide-in-from-top duration-300"
        >
          <XIcon className="w-6 h-6 hover:rotate-90 transition-transform" />
        </Button>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("alert-root")!).render(
  <React.StrictMode>
    <Alert />
  </React.StrictMode>,
);
