# 작업 2 — 공통 문서·설정 상태 구현 계획

**Goal:** 편집기와 후속 렌더러가 공유할 순수 상태와 전체 코드의 읽기 전용 입력을 제공한다.

**Architecture:** DOM·React·CodeMirror·저장소·네트워크에 의존하지 않는 TypeScript reducer로 구성한다. 선택·Undo·UI theme·패널·Zoom은 소유하지 않고, Syntax theme와 편집 설정만 유지한다.

**Tech Stack:** 기존 TypeScript strict·Vitest. 새 의존성 없음.

**Spec:** [Phase 1 작업 2](phase-1-editor-foundation.md), [아키텍처](../architecture/overview.md), [디자인 상태 경계](../architecture/design/design-system.md), [검증 전략](../architecture/testing/strategy.md).

## 범위와 계약

- 기준: PR #3 병합 후 `main` (`7127c5f`). 기존 계획의 작업 2만 구현하며 화면 연결은 작업 3에 남긴다.
- `src/state/workspace.ts`: `KeymapPreset`, `EditorThemeId`, 14개 `LanguageId`, 읽기 전용 `EditorSettings`·`WorkspaceState`·`SnapshotInput`, `WorkspaceAction`과 세 순수 함수를 export한다.
- `createInitialWorkspace(): WorkspaceState`: 빈 코드·revision0, vscode, manual plaintext, dark syntax, lineNumbers/wrap false. 호출마다 독립 객체를 만든다.
- `workspaceReducer(state, action): WorkspaceState`: `codeChanged`/`codeReplaced`는 다른 코드일 때만 revision+1. 설정 변경은 코드/revision을 보존하고 동일 값은 원래 state를 반환한다. 문자열은 줄바꿈·공백·HTML을 포함해 수정 없이 보존한다.
- Action payload: `codeChanged`/`codeReplaced`는 `code`, `keymapChanged`는 `preset`, `languageChanged`는 `languageId`, `themeChanged`는 `themeId`, `lineNumbersChanged`/`wrapChanged`는 `enabled`. 각 `type`은 함수형 설명과 같은 camelCase 이름이다.
- `selectSnapshotInput(state): SnapshotInput`: `code`, `revision`, `languageId`, `themeId`, `lineNumbers`, `wrap`만 새 평면 객체로 복사한다. readonly는 타입 계약이며 runtime freeze는 요구하지 않는다. 키맵·language mode·UI state·저장 상태는 투영하지 않는다.
- `tests/unit/workspace.test.ts`: 순수 동작·입력 보존·이전 상태 불변·설정/출력 경계·타입의 readonly를 검증한다.
- 관련 계획·아키텍처·검증 기록만 최신화한다. UI·키맵 실행·언어 감지·이미지 치수/모델·내보내기·영속화는 추가하지 않는다.

## Review Focus

| 조건 | 테스트가 확인할 동작 |
|---|---|
| 동일 코드 재전달·교체 | 불필요한 revision 증가 없음, 변경·교체 모두 원문 보존 |
| 300줄·긴 행·끝 개행·CRLF·한글/이모지·HTML/script | 저장/투영 후 정확히 동일한 문자열 |
| 설정 변경·같은 값 재전달 | 문서/revision 보존, 이전 상태와 중첩 객체 불변 |
| 후속 소비자의 입력 사용 | 정확히 여섯 출력 필드, 원래 상태와 가변 중첩 참조 공유 없음 |
| 여러 workspace 생성·이전 snapshot 유지 | 초기 객체 독립, 후속 변경이 기존 입력을 바꾸지 않음 |

## 실행 순서

- [x] 동작 테스트를 먼저 작성하고 `npm run test -- tests/unit/workspace.test.ts`의 미구현 실패를 확인한다.
- [x] 위 타입·초기값·reducer·snapshot 투영을 구현한다.
- [x] 같은 단위 명령과 `npm run typecheck`를 실행하고 결과를 확인한다.
- [x] `npm run test`, `npm run build`, `git diff --check`로 전체 단위/통합·정적 빌드·변경 범위를 확인한다. 순수 미연결 모듈이라 브라우저 UI 검증은 해당 없음으로 기록한다.
- [x] 검토 결과와 실제 명령을 `docs/verification/task-2-workspace-state.md`에 남기고 작업 2 체크리스트·아키텍처 상태를 갱신한다.
- [x] 해당 작업만 별도 PR로 제출할 검증 결과·본문을 준비한다. PR 생성 결과는 최종 보고로 확인하고 병합·배포·작업 3 구현은 진행하지 않는다.

기존 단계별 계획이 정한 타입·함수·기본값을 유지한다. 추가 구현 방식 선택이나 재승인 대기는 이 작업의 선행 조건이 아니다.
