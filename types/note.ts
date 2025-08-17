export enum NoteType {
  GENERAL = "GENERAL",
  MEETING = "MEETING",
  PHONE_CALL = "PHONE_CALL",
  EMAIL = "EMAIL",
  REQUIREMENT = "REQUIREMENT",
  ISSUE = "ISSUE",
  RESOLUTION = "RESOLUTION",
  TASK = "TASK",
  FEEDBACK = "FEEDBACK",
  INTERNAL = "INTERNAL",
}

export interface Note {
  id: string
  customerId?: string
  projectId?: string
  content: string
  type: NoteType
  authorId: string
  isInternal: boolean
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}
