import type { AgentType } from '../../types/request'
import type { Version } from '../examples'
// eslint-disable-next-line import/order
import type { IndyVdrDidCreateOptions } from '@aries-framework/indy-vdr'

// eslint-disable-next-line import/no-extraneous-dependencies
import {
  getUnqualifiedCredentialDefinitionId,
  getUnqualifiedSchemaId,
  parseIndyCredentialDefinitionId,
  parseIndySchemaId,
} from '@aries-framework/anoncreds'
// eslint-disable-next-line import/no-extraneous-dependencies
import { AriesFrameworkError } from '@aries-framework/core'
import { Request as Req } from 'express'
import { injectable } from 'tsyringe'

import { CredentialEnum } from '../../enums/enum'
import { DidNymTransaction, EndorserTransaction, WriteTransaction } from '../types'

import { Body, Controller, Post, Res, Route, Tags, TsoaResponse, Security, Request } from 'tsoa'

@Tags('EndorserTransaction')
@Route('/transactions')
// @Security('apiKey')
@Security('jwt')
@injectable()
export class EndorserTransactionController extends Controller {
  @Post('/endorse')
  public async endorserTransaction(
    @Request() request: Req,
    @Body() endorserTransaction: EndorserTransaction,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Res() forbiddenError: TsoaResponse<400, { reason: string }>
  ) {
    try {
      const signedTransaction = await request.agent.modules.indyVdr.endorseTransaction(
        endorserTransaction.transaction,
        endorserTransaction.endorserDid
      )

      return { signedTransaction }
    } catch (error) {
      if (error instanceof AriesFrameworkError) {
        if (error.message.includes('UnauthorizedClientRequest')) {
          return forbiddenError(400, {
            reason: 'this action is not allowed.',
          })
        }
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  @Post('/set-endorser-role')
  public async didNymTransaction(
    @Request() request: Req,
    @Body() didNymTransaction: DidNymTransaction,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const didCreateSubmitResult = await request.agent.dids.create<IndyVdrDidCreateOptions>({
        did: didNymTransaction.did,
        options: {
          endorserMode: 'external',
          endorsedTransaction: {
            nymRequest: didNymTransaction.nymRequest,
          },
        },
      })

      return didCreateSubmitResult
    } catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  @Post('/write')
  public async writeSchemaAndCredDefOnLedger(
    @Request() request: Req,
    @Res() forbiddenError: TsoaResponse<400, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body()
    writeTransaction: WriteTransaction
  ) {
    try {
      if (writeTransaction.schema) {
        const writeSchema = await this.submitSchemaOnLedger(
          writeTransaction.schema,
          request.agent,
          writeTransaction.endorsedTransaction
        )
        return writeSchema
      } else if (writeTransaction.credentialDefinition) {
        const writeCredDef = await this.submitCredDefOnLedger(
          writeTransaction.credentialDefinition,
          request.agent,
          writeTransaction.endorsedTransaction
        )
        return writeCredDef
      } else {
        throw new Error('Please provide valid schema or credential-def!')
      }
    } catch (error) {
      if (error instanceof AriesFrameworkError) {
        if (error.message.includes('UnauthorizedClientRequest')) {
          return forbiddenError(400, {
            reason: 'this action is not allowed.',
          })
        }
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  public async submitSchemaOnLedger(
    schema: {
      issuerId: string
      name: string
      version: Version
      attributes: string[]
    },
    agent: AgentType,
    endorsedTransaction?: string
  ) {
    try {
      const { issuerId, name, version, attributes } = schema
      const { schemaState } = await agent.modules.anoncreds.registerSchema({
        options: {
          endorserMode: 'external',
          endorsedTransaction,
        },
        schema: {
          attrNames: attributes,
          issuerId: issuerId,
          name: name,
          version: version,
        },
      })

      if (!schemaState.schemaId) {
        throw Error('SchemaId not found')
      }

      const indySchemaId = parseIndySchemaId(schemaState.schemaId)
      const getSchemaUnqualifiedId = await getUnqualifiedSchemaId(
        indySchemaId.namespaceIdentifier,
        indySchemaId.schemaName,
        indySchemaId.schemaVersion
      )
      if (schemaState.state === CredentialEnum.Finished || schemaState.state === CredentialEnum.Action) {
        schemaState.schemaId = getSchemaUnqualifiedId
      }
      return schemaState
    } catch (error) {
      return error
    }
  }

  public async submitCredDefOnLedger(
    credentialDefinition: {
      schemaId: string
      issuerId: string
      tag: string
      value: unknown
      type: string
    },
    agent: AgentType,
    endorsedTransaction?: string
  ) {
    try {
      const { credentialDefinitionState } = await agent.modules.anoncreds.registerCredentialDefinition({
        credentialDefinition,
        options: {
          endorserMode: 'external',
          endorsedTransaction: endorsedTransaction,
        },
      })

      if (!credentialDefinitionState.credentialDefinitionId) {
        throw Error('Credential Definition Id not found')
      }

      const indyCredDefId = parseIndyCredentialDefinitionId(credentialDefinitionState.credentialDefinitionId)
      const getCredentialDefinitionId = await getUnqualifiedCredentialDefinitionId(
        indyCredDefId.namespaceIdentifier,
        indyCredDefId.schemaSeqNo,
        indyCredDefId.tag
      )
      if (
        credentialDefinitionState.state === CredentialEnum.Finished ||
        credentialDefinitionState.state === CredentialEnum.Action
      ) {
        credentialDefinitionState.credentialDefinitionId = getCredentialDefinitionId
      }
      return credentialDefinitionState
    } catch (error) {
      return error
    }
  }
}
