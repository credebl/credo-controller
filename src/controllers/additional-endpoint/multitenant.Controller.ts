import type { RestMultiTenantAgentModules } from '../../cliAgent'
import type { Agent } from '@aries-framework/core'
import type { TenantRecord } from '@aries-framework/tenants'

import { RecordNotFoundError, injectable } from '@aries-framework/core'
import jwt from 'jsonwebtoken'

import { RequestWithRootTenantAgent } from '../../authentication'
import { AgentRole } from '../../enums/enum'
import { generateSecretKey } from '../../utils/common.service'
import { CreateTenantOptions } from '../types'

// import { AgentRole } from 'src/enums/enum'
import { Body, Controller, Post, Request, Res, Route, Security, Tags, TsoaResponse } from 'tsoa'

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
    @Request() request: RequestWithRootTenantAgent,
    @Body() createTenantOptions: CreateTenantOptions,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    const { config } = createTenantOptions
    try {
      console.log('reached in create tenant')
      const tenantRecord: TenantRecord = await request.user.agent.modules.tenants.createTenant({ config })
      const token = await this.getToken(request.user.agent, tenantRecord.id)
      const withToken = { token, ...tenantRecord }
      return withToken
      return 'success'
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `Tenant not created`,
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
    const token = jwt.sign({ role: AgentRole.TenantAgent, tenantId }, secretKey)
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
        },
      })
    })
  }

  private async getToken(agent: Agent<RestMultiTenantAgentModules>, tenantId: string) {
    const token: string = await this.createToken(agent, tenantId)
    return token
  }
}
