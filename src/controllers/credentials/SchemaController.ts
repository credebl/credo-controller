import { getUnqualifiedSchemaId, parseIndySchemaId } from '@credo-ts/anoncreds'
import { Agent } from '@credo-ts/core'
import { injectable } from 'tsyringe'

import { CredentialEnum } from '../../enums/enum'
import { SchemaId, SchemaExample } from '../examples'
import { CreateSchemaInput } from '../types'

import { handleAnonCredsError } from './CredentialCommonError'

import { Body, Example, Get, Path, Post, Res, Route, Tags, TsoaResponse, Security } from 'tsoa'
@Tags('Schemas')
@Route('/schemas')
@Security('apiKey')
@injectable()
export class SchemaController {
  private agent: Agent

  public constructor(agent: Agent) {
    this.agent = agent
  }

  /**
   * Get schema by schemaId
   * @param schemaId
   * @param notFoundError
   * @param forbiddenError
   * @param badRequestError
   * @param internalServerError
   * @returns get schema by Id
   */
  @Example(SchemaExample)
  @Get('/:schemaId')
  public async getSchemaById(
    @Path('schemaId') schemaId: SchemaId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() forbiddenError: TsoaResponse<403, { reason: string }>,
    @Res() badRequestError: TsoaResponse<400, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const getSchemBySchemaId = await this.agent.modules.anoncreds.getSchema(schemaId)

      if (
        (getSchemBySchemaId &&
          getSchemBySchemaId?.resolutionMetadata &&
          getSchemBySchemaId?.resolutionMetadata?.error === 'notFound') ||
        getSchemBySchemaId?.resolutionMetadata?.error === 'unsupportedAnonCredsMethod'
      ) {
        return notFoundError(404, { reason: getSchemBySchemaId?.resolutionMetadata?.message })
      }

      return getSchemBySchemaId
    } catch (error) {
      return handleAnonCredsError(error, notFoundError, forbiddenError, badRequestError, internalServerError)
    }
  }

  /**
   * Create schema
   * @param schema
   * @param notFoundError
   * @param forbiddenError
   * @param badRequestError
   * @param internalServerError
   * @returns get schema
   */
  @Example(SchemaExample)
  @Post('/')
  public async createSchema(
    @Body()
    schema: CreateSchemaInput,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() forbiddenError: TsoaResponse<403, { reason: string }>,
    @Res() badRequestError: TsoaResponse<400, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { reason: string }>
  ) {
    try {
      const { issuerId, name, version, attributes } = schema

      const schemaPayload = {
        issuerId,
        name,
        version,
        attrNames: attributes,
      }

      if (!schema.endorse) {
        const { schemaState } = await this.agent.modules.anoncreds.registerSchema({
          schema: schemaPayload,
          options: {
            endorserMode: 'internal',
            endorserDid: issuerId,
          },
        })

        if (schemaState.state === 'failed') {
          return internalServerError(500, { reason: `${schemaState.reason}` })
        }

        const indySchemaId = parseIndySchemaId(schemaState.schemaId)

        const getSchemaUnqualifiedId = await getUnqualifiedSchemaId(
          indySchemaId.namespaceIdentifier,
          indySchemaId.schemaName,
          indySchemaId.schemaVersion
        )
        if (schemaState.state === CredentialEnum.Finished) {
          schemaState.schemaId = getSchemaUnqualifiedId
        }
        return schemaState
      } else {
        if (!schema.endorserDid) {
          return badRequestError(400, { reason: 'Please provide the endorser DID' })
        }

        const createSchemaTxResult = await this.agent.modules.anoncreds.registerSchema({
          options: {
            endorserMode: 'external',
            endorserDid: schema.endorserDid ? schema.endorserDid : '',
          },
          schema: schemaPayload,
        })

        if (createSchemaTxResult.state === 'failed') {
          return internalServerError(500, { reason: `${createSchemaTxResult.reason}` })
        }

        return createSchemaTxResult
      }
    } catch (error) {
      return handleAnonCredsError(error, notFoundError, forbiddenError, badRequestError, internalServerError)
    }
  }
}
