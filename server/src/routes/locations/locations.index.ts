import { createRouter } from "@/lib/createApp"

import * as zonesH from "./zones/zones.handlers"
import * as zonesR from "./zones/zones.routes"

export default createRouter()
  .basePath("/locations")
  .openapi(zonesR.addZone, zonesH.addZone)
