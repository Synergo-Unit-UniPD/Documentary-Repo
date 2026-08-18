import { describe, it, expect, vi } from 'vitest'
import { Observer } from './Observer'

class MockObserver implements Observer {
  update(): void {}
}

describe('Observer', () => {
  it("dovrebbe permettere l'implementazione del metodo update", () => {
    const observer = new MockObserver()
    const updateSpy = vi.spyOn(observer, 'update')

    observer.update()

    expect(updateSpy).toHaveBeenCalledOnce()
  })
})
