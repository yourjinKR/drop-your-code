# UI 명세

작성일: 2026-11-07 · 상태: **작업 4 Plain Text 편집기·주요 IDE 키맵 구현, 전체 디자인 셸은 작업 6 적용 대상**

기준은 [PRD](../../product/PRD.md) §4–6 및 §8이다. 이번에 제공된 `desktop-wireframe.png`, `.svg`, `design-reference.md`를 Desktop 방향으로 사용한다. 이전의 참조 이미지 부재 상태는 해소되었다. 첨부 문서의 전달용 예시 프롬프트는 실행 지시가 아니다. 배치·초기값은 PRD의 확정 요구와 구분되는 설계 제안이며, 사용자 리뷰 후 각 기능 단계에서 적용·검증한다.

관련 문서: [아키텍처](../overview.md), [기술 결정](../decisions/0001-foundation.md), [검증 전략](../testing/strategy.md), [Phase 1 계획](../../plans/phase-1-editor-foundation.md).

시각 토큰·Primitive는 [디자인 시스템](design-system.md), 영역 치수·패널·Desktop/Tablet/Mobile 동선은 [와이어프레임](wireframes.md)이 단일 기준이다. **Minimal Developer Workspace**를 지향한다. Dark-first/Light 지원, Lucide UI 아이콘, compact controls, 평면 패널과 코드 중심 위계를 사용한다. 큰 제목·설명 카드·마케팅 섹션·장식용 그라데이션을 두지 않는다. 스냅샷의 선택적 그라데이션 배경은 별도 제품 설정이다.

## 1. 화면 구조와 편집·미리보기 관계

PRD §5.1의 Header / Main / Settings Panel을 다음 역할로 세분화한다. Header에 나열된 keymap/history/settings 접근은 바로 아래 workspace header/rail로 이동하며 기능 접근 요구는 유지한다.

| 영역 | 내용과 동작 | 연결 요구사항 |
|---|---|---|
| Global Toolbar | Brand, PNG `Copy Image`, 현재 형식 `Export`. 같은 페이지에서 실행 | FR-EXPORT-01/03 |
| Left Activity Bar | `Editor`, `History`, `Shortcuts`, 구현 시 앱 설정 접근. Mobile에서는 Menu로 통합 | FR-EDIT-02, FR-STORAGE-02 |
| Left Context Panel | 최근 스니펫과 History를 하나의 로컬 목록으로 표시. 접기·복원 | FR-STORAGE-02 |
| Main Workspace | `Editor` / `Preview`, code window·canvas scroll. 헤더에 `Keymap`과 접힌 Properties 복원 | FR-EDIT-01–03, FR-EXPORT-04 |
| Right Properties Panel | `Code`, `Window`, `Background`, `Typography`, `Export` accordion. 구현된 필드만 표시 | FR-LANG-01/03, FR-STYLE-01–03, FR-EXPORT-01/02 |
| Status Bar | 읽기 전용 Language·논리 Line count. Preview에서만 Zoom/Fit·논리 출력 치수 | FR-EDIT-03, FR-EXPORT-04 |

기본 작업면은 Editor다. Phase 2에서 두 면이 실제로 존재한 뒤 `Editor` / `Preview` 탭을 제공하고, 전환해도 코드·설정·선택 위치·편집 Undo 이력을 보존한다. 미리보기는 이미지에 들어갈 내용만 표시하는 별도 렌더링 면이며, CodeMirror의 커서·선택·스크롤바·검색 UI를 이미지에 포함하지 않는다. 두 면은 별도 코드 사본을 소유하지 않고 공통 코드·설정 상태를 읽는다(FR-EDIT-01, PRD §7). Language 선택은 Properties, Keymap은 workspace header, Preview Zoom/Fit은 Status Bar에 각각 한 번만 둔다.

입력·키맵 처리는 편집기에 남긴다. 스타일 변경은 같은 설정 상태를 통해 편집 창과 미리보기에 반영하고, 미리보기 갱신이 입력을 기다리게 하지 않는다. 출력 시에는 사용자가 실행한 시점의 전체 코드·설정을 고정해 처리한다. 이전 요청의 결과가 늦게 도착하면 현재 미리보기를 그 결과로 덮어쓰지 않는다.

