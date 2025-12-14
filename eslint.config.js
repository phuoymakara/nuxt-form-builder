// eslint.config.js
import withNuxt from "./.nuxt/eslint.config.mjs";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default withNuxt({
  // Your custom Nuxt ESLint options (optional)
}).append(eslintPluginPrettierRecommended);
