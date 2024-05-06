import type { BasicMessageRecord, BasicMessageStorageProps } from '@aries-framework/core'

// eslint-disable-next-line import/no-extraneous-dependencies
import { RecordNotFoundError } from '@aries-framework/core'
import { Request as Req } from 'express'
import { injectable } from 'tsyringe'

import { BasicMessageRecordExample, RecordId } from '../examples'

import { Body, Controller, Example, Get, Path, Post, Res, Route, Tags, TsoaResponse, Security, Request } from 'tsoa'

@Tags('Basic Messages')
@Route('/basic-messages')
// @Security('apiKey')
@Security('jwt')
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
  public async getBasicMessages(
    @Path('connectionId') connectionId: RecordId,
    @Request() request: Req
  ): Promise<BasicMessageRecord[]> {
    return await request.agent.basicMessages.findAllByQuery({ connectionId })
  }

  /**
   * Send a basic message to a connection
   *
   * @param connectionId Connection identifier
   * @param content The content of the message
   */
  @Post('/:connectionId')
  public async sendMessage(
    @Path('connectionId') connectionId: RecordId,
    @Body() requestBody: Record<'content', string>,
    @Request() request: Req,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      this.setStatus(204)
      await request.agent.basicMessages.sendMessage(connectionId, requestBody.content)
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, { reason: `connection with connection id "${connectionId}" not found.` })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }
}
