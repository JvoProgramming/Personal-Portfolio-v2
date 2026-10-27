import { loadFolder } from './markdown'

// Drop a new .md file into content/blog or content/garden and it shows up automatically.
export const blogPosts = loadFolder(
  import.meta.glob<string>('./blog/*.md', { query: '?raw', import: 'default', eager: true }),
)

export const gardenNotes = loadFolder(
  import.meta.glob<string>('./garden/*.md', { query: '?raw', import: 'default', eager: true }),
)
