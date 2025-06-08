# 구글시트 AI 대시보드

구글시트 데이터를 자동 분석하여 리포트/차트/표로 시각화하는 AI 대시보드 서비스입니다.

- 구글시트 링크만 입력하면 자동 분석/시각화
- 주요 통계, 이상치 탐지, 상관관계, 시계열, 표 등 전문가 수준의 리포트 제공
- 누구나 웹에서 바로 사용 가능

## 데모

- **Vercel**: [https://test-mu-jet-71.vercel.app](https://test-mu-jet-71.vercel.app)
- **Netlify**: [https://loquacious-wisp-a011ed.netlify.app](https://loquacious-wisp-a011ed.netlify.app)

## 사용 방법

1. 좌측에 구글시트 링크를 입력/저장
2. 저장된 링크를 클릭하면 자동으로 분석 결과가 대시보드에 표시됨

## 개발 및 실행

```bash
git clone https://github.com/brocoli012/test.git
cd test
npm install
npm start
```

## 배포 방법

### Vercel

1. [Vercel](https://vercel.com) 회원가입 및 GitHub 연동
2. "New Project" → `brocoli012/test` 선택 → "Deploy"
3. 배포 완료 후, 주소(예: `https://test-mu-jet-71.vercel.app`)를 공유

### Netlify

1. [Netlify](https://netlify.com) 회원가입 및 GitHub 연동
2. "Add new site" → "Import an existing project" → `brocoli012/test` 선택
3. 빌드 명령: `npm run build`, 배포 디렉토리: `build`
4. 배포 완료 후, 주소(예: `https://loquacious-wisp-a011ed.netlify.app`)를 공유

## 환경설정

- React + TailwindCSS + Chart.js
- 구글시트는 "웹에 게시" 및 "공개" 상태여야 함

## 라이선스

MIT