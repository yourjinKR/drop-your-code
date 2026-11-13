# Task 8 — 스냅샷 미리보기 검증

Windows x64의 Playwright Chromium에서 production preview를 검증했다.

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run test -- tests/integration/snapshot-svg.test.ts tests/integration/snapshot-preview.test.tsx tests/integration/App.test.tsx` | 5개 통과 |
| `npm run test:browser -- tests/browser/snapshot-preview.spec.ts tests/browser/editor-window.spec.ts tests/browser/foundation.spec.ts --project=chromium --workers=2` | production build 및 14개 통과 |

Editor와 Preview 전환에서 CodeMirror 노드, 선택, 스크롤, Undo를 보존했다. 300줄과 폭 상한을 초과한 행의 시작과 끝을 SVG에서 확인했다. Fit과 확대는 동일한 SVG와 논리 치수를 사용했다. 구문 테마를 변경하면 SVG가 갱신됐으며 UI 테마를 바꿀 때는 기존 이미지가 유지됐다.

통합 검증에서 모델과 이미지가 역순으로 완료되는 상황, 이미지 오류 후 마지막 정상 이미지와 Retry, 이전 Blob URL 해제를 재현했다. SVG는 XML 금지 문자를 `U+FFFD`로 표시하며 원문을 그대로 유지한다. 외부 SVG 뷰어의 글꼴 차이와 다른 브라우저 엔진은 별도 호환성 검증 범위다. Vite는 500 kB 초과 청크 경고를 보고했다.
