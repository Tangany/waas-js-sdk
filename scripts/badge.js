const
	path = require("path")
	, fs = require("fs")
	, axios = require("axios")
;

/**
 * creates and writes a badge to fs
 * @param label - badge label
 * @param version - badge semver
 * @param fileName - file name inside "docs" folder
 */
module.exports = (label, version, fileName, color = "blue") => {
	
	const url = `https://img.shields.io/static/v1.svg?label=${label}&message=${version}&color=${color}&style=flat-square`;
	const destination = path.resolve(__dirname, "..", "docs", fileName);
	const writeStream = fs.createWriteStream(destination);

// downloads a  badge to destination directory
	axios({
		method: "get",
		url,
		responseType: "stream"
	})
		.then(res => {
			res.data.pipe(writeStream)
				.on("done", () => {
					console.log("Downloaded badge to filesystem", url);
					process.exitCode = 0;
				})
				.on("error", e => {
					console.error(e);
					process.exitCode = 100;
				});
		})
	;
};
