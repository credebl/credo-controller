import type { RestAgentModules } from '../../cliAgent'
import type { BitStringCredential } from '../types'
import type { AnonCredsCredentialFormat, LegacyIndyCredentialFormat } from '@credo-ts/anoncreds'
import type {
  GetCredentialFormatDataReturn,
  JsonLdCredentialFormat,
  W3cCredentialRecord,
  W3cJsonLdSignCredentialOptions,
} from '@credo-ts/core'

import { Agent, ClaimFormat } from '@credo-ts/core'
import { injectable } from 'tsyringe'
import { promisify } from 'util'
import * as zlib from 'zlib'

import ErrorHandlingService from '../../errorHandlingService'
import { BadRequestError, InternalServerError } from '../../errors/errors'
import { SignCredentialPayload } from '../types'

import { Tags, Route, Controller, Post, Security, Body, Path } from 'tsoa'

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

  @Post('/sign-credential')
  public async createBitstringStatusListCredential(
    @Body() signCredentialPayload: SignCredentialPayload
  ): Promise<W3cCredentialRecord> {
    try {
      const { id, issuerId, statusPurpose, bitStringLength } = signCredentialPayload
      const bitStringStatus = await this.generateBitStringStatus(bitStringLength)
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
  public async revokeW3C(
    @Path('id') id: string
  ): Promise<
    GetCredentialFormatDataReturn<(LegacyIndyCredentialFormat | JsonLdCredentialFormat | AnonCredsCredentialFormat)[]>
  > {
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

      return credential
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  // /**
  //  * Create Status List Credential
  //  */
  // // Creates a new StatusListCredential that can be used for revocation
  // @Security('apiKey')
  // @Post('/createStatusListCredential/:statusId')
  // // accepts size, minimum 131,072
  // public async createStatusListCredential(@Path('statusId') statusId: string) {
  //   // Maintain an incremental index for statusListCredential
  //   // Add Id with agentEndpoint/status/number
  //   // Note: This endpoint should actually be an API to get StatusListCredential with id(as path param)
  //   const agentEndpoints = await this.agent.config
  //   const list = await this.createBitStringStatusList()
  //   const configFileData = fs.readFileSync('config.json', 'utf-8')
  //   const config = JSON.parse(configFileData)
  //   const statusListCredentialId = `yourIpAndPort:${config.port}/status/${statusId}`
  //   const listCred = await this._createStatusListCredential(statusListCredentialId, list)
  //   return listCred
  // }

  // /**
  //  * Create Entry for status list credential
  //  */
  // // Create a new revocable credential
  // // But do we even need this additional endpoint?
  // @Security('apiKey')
  // @Post('/signAndStoreStausListCredential')
  // // public async createEntryForStatusListCredential')
  // public async createEntryForStatusListCredential(@Body() credentialPayload: unknown) {
  //   const storedCredential = await this.storeSighnedCredential()
  //   return storedCredential
  // }

  // /**
  //  * Retrieve status of a credential
  //  */
  // // Return if the status is revoked or not
  // @Security('apiKey')
  // @Get('/credential/:credentialRecordId')
  // public async getCredentialStatus(@Path('credentialRecordId') credentialRecordId: RecordId) {
  //   return `success retrieveing credentialRecordId ${credentialRecordId}`
  // }

  // /**
  //  * Change status of an entry in a StatusListCredential
  //  */
  // // Can this be a PUT operation?
  // @Security('apiKey')
  // @Post('/changeCredentialStatus')
  // public async changeCredentialStatus() {
  //   return 'success'
  // }

  // /**
  //  * Retrieve statusListCredential according to their id
  //  */
  // // Get statusListCredential from the id passed
  // @Get('/:id')
  // public async getStatusListCredential(@Path('id') id: string) {
  //   return `success with id: ${id}`
  // }

  // private async createBitStringStatusList() {
  //   this.statusList = await loadStatusList()
  //   this.list = await this.statusList.createList({ length: 100000 })
  //   return this.list
  // }

  // private async _createStatusListCredential(id: string, list: StatusList): Promise<StatusListCredential> {
  //   return this.statusList.createCredential({ id: id, list: list, statusPurpose: 'suspension' })
  // }

  // public async storeSighnedCredential() {
  //   const signedCred = {
  //     '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/vc/status-list/2021/v1'],
  //     id: 'http://yopurIp:yopurPort/status/1',
  //     type: ['VerifiableCredential', 'StatusList2021Credential'],
  //     issuer: {
  //       id: 'did:key:z6Mkty8b4M1arFSmxYVtM3nsoQvyFurHPhRxRms7vZ6cVZbN',
  //     },
  //     issuanceDate: '2019-10-12T07:20:50.52Z',
  //     credentialSubject: {
  //       id: 'http://yopurIp:yopurPort/status/1#list',
  //       claims: {
  //         type: 'StatusList2021',
  //         encodedList: 'H4sIAAAAAAAAA-3BMQEAAADCoPVPbQsvoAAAAAAAAAAAAAAAAP4GcwM92tQwAAA',
  //         statusPurpose: 'suspension',
  //       },
  //     },
  //     proof: {
  //       verificationMethod:
  //         'did:key:z6Mkty8b4M1arFSmxYVtM3nsoQvyFurHPhRxRms7vZ6cVZbN#z6Mkty8b4M1arFSmxYVtM3nsoQvyFurHPhRxRms7vZ6cVZbN',
  //       type: 'Ed25519Signature2018',
  //       created: '2024-07-08T12:24:04Z',
  //       proofPurpose: 'assertionMethod',
  //       jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..hOr9nyr4dlQx1VOMgBow5AeLNrIQ1We0kvR1dFT0AQKkS_lIu-AruZpNVgVCMVlHiFrj-qFYr36YUTwTzUwiAw',
  //     },
  //   }
  //   console.log('this is before storing')
  //   const storedCred = await this.agent.w3cCredentials.storeCredential(signedCred as unknown as StoreCredentialOptions)
  //   console.log('this is storedCred', storedCred)
  //   return storedCred
  // }
}
