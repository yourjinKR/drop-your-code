# 아키텍처 개요

기준은 [PRD v1.0](../product/PRD.md)과 [AGENTS.md](../../AGENTS.md)다. `src/main.tsx`가 App을 마운트하며 `dist/`의 정적 자산만으로 동작한다. Phase 2 Task 11까지 공통 문서와 스타일을 읽는 SVG 미리보기와 PNG·SVG·JPG·WebP 다운로드를 제공한다. [Task 10 검증 결과](../verification/task-10-png-svg-export.md) · [Task 11 검증 결과](../verification/task-11-jpg-webp-export.md)

## 경계와 책임

| 영역 | 책임과 입력 → 출력 | 제외하는 책임 / 도입 단계 |
|---|---|---|
| 편집기 | CodeMirror 문서 변경을 공통 코드 상태에 반영. 선택·커서·IME 조합·Undo/Redo·키맵은 편집기에서 관리 | DOM을 이미지 원본으로 취급하지 않음. Phase 1 |
| 공통 코드·설정 상태 | 코드와 revision, 수동 언어 선택, 키맵, 테마, 줄 번호·줄 바꿈의 단일 논리 원본. 설정 변경과 코드 교체를 명시적 동작으로 처리 | CodeMirror 인스턴스·DOM·Blob·Undo 이력을 저장하지 않음. Phase 1; 스타일 설정은 Phase 2 확장 |
| 스냅샷 입력·모델 | 공통 상태에서 불변 `SnapshotInput`을 추출. 이후 전체 코드의 토큰·줄·폰트 지표·레이아웃을 가진 `SnapshotModel`로 변환 | 커서·선택·편집 스크롤·키맵을 이미지에 포함하지 않음. Phase 1은 입력 투영만, 실제 모델 생성은 Phase 2 |
| 렌더링 | 스냅샷 모델을 미리보기와 출력 표현으로 변환. 줄 수·최장 행·wrap·최소/최대 폭으로 레이아웃 계산 | 편집 트랜잭션·파일 저장·클립보드 API를 알지 않음. Phase 2 |
| 내보내기 | 클릭 시점의 `SnapshotInput`과 일치하는 모델 → SVG·PNG·JPG·WebP Blob → 다운로드 어댑터 | 인코더는 React UI와 편집기 DOM에서 독립. 배율 UI는 Phase 3 |
| 로컬 저장 | 검증된 설정과 최대 20개 스니펫의 읽기·쓰기·복원·삭제. 저장 오류를 결과로 반환 | UI와 편집을 중단시키거나 외부로 데이터를 보내지 않음. Phase 3 |

현재는 React reducer와 직접 연결한 CodeMirror 어댑터를 사용한다. 별도 전역 상태 라이브러리, React용 편집기 래퍼, Worker, 서비스 워커는 도입하지 않았다. 필요성과 측정 근거가 생기면 별도 결정한다.

작업 2의 상태 계약은 초기 코드 `''`·revision0, VS Code, 수동 Plain Text, Dark syntax, 줄 번호/wrap off다. `codeChanged`와 외부 교체용 `codeReplaced`는 원문이 다를 때만 revision을 증가시키고 동일 값은 기존 상태를 반환한다. 설정 변경은 코드/revision을 보존한다. 상태는 중첩 값까지 readonly이며 함수는 이전 상태를 수정하지 않는다. reducer는 개행·공백을 정규화하지 않는다. CodeMirror 입력은 CRLF/CR을 LF로 정규화하고 마지막 빈 줄을 유지한다. 외부 props는 `state.toText(code)`와 `doc.eq`로 비교해 같은 문서를 반복 dispatch하지 않으며, 정규화만을 이유로 부모 props를 다시 쓰는 callback은 보내지 않는다.

