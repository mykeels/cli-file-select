import { promises as fs } from "fs";
import os from "os";
import path from "path";
import prompts from "prompts";

export const selectFile = async (root: string): Promise<string> => {
  const items = await fs.readdir(path.resolve(root), {
    withFileTypes: true,
  });
  const isSystemRoot = path.resolve("/") === path.resolve(root);
  const { entry } = (await prompts({
    type: "select",
    name: "entry",
    message: "Navigate",
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

export const selectDirectory = async (root: string): Promise<string> => {
  const items = await fs.readdir(path.resolve(root), {
    withFileTypes: true,
  });
  const isSystemRoot = path.resolve("/") === path.resolve(root);
  const { entry } = (await prompts({
    type: "select",
    name: "entry",
    message: "Navigate",
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
    const dir = await selectDirectory(os.homedir());
    console.log(dir);
  })();
}
