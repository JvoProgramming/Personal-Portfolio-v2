import { blogPosts } from '../content/posts'
import { MarkdownReader } from './MarkdownReader'

export default function WorkBlogApp() {
  return <MarkdownReader docs={blogPosts} path="C:\Work Blog" kind="blog" />
}
