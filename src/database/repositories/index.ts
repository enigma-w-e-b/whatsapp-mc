import { PrismaClient } from "@prisma/client";
import { WhatsappRepository } from "@/database//repositories/whatsapp-repository";


export const loadRepositories = (prisma: PrismaClient): {
    whatsappRepository: WhatsappRepository
}=> {
    return {
        whatsappRepository: new WhatsappRepository(prisma)
    }
}

export {
    WhatsappRepository
}