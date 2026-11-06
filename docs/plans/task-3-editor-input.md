# 작업 3 — CodeMirror 입력과 React 상태 연결 계획

**Goal:** 기본 편집 입력·Undo/Redo·들여쓰기를 제공하고 CodeMirror와 작업 2의 공통 문서를 순환 없이 연결한다.

**Architecture:** App의 reducer가 코드 원본을 소유하고 EditorSurface가 EditorView의 생성·정리를 담당한다. createEditor는 CodeMirror 확장과 변경 listener를 구성하며 외부 입력을 구분하는 annotation으로 callback echo를 억제한다. 커서·선택·IME·Undo는 EditorView에 둔다.

**Tech Stack:** 기존 React·TypeScript strict·Vite·Vitest/Testing Library·Playwright. 공식 registry 확인 후 @codemirror/state6.7.6, view6.43.15, commands6.11.1, language6.13.1을 고정한다.

**Spec:** [Phase 1 작업 3](phase-1-editor-foundation.md), [아키텍처](../architecture/overview.md), [UI 명세](../architecture/design/ui-spec.md), [검증 전략](../architecture/testing/strategy.md).

## 범위·파일·인터페이스

- 시작점: PR #4를 head SHA 확인 후 merge하고 최신 `main` (`8df14ea`)에서 `codex/phase-1-editor-input` 생성.
- `src/editor/createEditor.ts`: `EditorSurfaceProps = { code: string; settings: EditorSettings; onCodeChange: (code: string) => void }`, `EditorCompartments`와 `createEditor(parent, props, compartments): EditorView`를 export한다. React에 의존하지 않는다.
- `EditorCompartments`는 keymap/language/theme/lineNumbers/wrap의 Compartment를 갖는다. 각 slot은 생성 때 한 번 등록하고 같은 EditorView와 재사용한다. 현재는 기본 편집 명령만 적용하며 프리셋 선택·언어·테마/줄 번호/wrap 제어는 작업4/5/6에 남긴다.
- `src/editor/EditorSurface.tsx`: 위 props와 컴포넌트를 export한다. mount에서 view를 생성하고 cleanup에서 destroy한다. callback은 최신 commit의 함수를 사용하고 code/settings echo로 view를 재생성하지 않는다.
- 외부 문서는 `view.state.toText(code)`와 `doc.eq`로 비교한다. 다를 때만 전체 교체 한 transaction을 보내고 selection은 새 길이에 맞춰 clamp한다. 외부 annotation이 있는 변경은 onCodeChange를 호출하지 않는다. 사용자 입력/Undo/Redo만 공통 상태에 전달한다. 임의 외부 문서 교체 후 과거 Undo 정책은 Phase3에서 별도 확정한다.
- 기본 CodeMirror 입력은 CRLF/CR을 LF로 정규화하고 마지막 빈 줄을 유지한다. 외부 props도 같은 정규화 비교를 사용하되 props를 다시 쓰는 callback은 보내지 않는다. 작업2 reducer는 계속 전달받은 문자열을 그대로 보존한다.
- `src/app/App.tsx`: lazy useReducer와 안정적인 입력 callback으로 공통 상태를 연결한다. `Editor` main, `Code editor` textbox, `Skip to editor`, 상태의 실제 Plain Text/행 수, 짧은 `editor-help`를 제공한다. 자동 focus는 하지 않는다.
- `src/app/app.css`, `index.html`, `src/main.tsx`: 실제 입력의 크기·스크롤·기본 읽기 스타일, 영어 lang/metadata/noscript/error를 적용한다. 한국어 준비 안내·빈 Properties·상시 설명은 제거한다. 전체 디자인 시스템/패널/테마 UI는 작업6이다.
- `tests/integration/EditorSurface.test.tsx`: 실제 EditorView의 입력/echo/외부 교체/cleanup/latest callback/StrictMode를 검증한다. jsdom에서 없는 geometry만 제한적으로 보완한다.
- `tests/browser/editor-input.spec.ts`, `tests/fixtures/code/editor-input.txt`: 실제 입력·paste·선택/삭제·Undo/Redo·들여쓰기·탈출·긴 코드·CRLF/Unicode/HTML/URL·외부 요청 없음을 확인한다. 가상화된 DOM만으로 전체 문자열을 판정하지 않는다.
- 기존 App/foundation 테스트는 영어 이름·실제 editor·빈 패널 제거에 맞춰 갱신한다. 의존성 manifest/lock과 관련 상태 문서를 갱신한다.

## Global Constraints

- 정적·클라이언트 전용. 코드·히스토리를 외부로 전송하거나 실행하지 않는다.
- 필요한 CodeMirror core 패키지만 설치한다. wrapper·자동완성·검색·이미지 렌더러·새 UI 라이브러리를 추가하지 않는다.
- IntelliJ/VS Code 프리셋·Language/Theme selector·Preview·Export·History·준비 중 버튼을 미리 노출하지 않는다.
- Tab/Shift+Tab 들여쓰기와 Escape 다음 Tab 탈출을 함께 제공한다. 예약 브라우저 키를 전역 차단하지 않는다.

## Review Focus

| 위험 | 확인할 동작 |
|---|---|
| 부모 echo·callback 변경·StrictMode | 입력당 공통 변경 한 번, 같은 view/selection/history 유지, cleanup 누락 없음 |
| 외부 코드 교체·짧아지는 문서·CRLF 재전달 | 정규화 비교·한 transaction·선택 범위 clamp·callback loop 없음 |
| 300줄·긴 행·끝 개행·Unicode·HTML/script/URL | 전체 문자열 보존, 화면 밖 내용 누락·실행·외부 요청 없음 |
| Tab 들여쓰기·키보드 탈출·일반 복사 | 실제 브라우저에서 편집과 focus 이동, 일반 Ctrl+C는 텍스트 |
| 실제 IME·300줄 입력 지연 | 자동화가 입증한 범위와 실제 OS 미검증을 구분하고 고정 환경 수치를 기록 |

## 실행 순서

- [x] 최소 패키지 설치와 버전/호환성 기록. 테스트를 먼저 작성하고 미구현 실패를 확인한다.
- [x] createEditor/EditorSurface와 App 연결·영어 입력 셸을 구현한다.
- [x] `npm run test -- tests/integration/EditorSurface.test.tsx`, `npm run typecheck`, `npm run test`로 어댑터·기존 상태/셸 회귀를 확인한다.
- [x] `npm run test:browser -- tests/browser/editor-input.spec.ts --project=chromium` 및 foundation Chromium을 실제 브라우저에서 확인한다. 필요하면 환경 제한만 해결하고 제품 검증을 대체하지 않는다.
- [x] `npm run build`, `git diff --check`, 실제 브라우저 시각/keyboard QA, 고정300줄 입력 지연을 확인한다. 실제 한글 IME/다른 OS·브라우저는 수행 여부를 기록한다.
- [x] 관련 문서와 `docs/verification/task-3-editor-input.md`에 실제 결과·제한·번들 비용과 작업3 PR의 제출 내용을 준비한다. PR 생성 결과는 최종 보고에서 확인한다. 새 PR 병합·작업4 구현·배포는 이번 범위가 아니다.

기존 단계별 계획을 구체화한 실행 계획이며 현재 요청에 따라 이 범위의 구현을 진행한다. 없는 실행 스킬 설치나 추가 구현 방식 선택은 선행 조건이 아니다.
