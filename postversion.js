const
    path = require("path")
    , fs = require("fs")
    , fileName = "package-badge.svg"
    , destination = path.resolve(__dirname, "docs", fileName)
    , { version } = require("./package")
    , axios = require("axios")
    , url = `https://img.shields.io/static/v1.svg?label=npm&message=${version}&color=blue&style=flat-square`
;

const writeStream = fs.createWriteStream(destination);

// downloads a version badge to destination directory after `npm version` for current branches master and development
axios({
    method: "get",
    url,
    responseType: "stream"
})
    .then(res => {
        res.data.pipe(writeStream)
            .on("done", () => {
                console.log("Downloaded badge to filesystem", badgeUrl);
                process.exitCode = 0;
            })
            .on("error", e => {
                console.error(e);
                process.exitCode = 100;
            });
    })

;
