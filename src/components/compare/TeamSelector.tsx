'use client';

import { CheckCircle2 } from 'lucide-react';

const TEAM_COLORS = ["#6366F1", "#760455d4", "#14B8A6"];
const TEAM_COLORS_LIGHT = ["#EEF2FF", "#f8eef5", "#F0FDFA"];
const TEAM_COLORS_BORDER = ["#C7D2FE", "#e0a8df", "#A7F3D0"];

export { TEAM_COLORS, TEAM_COLORS_LIGHT, TEAM_COLORS_BORDER };

interface Props {
  allTeams: { slug: string; name: string }[];
  selected: string[];
  onChange: (slugs: string[]) => void;
  loading?: boolean;
}

export default function TeamSelector({
  allTeams,
  selected,
  onChange,
  loading,
}: Props) {
  function toggle(slug: string) {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else if (selected.length < 3) {
      onChange([...selected, slug]);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-14 sm:h-16 w-full animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4">
      {allTeams.map((team) => {
        const isSelected = selected.includes(team.slug);
        const teamIndex = selected.indexOf(team.slug);
        const canSelectMore = selected.length < 3;

        return (
          <button
            key={team.slug}
            onClick={() => toggle(team.slug)}
            disabled={!isSelected && !canSelectMore}
            className={`relative flex flex-col items-center justify-center h-14 sm:h-16 w-full rounded-2xl text-center p-2 sm:p-3 transition-all duration-200 shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:ring-0 disabled:hover:scale-100 disabled:hover:shadow-sm ${isSelected
                ? `ring-2 scale-105 shadow-lg`
                : `hover:scale-105 hover:shadow-md`
              }`}
            style={{
              backgroundColor: isSelected ? TEAM_COLORS_LIGHT[teamIndex] : 'white',
              borderColor: isSelected ? TEAM_COLORS_BORDER[teamIndex] : '#E5E7EB',
              '--tw-ring-color': isSelected ? TEAM_COLORS[teamIndex] : 'transparent',
              borderWidth: '1px',
            } as any}
          >
            {isSelected && (
              <CheckCircle2
                className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2"
                size={14}
                style={{ color: TEAM_COLORS[teamIndex] } as any}
              />
            )}
            <span
              className={`text-[11px] sm:text-xs leading-tight ${isSelected ? 'font-bold text-slate-800' : 'font-medium text-slate-500'}`}>
              {team.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
