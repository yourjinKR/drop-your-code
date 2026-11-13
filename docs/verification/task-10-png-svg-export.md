# Task 10 — PNG·SVG 저장 검증

Windows x64 10.0.26200, Node 22.23.2, Playwright Chromium 158에서 production preview를 검증했다. PRD FR-EXPORT-01·02·04와 NFR-04에 해당한다.

| 명령 | 결과 |
|---|---|
| `npm run test -- tests/unit/snapshot-export.test.ts tests/integration/snapshot-export-actions.test.tsx` | 22개 통과 |
| `npm run test` | 129개 통과 |
| `npm run typecheck` | 통과 |
| `npm run build` | 통과. 500 kB 초과 청크 경고 |
| `npm run test:browser -- tests/browser/png-svg-export.spec.ts tests/browser/snapshot-preview.spec.ts tests/browser/foundation.spec.ts tests/browser/editor-window.spec.ts --project=chromium --workers=2` | 17개 통과 |

320px에서 두 형식을 실제로 저장했다. PNG의 파일 서명과 832×422 치수, 투명 바깥 픽셀, 반투명 그림자, 불투명 창, 구문색을 검사했다. SVG는 논리 치수 416×211을 유지했으며 다운로드 파일을 `file:`로 열어 벡터 텍스트, 폰트 fallback 및 HTTP 요청 0건을 확인했다. 300줄 fixture에서는 긴 첫 행, 마지막 코드 줄과 끝 개행을 확인했다. Editor 스크롤과 Preview 확대를 바꾼 두 PNG는 바이트 단위로 일치했다.

200줄 JavaScript를 입력한 뒤 문서 모델과 언어 청크가 준비된 production 페이지에서 기본 시스템 monospace와 2× PNG를 사용했다. Playwright의 클릭 명령 시작부터 브라우저 다운로드 이벤트까지 5회는 1309, 1296, 1426, 1397, 1387ms였다. 이 환경에서는 5회 모두 PRD의 2초 목표 이내였다.

설치된 Chrome 157.0.8103.78과 Edge 157.0.4341.46을 Playwright 채널로 실행해 320px에서 `untitled.png`와 `untitled.svg`의 다운로드가 완료되는 것을 확인했다. 독립 SVG 글꼴과 픽셀 비교는 Windows의 Playwright Chromium에서 수행했다.
