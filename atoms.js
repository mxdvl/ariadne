import { key } from "./key.js";
import { base } from "./capi.js";
import {
  array,
  literal,
  object,
  parse,
  string,
  ValiError,
} from "https://esm.sh/valibot@0.26.0";
import { atoms } from "./capi.js";

/** Setup **/
key;
const ul = document.querySelector("ul#atoms");
const more = document.querySelector("button#more");

if (!(ul instanceof HTMLUListElement) || !(more instanceof HTMLButtonElement)) {
  throw Error("No Unordered List Element");
}

/**
 * @param {object} interactive
 * @param {URL} interactive.url
 * @param {string} interactive.title
 * @param {string[]} interactive.usage
 */
const create_li = (interactive) => {
  const li = document.createElement("li");
  li.innerHTML = `${interactive.title}<ul>${
    interactive.usage.map((id) =>
      `<li><a href="https://www.theguardian.com/${id}">${id}</a></li>`
    ).join("\n")
  }</ul>`;

  li.dataset.count = String(interactive.usage.length);

  console.log(li);

  return li;
};

/**
 * @param {number} page
 * @param {string[]} types
 */
const get_atoms = async (page = 1, types = []) => {
  const params = new URLSearchParams({
    "api-key": key,
    "page": String(page),
  });

  if (types.length > 0) params.set("types", types.join(","));

  const url = new URL(`atoms?${params.toString()}`, base);
  3;

  const { response: { currentPage, results, pages } } = await fetch(url, {
    "mode": "cors",
  })
    .then((response) => response.json())
    .then((json) => atoms(json))
    .catch((error) => {
      if (error instanceof ValiError) {
        console.error(error.issues);
      }
      return /** @satisfies {import('./capi.js').Atoms} */ ({
        response: {
          status: "ok",
          currentPage: 1,
          pages: 1,
          total: 0,
          results: [],
        },
      });
    });

  return {
    results,
    next_page: currentPage < pages ? currentPage + 1 : undefined,
  };
};

/** @param {string[]} types */
async function* get_all_atoms(types = []) {
  let { next_page, results } = await get_atoms(1, types);

  while (results.length) {
    const result = results.shift();
    if (!result) throw Error("impossible");
    if (results.length === 0) {
      ({ next_page, results } = await get_atoms(next_page, types));
    }

    const { response } = await fetch(
      `https://content.guardianapis.com/atom/interactive/${result.id}/usage?api-key=${key}`,
    )
      .then((response) => response.json())
      .then((json) =>
        parse(
          object({
            response: object({
              status: literal("ok"),
              results: array(string()),
            }),
          }),
          json,
        )
      );

    yield {
      id: result.id,
      type: result.atomType,
      usage: response.results,
    };
  }
}

const interactive_atoms = get_all_atoms(["interactive"]);
const append = async (count = 10) => {
  const { done, value } = await interactive_atoms.next();
  if (done || !value) return;
  const { id, type, usage } = value;
  ul.append(
    create_li({
      url: new URL(
        `https://content.guardianapis.com/atom/interactive/${value.id}/usage?api-key=${key}`,
      ),
      title: `${id} (${type})`,
      usage,
    }),
  );
  if (count > 0) await append(count - 1);
};

await append();

document.addEventListener("click", (event) => {
  switch (event.target) {
    case more:
      return requestAnimationFrame(() => append());
  }
});