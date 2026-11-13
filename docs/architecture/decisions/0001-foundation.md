# ADR 0001 — 클라이언트 편집기 기반과 검증 경계

- 날짜: 2026-11-07
- 상태: **설계 방향 채택, 기술 후보의 실험·버전 검증 대기**
- 기준: [AGENTS.md](../../../AGENTS.md), [PRD §§4·6·7·9](../../product/PRD.md)

## 작업 1 후속 기록 (2026-11-07)

React 19.3.1·TypeScript 7.0.2·Vite 8.3.6과 플러그인 6.2.1을 선택해 정적 셸을 구현했다. Vite 변환과 별도로 `tsc --noEmit`을 실행하며 앱·테스트·구성 모두 strict 검사에 포함한다. Vitest/Testing Library/jsdom과 Playwright를 개발 의존성으로 도입했고, Node 조건은 전체 검증 도구의 교집합으로 정했다. CodeMirror는 아직 사용하지 않으므로 실제 설치는 편집기 작업으로 남겼다. 선택 버전의 공식 metadata·검증 결과·미실행 항목은 [작업 1 보고서](../../verification/task-1-static-app.md)에 기록한다. 아래 최초 설계의 편집·렌더링·키맵·저장 결정은 후속 작업에서 검증한다.

## 맥락과 선택

### Phase 2 렌더러 결정

전용 SVG의 텍스트와 도형으로 창을 구성한다. 동일한 전체 문서를 넣은 DOM 캡처 후보의 `<foreignObject>`는 Chromium에서 이미지로 디코드되지만, Canvas에 그린 뒤 픽셀을 읽으면 `SecurityError`가 발생했다. 전용 SVG는 투명 바깥 영역, 반투명 그림자, 불투명 코드 창과 지정 배경색을 같은 경로에서 읽을 수 있었다. 외부 URL이나 임베드 폰트 없이 시스템 글꼴 스택을 사용한다. 다른 OS나 독립 뷰어의 대체 글꼴은 자폭이 달라질 수 있다. 이 비교는 대표 fixture와 Chromium의 SVG 이미지 경로를 대상으로 한다. 재현 명령, 측정값, 호환성 범위는 [Task 7 검증](../../verification/task-7-snapshot-layout.md)에 기록한다.

Editor 논리 폭은 320–960px로 제한하고 화면 안에서 추가로 축소한다. Wrap을 끈 Editor는 가로 스크롤을 사용한다. 스냅샷에서 논리 상한을 넘는 행은 grapheme 경계에서 이어 접어 전체 내용을 포함한다. 스냅샷의 줄 번호는 원래 행에서 한 번 표시한다.

PRD §7은 후보 목록이다. 이번 작업은 문서만 작성하며 패키지 설치·프로젝트 초기화·실험을 하지 않았다. TypeScript strict, 정적 배포, 서버·DB·인증 없음, 코드·히스토리 외부 전송 금지는 필수 제약이다.

| 선택 | 이유와 비용 / 확정하지 않은 부분 |
|---|---|
| React + TypeScript strict + Vite를 Phase 1 우선안으로 채택 | 정적 SPA와 UI 상태·편집기 수명 관리에 적합하다는 설계 판단. Vite는 TS 타입검사를 대신하지 않으므로 별도 `tsc --noEmit` 필요. 실제 호환 버전과 Node 요구 버전은 첫 구현 시 공식 문서로 재확인하고 잠금 파일로 고정 |
| CodeMirror 6 직접 어댑터 우선 | 확장·키맵·부분 설정 재구성 API를 활용할 수 있음. IDE 프리셋이 그대로 제공된다고 가정하지 않고 명령별 구현·검증. React 렌더마다 편집기 재생성 금지 |
| React state/reducer로 공통 문서·설정 관리 | 초기에는 별도 상태 관리 의존성 없이 단일 원본 유지. 선택·Undo·IME는 편집기에 남기고 SnapshotInput은 순수 투영. 성능 문제 확인 전 Worker나 복잡한 저장소 추상화 도입 안 함 |
| CodeMirror 언어/테마를 첫 강조 원천으로 검토 | 편집·출력 간 토큰/색상 불일치를 줄이려는 제안. 전 문서 토큰 추출과 legacy mode 품질은 미검증. Shiki는 대안이며 두 강조 엔진을 처음부터 함께 넣지 않음. Tailwind도 후보일 뿐 기본 스타일은 CSS로 시작하는 안 |
| 전용 SVG를 Phase 2 첫 실험 대상으로 선택 | 전체 코드·벡터 표현에 유리할 수 있음. DOM 캡처 대비 미리보기·폰트·줄바꿈·그림자 일치를 실험 후 최종 결정. 래스터를 SVG에 삽입하는 방식으로 벡터 목표를 충족했다고 하지 않음 |
| 언어/추가 테마 지연 로딩 + 열린 페이지의 자산 준비 실험 | 초기 편집 속도와 오프라인 요구를 함께 만족시키려는 안. 아직 받지 않은 청크는 단절 후 실패할 수 있음. 준비 완료 후 모든 초기 언어·테마 전환까지 검증하며 서비스 워커/PWA는 필수로 정하지 않음 |
| Phase 3의 작은 설정은 LocalStorage 우선 검토 | 단순한 정적 앱에 적합하다는 판단. 동기 쓰기·접근 차단·quota·JSON 손상 처리 필요. 히스토리 비용이 크면 IndexedDB 비교. 최대 20개, 중복 갱신, 오래된 항목 정리·삭제·저장 끄기 필수 |