`SnapshotInput`은 `code`, `revision`, `languageId`, `themeId`, `lineNumbers`, `wrap`만 가진 새 평면 객체다. readonly는 TypeScript 계약이며 runtime freeze를 제공하지 않는다. 모든 값이 primitive이므로 원본의 중첩 가변 객체를 공유하지 않는다. `themeId`는 Syntax theme이고 UI theme·패널·Zoom·키맵·커서·Undo·저장 상태는 출력 입력에 포함하지 않는다. 설정 변경의 렌더 경합은 아래 요청 ID 계약으로 구분하며 코드 revision만으로 최신 렌더를 판단하지 않는다.

`getBasicTheme(themeId)`는 DOM에 의존하지 않는 색 데이터를 반환한다. 편집 창은 이 값으로 창 테두리와 제목을 그리고 CodeMirror는 구문색과 편집기 전경·배경을 적용한다. 구문 테마, 줄 번호와 줄 바꿈은 별도 compartment를 통해 같은 EditorView에 반영한다. UI 테마와 Properties 표시 여부는 App의 UI 상태로 관리한다.

### 현재 편집기 어댑터

`src/editor/createEditor.ts`는 history·선택한 preset keymap·Tab 들여쓰기·변경 listener를 구성한다. `src/editor/EditorSurface.tsx`는 mount/cleanup에서 view를 생성/정리하고 최신 commit의 callback을 참조한다. App은 lazy reducer와 안정적인 callback으로 변경을 반영한다. 키 입력·부모 echo·callback 교체 때문에 view를 다시 만들지 않는다.

외부 교체는 다른 문서일 때 한 transaction에 `externalCodeChange` annotation을 붙이고 selection의 anchor/head를 새 길이에 맞춘다. listener는 이 변경을 다시 onCodeChange로 보내지 않는다. 현재 외부 교체는 기본 history에 들어가며 인접 편집과 묶일 수 있다. Phase 3의 History 복원 Undo 정책을 이미 확정한 것으로 보지 않는다.

keymap/language/theme/lineNumbers/wrap Compartment는 생성 시 한 번 등록한다. keymap은 preset 변경 때 그 slot만 reconfigure하고 같은 view·문서·선택·Undo를 유지한다. 이미 적용한 preset은 다시 구성하지 않는다. 나머지 slot은 비어 있으며 작업 5~6의 연결 지점이다. Escape는 바인딩하지 않아 선택이 있는 경우에도 내장 Escape 다음 Tab 탈출을 사용한다.

`src/editor/keymaps.ts`는 Windows PRD 목표와 별도로 조사한 macOS 조합을 구성한다. `other`는 Windows 목표 fallback이다. 공통 historyKeymap을 덧붙이지 않아 IntelliJ Ctrl+Y가 Redo로 fall through하지 않는다. preset과 기본 탐색 명령 모두 editor focus·composition 상태를 확인하고 처리하지 않은 키의 default 동작을 강제로 막지 않는다. Cut/Copy는 native clipboard handler를 유지한다. 전역 키 listener·키맵 저장은 없다.

줄 삭제·잘라내기·이동·복제·들여쓰기/내어쓰기 transaction은 `isolateHistory('full')`로 타이핑 그룹과 분리한다. 빠른 입력 직후 줄 삭제/내어쓰기를 Undo해도 입력 원문이 복원된다. 이 정책은 문서가 바뀐 특정 userEvent에만 적용하며 preset/selection 변경·일반 타이핑·외부 문서 복원 정책을 바꾸지 않는다. 언어 주석 이력은 작업 5의 언어 통합에서 별도로 검증한다.

## 데이터 흐름

