#!/usr/bin/env node

import cac from "cac";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import prompts from "prompts";

export const selectFile = async (root = os.homedir()): Promise<string> => {
  const items = await fs.readdir(path.resolve(root), {
    withFileTypes: true,
  });
  const isSystemRoot = path.resolve("/") === path.resolve(root);
  const { entry } = (await prompts({
    type: "select",
    name: "entry",
    message: "",
    choices: [
      ...(isSystemRoot
        ? []
        : [
            {
              title: "../",
              value: { name: "../", type: "directory" },
            },
          ]),
      ...items.map((i) => ({
        title: i.name,
        value: { name: i.name, type: i.isFile() ? "file" : "directory" },
      })),
    ],
    hint: "- Space / Return to select",
  })) as { entry: { name: string; type: "file" | "directory" } };

  return entry.type === "file"
    ? path.join(root, entry.name)
    : selectFile(path.join(root, entry.name));
};

export const selectDirectory = async (root = os.homedir()): Promise<string> => {
  const items = await fs.readdir(path.resolve(root), {
    withFileTypes: true,
  });
  const isSystemRoot = path.resolve("/") === path.resolve(root);
  const { entry } = (await prompts({
    type: "select",
    name: "entry",
    message: "",
    choices: [
      ...(isSystemRoot
        ? []
        : [
            {
              title: "../",
              value: "../",
            },
          ]),
      {
        title: `[Select ./]`,
        value: "./",
      },
      ...items
        .filter((i) => i.isDirectory())
        .map((i) => ({
          title: i.name,
          value: i.name,
        })),
    ],
    hint: "- Space / Return to select",
  })) as { entry: string };

  return entry === "./"
    ? path.join(root, entry)
    : selectDirectory(path.join(root, entry));
};

export default selectFile;

if (require.main === module) {
  (async () => {
    const cli = cac("cli-file-select");
    cli.command("[]", "Select a file").action(async () => {
      const file = await selectFile();
      console.log(file);
    });
    cli.command("directory", "Select a directory").action(async () => {
      const directory = await selectDirectory();
      console.log(directory);
    });
    cli.help();
    cli.parse();
  })();
}
