# Phase 2 작업 10 — PNG·SVG 저장

**목표** — 현재 편집 내용과 스타일을 PNG 또는 독립 SVG 파일로 저장한다.

**구조와 기술** — 작업 8과 같은 SVG 직렬화를 사용한다. PNG는 Canvas에서 출력 치수로 래스터화한다. Blob 생성과 파일 다운로드를 분리한다.

**명세와 공통 제약** — [Phase 2](phase-2-snapshot-rendering.md), [PRD FR-EXPORT-01/02/04·NFR-04](../product/PRD.md), [UI 명세 §4](../architecture/design/ui-spec.md). 작업 9 병합 후 `codex/phase-2-png-svg-export`에서 시작한다.

## 파일과 계약

- `src/export/encodeSnapshot.ts`의 `encodeSnapshot(model: SnapshotModel, options: SnapshotExportOptions): Promise<Blob>`은 `{ format: 'svg' } | { format: 'png'; scale: RasterScale }`을 받는다. `RasterScale = 1 | 2 | 3 | 4`, `DEFAULT_RASTER_SCALE = 2`다. 작업 11에서 형식을 추가하며 작업 12는 PNG 경로를 호출한다.
- `src/export/downloadSnapshot.ts`의 `downloadSnapshot(blob: Blob, filename: string): void`는 파일 저장 동작을 시작한다. UI는 파일 시스템 저장 완료를 추정하지 않는다.
- `src/export/useSnapshotExport.ts`의 `useSnapshotExport(input: SnapshotInput, preview: SnapshotModel | null, options: SnapshotExportOptions)`는 `exportImage(): Promise<void>`, `busy`, 상태·오류 메시지를 제공한다. 호출부는 현재 입력과 정확히 일치한다고 확인한 Preview 모델만 전달한다. 미일치 시 `null`을 전달한다.
- `src/app/App.tsx`와 `src/components/EditorSettings.tsx`에 전역 `Export` 버튼과 Properties의 `Export` 그룹을 연결한다. 형식은 PNG 기본값과 SVG, 치수는 논리 크기를 표시한다. 래스터 기본 2x의 결과 픽셀 크기도 안내한다.

## 구현 및 검증

- [ ] `tests/unit/snapshot-export.test.ts`에서 SVG MIME·치수와 래스터 1x–4x 치수 계약을 먼저 검증한다. 예를 들어 888×496은 기본 PNG 1776×992가 되며 SVG는 888×496을 유지한다. 0/유효하지 않은 치수, Canvas 크기·픽셀 예산 초과, context 없음, SVG decode 실패, `toBlob` null·잘못된 MIME를 각각 실패로 검증한다. 캔버스 크기·픽셀 예산은 시험 환경과 메모리 비용을 근거로 정하고 초과 시 영어 오류를 제공한다. 코드나 배율을 몰래 줄이지 않는다.
- [ ] SVG는 모델의 `viewBox`와 치수를 가진 `image/svg+xml` Blob으로 만든다. PNG의 SVG 원본은 동일한 viewBox로 목표 픽셀 크기에 그려 고해상도에서 텍스트를 다시 래스터화한다. 알파를 유지하며 실제 Blob MIME을 확인한다. 디코딩 자원과 object URL은 성공·실패 모두에서 해제한다. [HTML Canvas 인코딩 규칙](https://html.spec.whatwg.org/multipage/canvas.html#dom-canvas-toblob-dev)
- [ ] 클릭 즉시 코드·언어·스타일·출력 옵션을 캡처한다. Preview가 준비 중이거나 표시 모드가 Editor면 필요에 따라 같은 입력으로 모델을 만든다. 중복 실행은 막고 편집을 허용한다. SVG/PNG 확장자와 안전한 제목 기반 파일명(빈 값 `untitled`)을 사용한다. 다운로드 시작 후 임시 URL을 정리한다. `Exporting…`/`aria-busy`와 영어 오류를 제공한다. 다운로드 성공 문구는 확인 가능한 생성·시작 상태에 한정한다.
- [ ] `tests/integration/snapshot-export-actions.test.tsx`에서 A 클릭 직후 B로 편집하거나 형식을 바꿔도 A의 설정으로 한 파일만 생성되는지 확인한다. 오래된 Preview를 전달하는 대신 클릭 시 입력으로 생성하는 경로, 실패 후 재시도와 중복 클릭, 파일명 정리를 검증한다.
- [ ] `tests/browser/png-svg-export.spec.ts`에서 실제 다운로드를 읽는다. PNG 서명·확장자·디코딩·2x 치수, 바깥 alpha=0·반투명 그림자·창 내부 alpha=255와 배경/구문색 샘플을 검사한다. SVG는 파일로 재열어 XML·벡터·글꼴 fallback·외부 요청 부재를 확인한다. 300줄과 긴 행의 첫/끝 marker를 SVG의 텍스트와 PNG 하단·우측 렌더 샘플로 확인한다. Preview zoom과 현재 편집 스크롤을 바꿔도 결과가 같다.
- [ ] `foundation.spec.ts`와 `editor-window.spec.ts`의 초기 셸 검증은 동작하는 `Export` 버튼을 확인하고 출시 전 조작으로는 History와 Copy Image의 부재를 검사한다.
- [ ] 320px 작업면에서 설정·저장 동선을 확인한다. 로컬 production 200줄 fixture로 클릭부터 파일 생성까지 측정하고 NFR-04의 2초 목표와 비교해 환경·캐시·반복 횟수·값을 기록한다.

**독립 완료 조건** — `npm run test -- tests/unit/snapshot-export.test.ts tests/integration/snapshot-export-actions.test.tsx`, `npm run typecheck`, `npm run build`, `npm run test:browser -- tests/browser/png-svg-export.spec.ts tests/browser/snapshot-preview.spec.ts tests/browser/foundation.spec.ts tests/browser/editor-window.spec.ts --project=chromium --workers=2`가 성공한다. 실제 PNG/SVG 파일과 미리보기의 배치·색·전체 코드 포함을 확인한다.