Phase 1은 편집 창, 키맵·수동 언어·기본 Syntax theme 선택, 줄 번호·줄 바꿈의 기초를 제공한다. 작업6에서 디자인 토큰·독립 UI Dark/Light·기본 Properties 접기를 적용한다. 이미지 미리보기·복사·내보내기·히스토리는 후속 단계이며 준비 중 버튼·빈 섹션·가짜 저장 성공을 표시하지 않는다. 이 문서의 전체 화면 정의가 Phase 1 작업 2~6의 기능 범위 확대를 뜻하지 않는다.

현재 화면은 Brand, `Editor` main과 `Code editor` 입력, header의 native `Keymap` select, 짧은 도움말, 실제 Plain Text/행 수를 제공한다. select는 VS Code/IntelliJ를 메모리 상태로 변경하고 editor로 focus를 강제 이동하지 않는다. 현재 플랫폼·프리셋의 주요 차이와 browser/system 우선순위를 영어로 안내한다. 빈 Properties·준비 안내·상시 설명은 없다. outer shell은 Light, 입력 면은 고정 Dark이며 전체 토큰·패널·테마 UI·macOS 코드 창은 작업 6이다.

이 현재 상태는 최종 목표 UI와 구분한다. 작업 4에서 주요 IDE 키맵만 추가했고 Language/Syntax theme/줄 번호/wrap은 작업 5/6에서 제공한다. 아직 없는 기능은 미리 버튼으로 표시하지 않는다. Keymap 저장·전체 Shortcuts는 Phase 3이며 현재 새로고침하면 VS Code 기본값으로 시작한다.

## 2. 기본 코드 창

FR-STYLE-04의 기본 프리셋은 어두운 불투명 코드 창, 왼쪽의 빨강·노랑·초록 장식 버튼, 상단 중앙 파일명, 언어 아이콘, 둥근 모서리, 코드 여백, 읽기 쉬운 구문 강조로 구성한다. 장식 버튼에 창 닫기·최소화 기능을 부여하지 않고 보조 기술에서 장식으로 처리한다. 제목이 길면 시각적으로 줄이고 전체 값은 제목 편집 필드에서 확인할 수 있게 한다.

| 항목 | 초기 설계 제안 | 변경 동작 |
|---|---|---|
| Syntax theme | Dark 1종을 기본 선택하고 Light 1종 제공 | 코드 상태·Undo 이력을 유지하며 편집기와 미리보기 갱신. UI theme와 독립 |
| 제목 | `untitled` | 제목 편집 필드에서 수정. 언어를 바꿔도 사용자 제목을 임의 변경하지 않음 |
| 언어 아이콘 | 표시, Plain Text는 중립 아이콘 | 선택 언어에 대응하며 표시 여부 변경 가능 |
| 코드 글꼴 | 로컬 제공 또는 시스템 monospace | 사용할 수 없는 글꼴은 대체 글꼴과 실제 적용 상태 안내 |
| 글자 크기 / 줄 높이 | 14px / 1.5 | 편집기와 렌더러의 공통 값 사용 |
| 코드 패딩 / 모서리 | 24px / 12px | 실제 글꼴·그림자 포함 출력 검증 후 조정 |
| 줄 번호 / 줄 바꿈 | 끔 / 끔 | 설정 변경으로 코드 문자열을 바꾸지 않음 |
| 외부 배경 / 외부 패딩 / 그림자 | 단색 `#242427` / 48px / 중간 강도 | Phase 2에서 검증. 투명 모드와 독립적으로 창 자체 배경색 유지 |

문서 초기값은 기존 계획의 빈 코드·VS Code·수동 Plain Text·Dark syntax·줄 번호 off·wrap off를 유지한다. UI theme는 별도로 Dark를 기본으로 Light를 지원한다. 제공 이미지의 Java·IntelliJ·줄 번호 on·16/24px·Dark+는 예시이며 기본값 또는 구현된 프리셋이 아니다. 792×400 코드 창과 외부 패딩48px의 888×496 composition은 산술 예시다. 앱의 동적 코드 창을 그 치수로 강제하지 않는다.

