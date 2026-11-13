# Phase 2 작업 7 — 자동 크기 조절과 렌더러 검증

**목표** — 최장 행과 전체 줄 수에 따라 Editor 창을 자동 조절하고, 화면 밖 코드까지 포함한 렌더링 모델을 제공한다.

**구조와 기술** — CodeMirror/Lezer의 기존 언어 확장과 테마를 재사용한다. 모델은 EditorView·React·뷰포트와 독립적이며, 브라우저 글꼴 측정은 레이아웃 계산에 주입한다.

**명세와 공통 제약** — [Phase 2](phase-2-snapshot-rendering.md), [PRD FR-EDIT-03·FR-LANG-03·FR-EXPORT-04 및 §7](../product/PRD.md), [렌더러 실험](../architecture/testing/strategy.md#렌더러-비교-실험--phase-2-시작-전). 기준 PR은 #8이며 브랜치는 `codex/phase-2-snapshot-layout`을 사용한다.

## 파일과 계약

- `src/snapshot/model.ts`의 `buildSnapshotModel(input: SnapshotInput): Promise<SnapshotModel>`은 현재 `selectSnapshotInput`의 전체 입력을 받는다. 작업 9에서 스타일 투영이 추가돼도 함수 호출 형태는 유지한다.
- 모델의 `revision`, `width`, `height`는 각각 원문 revision과 composition의 정수 논리 치수다. `window: { x: number; y: number; width: number; height: number }`는 창 경계다. 읽기 전용 `rows`에는 1부터 시작하는 논리 줄 번호, continuation 여부, baseline, 위치·너비·강조 스타일이 있는 코드 조각을 담는다. 창 장식·배경·테마·글꼴 값과 `hasOverflowWrap: boolean`도 모델에 담아 SVG가 재측정 없이 그릴 수 있게 한다.
- `src/snapshot/layout.ts`는 줄·탭·gutter·창·composition 배치를, `measureText.ts`는 글꼴 준비와 실제 브라우저 측정을 맡는다. `highlight.ts`는 전체 코드의 구문 강조를 만든다. `src/theme/syntaxHighlighting.ts`로 공유 규칙을 옮기고 `src/editor/languageHighlighting.ts`는 CodeMirror 스타일에 그 규칙을 적용한다.
- `src/snapshot/useSnapshotModel.ts`의 `useSnapshotModel(input: SnapshotInput)`은 `model: SnapshotModel | null`, `status: 'pending' | 'ready' | 'error'`, `retry(): void`를 제공한다. 마지막 정상 모델을 유지하며 `ready`일 때만 현재 입력과 일치한다. 동일 revision에서 스타일이나 언어가 바뀌면 새 요청으로 처리한다.
- `src/app/App.tsx`, `src/components/CodeWindow.tsx`, `src/components/code-window.css`에서 계산한 폭·콘텐츠 높이를 연결한다. 창의 자연 높이와 편집 스크롤 영역을 분리한다. 작업 8과 10은 같은 모델을 소비한다.

## 구현 및 검증

- [ ] 같은 200줄·300줄, 최대 폭을 넘는 행, 탭·연속 공백·한글·이모지·합자·끝 개행, 두 구문 테마와 투명/그림자 fixture로 전용 SVG와 전체 문서 DOM 캡처 후보를 비교한다. DOM 후보는 전체 문서를 가진 별도 면에서 시험한다. 벡터 구조, 레이아웃·색·글꼴 일치, 독립 재열기와 외부 요청, 생성 시간·자산 비용을 확인한다. [ADR 0001](../architecture/decisions/0001-foundation.md)에 선택 근거·글꼴 전략·측정값·재현 방법을 기록하고 production 렌더러는 한 방식으로 정한다. SVG 2의 HTML 포함 동작은 별도 호환성 검증 대상으로 본다. [SVG 2 embedded content](https://www.w3.org/TR/SVG2/embedded.html)
- [ ] `tests/unit/snapshot-layout.test.ts`에서 측정값을 고정해 `window_width_clamps_and_includes_gutter`, `height_counts_wrapped_and_empty_rows`, `overflow_keeps_first_and_last_grapheme`를 작성하고 실패를 확인한다. 빈 문서는 한 줄, 끝 개행은 빈 마지막 줄, CRLF/CR은 LF와 같은 행 구조를 만든다. 9→10, 99→100줄에서 실제 gutter 폭 변화와 continuation에 줄 번호를 한 번만 그리는 규칙을 검사한다.
- [ ] 폭은 최장 코드 행의 실측값에 gutter·좌우 패딩·테두리를 더해 초기 320–960px 범위에 맞춘다. 높이는 타이틀바·상하 패딩·시각적 행 높이·테두리에서 구한다. 탭은 Editor와 동일한 실제 tab stop을 명시하고, 원문 범위를 유지하면서 글꼴 스타일·유니코드 grapheme 경계로 배치한다. Wrap이 켜져 있으면 가용 폭에서 줄바꿈한다. 꺼진 경우 Editor는 가로 스크롤, 스냅샷은 논리 최대 폭을 넘는 행에 한해 continuation을 사용한다. 폭 범위와 이 정책은 위 실험의 결과로 확정하고 변경 시 작업 8·10 계획과 명세를 함께 갱신한다.
- [ ] `loadLanguage(input.languageId)`와 기존 태그·테마 규칙을 재사용해 전체 문서에 강조를 적용한다. CodeMirror 상태/Lezer를 사용해 끝까지 파싱하고, Kotlin/Shell stream parser와 HTML/Markdown 내장 언어를 fixture로 확인한다. 파싱 작업은 편집 입력 콜백 밖에서 제한된 단위로 수행한다. 부분 트리를 완성 결과로 보내지 않고 실패는 호출자에 전달한다. `tests/unit/snapshot-highlight.test.ts`에서 Dark/Light 토큰 색·Markdown 강조와 300번째 줄의 토큰, Plain Text의 원문을 검사한다.
- [ ] 실제 Editor는 짧은 문서에서 줄 수와 최장 행에 따라 크기가 바뀌고, 긴 문서·좁은 화면에서는 화면 크기에 맞춰 스크롤한다. 편집 이벤트 뒤 모델 계산을 예약해 연속 입력을 합치고 최신 결과만 크기에 반영한다. 준비 전에는 기존 창을 표시한다. 폭 변경·연속 편집 뒤에도 같은 EditorView에서 선택과 Undo를 확인한다. 순수 배치는 가짜 측정값, 실제 측정과 스크롤은 Playwright에서 확인한다.
- [ ] `tests/browser/snapshot-layout.spec.ts`에서 1→3줄 증가 후 Undo, 짧은/긴 행, 320px의 wrap 켬/끔, 300줄 편집과 끝 줄 접근을 검사한다. 작업 7 보고서에 실제 글꼴·fallback·성능·미해결 호환성을 기록한다.

**독립 완료 조건** — `npm run test -- tests/unit/snapshot-layout.test.ts tests/unit/snapshot-highlight.test.ts`, `npm run typecheck`, `npm run build`, `npm run test:browser -- tests/browser/snapshot-layout.spec.ts tests/browser/editor-window.spec.ts tests/browser/phase-1.spec.ts --project=chromium --workers=2`가 성공하고, 자동 크기가 기존 Editor에서 동작하며 ADR에 선택과 근거가 남는다.
