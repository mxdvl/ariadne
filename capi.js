import {
  array,
  literal,
  number,
  object,
  optional,
  parse,
  picklist,
  string,
  transform,
  url,
} from "https://esm.sh/valibot@0.26.0";

const pillarId = optional(picklist([
  "pillar/news",
  "pillar/opinion",
  "pillar/sport",
  "pillar/lifestyle",
  "pillar/arts",
]));

const element = object({
  id: string(),
  relation: string(),
  type: string(),
  assets: array(object({
    type: string(),
    file: string(),
    // typeData: object({}),
  })),
});

const tag = object({
  id: string(),
  type: string(),
  // sectionId: string(),
  webTitle: string(),
  description: optional(string(), ""),
});

const result = object({
  pillarId,
  id: string(),
  type: string(), // ["tag", "article", "picture", "liveblog"]
  webPublicationDate: transform(string(), (input) => new Date(input)),
  webTitle: string(),
  tags: optional(array(tag), []),
  webUrl: transform(string([url()]), (input) => new URL(input)),
  elements: optional(array(element), []),
  fields: optional(object({
    commentable: optional(picklist(["true", "false"])),
  })),
});

const search_schema = object({
  response: object({
    status: literal("ok"),
    currentPage: number(),
    pages: number(),
    pageSize: number(),
    total: number(),
    results: array(result),
  }),
});

const content_schema = object({
  response: object({
    status: literal("ok"),
    total: literal(1),
    content: result,
  }),
});

const atoms_response_schema = object({
  response: object({
    status: literal("ok"),
    total: number(),
    pages: number(),
    currentPage: number(),
    results: array(object({
      "id": string(),
      "atomType": string(),
    })),
  }),
});

/** @typedef {import('https://esm.sh/valibot@0.26.0').Output<typeof search_schema>} Search */
/** @type {
  (response: unknown)
=>
  Search
}*/
const search = (response) => parse(search_schema, response);

/** @typedef {import('https://esm.sh/valibot@0.26.0').Output<typeof content_schema>} Content */
/** @type {
  (response: unknown)
=>
  Content
}*/
const content = (response) => parse(content_schema, response);

/** @typedef {import('https://esm.sh/valibot@0.26.0').Output<typeof atoms_response_schema>} Atoms */
/** @type {
  (response: unknown)
=>
  Atoms
}*/
const atoms = (response) => parse(atoms_response_schema, response);

const base = "https://content.guardianapis.com/";

export { atoms, base, content, search };
