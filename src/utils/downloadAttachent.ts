import fs from "fs-extra";
import client from "https";

export default function downloadAttachment(
  url: string,
  path: string
): Promise<any> {
  return new Promise((res, rej) => {
    client.get(url, (response: any) => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        var fileStream = fs.createWriteStream(path);
        fileStream.on("error", () =>
          rej({ status: false, msg: "Error while downloading" })
        );
        fileStream.on("close", () => res({ status: true, msg: "Downloaded" }));
        response.pipe(fileStream);
      } else if (response.headers.location) {
        res(downloadAttachment(response.headers.location, path));
      } else {
        rej(response.statusCode + " " + response.statusMessage);
      }
    });
  });
}
