# 화면 구조와 와이어프레임

작성일: 2026-11-07 · 상태: 전체 목표 레이아웃 명세. 현재는 작업 4 기본 입력·Keymap 선택 구현

기준: [PRD](../../product/PRD.md) §4–6·9, [UI 명세](ui-spec.md), [디자인 시스템](design-system.md), [Phase 1 계획](../../plans/phase-1-editor-foundation.md). 여기의 전체 화면은 최종 MVP의 배치 계약이며 Phase 1의 기능 범위를 확대하지 않는다. 실제 구현 상태와 아직 숨기는 기능은 §7에서 구분한다.

## 1. 참조 해석

사용자가 제공한 `desktop-wireframe.png`, `desktop-wireframe.svg`, `design-reference.md`를 데스크톱 방향으로 사용한다. SVG의 논리 화면은 1600 × 1000 CSS px이며 PNG는 같은 화면의 2배 래스터 이미지다. 이미지의 History 항목, `Saved locally`, Java 코드, `Preview` 선택은 예시 상태다. 현재 제품의 기능·저장 성공·기본값을 나타내지 않는다. 첨부 문서 안의 전달용 예시 프롬프트는 이번 작업의 지시로 사용하지 않는다.

CodeSnap은 도구 중심 정보 밀도와 코드 이미지의 시각적 우선순위를 참고하는 대상이다. 화면 구성, 개별 컨트롤, 브랜드, 자산을 복제하는 기준으로 사용하지 않는다. Tablet과 Mobile은 첨부물에서 확정되지 않은 별도의 설계 제안이다.

## 2. Desktop 전체 구조

1600 × 1000, History와 Properties가 모두 열리고 Preview를 선택한 예시다. 아래 이름은 영역을 설명하는 명세이며 모든 이름을 화면에 제목으로 표시하지 않는다.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Drop Your Code                                      Copy Image    Export     │ 56
├─────┬────────────────┬───────────────────────────────────┬────────────────────┤
│     │ History     [<]│ Editor  Preview   Keymap [VS Code]│ Properties      [>]│ 48
│ [E] │────────────────│───────────────────────────────────│────────────────────│
│ [H] │ Recent entries │                                   │ Code               │
│     │                │       scrollable canvas           │ Window             │
│     │                │   ┌───────────────────────────┐   │ Background         │
│     │                │   │ output background/padding │   │ Typography         │
│     │                │   │ ┌───────────────────────┐ │   │ Export             │
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
| Global Toolbar | x0, y0, 1600 × 56 | 브랜드, PNG `Copy Image`, 현재 형식 `Export`. 문서 제목은 공간이 있을 때만 보조 정보로 표시 |
| Left Activity Bar | x0, y56, 56 × 916 | Editor로 복귀, History 열기/닫기, Shortcuts 접근. 사용자 인터페이스 설정은 구현된 경우에만 하단 접근 제공 |
| Left Context Panel | x56, y56, 224 × 916 | 브라우저 로컬의 최근 History 목록. 편집 문서 자체를 보관하는 영역이 아님 |
| Main Workspace | x280, y56, 1020 × 916 | 모드 헤더와 독립 스크롤 작업면. 패널이 접히면 반환된 폭을 사용 |
| Workspace header | x280, y56, 1020 × 48 | `Editor` / `Preview`, `Keymap`, 접힌 Properties 복원 버튼 |
| Right Properties Panel | x1300, y56, 300 × 916 | Code·Window·Background·Typography·Export 설정. 헤더와 내부 세로 스크롤 |
| Status Bar | x0, y972, 1600 × 28 | 실제 언어, 논리 줄 수. Preview에서만 표시 배율·Fit·논리 출력 치수 |

큰 페이지 제목, 카드 그리드, 기능 소개, 온보딩 문단을 추가하지 않는다. 브랜드 외 화면 제목은 `History`, `Properties` 등 위치를 구분하는 짧은 패널 이름으로 제한한다. 창 장식과 코드가 주된 시각적 초점이다.