1. Phase 1은 메모리 기본값으로 시작한다. Phase 3에서는 로컬 설정을 읽어 스키마·값 범위를 검증하고 기본값과 병합한다. 읽기 실패 시 기본값으로 편집을 시작하고 복원 실패를 알린다.
2. 사용자 입력은 CodeMirror transaction → 변경 알림 → 공통 문서 `{ code, revision }` 갱신으로 흐른다. 편집기 내부 문서는 상호작용용 표현이며 별도 제품 원본이 아니다. React 갱신마다 편집기를 재생성하거나 동일 코드를 다시 dispatch하지 않는다.
3. 언어·키맵·테마는 설정 상태 → 편집기 확장 재구성으로 반영한다. 코드·선택·Undo 이력을 보존한다. 외부 코드 복원은 명시적인 문서 교체 동작으로 구분해 순환 업데이트를 막는다. 복원 시 Undo 정책은 Phase 3에서 테스트와 함께 확정한다.
4. `selectSnapshotInput(workspace)`는 전체 코드와 현재 언어·테마·줄 번호·줄 바꿈을 불변 입력으로 제공한다. Phase 2에서 창 제목·아이콘·폰트·패딩·배경 등 스타일 필드를 추가한다. 키맵이나 저장 상태는 이 입력에 넣지 않는다.
5. Phase 2 렌더러는 전체 문서를 토큰화·측정한다. 화면에 보이는 CodeMirror DOM이나 viewport만 읽지 않는다. 폰트 준비 후 같은 모델을 미리보기와 출력에 사용한다. 오래된 비동기 결과는 revision/요청 식별자로 폐기한다.
6. 복사·내보내기는 클릭 시 최신 입력을 고정하고 그 입력의 모델을 준비한다. 미리보기가 뒤처져도 오래된 이미지를 저장하지 않는다. 느린 측정·토큰화·인코딩이 입력 처리 경로를 막지 않도록 분리한다. 작업 분할/Worker 도입은 성능 실험 후 결정한다.
7. Phase 3 저장은 변경 후 예약·중복 병합하여 실행한다. Undo 스택과 최근 스니펫 히스토리는 별개다. 복원은 공통 문서 교체로 들어오며 편집·미리보기·출력이 다시 같은 상태를 사용한다.

## 스냅샷 렌더링 선택

Task 7에서 DOM 캡처와 전용 SVG를 비교해 전용 SVG를 채택했다. Task 10은 같은 SVG 직렬화를 독립 파일과 래스터 원본에 사용한다. [ADR 0001](decisions/0001-foundation.md)

| 평가 항목 | DOM 캡처 | 전용 SVG 생성 |
|---|---|---|
| 벡터 | Canvas를 감싼 SVG는 래스터다. DOM을 `foreignObject`로 감싸는 방법도 순수 SVG 텍스트/도형과 구분하고 사용처 호환성을 확인해야 함 | `text`/`tspan`/도형 중심의 벡터 표현 가능성이 있으나 실제 결과 검증 필요 |
| 폰트 | 화면 CSS를 재사용하기 쉬우나 캡처 시 폰트 로딩·외부 CSS·CORS·임베딩 방식 영향을 받음 | 폰트 지표와 SVG 사용처의 폰트 지원이 핵심 위험. 로컬 폰트 묶음/임베딩의 라이선스·용량·호환성 실험 필요 |
| 미리보기 일치 | 화면과 비슷한 출발점. CSS·그림자·브라우저별 캡처 차이는 별도 검증 | 같은 모델/테마 토큰을 재사용해도 SVG와 편집기 사이 글리프 폭·줄바꿈·베이스라인 차이가 생길 수 있음 |
| 화면 밖 코드 | 가상화 편집기 DOM 직접 캡처는 전체 문서를 보장하지 않음. 전체 코드를 가진 별도 렌더링 면 필요 | 전체 코드 입력으로 모델을 만들면 viewport와 독립 가능. 모든 줄 포함 여부는 실제 출력으로 확인 |
| 비용 | 구현이 간단할 수 있으나 패키지·DOM/CSS 복제·브라우저 제약 비교 필요 | 레이아웃 구현 비용이 크며 공백·탭·한글·이모지·줄바꿈 측정 검증 필요 |

SVG에 외부 URL·사용자 HTML·스크립트를 넣지 않는다. 텍스트와 속성을 안전하게 직렬화한다. SVG는 배율과 무관한 벡터를 유지하고 래스터는 1x~4x(기본 2x)를 적용한다. PNG/WebP/SVG의 외부 배경은 투명 가능하되 코드 창 배경은 항상 불투명하다. JPG는 선택한 불투명 배경색으로 합성한다. Canvas 인코딩의 MIME 지원·크기 한계·메모리 실패는 실제 결과를 확인하며 조용히 다른 포맷으로 저장하지 않는다.

