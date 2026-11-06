# 작업 1 — 정적 앱과 검증 기반 결과

검증일: 2026-11-07 (Asia/Seoul). 브랜치: `codex/phase-1-static-app`. 시작 기준: `main` / `d799ca3` (문서 PR #1 병합). 후속 PR 제출 요청에 따라 작업 1을 커밋·푸시하여 `main` 대상 PR로 제출한다. 병합·배포는 별도 요청 범위다.

## 변경 목적과 결과

실행 코드가 없던 저장소에 React 정적 앱 셸과 strict 타입·통합·브라우저 검증 명령을 추가했다. Header / 작업 공간 / 설정 영역과 키보드 건너뛰기 링크가 있으며, 준비 중인 편집·설정·이미지 출력 기능의 버튼은 노출하지 않는다. 빌드 산출물은 HTML/CSS/JS/favicon뿐이다.

## 작업 범위

- 작업 단위: [Phase 1 작업 1](../plans/phase-1-editor-foundation.md), [실행 계획](../plans/task-1-static-app.md).
- PRD: §9 Phase 1 프로젝트 구성, §6.2 정적 SPA, §6.3 외부 전송 금지, NFR-01·05의 측정 기반.
- React 수명/상태·CodeMirror 편집·키맵·언어·코드 창은 작업 2~6에 남긴다. 코드 입력을 아직 제공하지 않으므로 사용자 HTML/script 입력의 안전성은 후속 입력 테스트에서 검증한다.
- 백엔드·DB·인증·원격 폰트·분석·오류 수집·추가 상태 관리 라이브러리를 도입하지 않았다. 스킬과 `skills-lock.json`은 변경하지 않았다.

## 선택 버전과 근거

공식 npm registry의 `version`, `engines`, `peerDependencies`, `peerDependenciesMeta`를 `npm view`로 조회하고 아래 버전을 `package.json`과 `package-lock.json`에 고정했다. `npm ls --depth=0`은 종료 0이며 누락·충돌 없이 일치했다.

| 패키지 | 버전 | 역할과 호환성 |
|---|---|---|
| `react`, `react-dom` | 19.3.1 | 유일한 runtime 의존성. DOM의 React peer `^19.3.1` 충족 |
| `vite` | 8.3.6 | 개발·정적 번들. Node `^20.19.0 || >=22.12.0` |
| `@vitejs/plugin-react` | 6.2.1 | React 개발 갱신, Vite `^8` peer 충족. Oxc/Babel/React compiler peer는 optional이라 별도 추가하지 않음 |
| `typescript` | 7.0.2 | 별도 `tsc --noEmit`. ESNext/Bundler, `strict`, 명시적 `node`/`vite/client` 타입 사용 |
| `@types/react`, `@types/react-dom` | 19.3.0 | 선택한 React 19의 타입 |
| `@types/node` | 22.20.5 | 검증 호스트 Node 22의 도구 타입 |
| `vitest` | 5.1.0 | 후속 순수 로직과 현재 React 통합 검증. Node `^22.12.0 || ^24.0.0 || >=26.0.0`, Vite 8 지원 |
| `@testing-library/react`, `@testing-library/dom` | 16.3.3 / 10.4.2 | 사용자가 관찰하는 React DOM 셸 검사. React 19 및 DOM 10 peer 충족 |
| `@testing-library/jest-dom` | 7.0.1 | DOM matcher. DOM 10/Vitest peer 및 Node >=22 충족 |
| `jsdom` | 31.0.0 | 통합 테스트 DOM. Node `^22.22.2 || ^24.15.0 || >=26.0.0` |
| `@playwright/test` | 1.65.0 | 실제 브라우저·포커스·네트워크 검증. Node >=20 |

프로젝트 Node 조건은 jsdom을 포함한 전체 개발 도구 조건의 교집합인 `^22.22.2 || ^24.15.0 || >=26.0.0`이다. CodeMirror `@codemirror/view` 6.43.15 / `@codemirror/state` 6.7.6의 metadata도 확인했다(view의 state 의존성 `^6.7.0`, React peer 없음). 현재 셸에는 사용하지 않으므로 설치는 작업 3까지 보류한다.

공식 근거: [React의 Vite 앱 구성](https://react.dev/learn/build-a-react-app-from-scratch), [Vite 시작 및 Node 조건](https://vite.dev/guide/), [Vite와 TypeScript 검사 분리](https://vite.dev/guide/features#typescript), [TypeScript strict](https://www.typescriptlang.org/tsconfig/strict.html), [TypeScript 7 설정 변경](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/), [Vitest](https://vitest.dev/guide/), [Testing Library](https://testing-library.com/docs/react-testing-library/intro/), [jsdom](https://github.com/jsdom/jsdom), [Playwright 서버 관리](https://playwright.dev/docs/test-webserver), [CodeMirror 모듈](https://codemirror.net/docs/migration/). 버전별 세부 제약은 예를 들어 [Vite 8.3.6 registry metadata](https://registry.npmjs.org/vite/8.3.6), [plugin-react metadata](https://registry.npmjs.org/@vitejs/plugin-react/6.2.1), [jsdom 31.0.0 metadata](https://registry.npmjs.org/jsdom/31.0.0)와 대조했다.

## 검증 환경

- Windows x64, Windows NT 10.0.26200, CPU `Intel64 Family 6 Model 189 Stepping 1, GenuineIntel`.
- Node 22.23.2, npm 10.9.8, Python 3.13.7.
- Playwright Chromium 158.0.8127.18 (build 1254), headless.
- 시각 확인: agent-browser 0.27.0 / Chrome for Testing 157.0.8103.38, headless. 데스크톱 1280×900, 모바일 폭 360px.
- 테스트 서버는 모두 `127.0.0.1`에만 바인딩했다. 제한된 실행 환경의 registry/소켓 접근 거부는 승인된 도구 실행으로 해결했다.

## 실제 검증 결과

| 실행 명령 / 확인 | 실제 결과 |
|---|---|
| `npm install --no-audit --no-fund` | 종료 0, 100개 패키지 설치, 앱 잠금 파일 생성 |
| 구현 전 `npm run test -- tests/integration/App.test.tsx` | 종료 1, 아직 없는 `src/app/App` import 실패 확인 |
| `npm run typecheck` | 종료 0. 앱·테스트·Vite/Vitest/Playwright 구성 파일 모두 검사 |
| `npm run test` | 종료 0, 1개 파일 / 통합 smoke 테스트 1건 통과 |
| `npm run build` | 종료 0, 정적 `dist/` 생성 |
| `npx playwright install chromium` | 종료 0, Chromium/Headless Shell 및 실행 보조 자산 설치 |
| `npm run test:browser -- tests/browser/foundation.spec.ts --project=chromium` | 종료 0, production build + preview에서 **6/6 통과**, 43.8초 |
| `PLAYWRIGHT_SERVER_MODE=dev`에서 같은 브라우저 명령 | 종료 0, 개발 서버에서 **6/6 통과**, 38.1초 |
| `npm ls --depth=0` | 종료 0, 선언한 정확 버전과 설치 버전 일치 |
| `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort` | 서버 준비 후 브라우저 진입·셸·콘솔·네트워크 확인. 로컬 HMR/개발 자산만 요청, 콘솔/런타임 오류 없음 |
| `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` | 브라우저 루트 및 정적 JS/CSS/favicon 200, 콘솔/런타임 오류 없음 |
| `python -m http.server 4180 --bind 127.0.0.1 --directory dist` | Vite 런타임 없이 같은 셸 표시. HTML/JS/CSS/favicon 4개 로컬 GET 요청 모두 200, 외부 요청 및 콘솔/런타임 오류 없음 |
| agent-browser snapshot / screenshot | 데스크톱·모바일에서 셸 텍스트·설정 접근·줄바꿈 시각 확인. 생성물은 무시되는 `.artifacts/`에 보관 |
| `git diff --check` | 종료 0 |

브라우저 6개 시나리오: 루트 200·접근성 랜드마크·미제공 기능 버튼 없음, Tab→건너뛰기 링크→Enter로 Main 포커스, 360/768/1280px에서 수평 넘침 없이 설정까지 접근, 200% **CSS zoom**에서 접근 유지. 모든 시나리오에 진입 전부터 외부 HTTP/WebSocket·HTTP 오류·실패 요청·요청 본문/비조회 메서드·콘솔 오류·런타임 오류 관찰을 적용했고 모두 0건이었다. 외부 전송은 route 단계에서 차단하고 실패로 판정한다.

개발 모드 첫 실행은 수동 preview가 포트 4173을 사용 중이어서 종료 1이었다. 해당 서버를 종료한 뒤 위 6/6 결과를 얻었다. 실패를 숨기기 위해 기존 서버를 재사용하도록 바꾸지 않았다. 검사에 사용한 서버와 브라우저는 종료했다.

## PR 제출 전 재검증

후속 PR 제출 요청 시 같은 소스에 대해 `npm run typecheck`, `npm run test`(1/1), `npm run build`, `npm run test:browser -- tests/browser/foundation.spec.ts --project=chromium`(6/6, 43.1초)을 다시 실행했고 모두 종료 0이었다. 원격 `main`을 fetch해 시작 기준과 동일함을 확인했다. 개발 모드 및 정적 HTTP 서버 시각 확인은 위 최초 검증 결과를 사용한다.

## 최초 번들·로딩 기준선

Production 파일의 실제 크기:

| 파일 | bytes | Vite 표시 gzip |
|---|---:|---:|
| `index.html` | 750 | 0.48 kB |
| `assets/index-7jh8khQh.js` | 222,152 | 69.73 kB |
| `assets/index-D5wwbUR9.css` | 3,046 | 1.14 kB |
| `favicon.svg` | 272 | 별도 측정 안 함 |

현재 언어·편집기·출력 청크는 없다. gzip 값은 빌드 보고서의 압축 크기이며 서버 압축 설정을 검증한 값이 아니다.

Python 정적 서버의 production 파일로 첫 탐색 1회를 관찰했다. Chrome 157의 재사용된 브라우저 세션에서 이 origin은 첫 방문이었고, 초기 뷰포트는 360×900이었다. localhost·압축 없음·네트워크/CPU throttling 없음·HTTP 캐시 비활성화 안 함 조건이다. 자산 transferSize가 모두 body 크기보다 커 JS/CSS/favicon의 본문이 실제 전송됐음을 확인했다.

- DOMContentLoaded: **586.5ms**.
- load event: **587.2ms**.
- First Contentful Paint: **628ms**.

이는 작업 1 셸의 단일 로컬 탐색 관찰값이다. 일반 네트워크에서의 NFR-01 2초, 편집 준비/오프라인 준비, 300줄 응답성 및 NFR-04 이미지 생성 성능을 통과했다고 확대하지 않는다. 후속 기능이 추가되면 고정 환경의 반복 측정을 추가한다.

## 위험과 후속 작업

- Firefox/WebKit은 프로젝트만 구성했고 실행하지 않았다. 실제 Edge·Safari·macOS·한글 IME·OS 예약 단축키·브라우저 자체 200% 확대는 미검증이다. CSS zoom 테스트와 실제 브라우저 확대는 다르다.
- 현재 입력·편집·저장·언어·테마·출력 기능이 없으므로 그 요구사항은 검증하지 않았다. PNG/SVG/JPG/WebP는 이번 변경에 해당하지 않는다.
- 실제 Vercel 배포는 수행하지 않았다. `dist/`만으로 실행되는 구조와 일반 정적 HTTP 서버 동작까지 확인했다.
- `npm ci` 명령은 README에 재현용으로 제공하며 이번에는 `npm install`과 lock/설치 트리 일치 확인을 수행했다.
- PRD §8 전체 MVP 및 Phase 1 전체 완료가 아니다. 다음 구현은 작업 1의 PR 병합·로컬 base 갱신 후 별도 브랜치에서 진행한다.

## 제출 전 확인

- [x] 독립적으로 검증 가능한 작업 1만 구현했으며 대상 기준 브랜치는 `main`이다.
- [x] 요구사항·관련 문서와 변경 범위가 일치한다.
- [x] 실제 검증 결과와 미실행 항목을 구분했다.
- [x] 정적·클라이언트 전용 구조와 외부 전송 금지 원칙을 지켰다.
- [x] 다음 구현 작업을 시작하지 않았다.
