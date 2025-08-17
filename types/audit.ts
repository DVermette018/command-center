export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  VIEW = "VIEW",
  STATUS_CHANGE = "STATUS_CHANGE",
  ASSIGN = "ASSIGN",
  UNASSIGN = "UNASSIGN",
}

export interface AuditLog {
  id: string
  createdAt: Date
  entityType: string
  entityId: string
  action: AuditAction
  changes?: any
  userId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: any
}
