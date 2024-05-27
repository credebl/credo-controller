import { AnonCredsError, getUnqualifiedSchemaId, parseIndySchemaId } from '@credo-ts/anoncreds'
import { Agent } from '@credo-ts/core'
import { injectable } from 'tsyringe'

import { CredentialEnum, EndorserMode, SchemaError } from '../../enums/enum'
import { NON_ENDORSER_DID_PRESENT } from '../../errorMessages'
import { BadRequestError, InternalServerError, NotFoundError } from '../../errors/errors'
import convertError from '../../utils/errorConverter'
import { SchemaExample } from '../examples'
import { CreateSchemaInput } from '../types'

import { Example, Get, Post, Route, Tags, Security, Path, Body } from 'tsoa'
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
      if (error instanceof AnonCredsError) {
        if (error.message === 'IndyError(LedgerNotFound): LedgerNotFound') {
          throw new NotFoundError('Ledger not found')
        } else if (error.cause instanceof AnonCredsError) {
          if (typeof error.cause.cause === 'string') {
            switch (error.cause.cause) {
              case 'LedgerInvalidTransaction':
                throw new BadRequestError('Ledger invalid transaction')
              case 'CommonInvalidStructure':
                throw new BadRequestError('Common invalid structure')
            }
          }
        }
      }
      if (error instanceof Error) {
        throw convertError(error.constructor.name, error.message)
      } else {
        throw new InternalServerError(`An unknown error occurred ${error}`)
      }
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
  public async createSchema(@Body() schema: CreateSchemaInput) {
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
          throw new InternalServerError(schemaState.reason)
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
          throw new BadRequestError(NON_ENDORSER_DID_PRESENT)
        }

        const createSchemaTxResult = await this.agent.modules.anoncreds.registerSchema({
          options: {
            endorserMode: EndorserMode.External,
            endorserDid: schema.endorserDid ? schema.endorserDid : '',
          },
          schema: schemaPayload,
        })

        if (createSchemaTxResult.state === CredentialEnum.Failed) {
          throw new InternalServerError(createSchemaTxResult.reason)
        }

        return createSchemaTxResult
      }
    } catch (error) {
      if (error instanceof AnonCredsError) {
        if (error.message === 'IndyError(LedgerNotFound): LedgerNotFound') {
          throw new NotFoundError('Ledger not found')
        } else if (error.cause instanceof AnonCredsError) {
          if (typeof error.cause.cause === 'string') {
            switch (error.cause.cause) {
              case 'LedgerInvalidTransaction':
                throw new BadRequestError('Ledger invalid transaction')
              case 'CommonInvalidStructure':
                throw new BadRequestError('Common invalid structure')
            }
          }
        }
      }
      if (error instanceof Error) {
        throw convertError(error.constructor.name, error.message)
      } else {
        throw new InternalServerError(`An unknown error occurred ${error}`)
      }
    }
  }
}
