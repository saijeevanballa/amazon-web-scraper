import fs from "fs";

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
