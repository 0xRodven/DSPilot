import { memo } from "react";

import { useDragDrop } from "@/components/full-calendar/contexts/dnd-context";

import { EventDropConfirmationDialog } from "./event-drop-confirmation-dialog";

const DndConfirmationDialog = memo(() => {
  const { showConfirmation, pendingDropData, handleConfirmDrop, handleCancelDrop } = useDragDrop();

  if (!showConfirmation || !pendingDropData) return null;

  return (
    <EventDropConfirmationDialog
      open={showConfirmation}
      onOpenChange={() => {}} // Controlled by context
      event={pendingDropData.event}
      newStartDate={pendingDropData.newStartDate}
      newEndDate={pendingDropData.newEndDate}
      onConfirm={handleConfirmDrop}
      onCancel={handleCancelDrop}
    />
  );
});

DndConfirmationDialog.displayName = "DndConfirmationDialog";

export { DndConfirmationDialog };