제목·아이콘 변경, 글꼴·간격·패딩·배경·그림자·라운딩 조절은 Phase 2에 배치한다. 줄 번호·줄 바꿈의 편집기 적용은 Phase 1, 이미지 적용은 Phase 2이다. PRD §2.2의 P1 표기에도 FR-STYLE-02·FR-EDIT-03 및 §8 인수 조건에 있으므로 최종 MVP 검증에서 제외하지 않는다.

Phase 2의 자동 크기 계산은 전체 줄 수와 가장 긴 줄의 측정값을 사용한다(FR-EDIT-03). 창 너비의 최소 320px·최대 960px을 초기 실험값으로 제안하며, 좁은 화면에서는 작업면 너비와 스크롤 동작을 함께 검증한다. 줄 바꿈을 켜면 설정된 창 너비에 맞춰 시각적 줄과 높이를 다시 계산한다. 탭·공백·유니코드 글리프가 있어도 문자열 길이만으로 너비를 확정하지 않는다.

화면의 스크롤 높이와 이미지의 전체 콘텐츠 높이를 구분한다. 화면 밖 줄·긴 줄·마지막 빈 줄도 출력 모델에 포함하고 편집기 화면에 보이는 DOM만으로 출력 범위를 정하지 않는다.

최대 창 너비를 넘는 unwrapped 행의 전체 출력 정책은 Phase2 실험에서 확정한다. 조용히 잘라내거나 화면에 보이는 DOM만 출력하지 않는다. Preview의 Zoom/Fit은 화면 표시만 바꾸고 문서·출력 scale·픽셀 치수와 무관하다. Editor에는 Preview zoom의 CSS transform을 적용하지 않는다. canvas의 스크롤·Fit·패널 변경 규칙은 와이어프레임 §4를 따른다.

## 3. 설정 패널

패널을 열고 닫아도 코드와 편집 선택을 유지한다. 설정 필드의 입력은 해당 필드에서 처리하며 편집용 키맵을 가로채지 않는다. 기본 편집 흐름에는 언어·테마·키맵을 쉽게 노출하고 나머지 그룹은 접을 수 있게 한다(PRD §5.2).

| 그룹 | 필드 | 상태·제약 |
|---|---|---|
| Code | Language, Syntax theme, Line numbers, Wrap lines. 이후 Language detection | 작업5는 수동 언어, 작업6은 테마/줄 번호/wrap. Phase3 자동 감지는 수동 선택을 덮어쓰지 않음 |
| Window | Title, Language icon, Radius, Shadow on/off·강도 | 작업6은 고정 기본 창. Phase2 조절. macOS 외 style selector는 이미지 때문에 추가하지 않음 |
| Background | Color, Background padding, Transparent; 선택적 그라데이션 | Phase2. 투명이어도 창은 불투명, 안내 체크무늬는 출력 제외 |
| Typography | Font, Font size, Line height, Code padding | Phase2. 실제 범위·단위·현재 적용 font/fallback 표시, 유효 값만 반영 |
| Export | Format, 논리 출력 치수, JPG background. Phase3 Scale | Phase2 기본 **2x**, Phase3 **1x/2x/3x/4x**. SVG는 scale 무관임을 안내하고 선택 비활성 |

Code를 기본으로 펼치고 다른 섹션은 접는다. 복수 펼침은 허용한다. 구현된 필드가 없는 섹션은 숨긴다. 유효한 설정은 같은 프레젠테이션에 즉시 반영하며 별도 Apply는 없다. 패널 닫기가 이미 적용한 값을 취소하지 않는다. 숫자 필드는 부분 입력을 허용하고 blur/Enter에서 검증하며, 실패하면 입력값과 마지막 유효 프레젠테이션을 보존한다.

