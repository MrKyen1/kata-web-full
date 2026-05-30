import { Class } from "./class"

export interface Center {
  id: string
  name: string
  address: string
  phone: string
  email: string
  description?: string
  image?: string
  mapEmbedUrl?: string
  isActive: boolean
  classes?: Class[]
}
