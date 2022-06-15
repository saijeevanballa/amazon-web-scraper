// time in millie sec
export function delay(time: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

// const elementHandles = await page.$$('.hover_blue_link.name.gaclick');
// const hrefElements = await getInnerText(elementHandles, 'href');
export async function getInnerText(elementHandles: any, property: string) {
  if (elementHandles.length === 0) return [];
  const PropertyJsHandles = await Promise.all(elementHandles.map((handle: any) => (handle && handle.getProperty(property)) || Promise.resolve(null)));
  return await Promise.all(PropertyJsHandles.map((handle) => (handle && handle.jsonValue()) || Promise.resolve(null)));
}

// example: await page.waitForSelector('.listing-btns4');
export async function scrollDownWithSelector(page: any, selector: string) {
  await page.waitForSelector(selector);
  await page.$eval(selector, (e: any) => {
    e.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" });
  });
}

export async function autoScroll(page: any) {
  try {
    return await page.evaluate(async () => {
      return await new Promise((resolve, reject) => {
        var totalHeight = 0;
        var distance = 100;
        var timer = setInterval(() => {
          var scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve(true);
          }
        }, 1000);
      }).catch((error) => {
        console.log(error);
      });
    });
  } catch (error) {
    console.log("error");
  }
}

export async function loadPage(browser: any, page_url: string) {
  const page = await browser.newPage();
  try {
    await page.goto(page_url);
    await page.setDefaultNavigationTimeout(120000);
    // await page.setViewport({ width: 1366, height: 768 });
    return page;
  } catch (error) {
    await page.close();
  }
}

export async function checkXpath(page: any, xpath: string) {
  await page.waitForXPath(xpath);
  let title = await page.$x(xpath);
  if (title.length > 0) {
    return xpath;
  }
}

async function getInnerTextUsingXpath(page: any, xpath: string) {
  try {
    await page.waitForXPath(xpath);
    let el = await page.$x(xpath);
    return await getInnerText(el, "innerText");
  } catch (error) {
    console.log(error);
    return [1]
  }
}
