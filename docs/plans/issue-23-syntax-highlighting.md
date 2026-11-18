# 이슈 23 — IDE 문법 기반 구문 강조

[#23](https://github.com/yourjinKR/drop-your-code/issues/23) · PRD FR-LANG-01·03, FR-EXPORT-04

JetBrains의 [Java와 Kotlin 확장](https://www.jetbrains.com/help/intellij-vscode/About-instance.html)은 프로젝트 분석용 언어 서버를 사용한다. [Shiki](https://shiki.style/guide/)는 브라우저에서 VS Code와 같은 TextMate 방식으로 기존 문법을 실행할 수 있다. Shiki에 IntelliJ 계열의 코드 색상을 적용하고, CodeMirror는 편집 동작을 담당한다.

- [x] 현재 지원 언어의 TextMate 문법을 정적 번들에 포함하고 언어 선택 시 필요한 파일만 불러온다.
- [x] Dark·Light의 범용 TextMate 색상 규칙을 적용하고 Java 애너테이션과 인수의 문자열을 검증한다.
- [x] 편집기와 미리보기·출력이 동일한 토큰 데이터를 사용하도록 연결한다. 문법 로드를 기다리는 중에도 편집과 다른 언어 선택이 동작하는지 확인한다.
- [x] 단위·통합 검증과 브라우저 언어·편집·출력 검증을 실행한다.

앱에서 볼 수 있는 범위는 스니펫의 문법이다. 예시에서 `@Profile` 사용 위치는 구분할 수 있으며, import 경로에 나타난 `Profile`의 실제 타입은 IntelliJ의 프로젝트 분석이 제공하는 정보다. 10,000자 이상의 단일 행에는 기본 전경색을 적용한다.

## 검증

- `npm run typecheck`와 `npm run test -- --maxWorkers 4`를 실행했다. 단위·통합 테스트 150개가 통과했다.
- Windows Chrome의 프로덕션 빌드에서 모든 기존 언어, 편집 동작, PNG·SVG·JPG·WebP 다운로드와 PNG 복사를 확인했다. Markdown 제목 색을 수정한 후 `languages.spec.ts`와 `png-svg-export.spec.ts`의 23개 테스트가 통과했다.
