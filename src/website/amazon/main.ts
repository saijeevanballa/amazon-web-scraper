import store from "../../store/store";
import { checkAndCreateFolder, writeJsonToFile } from "../../utils/handleFile";
import { getInnerText, loadPage } from "../../utils/scrapUtils";
import { join } from "path";
let last_used_title_xpath = "";

export async function initiateAmazon(browser: any) {
  checkAndCreateFolder(join(__dirname, "..", "..", "..", store.BASE_FOLDER, "AMAZON"));
  for (let category of store.categories) {
    for (let subCategory of category.SUB_CATEGORY) {
      let SUB_CATEGORY_FOLDER = join(__dirname, "..", "..", "..", store.BASE_FOLDER, "AMAZON", subCategory.split(" ").join("_"));
      checkAndCreateFolder(SUB_CATEGORY_FOLDER);
      let page = await loadPage(browser, store.links.AMAZON(subCategory));
      let [pageCount]: any = await getPageCount(page);
      await page.close();
      try {
        await loopProductPagesItems(browser, subCategory, Number(pageCount), SUB_CATEGORY_FOLDER);
      } catch (error) {
        console.log(error);
      }
    }
  }
}

async function loopProductPagesItems(browser: any, subCategory: string, pageCount: number, folderPath: string) {
  let PRODUCTS_DATA: any = [];
  try {
    for (let i = 1; i <= Number(pageCount); i++) {
      let page = await loadPage(browser, store.links.AMAZON(subCategory, i));
      let products: any = await getMainPageProductsData(page);
      PRODUCTS_DATA = [...PRODUCTS_DATA, ...products];
      await page.close();
    }
  } catch (error) {
    console.log(error);
  } finally {
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
  }
}

async function findTitleXpath(page: any) {
  try {
    let title_xpath = [`//div[2]/div/div/div/div/div/div/div/div/div/div/h2/a/span`, `//div[2]/div/div/div/div/div/div/div/h2/a/span`];
    if (last_used_title_xpath) {
      try {
        return await checkXpath(page, last_used_title_xpath);
      } catch (error) {
        console.log(error);
      }
    }

    for (let xpath of title_xpath) {
      try {
        return await checkXpath(page, xpath);
      } catch (error) {
        console.log(error);
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
