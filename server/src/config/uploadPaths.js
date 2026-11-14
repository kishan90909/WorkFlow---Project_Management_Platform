import path from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDirectory = path.resolve(configDirectory, "../../uploads");

// Older local runs may have stored files in the project-root uploads folder
// because the upload path depended on the process working directory.
export const legacyUploadsDirectory = path.resolve(
  configDirectory,
  "../../../uploads",
);

export function isSafeStoredFilename(filename) {
  return (
    typeof filename === "string" &&
    filename.length > 0 &&
    path.basename(filename) === filename
  );
}
