export enum DayOfWeek {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
}

export interface BusinessSchedule {
  id: string
  businessProfileId: string
  dayOfWeek: DayOfWeek
  openTime?: string
  closeTime?: string
  isClosed: boolean
  breakStart?: string
  breakEnd?: string
}
