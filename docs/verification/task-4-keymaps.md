# 작업 4 — IDE 키맵·포커스 검증 결과

검증일: 2026-11-07 (Asia/Seoul). 브랜치: `codex/phase-1-keymaps`. 기준: PR #5 병합 commit `893952b27c51ce8b34de9a150bf8f34e27ba48cd`.

## 병합과 범위

사용자 요청에 따라 PR #5의 head `575bd60`·mergeable·리뷰 스레드를 확인했다. 등록된 CI status/workflow run과 리뷰 스레드는 없었다. 기존 테스트28개와 typecheck를 재실행하고 expected head SHA를 지정해 PR #5를 merge했다. 원격 main을 fetch하고 로컬 main을 fast-forward한 뒤 작업 4 브랜치를 생성했다.

[Phase 1 작업 4](../plans/phase-1-editor-foundation.md)와 [실행 계획](../plans/task-4-keymaps.md)에 따라 주요 키맵·포커스·전환·최소 안내만 추가했다. 새 의존성, PRD·순수 상태 계약 변경, 저장·언어·Theme·Preview·출력은 없다. 새 PR은 제출만 하며 병합·작업5 구현·배포는 범위 밖이다.

## 구현한 동작

- `buildKeymap(preset, platform)`은 Windows PRD 목표와 명시적인 macOS 조합을 구성한다. `other`는 Windows 목표 fallback이며 Linux IDE 완전 호환이 아니다.
- preset binding과 기본 탐색 명령 모두 editor focus·composition 상태를 확인한다. 처리하지 않은 키를 `preventDefault: true`로 일괄 차단하지 않는다. 공통 historyKeymap은 제거해 IntelliJ Ctrl+Y가 Redo로 fall through하지 않게 했다.
- App의 native `Keymap` select는 기존 reducer를 바꾼다. 같은 EditorView의 keymap Compartment만 교체하고 코드/revision·선택·Undo를 유지한다. 이미 적용한 preset은 재구성하지 않는다. 자동 focus·로컬 저장은 없다.
- native Copy/Cut과 Escape 다음 Tab을 유지한다. 무선택 Cut은 현재 줄을 제거하고 줄 텍스트와 native linewise 정보를 clipboard에 쓴다. Clipboard 텍스트에 newline을 강제로 추가하지 않는다.
- 줄 삭제·잘라내기·이동·복제·들여쓰기/내어쓰기는 `isolateHistory('full')`로 인접 타이핑과 분리한다. 빠른 입력 뒤 줄 삭제/내어쓰기를 Undo해도 입력 원문이 복원된다. 일반 타이핑·IME·설정 전환·외부 문서 복원 정책은 변경하지 않는다.
- 현재 Plain Text 주석은 token이 없어 no-op이다. 통합 테스트에서만 comment token을 주입해 실제 명령을 검증했다. 언어 선택/강조·주석의 실제 언어 통합과 이력 경계는 작업5 범위다.
- header의 selector와 현재 플랫폼·프리셋 차이/브라우저 우선순위 안내는 영어다. 단축키 전체 안내 화면은 Phase3에 남긴다.

## 공식 macOS 대응표

