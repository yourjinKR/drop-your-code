# Phase 2 — Snapshot Rendering 구현 계획

2026-11-14 기준 작업 7–12 구현을 마쳤다. 아래 계획과 작업별 체크리스트는 구현 당시의 범위를 기록한다. 실제 검증 결과와 남은 제한은 [Phase 2 마무리 기록](../verification/phase-2-closeout.md)을 따른다.

**목표** — 편집한 전체 코드를 별도 미리보기에서 꾸미고, 같은 페이지에서 PNG·SVG·JPG·WebP로 저장하거나 PNG를 복사한다.

**구조** — 공통 문서와 설정에서 불변 `SnapshotInput`을 얻는다. 전체 코드의 구문 강조와 치수를 담은 `SnapshotModel`을 미리보기와 출력에 공유하고, 파일 저장과 클립보드는 별도 어댑터에서 처리한다. 전용 SVG와 DOM 캡처 비교 및 글꼴 검증은 작업 7의 첫 단계다.

**기술 스택** — 기존 React·TypeScript strict·Vite·CSS·CodeMirror 6·Lezer·Lucide. 출력은 전용 SVG와 브라우저 Canvas를 우선 검증한다. Vitest와 Playwright를 사용한다.

**명세** — [PRD §§4.1–4.4·5–9](../product/PRD.md), [아키텍처](../architecture/overview.md), [ADR 0001](../architecture/decisions/0001-foundation.md), [UI 명세](../architecture/design/ui-spec.md), [디자인 시스템](../architecture/design/design-system.md), [와이어프레임](../architecture/design/wireframes.md), [테스트 전략](../architecture/testing/strategy.md), [Phase 1 최종 검증](../verification/task-6-editor-window.md).

## 작업 순서

| 작업 | PRD 연결 | 병합 시점에 확인할 결과 |
|---|---|---|
| [7. 자동 크기 조절과 렌더러 검증](task-7-snapshot-layout.md) | FR-EDIT-03, FR-LANG-03, FR-EXPORT-04, §7 | 비교 실험과 ADR. 전체 문서로 자동 계산한 치수를 Editor 창에 적용하고 출력용 모델을 테스트한다. |
| [8. 코드 이미지 미리보기](task-8-snapshot-preview.md) | FR-EDIT-01/03, FR-LANG-03, FR-STYLE-04, FR-EXPORT-04, §5 | 같은 코드를 읽는 Preview와 Zoom/Fit. Editor의 선택·Undo·스크롤을 보존한다. |
| [9. 배경과 스타일 설정](task-9-snapshot-styles.md) | FR-STYLE-01~04, FR-LANG-03, NFR-03, §5.2 | 제목·아이콘·모서리·그림자·글꼴·간격·패딩·단색/투명 배경을 즉시 반영한다. |
| [10. PNG·SVG 저장](task-10-png-svg-export.md) | FR-EXPORT-01/02/04, NFR-04, §6.3 | 기본 2x PNG와 배율 독립 SVG의 실제 다운로드를 검증한다. |
| [11. JPG·WebP 저장](task-11-jpg-webp-export.md) | FR-EXPORT-01/02/04, §6.4 | JPG의 지정색 합성과 WebP의 alpha 및 인코더 미지원 처리를 검증한다. |
| [12. PNG 클립보드 복사](task-12-png-clipboard.md) | FR-EXPORT-03/04, UC-01, §5.2 | 실제 PNG 복사·권한 실패·일반 텍스트 복사 및 네 형식의 통합 회귀를 검증한다. |

