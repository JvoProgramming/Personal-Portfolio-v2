import { gardenNotes } from '../content/posts'
import { MarkdownReader } from './MarkdownReader'

export default function GardenApp() {
  return <MarkdownReader docs={gardenNotes} path="C:\Digital Garden" kind="garden" />
}
