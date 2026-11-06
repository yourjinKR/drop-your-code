# 작업 3 — CodeMirror 입력·React 연결 검증 결과

검증일: 2026-11-07 (Asia/Seoul). 브랜치: `codex/phase-1-editor-input`. 기준: PR #4 병합 commit `8df14eaec2fccd44072f31039c2697e75b15cbe5`.

## 병합·작업 경계

사용자의 병합 후 다음 작업 요청에 따라 PR #4의 head `a6564a8`·mergeable·리뷰 스레드를 확인했다. 등록된 CI status/workflow run과 리뷰 스레드는 없었다. 테스트20개와 typecheck를 재실행한 뒤 expected head SHA를 지정해 PR #4를 merge했다. 원격 main을 fetch하고 로컬 main을 fast-forward한 다음 작업 3 브랜치를 생성했다.

이번에는 [Phase 1 작업 3](../plans/phase-1-editor-foundation.md)·[실행 계획](../plans/task-3-editor-input.md)의 입력 어댑터와 공통 상태 연결만 구현했다. 새 PR 병합·작업 4 구현·배포는 진행하지 않는다.

## 구현한 계약

- `createEditor.ts`: 실제 CodeMirror core, history, standard keymap, 두 칸 들여쓰기, Tab/Shift+Tab, 입력 listener. 일반 Ctrl+C는 텍스트 복사다.
- `EditorSurface.tsx`: 생성/정리 수명, 최신 committed callback, 같은 view와 다섯 Compartment 유지. 부모 echo에서는 transaction 없이 문서·선택·Undo를 유지한다.
- 외부 코드가 정규화 비교에서 다를 때 전체 교체 한 transaction과 annotation을 사용한다. selection을 새 길이에 맞추고 callback echo를 억제한다. 현재 외부 교체는 기본 history에 들어가며 인접 편집과 묶일 수 있다. Phase 3의 복원 Undo 정책 확정을 뜻하지 않는다.
- CodeMirror 입력은 CRLF/CR을 LF로 정규화하고 마지막 빈 줄·탭·공백·Unicode를 유지한다. 외부 props는 같은 정규화로 비교하며 props를 다시 쓰는 callback은 보내지 않는다. 순수 reducer는 여전히 받은 문자열을 그대로 보존한다.
- App은 lazy reducer와 안정적인 callback으로 연결한다. 실제 행 수, 영어 Editor/skip/help/metadata/noscript/error를 제공하고 준비 안내·큰 작업면 제목·빈 Properties를 제거했다. 초기 Light outer shell과 고정 Dark 입력 면이며 전체 디자인·테마 UI는 작업 6이다.
- keymap/language/theme/lineNumbers/wrap slot은 등록했지만 현재는 기본 keymap만 동작한다. IDE 프리셋·언어 선택/강조·테마/줄 번호/wrap 조절·코드 창·Preview/출력/저장은 후속 범위다.

## 의존성과 근거

공식 registry의 `npm view <package> name version engines dependencies --json`을 각각 실행하고 다음 버전을 `--save-exact`로 설치했다. `npm ls --depth=0` 종료0, 설치 시 audit 취약점0개였다. wrapper·검색·자동완성·언어 문법 패키지는 추가하지 않았다.

