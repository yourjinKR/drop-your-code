export function App() {
  return (
    <>
      <a className="skip-link" href="#workspace">
        작업 공간으로 건너뛰기
      </a>

      <header className="app-header" aria-label="Drop Your Code">
        <div className="header-content">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">{'</>'}</span>
            <h1>Drop Your Code</h1>
          </div>
          <p className="privacy-note">
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none" aria-hidden="true">
              <path
                d="M8 1.5 14 4v5c0 3.3-2.5 5.8-6 7.5C4.5 14.8 2 12.3 2 9V4l6-2.5Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <path d="m5 8.5 2 2 4-4" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            브라우저 안에서만 작업
          </p>
        </div>
      </header>

      <main
        className="workspace"
        id="workspace"
        aria-labelledby="workspace-heading"
        tabIndex={-1}
      >
        <div className="workspace-heading">
          <h2 id="workspace-heading">작업 공간</h2>
          <p>코드를 담고, 이미지로 나눌 공간을 준비하고 있습니다.</p>
        </div>

        <div className="workspace-layout">
          <section className="editor-placeholder" aria-labelledby="editor-heading">
            <div className="panel-header">
              <h3 id="editor-heading">코드 편집 영역</h3>
              <span className="availability">준비 중</span>
            </div>
            <div className="empty-workspace">
              <svg width="72" height="64" viewBox="0 0 72 64" fill="none" aria-hidden="true">
                <path
                  d="m22 18-14 14 14 14m28-28 14 14-14 14M41 10 31 54"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h4>코드 편집 기능을 준비하고 있어요</h4>
              <p>편집과 이미지 내보내기는 다음 업데이트에서 사용할 수 있습니다.</p>
            </div>
          </section>

          <aside className="settings-panel" aria-labelledby="settings-heading">
            <h2 id="settings-heading">설정</h2>
            <p>편집기가 제공되면 언어와 스타일을 여기에서 설정할 수 있습니다.</p>
          </aside>
        </div>
      </main>

      <footer className="app-footer">
        <p>코드와 작업 기록은 외부로 전송되지 않습니다.</p>
      </footer>
    </>
  );
}
