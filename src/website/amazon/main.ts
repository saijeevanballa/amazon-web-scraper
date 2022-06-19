import { checkAndCreateFolder, writeJsonToFile } from "../../utils/handleFile";
import { getInnerText, getInnerTextUsingXpath, loadPage } from "../../utils/scrapUtils";
import { readFileSync } from "fs"
import { join } from "path";
import store, { getAllState, updateKey } from "../../store/state";
import { logState } from "../../utils/logger";
let last_used_title_xpath = "";

export async function initiateAmazon(browser: any) {
  checkAndCreateFolder(join(__dirname, "..", "..", "..", store.BASE_FOLDER, "AMAZON"));
  for (let category of store.categories) {
    let state = getAllState()
    if (!state.amazon.intial_screening.category.includes(category)) {
      logState(category.CATEGORY)
      checkAndCreateFolder(join(__dirname, "..", "..", "..", store.BASE_FOLDER, "AMAZON", category.CATEGORY.split(" ").join("_")))
      for (let subCategory of category.SUB_CATEGORY) {
        if (!state.amazon.intial_screening.subCategory.includes(subCategory)) {
          logState(subCategory)
          let SUB_CATEGORY_FOLDER = join(__dirname, "..", "..", "..", store.BASE_FOLDER, "AMAZON", category.CATEGORY.split(" ").join("_"), subCategory.split(" ").join("_"));
          checkAndCreateFolder(SUB_CATEGORY_FOLDER);
          let page = await loadPage(browser, store.links.AMAZON(subCategory));
          let [pageCount]: any = await getPageCount(page);
          await page.close();
          try {
            await loopProductPagesItems(browser, subCategory, Number(pageCount), SUB_CATEGORY_FOLDER);
          } catch (error) {
            console.log(error);
          }
          if (!state.amazon.intial_screening.subCategory.includes(subCategory)) {
            state = updateKey("amazon.intial_screening.subCategory", [...state.amazon.intial_screening.subCategory, subCategory])
            updateKey("amazon.intial_screening.folders", [...state.amazon.intial_screening.folders, SUB_CATEGORY_FOLDER])
          }
          logState("DONE - " + subCategory)
        }
      }
      if (!state.amazon.intial_screening.category.includes(category.CATEGORY)) state = updateKey("amazon.intial_screening.category", [...state.amazon.intial_screening.category, category.CATEGORY])
      logState("DONE - " + category.CATEGORY)
    }
  }
  updateKey("amazon.intial_screening.status", true)
  logState("DONE - AMAZON INTIAL SCREENING")
}

async function loopProductPagesItems(browser: any, subCategory: string, pageCount: number, folderPath: string) {
  let PRODUCTS_DATA: any = [];
  try {
    for (let i = 1; i <= pageCount; i++) {
      let page = await loadPage(browser, store.links.AMAZON(subCategory, i));
      let products: any = await getMainPageProductsData(page);
      PRODUCTS_DATA = [...PRODUCTS_DATA, ...products];
      await page.close();
    }
  } catch (error) {
    console.log(error);
  } finally {
    logState(` TOTAL ${subCategory} DATA : ${PRODUCTS_DATA.length} `)
    writeJsonToFile(join(folderPath, "products.json"), PRODUCTS_DATA);
  }
}

async function getMainPageProductsData(page: any) {
  try {
    let title_xpath = await findTitleXpath(page);
    let products = await page.$x(title_xpath);
    let GrandParents = await Promise.all(products.map((handle: any) => handle.getProperty("parentNode")));
    let titles = await getInnerText(GrandParents, "innerText");
    let href = await getInnerText(GrandParents, "href");
    let P1 = await Promise.all(GrandParents.map((handle: any) => handle.getProperty("parentNode")));
    let P2 = await Promise.all(P1.map((handle: any) => handle.getProperty("parentNode")));
    let P3 = await Promise.all(P2.map((handle: any) => handle.getProperty("parentNode")));
    let price_data = await Promise.all(P3.map((handle: any) => handle.$("span.a-price>span>span.a-price-whole")));
    let prices = await getInnerText(price_data, "innerText");
    return titles.map((title: string, index: number) => {
      return {
        title,
        price: prices[index],
        href: href[index],
      };
    });
  } catch (error) {
    console.log(error);
  }
}

