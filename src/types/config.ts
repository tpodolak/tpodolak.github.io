import type { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants";

export type SiteConfig = {
	title: string;
	subtitle: string;

	lang:
		| "en"
		| "zh_CN"
		| "zh_TW"
		| "ja"
		| "ko"
		| "es"
		| "th"
		| "vi"
		| "tr"
		| "id";

	themeColor: {
		hue: number;
		fixed: boolean;
	};
	banner: {
		enable: boolean;
		src: string;
		position?: "top" | "center" | "bottom";
		credit: {
			enable: boolean;
			text: string;
			url?: string;
		};
	};
	toc: {
		enable: boolean;
		depth: 1 | 2 | 3;
	};

	favicon: Favicon[];
};

export type Favicon = {
	src: string;
	theme?: "light" | "dark";
	sizes?: string;
};

export enum LinkPreset {
	Home = 0,
	Archive = 1,
}

export type NavBarLink = {
	name: string;
	url: string;
	external?: boolean;
	/** Defaults to true. Set to false for links that must be a full browser navigation, e.g. feeds or file downloads. */
	clientSideNavigation?: boolean;
};

export type NavBarIconLink = NavBarLink & {
	icon: string;
};

export type NavBarConfig = {
	menuLinks: (NavBarLink | LinkPreset)[];
	barLinks: NavBarIconLink[];
};

export type ProfileConfig = {
	avatar?: string;
	name: string;
	bio?: string;
	links: {
		name: string;
		url: string;
		icon: string;
	}[];
};

export type LicenseConfig = {
	enable: boolean;
	name: string;
	url: string;
};

export type LIGHT_DARK_MODE =
	| typeof LIGHT_MODE
	| typeof DARK_MODE
	| typeof AUTO_MODE;

export type BlogPostData = {
	body: string;
	title: string;
	published: Date;
	description: string;
	tags: string[];
	draft?: boolean;
	image?: string;
	category?: string;
	prevTitle?: string;
	prevSlug?: string;
	nextTitle?: string;
	nextSlug?: string;
};

export type ExpressiveCodeConfig = {
	theme: string;
};

export type GiscusConfig = {
	// Values below come from https://giscus.app
	repo: string; // "owner/repo"
	repoId: string;
	category: string;
	categoryId: string;
	mapping: "pathname" | "url" | "title" | "og:title" | "specific";
	strict: boolean;
	reactionsEnabled: boolean;
	inputPosition: "top" | "bottom";
	lang: string;
	lazyLoad: boolean;
	// Giscus theme names used for the site's light and dark mode
	theme: {
		light: string;
		dark: string;
	};
};
