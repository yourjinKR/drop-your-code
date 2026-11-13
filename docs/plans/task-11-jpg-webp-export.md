# Phase 2 작업 11 — JPG·WebP 저장

**목표** — 지정색을 합성한 JPG와 투명도를 유지한 WebP를 추가한다.

**구조와 기술** — 작업 10의 모델·Canvas·다운로드를 공유한다. 형식별 처리 경계는 JPG의 불투명 합성과 실제 WebP 인코더 결과 확인이다.

**명세와 공통 제약** — [Phase 2](phase-2-snapshot-rendering.md), [PRD FR-EXPORT-01/02/04·§6.4](../product/PRD.md), [UI 명세 §4](../architecture/design/ui-spec.md). 작업 10 병합 후 `codex/phase-2-jpg-webp-export`에서 시작한다.

## 파일과 계약

- `src/export/encodeSnapshot.ts`의 `SnapshotExportOptions`에 `{ format: 'jpg'; scale: RasterScale; backgroundColor: string }`과 `{ format: 'webp'; scale: RasterScale }`를 추가한다. 기대 MIME·확장자는 각각 `image/jpeg`/`.jpg`와 `image/webp`/`.webp`다.
- `src/components/EditorSettings.tsx`, `src/app/App.tsx`와 `src/snapshot/SnapshotPreview.tsx`에서 Format 옵션, `JPG background`와 JPG 결과 Preview를 연결한다. JPG 대체색 기본은 `#ffffff`이고 유효한 불투명 `#rrggbb`만 받는다. 출력 형식과 대체색은 메모리에 둔다.

## 구현 및 검증

- [ ] `tests/unit/snapshot-export.test.ts`에 JPG 대체색 합성 순서, WebP MIME 불일치와 null, 래스터 네 배율, 다른 형식의 배경 상태 독립성 케이스를 추가하고 실패를 확인한다.
- [ ] JPG의 Canvas에 지정색을 먼저 채우고 SVG 전체를 그린다. 외부 배경이 이미 불투명하면 기존 색을 유지하고, 투명 영역에서는 지정색이 보이며 그림자는 그 위에 합성된다. JPG를 선택했을 때 Preview 이미지의 논리 경계 안에서 같은 합성을 확인할 수 있게 한다. 형식을 바꿔도 공통 투명 설정은 유지한다.
- [ ] WebP는 알파를 유지한 채 브라우저 인코더를 사용한다. 요청 MIME과 실제 Blob MIME이 다른 경우 영어 오류(`WebP export is unavailable in this browser. Choose another format.`)를 표시한다. 이 경우 파일 다운로드는 발생하지 않는다. 브라우저 지원과 관계없이 다른 포맷을 다시 선택해 저장할 수 있게 한다. [HTML Canvas 인코딩 규칙](https://html.spec.whatwg.org/multipage/canvas.html#dom-canvas-toblob-dev)
- [ ] `tests/browser/jpg-webp-export.spec.ts`에서 실제 다운로드 파일의 JPG SOI와 WebP RIFF/WEBP 서명, 확장자·디코딩·치수를 확인한다. 투명 모드에서 사용자 지정색·그 위의 그림자·창 색은 JPG 압축 허용 오차를 실측해 비교한다. WebP는 바깥 alpha 0, 반투명 그림자, 창 alpha 255를 확인한다. WebP에 PNG Blob을 반환하도록 실패를 주입해 다운로드 없음과 PNG 선택 후 복구를 확인한다. 장문 fixture와 기존 PNG/SVG를 다시 검사한다.
- [ ] Chrome·Edge에서 네 형식의 저장을 확인한다. 설치된 Firefox/WebKit에 대해서도 출력 spec을 실행해 정상 인코딩과 미지원 안내를 실제 결과별로 기록한다. 브라우저 자동화 결과와 실제 Safari 확인을 별개로 기록한다.

**독립 완료 조건** — `npm run test -- tests/unit/snapshot-export.test.ts tests/integration/snapshot-export-actions.test.tsx`, `npm run typecheck`, `npm run build`, `npm run test:browser -- tests/browser/png-svg-export.spec.ts tests/browser/jpg-webp-export.spec.ts --project=chromium --workers=2`가 성공한다. 투명 배경의 JPG 지정색·WebP alpha를 실제 파일에서 확인한다.
