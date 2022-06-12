import request from "request";
import fs from "fs";

export function download(uri: string, filename: string) {
  return new Promise((resolve, reject) => {
    request.head(uri, function (err, res, body) {
      request(uri).pipe(fs.createWriteStream(filename)).on("close", resolve);
    });
  });
}