`UI theme`는 앱 설정이며 Code의 `Syntax theme`와 별개다. UI Light + Syntax Dark 등 네 조합을 지원한다. 기존 `themeId` / `EditorThemeId`는 Syntax 계약으로 유지한다. UI theme·패널·accordion·mode·preview zoom은 작은 App UI state로 두고 SnapshotInput에서 제외한다. keymap·로딩·오류·저장 상태도 출력 입력이 아니다. 패널은 값·action만 받고 별도 코드 사본을 소유하지 않는다. 토큰 적용이나 패널 이동으로 EditorView를 재생성하지 않는다. 파일 경계 제안은 디자인 시스템 §7을 따른다.

언어·테마를 로딩하는 동안 코드 입력은 계속 허용한다. 로딩 실패 시 텍스트와 선택을 보존하고 재시도와 사용 가능한 대체 상태를 알린다. 오프라인에서 아직 준비되지 않은 리소스에 대해 선택 성공으로 표시하지 않는다. 열린 페이지에서 주요 기능을 오프라인으로 사용할 수 있어야 한다는 PRD §6.2의 충족 범위와 사전 준비 방식은 [기술 결정](../decisions/0001-foundation.md)의 실험으로 확정한다.

## 4. 복사·내보내기 동선

`Copy Image`는 Global Toolbar에서 접근하는 독립 버튼이며 PNG를 복사한다. 편집기에서 `Ctrl+C` / `Cmd+C`는 계속 텍스트 복사다(FR-EXPORT-03). 이미지 복사 버튼이 일반 편집 단축키를 재정의하지 않는다.

내보내기는 현재 페이지에서 형식·배율·필요한 배경색을 확인하고 파일 저장을 실행한다. PNG·SVG·WebP는 외부 투명을 지원하고, JPG에는 지정된 불투명 대체 배경색을 사용한다. SVG에는 배율을 적용하지 않는다(FR-EXPORT-01/02).

`Export`는 현재 Format의 단일 실행 버튼이다. Format/Scale은 Properties에 모아 split-menu 중복을 피한다. 구현 완료한 형식만 노출하되 최종 MVP 네 포맷 요구는 유지한다. WebP는 실제 encoder/MIME를 확인하고 미지원일 때 다른 형식으로 조용히 대체하지 않는다. JPG 선택 시 지정된 불투명 배경으로 합성될 모습을 Preview에서 확인할 경로를 제공한다.

복사·출력 중에는 해당 실행의 진행 상태를 표시하고 중복 실행을 막는다. 성공은 실제 클립보드 쓰기 또는 파일 생성 결과를 확인한 뒤 알린다. 권한·보안 컨텍스트·인코딩·폰트 로딩·용량 관련 실패 시 원인을 읽을 수 있는 메시지와 재시도 경로를 제공하며, 입력한 코드는 유지한다. 클립보드 실패 시 파일 저장을 대안으로 안내한다. HTTPS 또는 localhost 등 보안 컨텍스트와 실제 브라우저 지원 여부를 확인한다.

`Copying…` / `Exporting…`, `aria-busy`로 실행 중임을 알리되 입력은 계속 허용한다. 실제 다운로드 완료를 확인할 수 없으면 파일 생성만으로 `Saved`라고 단정하지 않는다.

출력 결과에 편집 커서·선택색·오류 메시지·설정 패널이 들어가지 않아야 한다. 투명 영역에서도 그림자를 유지하고 코드 창 내부는 불투명해야 한다(FR-STYLE-03, FR-EXPORT-04).

## 5. 히스토리와 로컬 상태

Phase 3에서 rail 또는 Mobile Menu의 `History`로 Context Panel을 연다. 최근 최대 20개를 저장·표시하며 중복 내용은 갱신한다. 항목에는 제목 또는 구분 가능한 코드 일부·언어·최근 갱신 시각을 제안하고, 전체 코드를 외부 서비스로 보내지 않는다(FR-STORAGE-02). Recent snippets는 같은 목록의 역할이며 두 번째 패널로 반복하지 않는다. 참조의 Search/New snapshot은 승인된 기능 범위에 추가하지 않는다.

