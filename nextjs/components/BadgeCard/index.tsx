"use client";

import Image from "next/image";
import clsx from "clsx";
import { CheckCircle } from "lucide-react";
import { Badge } from "@/lib/badges";

interface BadgeCardProps {
  badge: Badge;
  isAvailable: boolean;
  isMinted: boolean;
  onClick: () => void;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  isAvailable,
  isMinted,
  onClick,
}) => {
  const showGrayscale = isAvailable && !isMinted;
  const unavailable = !isAvailable;

  return (
    <div
      className={clsx(
        "relative group w-fit mx-auto text-center cursor-pointer"
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
    >
      <div className="relative w-28 h-28">
        <Image
          src={badge.image}
          alt={badge.name}
          fill
          className={clsx(
            "rounded-full object-contain transition-all duration-300 group-hover:scale-105",
            {
              "grayscale opacity-80  group-hover:grayscale-0 group-hover:opacity-100":
                showGrayscale || unavailable,
              "opacity-100": isMinted,
              "grayscale opacity-20": unavailable,
            }
          )}
        />

        {unavailable && (
          <div className="absolute inset-0 bg-black/40 rounded-full  flex items-center justify-center">
            <span className="text-white text-xs font-semibold">
              Unavailable
            </span>
          </div>
        )}

        {isMinted && (
          <div className="absolute top-1 right-1 bg-white rounded-full">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        )}
      </div>

      <p className="mt-2 text-sm font-semibold text-gray-800">{badge.name}</p>
    </div>
  );
};
