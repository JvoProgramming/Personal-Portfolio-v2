import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { OpenAppOptions, WindowState } from '../os/store'
import type { UserId } from '../os/users'

export interface AppDefinition {
  id: string
  title: string
  icon: string
  /** Which accounts see this app on their desktop and Start menu. Empty = opened by other apps only. */
  users: UserId[]
  /** Listed inside My Documents. */
  inDocuments?: boolean
  size?: OpenAppOptions
  component: LazyExoticComponent<ComponentType<{ win: WindowState }>>
}

const BOTH: UserId[] = ['johnny', 'guest']
const JOHNNY: UserId[] = ['johnny']

// Apps load on first open, so the desktop stays fast.
export const APPS: AppDefinition[] = [
  { id: 'resume', title: 'Resume', icon: '📄', users: BOTH, inDocuments: true, size: { width: 720, height: 600 }, component: lazy(() => import('./ResumeApp')) },
  { id: 'projects', title: 'Projects', icon: '📁', users: BOTH, inDocuments: true, component: lazy(() => import('./ProjectsApp')) },
  { id: 'work-blog', title: 'Work Blog', icon: '📰', users: BOTH, inDocuments: true, component: lazy(() => import('./WorkBlogApp')) },
  { id: 'wikipedia', title: 'Wikipedia: Johnny', icon: '🌐', users: BOTH, size: { width: 720, height: 560 }, component: lazy(() => import('./WikipediaApp')) },
  { id: 'contact', title: 'Contact', icon: '✉️', users: BOTH, size: { width: 560, height: 420 }, component: lazy(() => import('./ContactApp')) },
  { id: 'garden', title: 'Digital Garden', icon: '🌱', users: BOTH, inDocuments: true, component: lazy(() => import('./GardenApp')) },
  { id: 'cookbook', title: 'Cookbook', icon: '🍳', users: JOHNNY, inDocuments: true, component: lazy(() => import('./CookbookApp')) },
  { id: 'mochi', title: 'Mochi', icon: '🐶', users: JOHNNY, inDocuments: true, component: lazy(() => import('./MochiApp')) },
  { id: 'travel', title: 'Travel', icon: '✈️', users: JOHNNY, inDocuments: true, component: lazy(() => import('./TravelApp')) },
  { id: 'wallpapers', title: 'Fandom Wallpapers', icon: '🖼️', users: JOHNNY, inDocuments: true, component: lazy(() => import('./WallpapersApp')) },
  { id: 'infp', title: 'INFP', icon: '💭', users: JOHNNY, size: { width: 520, height: 480 }, component: lazy(() => import('./InfpApp')) },
  { id: 'games', title: 'Games', icon: '🎮', users: JOHNNY, size: { width: 520, height: 400 }, component: lazy(() => import('./GamesApp')) },
  { id: 'arcade', title: 'Arcade', icon: '🕹️', users: JOHNNY, size: { width: 760, height: 560 }, component: lazy(() => import('./ArcadeApp')) },
  { id: 'myspace', title: 'MySpace', icon: '🎸', users: JOHNNY, size: { width: 820, height: 600 }, component: lazy(() => import('./MySpaceApp')) },
  { id: 'montage', title: 'Montage Player', icon: '🎬', users: JOHNNY, size: { width: 820, height: 600 }, component: lazy(() => import('./MontageApp')) },
  { id: 'my-documents', title: 'My Documents', icon: '🗂️', users: BOTH, component: lazy(() => import('./MyDocumentsApp')) },
  { id: 'credits', title: 'About & Credits', icon: 'ℹ️', users: BOTH, size: { width: 600, height: 520 }, component: lazy(() => import('./CreditsApp')) },
  { id: 'recycle-bin', title: 'Recycle Bin', icon: '🗑️', users: BOTH, component: lazy(() => import('./RecycleBinApp')) },
  // Opened from other apps only.
  { id: 'project', title: 'Project', icon: '📁', users: [], component: lazy(() => import('./ProjectApp')) },
]

export function getApp(id: string): AppDefinition | undefined {
  return APPS.find((a) => a.id === id)
}

export function appsForUser(user: UserId): AppDefinition[] {
  return APPS.filter((a) => a.users.includes(user))
}
