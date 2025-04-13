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

export function validateCredentialStatus(credentialStatus: any) {
  let id: string, type: string, statusPurpose: string, statusListIndex: string, statusListCredential: string

  if (Array.isArray(credentialStatus)) {
    if (credentialStatus.length === 0) {
      throw new BadRequestError('Missing or invalid credentialStatus in the request.')
    }
    ;({ id, type, statusPurpose, statusListIndex, statusListCredential } = credentialStatus[0])
  } else {
    ;({ id, type, statusPurpose, statusListIndex, statusListCredential } = credentialStatus as {
      id: string
      type: string
      statusPurpose: string
      statusListIndex: string
      statusListCredential: string
    })
  }
  if (!id) {
    throw new BadRequestError('Invalid or missing "id" in credentialStatus')
  }
  if (!type || type !== 'BitstringStatusListEntry') {
    throw new BadRequestError('Invalid or missing "type" in credentialStatus')
  }

  if (!statusPurpose) {
    throw new BadRequestError('Invalid or missing "statusPurpose" in credentialStatus')
  }

  if (typeof statusListIndex === 'number' && !Number.isNaN(statusListIndex)) {
    throw new BadRequestError('Invalid or missing "statusListIndex" in credentialStatus')
  }

  if (!statusListCredential || typeof statusListCredential !== 'string') {
    throw new BadRequestError('Invalid or missing "statusListCredential" in credentialStatus')
  }
}
