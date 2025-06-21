export interface TypedEvent<T, P> {
  type: T;
  payload: P;
  timestamp: Date;
}

export type EventListener<T> = (event: T) => void;
export type UnsubscribeFunction = () => void;

export interface TypedEventEmitter<TEventMap extends Record<string, unknown>> {
  emit<T extends keyof TEventMap>(type: T, payload: TEventMap[T]): void;
  on<T extends keyof TEventMap>(
    type: T,
    listener: EventListener<TypedEvent<T, TEventMap[T]>>
  ): UnsubscribeFunction;

  off<T extends keyof TEventMap>(
    type: T,
    listener?: EventListener<TypedEvent<T, TEventMap[T]>>
  ): void;
  clear(): void;
}

export abstract class AbstractTypedEventEmitter<
  TEventMap extends Record<string, unknown>
> implements TypedEventEmitter<TEventMap>
{
  protected readonly listeners: Map<
    keyof TEventMap,
    Array<EventListener<unknown>>
  > = new Map();

  public emit<T extends keyof TEventMap>(type: T, payload: TEventMap[T]): void {
    const event: TypedEvent<T, TEventMap[T]> = {
      type,
      payload,
      timestamp: new Date(),
    };

    const eventListeners = this.listeners.get(type) || [];
    eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        this.handleListenerError(error, type);
      }
    });
  }

  public on<T extends keyof TEventMap>(
    type: T,
    listener: EventListener<TypedEvent<T, TEventMap[T]>>
  ): UnsubscribeFunction {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener as EventListener<unknown>);

    return () => {
      const eventListeners = this.listeners.get(type);
      if (eventListeners) {
        const index = eventListeners.indexOf(
          listener as EventListener<unknown>
        );
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    };
  }

  public off<T extends keyof TEventMap>(
    type: T,
    listener?: EventListener<TypedEvent<T, TEventMap[T]>>
  ): void {
    if (!listener) {
      this.listeners.delete(type);
    } else {
      const eventListeners = this.listeners.get(type);
      if (eventListeners) {
        const index = eventListeners.indexOf(
          listener as EventListener<unknown>
        );
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }

  protected abstract handleListenerError(
    error: unknown,
    eventType: keyof TEventMap
  ): void;
}

export type ExtractEvent<
  T extends keyof TEventMap,
  TEventMap extends Record<string, unknown>
> = TypedEvent<T, TEventMap[T]>;
