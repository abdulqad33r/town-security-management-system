import { createRouter } from "@/lib/createApp"

import * as h from "./accounts.handlers"
import * as r from "./accounts.routes"

export default createRouter()
  .basePath("/accounts")
  .openapi(r.updateAccountStatus, h.updateAccountStatus)
  .openapi(r.getAccount, h.getAccount)
  .openapi(r.listAccounts, h.listAccounts)
