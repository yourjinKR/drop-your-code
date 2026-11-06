# UI/UX Design System 명세 작업 계획

**상태:** 디자인 제안 작성·문서 검증 완료. 사용자 리뷰 전이며 앱 구현 승인이 아니다.

**Goal:** Minimal Developer Workspace의 시각 규칙·화면 동작·단계별 적용 범위를 문서로 결정하고 별도 PR로 리뷰받는다.

**Architecture:** 디자인 토큰과 작은 UI Primitive는 앱 셸이 사용한다. 편집기 상태·스냅샷 입력·렌더링·내보내기 경계는 기존 아키텍처를 유지한다.

**Tech Stack:** 문서와 ASCII 와이어프레임. React·TypeScript·Vite 코드는 이번에 변경하지 않는다.

**Spec:** [사용자 작업에 대응하는 UI 명세](../architecture/design/ui-spec.md), [PRD](../product/PRD.md), [Phase 1 계획](phase-1-editor-foundation.md).

## 범위와 파일

| 파일 | 책임 |
|---|---|
| `docs/architecture/design/design-system.md` | 토큰, 상태, Primitive, 디자인과 기능 상태의 경계 |
| `docs/architecture/design/wireframes.md` | 영역 치수, 패널, 모드, Desktop/Tablet/Mobile |
| `docs/architecture/design/ui-spec.md` | 기능별 UI 계약, 영어 정책, 기존 명세와 변경점 |
| `docs/plans/phase-1-editor-foundation.md` | 작업 2~6 범위를 보존한 디자인 적용 순서 |
| `AGENTS.md` | 짧은 UI 규칙과 문서 참조 |
| `docs/architecture/testing/strategy.md` | FR-STYLE-04의 오래된 참조 이미지 부재 설명만 갱신 |
| `docs/verification/ui-ux-design-system.md` | 실제 검증 결과와 미검증 항목 |

## 공통 제약

- Design Specification Only. 컴포넌트·셸 리팩토링·패키지 설치·PRD 변경은 수행하지 않는다.
- 사용자 코드·히스토리 외부 전송 금지, 클라이언트 전용 정적 구조를 유지한다.
- 영어 UI, Lucide UI 아이콘, 독립적인 UI 테마와 Syntax theme를 명세한다.
- 미구현 기능의 준비 중 버튼을 만들지 않는다. 참고 이미지의 예시값으로 기존 상태 기본값을 덮어쓰지 않는다.
- 하나의 `codex/` 문서 브랜치와 `main` 대상 PR로 제출하며 병합·배포하지 않는다. 후속 구현은 사용자 리뷰와 별도 요청 이후다.

## 검토 초점

| 위험 | 이 문서 작업에서의 확인 |
|---|---|
| 목표 이미지가 기능 범위로 오해됨 | UI 명세의 기능 노출 표와 Phase 1 작업별 적용 표 대조 |
| UI 테마가 출력 색에 혼입 | 상태 경계와 SnapshotInput 제외 항목 대조 |
| 패널·모바일 축소로 편집/저장 접근 상실 | 320px부터 Desktop까지 ASCII 구조·치수 산술·포커스 동선 검토 |
| 컴팩트 UI의 접근성 저하 | 대비 계산, 터치 목표, 키보드·모달·축소 동작 명세 검토 |
| 현재 셸과 제안이 혼동됨 | 구현 상태, 변경 대상 문구, 실제/미검증 기록 분리 |

## 순서와 확인 가능한 결과

- [x] 관련 문서·현재 소스·제공 PNG/SVG/Markdown·CodeSnap 화면을 조사하고 차이를 기록한다.
- [x] 디자인 토큰·컴포넌트 상태·레이아웃을 작성한다. 수치의 기준 문서를 하나로 정한다.
- [x] 기존 UI 명세와 작업 2~6 계획을 통합한다. 함수 계약·검증 명령·기능 범위 보존을 diff로 확인한다.
- [x] 새 문서를 독립 검토하고 링크·대비·치수·범위·영어 정책을 검증한다. `git diff --check` 종료 0을 확인한다.
- [x] 검증 기록과 PR 템플릿에 담을 실제 결과·한계를 준비한다. 앱 테스트는 코드 변경 없음에 따라 미실행으로 기록한다. PR 생성 결과는 최종 보고에서 확인한다.

이 체크리스트는 문서 작업의 진행 상태다. 후속 Phase 1 기능 완료 표시와 무관하다.
