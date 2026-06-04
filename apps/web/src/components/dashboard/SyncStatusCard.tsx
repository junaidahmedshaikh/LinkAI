import { Card } from "@/components/ui";
import { requestExtensionSync } from "@/utils/extensionBridge";
import { isExtensionBridgeAvailable } from "@/utils/extensionBridge";

export function SyncStatusCard() {
  const bridgeAvailable = isExtensionBridgeAvailable();

  return (
    <Card animate={false} className="!p-5">
      <p className="text-xs uppercase text-muted">Platform sync</p>
      <p className="mt-1 text-lg font-semibold text-white">
        {bridgeAvailable ? "Extension detected" : "Extension not detected"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {bridgeAvailable
          ? "Web and extension share the same account when you sign in."
          : "Install the LinkAI extension and set VITE_EXTENSION_ID to enable auto-sync."}
      </p>
      {bridgeAvailable && (
        <button
          type="button"
          onClick={() => requestExtensionSync()}
          className="mt-3 text-xs text-accent hover:underline"
        >
          Push sync to extension →
        </button>
      )}
    </Card>
  );
}
