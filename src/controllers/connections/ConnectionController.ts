import type { ConnectionRecordProps } from '@aries-framework/core'

// eslint-disable-next-line import/no-extraneous-dependencies
import { ConnectionRepository, DidExchangeState, AriesFrameworkError, RecordNotFoundError } from '@aries-framework/core'
import { Request as Req } from 'express'
// eslint-disable-next-line import/no-extraneous-dependencies
import { injectable } from 'tsyringe'

import { ConnectionRecordExample, RecordId } from '../examples'

import {
  Controller,
  Delete,
  Example,
  Get,
  Path,
  Post,
  Query,
  Res,
  Route,
  Tags,
  TsoaResponse,
  Security,
  Request,
} from 'tsoa'

@Tags('Connections')
@Route()
@injectable()
export class ConnectionController extends Controller {
  /**
   * Retrieve all connections records
   * @param alias Alias
   * @param state Connection state
   * @param myDid My DID
   * @param theirDid Their DID
   * @param theirLabel Their label
   * @returns ConnectionRecord[]
   */
  @Example<ConnectionRecordProps[]>([ConnectionRecordExample])
  // @Security('apiKey')
  @Security('jwt')
  @Get('/connections')
  public async getAllConnections(
    @Request() request: Req,
    @Query('outOfBandId') outOfBandId?: string,
    @Query('alias') alias?: string,
    @Query('state') state?: DidExchangeState,
    @Query('myDid') myDid?: string,
    @Query('theirDid') theirDid?: string,
    @Query('theirLabel') theirLabel?: string
  ) {
    let connections

    if (outOfBandId) {
      connections = await request.agent.connections.findAllByOutOfBandId(outOfBandId)
    } else {
      const connectionRepository = request.agent.dependencyManager.resolve(ConnectionRepository)

      const connections = await connectionRepository.findByQuery(request.agent.context, {
        alias,
        myDid,
        theirDid,
        theirLabel,
        state,
      })

      return connections.map((c) => c.toJSON())
    }

    // if (alias) connections = connections.filter((c) => c.alias === alias)
    // if (state) connections = connections.filter((c) => c.state === state)
    // if (myDid) connections = connections.filter((c) => c.did === myDid)
    // if (theirDid) connections = connections.filter((c) => c.theirDid === theirDid)
    // if (theirLabel) connections = connections.filter((c) => c.theirLabel === theirLabel)

    return connections.map((c) => c.toJSON())
  }

  /**
   * Retrieve connection record by connection id
   * @param connectionId Connection identifier
   * @returns ConnectionRecord
   */
  @Example<ConnectionRecordProps>(ConnectionRecordExample)
  // @Security('apiKey')
  @Security('jwt')
  @Get('/connections/:connectionId')
  public async getConnectionById(
    @Request() request: Req,
    @Path('connectionId') connectionId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>
  ) {
    const connection = await request.agent.connections.findById(connectionId)

    if (!connection) return notFoundError(404, { reason: `connection with connection id "${connectionId}" not found.` })

    return connection.toJSON()
  }

  /**
   * Deletes a connection record from the connection repository.
   *
   * @param connectionId Connection identifier
   */
  @Delete('/connections/:connectionId')
  // @Security('apiKey')
  @Security('jwt')
  public async deleteConnection(
    @Request() request: Req,
    @Path('connectionId') connectionId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      this.setStatus(204)
      await request.agent.connections.deleteById(connectionId)
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, { reason: `connection with connection id "${connectionId}" not found.` })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Accept a connection request as inviter by sending a connection response message
   * for the connection with the specified connection id.
   *
   * This is not needed when auto accepting of connection is enabled.
   *
   * @param connectionId Connection identifier
   * @returns ConnectionRecord
   */
  @Example<ConnectionRecordProps>(ConnectionRecordExample)
  // @Security('apiKey')
  @Security('jwt')
  @Post('/connections/:connectionId/accept-request')
  public async acceptRequest(
    @Request() request: Req,
    @Path('connectionId') connectionId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const connection = await request.agent.connections.acceptRequest(connectionId)
      return connection.toJSON()
    } catch (error) {
      if (error instanceof AriesFrameworkError) {
        return notFoundError(404, { reason: `connection with connection id "${connectionId}" not found.` })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Accept a connection response as invitee by sending a trust ping message
   * for the connection with the specified connection id.
   *
   * This is not needed when auto accepting of connection is enabled.
   *
   * @param connectionId Connection identifier
   * @returns ConnectionRecord
   */
  @Example<ConnectionRecordProps>(ConnectionRecordExample)
  // @Security('apiKey')
  @Security('jwt')
  @Post('/connections/:connectionId/accept-response')
  public async acceptResponse(
    @Request() request: Req,
    @Path('connectionId') connectionId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const connection = await request.agent.connections.acceptResponse(connectionId)
      return connection.toJSON()
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, { reason: `connection with connection id "${connectionId}" not found.` })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  @Security('jwt', ['skip'])
  @Get('/url/:invitationId')
  public async getInvitation(
    @Request() request: Req,
    @Path('invitationId') invitationId: string,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    const outOfBandRecord = await request.agent.oob.findByCreatedInvitationId(invitationId)

    if (!outOfBandRecord || outOfBandRecord.state !== 'await-response')
      return notFoundError(404, { reason: `connection with invitationId "${invitationId}" not found.` })

    const invitationJson = outOfBandRecord.outOfBandInvitation.toJSON({ useDidSovPrefixWhereAllowed: true })
    return invitationJson
  }
}
