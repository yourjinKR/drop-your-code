# 화면 구조와 와이어프레임

갱신일: 2026-11-13 · 상태: Phase 1 편집 셸 구현과 후속 목표 레이아웃 명세

기준: [PRD](../../product/PRD.md) §4–6·9, [UI 명세](ui-spec.md), [디자인 시스템](design-system.md), [Phase 1 계획](../../plans/phase-1-editor-foundation.md). 여기의 전체 화면은 최종 MVP의 배치 계약이며 Phase 1의 기능 범위를 확대하지 않는다. 실제 구현 상태와 아직 숨기는 기능은 §7에서 구분한다.

## 1. 참조 해석

사용자가 제공한 `desktop-wireframe.png`, `desktop-wireframe.svg`, `design-reference.md`를 데스크톱 방향으로 사용한다. SVG의 논리 화면은 1600 × 1000 CSS px이며 PNG는 같은 화면의 2배 래스터 이미지다. 이미지의 History 항목, `Saved locally`, Java 코드, `Preview` 선택은 예시 상태다. 현재 제품의 기능·저장 성공·기본값을 나타내지 않는다. 첨부 문서 안의 전달용 예시 프롬프트는 이번 작업의 지시로 사용하지 않는다.

CodeSnap은 도구 중심 정보 밀도와 코드 이미지의 시각적 우선순위를 참고하는 대상이다. 화면 구성, 개별 컨트롤, 브랜드, 자산을 복제하는 기준으로 사용하지 않는다. Tablet과 Mobile은 첨부물에서 확정되지 않은 별도의 설계 제안이다.

## 2. Desktop 전체 구조

1600 × 1000에서 History와 Properties가 모두 열린 캔버스 예시다. History가 추가되는 단계의 배치를 함께 보여 준다.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Drop Your Code                                      Copy Image   Export ▾   │ 56
├─────┬────────────────┬───────────────────────────────────┬────────────────────┤
│     │ History     [<]│ Canvas            Keymap [VS Code]│ Properties      [>]│ 48
│ [E] │────────────────│───────────────────────────────────│────────────────────│
│ [H] │ Recent entries │                                   │ Code               │
│     │                │       scrollable canvas           │ Window             │
│     │                │   ┌───────────────────────────┐   │ Background         │
│     │                │   │ output background/padding │   │ Typography         │
│     │                │   │ ┌───────────────────────┐ │   │                    │
│     │                │   │ │ title / code window   │ │   │                    │
│     │                │   │ └───────────────────────┘ │   │                    │
│ [K] │                │   └───────────────────────────┘   │                    │
│ [S] │                │                                   │                    │
├─────┴────────────────┴───────────────────────────────────┴────────────────────┤
│ Plain Text   12 lines                         −  100%  +  Fit   888 × 496 px   │ 28
└──────────────────────────────────────────────────────────────────────────────┘
  56         224                        1020                        300
