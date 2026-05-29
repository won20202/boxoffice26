import { Users, Clapperboard, Award } from "lucide-react";
import { DailyBoxOffice } from "../types";

interface DashboardStatsProps {
  movies: DailyBoxOffice[];
}

export default function DashboardStats({ movies }: DashboardStatsProps) {
  // Compute summary stats safely
  const totalAudi = movies.reduce((sum, movie) => sum + (parseInt(movie.audiCnt) || 0), 0);
  const totalScrn = movies.reduce((sum, movie) => sum + (parseInt(movie.scrnCnt) || 0), 0);
  const topMovie = movies.find((movie) => movie.rank === "1");

  // Format helper for numbers
  const formatNum = (num: number) => {
    return new Intl.NumberFormat("ko-KR").format(num);
  };

  return (
    <div id="stats-grid" className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1위 영화 */}
      <div id="top-movie-stat" className="relative overflow-hidden bg-[#121215] p-6 rounded-xl border border-[#2A2A2E] text-[#E5E5E7] flex flex-col justify-between group transition hover:border-[#E50914]/40">
        <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition duration-500">
          <Award className="w-36 h-36" />
        </div>
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded bg-[#E50914]/10 border border-[#E50914]/20 text-[#E50914]">
              <Award className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-[#E50914] uppercase tracking-wider font-mono">🏆 Daily No. 1</span>
          </div>
          <h3 className="text-lg font-bold truncate mt-2 leading-snug text-white group-hover:text-[#E50914] transition-colors">
            {topMovie?.movieNm || "순위 집계 중"}
          </h3>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 z-10">
          <span>개봉일: {topMovie?.openDt || "-"}</span>
          <span className="px-2.5 py-0.5 bg-[#E50914] text-white rounded font-bold text-[10px] tracking-wide">
             관객 {topMovie ? formatNum(parseInt(topMovie.audiCnt)) : 0}명
          </span>
        </div>
      </div>

      {/* 총 관객수 */}
      <div id="total-audience-stat" className="bg-[#0F0F11]/90 p-6 rounded-xl border border-white/5 flex items-center gap-5 hover:border-white/10 transition">
        <div className="w-12 h-12 bg-white/5 text-white/80 rounded-lg flex items-center justify-center border border-white/10 shrink-0">
          <Users className="w-5 h-5 text-[#4ADE80]" />
        </div>
        <div>
          <span className="text-xs font-semibold text-[#666] block font-mono tracking-wider">TOTAL AUDIENCE</span>
          <span className="text-2xl font-bold text-white tracking-tight mt-0.5 block">
            {movies.length > 0 ? `${formatNum(totalAudi)}명` : "0명"}
          </span>
          <p className="text-[10px] text-gray-500 mt-1">상위 10개 영화 당일 관객 합산</p>
        </div>
      </div>

      {/* 총 상영 스크린수 */}
      <div id="total-screens-stat" className="bg-[#0F0F11]/90 p-6 rounded-xl border border-white/5 flex items-center gap-5 hover:border-white/10 transition">
        <div className="w-12 h-12 bg-white/5 text-white/80 rounded-lg flex items-center justify-center border border-white/10 shrink-0">
          <Clapperboard className="w-5 h-5 text-[#FACC15]" />
        </div>
        <div>
          <span className="text-xs font-semibold text-[#666] block font-mono tracking-wider">COMBINED SCREENS</span>
          <span className="text-2xl font-bold text-white tracking-tight mt-0.5 block">
            {movies.length > 0 ? `${formatNum(totalScrn)}관` : "0관"}
          </span>
          <p className="text-[10px] text-gray-500 mt-1">상위 10개 영화 확보 스크린 수</p>
        </div>
      </div>
    </div>
  );
}
