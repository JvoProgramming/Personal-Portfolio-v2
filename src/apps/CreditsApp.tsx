import { CreditsList } from '../components/CreditsList'

export default function CreditsApp() {
  return (
    <div className="app-pad">
      <h2 className="app-heading">About Johnny XP</h2>
      <p>A portfolio that looks like a Windows XP desktop inside a 3D bedroom. Built with React, three.js and React Three Fiber.</p>
      <h3>3D model credits</h3>
      <CreditsList />
    </div>
  )
}
