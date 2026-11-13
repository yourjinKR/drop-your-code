# Phase 1 작업 5 — 수동 언어 선택·구문 강조 검증

2026-11-13 · Windows / Node 22.23.2 / npm 10.9.8 / Playwright 1.65.0 Chromium. 시작점은 작업 4 PR #6이 병합된 `0e58b66`이다.

## 실행 결과

| 명령 또는 확인 | 결과 |
|---|---|
| `npm run test -- tests/unit/language-registry.test.ts tests/integration/language-selection.test.tsx` | 20개 통과. 구현 전에는 언어 레지스트리가 없어 새 통합 테스트가 실패했다. |
| `npm run test` | 단위·통합 85개 통과. |
| `npm run test:browser -- tests/browser/languages.spec.ts --project=chromium --workers=4` | 프로덕션 빌드에서 18개 통과. 14개 언어의 붙여넣기·한글 원문·대표 구문색·Enter·Tab·주석·언어 전환 후 Undo, 네트워크 경합·실패·재연결, 요청 범위를 검증했다. |
| `npm run test:browser -- --project=chromium --workers=4` | 기존 입력·키맵·셸 검증을 포함해 44개 통과. |
| `npm run typecheck`, `npm run build` | 모두 성공. Vite의 500 kB 청크 크기 경고가 남는다. |
| `agent-browser`에서 프로덕션 미리보기 확인 | 1280px에서 `Properties`가 편집기 오른쪽이고 Python 선택 후 상태와 강조가 바뀐다. 360px에서는 아래에 놓이며 선택과 원문을 유지하고 페이지 가로 넘침이 없다. |

## 언어별 확인 범위

아래 버전은 `package-lock.json`에 고정되어 있다. [CodeMirror 공식 언어 목록](https://github.com/codemirror/language-data/blob/main/src/language-data.ts)과 [legacy-modes API](https://github.com/codemirror/legacy-modes)를 확인했다. 코드는 fixture이고 문법 전체 호환성을 의미하지 않는다.

| 언어 | CodeMirror 로더 | 대표 강조 | Enter / 주석 |
|---|---|---|---|
| Plain Text | 없음 | 강조 없음 | 기존 들여쓰기 / 변경 없음 |
| Java | `lang-java` 6.0.2 | 클래스 키워드·문자열·주석 | 블록 / `//` |
| Kotlin | `legacy-modes` 6.5.5, `mode/clike`의 `kotlin` | `fun`·문자열·주석 | 블록 / `//` |
| JavaScript | `lang-javascript` 6.2.5 | `return`·문자열·주석 | 함수 / `//` |
| TypeScript | `lang-javascript` 6.2.5, `typescript: true` | `interface`·문자열 리터럴 타입·주석 | 인터페이스 / `//` |
| Python | `lang-python` 6.2.1 | `return`·문자열·주석 | 함수 / `#` |
| SQL | `lang-sql` 6.10.0 기본 dialect | `SELECT`·문자열·주석 | 문장 종료 후 들여쓰기 해제 / `--` |
| JSON | `lang-json` 6.0.2 | 키·문자열 | 객체 / 변경 없음 |
| YAML | `lang-yaml` 6.1.3 | 키·문자열·주석 | 중첩 행 들여쓰기 유지 / `#` |
| HTML | `lang-html` 6.4.12 | 태그·속성값·주석 | 요소 / `<!-- -->` |
| CSS | `lang-css` 6.3.1 | 속성·문자열·주석 | 선언 블록 / `/* */` |
| XML | `lang-xml` 6.1.0 | 태그·속성값·주석 | 요소 / `<!-- -->` |
| Shell | `legacy-modes` 6.5.5, `mode/shell`의 `shell` | `if`·문자열·주석 | 기존 들여쓰기 / `#` |
| Markdown | `lang-markdown` 6.5.2, `addKeymap: false` | 제목·HTML 주석 | 기존 들여쓰기 / `<!-- -->` |

Kotlin/Shell은 `StreamLanguage.define`을 `LanguageSupport`로 감싼다. Kotlin의 간단한 블록 들여쓰기와 Shell의 Bash 스타일 기본 강조는 확인했지만 스트림 토크나이저는 완전한 구문 트리나 문법 검증기가 아니다. Shell 모드에는 구조적 들여쓰기 콜백이 없다. `Tab`으로 들여쓰거나 기존 줄의 들여쓰기를 이어갈 수 있다. Markdown fenced code에 개별 언어 파서를 추가 로딩하는 기능은 포함하지 않았다.

## 초기 로딩·오프라인 경계

- 프로덕션 Plain Text 진입 시 초기 JS 하나만 요청했다. Vite 기준 초기 JS 514.47 kB(gzip 164.37), CSS 3.56 kB(gzip 1.25)다. 작업 4 기록 대비 초기 JS가 약 29.48 kB(gzip 9.87) 늘었으며 언어 자산은 14개 비동기 청크(합계 377.70 kB, 개별 gzip 합계 150.26 kB)로 분리됐다. JS/TS와 HTML의 포함 문법 등은 일부 청크를 공유한다. 초기 2초 목표와 300줄 편집 지연의 정량 검증은 남아 있다.
- 늦게 성공하거나 실패한 선택은 최신 적용값을 덮어쓰지 않았다. 실패 후에도 현재 문서와 정상 언어를 유지한다. 언어 로딩 네트워크 검증은 같은 출처의 `GET`만 관찰했고 사용자 코드가 요청에 포함되지 않았다.
- 열린 페이지에서 Java를 로드한 뒤 네트워크를 끊어도 재선택할 수 있었다. 연결이 이미 끊긴 상태에서 처음 고른 Shell은 요청하지 않고 오류를 표시했으며, 재연결 뒤 `Retry`로 적용됐다. 전체 미선택 자산 준비나 새 오프라인 방문은 검증하지 않았다.
- 브라우저가 실패한 모듈을 기록하면 같은 URL의 동적 import는 재시도에도 실패할 수 있다. [Vite 공식 안내](https://vite.dev/guide/troubleshooting.html#failed-to-fetch-dynamically-imported-module) 참조. 청크를 차단한 테스트에서는 오류 안내, 원문 보존, 다른 언어 선택, Undo를 확인했다. 자동 새로고침은 하지 않으며 사용자가 복사한 뒤 새로고침할 수 있게 안내한다.
- 실제 모바일 기기, Safari/Firefox, macOS 단축키 및 실물 한글 IME는 이번에 검증하지 않았다. 기본 테마 전환과 전체 셸은 작업 6, 자동 감지와 전체 오프라인 자산 준비는 후속 단계다.
