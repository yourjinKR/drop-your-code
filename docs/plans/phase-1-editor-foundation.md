# Phase 1 — Editor Foundation 구현 계획

> 작업자를 위한 문서: 아래 체크박스는 후속 구현 작업이다. 최초 작성은 계획 수립까지였으며 실행 스킬 설치·요구나 구현 전환을 하지 않았다. 후속 구현은 아래의 작업 단위별 PR 흐름을 따른다.

**Goal:** 정적 SPA에서 코드를 안전하게 편집하고 IDE 키맵·수동 언어·구문 강조·기본 코드 창을 사용할 수 있는 기반을 만든다.

**Architecture:** CodeMirror 상호작용 상태와 React의 공통 문서·설정을 어댑터로 연결한다. 후속 렌더러에는 전체 코드의 불변 입력을 제공하며 편집기 DOM을 출력 계약으로 사용하지 않는다.

**Tech Stack:** React·TypeScript strict·Vite·CSS. 작업 1에서 Vitest·Testing Library·Playwright 검증 기반을 설치했다. CodeMirror 6은 작업 3에서 검토·도입한다. 이 문서 갱신에서는 의존성을 추가하지 않는다.

**Spec:** [PRD §§4·6·8·9](../product/PRD.md), [아키텍처](../architecture/overview.md), [UI 명세](../architecture/design/ui-spec.md), [디자인 시스템](../architecture/design/design-system.md), [와이어프레임](../architecture/design/wireframes.md), [테스트 전략](../architecture/testing/strategy.md), [ADR 0001](../architecture/decisions/0001-foundation.md).

## 현재 기준과 작업 경계

- 최초 계획의 시작점은 `cac5e906a23fc31d02875526927f822aacb6dbe3` (`init project`)였다. **2026-11-07 디자인 명세 갱신 기준으로 작업 1 정적 앱 셸과 기본 검증 환경은 구현되어 있고 작업 2~6은 미구현이다.** 현재 `src/app/App.tsx`와 `src/app/app.css`는 한국어 준비 안내를 표시하는 초기 셸이다. 후속 구현 시작 때 Git·의존성·실제 구현 상태를 다시 확인해 사용자 변경을 보존한다.
- PRD §9의 Phase 1 다섯 항목을 구현한다. 렌더링·자동 크기 조절·이미지 출력은 Phase 2, 저장·히스토리·자동 언어 감지·완성된 반응형·단축키 안내는 Phase 3, 최적화·최종 호환성·배포는 Phase 4이다.
- PRD §7은 후보 목록이다. 확정 제약과 설계 제안·미검증 가정을 구분한다. 의존성 도입 시 역할과 실제 선택 버전을 기록하며 최신 버전을 추정해 고정하지 않는다.
- 최초 계획은 `writing-plans`, `verification-before-completion`을 사용했다. 이번 디자인 명세는 해당 계획의 적용 시점만 갱신하며 앱 구현·스킬 설치를 수행하지 않는다. 실행 스킬 부재를 구현의 필수 장애물로 삼지 않는다.

## Global Constraints

- 애플리케이션은 정적이며 Vercel에 배포 가능해야 한다. 백엔드·데이터베이스·인증을 도입하지 않는다.
- 사용자 코드와 코드 히스토리를 외부 서비스로 전송하지 않는다. 내용 감지·편집·후속 렌더링은 브라우저 안에서 수행한다.
- TypeScript strict를 사용한다. 편집기 상호작용, 스냅샷 렌더링, 이미지 내보내기와 React UI의 책임을 분리한다.
- IntelliJ와 VS Code 프리셋 동작을 보존한다. Windows 우선이며 macOS도 대응한다. 편집기 포커스 안에서만 편집 단축키를 처리한다.
- 후속 MVP는 PNG·SVG·JPG·WebP를 지원하고, 외부 배경이 투명해도 코드 창 자체는 불투명하게 유지한다.
- 모든 제품 UI 텍스트·접근성 이름·피드백은 영어다. `Editor`, `Properties`, `Copy Image`, `Export`를 사용한다. 문서의 한국어 설명과 사용자 코드 원문은 이 정책의 대상이 아니다.
- 승인 후 UI 작업은 Neutral Dark 기반의 공통 CSS 토큰과 Light 대응값을 사용한다. 셸의 UI theme와 코드의 Syntax theme를 독립적으로 취급하며, Lucide만 UI 아이콘으로 사용한다. 이번에는 라이브러리를 설치하지 않는다.
- 최초 계획 작성 시 앱 코드·초기화·의존성 설치·커밋·푸시·배포를 수행하지 않았다. 문서의 PR 제출과 이후 구현은 각각 요청된 범위에서 진행한다. 아래 명령은 전부 **후속 구현 후 실행할 명령**이며 현재 성공 기록이 아니다.

## 작업 단위별 PR 흐름

