# Drop Your Code

브라우저에서 코드 스냅샷을 만드는 정적 앱입니다. 현재 구현 범위는 [Phase 1 작업 1](docs/plans/task-1-static-app.md)의 앱 셸과 검증 기반입니다. 코드 편집·키맵·설정·이미지 출력·히스토리는 후속 작업입니다.

## 시작하기

Node.js `^22.22.2 || ^24.15.0 || >=26.0.0`과 npm을 사용합니다. 검증 환경은 Node 22.23.2 / npm 10.9.8입니다. 앱 의존성은 `package-lock.json`으로 고정하며 스킬용 `skills-lock.json`과 별개입니다.

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

표시된 localhost URL로 접속합니다. 앱은 자체 정적 자산과 시스템 글꼴만 사용합니다. 백엔드·계정·원격 API·분석 도구는 없습니다.

## 검증

```sh
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:browser -- tests/browser/foundation.spec.ts --project=chromium
```

- `typecheck`: 앱·테스트·구성 파일을 strict TypeScript로 검사합니다. Vite 빌드는 타입 검사를 대신하지 않습니다.
- `test`: Vitest + Testing Library + jsdom으로 React 마운트를 검사합니다. 후속 상태/로직 테스트도 같은 명령에 추가합니다.
- `test:browser`: 기본적으로 앱을 빌드하고 localhost의 production preview 서버를 직접 시작·정리합니다. 포트 `4173`은 비워 두세요. 외부 HTTP/WebSocket 요청은 차단하고 테스트를 실패시킵니다.
- Playwright에는 Chromium·Firefox·WebKit 프로젝트가 있습니다. 필요한 브라우저를 `npx playwright install firefox webkit`으로 추가하고 `--project`를 생략하면 전체 프로젝트를 실행합니다. WebKit 자동화가 실제 Safari/macOS 검증을 대신하지는 않습니다.

개발 서버도 같은 테스트로 검사할 수 있습니다. PowerShell:

```powershell
$env:PLAYWRIGHT_SERVER_MODE = 'dev'
npm run test:browser -- tests/browser/foundation.spec.ts --project=chromium
Remove-Item Env:PLAYWRIGHT_SERVER_MODE
```

브라우저 테스트는 페이지 로드부터 셸·키보드 이동·360/768/1280px 레이아웃·200% CSS zoom·외부 요청·HTTP/콘솔/런타임 오류를 확인합니다. CSS zoom은 실제 브라우저 확대와 구분합니다. 실제 실행 결과와 미검증 항목은 [작업 1 검증 보고서](docs/verification/task-1-static-app.md)에 기록합니다.

## 정적 산출물

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

산출물은 `dist/`의 HTML/CSS/JS와 favicon입니다. Vite preview는 로컬 확인용입니다. 배포 서버에는 빌드 후 `dist/`만 제공하면 됩니다. Vercel 설정은 Framework `Vite`, Build Command `npm run build`, Output Directory `dist`를 사용하고 위 Node 조건을 충족하는 버전을 선택합니다. 서버 함수·인증·환경 변수는 필요하지 않습니다. 이 작업에서는 배포를 수행하지 않습니다.

## 문서

- [제품 요구사항](docs/product/PRD.md)
- [아키텍처](docs/architecture/overview.md)
- [Phase 1 작업 계획](docs/plans/phase-1-editor-foundation.md)
- [검증 전략](docs/architecture/testing/strategy.md)
