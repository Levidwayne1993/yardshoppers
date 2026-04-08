"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  saleDate?: string;
  saleTimeStart?: string;
  saleTimeEnd?: string;
}

export default function CountdownTimer({
  saleDate,
  saleTimeStart,
  saleTimeEnd,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [status, setStatus] = useState<
    "upcoming" | "live" | "ended" | "none"
  >("none");

  useEffect(() => {
    if (!saleDate) return;

    function calculate() {
      const now = new Date();
      const start = new Date(
        `${saleDate}T${saleTimeStart || "08:00"}:00`
      );
      const end = saleTimeEnd
        ? new Date(`${saleDate}T${saleTimeEnd}:00`)
        : new Date(start.getTime() + 8 * 60 * 60 * 1000);

      if (now >= end) {
        setStatus("ended");
        setTimeLeft("Sale Ended");
        return;
      }
      if (now >= start && now < end) {
        setStatus("live");
        setTimeLeft("Happening Now!");
        return;
      }

      const diff = start.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (diff % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setStatus("upcoming");
      if (days > 0) setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      else if (hours > 0)
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      else setTimeLeft(`${minutes}m ${seconds}s`);
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [saleDate, saleTimeStart, saleTimeEnd]);

  if (status === "none") return null;

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-semibold ${
        status === "live"
          ? "text-green-600"
          : status === "ended"
          ? "text-gray-400"
          : "text-orange-600"
      }`}
    >
      {status === "live" && (
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      )}
      {status === "upcoming" && (
        <i className="fa-solid fa-clock text-[10px]" />
      )}
      {timeLeft}
    </div>
  );
}
