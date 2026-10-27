import { BugIcon, MonitorCog } from "lucide-react";

const Soon = () => {
  return (
    <div className="flex items-center justify-center mt-24">
      <div className="text-center">
        {/* Construction Icon */}
        <MonitorCog className="mx-auto h-40 w-40 mb-4" />

        {/* Text */}
        <h1 className="text-2xl font-semibold mb-2 flex items-center justify-center">
          正在修最后几个 bug <BugIcon className="mx-2" /> 并持续改进
        </h1>
        <p className="text-lg">该功能即将上线。</p>
      </div>
    </div>
  );
};

export default Soon;
