const
	fileName = "package-badge.svg"
	, { version } = require("../package")
	, createBadge = require("./badge")
;

// downloads a version badge to destination directory after `npm version` for current branches master and development
createBadge("npm", version, fileName);