작업별 브랜치와 PR을 만들었다. 작업 7–9와 10–12는 각각 첫 작업을 `main`에, 이후 작업을 직전 작업 브랜치에 연결해 검토한 뒤 `main`에 함께 병합했다. [작업별 PR과 검증](../verification/phase-2-closeout.md#구현과-병합)

## 공통 제약

- 정적 SPA와 Vercel 정적 배포 가능성을 유지한다. 모든 편집·렌더링·이미지 생성은 브라우저 안에서 처리한다. 사용자 코드와 히스토리를 URL·요청·로그·분석 서비스로 전송하지 않는다.
- 편집기 DOM·viewport·선택·커서·스크롤·키맵과 앱 chrome을 출력 입력에서 제외한다. IntelliJ/VS Code 단축키와 기존 CodeMirror 수명, 구문 테마와 앱 UI 테마의 독립성을 보존한다.
- 앱이 작성하는 UI 텍스트·오류·접근성 이름은 영어로 쓴다. UI 아이콘은 Lucide를 사용한다. 사용자 코드와 제목은 원문으로 다루고 SVG의 텍스트로 안전하게 직렬화한다.
- 코드 창 자체는 불투명하게 그리고, 투명 외부 영역에서도 그림자를 보존한다. 미리보기·출력의 치수는 같은 모델에서 얻으며 Preview Zoom/Fit은 화면 배율에만 적용한다.
- 초기값은 빈 문서·VS Code·수동 Plain Text·Dark syntax·줄 번호와 줄 바꿈 끔을 유지한다. 코드 창은 macOS 장식, 중앙 `untitled`와 언어 아이콘, 14px/1.5, 코드 패딩 24px, 모서리 12px를 기본으로 한다. 외부는 `#242427`/48px, 그림자는 중간 강도를 시작값으로 검증한다.

## 구현 경계

| 경로 | 맡는 일 | 도입 |
|---|---|---|
| `src/snapshot/model.ts`, `layout.ts`, `highlight.ts`, `measureText.ts`, `useSnapshotModel.ts` | 구문 강조·글꼴 측정·배치·논리 치수와 최신 모델 요청. `SnapshotModel`은 전체 줄의 텍스트·스타일·좌표, 창과 composition 치수를 제공한다. | 7 |
| `src/theme/syntaxHighlighting.ts` | CodeMirror와 렌더러가 쓰는 강조 규칙과 구문 스타일 데이터 | 7 |
| `src/snapshot/renderSvg.ts`, `SnapshotPreview.tsx` | SVG 직렬화, 마지막 정상 미리보기 표시, 탭·화면 배율 연결 | 8 |
| `src/state/workspace.ts`, `src/snapshot/presentation.ts`, `src/components/EditorSettings.tsx` | 스냅샷 스타일 기본값·검증·상태 투영·설정 UI | 9 |
| `src/export/encodeSnapshot.ts`, `downloadSnapshot.ts`, `useSnapshotExport.ts` | SVG 또는 래스터 파일 생성, 클릭 시점 입력 고정, 다운로드와 출력 상태 | 10–11 |
| `src/export/copyPng.ts` | 보안 컨텍스트와 PNG 클립보드 쓰기 | 12 |

미리보기 요청의 최신 여부는 코드 revision과 별도로 식별한다. 설정·언어·폰트 변경도 새 요청이다. Editor 자동 크기와 Preview에 같은 입력의 모델 계산을 공유한다. 출력은 사용자가 클릭한 순간의 전체 입력과 옵션을 고정한다. 그 값과 일치하는 결과를 재사용하고, 미리보기가 뒤처진 경우 클릭 시점의 입력으로 모델을 만든다.

## 설계 검증 항목

| 위험 | 검증 및 소유 작업 |
|---|---|
| 너비 상한 초과, 빈 문서와 마지막 빈 줄, 탭·한글·이모지 | 320–960px를 초기 실험 범위로 사용한다. Editor에서 줄 바꿈을 끄면 가로 스크롤을 제공한다. 스냅샷에서 상한을 넘은 행은 원문을 유지한 채 시각적으로 이어 접고 Preview에서 알리는 정책을 우선 검증한다. 작업 7에서 확정하고 작업 8·10에서 출력 일치를 확인한다. |
| 언어·설정을 빠르게 바꿀 때 이전 작업이 늦게 완료 | 최신 Preview만 반영하며 오류 뒤 재시도가 가능하다. 클릭 시점의 내보내기와 복사는 이후 입력과 독립적으로 완료된다. 작업 8·10·12. |
| 독립 SVG 뷰어의 폰트·텍스트·그림자 | 오프라인 재열기, 선택 폰트가 없는 환경의 fallback, SVG 구조와 화면 일치를 확인한다. 작업 7·8·10. |
| 투명 픽셀·그림자·JPG 배경·가짜 WebP·대형 캔버스 실패 | 실제 파일 디코딩, MIME·매직 바이트·크기·샘플 픽셀, 인코딩 실패 후 재시도를 확인한다. 작업 10·11. |
| 클립보드 권한·활성화·일반 텍스트 복사 | HTTPS/localhost의 실제 PNG 쓰기, 비지원/거부, PNG 저장 안내, 기존 텍스트 복사를 확인한다. 작업 12. |

## Phase 2 검증 범위

- Chromium에서 320px 작업면의 저장, 300줄과 폭 상한을 넘는 행, 끝 개행, 스크롤과 Preview 배율 변경에 따른 출력 일치를 확인했다. [작업 10 검증](../verification/task-10-png-svg-export.md)
- PNG·WebP의 투명 영역과 그림자, JPG 대체색, 독립 SVG의 벡터와 글꼴 fallback을 실제 파일로 확인했다. 래스터 기본값은 2×이며 인코더의 1×–4×는 단위 테스트에서 검증했다. [작업 10 검증](../verification/task-10-png-svg-export.md) · [작업 11 검증](../verification/task-11-jpg-webp-export.md)
- Chromium 전체 회귀, Chrome·Edge의 네 형식 다운로드와 PNG 복사, 준비된 자산으로 오프라인 출력, 300줄 편집·스타일 반영과 200줄 PNG 생성 시간을 기록했다. [작업 12 검증](../verification/task-12-png-clipboard.md)

Phase 2 계획은 단색과 투명 배경을 채택한다. 그라데이션은 FR-STYLE-03의 선택 기능으로 남긴다. 배율 선택 UI·설정 저장·히스토리·자동 언어 감지·정식 반응형 패널·단축키 안내는 Phase 3 범위다. 브라우저/OS 호환성 확대, 성능 최적화, 전체 언어 자산의 오프라인 준비 검증과 Vercel 배포는 Phase 4에서 마무리한다.

Phase 3는 점검 → 피드백 → 수정 → 안정화 이후 재개한다. [재개 순서와 점검 항목](../verification/phase-2-closeout.md#phase-3-재개)
