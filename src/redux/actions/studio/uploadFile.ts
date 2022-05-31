import { HammerForgeBuilder, ProjectID } from "hammer-forge-builder";

export function base64Encode(buffer: ArrayBuffer): string {
    const charCodes: string[] = [];
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        charCodes.push(String.fromCharCode(bytes[i]));
    }
    return window.btoa(charCodes.join(""));
}

export
    async function fileAlreadyExists(
        forgeBuilder: HammerForgeBuilder,
        id: ProjectID,
        filePath: string
    ): Promise<boolean> {
    try {
        await forgeBuilder.gitlab.RepositoryFiles.show(id, filePath, "master");
        return true;
    } catch {
        return false;
    }
}