`src/export/encodeSnapshot.ts`는 PNG·JPG·WebP를 목표 픽셀 치수의 SVG에서 다시 렌더링한다. JPG는 Canvas에 대체색을 먼저 채우고, WebP는 실제 MIME이 `image/webp`일 때만 파일을 생성한다. Canvas 한 변은 최대 16,384px, 전체는 최대 33,554,432픽셀이다. 이 예산에서 RGBA 버퍼 하나는 최대 128 MiB이며 디코더와 인코더는 별도 메모리를 사용할 수 있다. 한계를 넘으면 SVG 저장을 안내한다.

## 키맵과 포커스

FR-EDIT-02의 Windows 표를 구현 목표로 삼는다. 특히 `Ctrl+Y`는 IntelliJ의 줄 삭제, VS Code의 Redo이므로 공통 기본 키맵과 충돌하지 않게 프리셋을 명시적으로 구성한다. CodeMirror 기본 키맵이 IDE 프리셋 완제품이라고 가정하지 않는다.

키 처리는 편집기 포커스 안에서만 한다. 설정 입력·대화상자·브라우저에는 전역 편집 단축키를 적용하지 않는다. 일반 `Ctrl/Cmd+C`는 텍스트 복사이고 이미지 복사는 별도 버튼이다. `preventDefault`는 실제 처리 가능한 바인딩에만 적용하며 IME 조합 중 편집 명령을 방해하지 않는다. Tab 들여쓰기를 유지하면서 편집기 밖으로 이동할 키보드 탈출 방법을 제공한다.

macOS는 Windows의 Ctrl를 일괄 Cmd로 바꾸지 않는다. IDE 공식 기본 키맵과 비교한 명령별 매핑표를 작성하고 실제 macOS 브라우저로 확인한다. 운영체제/브라우저가 선점하는 조합은 강제로 가로챌 수 있다고 약속하지 않는다. 대체 메뉴 또는 조합, 안내를 기록한다. Windows Chrome/Edge를 먼저 검증하되 macOS·Firefox·Safari 검증은 MVP 완료 전 필요하다.

## 지연 로딩과 열린 페이지 오프라인

작업 5의 `languages.ts`는 지원 ID를 각 CodeMirror 로더에 명시적으로 연결한다. 열린 페이지에서 성공한 `LanguageSupport`를 재사용하며 실패한 Promise는 캐시에서 제거한다. `LanguageSelect`는 최신 성공만 workspace의 수동 언어와 편집기의 language compartment에 전달한다. 입력 문서, 선택, Undo를 소유하는 `EditorView`는 유지된다. 검증 결과와 실패한 모듈의 재시도 제약은 [작업 5 기록](../verification/task-5-languages.md)에 있다.

PRD §6.2는 초기 로드 후 **열린 페이지**에서 주요 기능의 오프라인 사용을 요구한다. 새 오프라인 방문·오프라인 새로고침까지의 PWA 보장은 별도 범위다. `import()`만 사용하면 아직 불러오지 않은 청크가 오프라인에서 실패할 수 있으므로 요구 충족으로 간주하지 않는다.

제안은 기본 Plain Text·기본 테마·편집 명령을 초기 제공하고, 언어/추가 테마를 명시적 로더 목록으로 나눈 뒤 첫 편집 가능 시점 이후 모든 초기 지원 자산을 백그라운드에서 준비하는 것이다. 폰트·후속 출력 자산도 포함해 **편집 준비**와 **오프라인 준비 완료** 시점을 구분한다. 서버는 정적 앱 자산만 제공하며 사용자 코드는 요청에 포함하지 않는다.

초기 로드 완료의 제품 판정은 이 준비 시점과 함께 실험으로 확정해야 한다. 준비 후 네트워크를 끊고 미선택 언어·테마까지 전환해 통과해야 하며, 일찍 연결이 끊긴 경우 실패한 자산·재시도 상태를 알리고 현재 편집을 유지한다. 경고만 표시하는 것을 최종 오프라인 요구 통과로 보지 않는다. 초기 2초 목표와 전체 준비 비용을 함께 측정해, 필요하면 작은 자산 선번들/정적 캐시 방식과 비교한다.

