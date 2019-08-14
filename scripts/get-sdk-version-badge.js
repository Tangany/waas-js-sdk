const
	fileName = "sdk-badge.svg"
	, createBadge = require("./badge")
;

// downloads a version badge to destination directory after `npm version` for current branches master and development
createBadge("WaaS API", "1.2", fileName, "orange");
