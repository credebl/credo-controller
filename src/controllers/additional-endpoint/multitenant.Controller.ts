import type { RestMultiTenantAgentModules } from '../../cliAgent'
import type { Agent } from '@aries-framework/core'
import type { TenantRecord } from '@aries-framework/tenants'

import { JsonTransformer, RecordNotFoundError, injectable } from '@aries-framework/core'
import { Request as Req } from 'express'
import jwt from 'jsonwebtoken'

import { AgentRole } from '../../enums/enum'
import { generateSecretKey } from '../../utils/common.service'
import { CreateTenantOptions } from '../types'

// import { AgentRole } from 'src/enums/enum'
import { Body, Controller, Get, Path, Post, Request, Res, Route, Security, Tags, TsoaResponse } from 'tsoa'

@Tags('Multi Tenant')
@Security('jwt')
@Route('/test-endpoint/multi-tenant')
// @Security('NewAuth')
@injectable()
export class MultiTenantController extends Controller {
  // private readonly agent: Agent<RestMultiTenantAgentModules>

  // Krish: can simply add 'private readonly' in constructor
  // public constructor(private readonly agent: Agent<RestMultiTenantAgentModules>) {
  //   super()
  //   this.agent = agent
  // }

  // @Security('RootAuthorization')
  @Post('/create-tenant')
  public async createTenant(
    @Request() request: Req,
    @Body() createTenantOptions: CreateTenantOptions,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    const { config } = createTenantOptions
    try {
      console.log('reached in create tenant')
      console.log('this is request in controller::::::', request)
      console.log('this is request.user::::::', request.agent)
      console.log('this is request.agent.config::::::', request.agent.config)
      const agent = request.agent as unknown as Agent<RestMultiTenantAgentModules>
      const tenantRecord: TenantRecord = await agent.modules.tenants?.createTenant({ config })
      const token = await this.getToken(agent, tenantRecord.id)
      const withToken = { token, ...tenantRecord }
      return withToken
      // return typeof request['user'].agent
      // return 'success'
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `Tenant not created`,
        })
      }

      return internalServerError(500, { message: `Something went wrong: ${error}` })
    }
  }

  @Security('apiKey')
  @Get(':tenantId')
  public async getTenantById(
    @Request() request: Req,
    @Path('tenantId') tenantId: string,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const agent = request.agent as unknown as Agent<RestMultiTenantAgentModules>
      const getTenant = await agent.modules.tenants.getTenantById(tenantId)
      return JsonTransformer.toJSON(getTenant)
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `Tenant with id: ${tenantId} not found.`,
        })
      }
      return internalServerError(500, { message: `Something went wrong: ${error}` })
    }
  }

  @Security('jwt')
  @Post('/connection-invitation/')
  public async createInvitation(
    @Request() request: Req,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      // let outOfBandRecord: OutOfBandRecord | undefined
      // const agent = request.agent as unknown as Agent<RestMultiTenantAgentModules>
      // const tenantId = '5f8ba896-15c9-4db0-89a7-7eb2aa709613'
      console.log('This is request.agent', request.agent)
      console.log('reached here 12')
      // await agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
      // outOfBandRecord = await tenantAgent.oob.createInvitation()
      // })
      const outOfBandRecord = await request.agent.oob.createInvitation()
      return outOfBandRecord
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `Tenant not found.`,
        })
      }
      return internalServerError(500, { message: `Something went wrong: ${error}` })
    }
  }

  private async createToken(agent: Agent<RestMultiTenantAgentModules>, tenantId: string) {
    const secretKey = await generateSecretKey()
    // const genericRecord = await this.agent.genericRecords.getAll()
    // const records = genericRecord.find((record) => record?.content?.secretKey !== undefined)
    // const secretKey = records?.content.secretKey as string
    const token = jwt.sign({ role: AgentRole.RestTenantAgent, tenantId }, secretKey)
    // Save token to individual tenants generic records
    await this.saveTokenAndSecretKey(agent, token, secretKey, tenantId)
    return token
  }

  private async saveTokenAndSecretKey(
    agent: Agent<RestMultiTenantAgentModules>,
    token: string,
    secretKey: string,
    tenantId: string
  ) {
    await agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
      tenantAgent.genericRecords.save({
        content: {
          secretKey: secretKey,
          token,
        },
      })
    })
  }

  private async getToken(agent: Agent<RestMultiTenantAgentModules>, tenantId: string) {
    const token: string = await this.createToken(agent, tenantId)
    return token
  }
}
