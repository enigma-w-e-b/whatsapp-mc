import { WhatsappModel } from "@/interfaces/whatsapp"

export interface LoadWhatsappsRepository {
  loadWhatsapps: (accountId: number) => Promise<LoadWhatsappsRepository.Result>
}

export namespace LoadWhatsappsRepository {
  export type Result = WhatsappModel[]
}
