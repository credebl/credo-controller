import type { StatusListCredential } from './w3cRevocationTypes'
import type { RestAgentModules } from '../../cliAgent'
import type { StatusList } from '../types'
import type { StoreCredentialOptions, W3cJsonLdSignCredentialOptions } from '@credo-ts/core'

import { Agent } from '@credo-ts/core'
import * as fs from 'fs'
import { injectable } from 'tsyringe'

import { loadStatusList } from '../../lib/nonEsModule'
import { RecordId } from '../examples'

import { Tags, Route, Controller, Post, Get, Path, Security, Body } from 'tsoa'

@Tags('Status')
@Route('/status')
@injectable()
export class StatusController extends Controller {
  private agent: Agent<RestAgentModules>

  public constructor(agent: Agent<RestAgentModules>) {
    super()
    this.agent = agent
  }
  private statusList: any
  private list!: StatusList

  /**
   * Create Status List Credential
   */
  // Creates a new StatusListCredential that can be used for revocation
  @Security('apiKey')
  @Post('/createStatusListCredential/:statusId')
  // accepts size, minimum 131,072
  public async createStatusListCredential(@Path('statusId') statusId: string) {
    // Maintain an incremental index for statusListCredential
    // Add Id with agentEndpoint/status/number
    // Note: This endpoint should actually be an API to get StatusListCredential with id(as path param)
    const agentEndpoints = await this.agent.config
    const list = await this.createBitStringStatusList()
    const configFileData = fs.readFileSync('config.json', 'utf-8')
    const config = JSON.parse(configFileData)
    const statusListCredentialId = `yourIpAndPort:${config.port}/status/${statusId}`
    const listCred = await this._createStatusListCredential(statusListCredentialId, list)
    return listCred
  }

  /**
   * Create Entry for status list credential
   */
  // Create a new revocable credential
  // But do we even need this additional endpoint?
  @Security('apiKey')
  @Post('/signAndStoreStausListCredential')
  // public async createEntryForStatusListCredential')
  public async createEntryForStatusListCredential(@Body() credentialPayload: unknown) {
    const storedCredential = await this.storeSighnedCredential()
    return storedCredential
  }

  /**
   * Retrieve status of a credential
   */
  // Return if the status is revoked or not
  @Security('apiKey')
  @Get('/credential/:credentialRecordId')
  public async getCredentialStatus(@Path('credentialRecordId') credentialRecordId: RecordId) {
    return `success retrieveing credentialRecordId ${credentialRecordId}`
  }

  /**
   * Change status of an entry in a StatusListCredential
   */
  // Can this be a PUT operation?
  @Security('apiKey')
  @Post('/changeCredentialStatus')
  public async changeCredentialStatus() {
    return 'success'
  }

  /**
   * Retrieve statusListCredential according to their id
   */
  // Get statusListCredential from the id passed
  @Get('/:id')
  public async getStatusListCredential(@Path('id') id: string) {
    return `success with id: ${id}`
  }

  private async createBitStringStatusList() {
    this.statusList = await loadStatusList()
    this.list = await this.statusList.createList({ length: 100000 })
    return this.list
  }

  private async _createStatusListCredential(id: string, list: StatusList): Promise<StatusListCredential> {
    return this.statusList.createCredential({ id: id, list: list, statusPurpose: 'suspension' })
  }

  public async storeSighnedCredential() {
    const signedCred = {
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/vc/status-list/2021/v1'],
      id: 'http://yopurIp:yopurPort/status/1',
      type: ['VerifiableCredential', 'StatusList2021Credential'],
      issuer: {
        id: 'did:key:z6Mkty8b4M1arFSmxYVtM3nsoQvyFurHPhRxRms7vZ6cVZbN',
      },
      issuanceDate: '2019-10-12T07:20:50.52Z',
      credentialSubject: {
        id: 'http://yopurIp:yopurPort/status/1#list',
        claims: {
          type: 'StatusList2021',
          encodedList: 'H4sIAAAAAAAAA-3BMQEAAADCoPVPbQsvoAAAAAAAAAAAAAAAAP4GcwM92tQwAAA',
          statusPurpose: 'suspension',
        },
      },
      proof: {
        verificationMethod:
          'did:key:z6Mkty8b4M1arFSmxYVtM3nsoQvyFurHPhRxRms7vZ6cVZbN#z6Mkty8b4M1arFSmxYVtM3nsoQvyFurHPhRxRms7vZ6cVZbN',
        type: 'Ed25519Signature2018',
        created: '2024-07-08T12:24:04Z',
        proofPurpose: 'assertionMethod',
        jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..hOr9nyr4dlQx1VOMgBow5AeLNrIQ1We0kvR1dFT0AQKkS_lIu-AruZpNVgVCMVlHiFrj-qFYr36YUTwTzUwiAw',
      },
    }
    console.log('this is before storing')
    const storedCred = await this.agent.w3cCredentials.storeCredential(signedCred as unknown as StoreCredentialOptions)
    console.log('this is storedCred', storedCred)
    return storedCred
  }
}
