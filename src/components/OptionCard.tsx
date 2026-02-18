interface OptionCardProps {
  label: string;
  color?: "blue" | "green" | "purple" | "orange" | "indigo" | "teal";
  icon?: React.ReactNode;
  onClick: () => void;
}

const colorMap: Record<string, string> = {
  blue:   "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
  green:  "bg-green-600 hover:bg-green-700 active:bg-green-800",
  purple: "bg-purple-600 hover:bg-purple-700 active:bg-purple-800",
  orange: "bg-orange-500 hover:bg-orange-600 active:bg-orange-700",
  indigo: "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800",
  teal:   "bg-teal-600 hover:bg-teal-700 active:bg-teal-800",
};

export default function OptionCard({ label, color = "blue", icon, onClick }: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-white font-semibold rounded-2xl px-5 py-4 text-left
                  flex items-center gap-4 shadow-md transition-all duration-150
                  active:scale-[0.98] select-none ${colorMap[color]}`}
    >
      {icon && (
        <span className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 rounded-xl
                         flex items-center justify-center">
          {icon}
        </span>
      )}
      <span className="text-base leading-snug">{label}</span>
      <svg className="ml-auto flex-shrink-0 w-5 h-5 opacity-70" fill="none"
           stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
