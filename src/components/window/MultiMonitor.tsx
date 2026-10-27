import MultiMonitorToggle from "../MultiMonitorToggle";

const MultiMonitor = () => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-heading tracking-wide">多显示器设置</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    选择休息背景只铺满一个显示器，还是所有显示器
                </p>
            </div>

            <MultiMonitorToggle />

            <div className="rounded-lg border border-muted p-6 space-y-4">
                <h4 className="text-lg font-semibold">工作原理</h4>
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            1
                        </div>
                        <div>
                            <p className="font-medium text-foreground">主显示器</p>
                            <p>The break background and controls (timer, skip, todos) appear on your main display only. Other screens stay unchanged.</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            2
                        </div>
                        <div>
                            <p className="font-medium text-foreground">Multi-monitor (Premium)</p>
                            <p>同一背景主题会铺满所有显示器；计时、跳过等控件只保留在主显示器，在那里结束休息会关闭所有屏幕。</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultiMonitor;
