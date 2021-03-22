import { DomainEventBus, DomainEvents, EventName, fromJSON } from 'git-en-boite-core'
import IORedis, { Redis } from 'ioredis'
import EventEmitter from 'events'

export class GlobalDomainEventBus implements DomainEventBus {
  listenTo(localEventBus: DomainEventBus): GlobalDomainEventBus {
    for (const eventName of DomainEvents.names) {
      localEventBus.on(eventName, (event) => this.emit(eventName, event))
    }
    return this
  }

  static async connect(config: string): Promise<GlobalDomainEventBus> {
    const sub = await connectToRedis(config)
    const listeners = new EventEmitter()
    await new Promise<void>((resolve) => {
      sub.subscribe(...DomainEvents.names, () => {
        sub.on('message', (channel, message) => {
          listeners.emit(channel, fromJSON(JSON.parse(message)))
        })
        resolve()
      })
    })
    const pub = await connectToRedis(config)
    return new GlobalDomainEventBus(pub, sub, listeners)
  }

  constructor(private readonly pub: Redis, private readonly sub: Redis, private readonly listeners: EventEmitter) {}

  close(): void {
    this.pub.disconnect()
    this.sub.disconnect()
  }

  emit<Name extends EventName>(eventName: Name, event: DomainEvents[Name]): void {
    this.pub.publish(eventName, JSON.stringify(event.toJSON()))
  }
  on<Name extends EventName>(eventName: Name, fn: (params: DomainEvents[Name]) => void): void {
    this.listeners.on(eventName, fn)
  }
  off<Name extends EventName>(eventName: Name, fn: (params: DomainEvents[Name]) => void): void {
    this.listeners.off(eventName, fn)
  }
}

async function connectToRedis(url: string): Promise<Redis> {
  const connection = new IORedis(url)
  return new Promise((resolve, reject) =>
    connection
      .on('connect', () => resolve(connection))
      .on('error', (error) => {
        connection.disconnect()
        reject(new Error(`Unable to connect to Redis: ${error.message}`))
      })
  )
}