선택한 항목의 `Restore`는 현재 편집 문서를 바꾸는 동작임을 표시한다. 현재 내용이 다르면 교체 직전 확인하고 취소하면 현재 편집을 유지한다. 항목 `Delete`는 확인 또는 되돌리기 경로, 전체 `Delete history`는 범위를 명시한 확인을 제공한다. `Save history`를 끄면 신규 저장을 멈추며 기존 기록 삭제는 별도 동작이다. 현재 문서 `Clear code`도 명시적으로 제공한다(PRD §6.3). 복원·삭제의 Undo 정책은 Phase3 테스트와 함께 확정한다.

설정·히스토리 저장 실패는 편집을 막는 대화상자 대신 상태 메시지로 알린다. 용량 초과 시 오래된 기록부터 정리하고 그래도 저장하지 못하면 현재 내용이 저장되지 않았음을 알린다. 설정 복원 실패·손상된 데이터는 기본값으로 동작하되 복원 성공으로 표시하지 않는다. 브라우저 저장소 삭제·시크릿 모드에서는 유지되지 않을 수 있음을 히스토리 화면에 안내한다. 구체적 저장 오류 처리는 [아키텍처](../overview.md)를 따른다.

`Saved locally`는 최신 revision/settings가 실제로 저장된 이후만 표시한다. 저장 off·차단·실패·미구현에서는 사용하지 않는다. History 안내: `History is stored only in this browser. Clearing site data or using private browsing may remove it.` 코드·히스토리·제목을 URL/query·원격 analytics/log로 동기화하지 않는다.

## 6. 포커스와 키보드

FR-EDIT-02의 Windows 표를 구현 목표로 사용하되 IntelliJ와 VS Code의 차이를 유지한다. 특히 `Ctrl+Y`는 IntelliJ에서 줄 삭제, VS Code에서 Redo이며 프리셋 전환 즉시 의미가 바뀐다. macOS는 해당 IDE의 플랫폼별 키 조합을 별도 정의·검증하며 단순 Ctrl→Cmd 치환으로 확정하지 않는다.

편집기 내부에 포커스가 있을 때만 편집 명령을 처리한다. 설정·제목·히스토리·대화상자 입력에는 편집 단축키를 적용하지 않는다. 브라우저·운영체제가 예약한 조합은 실제 환경에서 검증하고 불가능한 조합은 대체 동작과 안내를 제공한다. 전역 브라우저 단축키를 일괄 차단하지 않는다.

작업 4는 command wrapper의 focus/composition 검사와 Compartment 재구성을 구현했다. Ctrl/Cmd+C/X는 native clipboard 경로다. 줄 삭제·잘라내기·이동·복제·들여쓰기/내어쓰기는 타이핑과 별도 Undo 단위이며 preset 전환은 코드/선택/Undo를 바꾸지 않는다. 현재 Plain Text의 주석은 언어 token이 없어 no-op이다. 실제 OS가 선점해 전달하지 않은 키는 가로챌 수 있다고 보장하지 않는다. 공식 조합·실행 환경·한계는 [작업 4 보고서](../../verification/task-4-keymaps.md)를 따른다.

Tab 들여쓰기와 키보드로 편집 영역을 벗어나는 경로를 함께 제공한다. 초기 제안은 `Esc` 다음 `Tab`으로 포커스를 이동할 수 있게 하고, 편집기 진입 안내에서 이 경로를 알리는 것이다. 실제 CodeMirror 구성 및 브라우저에서 성립하는지는 Phase 1 검증 대상으로 남긴다. Phase 3 단축키 안내에는 현재 프리셋·운영체제·충돌 대체 동작을 표시한다.

설정·히스토리·내보내기 패널을 닫으면 이를 연 버튼으로 포커스를 돌린다. 모바일의 모달 패널은 열린 동안 포커스를 내부에 두고 닫기 버튼과 Escape를 제공한다. 모든 필드와 아이콘 버튼에 이름을 부여하고, 포커스 표시와 저장·출력 결과 안내를 키보드·보조 기술로 확인할 수 있게 한다.