1. 최초 기반 문서와 작업 1 PR은 병합된 상태다. **이번 디자인 명세는 별도 `codex/` 브랜치의 문서 PR로 제출하고 병합하지 않는다.** 사용자 리뷰·디자인 승인 후 후속 구현을 진행한다. 이 문서 변경만으로 작업 2~6을 시작하지 않는다.
2. 작업 1~6은 각각 독립 브랜치 `codex/phase-1-<작업명>`와 `main` 대상 PR 하나로 진행한다. 현재 PR이 병합되기 전에는 다음 구현 작업을 시작하지 않는다.
3. 각 작업의 완료 조건을 확인한 뒤 [PR 템플릿](../../.github/pull_request_template.md)에 작업 번호·PRD 연결·실행 검증·미실행 항목·남은 제한을 기록한다. 문서 전용 변경은 앱 검증을 해당 없음으로 설명한다.
4. 병합 후 원격 `main`을 받아 로컬 기준을 갱신하고 다음 브랜치를 만든다. 기존 사용자 변경은 보존하며 `main`에 직접 커밋하지 않는다. 커밋·푸시·병합·배포는 요청된 범위에서만 수행한다.

## 디자인 적용 시점과 범위

이번 변경은 명세만 제공한다. 작업 2~6의 순서·기능·기존 완료 조건을 유지하고, 아래의 디자인 적용을 해당 기능을 실제로 제공하는 PR 안에서 검증한다. 전체 목표 화면을 한 PR에 구현하거나, 미구현 기능을 disabled/`Coming soon` 버튼으로 미리 노출하지 않는다.

| 작업 / 시점 | 적용할 디자인과 파일 경계 | 해당 PR의 추가 확인 |
|---|---|---|
| 2 — 순수 상태 계약 | 기존 `src/state/workspace.ts` 계약 유지. `themeId`는 코드 Syntax theme이며 UI palette가 아니다. 패널·모드·줌은 코드·설정 또는 `SnapshotInput`에 넣지 않음 | 기존 reducer·투영 테스트로 전체 코드와 편집 설정만 전달하며 DOM·셸 상태가 섞이지 않는지 확인 |
| 3 — 실제 입력 도입 | `src/app/App.tsx`의 편집 영역을 `Editor`로 명명하고, 입력이 제공되면 해당 영역의 한국어 준비 안내를 제거. `EditorSurface`는 레이아웃·장식과 분리 | 기존 입력 브라우저 검증에서 영어 접근성 이름, skip link와 편집기 탈출 경로 확인. 아직 `Preview` 탭·export/history를 표시하지 않음 |
| 4 — 키맵 선택 도입 | 작업면 헤더에 `Keymap` 선택 배치. 설정 필드와 editor transaction을 분리하고 현재 프리셋을 명확히 표시 | 기존 키맵 테스트와 함께 selector 포커스에서 편집 명령이 개입하지 않고 문서·선택·Undo가 보존되는지 확인 |
| 5 — 수동 언어 도입 | `Properties`의 `Code` 그룹에 `Language` 배치. 언어 선택을 헤더에도 중복하지 않으며 status에는 읽기 전용 값만 표시 | 기존 연속 선택·실패 복구 테스트에서 영어 label·로딩·오류·`Retry` 및 입력 지속을 확인 |
| 6 — 기본 창과 셸 시각 적용 | `src/app/app.css`와 공통 UI 스타일에 디자인 토큰 적용. `src/components/`의 기존 창/설정을 조합해 좁은 toolbar, activity bar, `Properties`, status와 접기/복원 배치를 구성. 기본 코드 창·Syntax theme 데이터는 별도 유지 | 기본 창·편집 설정 검증에 UI Dark/Light와 Syntax Dark/Light 교차 조합, Properties 접기/복원 시 코드·선택·Undo 유지, 영어 UI, focus·contrast·좁은 폭 입력 확인을 추가 |

작업 6의 공통 UI 파일은 실제 재사용이 생긴 경우 `src/components/ui/`에 작은 버튼·필드·섹션 단위로 둔다. CSS token 정의는 `src/app/tokens.css`를 제안하며 `app.css`에서 사용한다. 이름·배치는 구현 PR에서 기존 구조에 맞게 결정하고 테스트 경로도 함께 갱신한다. 범용 도킹 엔진·전역 상태 라이브러리·새 UI 프레임워크를 도입하지 않는다. Lucide 패키지가 필요하면 작업 6 PR에서 아이콘 일관성·트리 셰이킹을 근거로 선택 버전을 기록한다.

셸 UI theme·패널 열림·accordion은 React의 작은 UI state로 충분하다. 작업 2의 문서 reducer에 필드를 추가하거나 `themeChanged`의 의미를 UI theme로 바꾸지 않는다. 저장·설정 복원은 Phase 3의 책임이다. 편집기·렌더러·내보내기 경계는 [아키텍처](../architecture/overview.md)를 유지한다.

목표 화면 중 `Preview`, 창 크기 자동 계산, 줌/`Fit`, `Window`·`Background`·`Typography` 편집, `Copy Image`·`Export`는 Phase 2에서 기능과 함께 표시한다. 출력 배율 선택·언어 자동 감지·History/Recent snippets·Shortcuts·로컬 저장 상태·정식 반응형 drawer는 Phase 3에 표시한다. 지원 포맷은 실제 지원이 완료된 순서대로 노출하고 최종 MVP에서는 네 형식을 모두 검증한다. Phase 1에는 실제 동작하는 `Code` 설정과 기본 창만 제공하며, `Saved locally`나 미지원 버튼을 표시하지 않는다.

