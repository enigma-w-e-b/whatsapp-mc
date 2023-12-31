/* eslint-disable no-self-assign */
import type {
    AuthenticationCreds,
    AuthenticationState,
    SignalDataTypeMap
  } from '@whiskeysockets/baileys'
  import { BufferJSON, initAuthCreds, proto } from '@whiskeysockets/baileys'
  import { type Whatsapp } from '@prisma/client'
  import * as Sentry from '@sentry/node'
  import { type WhatsappRepository } from '@/database/repositories'
  
  const KEY_MAP: { [T in keyof SignalDataTypeMap]: string } = {
    'pre-key': 'preKeys',
    session: 'sessions',
    'sender-key': 'senderKeys',
    'app-state-sync-key': 'appStateSyncKeys',
    'app-state-sync-version': 'appStateVersions',
    'sender-key-memory': 'senderKeyMemory'
  }
  
  const authState = async (
    whatsapp: Whatsapp,
    whatsappRepository: WhatsappRepository
  ): Promise<{ state: AuthenticationState, saveState: () => void }> => {
    let creds: AuthenticationCreds
    let keys: any = {}
  
    const saveState = async (): Promise<void> => {
      try {
        await whatsappRepository.update({
          id: whatsapp.id,
          session: JSON.stringify({ creds, keys }, BufferJSON.replacer, 0)
        })
      } catch (error) {
        Sentry.captureException(error)
      }
    }
  
    if (whatsapp.session && whatsapp.session !== null) {
      const result = JSON.parse(whatsapp.session, BufferJSON.reviver)
      creds = result.creds
      keys = result.keys
    } else {
      creds = initAuthCreds()
      keys = {}
    }
  
    return {
      state: {
        creds,
        keys: {
          get: (type, ids) => {
            const key = KEY_MAP[type]
            return ids.reduce((dict: any, id) => {
              let value = keys[key]?.[id]
              if (value) {
                if (type === 'app-state-sync-key') {
                  value = proto.Message.AppStateSyncKeyData.fromObject(value)
                }
  
                dict[id] = value
              }
  
              return dict
            }, {})
          },
          set: (data: any) => {
            for (const _key in data) {
              const key = KEY_MAP[_key as keyof SignalDataTypeMap]
              keys[key] = keys[key]
              if (!keys[key]) keys[key] = {}
              Object.assign(keys[key], data[_key])
            }
  
            void saveState()
          }
        }
      },
      saveState
    }
  }
  
  export default authState
  