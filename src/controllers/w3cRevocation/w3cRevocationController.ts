import type { RestAgentModules } from '../../cliAgent'

import { Agent } from '@credo-ts/core'
import { createList } from '@digitalbazaar/vc-status-list'
import { injectable } from 'tsyringe'

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

  /**
   * Create Status List Credential
   */
  // Creates a new StatusListCredential that can be used for revocation
  @Post('/createStatusListCredential')
  public async createStatusListCredential() {
    // createCredential({ id, list, statusPurpose }: { id: string; list: vc.StatusList; statusPurpose: string; }
    // vc.createCredential()
    const list = await this.createBitStringStatusList()
    console.log('this is list in createStatusListCredential', list)
    return 'success'
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
    const list = createList({ length: 100000 })
    console.log('vcStatusList', JSON.stringify(list))
    return list
    // return list
  }
}
