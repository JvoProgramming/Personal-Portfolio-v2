import { create } from 'zustand'
import { storage } from './env'

export type Lang = 'en' | 'vi'

const en = {
  'lang.switch': 'Tiếng Việt',
  'lang.switchLabel': 'Switch language to Vietnamese',
  'room.loading': "Loading Johnny's room…",
  'room.hint': 'Click the computer to turn it on',
  'room.skipDesktop': 'Skip to desktop',
  'room.skipResume': 'Skip to resume →',
  'room.close': 'Close',
  'room.laTime': 'Los Angeles',
  'welcome.begin': 'To begin, click your user name',
  'welcome.turnOff': 'Turn off computer',
  'welcome.skipResume': 'Skip to resume →',
  'start.logOff': 'Log Off',
  'start.turnOff': 'Turn Off Computer',
  'start.printable': 'Printable resume',
  'shutdown.safe': "It's now safe to turn off your computer.",
  'shutdown.on': 'Turn it back on',
  'user.guest': 'Recruiter / Guest',
  'user.guest.sub': 'Resume, projects and work',
  'user.johnny': 'Johnny',
  'user.johnny.sub': 'Everything, including Mochi',
  'app.resume': 'Resume',
  'app.projects': 'Projects',
  'app.work-blog': 'Work Blog',
  'app.wikipedia': 'Wikipedia: Johnny',
  'app.contact': 'Contact',
  'app.garden': 'Digital Garden',
  'app.cookbook': 'Cookbook',
  'app.mochi': 'Mochi',
  'app.travel': 'Travel',
  'app.wallpapers': 'Fandom Wallpapers',
  'app.infp': 'INFP',
  'app.games': 'Games',
  'app.arcade': 'Arcade',
  'app.myspace': 'MySpace',
  'app.montage': 'Montage Player',
  'app.my-documents': 'My Documents',
  'app.recycle-bin': 'Recycle Bin',
  'obj.computer': 'Computer: click to turn it on',
  'obj.lamp': 'Desk lamp: click to switch it',
  'obj.chair': 'Office chair: drag to spin it',
  'obj.mochi': 'Mochi: click and she fetches her bone',
  'obj.photos': 'Photo: click to view',
  'obj.food': 'Dinner: click to open the Cookbook',
  'obj.gameboy': 'Game Boy: click to look closer',
  'obj.guitar': 'Guitar controller: rhythm game coming soon',
  'obj.tennis': 'Tennis gear',
  'obj.window': 'Window: the sky matches the time in LA',
  'obj.poster': 'Poster',
}

type Key = keyof typeof en

const vi: Partial<Record<Key, string>> = {
  'lang.switch': 'English',
  'lang.switchLabel': 'Chuyển sang tiếng Anh',
  'room.loading': 'Đang tải phòng của Johnny…',
  'room.hint': 'Nhấn vào máy tính để bật',
  'room.skipDesktop': 'Vào màn hình chính',
  'room.skipResume': 'Xem CV →',
  'room.close': 'Đóng',
  'room.laTime': 'Los Angeles',
  'welcome.begin': 'Để bắt đầu, hãy nhấn vào tên người dùng',
  'welcome.turnOff': 'Tắt máy tính',
  'welcome.skipResume': 'Xem CV →',
  'start.logOff': 'Đăng xuất',
  'start.turnOff': 'Tắt máy',
  'start.printable': 'CV bản in',
  'shutdown.safe': 'Bây giờ bạn có thể tắt máy tính an toàn.',
  'shutdown.on': 'Bật lại',
  'user.guest': 'Nhà tuyển dụng / Khách',
  'user.guest.sub': 'CV, dự án và công việc',
  'user.johnny.sub': 'Mọi thứ, kể cả Mochi',
  'app.resume': 'Sơ yếu lý lịch',
  'app.projects': 'Dự án',
  'app.work-blog': 'Blog công việc',
  'app.contact': 'Liên hệ',
  'app.garden': 'Khu vườn số',
  'app.cookbook': 'Sổ nấu ăn',
  'app.travel': 'Du lịch',
  'app.wallpapers': 'Hình nền fandom',
  'app.games': 'Trò chơi',
  'app.arcade': 'Khu trò chơi',
  'app.montage': 'Trình phát montage',
  'app.my-documents': 'Tài liệu của tôi',
  'app.recycle-bin': 'Thùng rác',
  'obj.computer': 'Máy tính: nhấn để bật',
  'obj.lamp': 'Đèn bàn: nhấn để bật hoặc tắt',
  'obj.chair': 'Ghế: kéo để xoay',
  'obj.mochi': 'Mochi: nhấn để Mochi đi lấy xương',
  'obj.photos': 'Ảnh: nhấn để xem',
  'obj.food': 'Bữa tối: nhấn để mở Sổ nấu ăn',
  'obj.gameboy': 'Game Boy: nhấn để xem gần',
  'obj.guitar': 'Tay cầm guitar: trò chơi sắp ra mắt',
  'obj.tennis': 'Đồ tennis',
  'obj.window': 'Cửa sổ: bầu trời theo giờ Los Angeles',
  'obj.poster': 'Áp phích',
}

export type TKey = Key

interface LangState {
  lang: Lang
  toggle: () => void
}

export const useLang = create<LangState>((set, get) => ({
  lang: storage.get<Lang>('lang', 'en'),
  toggle: () => {
    const lang: Lang = get().lang === 'en' ? 'vi' : 'en'
    storage.set('lang', lang)
    document.documentElement.lang = lang
    set({ lang })
  },
}))

export function translate(lang: Lang, key: TKey): string {
  return (lang === 'vi' ? vi[key] : undefined) ?? en[key]
}

export function useT() {
  const lang = useLang((s) => s.lang)
  return (key: TKey) => translate(lang, key)
}

/** Translated app name, or the given fallback for apps without one (e.g. a project window). */
export function useAppTitle() {
  const t = useT()
  return (appId: string, fallback: string) => {
    const key = `app.${appId}` as TKey
    return key in en ? t(key) : fallback
  }
}
