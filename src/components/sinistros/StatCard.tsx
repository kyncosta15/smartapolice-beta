import React from 'react';
import { LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: number | string;
  variant: "total" | "aberto" | "finalizado" | "ultimos60" | "assistencia";
  icon: LucideIcon;
  onClick?: () => void;
  isActive?: boolean;
  isLoading?: boolean;
};

const StatCard = ({
  label, 
  value, 
  variant, 
  icon: Icon,
  onClick, 
  isActive, 
  isLoading = false
}: StatCardProps) => {
  const gradientMap = {
    total: "from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900",
    aberto: "from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900", 
    finalizado: "from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900",
    ultimos60: "from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900",
    assistencia: "from-fuchsia-50 to-fuchsia-100 dark:from-fuchsia-950 dark:to-fuchsia-900",
  };

  const iconColorMap = {
    total: "text-indigo-600 dark:text-indigo-400",
    aberto: "text-amber-600 dark:text-amber-400",
    finalizado: "text-emerald-600 dark:text-emerald-400", 
    ultimos60: "text-violet-600 dark:text-violet-400",
    assistencia: "text-fuchsia-600 dark:text-fuchsia-400",
  };

  const gradient = gradientMap[variant];
  const iconColor = iconColorMap[variant];

  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left p-5 rounded-2xl bg-gradient-to-br transition-all duration-200",
        gradient,
        "shadow-sm hover:shadow-md hover:scale-[1.02]",
        isActive ? "ring-2 ring-offset-2 ring-indigo-400 dark:ring-indigo-500" : "",
        onClick ? "cursor-pointer" : "cursor-default"
      ].join(" ")}
      aria-pressed={isActive}
      aria-label={`${label}: ${value}`}
      disabled={isLoading}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {label}
        </div>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      
      <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
        {isLoading ? (
          <div className="animate-pulse bg-slate-300 dark:bg-slate-600 h-8 w-16 rounded" />
        ) : (
          value
        )}
      </div>
      
      {isActive && (
        <div className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
          Filtro ativo
        </div>
      )}
    </button>
  );
};

export { StatCard };
export default StatCard;