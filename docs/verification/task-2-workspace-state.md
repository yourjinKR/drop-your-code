# 작업 2 — 공통 문서·설정 상태 검증 결과

검증일: 2026-11-07 (Asia/Seoul). 브랜치: `codex/phase-1-workspace-state`. 시작 기준: PR #3 병합 후 `main` / `7127c5f2109b811dfbecec24ffe6ba31e1ccc0bf`. `git fetch origin main` 후 시작점과 원격 main의 차이는0/0이었다.

## 변경과 범위

[Phase 1 작업 2](../plans/phase-1-editor-foundation.md)와 [실행 계획](../plans/task-2-workspace-state.md)에 따라 `src/state/workspace.ts`, `tests/unit/workspace.test.ts`를 추가했다. 초기값·순수 reducer·전체 원문의 SnapshotInput만 제공한다. UI·CodeMirror·렌더러·내보내기·저장소·언어 감지는 구현하지 않았다. App/CSS·의존성·빌드 설정·PRD는 변경하지 않았다.

- 기본값: 코드 빈 문자열, revision0, VS Code, 수동 Plain Text, Dark syntax, 줄 번호/wrap off.
- 코드 변경·외부 교체는 문자열이 다를 때만 revision+1, 설정 변경은 코드/revision 보존, 같은 값은 동일 상태 반환.
- 상태와 중첩 document/language는 readonly 타입이다. SnapshotInput은 code/revision/languageId/themeId/lineNumbers/wrap 여섯 primitive를 새 객체로 복사한다. runtime freeze 보장이 아닌 TypeScript 계약이다.
- UI theme·패널·모드·Zoom·키맵·Undo·저장 상태는 SnapshotInput에서 제외한다. 이 작업은 순수 상태 모듈이라 브라우저나 저장소가 필요하지 않다.

## 환경과 실행 결과

Windows, Node `v22.23.2`, npm `10.9.8`. 기존 설치 환경을 사용했으며 추가 패키지를 설치하지 않았다.

| 명령 / 확인 | 실제 결과 |
|---|---|
| `npm run test -- tests/unit/workspace.test.ts` — 구현 전 | 종료1. src/state/workspace 모듈 부재로1개 suite 실패, 실행된 테스트0개. 실패 원인 확인 후 구현 |
| `npm run test -- tests/unit/workspace.test.ts` — 구현 후 | 종료0, Node 환경 단위19개 통과 |
| `npm run typecheck` | 종료0, strict 타입 및 @ts-expect-error readonly 대입 검사 통과 |
| `npm run test` | 종료0, 단위19개 + 기존 셸 통합1개, 총20개/2파일 통과 |
| `npm run build` | 종료0, 정적 HTML/CSS/JS 산출물 생성. 아직 App에 연결하지 않아 상태 모듈은 제품 화면에 노출되지 않음 |
| `git diff --check` | 종료0, whitespace 오류 없음 |
| Python stdin 문서·범위 감사 | 종료0. 변경 파일7개·relative 문서 링크38개 확인, 작업3~6 원문 유지, state module import0개, 오류0개 |
| `git diff --exit-code -- src/app src/main.tsx tests/integration tests/browser package.json package-lock.json index.html docs/product/PRD.md` | 종료0. 앱 화면·기존 통합/브라우저 테스트·의존성·PRD 변경 없음 |
| 독립 코드 리뷰 | 원래 타입/14개 언어·기본값·중첩 readonly·revision·원문·정확한 여섯 출력 필드와 의존성 경계를 대조. 수정이 필요한 사항 없음 |

## 확인한 동작

- 빈 코드와 여러 workspace 초기 객체의 독립성.
- 입력·교체·비우기에 따른 revision 증가와 동일 문자열의 no-op.
- Keymap/Language/Syntax theme/Line numbers/Wrap 변경이 문서와 이전 상태를 수정하지 않음. frozen 원본에 대해 검사했고 같은 설정 재전달도 no-op.
- 300줄,20,000자 행,CRLF/끝 빈 줄,탭·공백,한글/이모지,HTML/script/URL 문자열을 전체 원문 그대로 유지·투영.
- 여섯 primitive 이외 필드가 출력에 포함되지 않고 원본과 중첩 가변 참조를 공유하지 않음. 후속 변경이 과거 SnapshotInput을 바꾸지 않음.
- 잘못된 document/language/syntax/snapshot 대입이 TypeScript 오류가 되는지 검사. runtime freeze 검증으로 혼동하지 않음.

## 미검증·후속 범위

- `npm run test:browser`와 수동 브라우저 검증은 미실행이다. 이번 모듈은 App 미연결·화면 변경 없음이며 Node 환경으로 검증했다. 실제 입력·IME·포커스·keymap은 작업3–4에서 검증한다.
- 렌더링·자동 크기·PNG/SVG/JPG/WebP·clipboard·font/투명/출력 fidelity·성능 목표는 구현하지 않았고 통과를 주장하지 않는다.
- local storage와 외부 입력의 스키마/값 검증은 후속 저장 통합 범위다. 현재 action/state는 TypeScript로 검증된 내부 호출 계약이다.
- 이번 테스트는 편집기 selection/Undo를 검증하지 않는다. 해당 상태는 이 reducer의 책임에 포함하지 않으며 실제 CodeMirror 어댑터에서 확인한다.
- 작업2만 별도 PR로 제출하고 병합·배포·작업3 구현은 수행하지 않는다.