Desktop/Tablet/Mobile 목표는 [와이어프레임](../architecture/design/wireframes.md)을 따른다. 작업 6은 데스크톱 기본 셸과 좁은 화면의 접근 가능한 입력·설정 동선까지만 확인한다. Phase 3의 responsive task는 breakpoint별 drawer 전환·터치·가상 키보드·200% 확대를 완성·검증하며 앞당겨 완료로 표시하지 않는다.

## Review Focus

| 입력/실패 조건 | 기대 동작과 소유 작업 |
|---|---|
| 한글 IME·이모지·여러 줄 붙여넣기·끝 개행 | 조합·원문·Undo 유지, 공통 코드와 동일: 작업 3 |
| Ctrl+Y·설정 입력 포커스·Tab 탈출·프리셋 교체 | 정확한 명령, 포커스 밖 무개입, 갇히지 않음, 과거 키맵 제거: 작업 4 |
| 언어 빠른 연속 선택·느린/실패한 청크 | 최신 선택만 반영, 원문·현재 정상 강조 유지, 재시도: 작업 5 |
| 300줄·긴 행·줄 번호/wrap·테마 전환 | 편집 응답/커서/Undo 유지, 전체 코드 입력 투영, 측정 기록: 작업 2·3·6 |
| 사용자 코드의 HTML/script·URL 문자열 | 텍스트로만 표시, 실행/외부 요청 없음: 작업 1·3·6 |

## 예상 파일과 인터페이스

현재 파일을 생성하라는 지시가 아니라 후속 구현의 예상 배치다. 기존 `src/`, `tests/`를 사용한다. 작업 중 경로 변경이 필요하면 해당 작업의 테스트·참조도 함께 수정한다.

| 경로 | 책임 / 작업 |
|---|---|
| `package.json`, 앱 잠금 파일, `index.html`, `tsconfig.json`, `vite.config.ts` | 정적 앱·명령·strict 설정 / 1 |
| `vitest.config.ts`, `playwright.config.ts`, `tests/setup.ts` | 단위/통합/브라우저 검증 구성 / 1 |
| `src/main.tsx`, `src/app/App.tsx`, `src/app/app.css` | 마운트, 공통 상태 소유, 헤더/설정/편집기 조합 / 1·3~6 |
| `src/app/tokens.css`, 실제 재사용이 생긴 `src/components/ui/`의 작은 primitive | UI 전용 Dark/Light semantic tokens와 버튼·필드·섹션 스타일 / 6. 문서·Syntax theme·렌더러의 값과 분리 |
| `src/state/workspace.ts` | 타입·초기값·reducer·SnapshotInput 투영 / 2 |
| `src/editor/EditorSurface.tsx`, `src/editor/createEditor.ts` | React 수명과 CodeMirror 트랜잭션 어댑터 / 3 |
| `src/editor/keymaps.ts` | OS·프리셋별 명령 구성 / 4 |
| `src/editor/languages.ts`, `src/editor/LanguageSelect.tsx` | 초기 언어 로더와 수동 선택 / 5 |
| `src/theme/basicThemes.ts`, `src/components/CodeWindow.tsx`, `src/components/EditorSettings.tsx`, `src/components/code-window.css` | 공유 테마 토큰, 기본 창, 줄 번호/wrap/테마 설정 / 6 |
| `tests/unit/`, `tests/integration/`, `tests/browser/`, `tests/fixtures/code/` | 각 작업의 아래 검증 파일과 작은 언어 fixture / 1~6 |

작업 2에서 내보낼 계약:

- `KeymapPreset = 'intellij' | 'vscode'`, `EditorThemeId = 'dark' | 'light'`.
- `EditorThemeId` / `EditorSettings.themeId` / `themeChanged`는 Syntax theme를 뜻한다. 향후 UI theme 설정은 별도 이름·소유자로 두며 `SnapshotInput`에 포함하지 않는다. 타입 이름을 바꾸려면 후속 구현 PR에서 모든 소비자·테스트를 함께 변경한다.
- `LanguageId`: `plaintext`, `java`, `kotlin`, `javascript`, `typescript`, `python`, `sql`, `json`, `yaml`, `html`, `css`, `xml`, `shell`, `markdown`.
- `EditorSettings`: `keymap`, `language: { mode: 'manual'; languageId: LanguageId }`, `themeId`, `lineNumbers: boolean`, `wrap: boolean`. 자동 감지 모드는 Phase 3에서 명시적으로 확장한다.
- `WorkspaceState`: `document: { code: string; revision: number }`, `settings: EditorSettings`.
- `WorkspaceAction`: `codeChanged(code)`, `codeReplaced(code)`, `keymapChanged(preset)`, `languageChanged(languageId)`, `themeChanged(themeId)`, `lineNumbersChanged(enabled)`, `wrapChanged(enabled)`에 해당하는 구분된 action. 구현에서는 판별 가능한 `type`과 위 값의 payload를 사용한다.
- `createInitialWorkspace(): WorkspaceState`, `workspaceReducer(state, action): WorkspaceState`, `selectSnapshotInput(state): SnapshotInput`.
- `SnapshotInput`: `code`, `revision`, `languageId`, `themeId`, `lineNumbers`, `wrap`의 읽기 전용 값 복사. 코드 revision은 원문 변경 때 증가한다. Phase 2의 설정 변경 결과 경합은 별도 렌더 요청 ID로 구분한다.
- 초기값 제안: 빈 코드·revision 0, `vscode`, 수동 `plaintext`, `dark`, 줄 번호 끄기, wrap 끄기. PRD가 이 기본값을 정한 것은 아니며 구현 전 바꾸면 테스트와 UI 명세를 함께 갱신한다.

