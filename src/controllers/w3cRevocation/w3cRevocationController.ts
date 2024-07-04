import type { RestAgentModules } from '../../cliAgent'
import type { StatusList } from '../types'

import { Agent } from '@credo-ts/core'
import { injectable } from 'tsyringe'

import { loadStatusList } from '../../lib/nonEsModule'
import { RecordId } from '../examples'

import { Tags, Route, Controller, Post, Get, Path, Security } from 'tsoa'

@Tags('Status')
@Route('/status')
@Security('apiKey')
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
  @Post('/createStatusListCredential')
  // accepts size, minimum 131,072
  public async createStatusListCredential() {
    // Maintain an incremental index for statusListCredential
    // Add Id with agentEndpoint/status/number
    // Note: This endpoint should actually be an API to get StatusListCredential with id(as path param)
    const list = await this.createBitStringStatusList()
    const listCred = await this._createStatusListCredential(list)
    return listCred
    // const bitstring = new Bitstring({ length: 10 })
  }

  /**
   * Create Entry for status list credential
   */
  // Create a new revocable credential
  // But do we even need this additional endpoint?
  @Post('/createEntryForStatusListCredential')
  public async createEntryForStatusListCredential() {
    return 'success'
  }

  /**
   * Retrieve status of a credential
   */
  // Return if the status is revoked or not
  @Get('/:credentialRecordId')
  public async getCredentialStatus(@Path('credentialRecordId') credentialRecordId: RecordId) {
    return `success retrieveing credentialRecordId ${credentialRecordId}`
  }

  /**
   * Change status of an entry in a StatusListCredential
   */
  // Can this be a PUT operation?
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

  private async _createStatusListCredential(list: StatusList) {
    return this.statusList.createCredential({ id: '1', list: list, statusPurpose: 'suspension' })
  }
}
