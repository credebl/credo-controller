import type { RestAgentModules } from '../../cliAgent'
import type { BitStringCredential } from '../types'
import type { W3cCredentialRecord, W3cJsonLdSignCredentialOptions } from '@credo-ts/core'
import type { GenericRecord } from '@credo-ts/core/build/modules/generic-records/repository/GenericRecord'

import { Agent, ClaimFormat } from '@credo-ts/core'
import { injectable } from 'tsyringe'
import { promisify } from 'util'
import * as zlib from 'zlib'

import ErrorHandlingService from '../../errorHandlingService'
import { BadRequestError, InternalServerError } from '../../errors/errors'
import { SignCredentialPayload } from '../types'

import { Tags, Route, Controller, Post, Security, Body, Path, Get } from 'tsoa'

@Tags('Status')
@Route('/w3c/revocation')
@Security('apiKey')
@injectable()
export class StatusController extends Controller {
  private agent: Agent<RestAgentModules>

  public constructor(agent: Agent<RestAgentModules>) {
    super()
    this.agent = agent
  }

  // Function to generate a bit string status
  public async generateBitStringStatus(length: number): Promise<string> {
    return Array.from({ length }, () => (Math.random() > 0.5 ? '1' : '0')).join('')
  }

  // Function to encode the bit string status
  public async encodeBitString(bitString: string): Promise<string> {
    const gzip = promisify(zlib.gzip)
    const buffer = Buffer.from(bitString, 'binary')
    const compressedBuffer = await gzip(buffer)
    return compressedBuffer.toString('base64')
  }

  public async decodeBitSting(bitString: string): Promise<string> {
    const gunzip = promisify(zlib.gunzip)
    const compressedBuffer = Buffer.from(bitString, 'base64')
    const decompressedBuffer = await gunzip(compressedBuffer)
    return decompressedBuffer.toString('binary')
  }

  @Post('/sign/bitstring-credential')
  public async createBitstringStatusListCredential(
    @Body() signCredentialPayload: SignCredentialPayload
  ): Promise<W3cCredentialRecord> {
    try {
      const { id, issuerId, statusPurpose, bitStringLength } = signCredentialPayload
      const bitStringStatusListCredentialListLength = bitStringLength ? bitStringLength : 131072
      const bitStringStatus = await this.generateBitStringStatus(bitStringStatusListCredentialListLength)
      const encodedList = await this.encodeBitString(bitStringStatus)
      const didIdentifier = issuerId.split(':')[2]
      const data = {
        format: ClaimFormat.LdpVc,
        credential: {
          '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/vc/status-list/2021/v1'],
          id,
          type: ['VerifiableCredential', 'BitstringStatusListCredential'],
          issuer: {
            id: issuerId,
          },
          issuanceDate: new Date().toISOString(),
          credentialSubject: {
            id,
            type: 'BitstringStatusList',
            encodedList,
            statusPurpose,
          },
        },
        verificationMethod: `${issuerId}#${didIdentifier}`,
        proofType: 'Ed25519Signature2018',
      }

      await fetch(id, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credentialsData: data }),
      })

      const signCredential = await this.agent.w3cCredentials.signCredential(
        data as unknown as W3cJsonLdSignCredentialOptions
      )

      const storCredential = await this.agent.w3cCredentials.storeCredential({ credential: signCredential })

      return storCredential
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Post('/revoke-credential/:id')
  public async revokeW3C(@Path('id') id: string): Promise<{
    message: string
  }> {
    try {
      const credential = await this.agent.credentials.getFormatData(id)
      let credentialIndex
      let statusListCredentialURL
      const revocationStatus = 1

      if (!Array.isArray(credential.offer?.jsonld?.credential?.credentialStatus)) {
        credentialIndex = credential.offer?.jsonld?.credential?.credentialStatus?.statusListIndex as string
        statusListCredentialURL = credential.offer?.jsonld?.credential?.credentialStatus?.statusListCredential as string
      } else {
        credentialIndex = credential.offer?.jsonld?.credential?.credentialStatus[0].statusListIndex as string
        statusListCredentialURL = credential.offer?.jsonld?.credential?.credentialStatus[0]
          .statusListCredential as string
      }

      const bitStringStatusListCredential = await fetch(statusListCredentialURL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!bitStringStatusListCredential.ok) {
        throw new InternalServerError(`${bitStringStatusListCredential.statusText}`)
      }

      const bitStringCredential = (await bitStringStatusListCredential.json()) as BitStringCredential
      const encodedBitString = bitStringCredential.credential.credentialSubject.encodedList
      const decodeBitString = await this.decodeBitSting(encodedBitString)

      const findBitStringIndex = decodeBitString.charAt(parseInt(credentialIndex))
      if (findBitStringIndex === revocationStatus.toString()) {
        throw new BadRequestError('The credential already revoked')
      }

      const updateBitString =
        decodeBitString.slice(0, parseInt(credentialIndex)) +
        revocationStatus +
        decodeBitString.slice(parseInt(credentialIndex) + 1)

      const encodeUpdatedBitString = await this.encodeBitString(updateBitString)
      bitStringCredential.credential.credentialSubject.encodedList = encodeUpdatedBitString
      await fetch(statusListCredentialURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credentialsData: bitStringCredential }),
      })

      return { message: 'The credential has been revoked' }
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Get('bitstring/status-list/:id')
  public async getBitStringStatusListById(@Path('id') id: string): Promise<{
    bitStringCredential: BitStringCredential
    getIndex: GenericRecord[]
  }> {
    try {
      const validateUrl = await this.isValidUrl(id)
      if (!validateUrl) {
        throw new BadRequestError(`Please provide a bit string credential id`)
      }

      const bitStringCredentialDetails = await fetch(id, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!bitStringCredentialDetails.ok) {
        throw new InternalServerError(`${bitStringCredentialDetails.statusText}`)
      }

      const bitStringCredential = (await bitStringCredentialDetails.json()) as BitStringCredential
      if (!bitStringCredential?.credential && !bitStringCredential?.credential?.credentialSubject) {
        throw new BadRequestError(`Invalid credentialSubjectUrl`)
      }

      const getIndex = await this.agent.genericRecords.findAllByQuery({
        statusListCredentialURL: id,
      })

      return {
        bitStringCredential,
        getIndex,
      }
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Get('bitstring/status-list/')
  public async getAllBitStringStatusList(): Promise<W3cCredentialRecord[]> {
    try {
      const getBitStringCredentialStatusList = await this.agent.w3cCredentials.getAllCredentialRecords()
      return getBitStringCredentialStatusList
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  private async isValidUrl(url: string) {
    try {
      new URL(url)
      return true
    } catch (err) {
      return false
    }
  }
}
