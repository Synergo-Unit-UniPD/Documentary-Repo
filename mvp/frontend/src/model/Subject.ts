import { Observer } from './Observer'

/**
 * Interfaccia Subject per il pattern Observer.
 */
export interface Subject {
  attach(o: Observer): void
  detach(o: Observer): void
  notify(): void
}