## 작업 1 — 실행 가능한 정적 앱과 검증 기반

**PRD 연결:** §9 Phase 1 프로젝트 구성, §6.2 정적 SPA, §6.3 개인정보·안전한 텍스트, NFR-01·05의 측정 기반. 숫자 ID 없는 요구는 섹션 번호로 추적한다.

**파일:** 위 구성 파일, `src/main.tsx`, `src/app/App.tsx`, `src/app/app.css`, `tests/setup.ts`, `tests/browser/foundation.spec.ts`.

**입출력:** 서버 상태나 API 없이 App을 마운트하고 후속 작업이 사용할 단일 페이지 셸과 검증 명령을 제공한다.

- [x] 공식 문서에서 선택 버전의 React·Vite·TS·Node·CodeMirror 호환성을 확인하고 최소 의존성과 앱 잠금 파일을 정한다. Vitest는 순수 로직, Testing Library/DOM 환경은 연결 동작, Playwright는 실제 키/브라우저 검증 목적을 기록한다. 기존 스킬 lock과 구분한다.
- [x] Vite·React·strict TS 및 CSS의 최소 셸을 구성한다. 백엔드 라우트·원격 폰트·분석·오류수집 전송을 추가하지 않는다. 아직 제공하지 않는 복사·내보내기·히스토리 버튼은 노출하지 않는다.
- [x] `typecheck`=`tsc --noEmit`, `build`=`vite build`, `dev`=`vite`, `preview`=`vite preview`, `test`=`vitest run`, `test:browser`=`playwright test` 명령을 정의한다. typecheck는 앱·테스트·설정 파일을 포함한다. Playwright는 Chromium/Firefox/WebKit 프로젝트를 구분하고 localhost 서버를 사용한다.
- [x] `foundation.spec.ts`에서 페이지 로드·셸 접근성 이름·외부 요청 없음·런타임 오류 없음을 검증한다. 정적 build 결과로도 직접 루트 접근이 가능하도록 한다.

**구현 결과 (2026-11-07):** [세부 실행 계획](task-1-static-app.md)과 [실제 검증 보고서](../verification/task-1-static-app.md)를 추가했다. CodeMirror는 metadata로 호환성만 확인하고 설치는 작업 3까지 보류했다. 작업 1만 구현했으며 작업 2~6은 시작하지 않았다.

**독립 완료 조건:** `npm run typecheck`, `npm run build` 종료 0. `npm run test:browser -- tests/browser/foundation.spec.ts --project=chromium` 성공. 앱이 정적 산출물만으로 열리고 외부 서비스 요청이 없다. 라이브러리 설치만 된 상태를 완료로 보지 않는다.

**수동 확인:** `npm run dev -- --host 127.0.0.1`과 `npm run preview -- --host 127.0.0.1`에서 셸·콘솔·네트워크 확인. 서버 처리 없이 동작하는지 확인하고 환경/버전을 기록한다. `npm run test` 전체 실행은 실제 테스트 파일이 추가된 뒤 적용한다.

## 작업 2 — 공통 문서·설정과 후속 스냅샷 입력

**PRD 연결:** FR-EDIT-01 동일 코드 상태, FR-EDIT-02 키맵 선택 상태, FR-LANG-01·02·03 선택/테마 상태, FR-EDIT-03 줄 바꿈 연결, FR-STYLE-02 줄 번호 연결, FR-EXPORT-04 전체 원문 연결. 렌더링·자동 감지·저장은 여기서 구현하지 않는다.

**파일:** `src/state/workspace.ts`, `tests/unit/workspace.test.ts`.

**입출력:** 위 계약의 초기값·reducer·`selectSnapshotInput`을 제공한다. 편집기·스토리지·DOM을 import하지 않는다. 코드 교체 action은 후속 복원의 진입점이며 저장 어댑터를 만들지 않는다.

- [ ] `workspace.test.ts`에 `code_change_increments_revision`, `same_code_is_noop`, `settings_preserve_code`, `projection_keeps_full_text_and_final_newline`, `projection_excludes_keymap_and_does_not_mutate_source`를 먼저 작성한다. 빈 코드·300줄·긴 행·HTML/script 문자열을 포함한다.
- [ ] `npm run test -- tests/unit/workspace.test.ts`로 구현 전 기대 동작 부재를 확인한 뒤 타입·초기값·reducer·불변 입력 투영을 구현한다.
- [ ] 모든 상태 전환과 투영을 같은 명령으로 확인한다. 이미지 치수·토큰·SVG·Blob·저장 스키마를 미리 만들지 않는다.