Global Toolbar의 Export는 단일 실행 버튼으로 한다. 형식·배율은 Properties의 Export 섹션에서 설정한다. 참조 이미지의 split-button 화살표를 맞추기 위해 중복 출력 메뉴를 추가하지 않는다. Undo/Redo는 편집기 명령으로 제공하며, 참조 이미지에 있다는 이유로 별도 전역 버튼을 추가하지 않는다.

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
| Window | Title, Language icon, Radius, Shadow. macOS 장식은 기본 프리셋 | 고정 프리셋은 작업 6, 사용자 조정 필드는 Phase 2 |
| Background | Color, Background padding, Transparent. 선택적 그라데이션은 별도 결정 | Phase 2 |
| Typography | Font, Font size, Line height, Code padding | Phase 2. 작업 6은 고정 기본값만 사용 |
| Export | Format, 출력 치수, JPG background. Scale은 Phase 3 | Phase 2, 1×–4× 선택은 Phase 3 |

구현된 필드만 있는 섹션을 표시하고 빈 아코디언은 숨긴다. Code를 기본으로 펼치며, 나머지는 첫 사용 때 접힌 상태로 시작한다. 사용자가 펼친 섹션은 여러 개를 동시에 유지할 수 있다. 참조 이미지처럼 모든 그룹을 열어 놓는 것은 예시이며 기본으로 강제하지 않는다. 각 섹션은 얇은 구분선으로 나누고 중첩 카드로 감싸지 않는다. 조밀한 Desktop에서는 라벨과 컨트롤을 두 열에 두며 긴 라벨·오류·큰 글자에서는 한 열로 재배치한다.

Language 변경 컨트롤은 Properties에 한 번만 둔다. Status Bar의 언어는 읽기 전용이다. Keymap은 Workspace header에서 선택한다. Preview에서도 현재 Keymap은 확인·변경할 수 있지만 편집 명령이 동작하는 대상으로 취급하지 않는다. `UI theme`은 앱 설정이며 Code의 `Syntax theme`과 별개다.

UI theme 선택은 작업6부터 rail 하단의 `Switch to light mode` / `Switch to dark mode` 버튼으로 제공하고 Mobile에서는 Menu의 `UI theme`으로 옮긴다. 버튼은 변경할 대상 모드를 이름으로 알린다. 이 단일 설정 때문에 별도 Settings 화면을 만들지 않는다. Phase3의 History 저장 제어 등 실제 앱 설정이 생기면 Settings 접근을 추가할 수 있다.

## 4. Editor와 Preview

| 상태 | Main의 내용 | 표시·포커스 규칙 |
|---|---|---|
| Editor | CodeMirror 입력 면과 기본 코드 창 | 텍스트 선택·커서·입력 스크롤·편집 단축키. 입력 면의 텍스트를 CSS transform으로 축소하지 않음 |
| Preview | 전체 코드로 만든 깨끗한 출력 composition | 읽기 전용. 커서·선택·스크롤바·포커스 링·편집기 검색 UI를 출력 영역에 넣지 않음 |
| Preview 갱신 중 | 마지막 정상 결과와 비출력 영역의 짧은 상태 | Editor 입력을 막지 않음. 오래된 렌더 결과가 최신 상태를 덮어쓰지 않음 |
| Preview 실패 | 마지막 정상 결과가 있으면 유지, 영문 오류와 재시도 | 현재 코드·설정은 유지. 낡은 결과를 최신 출력이라고 표시하지 않음 |

두 모드는 같은 코드·설정을 사용한다. 전환은 문서 교체나 새 Undo 항목이 아니며 선택 위치·편집 Undo와 각 면의 viewport를 보존한다. 모드 전환 후 포커스는 선택한 탭에 남긴다. 사용자가 Editor 내용으로 진입할 때 저장된 선택 위치를 복구한다. Editor를 삭제·재생성해 선택과 Undo를 잃는 방식으로 패널이나 탭을 전환하지 않는다.

두 면이 실제로 존재하는 Phase 2부터 WAI-ARIA 탭 패턴의 `Editor` / `Preview`를 표시한다. 방향키로 탭을 이동하고 선택 상태·tabpanel 관계를 노출한다. Phase 1은 `Editor`만 표시하며 동작하지 않는 Preview 탭은 두지 않는다. Editor 이외 영역에서는 IDE 편집 단축키를 가로채지 않는다.

### 코드 창과 화면 크기의 분리

Phase 2에서 논리 코드 창의 너비는 실제 폰트의 최장 행·코드 패딩·줄 번호 공간을 측정해 결정하고, 높이는 시각적 줄 수·line-height·타이틀바·패딩에서 계산한다. 최소 320px·최대 960px은 기존 명세의 초기 검증 후보이며 최종 렌더러 검증 전에 고정 제품 제약이라고 주장하지 않는다. wrap 여부가 원문을 바꾸지는 않는다.

