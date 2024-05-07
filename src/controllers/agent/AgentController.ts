import type { AgentInfo, AgentToken } from '../types'

import { Request as Req } from 'express'
import jwt from 'jsonwebtoken'
import { injectable } from 'tsyringe'

import { AgentRole } from '../../enums/enum'

// import { generateSecretKey } from 'src/utils/common.service'
import { Controller, Delete, Get, Post, Route, Tags, Security, Request } from 'tsoa'

@Tags('Agent')
@Route('/agent')
@injectable()
// @Security('jwt')
export class AgentController extends Controller {
  // private agent: Agent

  // public constructor(agent: Agent) {
  //   super()
  //   this.agent = agent
  // }

  /**
   * Retrieve basic agent information
   */
  @Security('jwt')
  @Get('/info')
  public async getAgentInfo(@Request() request: Req): Promise<AgentInfo> {
    return {
      label: request.agent.config.label,
      endpoints: request.agent.config.endpoints,
      isInitialized: request.agent.isInitialized,
      publicDid: undefined,
    }
  }

  /**
   * Retrieve agent token
   */
  @Post('/token')
  @Security('apiKey')
  public async getAgentToken(@Request() request: Req): Promise<AgentToken | string> {
    let token
    const genericRecords = await request.agent.genericRecords.getAll()
    const secretKeyInfo = genericRecords.find((record) => record?.content?.secretKey !== undefined)
    if (!secretKeyInfo) {
      throw new Error('secretKeyInfo not found')
    }
    const secretKey = secretKeyInfo.content.secretKey as string
    if (!('tenants' in request.agent.modules)) {
      token = jwt.sign({ role: AgentRole.RestRootAgent }, secretKey)
    } else {
      token = jwt.sign({ role: AgentRole.RestRootAgentWithTenants }, secretKey)
    }
    return {
      token: token,
    }
  }

  /**
   * Delete wallet
   */
  @Delete('/wallet')
  @Security('jwt')
  public async deleteWallet(@Request() request: Req) {
    const deleteWallet = await request.agent.wallet.delete()
    return deleteWallet
  }
}
