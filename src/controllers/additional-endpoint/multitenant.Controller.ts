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
  // @Security('RootAuthorization')
  @Security('jwt', ['multi-tenant'])
  @Post('/create-tenant')
  public async createTenant(
    @Request() request: Req,
    @Body() createTenantOptions: CreateTenantOptions,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    const { config } = createTenantOptions
    try {
      const agent = request.agent as unknown as Agent<RestMultiTenantAgentModules>
      const tenantRecord: TenantRecord = await agent.modules.tenants?.createTenant({ config })
      const token = await this.createToken(agent, tenantRecord.id)
      const withToken = { token, ...tenantRecord }
      return withToken
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `Tenant not created`,
        })
      }

      return internalServerError(500, { message: `Something went wrong: ${error}` })
    }
  }

  @Security('jwt', ['multi-tenant'])
  @Post('/get-token/:tenantId')
  public async getTenantToken(
    @Request() request: Req,
    @Path('tenantId') tenantId: string,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const agent = request.agent as unknown as Agent<RestMultiTenantAgentModules>
      let secretKey
      await agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        const genericRecord = await tenantAgent.genericRecords.getAll()
        const records = genericRecord.find((record) => record?.content?.secretKey !== undefined)
        secretKey = records?.content.secretKey as string
      })

      if (!secretKey) {
        throw new RecordNotFoundError('secretKey does not exist in wallet', { recordType: 'debug', cause: undefined })
      }

      const token = await this.createToken(agent, tenantId, secretKey)

      return { token: token }
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `SecretKey not found`,
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

  private async createToken(agent: Agent<RestMultiTenantAgentModules>, tenantId: string, secretKey?: string) {
    let key: string
    if (!secretKey) {
      key = await generateSecretKey()
      await agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        tenantAgent.genericRecords.save({
          content: {
            secretKey: key,
          },
        })
      })
    } else {
      key = secretKey
    }
    const token = jwt.sign({ role: AgentRole.RestTenantAgent, tenantId }, key)
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
}
