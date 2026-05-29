import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Ensure we have a valid API Key. If not set, use the user's provided key as backup.
const KOBIS_API_KEY = process.env.KOBIS_API_KEY || "3a3816b17943accb6ecdf9f052335842";
const PORT = 3000;

// Lazy initialization for Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is is missing in local environment.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Endpoints:
  // 1. Box Office proxy
  app.get("/api/boxoffice", async (req, res) => {
    try {
      const { targetDt } = req.query;
      if (!targetDt || typeof targetDt !== "string") {
        return res.status(400).json({ error: "targetDt (YYYYMMDD) parameter is required." });
      }

      const url = `https://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${KOBIS_API_KEY}&targetDt=${targetDt}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`KOBIS API responded with status ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Boxoffice Proxy Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch box office data." });
    }
  });

  // 2. Movie Info proxy
  app.get("/api/movie-info", async (req, res) => {
    try {
      const { movieCd } = req.query;
      if (!movieCd || typeof movieCd !== "string") {
        return res.status(400).json({ error: "movieCd parameter is required." });
      }

      const url = `http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json?key=${KOBIS_API_KEY}&movieCd=${movieCd}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`KOBIS API responded with status ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Movie Info Proxy Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch movie info data." });
    }
  });

  // 3. AI Generated Review Endpoint
  app.post("/api/generate-review", async (req, res) => {
    try {
      const { movieTitle, notes, directors, nations, genres, prdtYear, watchGrade } = req.body;

      if (!movieTitle) {
        return res.status(400).json({ error: "movieTitle parameter is required." });
      }

      const ai = getGeminiClient();

      const userNotes = notes ? notes.trim() : "깊은 울림을 주는 훌륭한 영화였습니다.";

      const promptMsg = `
영화 제목: ${movieTitle}
국가: ${nations || "정보 없음"}
제작 연도: ${prdtYear || "정보 없음"}
장르: ${genres || "정보 없음"}
감독: ${directors || "정보 없음"}
관람 등급: ${watchGrade || "정보 없음"}

사용자의 간단 한 줄 평/노트: "${userNotes}"

위 정보를 바탕으로, 사용자의 간단한 한 줄 평 내용을 정성껏 고도화하고 확장하여 한 편의 멋지고 풍부한 감상평(영화 리뷰)을 작성해주세요.
형식은 가독성이 훌륭한 한국어 마크다운(Markdown) 포맷으로 작성해 주시고, 다음 내용들을 포함해 주세요:

1. **🎬 작품 소개 및 관람 가이드**: 영화의 장르적 특징 및 제작 배경에 걸맞는 한 문장 요약과 시놉시스에 따른 매력 분석.
2. **⚖️ 심층 분석 및 주제 의식**: 영화의 중심 테마 및 관람 포인트.
3. **✨ 한 줄 평에서 피어난 깊은 생각**: 사용자가 남긴 간단한 평("${userNotes}")을 평론가의 세련되고 깊이 있는 말로 해설 및 명대사처럼 승화시킨 해석비평 코너.

어조는 정중하면서도 흡입력 있는 시네필 혹은 전문 영화 칼럼니스트 어조로 친절하게 작성해 주세요. 불필요한 메타 설명 없이 곧바로 잘 구조화된 리뷰 내용만 출력해 주세요.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptMsg,
        config: {
          systemInstruction: "당신은 매력적이고 전문적인 통찰력을 통해 평범한 관람평을 마스터피스 리뷰 칼럼으로 승화시키는 명성 높은 한국의 영화 평론가입니다.",
          temperature: 0.8,
        },
      });

      const generatedText = response.text || "감상평을 생성할 수 없었습니다.";
      res.json({ review: generatedText });
    } catch (error: any) {
      console.error("Gemini AI Review Generation Error:", error);
      res.status(500).json({ error: error.message || "AI 감상평 생성 과정 중 오차가 발생하였습니다. API 키 설정을 확인하거나 잠시 후 다시 시도해 주세요." });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
