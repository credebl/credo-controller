import { JsonTransformer } from '@credo-ts/core'
import { JsonEncoder } from '@credo-ts/core/build/utils/JsonEncoder'

import { setupAgent } from './agent'

export async function getTestAgent(name: string, port: number) {
  return await setupAgent({
    port: port,
    endpoints: [`http://localhost:${port}`],
    name: name,
  })
}

export function objectToJson<T>(result: T) {
  const serialized = JsonTransformer.serialize(result)
  return JsonEncoder.fromString(serialized)
}