줄 바꿈을 켜면 선택된 논리 창 너비에서 다시 배치한다. 끄면 긴 행을 작업면 안에서 가로 스크롤할 수 있게 하며 출력 시 행 끝을 잘라 내지 않는다. 최대 창 너비를 넘는 행의 전체 출력 방식은 Phase 2에서 크기 제한·wrap 정책과 함께 검증해 명세를 확정한다. 어떤 정책도 화면에 보이는 DOM만 내보내거나 조용히 코드를 누락해서는 안 된다.

출력 composition은 불투명 코드 창과 바깥쪽 Background padding으로 구성한다. 화면의 여유 공간, dotted grid, 투명 안내 체크무늬, 치수 안내는 앱 chrome이며 이미지에 포함하지 않는다. 기본 canvas는 단색이며 점무늬는 필수 요소가 아니다. 투명 배경에서도 코드 창 자체는 불투명하고 그림자는 보존한다.

### Zoom과 Fit

Zoom/Fit은 Preview가 구현된 뒤 Status Bar의 한 위치에서만 제공한다. `Zoom out`, 표시 배율, `Zoom in`, `Fit`을 한 그룹으로 배치하고 언어·줄 수와 시각적으로 분리한다. Editor에는 Preview zoom을 적용하지 않는다. Editor 상태에서는 이 그룹을 숨긴다.

- 수동 배율 제안: 25%, 50%, 75%, 100%, 125%, 150%, 200%. 유효 범위를 벗어난 증감 버튼만 비활성화한다. 이 숫자는 출력 배율 1×–4×와 별개다.
- Fit은 남은 canvas의 양축에 composition 전체가 보이도록, 최대 100%까지 축소한다. 매우 큰 출력에는 25%보다 작은 Fit도 허용한다. 첫 Preview 진입과 Mobile의 기본값은 Fit이다.
- Fit 상태에서는 패널 열기·닫기와 viewport 변경 때 다시 계산한다. 수동 zoom 상태에서는 배율을 유지하고 스크롤 범위만 조정한다. 배율 변경 전 canvas 중심이 가리키던 콘텐츠 위치를 보존한다.
- composition이 canvas보다 작으면 가운데 놓고, 크면 왼쪽 위 바깥 여백부터 접근할 수 있게 한다. 음수 중앙 정렬로 상단·왼쪽 콘텐츠가 스크롤 범위 밖으로 사라지지 않아야 한다.
- 예시 `888 × 496 px`은 export scale 적용 전 논리 치수다. 코드 창 792 × 400과 바깥 패딩 48px이면 해당 치수가 된다. PNG 2×는 1776 × 992px이며 표시 zoom은 이를 바꾸지 않는다. 이 예시 때문에 Java 코드나 코드 창을 792 × 400으로 강제하지 않는다.

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
│ Drop Your Code                   Copy Image   Export  │
├─────┬────────────────────────────────────────────────┤
│ [E] │ Editor  Preview   Keymap [VS Code]          [P] │
│ [H] ├────────────────────────────────────────────────┤
│     │                                                │
│     │             Editor / fitted Preview            │
│ [K] │                                                │
├─────┴────────────────────────────────────────────────┤
│ Java   12 lines                  −  100%  +  Fit      │
└──────────────────────────────────────────────────────┘
```

`[P]`는 `Show Properties`다. 열려 있는 drawer에서는 제목과 `Close Properties` 또는 `Close History`를 고정하고 본문만 스크롤한다. 모든 접기/닫기 버튼은 터치에서도 노출된다.

### Mobile

```text
┌────────────────────────────────────────┐
│ Drop Your Code          [Copy]  Export  │ 56
├────────────────────────────────────────┤
│ [Menu] Editor Preview       [Properties]│ 48
├────────────────────────────────────────┤
│                                        │
│        Editor / fitted Preview         │
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

