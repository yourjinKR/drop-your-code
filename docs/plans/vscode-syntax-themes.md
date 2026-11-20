# VS Code 구문 테마 구현 계획

**목표**

Properties의 Code 섹션에서 IntelliJ와 VS Code 계열 색상을 선택하고 라이브 캔버스와 이미지에 반영한다. [FR-LANG-03](../product/PRD.md#42-언어-및-구문-강조-fr-lang)

**구현**

- [x] `basicThemes.ts`에 VS Code Dark+와 Light+ 색상과 표시 이름을 추가한다. 기존 `dark`, `light` 값과 IntelliJ 기본 색상을 유지한다.
- [x] `EditorSettings.tsx`에서 공통 테마 목록을 표시한다. CodeMirror와 TextMate는 테마 ID와 밝기 모드를 구분하고, 기존 `themeId`로 선택을 스냅샷에 전달한다.
- [x] 테마 전환 시 코드, 선택 영역, Undo가 보존되는지 확인한다. 라이브 편집기와 SVG의 구문 색상을 비교하고 PNG·JPG·WebP의 코드 창 색상과 투명도 처리를 확인한다.

**검증 결과**

- `npm run typecheck`, `npm run test -- --maxWorkers=2`(152개), `npm run build` 통과.
- `npm run test:browser`의 테마 및 출력 관련 검사 15개 중 14개 통과. Chromium에서 네 형식의 다운로드를 확인했고, Firefox와 WebKit에서 테마 전환 및 PNG·SVG·JPG를 확인했다.
- Firefox의 WebP 다운로드 이벤트는 시간 초과됐다. 별도 검사에서 IntelliJ Dark와 VS Code Dark+의 WebP 이미지 생성, 코드 창 색상, 외부 투명도를 확인했다. Firefox의 기존 합성 붙여넣기 검사도 실패했다.
