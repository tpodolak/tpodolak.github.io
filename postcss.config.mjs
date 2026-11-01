<<<<<<< HEAD
import postcssImport from "postcss-import";
import tailwindcss from "tailwindcss";
import postcssNesting from "tailwindcss/nesting/index.js";

export default {
	plugins: {
		"postcss-import": postcssImport, // to combine multiple css files
		"tailwindcss/nesting": postcssNesting,
		tailwindcss: tailwindcss,
	},
=======
import postcssImport from 'postcss-import';
import tailwindcss from '@tailwindcss/postcss';

export default {
    plugins: [
        postcssImport,
        tailwindcss,
    ],
>>>>>>> c644d1d7 (upgrade fixes)
};
