import type { RestAgentModules } from '../../../cliAgent'
import type { BasicMessageRecord, BasicMessageStorageProps } from '@credo-ts/core'

import { Agent } from '@credo-ts/core'
import { Body, Controller, Example, Get, Path, Post, Route, Tags, Security, Request } from 'tsoa'
import { Request as Req } from 'express'
import { injectable } from 'tsyringe'

import ErrorHandlingService from '../../../errorHandlingService'
import { BasicMessageRecordExample, RecordId } from '../../examples'
import { SCOPES } from '../../../enums'

@Tags('DIDComm - Basic Messages')
@Route('/didcomm/basic-messages')
@Security('jwt', [SCOPES.TENANT_AGENT, SCOPES.DEDICATED_AGENT])
@injectable()
export class BasicMessageController extends Controller {

  /**
   * Retrieve basic messages by connection id
   *
   * @param connectionId Connection identifier
   * @returns BasicMessageRecord[]
   */
  @Example<BasicMessageStorageProps[]>([BasicMessageRecordExample])
  @Get('/:connectionId')
  public async getBasicMessages(@Request() request: Req, @Path('connectionId') connectionId: RecordId): Promise<BasicMessageRecord[]> {
    try {
      const basicMessageRecords = await request.agent.basicMessages.findAllByQuery({ connectionId })
      this.setStatus(200)
      return basicMessageRecords
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Send a basic message to a connection
   *
   * @param connectionId Connection identifier
   * @param content The content of the message
   */
  @Example<BasicMessageStorageProps>(BasicMessageRecordExample)
  @Post('/:connectionId')
  public async sendMessage(@Request() request: Req, @Path('connectionId') connectionId: RecordId, @Body() body: Record<'content', string>) {
    try {
      const basicMessageRecord = await request.agent.basicMessages.sendMessage(connectionId, body.content)
      this.setStatus(204)
      return basicMessageRecord
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }
}
