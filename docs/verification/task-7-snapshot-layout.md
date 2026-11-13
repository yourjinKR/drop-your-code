# Task 7 — 스냅샷 레이아웃 검증

Windows x64, Node 22.23.2, Playwright Chromium 158.0.8127.18에서 production preview를 실행했다.

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run test` | 97개 통과. 스냅샷 크기·강조 9개 포함 |
| `npm run test:browser -- tests/browser/snapshot-layout.spec.ts tests/browser/snapshot-renderer-experiment.spec.ts tests/browser/editor-window.spec.ts tests/browser/phase-1.spec.ts --project=chromium --workers=2` | production build 및 11개 통과. Vite가 500 kB 초과 청크 경고를 보고함 |

동일한 200·300줄 fixture를 전용 SVG와 전체 DOM의 `foreignObject` 후보로 만들었다. 네트워크를 끄고 각각 Blob 이미지로 재열었으며 첫·끝 코드, 끝 개행, 두 구문 팔레트, 긴 행, 공백, 한글과 이모지를 포함했다. 각 조건 1회 측정이며 아래 시간은 DOM 구성과 XML 직렬화 구간이다.

| 행 | 전용 SVG | DOM 캡처 | 논리 치수 |
|---|---|---|---|
| 200 | 1.4ms, 36,834 bytes | 0.3ms, 7,005 bytes | 1056 × 4334 |
| 300 | 1.5ms, 55,034 bytes | 0.5ms, 10,205 bytes | 1056 × 6434 |

전용 SVG는 실제 픽셀에서 바깥·그림자·창 alpha `[0, 36, 255]`와 Dark/Light 창의 RGB를 확인했다. DOM 캡처는 이미지로 열렸지만 Canvas 픽셀 읽기에서 `SecurityError`가 발생했다. 시스템 글꼴 스택을 사용하며 가짜 첫 글꼴을 넣은 두 후보도 같은 치수로 디코드됐다. 다른 OS의 개별 글리프 폭, 독립 외부 뷰어 및 파일 인코딩은 후속 검증 범위다.
