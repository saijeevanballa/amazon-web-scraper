import puppeteer from "puppeteer";
import { logState } from "./utils/logger";
import { initiateAmazon } from "./website/amazon/main";
import { checkAndCreateFolder } from "./utils/handleFile";
import { join } from "path";
import store, { getAllState } from "./store/state";

// Creating Base Folder
checkAndCreateFolder(join(__dirname, "..", store.BASE_FOLDER));

// STARTING POINT
(async () => {
  // Creating Browser Instance
  try {
    const browser = await puppeteer.launch({
      headless: false,
      ignoreHTTPSErrors: true,
      // args: ["--window-size=1920,1080"],
      args: [`--window-size=1920,1080`],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });
    let websites = Object.keys(store.links);
    let state = getAllState()
    for (let website of websites) {
      logState(website);
      switch (website) {
        case "AMAZON":
          if(!state.amazon.intial_screening.status){
            await initiateAmazon(browser);
          } else {
            //  product screening
          }
          break;

        default:
          break;
      }
    }
    await browser.close();
  } catch (error) {
    console.log(error);
  }
})().catch(console.error);
