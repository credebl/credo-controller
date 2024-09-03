import type { RestAgentModules } from '../../cliAgent'
import type { BitStringCredential } from '../types'
import type { AnonCredsCredentialFormat, LegacyIndyCredentialFormat } from '@credo-ts/anoncreds'
import type {
  GetCredentialFormatDataReturn,
  JsonLdCredentialFormat,
  W3cCredentialRecord,
  W3cJsonLdSignCredentialOptions,
} from '@credo-ts/core'
import type { GenericRecord } from '@credo-ts/core/build/modules/generic-records/repository/GenericRecord'

import { Agent, ClaimFormat } from '@credo-ts/core'
import { injectable } from 'tsyringe'

import { BitStringCredentialStatusPurpose } from '../../enums/enum'
import ErrorHandlingService from '../../errorHandlingService'
import { BadRequestError, InternalServerError } from '../../errors/errors'
import utils from '../../utils/credentialStatusList'
import { SignCredentialPayload } from '../types'

import { Tags, Route, Controller, Post, Security, Body, Path, Get } from 'tsoa'

@Tags('Status')
@Route('/w3c/revocation')
@Security('apiKey')
@injectable()
export class W3CRevocationController extends Controller {
  private agent: Agent<RestAgentModules>

  public constructor(agent: Agent<RestAgentModules>) {
    super()
    this.agent = agent
  }

  @Post('/sign/bitstring-credential')
  public async createBitstringStatusListCredential(
    @Body() signCredentialPayload: SignCredentialPayload
  ): Promise<W3cCredentialRecord> {
    try {
      const data = await this._createBitstringStatusListCredential(signCredentialPayload)

      const signCredential = await this.agent.w3cCredentials.signCredential(
        data as unknown as W3cJsonLdSignCredentialOptions
      )

      const storCredential = await this.agent.w3cCredentials.storeCredential({ credential: signCredential })

      return storCredential
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Post('/revoke-credential/:credentialId')
  public async revokeW3C(@Path('credentialId') credentialId: string) {
    let sendNotification
    try {
      const credential = await this.agent.credentials.getFormatData(credentialId)
      const { credentialIndex, statusListCredentialURL } = await this._revokeW3C(credential)
      const revocationId = `${statusListCredentialURL}::${credentialIndex}`

      sendNotification = await this.agent.credentials.sendRevocationNotification({
        credentialRecordId: credentialId,
        revocationId,
        revocationFormat: 'jsonld',
      })
      return sendNotification
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Get('bitstring/status-list/:bitCredentialStatusUrl')
  public async getBitStringStatusListById(@Path('bitCredentialStatusUrl') bitCredentialStatusUrl: string): Promise<{
    bitStringCredential: BitStringCredential
    getIndex: GenericRecord[]
  }> {
    try {
      const bitStringCredential = await this._getBitStringStatusListById(bitCredentialStatusUrl)
      const getIndex = await this.agent.genericRecords.findAllByQuery({
        statusListCredentialURL: bitCredentialStatusUrl,
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

  public async _createBitstringStatusListCredential(signCredentialPayload: SignCredentialPayload) {
    try {
      const { bitStringCredentialUrl, issuerDid, statusPurpose, bitStringLength } = signCredentialPayload
      const bitStringStatusListPurpose = statusPurpose ?? BitStringCredentialStatusPurpose.REVOCATION
      const bitStringStatusListCredentialListLength = bitStringLength ? bitStringLength : 131072
      const bitStringStatus = await utils.generateBitStringStatus(bitStringStatusListCredentialListLength)
      const encodedList = await utils.encodeBitString(bitStringStatus)
      const didIdentifier = issuerDid.split(':')[2]
      const data = {
        format: ClaimFormat.LdpVc,
        credential: {
          '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/vc/status-list/2021/v1'],
          id: bitStringCredentialUrl,
          type: ['VerifiableCredential', 'BitstringStatusListCredential'],
          issuer: {
            id: issuerDid,
          },
          issuanceDate: new Date().toISOString(),
          credentialSubject: {
            id: bitStringCredentialUrl,
            type: 'BitstringStatusList',
            encodedList,
            statusPurpose: bitStringStatusListPurpose,
          },
        },
        verificationMethod: `${issuerDid}#${didIdentifier}`,
        proofType: 'Ed25519Signature2018',
      }

      await fetch(bitStringCredentialUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credentialsData: data }),
      })

      return data
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  public async _revokeW3C(
    credential: GetCredentialFormatDataReturn<
      (LegacyIndyCredentialFormat | JsonLdCredentialFormat | AnonCredsCredentialFormat)[]
    >
  ) {
    try {
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
      const decodeBitString = await utils.decodeBitSting(encodedBitString)

      const findBitStringIndex = decodeBitString.charAt(parseInt(credentialIndex))
      if (findBitStringIndex === revocationStatus.toString()) {
        throw new BadRequestError('The credential already revoked')
      }

      const updateBitString =
        decodeBitString.slice(0, parseInt(credentialIndex)) +
        revocationStatus +
        decodeBitString.slice(parseInt(credentialIndex) + 1)

      const encodeUpdatedBitString = await utils.encodeBitString(updateBitString)
      bitStringCredential.credential.credentialSubject.encodedList = encodeUpdatedBitString
      await fetch(statusListCredentialURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credentialsData: bitStringCredential }),
      })

      return { credentialIndex, statusListCredentialURL }
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  public async _getBitStringStatusListById(bitCredentialStatusUrl: string) {
    try {
      const validateUrl = await utils.isValidUrl(bitCredentialStatusUrl)
      if (!validateUrl) {
        throw new BadRequestError(`Please provide a bit string credential id`)
      }

      const bitStringCredentialDetails = await fetch(bitCredentialStatusUrl, {
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

      return bitStringCredential
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }
}
