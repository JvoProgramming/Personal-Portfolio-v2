import { useState } from 'react'
import { recipes } from '../content/personal'
import type { WindowState } from '../os/store'
import { ExplorerBar, GridItem, IconGrid } from './shared'

export default function CookbookApp({ win }: { win: WindowState }) {
  const [id, setId] = useState<string | null>(win.props?.recipe ?? null)
  const recipe = recipes.find((r) => r.id === id)

  if (recipe) {
    return (
      <div className="app-explorer">
        <ExplorerBar path={`C:\\Cookbook\\${recipe.name}.txt`} onBack={() => setId(null)} />
        <div className="app-pad">
          <h2 className="app-heading">
            <span aria-hidden="true">{recipe.emoji}</span> {recipe.name}
          </h2>
          <p className="muted">⏱ {recipe.time}</p>
          <p>{recipe.blurb}</p>
          <fieldset>
            <legend>Ingredients</legend>
            <ul>
              {recipe.ingredients.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </fieldset>
          <fieldset>
            <legend>Steps</legend>
            <ol>
              {recipe.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </fieldset>
        </div>
      </div>
    )
  }

  return (
    <div className="app-explorer">
      <ExplorerBar path="C:\Cookbook" />
      <IconGrid>
        {recipes.map((r) => (
          <GridItem key={r.id} icon={r.emoji} label={r.name} onOpen={() => setId(r.id)} />
        ))}
      </IconGrid>
    </div>
  )
}