2026-11-07에 [JetBrains macOS reference](https://www.jetbrains.com/help/idea/reference-keymap-mac-default.html), [VS Code 기본표](https://code.visualstudio.com/docs/reference/default-keybindings), [공식 macOS JSON](https://raw.githubusercontent.com/microsoft/vscode-docs/main/build/keybindings/doc.keybindings.osx.json)을 확인했다. Windows는 최신 IDE 차이와 별도로 PRD 목표를 유지했다.

| 명령 | IntelliJ macOS | VS Code macOS |
|---|---|---|
| Undo / Redo | Cmd+Z / Cmd+Shift+Z | 동일 |
| Duplicate line | Cmd+D | Shift+Option+Down |
| Delete line | Cmd+Backspace | Cmd+Shift+K |
| Move line | Shift+Option+Up/Down | Option+Up/Down |
| Line comment | Cmd+/ | 동일 |
| Indent / Outdent | Tab / Shift+Tab | 동일 |
| Native Cut / Copy | Cmd+X / Cmd+C | 동일 |

macOS 명령은 Windows 호스트의 실제 EditorView에 Meta event를 전달해 매핑/동작을 확인했다. 실제 macOS나 OS가 선점하는 키까지 검증한 것이 아니다.

## 환경과 실행 결과

Windows `10.0.26200`, Node `v22.23.2`, npm `10.9.8`, 기존 CodeMirror state6.7.6/view6.43.15/commands6.11.1/language6.13.1, Playwright Chromium. 브라우저는 localhost production 빌드를 사용했다.

| 명령 / 확인 | 실제 결과 |
|---|---|
| `npm run test -- tests/integration/keymaps.test.tsx` 구현 전 | 종료1, keymaps 모듈 부재 확인 후 구현 |
| 같은 명령 최종 | 종료0,36개 통과. 명령·전환·focus·composition·Undo 경계 포함 |
| `npm run test` | 종료0, workspace19 + EditorSurface7 + App3 + keymaps36 =65개/4파일 통과 |
| `npm run typecheck` | 종료0, strict 타입 검사 통과 |
| `npm run test:browser -- tests/browser/keymaps.spec.ts --project=chromium` | 최종 종료0,14개 통과 |
| `npm run test:browser -- --project=chromium` | 최종 종료0, keymaps14 + 기존 입력6/foundation6 =26개 통과,11.0초 |
| `npm run build` | 종료0, 정적 산출물 생성 |
| `git diff --check` | 종료0, whitespace 오류 없음 |
| Python stdin 문서·범위 감사 | 종료0. 변경17파일·relative 링크73개·UTF-8/fence·영어 product copy 확인, 작업5~6 본문 유지, 오류0개 |
| `git diff --exit-code -- package.json package-lock.json docs/product/PRD.md src/state/workspace.ts tests/unit/workspace.test.ts index.html src/main.tsx` | 종료0. 의존성·PRD·순수 상태·초기 HTML/마운트 변경 없음 |
| 독립 API/소스 리뷰 | 공식 대응표·설치 API·focus/IME·fallback·Compartment를 대조. 내어쓰기 userEvent 누락 지적을 반영해 회귀 테스트로 확인 |
| `agent-browser` UI QA | IntelliJ 선택·기본 입력·360px selector/안내/행 수를 시각 확인. 빠른 입력/삭제 Undo 이슈를 발견해 아래와 같이 수정 |

### 실패 원인과 수정 검증

1. 초기 통합 검사의 Shift 문자 event에 keyCode가0이었다. 실제 문자/물리 keyCode와 Range geometry가 없는 jsdom을 구분해 키 helper·테스트 파일 내 최소 geometry만 보완했다. 종료 뒤 원래 descriptor를 복원한다. 명령이나 EditorView를 mock하지 않았다.
2. 초기 browser history 검사는 paste와 바로 다음 입력이 항상 별도 Undo 그룹이라고 가정했다. 명확한 단일 paste 이력으로 전환 보존 테스트를 구성했다. 시간 대기나 강제 history isolation을 테스트에 넣어 제품 실패를 숨기지 않았다.
3. 실제 QA에서 빠른 입력과 `delete.line`이 기본 history에 합쳐지는 문제를 재현했다. 고정 시각의 실제 EditorSurface 검사에서 두 프리셋 모두 Undo 결과가 빈 문자열로 실패하는 것을 확인한 뒤 transactionExtender와 isolateHistory를 적용했다. 리뷰에서 확인한 `delete.dedent`도 두 실패 회귀를 먼저 추가한 뒤 포함했다. 최종 단위/브라우저 회귀가 통과했다.
4. Shift+문자의 실제 key는 대문자다. browser Redo 검사는 IntelliJ `Control+Shift+Z`를 사용한다. 소문자 event를 잘못 만든 자동화와 실제 keymap 동작을 구분했다.

## 확인한 경계

- Ctrl+Y의 프리셋별 차이와 전환 뒤 이전 Ctrl+D binding 제거.
- Undo/Redo·줄 복제·삭제·위/아래 이동·Tab/Shift+Tab, 다중 줄·마지막 줄과 Undo 복원.
- selector 및 일반 text input focus에서 편집 명령이 실행되거나 기본 동작이 차단되지 않음. 일반 필드는 테스트에서만 삽입하며 제품에 준비 중 필드를 추가하지 않았다.
- compositionstart 상태의 편집 명령 no-op. 이 합성 검사는 실제 OS IME 검증을 대체하지 않음.
- 실제 Clipboard API와 Ctrl+X/C에서 줄 잘라내기·텍스트 복사, Undo 복원. Chromium 권한을 자동 승인한 보안 컨텍스트 조건이다.
- 키맵 전환은 같은 DOM/view·선택·Undo를 유지하며 작업2 reducer 검증에서 설정 변경의 revision 보존도 유지한다.
- 기존300줄·CRLF·Unicode·script/URL·긴 행·360/768/1280px·200% CSS zoom과 외부 HTTP/WebSocket·데이터 요청/runtime 오류 없음 회귀.

## 번들과 남은 제한

Vite 표시 기준 HTML0.68kB, CSS2.72kB(gzip1.05), JS484.99kB(gzip154.50)다. 작업3 JS480.10kB(gzip152.98) 대비 약4.89kB(gzip1.52) 증가했다. 새 패키지는 없다. 초기 로딩·전체 NFR 완료를 이 수치로 주장하지 않는다.

- 실제 macOS, 실제 Edge/Firefox/Safari, 물리 키보드의 OS/브라우저 선점, 한글 IME의 실제 조합·키보드 배열별 `/`는 미검증이다. 실제 환경 검증과 대체 동선은 Phase4 지원 판정 전에 필요하다.
- `Browser and system shortcuts may take priority.`로 선점 가능성을 알린다. 이미 전달된 키의 동작만 처리하며 OS가 전달하지 않은 조합을 강제로 가로채지 않는다.
- preset 저장·전체 Shortcuts·자동 감지·실제 언어/Theme 선택·이미지 출력·배포는 미구현이다. 이번 작업은 주요 편집 프리셋이며 전체 IDE 기능/전체 MVP 완료가 아니다.
- 일반 타이핑 history의 기본 묶음과 임의 외부 문서 복원의 Undo 정책은 유지했다. 주석 명령의 실제 언어별 이력은 작업5에서 확인한다.
- UI 스크린샷은 로컬 ignored `.artifacts/task-4/`에 있다. 최종 구현의 history 수정은 회귀 테스트로 검증했고 기존 QA 이미지 자체를 제품 완료 기준으로 사용하지 않는다.