**독립 완료 조건:** 해당 단위 테스트와 `npm run typecheck` 성공. 테마/키맵을 바꿔도 코드 revision이 증가하지 않으며, 입력 투영에는 스크롤과 무관한 전체 코드가 있다. 투영 결과를 변경할 수 없는 타입으로 제공하고 원본과 중첩 가변 객체를 공유하지 않는다.

**수동 확인:** 순수 상태 모듈이므로 별도 UI 조작은 없다. 코드 리뷰로 DOM·네트워크·저장소 의존성이 없고 값 계약이 다음 작업과 같은지 확인한다.

## 작업 3 — CodeMirror 입력과 React 상태 연결

**PRD 연결:** FR-EDIT-01 전체, NFR-02, §6.3 안전한 텍스트, §8 입력/Undo·Redo/자동 들여쓰기. 자동 들여쓰기는 §2.2의 P1이기도 하지만 상세 필수·인수 조건이므로 여기 포함한다.

**파일:** `src/editor/EditorSurface.tsx`, `src/editor/createEditor.ts`, `src/app/App.tsx`, `tests/integration/EditorSurface.test.tsx`, `tests/browser/editor-input.spec.ts`, `tests/fixtures/code/editor-input.txt`.

**입출력:** `EditorSurfaceProps = { code: string; settings: EditorSettings; onCodeChange: (code: string) => void }`와 `EditorSurface(props: EditorSurfaceProps)`를 제공한다. App은 reducer 상태를 소유한다. `EditorCompartments`는 `keymap`, `language`, `theme`, `lineNumbers`, `wrap` 각각의 CodeMirror `Compartment`를 갖는다. EditorSurface가 한 번 생성해 보관하고 `createEditor(parent: HTMLElement, props: EditorSurfaceProps, compartments: EditorCompartments): EditorView`에 전달한다. 생성/정리 외에는 같은 view와 compartments를 재사용한다.

- [ ] 통합 테스트에 `input_updates_workspace_once`, `parent_echo_does_not_reset_selection_or_history`, `external_code_replacement_does_not_loop`, `unmount_destroys_editor`를 작성하고 실패를 확인한다.
- [ ] 생성/정리 Effect, 문서 변경 listener, 외부 교체와 내부 입력 구분을 구현한다. 키 입력/설정 변경마다 EditorView를 새로 만들지 않는다. 외부 교체는 현재 코드와 다른 경우에만 한 transaction으로 반영한다.
- [ ] 입력·붙여넣기·선택·삭제, 여러 줄, Undo/Redo, Tab/Shift+Tab 및 기본 줄 들여쓰기를 제공한다. 선택 언어에 따른 Enter 들여쓰기 품질은 작업 5의 fixture로 확인한다. 코드나 HTML을 실행하지 않는다.
- [ ] `editor-input.spec.ts`에서 빈 입력·300줄 붙여넣기·CRLF/끝 개행·한글·이모지·HTML/script·URL을 입력하고 원문과 공통 상태 일치를 검증한다. 줄바꿈 정규화 정책은 CodeMirror 실제 동작을 확인해 LF로 명시하고 의미 있는 마지막 빈 줄은 보존한다.

**독립 완료 조건:** `npm run test -- tests/integration/EditorSurface.test.tsx`, `npm run test:browser -- tests/browser/editor-input.spec.ts --project=chromium`, `npm run typecheck` 성공. 원문·커서·Undo를 유지하고 실행/외부 요청이 없다.

**수동 확인:** 실제 한글 IME 조합 중 Enter·Backspace·방향키를 확인한다(합성 이벤트만으로 통과 선언 금지). 300줄 편집 지연을 고정 환경에서 기록하며 [테스트 전략](../architecture/testing/strategy.md)의 제안 예산과 비교한다. Plain Text 단계의 구조적 자동 들여쓰기 한계는 작업 5에서 언어별로 재검증한다.

## 작업 4 — IntelliJ / VS Code 키맵과 포커스

**PRD 연결:** FR-EDIT-02 전체 중 저장은 Phase 3, FR-EDIT-01 Undo/Redo·들여쓰기, FR-EXPORT-03 일반 텍스트 복사 구분, UC-02, §6.4 OS 호환성. 완성된 단축키 안내 UI는 Phase 3이다.

**파일:** `src/editor/keymaps.ts`, `src/editor/createEditor.ts`, `src/editor/EditorSurface.tsx`, `src/app/App.tsx`, `tests/integration/keymaps.test.tsx`, `tests/browser/keymaps.spec.ts`.

**입출력:** `buildKeymap(preset: KeymapPreset, platform: 'windows' | 'macos' | 'other'): readonly KeyBinding[]`. 키 구성은 전용 Compartment로 교체하며 공통 기본 키맵보다 우선한다. 키맵 선택은 reducer에 반영하되 로컬 저장하지 않는다.