| 패키지 | 선택 버전 | 역할 |
|---|---|---|
| [@codemirror/state](https://registry.npmjs.org/@codemirror/state/6.7.6) | 6.7.6 | 문서·selection·transaction·annotation·Compartment |
| [@codemirror/view](https://registry.npmjs.org/@codemirror/view/6.43.15) | 6.43.15 | 실제 contenteditable·DOM 입력·스크롤 |
| [@codemirror/commands](https://registry.npmjs.org/@codemirror/commands/6.11.1) | 6.11.1 | history·Undo/Redo·기본 편집·들여쓰기 |
| [@codemirror/language](https://registry.npmjs.org/@codemirror/language/6.13.1) | 6.13.1 | indentUnit. commands의 의존성이기도 하지만 직접 import하므로 명시 |

설치된 `.d.ts`/`dist` 소스로 `toText`, `doc.eq`, annotation, selection 범위, Escape-then-Tab, keymap을 확인했다. codemirror.net 문서 접근은403이어서 열지 못했으며 설치 버전 소스와 공식 저장소를 기준으로 검토했다. 기본 keymap의 Escape selection 명령이 탈출을 가로채지 않도록 `standardKeymap`을 사용한다. IDE 프리셋 완성품으로 간주하지 않는다.

## 실행한 검증

Windows `10.0.26200`, Node `v22.23.2`, npm `10.9.8`. Chromium production 테스트는 Playwright가 localhost 서버를 시작/종료한다.

| 명령 / 수동 확인 | 실제 결과 |
|---|---|
| `npm run test -- tests/integration/EditorSurface.test.tsx` 구현 전 | 종료1. 모듈 부재를 확인한 뒤 구현 |
| 같은 명령 구현 후 | 종료0, 실제 EditorView 통합7개 통과. geometry polyfill/편집기 mock 없음 |
| `npm run test -- tests/integration/App.test.tsx` | 종료0, App 연결2개 통과 |
| `npm run test` | 종료0, workspace19 + EditorSurface7 + App2 =28개/3파일 통과 |
| `npm run typecheck` | 종료0. 새 Clipboard/브라우저 테스트를 포함한 최종 strict 검사 통과 |
| `npm run test:browser -- --project=chromium` | 최종 종료0, 입력6 + foundation6 =12개 통과,9.8초. 초기11개 검사도 통과했으며 실제 clipboard 경로를 추가해 재실행 |
| `npm run test:browser -- tests/browser/editor-input.spec.ts --project=chromium` | 최종 종료0,6개 통과,7.6초. 추가 검사 첫 실행의 수동 preview 포트 충돌은 서버 정리로 해결했고 reuseExistingServer로 우회하지 않음 |
| `npm run build` | 종료0. 정적 HTML/CSS/JS 산출물 생성 |
| `npm ls --depth=0` | 종료0, 선택 버전·의존성 일치 |
| `git diff --check` | 종료0, whitespace 오류 없음 |
| Python stdin 문서/범위 감사 | 종료0. 변경21파일·relative 문서 링크67개·UTF-8/fence·영어 product copy 확인, 작업4~6 본문 유지, 오류0개 |
| 독립 코드 리뷰 | 설치 버전 API·동기화·수명·선택·기본 키보드·영어 셸·단계별 범위를 대조. 수정이 필요한 사항 없음 |
| `agent-browser` production UI QA | 실제 키 입력과360px 화면의 Editor/help/행 수를 시각 확인. 자동 focus·빈 Properties·가짜 기능 없음 |

### 브라우저에서 확인한 동작

- 빈 입력·텍스트 선택/교체/삭제, Ctrl+Z와 Windows Ctrl+Y, 기본 Enter 들여쓰기, Tab/Shift+Tab, 선택이 있는 상태의 Escape 다음 Tab 탈출.
- 실제 브라우저 Clipboard API에 테스트 텍스트를 쓰고 Ctrl+V로 붙여넣기, Ctrl+A/C 후 텍스트 재읽기. 보안 컨텍스트 localhost와 자동 승인한 Chromium clipboard 권한 조건이다.
- 별도 경계 사례는 DataTransfer/ClipboardEvent로 브라우저 paste handler를 실행했다. 이를 실제 OS 권한 dialog 검증으로 간주하지 않는다.
- 300줄과 끝 개행의 전체 문자열을 Ctrl+A/C event data로 확인했다. 가상화된 `.cm-line` DOM 개수로 전체 원문을 판정하지 않았다.
- CRLF·끝 빈 줄·탭·공백·한글/이모지·HTML/script/URL을 텍스트로 유지했다. script element/실행/외부 HTTP·WebSocket·데이터 전송과 runtime/console 오류가 없음을 관찰했다.
- 20,000자 unwrapped 행의 editor 내부 스크롤,360/768/1280px와200% CSS zoom의 접근성·page 가로 넘침 없음을 확인했다. CSS zoom은 native 브라우저 확대와 다르다.

## 300줄 편집 측정

- 환경: Playwright Chromium `158.0.8127.18`, Windows `10.0.26200`, Intel Core Ultra7 258V, viewport1280×900, DPR1, production localhost, CPU/network throttling 없음, 자산·시스템 font 준비 후.
- 글꼴: CSS `Consolas, SFMono-Regular, Menlo, monospace`,14/21px. 300개의 짧은 const 행을 입력하고 마지막에 실제 keyboard `x` 입력5회 warmup 후30회 측정했다.
- 방법: `beforeinput` 시각부터 두 번째 `requestAnimationFrame`까지의 시간. 화면 갱신을 관찰하는 근사치이며 실제 paint timestamp·INP·전체 NFR 완료 판정이 아니다. 매 입력 뒤 측정을 마쳐 편집 이벤트가 한 프레임에 몰리지 않게 했다. percentile은 nearest-rank다.
- 결과: p50 **17.9ms**, p95 **23.3ms**, 최대 **23.4ms**. 테스트 전략의 초기 p95 50ms 실험 기준보다 작지만 단일 기기·warm 상태 결과다. 초기 로딩2초 목표와 다른 기기/언어·후속 렌더 동시 부하는 별도다.
- 실행: `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`, `node .artifacts/task-3/measure-editor.mjs`. 측정 스크립트·JSON·desktop/mobile PNG는 로컬 ignored `.artifacts/task-3/`에 남겼다.

30개 표본(ms): `14.3,19.7,22.0,17.1,22.8,19.8,15.9,21.0,16.7,22.5,14.4,14.2,20.1,14.8,17.2,19.9,13.3,15.3,23.0,21.0,17.5,17.0,17.4,16.3,17.9,22.1,22.8,23.4,23.3,22.2`.

## 번들 비용

Vite 표시 단위(kB)를 기준으로 작업2 대비 기록했다. 실제 코드 입력 엔진이 추가된 비용이며 불필요한 추가 언어/테마를 미리 번들하지 않았다.

| Production 자산 | 작업2 | 작업3 |
|---|---|---|
| HTML | 0.76 | 0.68 |
| CSS / gzip | 3.04 / 1.14 | 2.28 / 0.94 |
| JS / gzip | 222.15 / 69.73 | 480.10 / 152.98 |

JS 증가량은 약257.95kB, gzip83.25kB다. 이 수치만으로 NFR-01 초기 로딩 목표를 충족했다고 주장하지 않는다. 작업4~6 확장과 Phase4 최적화에서 기준선으로 사용한다.

## 미검증과 후속 범위

- 실제 한글 OS IME의 composition 중 Enter/Backspace/방향키는 미검증이다. Unicode 삽입 테스트를 실제 IME 검증으로 대체하지 않는다.
- 실제 macOS·Edge·Firefox·Safari/WebKit, native200% zoom·모바일 가상 키보드·스크린리더·OS clipboard 권한 dialog는 미검증이다.
- Plain Text의 기본 들여쓰기만 확인했다. 언어별 중괄호/문법 들여쓰기·주석·syntax는 작업5에서 검증한다. IDE 프리셋과 포커스 충돌 표는 작업4다.
- 임의 외부 문서 교체의 이전 Undo 그룹 보존/초기화·히스토리 복원 정책은 Phase3에서 확정한다. 현재 기본 history 동작을 제품 복원 정책으로 약속하지 않는다.
- renderer·Preview·자동 크기·네 포맷 출력·Copy Image·외부 투명·저장은 미구현·미검증이다. 현재는 실제 Plain Text 편집 기반이며 Phase1/MVP 완료가 아니다.
