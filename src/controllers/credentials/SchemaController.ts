import { getUnqualifiedSchemaId, parseIndySchemaId } from '@credo-ts/anoncreds'
import { Agent } from '@credo-ts/core'
import { injectable } from 'tsyringe'

import { CredentialEnum, EndorserMode, SchemaError } from '../../enums/enum'
import ErrorHandlingService from '../../errorHandlingService'
import { NON_ENDORSER_DID_PRESENT } from '../../errorMessages'
import { BadRequestError, InternalServerError, NotFoundError } from '../../errors/errors'
import { CreateSchemaSuccessful, SchemaExample } from '../examples'
import { CreateSchemaInput } from '../types'

import { Example, Get, Post, Route, Tags, Security, Path, Body, Controller } from 'tsoa'
@Tags('Schemas')
@Route('/schemas')
@Security('apiKey')
@injectable()
export class SchemaController extends Controller {
  private agent: Agent

  public constructor(agent: Agent) {
    super()
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
  public async getSchemaById(@Path('schemaId') schemaId: string) {
    try {
      const getSchemBySchemaId = await this.agent.modules.anoncreds.getSchema(schemaId)

      if (
        (getSchemBySchemaId &&
          getSchemBySchemaId?.resolutionMetadata &&
          getSchemBySchemaId?.resolutionMetadata?.error === SchemaError.NotFound) ||
        getSchemBySchemaId?.resolutionMetadata?.error === SchemaError.UnSupportedAnonCredsMethod
      ) {
        throw new NotFoundError(getSchemBySchemaId?.resolutionMetadata?.message)
      }

      return getSchemBySchemaId
    } catch (error) {
      throw ErrorHandlingService.handle(error)
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
  @Post('/')
  @Example(CreateSchemaSuccessful)
  public async createSchema(@Body() schema: CreateSchemaInput) {
    try {
      const { issuerId, name, version, attributes } = schema

      const schemaPayload = {
        issuerId,
        name,
        version,
        attrNames: attributes,
      }
      const createSchemaPayload = {
        schema: schemaPayload,
        options: {
          endorserMode: '',
          endorserDid: '',
        },
      }

      if (!schema.endorse) {
        createSchemaPayload.options.endorserMode = EndorserMode.Internal
        createSchemaPayload.options.endorserDid = issuerId
      } else {
        if (!schema.endorserDid) {
          throw new BadRequestError(ENDORSER_DID_NOT_PRESENT)
        }
        createSchemaPayload.options.endorserMode = EndorserMode.External
        createSchemaPayload.options.endorserDid = schema.endorserDid ? schema.endorserDid : ''
      }

      const createSchemaTxResult = await this.agent.modules.anoncreds.registerSchema(createSchemaPayload)

      if (createSchemaTxResult.schemaState.state === CredentialEnum.Failed) {
        throw new InternalServerError('Schema creation failed')
      }

      if (createSchemaTxResult.schemaState.state === CredentialEnum.Wait) {
        this.setStatus(202)
        return createSchemaTxResult
      }

      if (createSchemaTxResult.schemaState.state === CredentialEnum.Action) {
        return createSchemaTxResult
      }

      if (createSchemaTxResult.schemaState.state === CredentialEnum.Finished) {
        const indySchemaId = parseIndySchemaId(createSchemaTxResult.schemaState.schemaId as string)

        const getSchemaUnqualifiedId = await getUnqualifiedSchemaId(
          indySchemaId.namespaceIdentifier,
          indySchemaId.schemaName,
          indySchemaId.schemaVersion
        )

        createSchemaTxResult.schemaState.schemaId = getSchemaUnqualifiedId
      }

      return createSchemaTxResult
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }
}
