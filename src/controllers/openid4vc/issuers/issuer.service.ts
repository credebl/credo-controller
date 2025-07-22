import type { RestAgentModules, RestMultiTenantAgentModules } from '../../../cliAgent'
import type { Agent } from '@credo-ts/core'

import { OpenId4VcIssuerRepository } from '@credo-ts/openid4vc/build/openid4vc-issuer/repository'

export class IssuerService {
  public async createIssuerAgent(
    agent: Agent<RestMultiTenantAgentModules> | Agent<RestAgentModules>,
    createIssuerOptions: any, //TODO: Replace with OpenId4VciCreateIssuerOptions,
  ) {
    const issuerRecord = await agent.modules.openId4VcIssuer.createIssuer(createIssuerOptions)
    const issuerMetadata = await agent.modules.openId4VcIssuer.getIssuerMetadata(issuerRecord.issuerId)
    // eslint-disable-next-line no-console
    console.log(`\nIssuer URL: ${issuerMetadata.credentialIssuer.credential_issuer}`)
    return issuerRecord
  }

  public async updateIssuerMetadata(
    agent: Agent<RestMultiTenantAgentModules> | Agent<RestAgentModules>,
    publicIssuerId: string,
    updateIssuerRecordOptions: any, // TODO: Replace with OpenId4VcUpdateIssuerRecordOptions
  ) {
    await agent.modules.openId4VcIssuer.updateIssuerMetadata({
      issuerId: publicIssuerId,
      ...updateIssuerRecordOptions,
    })
    return await this.getIssuer(agent, publicIssuerId)
  }

  public async getIssuersByQuery(
    agent: Agent<RestMultiTenantAgentModules> | Agent<RestAgentModules>,
    publicIssuerId?: string,
  ) {
    const repository = agent.dependencyManager.resolve(OpenId4VcIssuerRepository)
    return await repository.findByQuery(agent.context, { issuerId: publicIssuerId })
  }

  public async getIssuer(agent: Agent<RestMultiTenantAgentModules> | Agent<RestAgentModules>, publicIssuerId: string) {
    return await agent.modules.openId4VcIssuer.getIssuerByIssuerId(publicIssuerId)
  }

  public async deleteIssuer(agent: Agent<RestMultiTenantAgentModules> | Agent<RestAgentModules>, issuerId: string) {
    const repository = agent.dependencyManager.resolve(OpenId4VcIssuerRepository)
    await repository.deleteById(agent.context, issuerId)
  }

  public async getIssuerAgentMetaData(
    agent: Agent<RestMultiTenantAgentModules> | Agent<RestAgentModules>,
    issuerId: string,
  ) {
    // return await agent.modules.openId4VcIssuer.getIssuerMetadata(issuerId)
    return 0
  }
}

export const issuerService = new IssuerService()
