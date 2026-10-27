import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart";

const AutoStart = () => {
  return (
    <div>
      {/* Check enable state */}
      {/* Button for enable autostart */}
      <button
        onClick={async () => {
          await enable();
          console.log(`registered for autostart? ${await isEnabled()}`);
        }}
      >
        开启开机自启
      </button>
      {/* Button for disable autostart */}
      <button
        onClick={async () => {
          await disable();
          console.log(`registered for autostart? ${await isEnabled()}`);
        }}
      >
        关闭开机自启
      </button>
    </div>
  );
};

export default AutoStart;
