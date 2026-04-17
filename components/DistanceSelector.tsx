"use client";

const DISTANCES = [
  { label: "5 mi", value: 5 },
  { label: "10 mi", value: 10 },
  { label: "25 mi", value: 25 },
  { label: "50 mi", value: 50 },
  { label: "100 mi", value: 100 },
  { label: "Any", value: 999 },
];

interface DistanceSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export default function DistanceSelector({
  value,
  onChange,
}: DistanceSelectorProps) {
  return (
    <div
      className="flex items-center gap-1.5 flex-wrap min-h-[32px]"
      role="radiogroup"
      aria-label="Search radius"
    >
      <span className="text-xs text-gray-500 font-medium mr-1">
        <i className="fa-solid fa-sliders text-ys-600 mr-1" aria-hidden="true" />
        Radius:
      </span>
      {DISTANCES.map((d) => (
        <button
          key={d.value}
          onClick={() => onChange(d.value)}
          role="radio"
          aria-checked={value === d.value}
          aria-label={d.value === 999 ? "Any distance" : `${d.value} miles`}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            value === d.value
              ? "bg-ys-700 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
