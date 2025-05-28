/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ILogObj } from 'tslog'

import { LogLevel, BaseLogger } from '@credo-ts/core'
import { appendFileSync } from 'fs'
import { Logger } from 'tslog'

function logToTransport(logObject: ILogObj) {
  appendFileSync('logs.txt', JSON.stringify(logObject) + '\n')
}

export class TsLogger extends BaseLogger {
  private logger: Logger<any>

  // Map our log levels to tslog numeric levels
  private tsLogLevelMap = {
    [LogLevel.test]: 0,
    [LogLevel.trace]: 1,
    [LogLevel.debug]: 2,
    [LogLevel.info]: 3,
    [LogLevel.warn]: 4,
    [LogLevel.error]: 5,
    [LogLevel.fatal]: 6,
  } as const
// TODO: Add support for LogLevel.off.
  public constructor(logLevel: LogLevel, name?: string) {
    super(logLevel)

    this.logger = new Logger({
      minLevel: this.logLevel === LogLevel.off ? 6 : this.tsLogLevelMap[this.logLevel as Exclude<LogLevel, LogLevel.off>],
      attachedTransports: [
        (logObject: ILogObj) => {
          logToTransport(logObject)
        },
      ],
    })
  }

  private log(level: Exclude<LogLevel, LogLevel.off>, message: string, data?: Record<string, any>): void {
    switch (level) {
      case LogLevel.test:
        data ? this.logger.silly(message, data) : this.logger.silly(message)
        break
      case LogLevel.trace:
        data ? this.logger.trace(message, data) : this.logger.trace(message)
        break
      case LogLevel.debug:
        data ? this.logger.debug(message, data) : this.logger.debug(message)
        break
      case LogLevel.info:
        data ? this.logger.info(message, data) : this.logger.info(message)
        break
      case LogLevel.warn:
        data ? this.logger.warn(message, data) : this.logger.warn(message)
        break
      case LogLevel.error:
        data ? this.logger.error(message, data) : this.logger.error(message)
        break
      case LogLevel.fatal:
        data ? this.logger.fatal(message, data) : this.logger.fatal(message)
        break
    }
  }

  public test(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.test, message, data)
  }

  public trace(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.trace, message, data)
  }

  public debug(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.debug, message, data)
  }

  public info(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.info, message, data)
  }

  public warn(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.warn, message, data)
  }

  public error(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.error, message, data)
  }

  public fatal(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.fatal, message, data)
  }
}
