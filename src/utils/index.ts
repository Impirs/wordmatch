// Реэкспорт всего из gameLogic
export type { CardData, QueuePair, PendingHalf } from './gameLogic'
export {
  shuffleArray,
  getEnabledSets,
  prepareGameWords,
  createCards,
  prepareInitialSlots,
  replaceCardInSlots,
  formatTime,
} from './gameLogic'

// Функция для получения правильного пути к ресурсам из public
export function getAssetPath(path: string): string {
  const base: string = import.meta.env.BASE_URL ?? '/'
  // Убираем начальный слэш из path, если он есть
  const cleanPath: string = path.startsWith('/') ? path.slice(1) : path
  // Убираем конечный слэш из base, если он есть
  const cleanBase: string = base.endsWith('/') ? base.slice(0, -1) : base
  return `${cleanBase}/${cleanPath}`
}
