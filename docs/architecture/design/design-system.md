# Design System — Minimal Developer Workspace

작성일: 2026-11-07 · 상태: **공통 토큰·전체 셸은 작업 6 적용 대상, 작업 4 기본 입력·Keymap 구현**

앱은 코드를 편집하고 이미지로 만드는 작은 개발 도구다. 코드 창을 시각적 중심으로 두고, 주변은 중립적인 면·1px 경계·작은 컨트롤로 정돈한다. 대형 제목, 설명 카드, 온보딩, 마케팅 섹션, 장식용 그라데이션은 사용하지 않는다. 스냅샷 배경의 선택적 그라데이션(FR-STYLE-03)은 이 UI 원칙과 별개이며 채택 시 Phase 2에서 검증한다.

기능 계약은 [UI 명세](ui-spec.md), 배치는 [와이어프레임](wireframes.md), 적용 순서는 [Phase 1 계획](../../plans/phase-1-editor-foundation.md)을 따른다. PRD가 우선하며 아래 수치는 제품 요구를 구체화한 설계 기준이다. 현재 기본 입력의 구현·검증과 전체 디자인 적용을 구분한다.

## 1. 색과 면의 계층

토큰명은 후속 CSS custom property의 이름으로 사용할 계약이다. Dark가 첫 방문 기본값이며 Light를 명시적으로 선택할 수 있다. UI theme는 앱 셸만 바꾼다. Syntax theme는 코드 창·코드 글자·출력의 색을 정하며 별도 설정이다. UI Light + Syntax Dark 및 UI Dark + Syntax Light 조합을 모두 허용한다.

| Semantic token | Dark | Light | 용도 |
|---|---|---|---|
| `--ui-canvas` | `#14161A` | `#F3F4F6` | 작업면, 최하위 면 |
| `--ui-surface` | `#1D1F24` | `#FFFFFF` | Toolbar, Activity Bar, 패널, Status Bar |
| `--ui-surface-raised` | `#292C32` | `#F0F1F3` | 입력, 메뉴, 팝오버; 카드로 감싸지 않음 |
| `--ui-hover` | `#32363E` | `#E5E7EB` | 중립 컨트롤 hover |
| `--ui-pressed` | `#3D434D` | `#D5D9E0` | 누르고 있는 순간 |
| `--ui-selected` | `#28344B` | `#E6EDFA` | 선택 탭·History 행·활성 rail |
| `--ui-border` | `#383C45` | `#D3D7DE` | 구조 구분선, 장식 경계 |
| `--ui-control-border` | `#747B87` | `#707783` | 입력 경계, switch off 외곽 등 식별에 필요한 경계 |
| `--ui-text` | `#E8EAED` | `#20242B` | 본문, 컨트롤 이름 |
| `--ui-text-secondary` | `#9CA2AF` | `#586170` | 필드 라벨, 상태, 보조 정보 |
| `--ui-text-disabled` | `#737986` | `#858C97` | 사용할 수 없는 구현된 컨트롤 |
| `--ui-accent` | `#648DDD` | `#315DB5` | Export, 선택 위치 표시, on switch |
| `--ui-accent-hover` | `#7CA0E5` | `#284F9D` | 주 동작 hover |
| `--ui-accent-pressed` | `#5E85D2` | `#214284` | 주 동작 pressed |
| `--ui-on-accent` | `#101827` | `#FFFFFF` | accent 면의 텍스트·아이콘 |
| `--ui-focus` | `#8AB4F8` | `#245AC2` | 키보드 포커스 링 |
| `--ui-danger` | `#F28B82` | `#B3261E` | 오류, 삭제 의미 |
| `--ui-warning` | `#E3BA69` | `#805300` | 저장 불가 등 주의 |
| `--ui-success` | `#8EC99E` | `#236A3B` | 확인된 복사·저장 결과 |
| `--ui-scrim` | `rgba(0,0,0,0.56)` | `rgba(0,0,0,0.32)` | 모달 뒤 차폐 |