## 7. 반응형과 단계별 검증

분기점은 CSS viewport 기준 wide≥1440, desktop1024–1439, tablet768–1023, mobile<768px이다. wide는 두 패널 가능, desktop은 History 기본 접힘과 Properties dock, tablet은 rail+한 개 modal drawer, mobile은 rail 대신 Menu+full-width sheet다. History 도킹으로 Main이640px 미만이면 모달로 연다. 상세 치수·접기·복원·focus·키보드·safe-area는 와이어프레임 §3–6을 따른다. 1600·1440·1439·1024·1023·768·767·360·320px와 브라우저 확대200%를 검증한다.

작업6까지는 기본 Properties 접기와 좁은 화면의 인라인 세로 배치로 접근을 보장하고, 정식 drawer·sheet·터치 최적화는 Phase3에서 검증한다. Phase2의 모바일도 기본 입력·파일 저장을 막지 않는 fallback을 유지한다. 모달은 하나만 열고 배경 inert·focus trap·Close/Escape·opener 복귀를 제공하며 dock에는 trap을 걸지 않는다. 레이아웃 변경으로 opener가 사라지면 현재 같은 역할의 버튼으로 복귀한다.

좁은 화면에서도 이미지 복사·내보내기 접근, 기본 입력·선택·저장 동작을 유지한다(PRD §6.4). Header는 줄 바꿈 또는 보조 메뉴를 허용하고 가로 넘침으로 핵심 버튼을 잃지 않게 한다. 가상 키보드가 열려도 편집 커서와 패널 닫기 동작에 접근할 수 있어야 한다. 출력 크기는 기기 뷰포트의 잘림과 독립적이다.

| 단계 | UI 책임과 확인 범위 |
|---|---|
| Phase 1 | 기존 작업2–6의 순수 상태·입력·Undo/Redo·들여쓰기·키맵·초기 언어 전체·수동 선택·기본 창·Syntax Dark/Light·줄 번호/wrap. 작업6에서 토큰·UI Dark/Light·영어 셸·Properties 접기, 좁은 화면 기본 접근 |
| Phase 2 | 별도 미리보기, 자동 크기 조절, 스타일 설정, 전체 코드 렌더링, 4개 형식·PNG 복사. 미리보기와 출력 일치 검증 |
| Phase 3 | 설정·히스토리 복원/삭제/비활성화, 1x–4x 배율 UI, 자동 감지, 단축키 안내, 정식 반응형 상호작용 검증 |
| Phase 4 | Windows/macOS·Chrome/Edge/Firefox/Safari의 키보드 충돌·출력 호환성 및 성능 최종 검증 |

§8의 최종 인수 조건은 모든 단계 완료 후 판단한다. P1인 글꼴·줄 간격, 배율, 줄 번호·줄 바꿈, 자동 들여쓰기, 히스토리 관리, 단축키 안내도 위 단계에 배치하며 제외하지 않는다. 현재는 앱 셸만 구현했고 이미지 출력물은 없다. 브라우저 검증 범위와 미검증 항목은 [작업 1 보고서](../../verification/task-1-static-app.md)에서 구분한다.

## 8. 영어 UI 정책과 기존 셸 변경 대상

앱이 작성하는 표시 텍스트·오류·tooltip·accessible name·dialog·noscript·metadata는 영어로 통일한다. 사용자 코드·제목·History 내용은 번역하거나 영문으로 제한하지 않는다. 문서 설명은 한국어를 유지할 수 있다. 주요 동작 `Copy Image`/`Export` 표기는 고정하고 일반 label은 sentence case로 쓴다.

