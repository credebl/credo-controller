import { Agent } from '@credo-ts/core'
import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Route,
  Tags,
  Path,
  Query,
  Body,
  Security,
  Request,
  SuccessResponse,
} from 'tsoa'
import { injectable } from 'tsyringe'

import ErrorHandlingService from '../../../errorHandlingService'
import { CreateIssuerOptions, UpdateIssuerRecordOptions } from '../types/issuer.types'

import { issuerService } from './issuer.service'
@Route('/openid4vc/issuer')
@Tags('oid4vc issuers')
@Security('apiKey')
@injectable()
export class IssuerController extends Controller {
  private agent: Agent

  public constructor(agent: Agent) {
    super()
    this.agent = agent
  }
  /**
   * Creates an issuer with issuer metadata.
   */
  @Post()
  public async createIssuer(@Body() createIssuerOptions: any) {
    try {
      return await issuerService.createIssuerAgent(this.agent, createIssuerOptions)
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Updates issuer metadata for a given publicIssuerId.
   */
  @Put('{publicIssuerId}')
  public async updateIssuerMetadata(
    @Path() publicIssuerId: string,
    @Body() updateIssuerRecordOptions: UpdateIssuerRecordOptions,
  ) {
    try {
      return await issuerService.updateIssuerMetadata(this.agent, publicIssuerId, updateIssuerRecordOptions)
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Returns metadata for a specific issuer.
   */
  @Get('{issuerId}/metadata')
  public async getIssuerAgentMetaData(@Path() issuerId: string) {
    try {
      return await issuerService.getIssuerAgentMetaData(this.agent, issuerId)
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Query issuers by optional publicIssuerId.
   */
  @Get()
  public async getIssuersByQuery(@Query() publicIssuerId?: string) {
    try {
      return await issuerService.getIssuersByQuery(this.agent, publicIssuerId)
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Returns a specific issuer by publicIssuerId.
   */
  @Get('{publicIssuerId}')
  public async getIssuer(@Path() publicIssuerId: string) {
    try {
      return await issuerService.getIssuer(this.agent, publicIssuerId)
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Deletes a specific issuer by record id.
   */
  @Delete('{id}')
  public async deleteIssuer(@Path() id: string): Promise<void> {
    try {
      await issuerService.deleteIssuer(this.agent, id)
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }
}
