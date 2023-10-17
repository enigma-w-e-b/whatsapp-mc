import { WhatsappModel } from "@/interfaces/whatsapp"


export interface CreateWhatsappRepository {
  create: (params: CreateWhatsappRepository.Params) => Promise<CreateWhatsappRepository.Result>
}

export namespace CreateWhatsappRepository {
  export type Params = {
    name: string
    subscriptionId: number
    ownerJid: string
    accountId: number
  }

  export type Result = WhatsappModel
}
