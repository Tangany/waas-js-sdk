const
	fileName = "sdk-badge.svg"
	, createBadge = require("./badge")
	, axios = require("axios")
;
(async function () {
	const { data: oas } = await axios.get("https://tangany.docs.stoplight.io/api/api.tangany.com.oas2.json");
	const version = oas.info.version;
	if (!version) {
		console.error(oas);
		throw new Error("Couldn't parse version for oas definition");
	}

	// downloads a version badge to destination directory after `npm version` for current branches master and development
	createBadge("WaaS API", version, fileName, "orange");
})();

