import { ProcBlock } from "@hotg-ai/rune";
import { invoke } from "@tauri-apps/api/tauri";
import { readBinaryFile } from "@tauri-apps/api/fs";
import pino from "pino";

export async function loadProcBlocks(): Promise<Record<string, ProcBlock>> {
  const procBlocks: Record<string, ProcBlock> = {};

  const allProckBlocks: any[] = await invoke("known_proc_blocks");
  const promises = allProckBlocks.map(async (pb) => {

    try {
      procBlocks[pb["name"]] = await loadProcBlock(pb["publicUrl"]);
    } catch (e) {
      console.log(`Didn't load proc-block ${pb["publicUrl"]} `, e);
    }
  });
  await Promise.all(promises);
  return procBlocks;
}

export async function loadProcBlock(filename: string): Promise<ProcBlock> {
 // const url = `${filename.replace("$RESOURCE", "")}`;

  const response = await readBinaryFile(filename, {  });
  //const response = await fetch(filename);
  if (!response) {
    throw new Error(`Unable to retrieve ${filename}`);
  }
  const wasm = response;
  const logger = pino({ browser: { write: console.log } });
  const pb = await ProcBlock.load(wasm, logger);
  return pb;
}

export function isStringArray(item?: any): item is string[] {
  return Array.isArray(item) && item.every((elem) => typeof elem === "string");
}