- [ ] Windows 표 9개 명령의 프리셋별 결과 테스트를 작성한다. Undo `Ctrl+Z`, Redo IntelliJ `Ctrl+Shift+Z` / VS Code `Ctrl+Y`, 복제 `Ctrl+D` / `Shift+Alt+↓`, 삭제 `Ctrl+Y` / `Ctrl+Shift+K`, 이동 `Shift+Alt+↑/↓` / `Alt+↑/↓`, 주석 `Ctrl+/`, Tab/Shift+Tab, 무선택 줄 잘라내기 `Ctrl+X`를 확인한다. 일반 `Ctrl+C`는 텍스트 복사를 유지한다.
- [ ] 공식 IDE 문서의 macOS 기본표를 확인해 9개 명령 대응표를 `keymaps.ts`의 설명 및 테스트 데이터로 남긴다. PRD Windows 목표를 임의 변경하거나 전체 Ctrl→Cmd 치환하지 않는다. 명령은 CodeMirror 기본 기능을 우선 재사용하고 무선택 잘라내기는 실제 클립보드까지 검증한다.
- [ ] 편집기 포커스 안에서만 처리하고 IME 조합 중 간섭을 막는다. 프리셋 교체 시 이전 바인딩을 제거하며 문서·선택·Undo를 유지한다. 처리할 명령에만 기본 동작 방지를 적용한다.
- [ ] `keymaps.spec.ts`에 `ctrl_y_matches_active_preset`, `switch_preserves_document_selection_history`, `settings_input_is_not_editor`, `unselected_cut_is_linewise`, `copy_remains_text`, `tab_escape_leaves_editor`를 작성한다. CodeMirror 공식 Tab 탈출 방식(Escape 후 Tab 등)을 선택 버전에서 확인해 최소 도움말로 노출한다. 전체 단축키 안내 UI와 구분한다.

**독립 완료 조건:** `npm run test -- tests/integration/keymaps.test.tsx`, `npm run test:browser -- tests/browser/keymaps.spec.ts --project=chromium`, `npm run typecheck` 성공. 9개 명령·포커스 외 무개입·교체 후 기존 바인딩 미잔존을 입증한다.

**수동 확인:** Windows Chrome/Edge와 실제 macOS 브라우저에서 대응표, OS/브라우저 선점 키, 키보드 배열의 `/` 입력, 텍스트 복사/잘라내기를 확인한다. 실행 불가능한 환경은 미검증으로 기록하며 최종 지원 판정은 Phase 4까지 닫는다. 선점 조합은 대체 동선/안내를 기록하고 성공으로 보고하지 않는다.

## 작업 5 — 초기 언어 전체와 수동 선택·강조

**PRD 연결:** FR-LANG-01, FR-LANG-02 수동 선택 보호의 기반, FR-LANG-03의 강조 연결, FR-EDIT-01 언어별 들여쓰기, NFR-02·05, §6.2 지연 로딩·오프라인 기반. 자동 감지는 Phase 3이다.

**파일:** `src/editor/languages.ts`, `src/editor/LanguageSelect.tsx`, `src/editor/createEditor.ts`, `src/app/App.tsx`, `tests/unit/language-registry.test.ts`, `tests/integration/language-selection.test.tsx`, `tests/browser/languages.spec.ts`, `tests/fixtures/code/`의 언어별 작은 예제.

**입출력:** `loadLanguage(id: LanguageId): Promise<LanguageSupport | null>`; Plain Text는 `null`. 명시적 ID→로더 목록과 로드 Promise 캐시를 사용한다. 선택 중/오류 상태는 UI에 두고 성공한 최신 요청만 reducer의 수동 언어 선택과 Compartment에 반영한다.

- [ ] 단위 테스트로 위 14개 ID의 누락·중복 없음과 Plain Text 처리를 확인한다. 공식 패키지 목록에서 Java·JS/TS·Python·SQL·JSON·YAML·HTML/CSS·XML·Markdown 및 Kotlin/Shell 지원 경로를 확인한다. legacy mode 어댑터는 실제 버전 API와 문법 품질을 기록한다.
- [ ] 언어별 fixture에 알려진 키워드/문자열/주석을 넣고 강조가 구분되는지 확인한다. 언어가 제공하는 들여쓰기와 주석 명령을 검증하며 JSON 등 주석 문법 없는 언어는 안전한 no-op으로 정의한다. Plain Text는 강조 없음이 정상이다.
- [ ] 로더 실패·연속 선택 경합의 통합 테스트를 먼저 작성한 뒤 언어 선택을 구현한다. 요청 A 후 B가 완료되면 A의 늦은 결과는 적용하지 않는다. 실패 시 현재 코드·마지막 정상 언어를 유지하고 실패와 재시도 동선을 표시한다.
- [ ] 자동 감지 UI/라이브러리는 넣지 않는다. 수동 선택 모드를 명시적으로 저장할 계약만 확보한다. `languages.spec.ts`에서 모든 초기 언어 전환·강조·문서/Undo 유지와 실패 복구를 확인한다.
- [ ] 현재 열린 페이지에서 로드 완료한 언어는 단절 후 재선택 가능한지 확인한다. 미선택 자산의 자동 오프라인 가용성을 주장하지 않는다. 전체 초기 자산을 준비하는 정책·완료 표시·초기 속도와의 양립은 Phase 3~4 실험으로 넘긴다.