## 저장 실패와 용량

설정은 작은 버전 지정 JSON의 LocalStorage를 우선 검토한다. 히스토리는 별도 키에 최대 20개, 동일 코드 문자열은 기존 항목의 시각을 갱신하는 방식으로 제안한다. 정확한 저장 시점은 Phase 3에서 결정하되 매 키 입력마다 동기 저장하지 않는다. 코드 데이터가 커서 반응성을 해치면 IndexedDB를 별도 검토하며 서버로 옮기지 않는다.

- 접근·읽기·파싱·스키마 불일치·쓰기·삭제의 실패를 각각 처리한다. 브라우저별 고정 용량을 사실로 가정하지 않는다.
- 용량 초과는 오래된 히스토리부터 정리 후 제한된 횟수로 재시도한다. 마지막 항목도 담기지 않으면 편집 중 코드는 메모리에 유지하고 저장 실패를 알린다. 설정이나 다른 origin 데이터를 지우지 않는다.
- 최근 정상 저장본은 새 값 저장 성공 전 임의로 삭제하지 않는다. 자동 정리가 필요한 경우에도 삭제 범위·성공 여부를 확인하고 무한 재시도를 막는다. 여러 키 변경이 원자적이라고 가정하지 않는다.
- 히스토리 자동 저장 끄기와 기존 기록 삭제를 구분한다. 항목 삭제·전체 삭제·현재 코드 지우기를 제공하고, 스니펫 삭제가 Undo 스택까지 삭제한다는 오해를 만들지 않는다.
- 브라우저 저장소 삭제·시크릿 모드에서 영속성을 보장하지 않는다. 실패해도 편집·미리보기·파일 저장은 계속 가능하도록 설계한다.

## 후속 실험과 통과 조건

| 실험 | 단계 | 통과 조건 |
|---|---|---|
| 편집기 어댑터/키맵 | Phase 1 | 입력·IME·Undo/Redo 유지, 프리셋 전환 시 문서/선택 보존, Ctrl+Y 분리, 포커스 밖 무개입. 300줄 고정 입력의 지연을 기록하고 합의한 예산과 비교 |
| 언어/테마와 오프라인 | Phase 1 로더 기초, Phase 3 준비 정책·Phase 4 성능 확정 | 초기 언어 목록 전부 로드/강조 가능, 선택 경합 시 최신 선택 유지. 오프라인 준비 후 미사용 자산 전환과 편집 성공, 실패 시 코드/설정 보존 |
| DOM 대 SVG | Phase 2 | 200줄·긴 행·탭·공백·빈 마지막 줄·한글·이모지에서 모든 줄 포함. 미리보기 대비 줄 수/줄바꿈/배경/폰트 일치, SVG에 래스터 코드 면 삽입 없음, 외부 요청 없이 재열기. Chrome/Edge 우선, Firefox/Safari 확대 |
| 폰트/출력 | Phase 2, Phase 4 확대 | 폰트 준비 전 출력 방지, 선택 폰트 없는 환경에서 호환성 정책 입증. 4포맷·1~4x·투명도·그림자·JPG 합성·MIME 확인. 200줄 2초 목표는 고정 환경에서 측정 |
| 저장 실패 | Phase 3 | 차단·손상 JSON·이전 스키마·quota·삭제 실패에도 편집 가능. 최대 20개·중복 갱신·오래된 순 정리·자동 저장 끄기·복원/삭제를 검증 |

측정 환경, 허용 이미지 차이, 키보드 매트릭스와 테스트 역할은 [테스트 전략](testing/strategy.md)에 정의한다. 기본 화면과 오류 동선은 [UI 명세](design/ui-spec.md), 구체적인 첫 구현 범위는 [Phase 1 계획](../plans/phase-1-editor-foundation.md)을 따른다. 이 문서는 실험 수행이나 앱 빌드·테스트 통과를 의미하지 않는다.
