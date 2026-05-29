import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Film, Clock, User, Globe, Tag, Award, Building, PlayCircle, Sparkles, MessageSquare } from "lucide-react";
import Markdown from "react-markdown";
import { MovieDetail, MovieInfoResponse } from "../types";

interface MovieDetailDrawerProps {
  movieCd: string | null;
  onClose: () => void;
}

export default function MovieDetailDrawer({ movieCd, onClose }: MovieDetailDrawerProps) {
  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for AI Review generation
  const [userComment, setUserComment] = useState("");
  const [generatedReview, setGeneratedReview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieCd) {
      setDetail(null);
      setUserComment("");
      setGeneratedReview(null);
      setGenError(null);
      return;
    }

    // Reset AI state on new movie selection
    setUserComment("");
    setGeneratedReview(null);
    setGenError(null);

    async function fetchMovieInfo() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/movie-info?movieCd=${movieCd}`);
        if (!res.ok) {
          throw new Error("영화 상세 정보를 가져오는 데 실패했습니다.");
        }
        const data: MovieInfoResponse = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        if (data.movieInfoResult?.movieInfo) {
          setDetail(data.movieInfoResult.movieInfo);
        } else {
          throw new Error("영화 정보를 찾을 수 없습니다.");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchMovieInfo();
  }, [movieCd]);

  const handleGenerateReview = async () => {
    if (!detail) return;
    setGenerating(true);
    setGenError(null);
    try {
      const parts = detail.directors?.map((d) => d.peopleNm).join(", ") || "정보 없음";
      const genreNames = detail.genres?.map((g) => g.genreNm).join(", ") || "정보 없음";
      const nationNames = detail.nations?.map((n) => n.nationNm).join(", ") || "정보 없음";

      const res = await fetch("/api/generate-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movieTitle: detail.movieNm,
          notes: userComment,
          directors: parts,
          nations: nationNames,
          genres: genreNames,
          prdtYear: detail.prdtYear,
          watchGrade: (detail.audits && detail.audits[0]?.watchGradeNm) || "",
        }),
      });

      if (!res.ok) {
        throw new Error("상세 감상평 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedReview(data.review);
    } catch (err: any) {
      setGenError(err.message || "감상평 생성 도중 예기치 못한 에러가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {movieCd && (
        <div id="movie-detail-overlay" className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop Fade In */}
          <motion.div
            id="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xs"
          />

          {/* Drawer Slide In */}
          <motion.div
            id="drawer-container"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="relative h-full w-full max-w-xl bg-[#0F0F11] border-l border-[#222] shadow-2xl flex flex-col z-10 overflow-hidden text-[#E5E5E7]"
          >
            {/* Header Area */}
            <div id="drawer-header" className="flex items-center justify-between px-6 py-5 border-b border-[#222] bg-[#121215]">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#E50914]" />
                <span className="text-xs font-bold text-gray-400 font-mono tracking-wider uppercase">Movie Specification</span>
              </div>
              <button
                id="close-drawer-btn"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div id="drawer-content" className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div id="drawer-loading" className="flex flex-col items-center justify-center h-64 space-y-4">
                  <div className="w-8 h-8 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-500 font-mono tracking-wider">LOADING DATA SPECIFICATION...</p>
                </div>
              ) : error ? (
                <div id="drawer-error" className="bg-red-950/20 p-4 rounded-xl text-red-300 text-sm border border-red-900/30">
                  <p className="font-semibold">오류 발생</p>
                  <p className="mt-1 text-xs text-red-400">{error}</p>
                </div>
              ) : detail ? (
                <div id="detail-pane" className="space-y-6">
                  {/* Movie Titles */}
                  <div>
                    <h2 id="movie-title-ko" className="text-2xl font-black text-white tracking-tight leading-snug">
                      {detail.movieNm}
                    </h2>
                    {detail.movieNmEn && (
                      <p id="movie-title-en" className="text-xs text-gray-400 font-semibold tracking-wide font-mono mt-1">
                        {detail.movieNmEn} {detail.prdtYear && `(${detail.prdtYear})`}
                      </p>
                    )}
                  </div>

                  {/* Badges Flow */}
                  <div id="badges-row" className="flex flex-wrap gap-2 pt-1">
                    {detail.audits && detail.audits[0]?.watchGradeNm ? (
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-md border border-amber-500/20">
                        {detail.audits[0].watchGradeNm}
                      </span>
                    ) : null}
                    {detail.genres && detail.genres.map((g, idx) => (
                      <span key={idx} className="px-3 py-1 bg-[#E50914]/10 text-[#E50914] text-xs font-bold rounded-md border border-[#E50914]/20">
                        {g.genreNm}
                      </span>
                    ))}
                    {detail.showTm && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 text-gray-300 text-xs font-semibold rounded-md border border-white/5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {detail.showTm}분
                      </span>
                    )}
                  </div>

                  {/* General metadata card */}
                  <div id="metadata-grid" className="grid grid-cols-2 gap-4 bg-[#121215] p-4 rounded-xl border border-[#222] text-sm">
                    <div>
                      <span className="text-xs text-gray-500 font-bold block">국가</span>
                      <span className="text-white font-medium flex items-center gap-1.5 mt-1">
                        <Globe className="w-4 h-4 text-gray-400" />
                        {detail.nations && detail.nations.map((n) => n.nationNm).join(", ") || "정보 없음"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-bold block">개봉일</span>
                      <span className="text-white font-medium flex items-center gap-1.5 mt-1">
                        <Tag className="w-4 h-4 text-gray-400" />
                        {detail.openDt ? `${detail.openDt.substring(0, 4)}-${detail.openDt.substring(4, 6)}-${detail.openDt.substring(6, 8)}` : "정보 없음"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-bold block">제작 상태</span>
                      <span className="text-white font-medium flex items-center gap-1.5 mt-1">
                        <Award className="w-4 h-4 text-gray-400" />
                        {detail.prdtStatNm || "정보 없음"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-bold block">상영 타입</span>
                      <span className="text-white font-medium flex items-center gap-1.5 mt-1">
                        <PlayCircle className="w-4 h-4 text-gray-400" />
                        {detail.showTypes && detail.showTypes.map(t => t.showTypeNm).slice(0, 3).join(", ") || "정보 없음"}
                      </span>
                    </div>
                  </div>

                  {/* Directors */}
                  <div id="directors-section" className="space-y-2">
                    <h3 className="text-sm font-bold text-white border-l-4 border-[#E50914] pl-2 uppercase tracking-wide">감독</h3>
                    {detail.directors && detail.directors.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {detail.directors.map((dir, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-[#121215] border border-[#222] rounded-xl hover:border-[#333] transition">
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-white truncate">{dir.peopleNm}</p>
                              {dir.peopleNmEn && <p className="text-xs text-gray-500 truncate font-mono">{dir.peopleNmEn}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">등록된 감독 정보가 없습니다.</p>
                    )}
                  </div>

                  {/* Cast / Actors */}
                  <div id="actors-section" className="space-y-2">
                    <h3 className="text-sm font-bold text-white border-l-4 border-[#E50914] pl-2 uppercase tracking-wide">출연진 ({detail.actors?.length || 0})</h3>
                    {detail.actors && detail.actors.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {detail.actors.slice(0, 10).map((act, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-[#121215] border border-[#222] rounded-xl hover:border-[#333] transition">
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-white truncate">{act.peopleNm}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {act.cast ? `역: ${act.cast}` : "출연"}
                              </p>
                            </div>
                          </div>
                        ))}
                        {detail.actors.length > 10 && (
                          <p className="text-xs text-gray-500 col-span-2 pt-1 text-center font-medium">
                            외 {detail.actors.length - 10}명의 출연배우가 더 있습니다.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">등록된 출연진 정보가 없습니다.</p>
                    )}
                  </div>

                  {/* Companies */}
                  <div id="companies-section" className="space-y-2">
                    <h3 className="text-sm font-bold text-white border-l-4 border-[#E50914] pl-2 uppercase tracking-wide">참여 업체</h3>
                    {detail.companys && detail.companys.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        {detail.companys.slice(0, 4).map((comp, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-3 rounded-lg bg-[#121215] border border-[#222] text-gray-300">
                            <span className="font-bold flex items-center gap-1.5 truncate text-white">
                              <Building className="w-3.5 h-3.5 text-gray-500" />
                              {comp.companyNm}
                            </span>
                            <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-gray-400 text-[10px] font-bold shrink-0">
                              {comp.companyPartNm}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">등록된 제작사/배급사 정보가 없습니다.</p>
                    )}
                  </div>

                  {/* AI Review Generator Section */}
                  <div id="ai-review-section" className="space-y-4 pt-6 border-t border-[#222]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#E50914] animate-pulse" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                        AI 감상평 칼럼 생성기
                      </h3>
                    </div>
                    
                    <div className="bg-[#121215] border border-[#222] rounded-xl p-4 space-y-3">
                      <p className="text-xs text-gray-400 leading-relaxed">
                        영화에 관한 한 줄 평이나 짧은 감상 메모를 작성해 주세요. Gemini 3.5 Flash 평론 엔진이 깊이 있는 전문 영화 평론 칼럼으로 승화시켜 작성합니다.
                      </p>

                      <textarea
                        id="user-comment-textarea"
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                        placeholder="예: 기대 이상의 수작. 특히 OST와 음향 효과가 압도적이었고 주인공들의 열연이 마지막까지 깊은 여운을 남깁니다."
                        className="w-full h-20 bg-black/40 border border-[#333] rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#E50914] focus:border-[#E50914] resize-none"
                      />

                      <div className="flex gap-2 justify-end">
                        {generatedReview && (
                          <button
                            onClick={() => {
                              setUserComment("");
                              setGeneratedReview(null);
                            }}
                            className="px-3 py-1.5 bg-white/5 border border-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white rounded-lg transition font-medium cursor-pointer"
                          >
                            초기화
                          </button>
                        )}
                        <button
                          onClick={handleGenerateReview}
                          disabled={generating}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#E50914] hover:bg-[#b80710] disabled:opacity-50 text-xs text-white rounded-lg transition font-bold shadow-md shadow-[#E50914]/15 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {generating ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              원고 작성 중...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              상세 감상평 생성
                            </>
                          )}
                        </button>
                      </div>

                      {genError && (
                        <div className="text-xs bg-red-950/20 text-red-400 p-2.5 rounded border border-red-900/40">
                          {genError}
                        </div>
                      )}
                    </div>

                    {/* Generated Review Output Display */}
                    {generatedReview && (
                      <div id="generated-review-output" className="space-y-2 mt-4">
                        <div className="flex items-center justify-between border-b border-[#222] pb-1.5">
                          <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-[#E50914]" />
                            작성된 평론가 추천 감상평
                          </span>
                          <span className="text-[10px] font-mono text-[#E50914]/80 px-2 py-0.5 bg-[#E50914]/10 rounded-md border border-[#E50914]/20">
                            GEMINI 3.5 FLASH
                          </span>
                        </div>
                        
                        <div className="bg-[#121215] border border-[#222] rounded-xl p-5 text-sm leading-relaxed text-gray-350 overflow-hidden font-normal">
                          <div className="markdown-body space-y-2">
                            <Markdown
                              components={{
                                h1: ({ children }) => <h1 className="text-sm sm:text-base font-black text-white mt-4 mb-2 border-b border-[#333] pb-1 font-mono uppercase tracking-wide">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-xs sm:text-sm font-bold text-white mt-3 mb-1.5">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-xs font-bold text-[#E50914] mt-2 mb-1">{children}</h3>,
                                p: ({ children }) => <p className="text-gray-300 leading-relaxed mb-3 text-xs sm:text-sm">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-3 text-xs sm:text-sm text-gray-400">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-3 text-xs sm:text-sm text-gray-400">{children}</ol>,
                                li: ({ children }) => <li className="text-gray-300">{children}</li>,
                                strong: ({ children }) => <strong className="font-black text-[#E50914]/90">{children}</strong>,
                                blockquote: ({ children }) => <blockquote className="border-l-2 border-[#E50914] pl-3 italic text-gray-400 bg-white/5 py-1 px-2 my-2 rounded text-xs sm:text-sm">{children}</blockquote>,
                              }}
                            >
                              {generatedReview}
                            </Markdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div id="no-detail-state" className="text-center font-medium text-gray-500 py-12">
                  영화 정보를 표시할 수 없습니다.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
