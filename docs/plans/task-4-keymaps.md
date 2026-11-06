# 작업 4 — IntelliJ / VS Code 키맵과 포커스 계획

**Goal:** 선택한 IDE 프리셋의 주요 편집 명령을 editor focus 안에서 처리하고 전환 시 코드·선택·Undo를 유지한다.

**Architecture:** 순수 `buildKeymap`이 기존 CodeMirror 명령을 감싼 binding을 반환한다. EditorSurface는 생성한 keymap Compartment를 보관하고 preset 변경 때 해당 slot만 reconfigure한다. App의 native Keymap select는 기존 reducer를 갱신하며 저장하지 않는다.

**Tech Stack:** 기존 React·TypeScript strict·CodeMirror state/view/commands/language·Vitest·Playwright. 새 의존성 없음.

**Spec:** [Phase 1 작업 4](phase-1-editor-foundation.md), [PRD FR-EDIT-02](../product/PRD.md), [아키텍처](../architecture/overview.md), [UI 명세](../architecture/design/ui-spec.md), [검증 전략](../architecture/testing/strategy.md).

## 시작 기준과 범위

- 사용자 요청에 따라 PR #5의 예상 head `575bd60`과 mergeable/검증 상태를 확인하고 merge했다. 기준 main은 `893952b`, 브랜치는 `codex/phase-1-keymaps`다.
- 기본9개 명령과 선택·포커스·IME 경계만 구현한다. 언어 선택/강조는 작업5, 전체 셸/Theme/Properties는 작업6, 저장/전체 Shortcuts는 Phase3다.
- Windows는 PRD의 목표 조합을 유지한다. macOS는 공식 기본표를 별도로 확인했다. `other`는 Windows 목표의 제품 fallback이며 Linux IDE 전체 일치를 주장하지 않는다.

## 파일·인터페이스

| 파일 | 책임 |
|---|---|
| `src/editor/keymaps.ts` | `EditorPlatform = 'windows' \| 'macos' \| 'other'`, `detectPlatform(): EditorPlatform`, `buildKeymap(preset: KeymapPreset, platform: EditorPlatform): readonly KeyBinding[]`; 공식 대응표와 출처 |
| `src/editor/createEditor.ts` | 초기 preset binding+standard navigation. history()는 유지하고 충돌하는 공통 historyKeymap은 제거해 이전 프리셋 명령이 fallback으로 남지 않게 함 |
| `src/editor/EditorSurface.tsx` | keymap Compartment 보관·기존 view에서 reconfigure. code sync와 별개이며 선택/Undo/코드 revision을 바꾸지 않음 |
| `src/app/App.tsx`, `app.css` | Editor header의 native `Keymap` select, VS Code/IntelliJ, 현재 차이·focus/브라우저 우선순위의 짧은 영문 안내. 자동 editor focus·저장 없음 |
| `tests/integration/keymaps.test.tsx` | 실제 EditorView의 명령·전환·이전 binding 제거·focus/IME·mac 대응표. comment token은 테스트에서만 주입 |
| `tests/browser/keymaps.spec.ts` | 실제 Windows Chromium 키 입력·clipboard·전환·일반 입력 경계·Tab 탈출 |
| `tests/integration/App.test.tsx` | selector의 reducer 연결과 기존 view/선택/문서 유지 |
| 관련 아키텍처/UI/단계별 계획·`docs/verification/task-4-keymaps.md` | 현재 구현·실제 결과·미검증 한계 갱신 |

## 명령 계약

| 명령 | Windows IntelliJ | Windows VS Code | macOS IntelliJ | macOS VS Code |
|---|---|---|---|---|
| Undo | Ctrl+Z | Ctrl+Z | Cmd+Z | Cmd+Z |
| Redo | Ctrl+Shift+Z | Ctrl+Y | Cmd+Shift+Z | Cmd+Shift+Z |
| Duplicate line | Ctrl+D | Shift+Alt+Down | Cmd+D | Shift+Option+Down |
| Delete line | Ctrl+Y | Ctrl+Shift+K | Cmd+Backspace | Cmd+Shift+K |
| Move line up/down | Shift+Alt+Up/Down | Alt+Up/Down | Shift+Option+Up/Down | Option+Up/Down |
| Toggle line comment | Ctrl+/ | Ctrl+/ | Cmd+/ | Cmd+/ |
| Indent/outdent | Tab / Shift+Tab | Tab / Shift+Tab | Tab / Shift+Tab | Tab / Shift+Tab |
| Cut without selection | Ctrl+X | Ctrl+X | Cmd+X | Cmd+X |

