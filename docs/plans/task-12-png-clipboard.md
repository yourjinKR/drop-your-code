# Phase 2 작업 12 — PNG 클립보드 복사

**목표** — 편집이나 미리보기 상태에서 한 번의 동작으로 현재 코드를 PNG로 복사한다.

**구조와 기술** — 작업 10의 모델 생성과 PNG 인코더를 공유한다. 파일 다운로드와 클립보드 쓰기는 각 어댑터에서 처리한다.

**명세와 공통 제약** — [Phase 2](phase-2-snapshot-rendering.md), [PRD FR-EXPORT-03/04·UC-01](../product/PRD.md), [UI 명세 §4](../architecture/design/ui-spec.md). 작업 11 병합 후 `codex/phase-2-png-clipboard`에서 시작한다.

## 파일과 계약

- `src/export/copyPng.ts`의 `copySnapshotPng(createPng: () => Promise<Blob>): Promise<void>`는 보안 컨텍스트·API 가용성·Blob 형식을 확인하고 시스템 클립보드에 `image/png`를 쓴다.
- `src/export/useSnapshotExport.ts`는 작업 10의 입력 고정과 PNG 생성을 재사용해 `copyImage(): Promise<void>`를 제공한다. 기본 2x PNG는 현재 다운로드 형식 및 JPG 대체색과 독립적이다.
- `src/app/App.tsx`에서 전역 `Copy Image` 버튼과 실행 상태·영어 메시지를 연결한다. 일반 편집기 `Ctrl/Cmd+C` 동작은 기존 native copy 경로를 사용한다.

## 구현 및 검증

- [ ] `tests/unit/copy-png.test.ts`에서 PNG를 넘기는 성공, 비보안 환경·API 없음·권한 거부·잘못된 MIME·인코딩 실패를 검증한다. 인코딩이 지연될 때에도 쓰기 호출이 버튼 이벤트에서 시작되는지 확인한다.
- [ ] `navigator.clipboard.write`와 `ClipboardItem`을 사용할 수 있을 때 사용자의 클릭 처리 안에서 쓰기를 호출한다. PNG 생성이 비동기라면 `ClipboardItem`에 PNG Promise를 전달하고, 인코딩/쓰기 완료를 기다려 실제 성공을 알린다. 활성화·권한 정책은 구현 브라우저에서 확인한다. [Clipboard API](https://w3c.github.io/clipboard-apis/), [WebKit의 비동기 쓰기 사례](https://bugs.webkit.org/show_bug.cgi?id=222262)
- [ ] 클릭 순간의 전체 문서·설정으로만 PNG를 만들고 이후 입력은 계속 허용한다. 실행 중 `Copying…`/`aria-busy`를 알리고 복사·출력 중복 실행을 막는다. 실패하면 `Could not copy the image. Export a PNG instead.`처럼 원인과 PNG 저장 대안을 알린다. 이미 복사된 것처럼 표시하거나 클립보드를 자동 재시도하지 않는다.
- [ ] `tests/browser/png-clipboard.spec.ts`에서 실제 Chromium clipboard를 읽어 `image/png`, 디코딩 치수와 투명도를 확인한다. Format이 JPG일 때도 원래 투명 PNG가 복사되는지, 탭이 Editor이거나 미리보기가 뒤처져도 클릭한 문서가 복사되는지 검사한다. 거부를 주입해 영어 안내와 PNG 다운로드 복구를 확인하고, 선택된 코드의 Ctrl/Cmd+C가 텍스트를 전달하는지 기존 `editor-input.spec.ts`와 함께 검증한다. Chrome/Edge에서 PNG를 로컬 이미지 앱에 붙여넣고 실제 권한 경로를 기록한다.
- [ ] `foundation.spec.ts`와 `editor-window.spec.ts`의 툴바 검사에 `Copy Image`를 추가한다. History의 노출 시점은 Phase 3으로 추적한다.
- [ ] 상위 계획의 Phase 2 완료 조건을 실행한다. 준비된 정적 자산으로 네트워크를 차단한 뒤 Preview·네 형식 저장·PNG 복사와 새 외부 요청이 없는지 확인한다. 브라우저별 지원·미실행 환경과 성능 기준값을 `docs/verification/task-12-png-clipboard.md`에 기록한다.

**독립 완료 조건** — `npm run test -- tests/unit/copy-png.test.ts tests/integration/snapshot-export-actions.test.tsx`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:browser -- --project=chromium --workers=2`가 성공한다. 실제 클립보드 쓰기와 네 포맷의 회귀를 확인한다.
