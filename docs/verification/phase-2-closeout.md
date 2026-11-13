# Phase 2 마무리 — 스냅샷 미리보기와 출력

2026-11-14 기준 [PRD §9의 Phase 2 범위](../product/PRD.md#9-개발-단계)를 구현했다. 편집 중인 전체 코드로 스냅샷을 만들고 스타일을 적용한 뒤, PNG·SVG·JPG·WebP로 저장하거나 PNG로 복사할 수 있다. [Phase 2 구현 계획](../plans/phase-2-snapshot-rendering.md)

## 구현과 병합

| 작업 | 구현 결과 | PR 및 검증 |
|---|---|---|
| 7 | 전체 문서로 창 크기를 계산하고 전용 SVG 렌더러를 채택했다. | [PR #9](https://github.com/yourjinKR/drop-your-code/pull/9) · [검증](task-7-snapshot-layout.md) |
| 8 | Editor와 Preview 전환, Fit과 확대를 제공한다. | [PR #10](https://github.com/yourjinKR/drop-your-code/pull/10) · [검증](task-8-snapshot-preview.md) |
| 9 | 창 장식, 외부 배경과 투명도, 글꼴·간격·패딩을 조절한다. | [PR #11](https://github.com/yourjinKR/drop-your-code/pull/11) · [검증](task-9-snapshot-styles.md) |
| 10 | 기본 2× PNG와 독립 벡터 SVG를 저장한다. | [PR #13](https://github.com/yourjinKR/drop-your-code/pull/13) · [검증](task-10-png-svg-export.md) |
| 11 | 지정색으로 합성한 JPG와 투명도를 유지하는 WebP를 저장한다. | [PR #14](https://github.com/yourjinKR/drop-your-code/pull/14) · [검증](task-11-jpg-webp-export.md) |
| 12 | 현재 스냅샷을 2× PNG로 복사한다. 편집기의 복사 단축키는 텍스트를 복사한다. | [PR #15](https://github.com/yourjinKR/drop-your-code/pull/15) · [검증](task-12-png-clipboard.md) |

작업 7–9는 `fc1bade`, 작업 10–12는 `bdd38ad`에서 `main`에 반영됐다.

## 검증 결과

작업 12의 Windows 검증에서 TypeScript 검사와 production 빌드가 통과했다. Vitest 147개와 Playwright Chromium 69개가 통과했다. 설치된 Chrome·Edge에서 네 형식 다운로드와 PNG 복사·붙여넣기를 확인했다. 로드된 JavaScript 자산을 사용한 열린 페이지에서는 오프라인 Preview와 출력 중 새 HTTP 요청이 없었다. 준비된 200줄 JavaScript의 2× PNG 다운로드 시작은 5회 모두 2초 이내였다. [명령, 브라우저 버전, 측정 조건](task-12-png-clipboard.md)

## 알려진 제한과 점검 항목

- **긴 코드의 PNG 복사와 래스터 저장.** 앱은 한 변 16,384px 또는 전체 33,554,432픽셀을 넘는 캔버스 생성을 중단한다. 전체 픽셀 상한에서 RGBA 버퍼 하나는 128 MiB를 사용한다. Windows Chrome에서 기본 스타일의 짧은 380줄(2×에서 832×16,340px)은 복사됐고, 382줄(832×16,424px)은 PNG 복사와 저장이 모두 제한됐다. 377줄의 넓은 출력(2,094×16,214px)은 전체 픽셀 상한에 걸렸으며 같은 문서를 SVG로 저장했다. 글꼴·패딩·줄 너비에 따라 제한에 도달하는 줄 수가 달라진다. [인코더의 제한](../../src/export/encodeSnapshot.ts)
- **브라우저와 붙여넣기 대상.** Windows의 Firefox·WebKit, 실제 Safari/macOS, Windows 네이티브 이미지 앱은 미검증이다. 독립 SVG는 대상 시스템의 글꼴에 따라 자폭이 달라질 수 있다. [출력 호환성 기록](task-10-png-svg-export.md) · [복사 검증 범위](task-12-png-clipboard.md)
- **오프라인과 빌드.** 오프라인 출력은 이미 로드한 자산으로 확인했다. 미로드 언어, 오프라인 새 방문, Vercel 배포는 이번 검증 범위 밖이다. production 빌드에 500 kB 초과 청크 경고가 남아 있다. [Phase 2 검증 기록](task-12-png-clipboard.md)

## Phase 3 재개

1. **점검** — 현재 빌드에서 코드 입력, 스타일 설정, Preview, 저장과 복사를 확인한다. 긴 코드와 좁은 화면에서 발견한 문제는 환경, 재현 조건, 실제 결과를 기록한다.
2. **피드백** — 사용 중 발견한 불편과 오류를 모아 수정할 항목과 후속으로 남길 항목을 정한다.
3. **수정** — 이번에 반영하기로 한 항목을 작업별로 구현하고 검증한다.
4. **안정화** — 수정한 사례를 재현해 확인하고, 편집·미리보기·출력의 관련 회귀 검증을 실행한다. 남은 제한과 후속 항목을 기록한다.

위 순서를 마친 뒤 Phase 3 기능 작업을 재개한다. Phase 3의 범위는 로컬 설정 저장, 코드 히스토리, 출력 배율 선택, 자동 언어 감지, 반응형 레이아웃, 단축키 안내다. [PRD §9](../product/PRD.md#9-개발-단계)
