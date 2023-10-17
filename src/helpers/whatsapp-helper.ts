import { type loadRepositories } from '@/database/repositories'
import { initWhatsappBot, removeWbot } from '@/libs/whatsapp-bot'
import { wbotMessageListener } from '@/services/whatsapp'
import { logger } from '@/utils/logger'
import { type Whatsapp } from '@prisma/client'

class WhatsappHelper {
  private static instance: WhatsappHelper
  private repositories: ReturnType<typeof loadRepositories> | null

  private constructor () {
    this.repositories = null
  }

  public static getInstance (): WhatsappHelper {
    if (!WhatsappHelper.instance) {
      WhatsappHelper.instance = new WhatsappHelper()
    }
    return WhatsappHelper.instance
  }

  public async startAll (repositories: ReturnType<typeof loadRepositories>): Promise<void> {
    this.repositories = repositories
    const whatsapps = await this.list()

    if (!whatsapps || whatsapps.length === 0) {
      logger.warn('Nenhum whatsapp encontrado.')
      return
    }

    logger.info('Starting all whatsapp sessions...')
    whatsapps.forEach(async (whatsapp) => {
      if (whatsapp.status !== 'DISCONNECTED') {
        await this.start(whatsapp.uuid)
      }
    })
  }

  public async start (uuid: string): Promise<void> {
    if (!this.repositories) {
      logger.error('Repositories not loaded.')
      throw new Error('Repositories not loaded.')
    }
    const whatsapp = await this.repositories?.whatsappRepository.loadSystemWhatsappByUuid(uuid)

    if (whatsapp) {
      logger.info(`Starting whatsapp session ${whatsapp.name}/${whatsapp.remoteJid}...`)
      try {
        const socket = await initWhatsappBot({ whatsapp, repositories: this.repositories })
        void wbotMessageListener({ socket, whatsapp, ...this.repositories })
        logger.info(`Whatsapp session ${whatsapp.name}/${whatsapp.remoteJid} started.`)
      } catch (err) {
        logger.error(err)
        throw new Error(`Whatsapp session ${whatsapp.name}/${whatsapp.remoteJid} not started.`)
      }
    }
  }

  public async list (): Promise<Array<Whatsapp> | null> {
    const whatsapps = await this.repositories?.whatsappRepository.listAll()

    if (!whatsapps || whatsapps.length === 0) {
      return null
    }
    return whatsapps
  }

  public async logout (uuid: string, accountId: number): Promise<void> {
    if (!this.repositories) {
      logger.error('Repositories not loaded.')
      throw new Error('Repositories not loaded.')
    }
    const whatsapp = await this.repositories?.whatsappRepository.loadByUuid(uuid, accountId)

    if (whatsapp) {
      logger.info(`Stopping whatsapp session ${whatsapp.name}/${whatsapp.remoteJid}...`)
      try {
        void removeWbot(whatsapp.uuid, true, false)
        await this.repositories.whatsappRepository.updateStatus(whatsapp.uuid, 'DISCONNECTED')
        logger.info(`Whatsapp session ${whatsapp.name}/${whatsapp.remoteJid} stopped.`)
      } catch (err) {
        logger.error(err)
        throw new Error(`Whatsapp session ${whatsapp.name}/${whatsapp.remoteJid} not stopped.`)
      }
    }
  }
}

export default WhatsappHelper.getInstance()
