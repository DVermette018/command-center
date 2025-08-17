export enum DocumentType {
  CONTRACT = "CONTRACT",
  PROPOSAL = "PROPOSAL",
  INVOICE = "INVOICE",
  LOGO = "LOGO",
  BRAND_GUIDE = "BRAND_GUIDE",
  DESIGN_FILE = "DESIGN_FILE",
  REPORT = "REPORT",
  OTHER = "OTHER",
}

export interface Document {
  id: string
  customerId?: string
  projectId?: string
  type: DocumentType
  name: string
  description?: string
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
  version: number
  isActive: boolean
  uploadedBy?: string
  createdAt: Date
  updatedAt: Date
}