색상만으로 선택·오류를 구분하지 않는다. 선택은 2px 위치 표시 또는 체크와 `aria-selected`/`aria-pressed`를 병행하고 오류는 텍스트와 아이콘을 함께 제공한다. 구조 경계 `--ui-border`를 입력의 유일한 식별 경계로 쓰지 않는다. 활성 텍스트는 실제 면 위에서 WCAG AA 4.5:1, 큰 텍스트는 3:1, 필수 컨트롤 경계·상태·포커스는 인접 면과 3:1 이상을 검증한다. disabled는 대비 예외지만 상태를 opacity 하나로만 표현하지 않는다.

면 계층은 canvas → surface → raised 순이다. 모든 패널은 평면으로 연결하고 중첩 카드·전면 그림자를 쓰지 않는다. 메뉴·모달에만 `0 8px 24px rgba(0,0,0,0.24)` 보조 그림자를 허용하며 경계를 함께 쓴다. 코드 창 그림자는 스냅샷 설정이며 UI 그림자와 공유하지 않는다. `color-scheme`, 네이티브 select의 전경·배경, `theme-color`도 현재 UI theme와 맞춘다.

## 2. 타이포그래피

| 역할 | 크기 / 줄 높이 | 굵기 | 규칙 |
|---|---|---|---|
| Brand | 15 / 20px | 600 | 큰 페이지 제목으로 확대하지 않음 |
| 패널·섹션 제목 | 13 / 20px | 600 | `Properties`, `Code` 등 |
| 버튼·입력·라벨·탭 | 13 / 20px | 400; 선택 600 | 문장형, 필수 이름 생략 금지 |
| 상태·도움말·tooltip | 12 / 16px | 400 | 12px 아래 사용하지 않음 |
| 코드 초기값 | 14 / 21px | 400 | 이후 Typography로 조정, UI scale과 독립 |

UI font: `"Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif`. 코드 font: `Consolas, "SFMono-Regular", Menlo, monospace`. 원격 폰트 요청을 추가하지 않는다. UI에 불필요한 display font·자간 효과·전면 monospace 라벨을 쓰지 않는다. 치수·배율·행 수에는 tabular numbers를 쓴다. 브라우저 글자 확대와 사용자 설정을 차단하지 않는다.

코드 font fallback은 플랫폼마다 지표가 다르다. 실제 선택된 글꼴로 렌더러가 측정해야 하며 고정 문자 수로 폭을 계산하지 않는다. 존재하지 않는 폰트를 선택된 것으로 표시하지 않는다. 폰트 파일을 묶거나 SVG에 임베딩할 경우 라이선스·용량·독립 뷰어 호환성을 Phase 2에서 검증한다. 제공 이미지의 Consolas 16/24px은 예시이며 기존 14/21px 기본값을 대체하지 않는다.

## 3. 간격·경계·치수

| Token family | 값 | 적용 |
|---|---|---|
| `space-0/1/2/3/4/6/8/12` | 0/4/8/12/16/24/32/48px | 4px 기본 단위; 아이콘-라벨 8, 필드 간12, 섹션 안16 |
| `border-width` | 1px | Toolbar·패널 구분, 입력 경계 |
| `radius-none/sm/control/overlay` | 0/4/6/8px | 패널0, 선택행4, 버튼·입력6, 메뉴·모달8 |
| `focus-width/offset` | 2/2px | `:focus-visible`; 레이아웃 이동 없음 |
| `toolbar-height` | 56px | 전역 Toolbar |
| `activity-width` | 56px | Desktop/Tablet rail |
| `context-width` | 224px | History; 초기 사용자 드래그 리사이즈는 범위 밖 |
| `properties-width` | 300px | 오른쪽 dock |
| `workspace-header-height` | 48px | 모드·Keymap·Properties 복원 |
| `status-height` | 28px | 미세 포인터 기준; 터치 인터랙션이 있으면 최소44px |
| `control-height/compact-target` | 32/32px | 입력·버튼, icon-only 버튼의 실제 hit target |
| `touch-target` | 44px | coarse pointer·터치 입력, 서로 겹치지 않음 |
| `panel-padding/section-gap` | 16/16px | 패널 내부, accordion 구분 |
| `canvas-inset` | 24px; mobile16px | 출력 프레임과 작업면 경계 사이; 출력 패딩과 별개 |

