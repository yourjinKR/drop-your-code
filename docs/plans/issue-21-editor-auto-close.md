# 이슈 21 — 따옴표와 괄호 자동 닫기

[#21](https://github.com/yourjinKR/drop-your-code/issues/21) · PRD FR-EDIT-01·02

CodeMirror 편집기에서 지원하는 여는 문자를 입력하면 닫는 문자가 생기고 커서가 중간에 놓인다. 선택한 코드에는 같은 짝을 씌운다. 자동 삽입된 닫는 문자 앞에서 같은 문자를 다시 입력하면 커서를 뒤로 이동한다. 빈 짝 사이에서 Backspace를 누르면 두 문자를 함께 지운다.

기본 짝은 큰따옴표와 `()`·`[]`·`{}`다. 언어 모드가 전용 문자 목록을 제공하면 그 목록을 따른다. 작은따옴표와 백틱도 언어 데이터에 따라 처리한다. 붙여넣기와 IME 조합에서 입력한 문자열을 보존하고, 기존 IntelliJ·VS Code 단축키를 유지한다.

- [x] `tests/browser/editor-input.spec.ts`에서 직접 타이핑, 선택 감싸기, 기존 닫는 문자, Undo, 빈 짝 삭제, 붙여넣기와 IME를 검증한다.
- [x] 현재 의존성 트리에 있는 `@codemirror/autocomplete` 6.20.4를 직접 의존성으로 선언한다. `createEditor`의 자동 닫기 확장과 `buildKeymap`의 Backspace 바인딩에 해당 API를 사용한다.
- [x] Java 문자열의 일반 및 이스케이프 따옴표 입력을 확인한다. 문맥을 검사할 때 기존 선택, Undo와 조합 입력을 보존한다.
- [x] 타입 검사·단위/통합 테스트와 Windows Chrome에서 편집기·프리셋·언어·스냅샷 복사 테스트를 실행한다.

## 검증 결과

- `npm ls @codemirror/autocomplete --depth=0`과 `npm install --package-lock-only --ignore-scripts --offline`으로 기존 6.20.4가 직접 의존성으로 해석되고 잠금 파일이 일치하는지 확인했다.
- `npm run typecheck`와 `npm run test -- --maxWorkers 4`를 실행해 타입 검사와 단위·통합 테스트 147개를 통과했다.
- 설치된 Windows Chrome에서 `npm run test:browser`로 편집기 입력 테스트 13개를 최종 실행했다. 같은 프로덕션 코드에서 앞서 실행한 키맵, 언어, 편집기 창, PNG 클립보드 테스트 42개도 통과했다. 임시 Playwright 설정으로 설치된 Chrome 채널을 선택했다.
- Redo로 닫는 짝까지 복원된다. Backspace 검증은 커서를 짝 사이에 둔 상태로 실행했고, 조합 입력은 브라우저 composition 이벤트로 재현했다.
