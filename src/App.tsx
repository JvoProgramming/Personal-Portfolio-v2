import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

// Each route is its own chunk, so the plain resume page never loads the OS or 3D code.
const OsRoot = lazy(() => import('./os/OsRoot.tsx'))
const ResumePage = lazy(() => import('./pages/ResumePage.tsx'))
const NotFound = lazy(() => import('./pages/NotFound.tsx'))
const CreditsPage = lazy(() => import('./pages/CreditsPage.tsx'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="route-loading" aria-busy="true" />}>
        <Routes>
          <Route path="/" element={<OsRoot />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/credits" element={<CreditsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
