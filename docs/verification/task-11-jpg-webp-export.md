# Task 11 — JPG·WebP 저장 검증

Windows x64, Node 22.23.2, Playwright Chromium 158에서 production preview를 검증했다. PRD FR-EXPORT-01·02·04와 §6.4에 해당한다.

| 명령 또는 실행 환경 | 결과 |
|---|---|
| `npm run test -- tests/unit/snapshot-export.test.ts tests/integration/snapshot-export-actions.test.tsx` | 32개 통과 |
| `npm run typecheck` | 통과 |
| `npm run build` | 통과. 500 kB 초과 청크 경고 |
| `npm run test:browser -- tests/browser/png-svg-export.spec.ts tests/browser/jpg-webp-export.spec.ts --project=chromium --workers=2` | 6개 통과 |
| Chrome 157.0.8103.78 / Edge 157.0.4341.46 | Playwright 채널의 320px 작업면에서 각 포맷 다운로드 완료 |

JPG 파일 서명과 2× 치수를 확인했다. 투명 바깥 영역은 지정색 `#f4d2a0`, 그림자 영역은 더 어두운 합성색, 코드 창은 기존 구문 테마 배경으로 디코딩됐다. 픽셀 검사는 평면 색의 채널별 허용 오차 5, 그림자 14를 사용한다. 외부 배경을 단색으로 설정하면 그 색을 JPG에 유지했다.

WebP 파일의 `RIFF`·`WEBP` 서명과 2× 치수, 외부 alpha 0, 반투명 그림자, 창 alpha 255와 300번째 줄의 렌더링을 확인했다. WebP 요청에 PNG를 반환하는 인코더를 주입했을 때 영어 오류를 표시하고, PNG를 다시 선택해 파일을 저장할 수 있었다.

Playwright Firefox·WebKit 바이너리는 이 환경에 설치되어 있지 않았다. 실제 Safari도 실행하지 않았다.
