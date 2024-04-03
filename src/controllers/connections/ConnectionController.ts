import type { ConnectionRecordProps } from '@credo-ts/core'

import { ConnectionRepository, DidExchangeState, Agent, CredoError, RecordNotFoundError } from '@credo-ts/core'
import { injectable } from 'tsyringe'

import { ConnectionRecordExample, RecordId } from '../examples'

import { Controller, Delete, Example, Get, Path, Post, Query, Res, Route, Tags, TsoaResponse, Security } from 'tsoa'

@Tags('Connections')
@Route()
@injectable()
export class ConnectionController extends Controller {
  private agent: Agent

  public constructor(agent: Agent) {
    super()
    this.agent = agent
  }

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
  @Security('apiKey')
  @Get('/connections')
  public async getAllConnections(
    @Query('outOfBandId') outOfBandId?: string,
    @Query('alias') alias?: string,
    @Query('state') state?: DidExchangeState,
    @Query('myDid') myDid?: string,
    @Query('theirDid') theirDid?: string,
    @Query('theirLabel') theirLabel?: string
  ) {
    let connections

    if (outOfBandId) {
      connections = await this.agent.connections.findAllByOutOfBandId(outOfBandId)
    } else {
      const connectionRepository = this.agent.dependencyManager.resolve(ConnectionRepository)

      const connections = await connectionRepository.findByQuery(this.agent.context, {
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
  @Security('apiKey')
  @Get('/connections/:connectionId')
  public async getConnectionById(
    @Path('connectionId') connectionId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>
  ) {
    const connection = await this.agent.connections.findById(connectionId)

    if (!connection) return notFoundError(404, { reason: `connection with connection id "${connectionId}" not found.` })

    return connection.toJSON()
  }

  /**
   * Deletes a connection record from the connection repository.
   *
   * @param connectionId Connection identifier
   */
  @Delete('/connections/:connectionId')
  @Security('apiKey')
  public async deleteConnection(
    @Path('connectionId') connectionId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      this.setStatus(204)
      await this.agent.connections.deleteById(connectionId)
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
  @Security('apiKey')
  @Post('/connections/:connectionId/accept-request')
  public async acceptRequest(
    @Path('connectionId') connectionId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const connection = await this.agent.connections.acceptRequest(connectionId)
      return connection.toJSON()
    } catch (error) {
      if (error instanceof CredoError) {
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
  @Security('apiKey')
  @Post('/connections/:connectionId/accept-response')
  public async acceptResponse(
    @Path('connectionId') connectionId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const connection = await this.agent.connections.acceptResponse(connectionId)
      return connection.toJSON()
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, { reason: `connection with connection id "${connectionId}" not found.` })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  @Get('/url/:invitationId')
  public async getInvitation(
    @Path('invitationId') invitationId: string,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    const outOfBandRecord = await this.agent.oob.findByCreatedInvitationId(invitationId)

    if (!outOfBandRecord || outOfBandRecord.state !== 'await-response')
      return notFoundError(404, { reason: `connection with invitationId "${invitationId}" not found.` })

    const invitationJson = outOfBandRecord.outOfBandInvitation.toJSON({ useDidSovPrefixWhereAllowed: true })
    return invitationJson
  }
}
