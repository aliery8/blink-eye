import { useUpdate } from "../contexts/UpdateContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

export function UpdateDialog() {
  const { latestVersion, dialogOpen, dismissUpdate, downloadAndInstall } =
    useUpdate();

  return (
    <AlertDialog open={dialogOpen} onOpenChange={(open) => {
      if (!open) void dismissUpdate();
    }}>
      <div className="w-80">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>有可用更新</AlertDialogTitle>
            <AlertDialogDescription>
              Blink Eye v{latestVersion} is available. Would you like to update
              now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => void dismissUpdate()}>
              暂不
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => void downloadAndInstall()}>
              更新
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </div>
    </AlertDialog>
  );
}
