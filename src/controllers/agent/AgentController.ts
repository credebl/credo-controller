import type { AgentInfo, AgentToken } from '../types'

import { Agent } from '@aries-framework/core'
import { Request as Req } from 'express'
import jwt from 'jsonwebtoken'
import { injectable } from 'tsyringe'

import { AgentRole } from '../../enums/enum'

// import { generateSecretKey } from 'src/utils/common.service'
import { Controller, Delete, Get, Post, Route, Tags, Security, Request } from 'tsoa'

@Tags('Agent')
@Route('/agent')
@injectable()
export class AgentController extends Controller {
  private agent: Agent

  public constructor(agent: Agent) {
    super()
    this.agent = agent
  }

  /**
   * Retrieve basic agent information
   */
  @Get('/info')
  public async getAgentInfo(): Promise<AgentInfo> {
    return {
      label: this.agent.config.label,
      endpoints: this.agent.config.endpoints,
      isInitialized: this.agent.isInitialized,
      publicDid: undefined,
    }
  }

  /**
   * Retrieve agent token
   */
  @Post('/token')
  @Security('apiKey')
  public async getAgentToken(@Request() request: Req): Promise<AgentToken | string> {
    // const details = await this.agent.genericRecords.getAll()
    console.log(`This is in agent token request.agent::::::`, request.agent)
    // const genericRecord = await request.agent.genericRecords.getAll()
    // console.log('genericRecord:::::', genericRecord)
    // const recordWithToken = genericRecord.find((record) => record?.content?.token !== undefined)
    // const token = recordWithToken?.content.token as string
    // return {
    //   token: token,
    // }
    let token
    const genericRecords = await this.agent.genericRecords.getAll()
    const secretKeyInfo = genericRecords.find((record) => record?.content?.secretKey !== undefined)
    if (!secretKeyInfo) {
      throw new Error('secretKeyInfo not found')
    }
    const secretKey = secretKeyInfo.content.secretKey as string
    // const recordsWithToken = genericRecord.some((record) => record?.content?.token)
    // const recordWithToken = genericRecords.find((record) => record?.content?.token !== undefined)
    // const token = recordWithToken?.content.token as string
    // if (!genericRecords.length || !recordWithToken) {
    //   // Call the async function

    //   // Already get the secretKey from the genericRecords

    //   // Check if the secretKey already exist in the genericRecords

    //   // if already exist - then don't generate the secret key again
    //   // Check if the JWT token already available in genericRecords - if yes, and also don't generate the JWT token
    //   // instead use the existin JWT token
    //   // if JWT token is not found, create/generate a new token and save in genericRecords
    //   // next time, the same token should be used - instead of creating a new token on every restart event of the agent

    //   // if already exist - then don't generate the secret key again
    //   // Check if the JWT token already available in genericRecords - if yes, and also don't generate the JWT token
    //   // instead use the existin JWT token
    //   // if JWT token is not found, create/generate a new token and save in genericRecords
    //   // next time, the same token should be used - instead of creating a new token on every restart event of the agent

    //   // Krish: Should add agent role and tenant id in case of tenants
    //   // token = jwt.sign({ agentInfo: 'agentInfo' }, secretKeyInfo)

    //   // agent role set for dedicated agent and base-wallet respectively
    //   if (!('tenants' in this.agent.modules)) {
    //     token = jwt.sign({ role: AgentRole.RestRootAgent }, secretKey)
    //   } else {
    //     token = jwt.sign({ role: AgentRole.RestRootAgentWithTenants }, secretKey)
    //   }

    //   // Krish: there should be no need to store the token if it is a refresh token. It's okay to save it for now and return it in the additional endpoint
    //   console.log('--------------if---------------', token)
    //   await this.agent.genericRecords.save({
    //     content: {
    //       // apiKey,
    //       // secretKey: secretKeyInfo,
    //       token,
    //     },
    //   })
    // } else {
    //   // const recordWithToken = genericRecords.find((record) => record?.content?.token !== undefined)
    //   if (!('tenants' in this.agent.modules)) {
    //     token = jwt.sign({ role: AgentRole.RestRootAgent }, secretKey)
    //   } else {
    //     token = jwt.sign({ role: AgentRole.RestRootAgentWithTenants }, secretKey)
    //   }
    //   token = recordWithToken?.content.token as string
    //   console.log('--------------else---------------', token)
    // }
    if (!('tenants' in this.agent.modules)) {
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
  @Security('apiKey')
  @Delete('/wallet')
  public async deleteWallet() {
    const deleteWallet = await this.agent.wallet.delete()
    return deleteWallet
  }
}