async function getPageCount(page: any) {
  try {
    let pageCountXpath = `(//span[@class='s-pagination-item s-pagination-disabled'])[1]`;
    await page.waitForXPath(pageCountXpath);
    let count = await page.$x(pageCountXpath);
    return await getInnerText(count, "innerText");
  } catch (error) {
    console.log(error);
    return [1]
  }
}

async function findTitleXpath(page: any) {
  try {
    let title_xpath = [
      `//div[2]/div/div/div/div/div/div/div/div/div/div/h2/a/span`,
      `//div[2]/div/div/div/div/div/div/div/h2/a/span`,];
    if (last_used_title_xpath) {
      try {
        return await checkXpath(page, last_used_title_xpath);
      } catch (error) {
      }
    }

    for (let xpath of title_xpath) {
      try {
        return await checkXpath(page, xpath);
      } catch (error) {
      }
    }

    throw new Error("Title not found");
  } catch (error) {
    console.log(error);
  }
}

async function checkXpath(page: any, xpath: string) {
  await page.waitForXPath(xpath);
  let title = await page.$x(xpath);
  if (title.length > 0) {
    last_used_title_xpath = xpath;
    return xpath;
  }
}

export async function productScreeing(browser: any) {
  try {
    let state = getAllState()
    for (let category of store.categories) {
      logState(category.CATEGORY)
      for (let subCategory of category.SUB_CATEGORY) {
        logState(subCategory)
        let SUB_CATEGORY_FOLDER = join(__dirname, "..", "..", "..", store.BASE_FOLDER, "AMAZON", category.CATEGORY.split(" ").join("_"), subCategory.split(" ").join("_"));
        let ProductsData = JSON.parse(readFileSync(join(SUB_CATEGORY_FOLDER, "products.json"), "utf8"));
        await loopProdutsData(browser, ProductsData, category.CATEGORY, subCategory)
        logState("DONE - " + subCategory)
      }
      logState("DONE - " + category.CATEGORY)
    }
    logState("DONE - AMAZON INTIAL SCREENING")
  } catch (error) { }
}

async function loopProdutsData(browser: any, products: any, category: string, subCategory: string) {
  try {

    for (let product of products) {
      let page = await loadPage(browser, product.href)
      await getProductDetails(page)
    }

  } catch (error) {
    console.log(error)
  }
}


async function getProductDetails(page: any) {
  let product_data: any = {};
  const TITLE_XPATH = `/html[1]/body[1]/div[2]/div[2]/div[5]/div[4]/div[4]/div[1]/div[1]/h1[1]/span[1]`;
  const OFFER_PRICE = `/html[1]/body[1]/div[2]/div[2]/div[5]/div[4]/div[4]/div[10]/div[1]/div[1]/span[2]/span[2]/span[2]`
  const ORIGINAL_PRICE = `/html[1]/body[1]/div[2]/div[2]/div[5]/div[4]/div[4]/div[10]/div[1]/div[2]/span[1]/span[1]/span[1]/span[2]`
  const PHOTOS_LIST = `/html[1]/body[1]/div[2]/div[2]/div[5]/div[4]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]/ul[1]`
  const PRODUCTS_LIST = `/html[1]/body[1]/div[2]/div[2]/div[5]/div[4]/div[4]/div[34]/div[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/ul[1]`
  const PRODUCT_DETAILS_TABLE = `/html[1]/body[1]/div[2]/div[2]/div[5]/div[4]/div[4]/div[43]/div[1]/table[1]`
  const PRODUCT_FEATURES = `/html[1]/body[1]/div[2]/div[2]/div[5]/div[4]/div[4]/div[44]/div[1]`
  const PRODUCT_TECHNICAL_DETAILS_TABLE = `/html[1]/body[1]/div[2]/div[2]/div[5]/div[20]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]`;
  const PRODUCT_ADITIONAL_DETAILS_TABLE = `/html[1]/body[1]/div[2]/div[2]/div[5]/div[20]/div[1]/div[1]/div[1]/div[1]/div[1]/div[2]/div[1]/div[1]`;

  product_data.title = await getInnerTextUsingXpath(page, TITLE_XPATH)
  product_data.offer_price = await getInnerTextUsingXpath(page, OFFER_PRICE)
  product_data.original_price = await getInnerTextUsingXpath(page, ORIGINAL_PRICE);

  console.log(product_data)



  //  get tittle
  //  get price
  //  check models
  // specs
  //  tech spec
}