입력 한 줄32px, 섹션 header40px 이상, History 행56px 이상, rail 선택 target40px(터치44px)로 한다. 필드 라벨과 컨트롤은 각각 최소80/120px를 확보하고 공간이 부족하면 라벨을 위에 쌓는다. 스냅샷 기본 inner padding24px·radius12px는 UI 반경과 별개다. 숫자 스텝 입력 등에 2px 미세 정렬을 허용하되 새로운 간격 scale로 확장하지 않는다.

28px Status Bar의 미세 포인터 컨트롤은 예외적으로24×24px target을 사용한다. focus는 안쪽2px 링으로 표시해 바에 잘리지 않게 하고 target끼리 겹치지 않는다. coarse pointer에서는 Status Bar와 target 모두44px 이상으로 확장한다. 32px 기본 버튼을 28px 바에 잘라 넣지 않는다.

## 4. 컨트롤과 상태

네이티브 button/input/select/checkbox를 먼저 사용한다. 재사용이 확인된 최소 Primitive만 추출한다. 모든 Primitive가 코드 문서·키맵·렌더러·저장소를 직접 읽지 않고 값·상태·이벤트를 받는다.

| Primitive | 스타일 / 상호작용 계약 |
|---|---|
| Button / IconButton | 기본 ghost, 보조 outlined, 주 동작 Export만 accent. 아이콘16px + 라벨8px 간격; icon-only에 영어 accessible name과 hover/focus tooltip. `type="button"` 기본 |
| Select / TextInput / NumberInput | raised 면, control-border, 6px 반경. 외부 label 연결, placeholder는 label 대용 금지. 단위는 suffix로 표시하고 accessible description에도 제공. 네이티브 select 우선 |
| Switch / Checkbox | label 전체가 target. switch는 `checked`/`aria-checked`, on/off 위치와 색 병행. off 경계는 control-border. 장식 thumb는 배경 대비3:1 이상인 text 또는 on-accent 토큰 사용 |
| Mode tabs | `Editor`/`Preview`, 선택 면 + 하단2px 표시. tablist, roving tabindex, Left/Right·Home/End, Enter/Space 활성화; 화살표 탐색만으로 editor를 재생성하지 않음 |
| Accordion section | 제목 button + chevron + `aria-expanded`/`aria-controls`. 섹션 간1px 경계. 패널만 스크롤하고 제목 hit target40/44px |
| Menu / Popover | button으로 열고 Escape/외부 클릭으로 닫음. 초점 복귀. 메뉴는 화살표 탐색, 네이티브 select는 플랫폼 동작 유지 |
| Drawer / Dialog | 이름과 Close, Escape, 내부 초점 유지, 배경 inert, 닫은 후 trigger 복귀. 하나의 모달만 열며 다른 패널로 전환 시 이전 것 닫음 |
| Tooltip / Feedback | tooltip은 약500ms hover 또는 keyboard focus에 표시. trigger 또는 tooltip 자체에 hover/focus가 있는 동안 유지하고 tooltip 위로 포인터를 옮길 수 있음. Esc로 닫고 클릭 동작을 가리지 않음. 결과는 `aria-live="polite"`에서 한 번 알림; 오류는 해소까지 인접 영역에 유지 |

| 상태 | 규칙 |
|---|---|
| Rest | text/secondary + 해당 면. 선택되지 않은 아이콘도 읽을 수 있는 대비 |
| Hover | ghost→hover 면; outline→hover 면+control-border; 중립 label/icon은 text로 올림; primary→accent-hover + on-accent |
| Pressed | 중립 pressed + text 또는 primary accent-pressed + on-accent. secondary text를 pressed 면에 사용하지 않음. 눌림에 크기 변화·튀는 이동 없음 |
| Selected / Active | selected 면, text, accent 위치 표시와 의미 상태. hover/pressed보다 선택 의미 유지 |
| Focus | 색과 무관하게 focus 2px 링·2px offset. 모달·고정 바·overflow로 잘리지 않도록 공간 확보 |
| Disabled | native disabled + disabled text. 실행 안 함; 사용할 수 없는 이유가 필요하면 인접 도움말 제공. 미구현 기능에는 사용 금지 |
| Busy | 실행한 버튼의 이름을 `Copying…`/`Exporting…`으로 변경, `aria-busy`, 중복 실행 방지. 편집은 계속 허용 |
| Invalid | danger 경계, `aria-invalid`와 연결된 구체적 오류·해결 방법. 입력값 보존; 값이 확정되기 전 잘못된 상태를 렌더러에 전달하지 않음 |

