import { key } from "./key.js";
import { base, search } from "./capi.js";
import {
  array,
  literal,
  object,
  parse,
  string,
  transform,
  ValiError,
} from "https://esm.sh/valibot@0.26.0";

// –– initial set up –– //

const ul = document.querySelector("ul#fiver");
const more = document.querySelector("button#more");

if (!(ul instanceof HTMLUListElement) || !(more instanceof HTMLButtonElement)) {
  throw Error("No Unordered List Element");
}

// –– methods –– //

/** @type {
  (interactive: Readonly<{
    url: Readonly<URL>,
    title: string,
  }>)
=>
  HTMLLIElement
} */
const create_li = (review) => {
  const li = document.createElement("li");
  li.innerHTML = `<a href="${review.url.href}">★★★★★ ${review.title}</a>`;
  return li;
};

/** @type {
  (page?: number, stars?: 0 | 1 | 2 | 3 | 4 | 5 )
=>
  Promise<{
    results: Array<{ id: string, title: string }>
    next_page: number | undefined
  }>
} */
const get_reviews = async (page = 1, stars = 5) => {
  const params = new URLSearchParams({
    "api-key": key,
    "page": String(page),
    "star-rating": String(stars),
    "show-fields": ["starRating", "thumbnail", "byline"].join(","),
  });

  const url = new URL(`search?${params.toString()}`, base);
  3;

  const { response: { currentPage, results, pages } } = await fetch(url, {
    "mode": "cors",
  })
    .then((response) => response.json())
    .then((json) => search(json))
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

/** @type {
  (stars?: 0 | 1 | 2 | 3 | 4 | 5)
=>
  AsyncGenerator<{id: string, title: string}>
} */
async function* get_all_reviews(stars = 5) {
  let { next_page, results } = await get_reviews(1, stars);

  while (results.length) {
    const result = results.shift();
    if (!result) throw Error("impossible");
    if (results.length === 0) {
      ({ next_page, results } = await get_reviews(next_page, stars));
    }

    console.log(result);

    yield ({
      url: result.webUrl,
      title: result.webTitle,
    });
  }
}

const reviews = get_all_reviews(5);
const append = async (count = 10) => {
  const { done, value } = await reviews.next();
  if (done || !value) return;
  ul.append(create_li(value));
  if (count > 0) await append(count - 1);
};

await append();

document.addEventListener("click", (event) => {
  switch (event.target) {
    case more:
      return requestAnimationFrame(() => append());
  }
});
