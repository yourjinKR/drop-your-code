# Phase 2 작업 8 — 코드 이미지 미리보기

**목표** — 편집 상태를 유지하며 전체 문서의 출력 모습을 확인한다.

**구조와 기술** — 작업 7의 모델에서 직렬화한 SVG를 Preview에서 사용한다. React는 탭·비동기 결과·화면 배율만 관리한다.

**명세와 공통 제약** — [Phase 2](phase-2-snapshot-rendering.md), [PRD FR-EDIT-01/03·FR-LANG-03·FR-STYLE-04·FR-EXPORT-04](../product/PRD.md), [와이어프레임 §4](../architecture/design/wireframes.md#4-editor와-preview). 작업 7 병합 후 `codex/phase-2-snapshot-preview`에서 시작한다.

## 파일과 계약

- `src/snapshot/renderSvg.ts`의 `renderSnapshotSvg(model: SnapshotModel): string`은 독립적으로 열 수 있는 SVG 문서를 반환한다. 작업 10의 SVG 저장과 래스터 변환이 같은 함수를 호출한다. 작업 7 실험에서 표현 방식이 바뀌면 확정한 ADR과 파일 계약을 이 계획에 먼저 반영한다.
- 작업 7의 `useSnapshotModel(input)` 결과를 App에서 Editor와 Preview에 공유한다. SVG 이미지 준비 상태와 모델 상태를 함께 확인하고, 가장 최근에 정상 표시된 이미지와 현재 상태를 구분해 표시한다.
- `src/snapshot/SnapshotPreview.tsx`와 `src/app/App.tsx`·`app.css`에서 Preview 표시, 탭, 배율, 스크롤과 치수 표시를 연결한다. 확대 상태와 활성 탭은 App UI 상태다.

## 구현 및 검증

- [ ] `tests/integration/snapshot-svg.test.ts`에서 직렬화 결과를 XML로 다시 열어 `viewBox`, 창·헤더·그림자, 코드 텍스트와 좌표, 첫/끝 줄과 마지막 빈 줄, 줄 번호·continuation, HTML처럼 보이는 문자열과 `&`가 원문 텍스트인지 확인한다. 외부 참조·실행 요소·래스터 코드 면이 없는지 검사한다. 실패를 확인한 뒤 SVG를 구현한다.
- [ ] SVG는 모델의 논리 치수·구문색·글꼴·패딩·줄 높이·테마·장식을 사용한다. 제목은 렌더링 공간에 맞춰 줄이되 전체 값은 작업 9의 설정 필드에 남긴다. 코드와 제목은 안전한 XML 텍스트/속성으로 직렬화한다. 탭·공백·유니코드 및 XML에 담을 수 없는 제어문자의 표시 규칙을 테스트한다. Preview에는 생성한 SVG를 이미지로 사용하고 교체·해제 시 이전 object URL을 정리한다.
- [ ] `tests/integration/snapshot-preview.test.tsx`에서 입력 A가 B 뒤에 완료되는 경우와 같은 revision의 테마 변경을 재현한다. 이미지 로드도 최신 요청만 반영하며 실패 시 마지막 정상 이미지, 현재 입력과 다르다는 안내와 `Retry`를 표시한다. Preview 직렬화는 표시할 때 수행한다. 모델 재계산은 스냅샷 입력값이나 실제 글꼴 변경에 연결한다.
- [ ] `Editor` / `Preview`를 방향키·Home/End·선택 상태·tabpanel 관계가 있는 탭으로 연결한다. 방향키로 탭 포커스를 이동하고 Enter/Space로 활성화한다. 전환 시 선택 탭에 포커스를 두고 EditorView를 계속 마운트한다. 다시 보일 때 크기를 재측정하고 기존 선택·Undo와 두 작업면의 스크롤을 복구한다. 기존 `Skip to editor`와 `Focus editor`는 Preview에서도 Editor로 이동한다. 명시적으로 바뀐 탭/영역 이름은 기존 App과 foundation 테스트에 반영한다.
- [ ] 첫 Preview는 Fit으로 양축에 맞추고 최대 100%로 제한한다. 수동 배율은 25·50·75·100·125·150·200%이며 확대 전 중앙이 가리키던 콘텐츠 위치를 가능한 범위에서 유지한다. Fit은 패널·viewport 변경 시 다시 계산하고 수동 배율은 유지한다. 큰 composition은 좌상단부터 스크롤한다. 표시 치수와 zoom 그룹은 Preview에서만 보이고, 상한 초과 행을 이어 접은 경우 영어 안내를 이미지 바깥에 표시한다.
- [ ] `tests/browser/snapshot-preview.spec.ts`에서 키보드 탭 이동, 원래 Editor 노드·선택·Undo, 양쪽 스크롤 보존, 300줄·초과 폭 행의 끝까지 접근, Fit과 패널 개폐·수동 확대, UI/구문 테마 독립성을 확인한다. 배율을 바꿔도 모델 치수와 SVG 내용은 같다.

**독립 완료 조건** — `npm run test -- tests/integration/snapshot-svg.test.ts tests/integration/snapshot-preview.test.tsx tests/integration/App.test.tsx`, `npm run typecheck`, `npm run build`, `npm run test:browser -- tests/browser/snapshot-preview.spec.ts tests/browser/editor-window.spec.ts tests/browser/foundation.spec.ts --project=chromium --workers=2`가 성공한다. 브라우저에서 Preview 탭과 Fit을 실제로 사용하고 Editor에 돌아와 Undo한다.
