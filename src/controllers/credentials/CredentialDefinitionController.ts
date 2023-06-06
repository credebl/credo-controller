import type { SchemaId } from '../examples'
import type { CredDef } from 'indy-sdk'
import { AnonCredsApi, AnonCredsError, } from '@aries-framework/anoncreds'
// import { error}

// TODO: Chenged IndySdkError to AriesFrameworkError. If approved, the message must be changed too.
import { Agent, AriesFrameworkError } from '@aries-framework/core'
import { Body, Controller, Example, Get, Path, Post, Res, Route, Tags, TsoaResponse } from 'tsoa'
import { injectable } from 'tsyringe'

import { CredentialDefinitionExample, CredentialDefinitionId } from '../examples'

@Tags('Credential Definitions')
@Route('/credential-definitions')
@injectable()
export class CredentialDefinitionController extends Controller {
  private agent: Agent
  private anonCredsCredentialDefinition: AnonCredsApi

  public constructor(agent: Agent, anonCredsCredentialDefinition: AnonCredsApi) {
    super()
    this.agent = agent
    this.anonCredsCredentialDefinition = anonCredsCredentialDefinition
  }

  /**
   * Retrieve credential definition by credential definition id
   *
   * @param credentialDefinitionId
   * @returns CredDef
   */
  @Example<CredDef>(CredentialDefinitionExample)
  @Get('/:credentialDefinitionId')
  public async getCredentialDefinitionById(
    @Path('credentialDefinitionId') credentialDefinitionId: CredentialDefinitionId,
    @Res() badRequestError: TsoaResponse<400, { reason: string }>,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      return await this.anonCredsCredentialDefinition.getCredentialDefinition(credentialDefinitionId)
    } catch (error) {
      if (error instanceof AriesFrameworkError && error.message === 'IndyError(LedgerNotFound): LedgerNotFound') {
        return notFoundError(404, {
          reason: `credential definition with credentialDefinitionId "${credentialDefinitionId}" not found.`,
        })
      } else if (error instanceof AnonCredsError && error.cause instanceof AriesFrameworkError) {
        if (error.cause.cause, 'CommonInvalidStructure') {
          return badRequestError(400, {
            reason: `credentialDefinitionId "${credentialDefinitionId}" has invalid structure.`,
          })
        }
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Creates a new credential definition.
   *
   * @param credentialDefinitionRequest
   * @returns CredDef
   */
  @Example<CredDef>(CredentialDefinitionExample)
  @Post('/')
  public async createCredentialDefinition(
    @Body()
    credentialDefinitionRequest: {
      issuerId: string
      schemaId: SchemaId
      tag: string
    },
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const schema = await this.anonCredsCredentialDefinition.getSchema(credentialDefinitionRequest.schemaId);

      return await this.anonCredsCredentialDefinition.registerCredentialDefinition({
        credentialDefinition: {
          issuerId: credentialDefinitionRequest.issuerId,
          schemaId: credentialDefinitionRequest.schemaId,
          tag: credentialDefinitionRequest.tag
        },
        options: {}
      })
    } catch (error) {
      if (error instanceof notFoundError) {
        return notFoundError(404, {
          reason: `schema with schemaId "${credentialDefinitionRequest.schemaId}" not found.`,
        })
      }

      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }
}
function isIndyError(cause: Error | undefined, arg1: string) {
  throw new Error('Function not implemented.')
}

