import type { RestMultiTenantAgentModules } from '../../cliAgent'
import type { TenantRecord } from '@aries-framework/tenants'

// eslint-disable-next-line import/order
import { Agent, RecordNotFoundError, injectable } from '@aries-framework/core'

import jwt from 'jsonwebtoken'

import { RequestWithRootTenantAgent } from '../../authentication'
import { AgentType } from '../../enums/enum'
import { generateSecretKey } from '../../utils/common.service'
import { CreateTenantOptions } from '../types'

// import { AgentType } from 'src/enums/enum'
import { Body, Controller, Post, Request, Res, Route, Security, Tags, TsoaResponse } from 'tsoa'

@Tags('Multi Tenant')
@Route('/test-endpoint/multi-tenant')
// @Security('NewAuth')
@injectable()
export class MultiTenantController extends Controller {
  // private readonly agent: Agent<RestMultiTenantAgentModules>

  // Krish: can simply add 'private readonly' in constructor
  public constructor(private readonly agent: Agent<RestMultiTenantAgentModules>) {
    super()
    this.agent = agent
  }

  // @Security('RootAuthorization')
  @Security('NewAuth')
  @Post('/create-tenant')
  public async createTenant(
    @Request() request: RequestWithRootTenantAgent,
    @Body() createTenantOptions: CreateTenantOptions,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    const { config } = createTenantOptions
    try {
      const tenantRecord: TenantRecord = await this.agent.modules.tenants.createTenant({ config })
      const token = await this.getToken(tenantRecord.id)
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

  private async createToken(tenantId: string) {
    const secretKey = await generateSecretKey()
    // const genericRecord = await this.agent.genericRecords.getAll()
    // const records = genericRecord.find((record) => record?.content?.secretKey !== undefined)
    // const secretKey = records?.content.secretKey as string
    const token = jwt.sign({ role: AgentType.TenantAgent, tenantId }, secretKey)
    // Save token to individual tenants generic records
    await this.saveTokenAndSecretKey(token, secretKey, tenantId)
    return token
  }

  private async saveTokenAndSecretKey(token: string, secretKey: string, tenantId: string) {
    await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
      tenantAgent.genericRecords.save({
        content: {
          secretKey: secretKey,
        },
      })
    })
  }

  private async getToken(tenantId: string) {
    const token: string = await this.createToken(tenantId)
    return token
  }
}
