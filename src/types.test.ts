import fs from "fs";
import path from "path";

function sourceFiles(): string[] {
    const toVisit = fs.readdirSync(__dirname).map(name => path.join(__dirname, name));
    const filenames = [];

    while(toVisit.length > 0) {
        const filename = toVisit.pop();

        if (fs.statSync(filename).isDirectory()) {
            const children = fs.readdirSync(filename).map(name => path.join(filename, name));
            toVisit.push(...children);
        } else {
            if (filename.match(/\.ts(x)?/) && !filename.match(/\.test\.ts(x)?/)) {
                filenames.push(filename);
            }
        }
    }

    return filenames;
}

// https://github.com/hotg-ai/weld-studio/issues/65
describe("Browser Compatibility", () => {
    const ignored = [
        __filename,
        path.join(__dirname, "types.ts"),
        path.join(__dirname, "components/Analysis/model/bindings/runtime-v1.d.ts"),
    ];
    const filenames = sourceFiles()
        .filter(n => !ignored.includes(n));

    it.each(filenames)("bigint isn't used directly in %s", filename => {
        const src = fs.readFileSync(filename, {encoding: "utf-8"});

        expect(src).not.toMatch(/\bbigint\b/);
        expect(src).not.toMatch(/\bBigInt64Array\b/);
        expect(src).not.toMatch(/\bBigUint64Array\b/);
    });
});
