import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

import categories from "../../categories.json";

let store = {
  BASE_FOLDER: "PRODUCTS_DATA",
  links: {
    AMAZON: (category: string, pageNumber: number = 1) => `https://www.amazon.in/s?k=${category}&page=${pageNumber}`,
  },
  categories: categories,
  data: {},
};

const DATA_FILE_PATH = join(__dirname, "data.json")

export function getAllState() {
    let data = readFileSync(DATA_FILE_PATH, "utf8");
    return JSON.parse(data)
}

export function getKeyData(key: string) {
    let data = JSON.parse(readFileSync(DATA_FILE_PATH, "utf8"));
    return key.split(".").reduce((main, curr) => main[curr], data)
}

export function updateKey(key: string, value: any) {
    let schema = JSON.parse(readFileSync(DATA_FILE_PATH, "utf8"));
    schema = setDeep(schema, key, value)
    writeFileSync(DATA_FILE_PATH, JSON.stringify(schema, null, 2), "utf8")
    return schema
}

function setDeep(obj: any, path: string, value: any) {
    const pList = path.split('.');
    const key: any = pList.pop();
    const pointer: any = pList.reduce((accumulator, currentValue) => {
        if (accumulator[currentValue] === undefined) accumulator[currentValue] = {};
        return accumulator[currentValue];
    }, obj);
    pointer[key] = value;
    return obj;
}

export default store;
