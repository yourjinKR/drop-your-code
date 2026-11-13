# Phase 1 작업 6 — 코드 창과 편집 설정 검증

2026-11-13 · 작업 5 PR #7 병합 커밋 `a995a57`을 기준으로 검증했다. Windows 11 빌드 26200, Intel Core Ultra 7 258V, 메모리 32 GiB, Node 22.23.2, npm 10.9.8, Playwright 1.65.0 환경이다.

| 명령 또는 확인 | 결과 |
|---|---|
| `npm run test -- tests/integration/theme-settings.test.tsx` | 3개 통과. 같은 편집기에서 테마·줄 번호·줄 바꿈을 바꿔도 코드, 선택, Undo가 유지된다. UI 테마 변경은 workspace reducer에 전달되지 않고 SnapshotInput과 구문 테마가 유지된다. |
| `npm run test:browser -- tests/browser/editor-window.spec.ts tests/browser/phase-1.spec.ts --project=chromium --workers=1` | 작업 6 전용 8개 통과. 최종 코드에서 같은 8개를 아래 전체 검사로 다시 확인했다. |
| `npm run typecheck`, `npm run test` | 타입 검사 성공, 단위·통합 88개 통과. |
| `npm run build` | 프로덕션 빌드 성공. Vite의 초기 500 kB 청크 경고가 남는다. |
| `npm run test:browser -- --project=chromium --workers=2` | 52개 통과. 기존 키맵과 14개 언어, 네 가지 테마 조합, 키보드 포커스, 강제 색상, 모션 감소, 320px 줄 바꿈, 200% CSS 확대, HTML 원문과 Undo, 네트워크 요청을 확인했다. |
| Windows Chrome 157 / Edge 157, `agent-browser` | 설치된 브라우저의 로컬 프로덕션 앱에서 Chrome 1440px의 TypeScript·줄 번호와 Edge 360px의 Python·Light 구문·줄 바꿈을 확인했다. 두 배치의 화면을 캡처해 코드 창과 Properties 위치를 확인했다. |

4개 워커와 Chrome·Edge를 함께 실행했을 때 기존 `ctrl_y_matches_active_preset`이 키 입력 전 `page.goto`의 20초 제한으로 실패했다. 별도 브라우저를 종료한 뒤 같은 코드의 2개 워커 전체 재실행에서 해당 검사와 전체 52개가 통과했다. jsdom 통합 검사는 CodeMirror에 전달된 줄 바꿈 설정을 확인하고, 실제 줄 높이와 가로 스크롤은 Chromium에서 확인했다.

## 성능과 번들

로컬 프로덕션 서버와 새 브라우저 페이지에서 JavaScript 구문 강조, 줄 번호와 줄 바꿈을 켜고 한글을 포함한 300줄을 붙여넣었다. 전체 검사에서 페이지 이동 후 편집기가 보인 시점은 381ms였다. 자동화가 붙여넣기를 시작한 뒤 상태 표시줄에 300줄을 확인하기까지 136ms, 마지막 줄에 짧은 주석을 추가한 뒤 두 번째 animation frame까지 11ms였다. 4개 워커로 실행할 때 같은 세 값은 1391ms, 209ms, 9ms였다. 각각 한 번의 관찰이며 도구의 대기 시간과 프레임 예약을 포함한다. 배포망, 다양한 기기, 입력 지연 p95 및 스타일 변경의 정량 목표는 후속 검증이 필요하다.

| Vite 산출물 | 작업 6 | 작업 5 대비 |
|---|---:|---:|
| 초기 JS | 534.63 kB / gzip 171.31 kB | +20.16 kB / +6.94 kB |
| 초기 CSS | 9.92 kB / gzip 2.82 kB | +6.36 kB / +1.57 kB |
| 지연 JS 14개 합계 | 377.71 kB / 개별 gzip 합계 150.30 kB | +0.01 kB / +0.04 kB |

Plain Text 시작 시에는 초기 JS 하나만 요청한다. 새 언어를 선택하면 해당 정적 청크를 요청한다. 초기 코드에는 줄 번호·구문 테마와 현재 화면에 쓰는 Lucide 아이콘이 추가됐다. `lucide-react` 1.72.0의 ISC 및 Feather 파생 아이콘의 MIT 고지를 정적 산출물에 포함했다. [Lucide React](https://lucide.dev/guide/react/)

## 화면과 검증 경계

- Dark/Light 구문 팔레트의 기본 배경 대비 최솟값은 각각 7.26:1, 6.11:1이다. 선택 영역에서 각각 4.80:1, 4.84:1이다. Dark/Light 입력 테두리와 입력 배경은 각각 3.28:1, 3.99:1이다. 영어 접근성 이름, 숨겨진 패널의 탭 순서, 복원 포커스, 브라우저 색상과 모션 설정을 확인했다. [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md)
- 제목은 `untitled`로 고정했다. 창 아이콘은 로컬 Lucide 파일 종류 아이콘을 사용하며 Java, Kotlin, Python 등은 공통 코드 파일 모양을 사용한다. 768px 미만에서는 편집기 진입과 UI 테마 버튼을 상단에 배치한다.
- macOS, Firefox, Safari, 실제 모바일 터치·가상 키보드, 실물 한글 IME는 미검증이다. 출력 픽셀, 실제 이미지 치수 및 파일 포맷 검증은 Phase 2에서 수행한다.
