# 이슈 35 · 코드 창 자동 크기와 캔버스 이동

[#35](https://github.com/yourjinKR/drop-your-code/issues/35) · FR-EDIT-03, FR-EXPORT-04

1. `tests/browser/live-canvas.spec.ts`에서 420px 화면을 125%로 확대하고 긴 줄과 여러 줄을 붙여넣는다. 창이 두 방향으로 커지고, 현재 배율에서 커서와 코드 끝을 볼 수 있는지 확인한다.
2. `src/components/code-window.css`에서 코드 창 내부의 스크롤을 없애고 `LiveCanvas`의 뷰포트가 이동을 맡게 한다. 둥근 창 경계에서 스냅샷 장식과 코드의 표시 범위를 유지한다.
3. `src/app/App.tsx`에서 `EditorSurface`에 사용 중인 창의 폭과 높이를 전달한다. 치수가 바뀌고 편집기가 포커스된 경우 커서가 보이도록 CodeMirror의 가장 가까운 스크롤 동작을 요청한다.
4. `Fit` 전후 출력 치수가 같은지, 코드를 지워도 현재 배율이 유지되는지, 창이 최소 크기로 돌아오는지 확인한다. PRD와 UI·와이어프레임에 스크롤 범위와 `Fit` 동작을 기록한다.
5. `npm test`, `npm run typecheck`, 세 브라우저의 캔버스 검증과 Chromium 전체 회귀를 실행한다.
