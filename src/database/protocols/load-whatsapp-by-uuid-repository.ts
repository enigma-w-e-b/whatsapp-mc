import { WhatsappModel } from "@/interfaces/whatsapp"

export interface LoadWhatsappByUuidRepository {
  loadByUuid: (uuid: string, accountId: number) => Promise<LoadWhatsappByUuidRepository.Result>
}

export namespace LoadWhatsappByUuidRepository {
  export type Result = WhatsappModel
}
