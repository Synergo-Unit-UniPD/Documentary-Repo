export interface RedHatResponse {
  proposal: string
  comment: string
}

export interface DistantWritingResponse {
  proposal: string
}

export const getStatus = async (): Promise<void> => {
  const response = await fetch('/api/status')

  if (!response.ok) {
    throw new Error('Backend non raggiungibile')
  }
}

export const generateRedHatProposal = async (text: string): Promise<RedHatResponse> => {
  const response = await fetch('/api/red-hat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })

  if (!response.ok) {
    throw new Error('Errore durante la generazione Cappello Rosso')
  }

  return response.json()
}

export const generateDistantWritingProposal = async (
  prompt: string
): Promise<DistantWritingResponse> => {
  const response = await fetch('/api/distant-writing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  })

  if (!response.ok) {
    throw new Error('Errore durante la generazione Distant Writing')
  }

  return response.json()
}