```

`[E]`, `[H]`, `[K]`, `[S]`는 실제 글자 버튼이 아닌 Lucide 아이콘 위치다. 각각 `Editor`, `History`, `Shortcuts`, 필요 시 `Settings`에 대응한다. 기능이 없는 위치에는 빈 버튼이나 준비 중 버튼을 두지 않는다.

| 영역 | 1600 × 1000 기준 위치·크기 | 책임 |
|---|---|---|
| Global Toolbar | x0, y0, 1600 × 56 | 브랜드, 4× PNG `Copy Image`, 현재 형식 `Export`와 설정 화살표. 문서 제목은 공간이 있을 때만 보조 정보로 표시 |
| Left Activity Bar | x0, y56, 56 × 916 | Editor로 복귀, History 열기/닫기, Shortcuts 접근. 사용자 인터페이스 설정은 구현된 경우에만 하단 접근 제공 |
| Left Context Panel | x56, y56, 224 × 916 | 브라우저 로컬의 최근 History 목록. 편집 문서 자체를 보관하는 영역이 아님 |
| Main Workspace | x280, y56, 1020 × 916 | 모드 헤더와 독립 스크롤 작업면. 패널이 접히면 반환된 폭을 사용 |
| Workspace header | x280, y56, 1020 × 48 | `Canvas`, `Keymap`, 접힌 Properties 복원 버튼 |
| Right Properties Panel | x1300, y56, 300 × 916 | Code·Window·Background·Typography 설정. 헤더와 내부 세로 스크롤 |
| Status Bar | x0, y972, 1600 × 28 | 실제 언어와 논리 줄 수. 배율과 치수는 캔버스 하단에 표시 |

큰 페이지 제목, 카드 그리드, 기능 소개, 온보딩 문단을 추가하지 않는다. 브랜드 외 화면 제목은 `History`, `Properties` 등 위치를 구분하는 짧은 패널 이름으로 제한한다. 창 장식과 코드가 주된 시각적 초점이다.

Global Toolbar의 `Export`는 선택한 형식으로 바로 저장한다. 옆 화살표를 열면 형식, 픽셀 치수와 JPG 배경을 확인할 수 있다. Undo/Redo는 편집기 명령으로 제공한다.

## 3. 패널과 스크롤

### Desktop 접기와 복원

- History 헤더의 `Collapse History`로 왼쪽 Context Panel만 접는다. Activity Bar의 `History` 버튼으로 복원한다. 같은 버튼을 다시 누르면 접는다. Editor 활동을 선택하면 History를 접고 기존 Editor에 포커스를 돌린다.
- Properties 헤더의 `Collapse Properties`로 오른쪽 패널을 접는다. Workspace header 끝의 `Show Properties` 아이콘 버튼으로 복원한다. 열려 있으면 이 버튼을 중복 표시하지 않는다. 좁은 화면에서도 헤더 끝의 복원 위치는 유지한다.
- 패널을 접으면 해당 열을 0으로 만들고 구분선도 없앤다. 보이지 않는 패널의 입력은 Tab 순서·접근성 트리에서 제외한다. 펼침 버튼에는 `aria-expanded`와 대상 ID를 연결한다.
- 패널 닫기로 포커스 대상이 사라지면 해당 복원 버튼으로 포커스를 이동한다. 접기 전 Editor의 코드·선택·Undo·스크롤을 보존한다. Properties의 설정 값, 섹션 펼침 상태, History 선택·목록 스크롤도 유지한다.
- 사용자 선호에 따른 Desktop 접기 상태는 세션의 UI 상태다. 문서, 출력 설정, 코드 revision에 포함하지 않는다. Phase 3 이전에는 새로고침 후 복원을 약속하지 않는다.
- Phase 3의 History는 최근 스니펫을 하나의 목록으로 표현한다. 동일 자료를 `Recent snippets`라는 두 번째 패널이나 카드 묶음으로 반복하지 않는다. Search, New snapshot, 드래그 패널 이동·크기 조절은 참조에 있더라도 승인된 기능 범위가 아니므로 추가하지 않는다.

Toolbar와 Status Bar는 작업면의 스크롤과 함께 사라지지 않는다. 앱은 동적 뷰포트 높이 안에서 배치하고 Grid/Flex 자식에 축소 가능한 최소 크기를 지정한다. Context Panel, Properties, Main canvas의 스크롤은 서로 독립이다. 패널에서 스크롤했을 때 Editor나 문서 전체가 함께 움직이지 않아야 한다. 브라우저 스크롤바를 장식 목적으로 숨기지 않는다.

History의 기본 행은 제목 또는 구분 가능한 코드 일부, 언어, 최근 갱신 시각을 보여 준다. 복원·삭제는 키보드와 터치에서 항상 접근 가능해야 하며 hover만으로 나타나는 유일한 조작 경로를 만들지 않는다. 빈 목록은 `No history yet.` 한 줄로 표시하고 가짜 데이터를 채우지 않는다. 저장 비활성·실패·데이터 유지 조건의 안내는 [UI 명세](ui-spec.md)를 따른다.

### Properties 정보 구조

| 섹션 | 배치할 필드 | 최초 표시 시점 |
|---|---|---|
| Code | Language, Syntax theme, Line numbers, Wrap lines. 나중에 Language detection | 수동 언어는 작업 5, 기본 테마·줄 번호·wrap은 작업 6, 자동 감지는 Phase 3 |
| Window | Show title, Title, Radius, Shadow. macOS 장식은 기본 프리셋 | 제목 표시는 기본 끔. 켰을 때 코드 창의 제목을 눌러 직접 편집 가능 |
| Background | Color, Background padding, Transparent. 선택적 그라데이션은 별도 결정 | Phase 2 |
| Typography | Font, Font size, Line height, Code padding | Phase 2. 작업 6은 고정 기본값만 사용 |

구현된 필드만 있는 섹션을 표시하고 빈 아코디언은 숨긴다. Code를 기본으로 펼치며, 나머지는 첫 사용 때 접힌 상태로 시작한다. 사용자가 펼친 섹션은 여러 개를 동시에 유지할 수 있다. 참조 이미지처럼 모든 그룹을 열어 놓는 것은 예시이며 기본으로 강제하지 않는다. 각 섹션은 얇은 구분선으로 나누고 중첩 카드로 감싸지 않는다. 조밀한 Desktop에서는 라벨과 컨트롤을 두 열에 두며 긴 라벨·오류·큰 글자에서는 한 열로 재배치한다.

Language 변경 컨트롤은 Properties에 한 번만 둔다. Status Bar의 언어는 읽기 전용이다. Keymap은 Workspace header에서 선택한다. Preview에서도 현재 Keymap은 확인·변경할 수 있지만 편집 명령이 동작하는 대상으로 취급하지 않는다. `UI theme`은 앱 설정이며 Code의 `Syntax theme`과 별개다.

UI theme 선택은 작업6부터 rail 하단의 `Switch to light mode` / `Switch to dark mode` 버튼으로 제공하고 Mobile에서는 Menu의 `UI theme`으로 옮긴다. 버튼은 변경할 대상 모드를 이름으로 알린다. 이 단일 설정 때문에 별도 Settings 화면을 만들지 않는다. Phase3의 History 저장 제어 등 실제 앱 설정이 생기면 Settings 접근을 추가할 수 있다.

## 4. 라이브 캔버스

사용자는 캔버스에 놓인 코드 창에서 코드를 입력하고 같은 자리에서 이미지 스타일을 확인한다. 배율과 패널을 바꾸거나 캔버스를 이동해도 텍스트 선택과 Undo를 보존한다. 캔버스 치수 계산에 실패하면 기존 창에서 계속 편집할 수 있으며 `Retry`로 재시도한다.

### 코드 창과 화면 크기의 분리

논리 코드 창은 실제 폰트의 최장 행·코드 패딩·줄 번호 공간을 반영해 최소 320px부터 조절한다. 최대 960px은 `Wrap lines`를 켠 경우에 적용한다. 높이는 표시 줄 수, 줄 높이, 창 상단과 패딩을 반영한다. 줄 바꿈 설정으로 원문을 바꾸지 않는다.

화면보다 큰 코드 창은 캔버스를 가로·세로로 이동해 탐색한다. 입력으로 창이 커졌을 때 편집 커서가 화면 밖에 있으면 캔버스를 이동한다. 편집 중 배율은 유지한다.

출력 영역은 불투명 코드 창과 바깥쪽 Background padding으로 구성한다. 점 격자, 투명 배경의 체크무늬, 치수와 편집 UI는 화면에서만 표시한다. 투명 배경에서도 이미지의 코드 창은 불투명하고 그림자를 보존한다.

### 이동과 배율

- 처음엔 100%로 가운데 배치하고, 좁은 화면에서는 기본 코드 창과 패딩이 들어오도록 축소한다. 창이 화면보다 크면 왼쪽 위 여백부터 접근할 수 있다.
- `Zoom out`과 `Zoom in`은 보이는 중심을 기준으로 12.5%, 25%, 50%, 75%, 100%, 125%, 150%, 200% 사이에서 이동한다. `Fit`은 실행 시점의 전체 영역을 화면에 맞추고 `Reset view`는 최초 위치와 반응형 초기 배율을 복원한다.
- 빈 영역은 마우스로 끌어 이동한다. `Pan mode`에서는 코드 창 위에서도 마우스나 터치로 끌 수 있다. 포커스된 캔버스에는 기본 스크롤 키가 적용된다.
- 배율과 스크롤 위치는 이미지 치수에 영향을 주지 않는다. 예를 들어 논리 치수 `888 × 496 px`의 PNG 2×는 `1776 × 992 px`이다.

## 5. 반응형 규칙

분기점은 기기명이 아니라 CSS viewport 폭이다. 아래 최종 상호작용은 Phase 3에서 구현·검증한다. Phase 1은 편집 입력·Properties 접근·포커스가 좁은 화면에서 막히지 않는 기본 배치까지만 확인한다.

| 폭 | 기본 구성 | 패널 규칙 |
|---|---|---|
| Wide Desktop ≥1440px | 56px rail, Properties 300px. Phase 3의 History 기능 도입 후 두 패널 기본 열림 | 두 패널을 동시에 도킹 가능. 참조 1600px에서 Main 1020px |
| Desktop 1024–1439px | 56px rail, Properties 300px, History 기본 접힘 | History를 열어도 Main이 640px 이상이면 도킹. 그렇지 않으면 Main을 압축하지 않는 모달 drawer로 표시 |
| Tablet 768–1023px | 56px rail, 양쪽 패널 접힘, Main이 나머지 폭 사용 | History 또는 Properties 하나를 모달 drawer로 표시. 다른 패널을 열면 기존 패널을 대체 |
| Mobile <768px | rail 제거. 2행 상단 조작, Main, 필요 시 높이 확장 Status | History·Properties·Shortcuts는 한 번에 하나의 full-width sheet로 표시 |

Desktop에서 둘 다 열 수 있는지 판단할 때 `viewport − rail − history − properties ≥ 640px`을 사용한다. 이 값은 출력 창의 최소 너비가 아니다. 좁은 Desktop에서 History를 모달로 열면 Properties를 포함한 배경 UI는 비활성화하고 기존 도킹 폭은 그대로 둔다. 한 번에 하나의 모달만 연다. 좁아진 viewport에서 자동으로 접힌 패널 때문에 저장된 사용자 선호를 덮어쓰지 않는다. 더 넓은 구간으로 돌아가면 이전 도킹 선호를 복원하며, 사용자가 해당 구간에서 직접 닫은 패널을 즉시 다시 열지 않는다.

Tablet drawer 너비는 `min(360px, viewport − 56px)`이고 작업면 위에 겹친다. Properties는 오른쪽, History는 왼쪽에서 열린다. 이때 배경 Editor는 비활성화하고 포커스를 drawer 안에 둔다. Desktop 도킹 패널에는 모달 focus trap을 적용하지 않는다.

### Tablet

```text
┌──────────────────────────────────────────────────────┐
│ Drop Your Code                  Copy Image  Export ▾  │
├─────┬────────────────────────────────────────────────┤
│ [E] │ Canvas            Keymap [VS Code]          [P] │
│ [H] ├────────────────────────────────────────────────┤
│     │                                                │
│     │             Editable code window               │
│ [K] │                                                │
├─────┴────────────────────────────────────────────────┤
│ Java   12 lines                  −  100%  +  Fit      │
└──────────────────────────────────────────────────────┘
```

`[P]`는 `Show Properties`다. 열려 있는 drawer에서는 제목과 `Close Properties` 또는 `Close History`를 고정하고 본문만 스크롤한다. 모든 접기/닫기 버튼은 터치에서도 노출된다.

### Mobile

```text
┌────────────────────────────────────────┐
│ Drop Your Code         [Copy] Export ▾  │ 56
├────────────────────────────────────────┤
│ [Menu] Canvas               [Properties]│ 48
├────────────────────────────────────────┤
│                                        │
│          Editable code window          │
│                                        │
├────────────────────────────────────────┤
│ Java   12 lines       [Zoom] [Fit]     │ min 44
└────────────────────────────────────────┘
```

아래는 Properties sheet가 열린 상태다.

```text
┌────────────────────────────────────────┐
│ Properties                      Close  │ 56
├────────────────────────────────────────┤
│ Code                                   │
│ Language                               │
│ [Java                                ] │
│ Syntax theme                           │
│ [Dark                                ] │
│ ... independently scrollable fields ...│
└────────────────────────────────────────┘
```

Mobile 첫 행의 Copy는 Lucide 아이콘으로 축약하되 접근성 이름·tooltip은 `Copy Image`로 유지한다. Export는 텍스트를 유지한다. 둘 다 실제 기능 도입 후 표시한다. 브랜드는 필요하면 아이콘으로 축약해도 접근성 이름 `Drop Your Code`를 보존한다. Workspace header의 `[Menu]`는 Keymap과 구현된 History·Shortcuts·Settings를 나열하며, 항목이 없으면 메뉴 자체를 숨긴다.

두 번째 행은 44px 터치 target을 보장한다. Mobile의 Keymap은 텍스트 입력이 아닌 이름 있는 Menu 항목으로 옮긴다. Mode와 Properties 접근은 남긴다. Status Bar는 상호작용 컨트롤이 있거나 coarse pointer 환경이면 최소 44px로 높이고, Preview의 개별 −/+는 이름 있는 `Zoom` 메뉴로 합쳐 동일 배율 선택을 제공한다. 저장 상세와 치수는 상단 Export 화살표에서 확인할 수 있다. 줄 수·언어는 유지하고 줄 바꿈을 허용한다. 320px에서도 앱 chrome의 가로 스크롤을 만들지 않는다. 코드와 canvas의 의도된 가로 스크롤은 별개다.

Sheet는 viewport 전체 폭·사용 가능한 높이를 사용하며 라벨과 입력을 한 열에 둔다. 상단에 이름과 명시적인 `Close` 버튼을 두고 본문을 스크롤한다. 별도의 Apply 없이 유효한 Properties 변경을 반영한다. 닫기나 Escape가 이미 반영된 설정을 취소한다는 의미를 부여하지 않는다.

가상 키보드, `100dvh`, safe-area inset을 고려한다. 키보드가 열려도 현재 필드·Editor caret과 닫기 동작을 화면 안으로 스크롤할 수 있어야 한다. 가상 키보드 높이 때문에 모바일 상태 표시가 입력 영역을 가리지 않게 하고, 필요한 경우 비필수 상태 정보를 줄인다. 브라우저 확대와 pinch zoom을 막지 않는다. 가로/세로 방향 전환은 문서·설정을 바꾸지 않는다.

## 6. 키보드와 접근성 계약

- 순서는 `Skip to editor` → Toolbar → Activity/navigation → 열린 Context Panel → Canvas 헤더 → 캔버스와 편집기 → 캔버스 도구 → Properties다.
- 아이콘은 이름 있는 button이며, 현재 활동·탭·패널 상태는 색상 외 표시선과 `aria-current` / `aria-selected` / `aria-expanded` 중 해당 의미로 전달한다. 보조 설명은 tooltip으로 제공하되 label을 tooltip에만 맡기지 않는다.
- 모달 drawer/sheet를 열면 제목 또는 첫 입력으로 포커스를 옮긴다. Tab은 내부를 순환하고 배경은 inert로 처리한다. Escape·보이는 Close로 닫으며 opener로 포커스를 돌린다. 원래 opener가 breakpoint 변경으로 사라졌다면 같은 역할의 현재 버튼을 사용한다.
- 키맵의 Tab 들여쓰기와 Editor 탈출은 함께 보장한다. CodeMirror 선택 버전의 `Escape`, 그 다음 `Tab` 경로는 실제 구현 때 검증하고 짧은 접근성 안내로 제공한다. 이를 모달 닫기와 혼동하지 않는다. 패널의 입력 필드에는 Editor 키맵이 적용되지 않는다.
- hover 전용 조작·drag 전용 이동·더블클릭 전용 복원 동작을 만들지 않는다. 모션 감소, 200% 확대, 키보드만 사용한 편집·설정·닫기·복사·출력을 검증한다.
- 저장·복사·출력 결과는 비출력 status/live region으로 안내하며 코드 한 글자마다 읽지 않는다. Preview 이미지에 사용자 메시지를 합성하지 않는다.

## 7. 단계별 노출과 검증 기준

| 시점 | 화면에 나타날 수 있는 기능 | 계속 숨기는 것 |
|---|---|---|
| 현재 Phase 1 편집 셸 | 기본 코드 창, Keymap, Language, Syntax theme, Line numbers, Wrap lines, UI theme와 Properties 접기. 1024px 미만에서는 Properties를 편집기 아래에 배치하고 768px 미만에서는 작업면 진입과 테마 버튼을 상단으로 이동 | Preview·이미지 복사/출력·History·설정 저장 |
| Phase 1 작업 2–3 | 상태 모델·Editor 입력이 각각 구현된 범위. 구현된 순서대로 간결한 Editor 영역 | 렌더러, 출력 치수·배율, History, 저장 성공 |
| Phase 1 작업 4–5 | Keymap, 수동 Language와 로딩·오류 상태 | 자동 감지와 전체 Shortcuts 화면 |
| Phase 1 작업 6 | 기본 코드 창, Syntax theme Dark/Light, Line numbers, Wrap lines. 토큰·기본 Properties 접기 적용. 좁은 화면은 인라인 세로 배치로 설정 접근 보장 | 스타일 세부 조정, Preview, Export, Copy Image, History, 정식 모달 drawer/sheet |
| Phase 2 | 실제 renderer를 쓰는 Preview·Zoom/Fit, 스타일 필드, 지원 완료한 형식·Copy Image | 아직 미구현인 출력 형식, 배율 선택 UI·저장·History |
| Phase 3 | 설정 보존·History 최대 20개 및 삭제/끄기, 자동 감지, Scale 1×–4×, Shortcuts, 정식 반응형 패널 | 미구현 동작의 준비 중 버튼·가짜 성공 표시 |
| Phase 4 | 실제 환경에서 확인한 호환성·성능 | 검증하지 않은 환경을 지원 검증 완료로 표현하지 않음 |

초기 문서는 빈 코드, VS Code, 수동 Plain Text, Dark syntax, Line numbers off, Wrap lines off라는 기존 Phase 1 계획의 기본 상태를 따른다. 이미지의 Transaction.java·IntelliJ·줄 번호 on은 예시이며 이를 기본값으로 가져오지 않는다. UI Dark/Light와 코드 syntax Dark/Light를 독립적으로 선택하므로 네 조합 모두 이후 검증 대상이다.

후속 구현의 최소 확인 지점은 다음과 같다. 아래는 앞으로 수행할 검사이며 이번 문서 작업에서 통과했다고 주장하지 않는다.

1. 1600 × 1000에서 두 패널을 연 기하 구조, 각각 접기·복원, Main 폭 반환, 포커스·문서·Undo 보존.
2. 1440·1439·1024·1023·768·767·360·320px 및 200% 확대에서 접근 버튼·닫기·scroll 범위 유지. 좁은 Desktop의 동시 도킹 제한과 넓은 화면 복귀.
3. Tablet/Mobile의 모달 배경 비활성·Tab trap·Escape·포커스 반환, 가상 키보드·safe-area 대응.
4. 캔버스 확대와 이동으로 코드·선택·Undo가 변하지 않음. 화면 밖의 전체 줄·끝 개행·긴 행을 출력에 포함.
5. Fit과 수동 zoom에서 패널 변경·viewport 변경·가로/세로 스크롤이 조합되더라도 콘텐츠 누락 없음. zoom이 출력 치수에 영향 없음.
6. UI theme × syntax theme 네 조합, 영어 label·error·tooltip, Lucide 아이콘 이름, 키맵의 Editor 포커스 경계.
7. 실제 구현된 기능만 표시하며 저장 성공·출력 성공이 실제 결과와 일치. 내보내기 세부 검증은 [UI 명세](ui-spec.md)와 [검증 전략](../testing/strategy.md)을 따름.
