import { HttpStatus } from "@/constants/httpStatus"
import { success } from "@/lib/success"
import type { AppRouteHandler } from "@/lib/types"
import * as accountsService from "@/services/accounts.service"

import type {
  GetAccountRoute,
  ListAccounts,
  UpdateAccountStatusRoute,
} from "./accounts.routes"

export const updateAccountStatus: AppRouteHandler<
  UpdateAccountStatusRoute
> = async c => {
  const result = await accountsService.updateAccountStatus(
    c.req.valid("param").id,
    c.req.valid("json").approvalStatus
  )

  return c.json(success(result), HttpStatus.OK)
}

export const getAccount: AppRouteHandler<GetAccountRoute> = async c => {
  const result = await accountsService.getAccount(c.req.valid("param").id)

  return c.json(success(result), HttpStatus.OK)
}

export const listAccounts: AppRouteHandler<ListAccounts> = async c => {
  const result = await accountsService.listAccounts(c.req.valid("query"))

  return c.json(success(result), HttpStatus.OK)
}
