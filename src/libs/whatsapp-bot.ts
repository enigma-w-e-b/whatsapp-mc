import makeWASocket, {
    DisconnectReason,
    type WASocket,
    fetchLatestBaileysVersion,
    makeInMemoryStore
  } from '@whiskeysockets/baileys'
  
  import { type Boom } from '@hapi/boom'
  import MAIN_LOGGER from '@whiskeysockets/baileys/lib/Utils/logger'
  import { logger } from '@/utils/logger'
  import authState from '@/helpers/auth-state'
  import { type loadRepositories } from '@/database/repositories'
  import WhatsappHelper from '@/helpers/whatsapp-helper'
import { Whatsapp } from '@prisma/client'
  
  const loggerBaileys = MAIN_LOGGER.child({})
  loggerBaileys.level = 'error'
  
  type Session = WASocket & {
    uuid?: string
    store?: ReturnType<typeof makeInMemoryStore>
  }
  
  const sessions: Session[] = []
  
  const retriesQrCodeMap = new Map<number, number>()
  
  export const getWbot = (whatsappUuid: string): Session => {
    const sessionIndex = sessions.findIndex(s => s.uuid === whatsappUuid)
  
    if (sessionIndex === -1) {
      throw new Error('ERR_WAPP_NOT_INITIALIZED')
    }
    return sessions[sessionIndex]
  }
  
  export const removeWbot = async (
    whatsappUuid: string,
    isLogout = true,
    isStop = false
  ): Promise<void> => {
    try {
      const sessionIndex = sessions.findIndex(s => s.uuid === whatsappUuid)
      if (sessionIndex !== -1) {
        if (isLogout) {
          void sessions[sessionIndex].logout()
          sessions[sessionIndex].ws.close()
        }
  
        if (isStop) {
          sessions[sessionIndex].ws.close()
        }
  
        sessions.splice(sessionIndex, 1)
      }
    } catch (err) {
      logger.error(err)
    }
  }
  
  export const initWhatsappBot = async ({ whatsapp, repositories }: {
    whatsapp: Whatsapp
    repositories: ReturnType<typeof loadRepositories>
  }): Promise<Session> => {
    return new Promise((resolve, reject) => {
      try {
        void (async () => {
          const whatsappUpdate = await repositories.whatsappRepository.findById(whatsapp.id)
  
          if (!whatsappUpdate) return
  
          const { id, uuid, name } = whatsappUpdate
          const { version, isLatest } = await fetchLatestBaileysVersion()
  
          logger.info(`using WA v${version.join('.')}, isLatest: ${isLatest}`)
          logger.info(`Starting session ${name}`)
          let retriesQrCode = 0
  
          let wsocket: Session | null = null
          const store = makeInMemoryStore({
            logger: loggerBaileys
          })
  
          const { state, saveState } = await authState(whatsappUpdate, repositories.whatsappRepository)
  
          wsocket = makeWASocket({
            logger: loggerBaileys,
            printQRInTerminal: true,
            auth: state,
            version
          })
  
          wsocket.ev.on(
            'connection.update',
            async ({ connection, lastDisconnect, qr }) => {
              logger.info(`Socket  ${name} Connection Update ${connection ?? ''} ${JSON.stringify(lastDisconnect) ?? ''}`
              )
  
              const disconect = (lastDisconnect?.error as Boom)?.output
                ?.statusCode
  
              if (connection === 'close') {
                if (disconect === 403) {
                  await repositories.whatsappRepository.update({ id: whatsappUpdate.id, status: 'PENDING', session: '' })
  
                  void removeWbot(uuid, false)
                }
  
                if (disconect !== DisconnectReason.loggedOut) {
                  void removeWbot(uuid, false)
                  setTimeout(async () => WhatsappHelper.start(whatsapp.uuid), 2000)
                } else {
                  await repositories.whatsappRepository.update({ id: whatsappUpdate.id, status: 'PENDING', session: '' })
                  void removeWbot(uuid, false)
                  setTimeout(async () => WhatsappHelper.start(whatsapp.uuid), 2000)
                }
              }
  
              if (connection === 'open') {
                await repositories.whatsappRepository.update({
                  id: whatsappUpdate.id,
                  remoteJid: wsocket?.user?.id.replace(/:.*@/, '@'),
                  status: 'CONNECTED',
                  qrcode: ''
                })
  
                const sessionIndex = sessions.findIndex(
                  s => s.uuid === whatsapp.uuid
                )
                if (sessionIndex === -1 && wsocket !== null) {
                  wsocket.uuid = whatsapp.uuid
                  sessions.push(wsocket)
                }
  
                resolve(wsocket as Session)
              }
  
              if (qr !== undefined) {
                if (retriesQrCodeMap.get(id) && retriesQrCodeMap.get(id) as number >= 3) {
                  await repositories.whatsappRepository.update({
                    id: whatsappUpdate.id,
                    status: 'DISCONNECTED',
                    qrcode: ''
                  })
                  if (wsocket === null) return
                  wsocket.ev.removeAllListeners('connection.update')
                  wsocket.ws.close()
                  wsocket = null
                  retriesQrCodeMap.delete(id)
                } else {
                  logger.info(`Session QRCode Generate ${name}`)
                  retriesQrCodeMap.set(id, (retriesQrCode += 1))
  
                  await repositories.whatsappRepository.update({
                    id: whatsappUpdate.id,
                    qrcode: qr,
                    status: 'qrcode'
                  })
                  const sessionIndex = sessions.findIndex(
                    s => s.uuid === whatsapp.uuid
                  )
  
                  if (sessionIndex === -1 && wsocket !== null) {
                    wsocket.uuid = whatsapp.uuid
                    sessions.push(wsocket)
                  }
                }
              }
            }
          )
          wsocket.ev.on('creds.update', saveState)
  
          wsocket.store = store
          store.bind(wsocket.ev)
        })()
      } catch (error) {
        console.log(error)
        reject(error)
      }
    })
  }
  