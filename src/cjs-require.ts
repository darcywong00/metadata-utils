// Workaround to use ECMAScript modules
// From https://dev.to/caspergeek/how-to-use-require-in-ecmascript-modules-1l42
import { createRequire } from "module";
const require = createRequire(import.meta.url);

export default require;
