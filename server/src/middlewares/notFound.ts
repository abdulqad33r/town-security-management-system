import type { NotFoundHandler } from "hono"

import { HttpStatus } from "@/utils/constants/httpStatus"

const notFound: NotFoundHandler = c =>
  c.json(
    { message: `Not Found - ${c.req.path}` },
    HttpStatus.NOT_FOUND
  )

export default notFound
