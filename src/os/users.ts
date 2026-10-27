export type UserId = 'johnny' | 'guest'

export interface UserAccount {
  id: UserId
  name: string
  subtitle: string
  avatar: string
  wallpaper: string
}

export const USERS: UserAccount[] = [
  {
    id: 'guest',
    name: 'Recruiter / Guest',
    subtitle: 'Resume, projects and work',
    avatar: '💼',
    wallpaper: '/wallpapers/hill.svg',
  },
  {
    id: 'johnny',
    name: 'Johnny',
    subtitle: 'Everything, including Mochi',
    avatar: '🐶',
    wallpaper: '/wallpapers/night.svg',
  },
]

export function getUser(id: UserId): UserAccount {
  return USERS.find((u) => u.id === id) ?? USERS[0]
}
