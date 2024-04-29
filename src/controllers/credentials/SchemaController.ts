import { getUnqualifiedSchemaId, parseIndySchemaId } from '@credo-ts/anoncreds'
import { Agent } from '@credo-ts/core'
import { HttpStatusCode } from 'axios'
import { injectable } from 'tsyringe'

import { CredentialEnum, EndorserMode, SchemaError } from '../../enums/enum'
import { NON_ENDORSER_DID_PRESENT } from '../../errorMessages'
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
   * @param notFoundErrormessage
   * @param forbiddenError
   * @param badRequestError
   * @param internalServerError
   * @returns get schema by Id
   */
  @Example(SchemaExample)
  @Get('/:schemaId')
  public async getSchemaById(
    @Path('schemaId') schemaId: SchemaId,
    @Res() notFoundError: TsoaResponse<HttpStatusCode.NotFound, { reason: string }>,
    @Res() forbiddenError: TsoaResponse<HttpStatusCode.Forbidden, { reason: string }>,
    @Res() badRequestError: TsoaResponse<HttpStatusCode.BadRequest, { reason: string }>,
    @Res() internalServerError: TsoaResponse<HttpStatusCode.InternalServerError, { reason: string }>
  ) {
    try {
      const getSchemBySchemaId = await this.agent.modules.anoncreds.getSchema(schemaId)

      if (
        (getSchemBySchemaId &&
          getSchemBySchemaId?.resolutionMetadata &&
          getSchemBySchemaId?.resolutionMetadata?.error === SchemaError.NotFound) ||
        getSchemBySchemaId?.resolutionMetadata?.error === SchemaError.UnSupportedAnonCredsMethod
      ) {
        return notFoundError(HttpStatusCode.NotFound, { reason: getSchemBySchemaId?.resolutionMetadata?.message })
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
    @Res() notFoundError: TsoaResponse<HttpStatusCode.NotFound, { reason: string }>,
    @Res() forbiddenError: TsoaResponse<HttpStatusCode.Forbidden, { reason: string }>,
    @Res() badRequestError: TsoaResponse<HttpStatusCode.BadRequest, { reason: string }>,
    @Res() internalServerError: TsoaResponse<HttpStatusCode.InternalServerError, { reason: string }>
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
            endorserMode: EndorserMode.Internal,
            endorserDid: issuerId,
          },
        })

        if (schemaState.state === CredentialEnum.Failed) {
          return internalServerError(HttpStatusCode.InternalServerError, { reason: `${schemaState.reason}` })
        }

        const indySchemaId = await parseIndySchemaId(schemaState.schemaId)

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
          return badRequestError(HttpStatusCode.BadRequest, { reason: NON_ENDORSER_DID_PRESENT })
        }

        const createSchemaTxResult = await this.agent.modules.anoncreds.registerSchema({
          options: {
            endorserMode: EndorserMode.External,
            endorserDid: schema.endorserDid ? schema.endorserDid : '',
          },
          schema: schemaPayload,
        })

        if (createSchemaTxResult.state === CredentialEnum.Failed) {
          return internalServerError(HttpStatusCode.InternalServerError, { reason: `${createSchemaTxResult.reason}` })
        }

        return createSchemaTxResult
      }
    } catch (error) {
      return handleAnonCredsError(error, notFoundError, forbiddenError, badRequestError, internalServerError)
    }
  }
}
