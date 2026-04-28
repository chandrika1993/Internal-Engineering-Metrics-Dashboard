"use client";

const TEAM_COLORS = ["#4F46E5", "#0EA5E9", "#64748B"]; // Updated to Indigo, Sky, Slate
const TEAM_COLORS_LIGHT = ["#EEF2FF", "#F0F9FF", "#F8FAFC"];
const TEAM_COLORS_BORDER = ["#C7D2FE", "#BAE6FD", "#E2E8F0"];

export { TEAM_COLORS, TEAM_COLORS_LIGHT, TEAM_COLORS_BORDER };

interface Props {
  allTeams: { slug: string; name: string }[];
  selected: string[];
  onChange: (slugs: string[]) => void;
  loading?: boolean; // Added loading prop
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

  // ─── SKELETON STATE ───
  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {["w-32", "w-48", "w-28", "w-40", "w-36", "w-44"].map((width, i) => (
          <div
            key={i}
            className={`${width} h-8 animate-pulse bg-slate-200/60 rounded-full border border-slate-100`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allTeams.map((t) => {
        const idx = selected.indexOf(t.slug);
        const isSelected = idx !== -1;
        const isDisabled = !isSelected && selected.length >= 3;

        return (
          <button
            key={t.slug}
            onClick={() => !isDisabled && toggle(t.slug)}
            disabled={isDisabled}
            title={isDisabled ? "Maximum 3 teams" : undefined}
            className={`
              relative rounded-full px-4 py-1.5 text-sm font-bold border transition-all duration-200
              ${
                isDisabled
                  ? "opacity-30 cursor-not-allowed bg-white border-slate-100 text-slate-300"
                  : "cursor-pointer"
              }
              ${
                !isSelected && !isDisabled
                  ? "bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-sm"
                  : ""
              }
            `}
            style={
              isSelected
                ? {
                    backgroundColor: TEAM_COLORS[idx],
                    borderColor: TEAM_COLORS[idx],
                    color: "#fff",
                    boxShadow: `0 0 0 3px ${TEAM_COLORS_BORDER[idx]}`,
                  }
                : undefined
            }
          >
            {isSelected && (
              <span className="mr-1.5 text-white/70 text-[10px] font-black">
                {idx + 1}
              </span>
            )}
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
