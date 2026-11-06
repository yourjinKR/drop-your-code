# Task 1 — Static App and Verification Foundation

> 실행 기준: 사용자가 작업 1 구현과 후속 PR 제출을 요청했다. 기존 Phase 1 계획의 작업 1만 구현하고, 전용 브랜치에 커밋·푸시하여 `main` 대상 PR을 제출한다. 병합·배포는 별도 요청 범위다.

**Goal:** React가 마운트되는 정적 앱 셸과 재현 가능한 타입·빌드·브라우저 검증 명령을 제공한다.

**Architecture:** Vite가 `dist/`에 HTML/CSS/JS만 출력한다. 앱은 서버 상태나 사용자 입력을 소유하지 않고 Header / Main / Settings의 접근 가능한 골격만 제공한다. 편집기·공통 상태·렌더링·출력은 이후 작업에서 연결한다.

**Tech Stack:** React, strict TypeScript, Vite, CSS. Vitest + Testing Library + jsdom은 후속 순수 로직/React 통합 검증, Playwright는 실제 브라우저 검증을 담당한다. 정확한 선택 버전과 공식 근거는 검증 보고서에 기록한다.

**Spec:** [Phase 1 작업 1](phase-1-editor-foundation.md), [PRD §§6.2–6.3·9 / NFR-01·05](../product/PRD.md), [UI 명세](../architecture/design/ui-spec.md), [검증 전략](../architecture/testing/strategy.md).

## 제약과 검토 초점

- 정적·클라이언트 전용. 백엔드·DB·인증·원격 폰트·분석·오류 전송을 도입하지 않는다.
- 사용자 코드와 히스토리를 외부에 전송하지 않는다. 작업 1에는 코드 입력 자체를 제공하지 않는다.
- 제공하지 않는 편집·복사·출력·히스토리·설정 버튼을 표시하지 않는다.
- 앱·테스트·구성 파일 모두 strict 타입 검사에 포함한다.
- 개발 서버가 아닌 production 정적 파일도 루트 URL에서 열린다.
- 좁은 화면과 200% 확대에서 영역이 잘리지 않으며 키보드 건너뛰기 링크로 작업 공간에 진입한다.
- 브라우저 진입부터 외부 요청·실패 응답·런타임 및 콘솔 오류를 관찰한다.

## 파일과 인터페이스

| 파일 | 책임 |
|---|---|
| `package.json`, `package-lock.json`, `.gitignore` | 명령, 재현 가능한 의존성, 생성물 제외 |
| `index.html`, `public/favicon.svg`, `src/main.tsx` | 로컬 자산만 사용하는 문서와 React 마운트 |
| `src/app/App.tsx`, `src/app/app.css` | 이름 있는 Header / Main / Settings 셸; `export function App()` |
| `tsconfig.json`, `vite.config.ts` | 앱·테스트·도구의 strict 검사 및 정적 빌드 |
| `vitest.config.ts`, `tests/setup.ts`, `tests/integration/App.test.tsx` | DOM 환경과 마운트 smoke 검증 |
| `playwright.config.ts`, `tests/browser/foundation.spec.ts` | Chromium/Firefox/WebKit 구분, localhost 검증 |
| `README.md`, `docs/verification/task-1-static-app.md` | 설치·실행·정적 배포 설정, 실제 실행 결과·제한 |

접근성 계약: 서비스 제목 `Drop Your Code`, main 이름 `작업 공간` / id `workspace`, complementary 이름 `설정`, `작업 공간으로 건너뛰기` 링크. 코드 입력·설정 컨트롤은 후속 작업으로 남긴다.

## 구현 및 검증 순서

- [x] 공식 문서·패키지 engine/peer metadata와 현재 Node를 대조하고 정확한 버전을 선택한다. CodeMirror는 호환성만 조사하고 실제 사용이 시작되는 작업 3까지 설치하지 않는다.
- [x] 설정과 테스트를 작성한다. 초기 통합 실행에서 셸 모듈 미구현에 따른 실패를 확인한다.
- [x] 로컬 폰트와 CSS로 정적 셸을 구현한다. 푸른 회색 작업면(`#edf2f5`), 밝은 표면(`#ffffff`), 어두운 텍스트(`#243444`), 보조 텍스트(`#526779`), 파란 강조(`#2c6179`)를 사용한다. 시스템 UI 폰트와 로컬 monospace만 사용하며, 넓은 작업면과 좁은 우측 설정 영역을 구분한다. 코드 창 스타일은 작업 6에 남긴다.
- [x] `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:browser -- tests/browser/foundation.spec.ts --project=chromium`을 실행한다.
- [x] `npm run dev -- --host 127.0.0.1` 및 `npm run preview -- --host 127.0.0.1`에서 브라우저 셸·콘솔·네트워크를 확인한다. 브라우저 테스트는 기본적으로 build 후 preview를 사용하고 개발 서버 모드는 명시적으로 구분한다.
- [x] 같은 `dist/`를 Vite와 무관한 단순 정적 HTTP 서버로 확인한다. 첫 production 번들 크기와 로딩 시간의 환경·캐시 조건을 기록하며 NFR 최종 보장으로 확대하지 않는다.
- [x] 실제 결과를 기록하고 작업 1 체크박스와 관련 문서의 현재 상태를 갱신한다. 작업 2는 시작하지 않는다.

결과와 미검증 항목: [작업 1 검증 보고서](../verification/task-1-static-app.md).