**독립 완료 조건:** `npm run test -- tests/unit/language-registry.test.ts tests/integration/language-selection.test.tsx`, `npm run test:browser -- tests/browser/languages.spec.ts --project=chromium`, `npm run typecheck`, `npm run build` 성공. 초기 언어 전부에 검증 결과가 있고, 부족한 문법을 조용히 Plain Text로 대체해 지원 완료로 보고하지 않는다.

**수동 확인:** 각 언어의 붙여넣기·Enter 들여쓰기·주석·탭·한글 문자열, 느린 네트워크에서 선택 경합, 청크 차단·재시도, 이미 로드한 언어의 열린 페이지 오프라인 재선택을 확인한다. 지원 품질이 부족하면 대체 패키지 검토 근거를 ADR에 추가한다.

## 작업 6 — 기본 코드 창·테마·편집 설정과 Phase 1 확인

**PRD 연결:** FR-STYLE-01·04 기본 창, FR-STYLE-02 줄 번호 기반, FR-LANG-03 Dark/Light, FR-EDIT-03 줄 바꿈 기반, NFR-01·02·03·05, §5 편집 흐름, §8 기본 디자인. 실제 이미지 미리보기/치수 자동 계산은 Phase 2이다.

**파일:** `src/theme/basicThemes.ts`, `src/components/CodeWindow.tsx`, `src/components/EditorSettings.tsx`, `src/components/code-window.css`, `src/app/App.tsx`, `src/app/app.css`, `src/editor/createEditor.ts`, `tests/integration/theme-settings.test.tsx`, `tests/browser/editor-window.spec.ts`, `tests/browser/phase-1.spec.ts`.

**입출력:** `getBasicTheme(id: EditorThemeId): BasicThemeTokens`는 창 배경·글자·구문 색상 값의 공유 원천이다. `BasicThemeTokens`는 후속 렌더러가 DOM 없이 읽을 수 있는 데이터로 둔다. `CodeWindow({ title, languageId, children })`는 기본 창 장식과 편집기를 조합한다. 실제 크기 모델·SVG는 만들지 않는다.

- [ ] 제공된 목표 와이어프레임과 [디자인 시스템](../architecture/design/design-system.md)·[UI 명세](../architecture/design/ui-spec.md)를 기준으로 어두운 불투명 코드 창·빨강/노랑/초록 장식·상단 중앙 제목·언어 아이콘·라운딩·여백·강조를 구성한다. 이미지의 예제 코드·치수·`Dark+` 이름을 고정 계약으로 오인하지 않는다. 장식 버튼은 비상호작용 요소로 처리한다.
- [ ] 작은 기본 Dark/Light 테마 2개와 줄 번호·wrap 설정을 구현한다. 테마·줄 번호·wrap 변경은 Compartment로 적용해 코드·선택·Undo를 보존한다. 추가 테마의 지연 로딩은 후속 확장점이다.
- [ ] `theme-settings.test.tsx`에 `theme_preserves_document_history`, `line_numbers_and_wrap_change_only_presentation`을 작성한다. `editor-window.spec.ts`는 기본 장식·중앙 제목·언어 아이콘, 불투명 코드 창, 긴 행/wrap·스크롤·설정 라벨을 검증한다. 출력 이미지의 픽셀 일치 검증으로 혼동하지 않는다.
- [ ] `phase-1.spec.ts`에 입력→키맵 전환→언어 선택→테마·줄 번호·wrap→Undo의 핵심 흐름과 악성 HTML/script 문자열 무실행·외부 요청 없음을 검증한다. 300줄 지연, 초기 로딩, 청크 분리·총량을 기록하고 미검증 환경을 남긴다.
- [ ] 셸에 공통 semantic token·영어 label·Lucide 규칙을 적용하고 초기 한국어 준비 안내·큰 작업면 제목·설명 카드·설명 footer를 제거한다. `theme-settings.test.tsx`에서 `ui_theme_does_not_change_syntax_or_snapshot_input`을, `editor-window.spec.ts`에서 `properties_toggle_preserves_editor_state`, `all_visible_controls_have_english_names`, keyboard focus 및 Dark/Light 교차 조합을 확인한다. UI theme 변경은 코드·Syntax theme·출력 설정을 바꾸지 않는다.

**독립 완료 조건:** `npm run test -- tests/integration/theme-settings.test.tsx`, `npm run test:browser -- tests/browser/editor-window.spec.ts tests/browser/phase-1.spec.ts --project=chromium`, 이어서 `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:browser -- --project=chromium` 성공. 기본 편집 경험을 완성하되 Phase 1 완료를 MVP 인수 완료라고 보고하지 않는다.

**수동 확인:** Windows Chrome/Edge의 실제 편집·기본 창·언어별 강조·테마, 300줄 반응·긴 행 스크롤, 좁은 화면에서 최소한의 편집 가능 여부를 확인한다. macOS·Firefox·Safari의 수행/미수행 항목을 기록한다. 정식 반응형 패널·터치 최적화·출력 검증은 후속 단계다.

## P1·상세 요구·최종 인수 조건의 배치

우선순위 P1과 개발 단계 Phase 1은 다른 축이다. §2.2에서 권장 기능이어도 §4의 상세 요구와 §8의 최종 인수 조건에 포함되면 MVP 완료 전 검증 대상에서 제외하지 않는다.

