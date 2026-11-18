# 이슈 22 — 창 제목 표시와 인라인 편집

[#22](https://github.com/yourjinKR/drop-your-code/issues/22) · PRD FR-STYLE-01·FR-EXPORT-04

창 제목은 기본 숨김이다. `Properties → Window`의 `Show title`을 켜면 코드 창에서 같은 제목을 직접 편집할 수 있다. 편집기는 Enter 또는 포커스 이동으로 커밋하고 Escape로 취소한다. 빈 제목은 편집 창에 추가 동작을 제공하고 이미지에서는 제목을 생략한다.

직접 작성한 확장명은 보존한다. 확장명이 없으면 Java `.java`처럼 현재 언어의 기본 확장명을 표시한다. Plain Text는 입력한 제목을 그대로 표시한다. 이 계산은 문서의 제목 원문이나 이미지 파일명에 영향을 주지 않는다.

- [x] `SnapshotPresentation`에 `showTitle`을 도입하고 제목 옆 언어 아이콘을 제거한다. 언어 레지스트리의 확장명으로 편집 창과 SVG가 같은 제목을 표시한다.
- [x] Properties 입력과 창의 직접 편집을 공통 상태로 연결한다. Enter, Escape, 포커스 이동, 빈 제목 재편집을 검증한다.
- [x] 숨김 기본값과 언어 전환을 실제 브라우저에서 확인하고 SVG·PNG·JPG·WebP 및 PNG 복사 테스트를 실행한다.

## 검증 결과

- `npm run typecheck`와 `npm run test -- --maxWorkers 4`에서 타입 검사와 단위·통합 테스트 148개가 통과했다.
- `npm run test:browser`에서 설치된 Windows Chrome의 프로덕션 빌드로 제목 편집, 스타일, 미리보기, 다운로드 4종 및 PNG 복사 테스트 22개가 통과했다. 최종 포커스 스타일을 반영한 코드 창 테스트 6개를 다시 실행했다.
- 320px 터치 에뮬레이션에서 제목 버튼 44px, 제목 입력의 원문, Enter 후 제목 버튼 복귀 및 화면 폭을 확인했다.