숫자 필드는 선택된 범위·단위와 min/max를 표시한다. 빈 입력·부분 입력 중 편집을 허용하고 blur/Enter에서 검증한다. 실패하면 마지막 유효 프레젠테이션을 유지하며 입력을 조용히 다른 값으로 바꾸지 않는다. 슬라이더를 채택하면 키보드와 숫자 입력 대안을 함께 제공한다. 구현되지 않은 옵션의 비활성 항목 목록도 노출하지 않는다.

## 5. 아이콘

**Lucide만 UI 아이콘으로 사용한다.** 24×24 viewBox, 기본 stroke2, 둥근 cap/join, `currentColor`, fill 없음. 일반16px, rail18px, brand20px; 같은 역할에서 크기를 섞지 않는다. optical 조정이 필요해도 독자 stroke·emoji·다른 icon pack을 섞지 않는다. 개발 시 실제 사용하는 icon만 개별 import하고 버전·라이선스를 기록한다. 이번에는 설치하지 않는다.

| 동작 / 영역 | Lucide 이름 제안 |
|---|---|
| Brand / Editor | `Code2` / `SquareCode` |
| Copy Image / Export | `Copy` / `Download` |
| History / Shortcuts | `History` / `Keyboard` |
| Properties / UI theme | `SlidersHorizontal` / `Moon`, `Sun` |
| 좌우 접기·복원 | `PanelLeftClose`, `PanelLeftOpen`, `PanelRightClose`, `PanelRightOpen` |
| Preview / Zoom | `Eye` / `Minus`, `Plus`, `Maximize` |
| 선택·오류·닫기 | `Check`, `CircleAlert`, `X` |

Lucide의 실제 export 이름은 설치할 버전에서 확인한다. brand mark도 Lucide로 통일하고 현재 임시 코드 문자·손으로 그린 UI SVG는 후속 셸 적용 때 교체한다. 스냅샷 내부의 언어 아이콘은 별도 자산 규칙을 허용한다: 로컬 포함·라이선스 확인·외부 URL 없음·일정16px box, 없는 언어는 중립 Lucide 코드 아이콘. 언어 이름이 별도로 있으면 장식으로 숨긴다. macOS traffic lights는 비상호작용 장식이며 버튼이나 UI icon 체계로 취급하지 않는다.

## 6. 반응형·모션·접근성

CSS viewport 기준 wide≥1440, desktop1024–1439, tablet768–1023, mobile320–767px. 패널 배치·복원 위치·초점 규칙은 [와이어프레임](wireframes.md)을 단일 기준으로 한다. 320px 아래에서도 중요한 필드는 내부 스크롤로 접근 가능해야 하며, 앱 전체를 고정1600px로 축소하지 않는다. 200% 브라우저 확대는 축소된 CSS viewport에 해당하는 배치로 전환한다.

- hover/focus 색 전환120ms ease-out. 모달의 opacity120ms/transform180ms `cubic-bezier(0.2,0,0,1)`만 허용한다. 데스크톱 panel collapse의 grid 폭 변경은 즉시 적용한다. 코드 창·캐럿의 확대/측정·입력에 애니메이션을 걸지 않는다.
- `prefers-reduced-motion: reduce`에서는 비필수 전환0ms. `transition: all`, 자동 등장 쇼, 반복 장식 모션은 사용하지 않는다. 전환 도중 입력과 취소가 가능해야 한다.
- skip link `Skip to editor`, 이름 있는 main/aside/nav, 숨겨도 의미 있는 제목 계층을 제공한다. 모든 아이콘 단독 버튼에 영어 이름; 장식 SVG는 `aria-hidden`. 현재 셸의 skip link 접근성을 보존한다.
- 편집기 Tab 들여쓰기와 Escape 후 Tab 탈출 경로를 함께 제공하고 실제 CodeMirror 버전에서 검증한다. 도움말은 포커스 설명에 연결하며 키맵과 OS에 맞춘다. 모달 닫기에는 편집 키맵을 적용하지 않는다.
- 코드·제목·검색은 붙여넣기를 막지 않는다. 맞춤법 검사를 끄고 적합한 inputmode를 사용한다. 포커스된 요소가 바·가상 키보드에 가리지 않도록 스크롤한다. 모바일 자동 포커스로 키보드를 강제로 열지 않는다.
- 제목·파일명은 한 줄 생략 가능하나 전체 값은 접근 가능한 필드/상세 경로에 제공한다. 오류는 줄 바꿈하며 ellipsis 처리하지 않는다. 텍스트 확대·forced colors에서도 포커스·선택을 확인한다.

