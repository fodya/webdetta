const path = new URL("../deno.json", import.meta.url);
const pkg = JSON.parse(await Deno.readTextFile(path));
const [major, minor, patch] = pkg.version.split(".").map(Number);
pkg.version = `${major}.${minor}.${patch + 1}`;
await Deno.writeTextFile(path, JSON.stringify(pkg, null, 2) + "\n");
console.log(pkg.version);
