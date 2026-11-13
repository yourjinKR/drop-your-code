# Phase 2 작업 9 — 배경과 스타일 설정

**목표** — 코드 창과 바깥 배경을 꾸미고 유효한 값을 Preview에 즉시 반영한다.

**구조와 기술** — React reducer에 읽기 전용 스냅샷 설정을 추가한다. 창·코드 타이포그래피의 공통 값을 CSS 변수와 렌더링 모델에 전달한다. 바깥 배경과 바깥 패딩은 composition에 적용한다.

**명세와 공통 제약** — [Phase 2](phase-2-snapshot-rendering.md), [PRD FR-STYLE-01~04·FR-LANG-03·NFR-03](../product/PRD.md), [UI 명세 §§2–3](../architecture/design/ui-spec.md). 작업 8 병합 후 `codex/phase-2-snapshot-styles`에서 시작한다.

## 파일과 계약

- `src/snapshot/presentation.ts`의 읽기 전용 `SnapshotPresentation`은 `title`, `showLanguageIcon`, `radius`, `shadowEnabled`, `shadowStrength`, `backgroundColor`, `backgroundPadding`, `transparent`, `fontId`, `fontSize`, `lineHeight`, `codePadding`을 가진다. 기본값과 유효 범위를 한 곳에서 관리한다.
- `src/state/workspace.ts`의 `settings.presentation`과 `SnapshotInput.presentation`에 같은 불변 값을 연결한다. `{ type: 'presentationChanged'; presentation: SnapshotPresentation }`은 유효한 새 값만 반영하며 code·revision을 보존한다. 키맵·앱 테마·패널·zoom은 모델 입력에서 빠진다.
- `src/components/EditorSettings.tsx`의 `Window`, `Background`, `Typography` 섹션과 `CodeWindow.tsx`/`code-window.css`, `src/snapshot/model.ts`/`renderSvg.ts`, `App.tsx`를 연결한다. 기존 `Code` 그룹의 언어·테마·줄 번호·줄 바꿈을 계속 사용한다.

## 구현 및 검증

- [ ] `tests/unit/workspace.test.ts`에 프레젠테이션 초기값, 유효 값과 무효 값, 같은 값을 재적용했을 때 상태 동일성, 원문·revision 보존과 SnapshotInput 투영을 추가한다. 기존 평면 객체 검사는 새 읽기 전용 스타일 계약에 맞춰 갱신하고 이전 스냅샷의 값이 유지되는지 확인한다. `NaN`, 범위 밖 수치, 유효하지 않은 색을 거부하고 이전 유효 값으로 렌더링하는 동작을 확인한다.
- [ ] 기본값은 상위 계획의 macOS 프리셋을 사용한다. 초기 컨트롤 범위는 모서리 0–32px, 바깥 패딩 0–128px, 코드 패딩 0–64px, 글자 크기 10–32px, line height 1.2–2.0(0.1 단위), 그림자 강도 Low/Medium/High다. 단색은 불투명 `#rrggbb`로 관리한다. 작업 7의 실측으로 조정한 값이 있으면 UI·검증 값·문서를 맞춘다.
- [ ] 글꼴은 작업 7에서 검증한 로컬/시스템 선택지에서 기본 스택과 대체 선택지를 제공한다. 사용할 수 없는 이름은 선택된 글꼴로 표시하지 않으며 적용된 스택 또는 fallback을 영어로 알린다. 제목은 언어 변경과 독립적이다. 제목과 아이콘의 위치는 같은 창 규칙을 사용하고, 제목이 길 때 공간에 맞춰 줄여 표시한다.
- [ ] Code는 기본으로 펼치고 추가 그룹은 접어 둔다. 제목·체크박스·색상·글꼴 변경은 즉시 반영한다. 숫자 필드는 입력 중 초안을 유지하고 blur/Enter에 유효 값을 반영한다. 무효 입력과 마지막 유효 Preview를 보존하고 영어 오류를 제공한다. 패널을 닫고 다시 열어도 적용 값은 유지된다.
- [ ] 투명 설정은 바깥 단색만 숨긴다. 그림자는 독립 토글/강도를 따르며 바깥 패딩이 0이어도 선택한 그림자의 가시 영역을 composition에 확보한다. 원래 단색은 투명도를 끄면 복원한다. UI용 체크무늬가 있다면 앱 chrome에서만 보인다. 모델에서 실제 새 글꼴/패딩을 다시 측정하고 Editor에는 기존 EditorView 위로 스타일을 적용한다.
- [ ] `tests/integration/snapshot-styles.test.tsx`에서 설정→모델 투영, 오류와 복구, 앱 테마 독립성, 원문·선택·Undo 보존을 확인한다. `tests/browser/snapshot-styles.spec.ts`에서 어두운/밝은 테마, 긴 한글 제목·아이콘 토글, 글꼴 fallback과 줄 간격·패딩, 투명 외부·불투명 창·그림자를 실제 Preview에서 확인한다. 스타일 변경부터 다음 Preview까지의 시간을 테스트 전략에 따라 기록한다.

**독립 완료 조건** — `npm run test -- tests/unit/workspace.test.ts tests/integration/snapshot-styles.test.tsx`, `npm run typecheck`, `npm run build`, `npm run test:browser -- tests/browser/snapshot-styles.spec.ts tests/browser/snapshot-preview.spec.ts --project=chromium --workers=2`가 성공한다. 기본값과 설정의 유효 범위가 UI 명세 및 구현과 일치한다.
