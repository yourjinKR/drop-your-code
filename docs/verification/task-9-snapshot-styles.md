# Task 9 — 스냅샷 스타일 검증

Windows x64, Node 22.23.2, Playwright Chromium 158.0.8127.18에서 production preview를 검증했다.

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run test` | 107개 통과 |
| `npm run test:browser -- --project=chromium --workers=2` | production build 및 전체 60개 통과 |
| `npm run test:browser -- tests/browser/snapshot-styles.spec.ts tests/browser/snapshot-preview.spec.ts --project=chromium --workers=1` | 5개 통과 |

긴 한글 제목의 말줄임과 원문 보존, 언어 아이콘, 창 모서리, 두 구문 테마, 시스템 스택과 Courier New, 글자 크기·줄 간격·패딩, 범위를 벗어난 숫자에서 이전 Preview 유지와 오류 복구를 확인했다. 바깥 패딩 0의 투명 이미지에서 가장자리 alpha 0, 반투명 그림자, 창 내부 RGB `[29, 31, 36]` 및 alpha 255를 확인했다. 투명 설정을 해제하면 이전 단색이 돌아왔다.

단일 Chromium 워커에서 300줄 JavaScript를 한 번 표시한 뒤 글자 크기를 15–21px로 바꿨다. Enter 이벤트부터 디코드된 이미지가 적용된 다음 animation frame까지 7회 측정했다. 범위는 52.9–76.2ms, 중앙값은 58.6ms였다. 이 수치는 Windows의 로컬 시스템 폰트와 해당 세션의 준비된 언어 모듈을 사용한 관측값이다.

다른 OS·브라우저의 글꼴 자폭과 픽셀 일치 여부는 별도 호환성 검증 범위다. 빌드는 500 kB 초과 청크 경고를 보고했다.
