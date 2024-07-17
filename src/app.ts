
import express, { Express, Request, Response } from "express";

import { runParsers } from "./utils/parsers";
import Fighter from "./model/fighterModel";
import Event from "./model/eventModel";
import { UFC_NAMES_URL, UFC_EVENTS_URL, INTERVAL_DURATION } from "./config";


const app: Express = express();

// run parsers and write data to database
 (async ()=>{
  await runParsers(UFC_NAMES_URL, UFC_EVENTS_URL)
  
  setInterval(async()=>{
    await Event.deleteMany({})
    await Fighter.deleteMany({})
    await runParsers(UFC_NAMES_URL, UFC_EVENTS_URL)
  }
    , INTERVAL_DURATION) 
})();



app.get("/", (req: Request, res: Response) => {
  res.send("response");
});


export default app