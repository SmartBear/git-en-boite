import { DomainEventBus, DomainEvents, fromJSON } from 'git-en-boite-core'
import IORedis, { Redis } from 'ioredis'
import EventEmitter from 'events'

export class GlobalEventBus implements DomainEventBus {
  listenTo(localEventBus: DomainEventBus): GlobalEventBus {
    for (const eventKey of DomainEvents.keys) {
      localEventBus.on(eventKey, (event) => this.emit(eventKey, event))
    }
    return this
  }

  static async connect(config: string): Promise<GlobalEventBus> {
    const sub = await connectToRedis(config)
    const listeners = new EventEmitter()
    await new Promise<void>((resolve) => {
      sub.subscribe(...DomainEvents.keys, () => {
        sub.on('message', (channel, message) => {
          listeners.emit(channel, fromJSON(JSON.parse(message)))
        })
        resolve()
      })
    })
    const pub = await connectToRedis(config)
    return new GlobalEventBus(pub, sub, listeners)
  }

  constructor(private readonly pub: Redis, private readonly sub: Redis, private readonly listeners: EventEmitter) {}

  close(): void {
    this.pub.disconnect()
    this.sub.disconnect()
  }

  emit<Key extends keyof DomainEvents>(eventName: Key, event: DomainEvents[Key]): void {
    this.pub.publish(eventName, JSON.stringify(event.toJSON()))
  }
  on<Key extends keyof DomainEvents>(eventName: Key, fn: (params: DomainEvents[Key]) => void): void {
    this.listeners.on(eventName, fn)
  }
  off<Key extends keyof DomainEvents>(eventName: Key, fn: (params: DomainEvents[Key]) => void): void {
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
