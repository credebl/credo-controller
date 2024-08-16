import type { BitStringCredential, CredentialStatusList } from '../controllers/types'
import type { CredentialStatus } from '@credo-ts/core'
import type { GenericRecord } from '@credo-ts/core/build/modules/generic-records/repository/GenericRecord'

import { randomInt } from 'crypto'
import { promisify } from 'util'
import * as zlib from 'zlib'

import ErrorHandlingService from '../errorHandlingService'
import { BadRequestError, ConflictError, InternalServerError } from '../errors/errors'

async function generateBitStringStatus(length: number): Promise<string> {
  return Array.from({ length }, () => (randomInt(0, 2) === 1 ? '1' : '0')).join('')
}

async function encodeBitString(bitString: string): Promise<string> {
  const gzip = promisify(zlib.gzip)
  const buffer = Buffer.from(bitString, 'binary')
  const compressedBuffer = await gzip(buffer)
  return compressedBuffer.toString('base64')
}

async function decodeBitSting(bitString: string): Promise<string> {
  const gunzip = promisify(zlib.gunzip)
  const compressedBuffer = Buffer.from(bitString, 'base64')
  const decompressedBuffer = await gunzip(compressedBuffer)
  return decompressedBuffer.toString('binary')
}

async function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch (err) {
    return false
  }
}

async function getCredentialStatus(
  credentialStatusList: CredentialStatusList,
  getIndex: GenericRecord[]
): Promise<CredentialStatus> {
  try {
    if (!credentialStatusList.credentialSubjectUrl || !credentialStatusList.statusPurpose) {
      throw new BadRequestError(`Please provide valid credentialSubjectUrl and statusPurpose`)
    }
    const url = credentialStatusList.credentialSubjectUrl
    const validateUrl = await isValidUrl(url)
    if (!validateUrl) {
      throw new BadRequestError(`Please provide a valid credentialSubjectUrl`)
    }

    const bitStringStatusListCredential = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!bitStringStatusListCredential.ok) {
      throw new InternalServerError(`${bitStringStatusListCredential.statusText}`)
    }

    const bitStringCredential = (await bitStringStatusListCredential.json()) as BitStringCredential

    if (!bitStringCredential?.credential && !bitStringCredential?.credential?.credentialSubject) {
      throw new BadRequestError(`Invalid credentialSubjectUrl`)
    }

    if (bitStringCredential?.credential?.credentialSubject?.statusPurpose !== credentialStatusList?.statusPurpose) {
      throw new BadRequestError(
        `Invalid statusPurpose! Please provide valid statusPurpose. '${credentialStatusList.statusPurpose}'`
      )
    }

    const encodedBitString = bitStringCredential.credential.credentialSubject.encodedList
    const gunzip = promisify(zlib.gunzip)

    const compressedBuffer = Buffer.from(encodedBitString, 'base64')
    const decompressedBuffer = await gunzip(compressedBuffer)
    const decodedBitString = decompressedBuffer.toString('binary')

    let index
    const arrayIndex: number[] = []
    if (getIndex.length === 0) {
      index = decodedBitString.indexOf('0')
    } else {
      getIndex.find((record) => {
        arrayIndex.push(Number(record.content.index))
      })

      index = await getAvailableIndex(decodedBitString, arrayIndex)
    }

    if (index === -1) {
      throw new ConflictError(
        `The provided bit string credential revocation list for ${credentialStatusList.credentialSubjectUrl} has been exhausted. Please supply a valid credentialSubjectUrl.`
      )
    }

    const credentialStatus = {
      id: `${credentialStatusList.credentialSubjectUrl}#${index}`,
      type: 'BitstringStatusListEntry',
      statusPurpose: credentialStatusList.statusPurpose,
      statusListIndex: index.toString(),
      statusListCredential: credentialStatusList.credentialSubjectUrl,
    } as unknown as CredentialStatus

    return credentialStatus
  } catch (error) {
    throw ErrorHandlingService.handle(error)
  }
}

function getAvailableIndex(str: string, usedIndices: number[]) {
  // Find all indices of the character '0'
  const indices = []
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '0') {
      indices.push(i)
    }
  }

  // Find the first available index that is not in the usedIndices array
  for (const index of indices) {
    if (!usedIndices.includes(index)) {
      return index
    }
  }

  // If no available index is found, return -1 or any indication of 'not found'
  return -1
}

export default { getCredentialStatus, generateBitStringStatus, encodeBitString, decodeBitSting, isValidUrl }