| 초기 셸 텍스트/표현 | 적용 규칙 |
|---|---|
| `Workspace`, `작업 공간` | `Editor`; 큰 페이지 제목은 제거, 이름 있는 main은 보존 |
| 속성 패널 `Settings`, `설정` | `Properties` |
| `이미지 복사`, `내보내기` | `Copy Image`, `Export` |
| `작업 공간으로 건너뛰기`, `코드 편집 영역` | `Skip to editor`, `Editor` |
| `준비 중`, `코드 편집 기능을 준비하고 있어요` | 최종 UI에서 제거; 준비 중 버튼으로 대체하지 않음 |
| `코드를 담고, 이미지로 나눌 공간을 준비하고 있습니다.` | 제거 |
| `편집과 이미지 내보내기는 다음 업데이트에서 사용할 수 있습니다.` | 제거 |
| `편집기가 제공되면 언어와 스타일을 여기에서 설정할 수 있습니다.` | 제거하고 구현된 필드만 표시 |
| `브라우저 안에서만 작업`, 상시 하단 개인정보 설명 | 상시 문구 제거; 필요한 로컬 데이터 한계는 History에서 영어 안내 |
| `index.html`의 `lang="ko"`, 한국어 metadata/noscript | 작업 3에서 `lang="en"` 및 영어 문구로 변경 |

작업 3에서 초기 안내와 한국어 UI를 제거하고 실제 Editor/skip link/상태의 영어 접근성 이름을 검증했다. 작업 4–5의 새 컨트롤도 영어로 작성하고 작업 6에서 전체 셸·남은 copy를 재확인한다. 새로 표시할 Properties 이름 등은 해당 기능 도입 때 적용한다.

| 상황 | 예시 / 제약 |
|---|---|
| 실제 복사 성공 | `Image copied.` |
| 복사 실패 | `Could not copy the image. Export a PNG instead.` |
| 언어 로드 실패 | `Could not load Java. Try again.` |
| 출력 실패 | `Could not export the image. Try again.` — 알려진 원인은 구체적으로 표시 |
| 저장 실패 | `Could not save locally. Export your work before leaving.` — Export 구현 이후 대안으로 사용 |
| History 빈 상태 | `No history yet.` |
| 삭제 확인 | `Delete all history?` / `Cancel` / `Delete history` |

오류·필수 확인·키보드 탈출 안내는 필요한 짧은 영어 설명을 제공한다. field와 오류를 연결하고 결과는 polite live region으로 한 번 알린다. 코드 한 글자마다 알림을 만들거나 스냅샷에 메시지를 합성하지 않는다. 영어 locale의 Intl 날짜·숫자 표현을 사용한다.

## 9. 변경 결정과 후속 영향

| 이전 기준 | 통합한 결정 / 영향 |
|---|---|
| 참조 이미지 부재 | 제공 Desktop 이미지로 영역 기준 보완; 예시 내용·초기값은 분리 |
| Header 중심 접근, 오른쪽 Settings | Toolbar/Activity/Context/Main/Properties/Status로 역할 분할. PRD 접근 의도 유지 |
| 한국어 이름·준비 설명 | 영어 UI, 상시 안내 제거. 오류·확인·접근성 설명은 유지 |
| Dark/Light 테마의 단일 의미 | UI와 Syntax 분리, 기존 themeId는 syntax 계약 유지 |
| Light88px header·카드·큰 제목의 현재 셸 | 작업6에서 Dark-first56px toolbar·평면 패널·작업면 중심으로 전환 |
| 반응형 원칙만 제안 | 1440/1024/768 경계·단일 모달·320px·200% 동선 구체화 |
| 기본14px/1.5·padding24·radius12·줄 번호/wrap off | 유지. 이미지의16/24px·줄 번호on은 예시 |

영향 파일은 셸 CSS·영어 copy·index metadata·작은 UI Primitive·focus 관리와 해당 테스트다. 공통 문서·편집 어댑터·keymap 명령은 시각 변경과 분리한다. SnapshotInput에는 UI 설정을 넣지 않는다. renderer/export/persistence는 원래 단계에 구현한다. 디자인 명세 자체의 검증은 [디자인 검증 기록](../../verification/ui-ux-design-system.md), 실제 입력 연결은 [작업 3 검증 기록](../../verification/task-3-editor-input.md)에 구분한다. PRD 기능 요구는 변경하지 않는다.