| 겹치는 항목 | 배치와 이유 |
|---|---|
| 자동 들여쓰기 | FR-EDIT-01·§8 필수 동작. 작업 3의 기초와 작업 5의 언어별 검증에 포함 |
| 줄 번호 | FR-STYLE-02·§8 디자인. 작업 2·6에서 편집 설정, Phase 2에서 미리보기/출력 일치 검증 |
| 줄 바꿈 | FR-EDIT-03·§8 디자인. 작업 2·6에서 편집 설정, Phase 2에서 최장 행·최소/최대 폭·자동 높이·전체 코드 출력과 함께 검증 |
| 배율 1x~4x·기본 2x | FR-EXPORT-02·§8. Phase 2는 배율 인자를 받을 출력 경계를 설계하고 기본 2x, Phase 3에서 선택 UI·1~4x 완성. SVG는 배율 무관 |
| 글꼴·줄 간격 | FR-STYLE-02·§8 폰트 등. Phase 1은 고정 기본값, Phase 2에서 변경·측정·출력 일치. §8의 예시에 없더라도 줄 간격 상세 요구 유지 |
| 단축키 안내 | FR-EDIT-02의 차이 안내를 작업 4의 선택 라벨·충돌 최소 안내로 시작. Phase 3에서 명령별 안내 완성, Phase 4 실제 OS/브라우저 충돌 검증 |
| 히스토리 관리·삭제 | FR-STORAGE-02·§8 항목/전체 삭제·저장 끄기 모두 Phase 3. 저장 기능과 함께 제공해 개인정보 제어 누락 방지 |

## 후속 단계 연결과 인수 추적

| 후속 기능 | Phase 1에서 확보할 연결 지점 | 완료 단계 / PRD |
|---|---|---|
| 자동 크기·이미지 미리보기 | 전체 원문 `SnapshotInput`, theme tokens, wrap/줄 번호. 편집기 viewport와 독립 | Phase 2 / FR-EDIT-03·FR-EXPORT-04 |
| 제목·아이콘·라운딩·그림자·폰트·패딩·외부 배경 | 기본 CodeWindow와 공통 설정의 확장 위치. 현재 고정값을 사용자 설정 지원으로 오인하지 않음 | Phase 2 / FR-STYLE-01~04; 그라데이션만 선택 사항 |
| SVG·Canvas·4형식·PNG 이미지 복사 | 불변 입력과 공유 테마. 후속 `src/snapshot/`, `src/export/`를 UI 밖에 배치할 예정 | Phase 2 / FR-EXPORT-01~04; 배율 UI Phase 3 |
| 설정/키맵 영속화·스니펫 최대 20개 | 순수 초기값·검증 가능한 설정 타입·`codeReplaced` 동작. 저장은 편집 트랜잭션 밖 | Phase 3 / FR-STORAGE-01·02·UC-03 |
| 자동 언어 감지 | 수동 선택 모드와 별도 로더. 감지 결과는 manual을 덮어쓰지 않게 타입 확장 | Phase 3 / FR-LANG-02 |
| 반응형·상세 단축키 안내 | 의미 있는 셸·설정 접근·편집기 포커스 경계 | Phase 3 / §5·FR-EDIT-02 |
| 오프라인 전체 자산 준비·최종 성능·호환성 | 명시적 언어 로더, 로드 실패 처리, 300줄/초기 로딩 측정 기준 | Phase 3 준비 정책, Phase 4 확정 / §6·NFR-01~05 |
| Vercel 정적 배포 | 서버 없는 Vite build 산출물 | Phase 4 / §6.2·§8. 이번 작업 및 Phase 1 계획에 배포 실행 없음 |

§8 추적상 Phase 1은 입력·키맵·Undo/Redo·자동 들여쓰기·수동 언어/강조·기본 창·테마·편집 줄 번호/wrap을 맡는다. 코드 길이에 따른 높이/폭/제한, 자동 감지, 디자인 세부 편집, 출력 전체, 데이터·배포 인수 항목은 위 후속 단계에서 각각 닫는다. P0 언어 자동 감지를 Phase 3에 둔 것은 §9의 순서를 따르기 때문이며 MVP에서 제외한 것이 아니다.

## 계획 자체의 검토와 다음 시작점

작성 시 PRD §9의 Phase 1 다섯 항목을 작업 1/3/4/5/6에, 공통 상태를 작업 2에 연결했다. 타입·파일·명령의 이름을 맞추고 P1 겹침과 §8 후속 항목을 위 표로 추적했다. 문서 검증과 실제 구현의 테스트 성공 기록을 분리한다.

다음 구현 작업은 **작업 2: 공통 문서·설정과 후속 스냅샷 입력**이다. 디자인 승인 후 별도 구현 요청을 받으면 현재 Git 상태와 실제 선택 버전부터 재확인한다. 이번 문서 PR의 제출 권한은 앱 구현·의존성 설치·병합·배포 권한을 뜻하지 않는다. 디자인 값의 문서 검증은 구현·접근성·출력 품질의 실제 통과 기록과 구분한다.
