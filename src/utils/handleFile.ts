import fs from "fs";
import { join } from "path";
import store from "../store/state";
import { createExcel } from "./excel";
import { logState } from "./logger";

export function checkAndCreateFolder(path: string) {
  if (!fs.existsSync(path)) {
    console.log(`Creating folder: ${path}`);
    fs.mkdirSync(path);
  }
}

export function writeJsonToFile(path: string, data: any) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), function (err: any) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  } as any);
}

export async function generateProductList(productPaths: any) {
  try {
    let FILES_FOLDER = join(__dirname, "..", "..", store.BASE_FOLDER, "FILES")
    checkAndCreateFolder(FILES_FOLDER)
    let data: any = []
    for (let path of productPaths) {
      let fileData = JSON.parse(fs.readFileSync(join(path, "products.json"), "utf-8"))
      data = [...data, ...fileData]
    }
    logState(`creating ${data.length} records ecxel`)
    createExcel({
      page: "products",
      headers: [
        { header: 'PRODUCT NAME', key: 'title', width: 32 },
        { header: 'PRICE', key: 'price', width: 24, },
        { header: 'LINK', key: 'href', width: 32, },
      ],
      rows: data,
      filePath: join(__dirname, "..", "..", store.BASE_FOLDER, "FILES", "products.xlsx")
    })
  } catch (error) {
    console.log("generateProductList", error)
  }
}
