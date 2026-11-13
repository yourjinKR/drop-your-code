# Task 12 — PNG 복사와 Phase 2 검증

Windows x64 10.0.26200, Node 22.23.2, Playwright Chromium 158.0.8127.18에서 로컬 production preview를 검증했다. Task 12는 PRD FR-EXPORT-03·04와 UC-01에 해당한다.

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run test -- tests/unit/copy-png.test.ts tests/integration/snapshot-export-actions.test.tsx` | 14개 통과 |
| `npm run test` | 147개 통과 |
| `npm run build` | 통과. 500 kB 초과 청크 경고 |
| `npm run test:browser -- --project=chromium --workers=2` | 69개 통과. `REPORT_EDITOR_TIMINGS=1`로 편집 측정 출력 |

## Phase 2 산출물

| 결과 | 검증 |
|---|---|
| 자동 크기 조절 | 최대 폭을 넘는 행, 300줄, 끝 개행, 작은 화면의 편집·출력. [Task 7](task-7-snapshot-layout.md) · [Task 10](task-10-png-svg-export.md) |
| Preview | Fit과 확대, 편집 상태 보존, 전체 문서. [Task 8](task-8-snapshot-preview.md) |
| 배경과 스타일 | 스타일 변경, 투명 가장자리·그림자·불투명 창. [Task 9](task-9-snapshot-styles.md) |
| PNG·SVG | 실제 서명과 픽셀, 배율, 독립 SVG 벡터·폰트 fallback. [Task 10](task-10-png-svg-export.md) |
| JPG·WebP | 실제 서명과 픽셀, JPG 대체색, WebP alpha와 미지원 처리. [Task 11](task-11-jpg-webp-export.md) |
| PNG 클립보드 | 실제 ClipboardItem과 PNG 디코딩, 지연된 모델의 최신 입력, JPG 선택 중 투명 PNG, 권한 거부 후 다운로드, 편집기 텍스트 복사 |

Playwright 번들 Chromium의 기본 설정은 이미지 쓰기를 거부했다. 성공 경로는 테스트 컨텍스트에 읽기·쓰기 권한을 부여했고, 권한 거부 경로는 `NotAllowedError`를 주입했다. 설치된 Chrome 157.0.8103.78과 Edge 157.0.4341.46에서는 권한 오버라이드 없이 클릭 후 브라우저 테스트 입력면에 Ctrl+V를 눌러 `image/png`와 832×422 치수를 확인했다. Windows 네이티브 이미지 앱 붙여넣기는 실행하지 않았다. Firefox·WebKit·Safari는 이 환경에서 실행하지 않았다.

JavaScript 자산을 준비한 열린 페이지를 오프라인으로 전환한 뒤 코드를 입력했다. Preview와 네 파일 다운로드, PNG 복사가 작동했고 새 HTTP 요청은 0건이었다. 미로드 언어와 오프라인 새 방문의 검증 범위는 기존 자산 준비 정책을 따른다.

## 로컬 production 성능

| 동작 | 조건 | 관측값 |
|---|---|---|
| 300줄 JavaScript 붙여넣기·편집 | 새 페이지, 언어 모듈 로드 후, 줄 번호·줄 바꿈 켬, 각 1회 | 붙여넣기부터 상태 반영 192ms, 끝줄 편집부터 두 번째 animation frame 17ms |
| 300줄 글자 크기 변경 | 모델과 언어 준비 후, Enter부터 디코딩된 Preview의 다음 animation frame, 7회 | 59.9–73.1ms, 중앙값 66.2ms |
| 200줄 JavaScript PNG 생성 | 준비된 모델, 기본 시스템 monospace, 2×, 클릭 명령부터 다운로드 이벤트, 5회 | 1298, 1319, 485, 1401, 1434ms. 5회 모두 NFR-04의 2초 이내 |
