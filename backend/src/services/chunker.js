import { CHUNK_SIZE, CHUNK_OVERLAP } from "../config/constant.js";

// rough token count: 1 token ~ 4 char
function approximateTokens(text) {
  return Math.ceil(text.length / 4);
}

// If a section is too long, split by size with overlap so the context isn't lost
function splitBySize(text, sectionName, startIndex) {
  const chunks = [];
  const words = text.split(" "); //splic by spaces

  // Convert Token limits to approx word counts, 1 word ~ 1.3 tokens
  const maxWords = Math.floor(CHUNK_SIZE / 1.3); // CS = 400
  const overlapWords = Math.floor(CHUNK_OVERLAP); //OL = 80

  let start = 0;
  let chunkOffset = 0;

  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length); //if words.len is small we go with it or strt+maxword

    const content = words.slice(start, end).join(" ");

    chunks.push({
      content,
      section: sectionName,
      chunkIndex: startIndex + chunkOffset,
    });
    chunkOffset++;

    // Move forward, but step back by overlap amount
    // so the next chunk starts a bit earlier (overlap)
    start = end - overlapWords;

    // prevent infinite loop if overlap >= chunkSize
    if (start >= end) break;
  }
  return chunks;
}

export function chunkMarkdown(markdownText) {
  const chunks = [];
  let chunkIndex = 0;

  const sections = markdownText.split(/(?=^#{1,2})/m);

  for (const section of sections) {
    const lines = section.trim().split("\n");
    const headingLine = lines[0];
    const body = lines.slice(1).join("\n").trim();

    // Extract the sectName from head line
    // ##String Reversal -> String Reversal
    const sectionName = headingLine.replace(/^#+\s*/, "").trim();

    // Skip empty sections
    if (!body) continue;

    const tokenCount = approximateTokens(body);

    if (tokenCount <= CHUNK_SIZE) {
      chunks.push({
        content: body,
        section: sectionName,
        chunkIndex: chunkIndex++,
        tokenCount,
      });
    } else {
      const subChunks = splitBySize(body, sectionName, chunkIndex);
      chunks.push(...subChunks);
      chunkIndex += subChunks.length;
    }
  }

  return chunks;
}

export function detectLanguage(filename) {
  if (filename.includes("python") || filename.includes(".py")) return "python";
  if (filename.includes("javascript") || filename.includes("js"))
    return "javascript";
  if (filename.includes("typescript") || filename.includes("ts"))
    return "typescript";
  if (filename.includes("sql")) return "general";
}

export function extractTags(sectionName, content) {
  const text = sectionName + " " + content.toLowerCase();
  const tags = {
    reverse: ["reverse", "reversed", "reversal"],
    sort: ["sort", "sorted", "sorting", "order"],
    filter: ["filter", "filtering", "where", "condition"],
    map: ["map", "transform", "mapping"],
    reduce: ["reduce", "accumulate", "sum", "total"],
    search: ["find", "search", "indexOf", "findIndex", "includes"],
    string: ["string", "str", "text", "char"],
    array: ["array", "list", "collection", "[]"],
    duplicate: ["duplicate", "deduplicate", "unique", "set"],
    format: ["format", "template", "interpolat"],
    split: ["split", "join", "delimiter"],
    case: ["upper", "lower", "case", "title"],
  };

  const found = [];

  for (const [tag, keyword] of Object.entries(tags)) {
    if (keyword.some((kw) => text.includes(kw))) {
      found.push(tag);
    }
  }

  return found;
}
