# 이슈 34 · 이미지 출력의 줄 바꿈

[#34](https://github.com/yourjinKR/drop-your-code/issues/34) · FR-EDIT-03, FR-EXPORT-01·03·04

1. `tests/unit/snapshot-layout.test.ts`에서 같은 긴 원본의 `Wrap lines` 켜짐과 꺼짐, 원본 줄바꿈, 마지막 빈 줄을 검증한다.
2. `src/snapshot/layout.ts`의 최소 폭 320px을 유지하고, 960px 상한은 줄 바꿈을 켠 경우에만 적용한다. 끄면 측정된 최장 원본 줄과 창 여백을 폭에 반영한다.
3. `src/snapshot/model.ts`에서 지원 브라우저의 줄 바꿈 지점을 측정해 SVG의 표시 줄을 구성한다. 코드 창과 같은 글꼴, 탭 간격, 줄 번호 폭을 사용하고 뷰포트에 표시되는 CodeMirror DOM과 독립적으로 전체 원본을 처리한다.
4. `tests/browser/snapshot-wrap.spec.ts`에서 SVG 전체 텍스트, PNG·JPG·WebP와 4× PNG 클립보드의 오른쪽 끝, 실제 편집기와 SVG의 표시 줄을 확인한다. 래스터 크기 한도는 현재 오류를 유지한다.
5. `npm test`, `npm run typecheck`, 관련 Playwright 테스트로 검증하고 PRD와 UI 문서에 적용 조건을 기록한다.
