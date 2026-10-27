const GISCUS_ORIGIN = "https://giscus.app";
const CONTAINER_ID = "giscus-container";

function getContainer(): HTMLElement | null {
	return document.getElementById(CONTAINER_ID);
}

function getGiscusTheme(container: HTMLElement): string {
	const isDark = document.documentElement.classList.contains("dark");
	const { themeLight, themeDark } = container.dataset;
	return (isDark ? themeDark : themeLight) || (isDark ? "dark" : "light");
}

/**
 * Injects the giscus client script into the comments container.
 * Safe to call multiple times: it does nothing if giscus is already mounted
 * or if the current page has no comments container.
 */
function mountGiscus(): void {
	const container = getContainer();
	if (!container || container.childElementCount > 0) {
		return;
	}

	const d = container.dataset;
	const script = document.createElement("script");
	script.src = `${GISCUS_ORIGIN}/client.js`;
	script.async = true;
	script.crossOrigin = "anonymous";

	const attrs: Record<string, string | undefined> = {
		"data-repo": d.repo,
		"data-repo-id": d.repoId,
		"data-category": d.category,
		"data-category-id": d.categoryId,
		"data-mapping": d.mapping,
		"data-term": d.term,
		"data-strict": d.strict,
		"data-reactions-enabled": d.reactionsEnabled,
		"data-emit-metadata": "0",
		"data-input-position": d.inputPosition,
		"data-theme": getGiscusTheme(container),
		"data-lang": d.lang,
		"data-loading": d.loading,
	};
	for (const [name, value] of Object.entries(attrs)) {
		if (value !== undefined) {
			script.setAttribute(name, value);
		}
	}

	container.appendChild(script);
}

/** Pushes the current site theme to an already rendered giscus iframe. */
function syncGiscusTheme(): void {
	const container = getContainer();
	const frame = document.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
	if (!container || !frame?.contentWindow) {
		return;
	}
	frame.contentWindow.postMessage(
		{ giscus: { setConfig: { theme: getGiscusTheme(container) } } },
		GISCUS_ORIGIN,
	);
}

/**
 * Call once per full page load (from Layout.astro).
 * - mounts giscus on the current page
 * - re-mounts it after every Swup navigation (the <main> content is replaced)
 * - keeps the giscus theme in sync with the site's light/dark switch
 */
export function initGiscus(): void {
	mountGiscus();

	// The site toggles the `dark` class on <html>
	new MutationObserver(syncGiscusTheme).observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});

	const setup = () => {
		window.swup.hooks.on("page:view", mountGiscus);
	};
	if (window.swup?.hooks) {
		setup();
	} else {
		document.addEventListener("swup:enable", setup);
	}
}
