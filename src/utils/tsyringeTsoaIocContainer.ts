import type { IocContainer } from '@tsoa/runtime'

import { container } from 'tsyringe'

export const iocContainer: IocContainer = {
  get: <T>(controller: Parameters<IocContainer['get']>[0]): T | Promise<T> => {
    return container.resolve<T>(controller as any)
  },
}
