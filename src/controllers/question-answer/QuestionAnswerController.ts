import type { ValidResponse } from '@aries-framework/question-answer'

// eslint-disable-next-line import/no-extraneous-dependencies
import { RecordNotFoundError } from '@aries-framework/core'
// eslint-disable-next-line import/no-extraneous-dependencies
import { QuestionAnswerRole, QuestionAnswerState } from '@aries-framework/question-answer'
import { Request as Req } from 'express'
import { injectable } from 'tsyringe'

import { RecordId } from '../examples'

import { Body, Controller, Get, Path, Post, Res, Route, Tags, TsoaResponse, Query, Security, Request } from 'tsoa'

@Tags('Question Answer')
@Route('/question-answer')
// @Security('apiKey')
@Security('jwt')
@injectable()
export class QuestionAnswerController extends Controller {
  /**
   * Retrieve question and answer records by query
   *
   * @param connectionId Connection identifier
   * @param role Role of the question
   * @param state State of the question
   * @param threadId Thread identifier
   * @returns QuestionAnswerRecord[]
   */
  @Get('/')
  public async getQuestionAnswerRecords(
    @Request() request: Req,
    @Query('connectionId') connectionId?: string,
    @Query('role') role?: QuestionAnswerRole,
    @Query('state') state?: QuestionAnswerState,
    @Query('threadId') threadId?: string
  ) {
    const questionAnswerRecords = await request.agent.modules.questionAnswer.findAllByQuery({
      connectionId,
      role,
      state,
      threadId,
    })
    return questionAnswerRecords.map((record) => record.toJSON())
  }

  /**
   * Send a question to a connection
   *
   * @param connectionId Connection identifier
   * @param content The content of the message
   */
  @Post('question/:connectionId')
  public async sendQuestion(
    @Request() request: Req,
    @Path('connectionId') connectionId: RecordId,
    @Body()
    config: {
      question: string
      validResponses: ValidResponse[]
      detail?: string
    },
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const { question, validResponses, detail } = config

      const record = await request.agent.modules.questionAnswer.sendQuestion(connectionId, {
        question,
        validResponses,
        detail,
      })

      return record.toJSON()
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, { reason: `connection with connection id "${connectionId}" not found.` })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Send a answer to question
   *
   * @param id The id of the question answer record
   * @param response The response of the question
   */
  @Post('answer/:id')
  public async sendAnswer(
    @Request() request: Req,
    @Path('id') id: RecordId,
    @Body() requestBody: Record<'response', string>,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const record = await request.agent.modules.questionAnswer.sendAnswer(id, requestBody.response)
      return record.toJSON()
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, { reason: `record with id "${id}" not found.` })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Retrieve question answer record by id
   * @param connectionId Connection identifier
   * @returns ConnectionRecord
   */
  @Get('/:id')
  public async getQuestionAnswerRecordById(
    @Request() request: Req,
    @Path('id') id: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>
  ) {
    const record = await request.agent.modules.questionAnswer.findById(id)

    if (!record)
      return notFoundError(404, {
        reason: `Question Answer Record with id "${id}" not found.`,
      })

    return record.toJSON()
  }
}
