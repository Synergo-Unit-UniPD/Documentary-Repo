import { describe, it, expect, vi } from 'vitest'
import { Subject } from './Subject'
import { Observer } from './Observer'

// Mock implementation per testare il contratto dell'interfaccia
class MockSubject implements Subject {
  private observers: Observer[] = []

  attach(o: Observer): void {
    this.observers.push(o)
  }
  detach(o: Observer): void {
    this.observers = this.observers.filter((obs) => obs !== o)
  }
  notify(): void {
    for (const observer of this.observers) {
      observer.update()
    }
  }
}

class MockObserver implements Observer {
  update(): void {}
}

describe('Subject', () => {
  it('dovrebbe permettere di allegare, staccare e notificare gli observer', () => {
    const subject = new MockSubject()
    const observer = new MockObserver()
    const updateSpy = vi.spyOn(observer, 'update')

    subject.attach(observer)
    subject.notify()
    expect(updateSpy).toHaveBeenCalledTimes(1)

    subject.detach(observer)
    subject.notify()
    expect(updateSpy).toHaveBeenCalledTimes(1) // Non deve incrementare
  })
})
