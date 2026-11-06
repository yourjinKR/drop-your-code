# UI/UX Design System 명세 검증

작성일: 2026-11-07 · 대상: `codex/ui-ux-design-system` 문서 작업

기준 commit: `1838743b4dc58e5d8e01ccf0bf8e9d4c20832033` (`main`, PR #1·#2 병합 후). `git fetch origin main` 후 `git rev-list --left-right --count HEAD...origin/main`은 커밋 전 `0 0`이었다. 제출 방식은 `main` 대상 리뷰 PR이며 병합·배포는 범위에 포함하지 않는다.

## 검증 대상과 범위

| 문서 | 확인한 내용 |
|---|---|
| [디자인 시스템](../architecture/design/design-system.md) | Neutral Dark/Light semantic palette, typography, spacing, surface, control state, Lucide, motion, 상태 경계 |
| [와이어프레임](../architecture/design/wireframes.md) | Desktop/Tablet/Mobile, 패널 접기·복원, Editor/Preview, focus, canvas/zoom/출력 치수 |
| [UI 명세](../architecture/design/ui-spec.md) | 기존 요구 통합, 영어 UI 이행 목록, 기능 노출 시점, 기존 명세와 차이 |
| [Phase 1 계획](../plans/phase-1-editor-foundation.md) | 작업2~6 기능·인터페이스·기존 검증 명령과 기본값 보존, 적용 시점 |
| [AGENTS.md](../../AGENTS.md) | UI 규칙·문서 참조, 기존 개인정보·정적 구조·Git 규칙 유지 |
| [테스트 전략](../architecture/testing/strategy.md) | FR-STYLE-04의 참조 이미지 부재 문구만 최신 명세 기준으로 갱신 |
| [이번 작업 계획](../plans/ui-ux-design-system.md) | 문서 범위·검토 초점·완료 기준 |

React/TS/CSS·테스트·package manifest/lock·PRD는 수정하지 않았다. Editor, renderer, export, local storage 기능은 구현하지 않았다.

## 실행한 확인

| 명령 / 수동 확인 | 실제 결과 |
|---|---|
| `git diff --check` | 종료0, whitespace 오류 없음 |
| `git diff --exit-code -- src package.json package-lock.json index.html docs/product/PRD.md` | 종료0, 변경 없음 |
| `git diff -- docs/plans/phase-1-editor-foundation.md` 및 원본 대조 | 작업2~6의 기존 타입·함수·파일 책임·기능과 각 npm 완료 명령 유지. 작업6에 디자인 적용·교차 테마·접기 검증 추가 |
| `rg -n 'src/ui/\|참조 이미지.*없\|현재 설치되지\|다음 구현.*작업 1\|준비 중\|themeId\|320px\|44px' docs/architecture/design docs/plans/phase-1-editor-foundation.md` | 제안 파일 경로·초기값·영어 이행·미구현 안내 금지·반응형 규칙 대조. 과거 상태와 변경 대상을 설명하는 문장은 남김 |
| Python stdin 문서 감사: relative Markdown link·fence·변경 경로·원본 작업2~6 npm 명령 대조 | 종료0, 문서8개·relative link54개·fence·UTF-8·문서 전용 범위 확인. 기존 npm 명령18회, 작업2~6 파일/입출력/완료 조건과 상태 계약·기본값 보존. 오류0개. 외부 HTTP 링크의 가용성 전체 검사는 아님 |
| Python stdin sRGB 상대휘도 대비 계산 | Dark/Light 지정 조합62개 통과. 텍스트 최소4.87:1, 비텍스트 최소3.28:1. 아래 범위 참고 |
| Desktop·출력 예시 산술 | `1600−56−224−300=1020`, `1000−56−28=916`, `792+96=888`, `400+96=496`, 2×는1776×992 확인 |
| 제공 PNG 시각 검토, SVG root 확인, design-reference.md 읽기 | SVG 논리1600×1000, PNG2×. 예시 Java/IntelliJ/line numbers on/16px를 제품 기본값과 구분 |
| `agent-browser skills get core`, CodeSnap `/editor` 열기·snapshot·screenshot 확인 | 작업면·도구/레이어·출력 접근의 배치를 실제 화면에서 확인. 사용자 코드 입력·로그인·외부 메시지 전송 없음 |
| `npm run dev -- --host 127.0.0.1 --port 4173 --strictPort` | 최초 Vite ready 확인. 추가 실행은 port in use로 종료1 |
| `agent-browser --session design-current open http://127.0.0.1:4173/` 및 localhost 재시도 | timeout으로 로컬 앱 브라우저 시각 확인 불가. 소켓 접근 검사도 제한/timeout. 현재 셸은 소스로 확인했으며 브라우저 검증 통과로 기록하지 않음 |

Python 문서 감사는 PowerShell의 단일 인용 here-string을 `python -`에 전달해 실행했다. 표의 토큰을 읽어 sRGB 성분을 선형화하고 상대휘도 `(Lmax+0.05)/(Lmin+0.05)`를 계산했다. 앱의 테스트나 구현 파일은 추가하지 않았다.

대비62개는 두 모드에서 다음 조합을 계산한 수다: text/secondary/danger/warning/success × canvas/surface/raised/selected(40개), text × hover/pressed(4개), on-accent × accent/hover/pressed(6개), focus/control-border × canvas/surface/raised(12개). pressed 배경에는 secondary를 쓰지 않도록 명세했다. 구조용 경계·disabled·scrim은 이 통과 수에 포함하지 않는다. 28px Status Bar에는24px target+inset focus, 터치에는44px 확장을 명시해 기본32px 컨트롤과의 충돌을 해소했다.

| Primary 텍스트 대비 | Rest | Hover | Pressed |
|---|---|---|---|
| Dark | 5.41:1 | 6.78:1 | 4.87:1 |
| Light | 6.24:1 | 7.79:1 | 9.65:1 |

초안 검토에서 Dark primary pressed4.33:1을 발견해 `#5E85D2`로 수정한 뒤 재계산했다. UI Primitive 제안 경로도 `src/app/tokens.css`, `src/components/ui/`로 통일했다. Tooltip hover/focus 유지·hover 가능·Escape 닫기, 패널/모달 focus·breakpoint 전환·저장 성공 조건을 명시했다.

## 요구사항 대조

- [x] Minimal Developer Workspace, neutral Dark-first + Light, English-only 앱 문구, Lucide UI 아이콘을 명세했다.
- [x] Toolbar / Activity / Context / Main / Properties / Status의 책임, 치수, collapse와 restore를 정의했다.
- [x] UI theme와 Syntax theme, editor interaction과 snapshot/export, feature state와 layout preference를 분리했다.
- [x] semantic colors·type·spacing·border/radius·surface·control/icon/state·responsive·motion을 정의했다.
- [x] Desktop/Tablet/Mobile, 320px·200%·touch44px·focus·single-modal 동선을 정의했다.
- [x] Phase1 기본값과 작업2~6 기능·검증 명령을 보존하고 작업별 디자인 적용을 연결했다.
- [x] Preview/Export는 Phase2, History/Shortcuts/scale UI/정식 responsive는 Phase3에 노출하며 준비 중 버튼·가짜 성공을 금지했다.
- [x] PNG/SVG/JPG/WebP·PNG 복사·외부 투명/창 불투명·전체 코드 출력과 키맵/개인정보 요구를 유지했다.
- [x] 현재 한국어 셸·문서 lang/metadata·큰 제목/안내 제거 대상을 명시하고 실제 앱 변경과 구분했다.

## 미실행과 남은 한계

- `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:browser`는 이번 문서 전용 변경에서 실행하지 않았다. 해당 결과를 통과로 주장하지 않는다.
- 새 디자인의 실제 Desktop/Tablet/Mobile 렌더링, 200% 확대, forced colors, touch·가상 키보드, 키보드/스크린리더, UI/Syntax 네 조합은 미구현·미검증이다. 토큰 대비 계산은 실제 접근성 준수 판정을 대체하지 않는다.
- 폰트 fallback·측정·SVG 독립 뷰어, Preview/출력 일치, 네 포맷·1×–4×·alpha·shadow·JPG 합성·clipboard는 Phase2 이후 검증한다. 시스템 font는 환경 간 동일 출력을 아직 보장하지 않는다.
- 최소320/최대960px는 기존 실험값이다. 최대 너비를 넘는 nowrap 행을 누락 없이 출력하는 세부 정책과 그림자 경계·크기 상한은 Phase2 실험으로 확정한다.
- 첨부 Desktop을 바탕으로 한 Tablet/Mobile은 이번에 제안한 규칙이며 사용자 디자인 리뷰가 필요하다. 실제 UI 적용은 승인과 별도 구현 요청 이후다.

외부 참고는 [CodeSnap editor](https://codesnap.dev/editor)와 [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)를2026-11-07에 확인했다. CodeSnap은 배치 관계만 참고하고 문구·자산·기능은 복제하지 않았다. 모든 문서의 완료 표시는 디자인 명세 작업에만 해당하며 MVP나 편집기 구현 완료를 의미하지 않는다.
