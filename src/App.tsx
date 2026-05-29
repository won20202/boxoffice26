import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { 
  Calendar, 
  ChevronRight, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  SlidersHorizontal,
  Ticket
} from "lucide-react";
import { DailyBoxOffice, BoxOfficeResponse } from "./types";
import DashboardStats from "./components/DashboardStats";
import MovieDetailDrawer from "./components/MovieDetailDrawer";

export default function App() {
  // Calculate yesterday's date dynamically
  const getYesterdayDate = (): Date => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
  };

  // Helper: Format Date object to YYYY-MM-DD
  const formatDateToDash = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const yesterdayStr = formatDateToDash(getYesterdayDate());

  // Component States
  const [selectedDate, setSelectedDate] = useState<string>(yesterdayStr);
  const [movies, setMovies] = useState<DailyBoxOffice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovieCd, setSelectedMovieCd] = useState<string | null>(null);
  
  // Quick dates selector helper
  const handleQuickDate = (daysAgo: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);
    setSelectedDate(formatDateToDash(targetDate));
  };

  // Fetch dail box office from API proxy
  const fetchBoxOffice = async (dateStr: string) => {
    setLoading(true);
    setError(null);
    try {
      const apiDate = dateStr.replace(/-/g, ""); // "2026-05-28" -> "20260528"
      const res = await fetch(`/api/boxoffice?targetDt=${apiDate}`);
      if (!res.ok) {
        throw new Error("KOBIS 박스오피스 데이터를 불러오는 데 실패했습니다.");
      }
      const data: BoxOfficeResponse = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.boxOfficeResult?.dailyBoxOfficeList) {
        setMovies(data.boxOfficeResult.dailyBoxOfficeList);
      } else {
        setMovies([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch whenever selectedDate changes
  useEffect(() => {
    fetchBoxOffice(selectedDate);
  }, [selectedDate]);

  // Formatter helpers
  const formatNumber = (numStr: string) => {
    const val = parseInt(numStr);
    if (isNaN(val)) return numStr;
    return new Intl.NumberFormat("ko-KR").format(val);
  };

  const formatSales = (salesStr: string) => {
    const val = parseInt(salesStr);
    if (isNaN(val)) return salesStr;
    
    // Convert to '억' or '만원' for friendly display in cards/details if too large
    if (val >= 100000000) {
      const eok = (val / 100000000).toFixed(1);
      return `${eok}억 원`;
    }
    const manStr = (val / 10000).toFixed(0);
    return `${formatNumber(manStr)}만 원`;
  };

  return (
    <div id="kobis-explorer-app" className="min-h-screen bg-[#0A0A0B] text-[#E5E5E7] font-sans antialiased pb-12">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-radial from-[#1A1A24] to-transparent opacity-40 pointer-events-none z-0" />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* Navigation & Title Block */}
        <header id="app-header" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#222] bg-[#0F0F11] px-6 py-5 rounded-2xl shadow-lg">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tighter flex items-center gap-2">
              KOBIS<span className="text-[#E50914]">BOXOFFICE</span>
            </h1>
            <p className="text-xs text-gray-400 font-medium">영화진흥위원회 OpenAPI 실시간 일일 박스오피스 순위 탐색</p>
          </div>

          {/* Date Picker Section */}
          <div id="date-picker-section" className="flex items-center">
            <div id="datepicker-container" className="flex items-center bg-[#1A1A1D] border border-[#333] px-4 py-2 rounded-lg text-sm focus-within:ring-2 focus-within:ring-[#E50914]/30 focus-within:border-[#E50914] transition-all">
              <span className="mr-3 text-xs font-bold text-gray-500 tracking-wider">날짜 선택</span>
              <Calendar className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                id="datepicker-input"
                type="date"
                value={selectedDate}
                max={yesterdayStr}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                  }
                }}
                className="bg-transparent border-none text-white font-semibold focus:outline-none w-28 sm:w-32 text-center cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>
        </header>

        {/* Date Quick selection navigation */}
        <div id="quick-date-navigation" className="bg-[#0F0F11] p-4 rounded-xl border border-[#222] flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-400 font-mono tracking-wide uppercase">Quick Date Jump</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleQuickDate(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedDate === yesterdayStr
                  ? "bg-[#E50914] text-white font-bold shadow-md shadow-[#E50914]/20"
                  : "bg-[#1A1A1D] text-gray-300 hover:bg-[#252529] border border-[#333]"
              }`}
            >
              어제 ({yesterdayStr.substring(5)})
            </button>
            <button
              onClick={() => handleQuickDate(7)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1A1A1D] text-gray-300 hover:bg-[#252529] border border-[#333] transition cursor-pointer"
            >
              1주일 전
            </button>
            <button
              onClick={() => handleQuickDate(30)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1A1A1D] text-gray-300 hover:bg-[#252529] border border-[#333] transition cursor-pointer"
            >
              1개월 전
            </button>
            <button
              onClick={() => handleQuickDate(365)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1A1A1D] text-gray-300 hover:bg-[#252529] border border-[#333] transition cursor-pointer"
            >
              1년 전
            </button>
          </div>
        </div>

        {/* Summary Dashboard Analytics card */}
        {!loading && !error && <DashboardStats movies={movies} />}

        {/* Main ranking and status display */}
        <div id="main-content-layout" className="bg-[#0F0F11] rounded-2xl border border-[#222] shadow-2xl overflow-hidden">
          
          <div id="table-header-bar" className="px-6 py-4 border-b border-[#222] flex items-center justify-between bg-[#131316]">
            <h2 id="table-title" className="text-sm font-bold text-white flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#E50914]" />
              일일 박스오피스 순위 <span className="text-xs text-gray-500 font-medium font-mono">Daily Ranking</span>
            </h2>
            <div className="text-xs text-[#E50914] font-bold bg-[#E50914]/10 px-3 py-1 border border-[#E50914]/20 rounded-lg font-mono">
              {(() => {
                const parts = selectedDate.split("-");
                return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일 기준`;
              })()}
            </div>
          </div>

          {loading ? (
            <div id="table-loading-container" className="py-24 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
              <div className="space-y-1 text-center">
                <p className="text-sm font-semibold text-gray-300">박스오피스 순위를 불러오고 있습니다...</p>
                <p className="text-xs text-gray-500 font-mono">KOBIS OpenAPI Connection</p>
              </div>
            </div>
          ) : error ? (
            <div id="table-error-container" className="py-16 px-6 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 bg-red-950/30 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-900/40">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-red-200">데이터 로드 오류</p>
                <p className="text-xs text-red-400/80">{error}</p>
              </div>
              <button
                onClick={() => fetchBoxOffice(selectedDate)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#E50914] hover:bg-[#b80710] text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                다시 시도하기
              </button>
            </div>
          ) : movies.length === 0 ? (
            <div id="table-empty-container" className="py-20 text-center text-gray-500 font-medium space-y-3">
              <p>해당 날짜에 집계된 박스오피스 데이터가 없습니다.</p>
              <p className="text-xs text-gray-600">영화진흥위원회의 전산 집계 또는 정산 미완료 상태일 수 있습니다.</p>
            </div>
          ) : (
            <div id="table-scroll" className="overflow-x-auto">
              
              {/* Responsive Table Layout */}
              <table id="boxoffice-table" className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#121215] border-b border-[#222] text-xs font-bold font-mono text-gray-400 tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-center w-16">순위</th>
                    <th scope="col" className="px-3 py-4 w-16 text-center">변동</th>
                    <th scope="col" className="px-6 py-4">영화명</th>
                    <th scope="col" className="px-6 py-4 text-right">당일 관객수</th>
                    <th scope="col" className="px-6 py-4 text-right">누적 관객수</th>
                    <th scope="col" className="px-6 py-4 text-right">당일 매출액</th>
                    <th scope="col" className="px-6 py-4 text-center w-20">매출 점유율</th>
                    <th scope="col" className="px-6 py-4 text-right w-24">스크린/상영</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1D]">
                  {movies.map((movie) => {
                    const isNew = movie.rankOldAndNew === "NEW";
                    const numInten = parseInt(movie.rankInten);
                    const isActive = selectedMovieCd === movie.movieCd;

                    return (
                      <tr
                        key={movie.movieCd}
                        onClick={() => setSelectedMovieCd(movie.movieCd)}
                        className={`group transition cursor-pointer border-l-4 transition-all duration-150 ${
                          isActive
                            ? "bg-[#252529] border-[#E50914] text-white"
                            : "bg-[#0F0F11]/50 border-transparent hover:bg-[#1A1A1D]"
                        }`}
                      >
                        {/* Rank */}
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-md font-extrabold text-sm ${
                            movie.rank === "1"
                              ? "bg-[#E50914]/15 text-[#E50914] ring-1 ring-[#E50914]/30"
                              : movie.rank === "2" || movie.rank === "3"
                              ? "bg-white/5 text-white/95 border border-white/10"
                              : "text-gray-400"
                          }`}>
                            {movie.rank}
                          </span>
                        </td>

                        {/* Rank Intensity Trend */}
                        <td className="px-3 py-4 text-center">
                          {isNew ? (
                            <span className="inline-block px-1.5 py-0.5 bg-yellow-500 text-yellow-950 text-[10px] font-black rounded-sm shadow-xs animate-pulse">
                              NEW
                            </span>
                          ) : numInten > 0 ? (
                            <span className="inline-flex items-center text-[#4ADE80] font-bold text-xs gap-0.5">
                              ▲{numInten}
                            </span>
                          ) : numInten < 0 ? (
                            <span className="inline-flex items-center text-blue-400 font-bold text-xs gap-0.5">
                              ▼{Math.abs(numInten)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-gray-600 font-bold text-xs">
                              -
                            </span>
                          )}
                        </td>

                        {/* Movie Name */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col max-w-xs sm:max-w-md truncate">
                            <span className={`font-bold transition truncate ${
                              isActive ? "text-white" : "text-gray-200 group-hover:text-white"
                            }`}>
                              {movie.movieNm}
                            </span>
                            <span className="text-xs text-gray-500 mt-0.5 font-mono">
                              개봉: {movie.openDt ? movie.openDt : "정보 없음"}
                            </span>
                          </div>
                        </td>

                        {/* Daily Audience */}
                        <td className="px-6 py-4 text-right font-semibold text-gray-200">
                          {formatNumber(movie.audiCnt)}명
                          {parseInt(movie.audiInten) !== 0 && (
                            <span className={`text-[10px] block font-normal mt-0.5 ${
                              parseInt(movie.audiInten) > 0 ? "text-[#4ADE80]" : "text-blue-400"
                            }`}>
                              {parseInt(movie.audiInten) > 0 ? "▲" : "▼"}{formatNumber(Math.abs(parseInt(movie.audiInten)).toString())}
                            </span>
                          )}
                        </td>

                        {/* Cumulative Audience */}
                        <td className="px-6 py-4 text-right text-gray-400 font-medium">
                          {formatNumber(movie.audiAcc)}명
                        </td>

                        {/* Daily Sales */}
                        <td className="px-6 py-4 text-right text-gray-300 font-medium font-mono text-xs">
                          {formatSales(movie.salesAmt)}
                        </td>

                        {/* Sales Share % */}
                        <td className="px-6 py-4 text-center">
                          <div className="inline-block px-2.5 py-0.5 bg-white/5 border border-white/5 text-gray-300 text-xs font-semibold rounded-md">
                            {movie.salesShare}%
                          </div>
                        </td>

                        {/* Screens Count */}
                        <td className="px-6 py-4 text-right text-gray-400 text-xs font-mono">
                          {formatNumber(movie.scrnCnt)}관
                          <span className="text-[10px] text-gray-500 block font-normal mt-0.5">
                            {formatNumber(movie.showCnt)}회
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

            </div>
          )}
        </div>

        {/* Info Helper Guideline */}
        <p className="text-center text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          * 순위표에서 각 영화의 행을 클릭하시면 상세 감독 및 출연진 매칭, 제작 상태, 상영 시간, 배급 등 <span className="text-white font-semibold">KOBIS 상세 전산 정보</span>를 보실 수 있습니다.
        </p>

      </div>

      {/* Slide-over film detail info Drawer */}
      <MovieDetailDrawer
        movieCd={selectedMovieCd}
        onClose={() => setSelectedMovieCd(null)}
      />
    </div>
  );
}
