export default function NotFound() {
  return (
    <main style={{ fontFamily: 'Tahoma, sans-serif', color: '#fff', background: '#0a246a', minHeight: '100%', padding: 32 }}>
      <h1>A problem has been detected.</h1>
      <p>PAGE_NOT_FOUND: the page you were looking for isn't on this computer.</p>
      <p>
        <a href="/" style={{ color: '#fff' }}>
          Restart (go home)
        </a>{' '}
        or{' '}
        <a href="/resume" style={{ color: '#fff' }}>
          view the resume
        </a>
        .
      </p>
    </main>
  )
}
