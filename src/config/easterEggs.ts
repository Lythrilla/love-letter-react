export interface EasterEgg {
  id: string
  type: 'visit_count' | 'date_range' | 'anniversary' | 'time_range' | 'long_absence'
  triggerCount?: number
  startDate?: string
  endDate?: string
  anniversaryDate?: string
  startHour?: number
  endHour?: number
  absenceDays?: number
  title: string
  message: string
  emoji?: string
  background?: string
  textColor?: 'light' | 'dark'
  showConfetti?: boolean
  duration?: number
}

export const easterEggs: EasterEgg[] = [
  {
    id: 'visit_10',
    type: 'visit_count',
    triggerCount: 10,
    title: '第十次',
    message: '这是你第十次来看我啦\n\n谢谢你的陪伴',
    emoji: '🌟',
    background: 'linear-gradient(135deg, #6A00FF 0%, #FF2D95 55%, #FFD166 100%)',
    showConfetti: true,
  },

  {
    id: 'new_year',
    type: 'date_range',
    startDate: '2026-01-01',
    endDate: '2026-01-03',
    title: '新年快乐',
    message: '新年快乐！\n\n祝你新的一年\n身体健康\n万事如意',
    emoji: '🎆',
    background: 'linear-gradient(135deg, #4776E6 0%, #8E54E9 55%, #FF3CAC 100%)',
    showConfetti: true,
  },

  {
    id: 'late_night',
    type: 'time_range',
    startHour: 0,
    endHour: 5,
    title: '夜深了',
    message: '这么晚了还不睡吗\n\n早点休息吧\n\n晚安',
    emoji: '🌙',
    background: 'linear-gradient(135deg, #0F2027 0%, #203A43 55%, #2C5364 100%)',
  },
  {
    id: 'good_morning',
    type: 'time_range',
    startHour: 6,
    endHour: 9,
    title: '早安',
    message: '早上好！\n\n新的一天开始了\n\n今天也要加油哦',
    emoji: '☀️',
    background: 'linear-gradient(135deg, #f5af19 0%, #f12711 55%, #FFD166 100%)',
  },
]

export function isInDateRange(startDate: string, endDate: string): boolean {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)
  return now >= start && now <= end
}

export function isAnniversary(anniversaryDate: string): boolean {
  const now = new Date()
  const [month, day] = anniversaryDate.split('-').map(Number)
  return now.getMonth() + 1 === month && now.getDate() === day
}

export function isInTimeRange(startHour: number, endHour: number): boolean {
  const now = new Date()
  const hour = now.getHours()
  if (startHour <= endHour) {
    return hour >= startHour && hour < endHour
  } else {
    return hour >= startHour || hour < endHour
  }
}

export function getTriggeredEasterEgg(
  visitCount: number,
  lastVisitDate: string | null,
  triggeredIds: string[]
): EasterEgg | null {
  const now = new Date()
  const priorityOrder: EasterEgg['type'][] = ['visit_count', 'date_range', 'anniversary', 'long_absence', 'time_range']
  
  for (const priority of priorityOrder) {
    for (const egg of easterEggs) {
      if (egg.type !== priority) continue
      if (triggeredIds.includes(egg.id)) continue

      switch (egg.type) {
        case 'visit_count':
          if (egg.triggerCount && visitCount === egg.triggerCount) return egg
          break
        case 'date_range':
          if (egg.startDate && egg.endDate && isInDateRange(egg.startDate, egg.endDate)) return egg
          break
        case 'anniversary':
          if (egg.anniversaryDate && isAnniversary(egg.anniversaryDate)) return egg
          break
        case 'long_absence':
          if (egg.absenceDays && lastVisitDate) {
            const lastVisit = new Date(lastVisitDate)
            const daysSinceLastVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
            if (daysSinceLastVisit >= egg.absenceDays) return egg
          }
          break
        case 'time_range':
          if (egg.startHour !== undefined && egg.endHour !== undefined && isInTimeRange(egg.startHour, egg.endHour)) return egg
          break
      }
    }
  }
  return null
}

export function getMissedEasterEggs(triggeredIds: string[]): EasterEgg[] {
  const missed: EasterEgg[] = []
  const now = new Date()

  for (const egg of easterEggs) {
    if (triggeredIds.includes(egg.id)) continue
    if (egg.type === 'date_range' && egg.startDate && egg.endDate) {
      const end = new Date(egg.endDate)
      end.setHours(23, 59, 59, 999)
      if (now > end) missed.push(egg)
    }
  }
  return missed
}