## 위험을 닫는 조건

1. **키맵(Phase 1):** Windows PRD 표의 9개 명령, 특히 IntelliJ `Ctrl+Y` 삭제와 VS Code `Ctrl+Y` Redo를 분리한다. 편집기 밖 무개입, 전환 시 문서·선택·Undo 보존, IME·일반 텍스트 복사/잘라내기·Tab 탈출을 확인한다. macOS는 IDE 공식 기본표와 개별 대응하고 실제 브라우저에서 확인한다. OS 선점 키는 대체 동선과 제한을 기록한다.
2. **언어(Phase 1):** 초기 언어 목록 모두를 작은 fixture로 로드·강조·주석·들여쓰기 검증한다. Kotlin/Shell의 legacy mode 등은 실제 패키지에서 확인한다. 언어 로더는 내용 자동 감지기가 아니며 자동 감지는 Phase 3이다. 선택 경합·실패 시 최신 선택과 원문을 보존한다.
3. **렌더러/폰트(Phase 2):** DOM 캡처와 전용 SVG를 동일한 200줄·긴 행·탭·공백·빈 마지막 줄·한글·이모지로 비교한다. 화면 밖 코드 포함, 줄바꿈·폰트·색상·여백·투명 외부/불투명 창·그림자 일치, 독립 SVG 재열기와 외부 요청 없음이 통과 조건이다. SVG 폰트 임베딩 라이선스·용량·독립 뷰어 호환성을 확인하고 실패 시 폰트 제한/다른 표현을 재결정한다.
4. **출력(Phase 2~4):** SVG의 코드가 벡터인지 확인한다. PNG/JPG/WebP는 실제 Blob MIME·픽셀 크기·투명도를 검사한다. 지원하지 않는 Canvas MIME 요청이 PNG로 대체될 수 있으므로 확장자만 변경하지 않는다. 1~4x, SVG 배율 무관, JPG 지정색 합성을 검증한다.
5. **오프라인(Phase 3~4):** 편집 준비와 전체 자산 준비를 구분한다. 초기 자산 준비 완료 후 네트워크를 끊고 미선택 언어·테마·주요 출력까지 성공해야 한다. 준비 전 단절/부분 실패는 안내하고 현재 편집을 유지한다. 초기 로딩 2초 목표와 준비 비용을 같은 고정 환경에서 측정한다. 새 오프라인 방문까지 보장한다고 확장 해석하지 않는다.
6. **저장(Phase 3):** 차단·손상·버전 불일치·quota·단일 대형 스니펫·삭제 실패에도 편집 유지. 오래된 기록 정리 후 제한된 재시도, 최대 20개·중복 갱신·복원·삭제·저장 끄기를 확인한다. 저장 성공 전 성공 메시지나 기존 정상본 제거를 하지 않는다.

실험 전에는 미리보기 일치·편집 반응성·SVG 호환성·오프라인·영속성을 보장한 것으로 간주하지 않는다. 수치·환경·검증 방법은 [테스트 전략](../testing/strategy.md), 비교 상세는 [아키텍처 개요](../overview.md), 첫 구현 단위는 [Phase 1 계획](../../plans/phase-1-editor-foundation.md)에 둔다.

## 확인한 공식 근거

2026-11-07 열람. 기능 근거와 이 저장소의 실험 결과를 구분한다. CodeMirror 문서 사이트 접근 제한으로 공식 소스의 API 주석을 함께 확인했다. 아래 GitHub 소스는 열람 시 보관(archived) 표시가 있는 공식 저장소의 기본 브랜치 링크이며 특정 커밋에 고정한 API 계약이 아니다. 실제 도입 버전의 공식 문서·소스를 다시 대조한다.

- [React: 외부 시스템과 Effect 동기화](https://react.dev/learn/synchronizing-with-effects), [TypeScript: strict](https://www.typescriptlang.org/tsconfig/strict.html), [Vite: TS 변환과 타입검사 분리](https://vite.dev/guide/features#typescript).
- CodeMirror 공식 API 주석: [KeyBinding의 OS별 키와 우선순위](https://github.com/codemirror/view/blob/main/src/keymap.ts), [Compartment 재구성](https://github.com/codemirror/state/blob/main/src/facet.ts), [EditorView의 viewport 기반 DOM](https://github.com/codemirror/view/blob/main/src/editorview.ts), [언어별 로더 목록](https://github.com/codemirror/language-data/blob/main/src/language-data.ts).
- IDE 대응 기준: [IntelliJ 단축키](https://www.jetbrains.com/help/idea/mastering-keyboard-shortcuts.html), [VS Code 키 바인딩](https://code.visualstudio.com/docs/configure/keybindings). PRD 표가 Windows 구현 목표이며 문서의 최신 키로 PRD를 임의 변경하지 않는다.
- [W3C SVG 2: foreignObject](https://www.w3.org/TR/SVG2/embedded.html#ForeignObjectElement), [CSS Font Loading](https://www.w3.org/TR/css-font-loading-3/). DOM 포함 기능이나 폰트 대기가 독립 SVG의 폰트 호환성까지 입증하지는 않는다.
- [WHATWG Canvas 직렬화](https://html.spec.whatwg.org/multipage/canvas.html#dom-canvas-toblob-dev), [Web Storage의 접근·용량 오류](https://html.spec.whatwg.org/multipage/webstorage.html).
