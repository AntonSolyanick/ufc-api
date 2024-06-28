import express, { Express, Request, Response } from "express";
import puppeteer from "puppeteer";

const app: Express = express();
const port = 3000;

const parser = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.goto("https://www.ufc.com/athlete/israel-adesanya");
  await page.waitForNavigation();

  await page.evaluate(() => {
    const nextFightContainerHTML = document.querySelector(
      ".c-card-event--upcoming"
    );

    const firstFighter = nextFightContainerHTML
      ?.querySelector(".c-card-event--athlete-fight__headline")
      ?.innerText.split("VS")[0];

    const secondFighter = nextFightContainerHTML
      ?.querySelector(".c-card-event--athlete-fight__headline")
      ?.innerText.split("VS")[1];

    const fightDate = nextFightContainerHTML?.querySelector(
      ".c-card-event--athlete-fight__date"
    )?.textContent;

    const nextFightInfo = {
      firstFighter,
      secondFighter,
      fightDate,
    };

    console.log(nextFightInfo);
  });
};

parser();

app.get("/", (req: Request, res: Response) => {
  res.send("response");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
