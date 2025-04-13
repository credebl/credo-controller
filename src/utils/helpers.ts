import { JsonTransformer } from '@credo-ts/core'
import { JsonEncoder } from '@credo-ts/core/build/utils/JsonEncoder'

import { BadRequestError, InternalServerError } from '../errors/errors'

export function objectToJson<T>(result: T) {
  const serialized = JsonTransformer.serialize(result)
  return JsonEncoder.fromString(serialized)
}

// Custom decompression logic
export function customInflate(encodedList: string): string {
  if (!encodedList || typeof encodedList !== 'string') {
    throw new BadRequestError('Invalid input: encodedList must be a non-empty string')
  }

  try {
    const compressedData = Buffer.from(encodedList, 'base64url')
    const decompressedData = new Uint8Array(compressedData)
    return Array.from(decompressedData)
      .map((byte) => byte.toString(2))
      .join('')
  } catch (error) {
    if (error instanceof Error) {
      throw new InternalServerError(`Failed to decompress and process the encoded list: ${error.message}`)
    } else {
      throw new InternalServerError('Failed to decompress and process the encoded list: Unknown error')
    }
  }
}

// Custom recompression logic
export function customDeflate(data: string): string {
  if (!data || typeof data !== 'string') {
    throw new BadRequestError('Invalid input: data must be a non-empty string')
  }

  try {
    const binaryArray = data.match(/.{1,8}/g)?.map((byte) => parseInt(byte, 2))
    if (!binaryArray) {
      throw new Error('Failed to parse binary string into bytes')
    }
    const compressedData = new Uint8Array(binaryArray)
    return Buffer.from(compressedData).toString('base64url')
  } catch (error) {
    if (error instanceof Error) {
      throw new InternalServerError(`Failed to compress data: ${error.message}`)
    } else {
      throw new InternalServerError('Failed to compress data: Unknown error')
    }
  }
}
