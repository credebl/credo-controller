import { JsonTransformer } from '@credo-ts/core'
import { JsonEncoder } from '@credo-ts/core/build/utils/JsonEncoder'
import { randomBytes } from 'crypto'

/**
 * Serializes an object to a JSON-encoded format.
 *
 * @param result - The object to serialize
 * @returns The JSON-encoded representation of the input object
 */
export function objectToJson<T>(result: T) {
  const serialized = JsonTransformer.serialize(result)
  return JsonEncoder.fromString(serialized)
}

/**
 * Asynchronously generates a cryptographically secure random secret key as a hexadecimal string.
 *
 * @param length - The number of random bytes to generate for the key (default is 32)
 * @returns A hexadecimal string representing the generated secret key
 */
export async function generateSecretKey(length: number = 32): Promise<string> {
  // Asynchronously generate a buffer containing random values
  const buffer: Buffer = await new Promise((resolve, reject) => {
    randomBytes(length, (error, buf) => {
      if (error) {
        reject(error)
      } else {
        resolve(buf)
      }
    })
  })

  // Convert the buffer to a hexadecimal string
  const secretKey: string = buffer.toString('hex')

  return secretKey
}