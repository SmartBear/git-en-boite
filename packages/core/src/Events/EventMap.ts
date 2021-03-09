type HasTypeProperty<Map> = { [Key in keyof Map]: { type: Key } }
type MapOf<Event> = Record<string, Event>
type EventMap<T> = MapOf<T> & HasTypeProperty<MapOf<T>>

type EventHandler<Event> = (params: Event) => void

export interface PublishesEvents<T, Map extends EventMap<T>> {
  emit<Key extends keyof Map>(eventName: Key, params: Map[Key]): void
}

export interface SubscribesToEvents<T, Map extends EventMap<T>> {
  on<Key extends keyof Map>(eventName: Key, fn: EventHandler<Map[Key]>): void
  off<Key extends keyof Map>(eventName: Key, fn: EventHandler<Map[Key]>): void
}
