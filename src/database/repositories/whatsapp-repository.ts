
import { type PrismaClient, type Whatsapp } from '@prisma/client'
import { LoadWhatsappByUuidRepository } from '@/database/protocols'
import { CreateWhatsappRepository } from '@/database/protocols'
import { LoadWhatsappsRepository } from '@/database/protocols'


export class WhatsappRepository implements CreateWhatsappRepository, LoadWhatsappByUuidRepository, LoadWhatsappByUuidRepository, LoadWhatsappsRepository {
  private readonly prisma: PrismaClient

  constructor (prisma: PrismaClient) {
    this.prisma = prisma
  }

  async create ({
    remoteJid = '',
    session = '',
    name,
    subscriptionId,
    ownerJid,
    accountId,
    qrcode = '',
    status = ''
  }: {
    remoteJid?: string
    session?: string
    name: string
    accountId: number
    subscriptionId: number
    ownerJid: string
    qrcode?: string
    status?: string
  }): Promise<CreateWhatsappRepository.Result> {
    return await this.prisma.whatsapp.create({
      data: {
        remoteJid,
        session,
        name,
        accountId,
        ownerJid,
        qrcode,
        status
      },
      select: {
        uuid: true,
        name: true,
        remoteJid: true,
        ownerJid: true,
        status: true,
        createdAt: true
      }
    })
  }

  async update ({
    id,
    remoteJid,
    session,
    name,
    subscriptionId,
    qrcode,
    status
  }: {
    id: number
    remoteJid?: string
    session?: string
    name?: string
    subscriptionId?: number
    qrcode?: string
    status?: string
  }): Promise<Omit<Whatsapp, 'id' | 'accountId' | 'session' | 'qrcode' | 'updatedAt'>> {
    const existingWhatsapp = await this.prisma.whatsapp.findUnique({
      where: {
        id
      }
    })

    if (existingWhatsapp) {
      const whatsapp = await this.prisma.whatsapp.update({
        where: {
          id
        },
        data: {
          session,
          name,
          remoteJid,
          qrcode,
          status
        },
        select: {
          uuid: true,
          name: true,
          remoteJid: true,
          ownerJid: true,
          status: true,
          createdAt: true
        }
      })
      return whatsapp
    } else {
      throw new Error('Whatsapp not found for update')
    }
  }

  async findById (id: number): Promise<Whatsapp> {
    const whatsapp = await this.prisma.whatsapp.findUnique({
      where: {
        id
      },
      select: {
        uuid: true,
        name: true,
        remoteJid: true,
        ownerJid: true,
        status: true
      }
    })

    return whatsapp as Whatsapp
  }

  async loadByUuid (uuid: string, accountId: number): Promise<LoadWhatsappByUuidRepository.Result> {
    const whatsapp = await this.prisma.whatsapp.findUnique({
      where: {
        accountId,
        uuid
      },
      select: {
        uuid: true,
        name: true,
        remoteJid: true,
        ownerJid: true,
        status: true
      }
    })

    return whatsapp as Whatsapp
  }

  async loadSystemWhatsappByUuid (uuid: string): Promise<Whatsapp> {
    const whatsapp = await this.prisma.whatsapp.findUnique({
      where: {
        uuid
      }
    })

    return whatsapp as Whatsapp
  }

  async loadById (id: number): Promise<Whatsapp> {
    const whatsapp = await this.prisma.whatsapp.findUnique({
      where: {
        id
      }
    })
    return whatsapp as Whatsapp
  }

  async updateStatus (uuid: string, status: string): Promise<void> {
    await this.prisma.whatsapp.update({
      where: {
        uuid
      },
      data: {
        status
      }
    })
  }

  async loadWhatsapps (accountId: number): Promise<LoadWhatsappsRepository.Result> {
    const whatsapps = await this.prisma.whatsapp.findMany({
      where: {
        accountId
      },
      select: {
        uuid: true,
        name: true,
        remoteJid: true,
        ownerJid: true,
        status: true
      }
    })
    return whatsapps as Array<Whatsapp>
  }

  async listAll (): Promise<Array<Whatsapp>> {
    const whatsapps = await this.prisma.whatsapp.findMany()
    return whatsapps as Array<Whatsapp>
  }


  async delete (id: number): Promise<void> {
    await this.prisma.whatsapp.delete({
      where: {
        id
      }
    })
  }
}
