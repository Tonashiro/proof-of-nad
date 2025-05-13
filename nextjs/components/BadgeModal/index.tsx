"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Badge } from "@/lib/badges";

interface BadgeModalProps {
  badge: Badge | null;
  isMinted: boolean;
  isAvailable: boolean;
  open: boolean;
  onClose?: () => void;
  onClick: () => void;
}

export const BadgeModal: React.FC<BadgeModalProps> = ({
  badge,
  isMinted,
  isAvailable,
  open,
  onClose,
  onClick,
}) => {
  if (!badge) return null;

  const renderMintedMessage = () => (
    <div className="text-center text-green-600 font-semibold mt-4">
      ✅ Badge Already Minted
    </div>
  );

  const renderMintButton = () => (
    <Button className="w-full mt-4" onClick={() => onClick()}>
      Mint Badge
    </Button>
  );

  const renderUnavailableMessage = () => (
    <div className="text-center text-gray-500 mt-4">
      🚫 You don’t meet the requirements yet.
    </div>
  );

  const renderAction = () => {
    if (isMinted) {
      return renderMintedMessage();
    } else if (isAvailable) {
      return renderMintButton();
    } else {
      return renderUnavailableMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90%] rounded-lg sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{badge.name}</DialogTitle>
          <DialogDescription className="text-center">
            {badge.description}
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-40 h-40 mx-auto">
          <Image
            src={badge.image}
            alt={badge.name}
            fill
            className="object-contain rounded-full"
          />
        </div>

        {renderAction()}
      </DialogContent>
    </Dialog>
  );
};