Indent/outdent를 별도 행으로 세면 PRD의9개 명령에 해당한다. 명령은 CodeMirror undo/redo/copyLineDown/deleteLine/moveLineUp/moveLineDown/toggleLineComment/indentMore/indentLess를 사용한다. Plain Text는 comment token이 없으므로 comment가 no-op이며 언어 지원 완료로 표현하지 않는다.

Cut/Copy는 keydown을 가로채지 않고 CodeMirror의 native clipboard event 경로를 유지한다. no-selection cut은 현재 줄을 지우고 줄 텍스트를 clipboard에 쓰며 native linewise metadata를 유지한다. Clipboard 출력에 줄바꿈이 강제로 추가된다고 가정하지 않는다.

명령 wrapper는 `view.hasFocus`와 `view.compositionStarted`/`view.composing`를 확인한다. 처리할 수 없는 명령은 false이며 무조건적인 `preventDefault: true`를 설정하지 않는다. Escape는 바인딩하지 않아 기존 Escape 다음 Tab 경로를 보존한다. 전역 document/window 키 listener는 추가하지 않는다.

QA에서 발견한 빠른 입력/줄 삭제·내어쓰기의 history 병합은 실패 회귀를 먼저 추가해 확인했다. 줄 삭제·잘라내기·이동·복제·들여쓰기/내어쓰기의 해당 userEvent만 transactionExtender에서 `isolateHistory('full')`로 분리한다. 타이핑·설정/선택 전환·외부 교체 정책과 언어 주석 이력은 별개다.

## 공식 macOS 기준

- [IntelliJ macOS reference](https://www.jetbrains.com/help/idea/reference-keymap-mac-default.html): Move Line은 Shift+Option 화살표이며 Move Statement와 구분한다.
- [VS Code 기본표](https://code.visualstudio.com/docs/reference/default-keybindings), [macOS PDF](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf), [공식 macOS binding JSON](https://raw.githubusercontent.com/microsoft/vscode-docs/main/build/keybindings/doc.keybindings.osx.json): Undo/Redo·line commands·Tab을 대조한다.
- 실제 OS/브라우저가 선점한 조합은 강제로 가로챌 수 있다고 약속하지 않는다. 짧은 UI 안내와 다음 검증 단계에 한계를 기록한다.

## Review Focus

| 위험 | 검증 |
|---|---|
| Ctrl+Y 의미·이전 binding fallback | 두 프리셋 결과, 전환 후 기존 조합 미잔존 |
| 선택/Undo 손실 | 같은 EditorView·선택·문서·Undo 유지, preset 변경에 code revision 증가 없음 |
| selector·일반 text input focus | 편집 명령 무개입·default event 차단 없음 |
| IME 시작/조합 중 키 | compositionstart 상태에서 편집 명령 no-op. 합성 검사와 실제 OS IME는 구분 |
| 다중 줄·마지막 줄·경계·native clipboard | 줄 복제/삭제/이동·되돌리기·무선택 cut·일반 Ctrl+C·Tab 탈출 |

## 실행 순서

- [x] 공식 대응표를 확인하고 실제 EditorView 테스트를 먼저 작성해 미구현 실패를 확인한다.
- [x] binding/초기 구성/Compartment 재구성·selector·짧은 영문 안내를 구현한다.
- [x] `npm run test -- tests/integration/keymaps.test.tsx`, `npm run typecheck`, `npm run test`를 실행한다.
- [x] `npm run test:browser -- tests/browser/keymaps.spec.ts --project=chromium`, 전체 Chromium 회귀·실제 UI QA를 실행한다. 새 selector로 생긴 focus 순서만 필요한 기존 테스트에서 갱신한다.
- [x] `npm run build`, `git diff --check`, 문서/범위 감사를 확인하고 실제 결과·OS/브라우저/IME 한계를 기록한다.
- [x] 작업4만 PR 제출할 내용을 준비하고 생성 결과를 최종 보고한다. 새 PR 병합·작업5 구현·배포는 이번 범위가 아니다.

기존 단계별 계획을 구체화한 실행 계획이며 현재 요청에 따라 이 범위에서 구현한다. 존재하지 않는 실행 스킬 설치나 추가 방식 선택을 선행 조건으로 삼지 않는다.
