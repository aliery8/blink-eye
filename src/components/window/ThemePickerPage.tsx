import { ThemePicker } from "../ThemePicker";

const ThemePickerPage = () => {
  return (
    <div className="space-y-4 p-2">
      <h3 className="text-2xl font-heading tracking-wide">主题选择</h3>
      <p className="text-sm text-muted-foreground">
        选择会应用到整个应用的强调色。
      </p>
      <ThemePicker />
    </div>
  );
};

export default ThemePickerPage;
