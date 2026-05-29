export interface DailyBoxOffice {
  rnum: string;
  rank: string;
  rankInten: string;
  rankOldAndNew: "OLD" | "NEW";
  movieCd: string;
  movieNm: string;
  openDt: string;
  salesAmt: string;
  salesShare: string;
  salesInten: string;
  salesChange: string;
  salesAcc: string;
  audiCnt: string;
  audiInten: string;
  audiChange: string;
  audiAcc: string;
  scrnCnt: string;
  showCnt: string;
}

export interface BoxOfficeResponse {
  boxOfficeResult?: {
    boxofficeType: string;
    showRange: string;
    dailyBoxOfficeList?: DailyBoxOffice[];
  };
  error?: string;
}

export interface Nation {
  nationNm: string;
}

export interface Genre {
  genreNm: string;
}

export interface Director {
  peopleNm: string;
  peopleNmEn: string;
}

export interface Actor {
  peopleNm: string;
  peopleNmEn: string;
  cast: string;
  castEn: string;
}

export interface ShowType {
  showTypeGrpNm: string;
  showTypeNm: string;
}

export interface Company {
  companyCd: string;
  companyNm: string;
  companyNmEn: string;
  companyPartNm: string;
}

export interface Audit {
  auditNo: string;
  watchGradeNm: string;
}

export interface Staff {
  peopleNm: string;
  peopleNmEn: string;
  staffRoleNm: string;
}

export interface MovieDetail {
  movieCd: string;
  movieNm: string;
  movieNmEn: string;
  movieNmOg: string;
  showTm: string;
  prdtYear: string;
  openDt: string;
  prdtStatNm: string;
  typeNm: string;
  nations: Nation[];
  genres: Genre[];
  directors: Director[];
  actors: Actor[];
  showTypes: ShowType[];
  companys: Company[];
  audits: Audit[];
  staffs: Staff[];
}

export interface MovieInfoResponse {
  movieInfoResult?: {
    movieInfo?: MovieDetail;
    source: string;
  };
  error?: string;
}
