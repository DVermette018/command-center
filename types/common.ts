export interface Pagination {
  pageIndex: number
  pageSize: number
}

export interface SelectOption {
  label: string
  value: string | number
}

export const PERIODS = ['daily', 'weekly', 'monthly'] as const
export type Period = typeof PERIODS[number]

export interface Range {
  start: Date
  end: Date
}

export interface FlatListHeader {
  key: string | number
  type: 'header'
  label: string
}

export interface FlatListLoader {
  type: 'loader'
  key: 'top' | 'bottom'
}

export interface FlatListElement<T = any> {
  key: string | number
  type: 'item'
  data: T
}

export type FlatListItem<T = any> = FlatListHeader | FlatListElement<T> | FlatListLoader
export type FlatList<T = any> = FlatListItem<T>[]

export type WithId<T, ID = number> = T & { id: ID }
