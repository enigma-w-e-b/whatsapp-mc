import { Loader } from "@/interfaces/loader"
import { logger } from "@/utils/logger"

export async function wbotMessageListener({ socket, whatsapp, ...repositories }: Loader): Promise<void> {
    logger.info('Sistema inicializado com sucesso; Escutando mensagens.')

    socket.ev.on('messages.upsert', (message) => {
        console.log('messages.upsert', message)
    })

    socket.ev.on('group-participants.update', (groupParticipantsUpdate) => {
        console.log('group-participants.update', groupParticipantsUpdate)
    })
}
