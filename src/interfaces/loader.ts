import { WhatsappRepository } from "@/database/repositories"
import { MessageUpsertType, ParticipantAction, WASocket, proto } from "@whiskeysockets/baileys"
import { WhatsappModel } from "./whatsapp"

export interface Loader {
    socket: WASocket
    message?: {
      messages: proto.IWebMessageInfo[]
      type: MessageUpsertType
    }
    groupParticipantsUpdate?: {
      id: string
      participants: string[]
      action: ParticipantAction
    }
    webMessage?: proto.IWebMessageInfo
    whatsapp: WhatsappModel
    whatsappRepository: WhatsappRepository
  }