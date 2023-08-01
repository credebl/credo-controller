import type { SchemaId } from '../examples'
import type { CredDef } from 'indy-sdk'
import { AnonCredsApi, AnonCredsError, getUnqualifiedCredentialDefinitionId } from '@aries-framework/anoncreds'
// import { error}

// TODO: Chenged IndySdkError to AriesFrameworkError. If approved, the message must be changed too.
import { Agent, AriesFrameworkError } from '@aries-framework/core'
import { Body, Controller, Example, Get, Path, Post, Res, Route, Tags, TsoaResponse } from 'tsoa'
import { injectable } from 'tsyringe'

import { CredentialDefinitionExample, CredentialDefinitionId } from '../examples'
import { IndySdkAnonCredsRegistry } from '@aries-framework/indy-sdk'

@Tags('Credential Definitions')
@Route('/credential-definitions')
@injectable()
export class CredentialDefinitionController extends Controller {
  private agent: Agent
  public constructor(agent: Agent) {
    super()
    this.agent = agent
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
      return await this.agent.modules.anoncreds.getCredentialDefinition(credentialDefinitionId)
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

      const { credentialDefinitionState } = await this.agent.modules.anoncreds.registerCredentialDefinition({
        credentialDefinition: {
          issuerId: credentialDefinitionRequest.issuerId,
          schemaId: credentialDefinitionRequest.schemaId,
          tag: credentialDefinitionRequest.tag
        },
        options: {}
      })

      const indySdkAnonCredsRegistry = new IndySdkAnonCredsRegistry()
      const schemaDetails = await indySdkAnonCredsRegistry.getSchema(this.agent.context, credentialDefinitionRequest.schemaId)
      const getCredentialDefinitionId = await getUnqualifiedCredentialDefinitionId(credentialDefinitionState.credentialDefinition.issuerId, `${schemaDetails.schemaMetadata.indyLedgerSeqNo}`, credentialDefinitionRequest.tag);
      if (credentialDefinitionState.state === 'finished') {
        let credDefId;
        const indyNamespace = getCredentialDefinitionId.split(':')[2];
        if ('bcovrin' === indyNamespace) {
          credDefId = getCredentialDefinitionId.substring('did:indy:bcovrin:'.length);
        } else if ('indicio' === indyNamespace) {
          credDefId = getCredentialDefinitionId.substring('did:indy:indicio:'.length);
        }
        credentialDefinitionState.credentialDefinitionId = credDefId;
      }
      return credentialDefinitionState;
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
