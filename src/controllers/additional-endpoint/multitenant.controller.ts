import type { TenantRecord } from '@aries-framework/tenants'

import { Agent, RecordNotFoundError, injectable } from '@aries-framework/core'

import { CreateTenantOptions } from '../types'

import { Body, Controller, Post, Res, Route, Tags, TsoaResponse, Security } from 'tsoa'
import { RestMultiTenantAgentModules } from 'src/cliAgent'

@Tags('MultiTenancy')
@Route('/multi-tenant')
@Security('NewAuth')
@injectable()
export class MultiTenancyController extends Controller {
  //create wallet
  public constructor(private readonly agent: Agent<RestMultiTenantAgentModules>) {
    super()
  }

  @Security('apiKey')
  @Post('/create-tenant')
  public async createTenant(
    @Body() createTenantOptions: CreateTenantOptions,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    const { config } = createTenantOptions
    try {
      const tenantRecord: TenantRecord = await this.agent.modules.tenants.createTenant({ config })
      const token = this.getToken(tenantRecord.id)
      const withToken = { token, ...tenantRecord}
      return tenantRecord
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `Tenant not created`,
        })
      }

      return internalServerError(500, { message: `Something went wrong: ${error}` })
    }
  }

  private getTenant(tenantId: string){
  }
}
