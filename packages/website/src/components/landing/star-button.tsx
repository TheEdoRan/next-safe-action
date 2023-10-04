import React from "react";

export default function StarButton({
	width,
	height,
}: {
	width: string;
	height: string;
}) {
	return (
		<iframe
			src="https://ghbtns.com/github-btn.html?user=TheEdoRan&repo=next-safe-action&type=star&count=true&size=large"
			width={width}
			height={height}
			title="GitHub"></iframe>
	);
}