두 번째 행은 44px 터치 target을 보장한다. Mobile의 Keymap은 텍스트 입력이 아닌 이름 있는 Menu 항목으로 옮긴다. Mode와 Properties 접근은 남긴다. Status Bar는 상호작용 컨트롤이 있거나 coarse pointer 환경이면 최소 44px로 높이고, Preview의 개별 −/+는 이름 있는 `Zoom` 메뉴로 합쳐 동일 배율 선택을 제공한다. 낮은 우선순위인 저장 상세·치수는 Export 섹션에서 확인할 수 있다. 줄 수·언어는 유지하고 줄 바꿈을 허용한다. 320px에서도 앱 chrome의 가로 스크롤을 만들지 않는다. 코드와 canvas의 의도된 가로 스크롤은 별개다.

Sheet는 viewport 전체 폭·사용 가능한 높이를 사용하며 라벨과 입력을 한 열에 둔다. 상단에 이름과 명시적인 `Close` 버튼을 두고 본문을 스크롤한다. 별도의 Apply 없이 유효한 Properties 변경을 반영한다. 닫기나 Escape가 이미 반영된 설정을 취소한다는 의미를 부여하지 않는다.

가상 키보드, `100dvh`, safe-area inset을 고려한다. 키보드가 열려도 현재 필드·Editor caret과 닫기 동작을 화면 안으로 스크롤할 수 있어야 한다. 가상 키보드 높이 때문에 모바일 상태 표시가 입력 영역을 가리지 않게 하고, 필요한 경우 비필수 상태 정보를 줄인다. 브라우저 확대와 pinch zoom을 막지 않는다. 가로/세로 방향 전환은 문서·설정을 바꾸지 않는다.

## 6. 키보드와 접근성 계약

- 순서는 `Skip to editor` → Toolbar → Activity/navigation → 열린 Context Panel → Workspace header → Editor 또는 Preview → Properties → Status controls다. CSS 배치 때문에 DOM의 읽기 순서를 뒤집지 않는다.
- 아이콘은 이름 있는 button이며, 현재 활동·탭·패널 상태는 색상 외 표시선과 `aria-current` / `aria-selected` / `aria-expanded` 중 해당 의미로 전달한다. 보조 설명은 tooltip으로 제공하되 label을 tooltip에만 맡기지 않는다.
- 모달 drawer/sheet를 열면 제목 또는 첫 입력으로 포커스를 옮긴다. Tab은 내부를 순환하고 배경은 inert로 처리한다. Escape·보이는 Close로 닫으며 opener로 포커스를 돌린다. 원래 opener가 breakpoint 변경으로 사라졌다면 같은 역할의 현재 버튼을 사용한다.
- 키맵의 Tab 들여쓰기와 Editor 탈출은 함께 보장한다. CodeMirror 선택 버전의 `Escape`, 그 다음 `Tab` 경로는 실제 구현 때 검증하고 짧은 접근성 안내로 제공한다. 이를 모달 닫기와 혼동하지 않는다. 패널의 입력 필드에는 Editor 키맵이 적용되지 않는다.
- hover 전용 조작·drag 전용 이동·더블클릭 전용 복원 동작을 만들지 않는다. 모션 감소, 200% 확대, 키보드만 사용한 편집·설정·닫기·복사·출력을 검증한다.
- 저장·복사·출력 결과는 비출력 status/live region으로 안내하며 코드 한 글자마다 읽지 않는다. Preview 이미지에 사용자 메시지를 합성하지 않는다.

## 7. 단계별 노출과 검증 기준

| 시점 | 화면에 나타날 수 있는 기능 | 계속 숨기는 것 |
|---|---|---|
| 현재 작업 5 입력 셸 | Editor·Keymap 선택·영어 skip/help·`Properties`의 수동 `Language`·적용 언어/행 수. 960px 미만에서는 Properties를 편집기 아래에 배치 | 패널 접기·테마 선택·Preview·이미지 복사/출력·History |
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
4. Editor/Preview 전환으로 코드와 selection/Undo가 변하지 않음. 화면 밖의 전체 줄·끝 개행·긴 행을 Preview/export에 포함.
5. Fit과 수동 zoom에서 패널 변경·viewport 변경·가로/세로 스크롤이 조합되더라도 콘텐츠 누락 없음. zoom이 출력 치수에 영향 없음.
6. UI theme × syntax theme 네 조합, 영어 label·error·tooltip, Lucide 아이콘 이름, 키맵의 Editor 포커스 경계.
7. 실제 구현된 기능만 표시하며 저장 성공·출력 성공이 실제 결과와 일치. 내보내기 세부 검증은 [UI 명세](ui-spec.md)와 [검증 전략](../testing/strategy.md)을 따름.