## 7. 구현 경계와 파일 책임 제안

대규모 디자인 라이브러리를 만들지 않는다. 현재 CSS 접근을 유지하며 다음 경로는 **후속 작업의 제안**이다.

| 경로 / 상태 | 책임 |
|---|---|
| `src/app/tokens.css` (작업6 제안) | 위 semantic 색·spacing·radius·치수, `[data-ui-theme]` 값 |
| `src/components/ui/`의 작은 control (필요한 시점) | Button/IconButton/Field 정도부터. 한 번 쓰는 모든 영역을 Primitive로 추출하지 않음 |
| `src/app/App.tsx`, `app.css` | 영역 조합·layout preference·패널/모달/포커스. 레이아웃용 작은 React state로 충분 |
| `src/state/workspace.ts` (작업2 구현) | 문서·revision·기존 EditorSettings. 기존 `themeId`는 Syntax theme 의미를 유지 |
| `src/editor/` (작업4 입력·키맵 구현) | 입력·선택·Undo 수명과 keymap 재구성. 언어·테마는 작업5~6. 토큰 적용 때문에 EditorView를 재마운트하지 않음 |
| `src/theme/basicThemes.ts` (작업6 계획) | 코드 배경·글자·구문 색 데이터. UI CSS token과 분리 |
| `src/snapshot/`, `src/export/` (Phase2 계획) | 전체 코드·프레젠테이션으로 모델/파일 생성. React UI·CSS viewport·패널에 의존하지 않음 |

UI preference는 `uiTheme`, 패널 표시, accordion, mode, preview zoom 등이다. 문서·프레젠테이션과 분리하고 `SnapshotInput`에 넣지 않는다. keymap·로딩/오류/저장 상태도 출력 입력에서 제외한다. 설정 패널은 값과 action만 받아 같은 설정 원본을 바꾸며 별도 문서 사본을 갖지 않는다. 여러 위치의 같은 컨트롤을 독립 state로 관리하지 않는다. 패널 이동 때문에 editor DOM을 교체하지 않는다.

Phase 1은 메모리 UI state, Phase 3은 검증된 로컬 preference 저장을 다룬다. 코드·히스토리·제목 등을 URL/query·원격 analytics/log에 동기화하지 않는다. drag layout 엔진·전역 event bus·새 상태 라이브러리는 필요하지 않다. PRD의 렌더러 비교 실험과 별도로 token 체계만 먼저 정하며, 이 문서로 SVG 구현을 확정하지 않는다.

## 8. 참고와 검증 경계

- 제공된 `desktop-wireframe.png`, `.svg`, `design-reference.md`(2026-11-07): 영역과 neutral dark 기준. 예시 프롬프트는 작업 지시로 실행하지 않았다. 고정 예시 문서는 앱 초기값이나 모바일 확정 시안이 아니다.
- [CodeSnap editor](https://codesnap.dev/editor): 2026-11-07 화면 확인. 작업면 중심과 주변 도구의 관계만 참고하며 브랜드·문구·자산·기능 범위는 가져오지 않는다.
- [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md): 2026-11-07 확인. 의미 요소·포커스·reduced motion 등 관련 항목을 검토했다. URL 상태 동기화·외부 font preconnect는 개인정보·정적 로컬 자산 정책에 맞춰 채택하지 않는다.
- [Lucide](https://lucide.dev/): UI icon 시스템. 배포 시 해당 소스의 ISC 라이선스 고지를 유지한다.

토큰의 수학적 대비 검토는 [디자인 검증 기록](../../verification/ui-ux-design-system.md)에 남긴다. 작업 3의 기본 입력·키보드·좁은 화면 검증은 [작업 3 보고서](../../verification/task-3-editor-input.md)로 구분한다. 전체 토큰/Light mode·스크린리더·터치·폰트 및 출력 일치는 아직 구현·검증되지 않았다.
