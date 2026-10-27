import { useState } from 'react'
import { recycleBin } from '../content/personal'
import { ExplorerBar, StatusBar } from './shared'

export default function RecycleBinApp() {
  const [items, setItems] = useState(recycleBin)
  return (
    <div className="app-explorer">
      <ExplorerBar path="Recycle Bin" />
      <div className="app-toolbar">
        <button type="button" disabled={items.length === 0} onClick={() => setItems([])}>
          🗑 Empty Recycle Bin
        </button>
      </div>
      <div className="app-table-wrap">
        <table className="app-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Original location</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.name}>
                <td>📄 {i.name}</td>
                <td>{i.from}</td>
                <td>{i.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="app-pad muted">The Recycle Bin is empty. Those memories are gone forever.</p>}
      </div>
      <StatusBar>{items.length} objects</StatusBar>
    </div>
  )
}
