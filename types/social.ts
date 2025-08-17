export enum SocialPlatform {
  FACEBOOK = "FACEBOOK",
  INSTAGRAM = "INSTAGRAM",
  TWITTER = "TWITTER",
  LINKEDIN = "LINKEDIN",
  TIKTOK = "TIKTOK",
  YOUTUBE = "YOUTUBE",
  WHATSAPP = "WHATSAPP",
  OTHER = "OTHER",
}

export interface SocialMediaProfile {
  id: string
  businessProfileId: string
  platform: SocialPlatform
  url?: string
  username?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
