(function () {
  "use strict";

  function stripHtml(html) {
    const temp = document.createElement("div");
    temp.innerHTML = html || "";
    return (temp.textContent || temp.innerText || "").replace(/\s+/g, " ").trim();
  }

  function truncateText(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength).trim()}...`;
  }

  function escapeHtml(text) {
    const temp = document.createElement("div");
    temp.textContent = text;
    return temp.innerHTML;
  }

  function replaceWithClone(node) {
    if (!node) {
      return null;
    }
    const clone = node.cloneNode(true);
    node.replaceWith(clone);
    return clone;
  }

  function localizeReadingTime(root) {
    root.querySelectorAll(".reading-time-vaporwave span:last-child").forEach((node) => {
      const match = node.textContent.match(/(\d+)\s*min(?:ute)?(?:s)?/i);
      if (match) {
        node.textContent = `${match[1]} 分钟阅读`;
      }
    });
  }

  function localizeLoadMore(root) {
    root.querySelectorAll(".load-more-text").forEach((node) => {
      const text = node.textContent.trim();
      if (/^Load More Posts$/i.test(text)) {
        node.textContent = "加载更多文章";
      } else if (/^Error loading posts$/i.test(text)) {
        node.textContent = "加载文章时出现问题";
      }
    });

    root.querySelectorAll(".loading-text").forEach((node) => {
      if (/^Brewing more content/i.test(node.textContent.trim())) {
        node.textContent = "正在加载更多内容...";
      }
    });
  }

  function localizeSearchResults(root) {
    root.querySelectorAll(".search-no-results").forEach((node) => {
      const query = document.getElementById("searchInput")?.value.trim();
      node.textContent = query
        ? `没有找到与“${query}”相关的文章，请换个关键词试试。`
        : "没有找到相关文章。";
    });
  }

  function localizePostCards(root) {
    root.querySelectorAll(".continue-reading-vaporwave").forEach((node) => {
      if (/^Read More/i.test(node.textContent.trim())) {
        node.textContent = "继续阅读";
      }
    });

    root.querySelectorAll(".featured-badge").forEach((node) => {
      if (/Featured/i.test(node.textContent)) {
        node.textContent = "精选";
      }
    });
  }

  function localizeDom() {
    const root = document;
    localizeReadingTime(root);
    localizeLoadMore(root);
    localizeSearchResults(root);
    localizePostCards(root);
  }

  function getGiscusTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    return currentTheme === "dark" ? "transparent_dark" : "light";
  }

  function syncGiscusTheme() {
    const giscusFrame = document.querySelector("iframe.giscus-frame");
    if (!giscusFrame || !giscusFrame.contentWindow) {
      return false;
    }

    giscusFrame.contentWindow.postMessage(
      {
        giscus: {
          setConfig: {
            theme: getGiscusTheme(),
          },
        },
      },
      "https://giscus.app"
    );

    return true;
  }

  function setupGiscusThemeSync() {
    if (!document.querySelector(".comments-section")) {
      return;
    }

    const iframeObserver = new MutationObserver(() => {
      if (syncGiscusTheme()) {
        iframeObserver.disconnect();
      }
    });

    if (document.body) {
      iframeObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    const themeObserver = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === "data-theme")) {
        syncGiscusTheme();
      }
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    let attempts = 0;
    const maxAttempts = 20;
    const intervalId = window.setInterval(() => {
      attempts += 1;
      if (syncGiscusTheme() || attempts >= maxAttempts) {
        window.clearInterval(intervalId);
      }
    }, 400);
  }

  function setupJsonBackedSearch() {
    const searchForm = document.getElementById("searchForm");
    const searchResults = document.getElementById("searchResults");

    if (!searchForm || !searchResults) {
      return;
    }

    let searchToggle = replaceWithClone(document.querySelector(".search-toggle"));
    let searchSubmit = replaceWithClone(document.querySelector(".search-submit"));
    let searchClose = replaceWithClone(document.querySelector(".search-close"));
    let searchInput = replaceWithClone(document.getElementById("searchInput"));

    if (!searchToggle || !searchSubmit || !searchClose || !searchInput) {
      return;
    }

    let searchData = [];
    let isSearchOpen = false;
    let debounceTimer = null;
    let loadPromise = null;

    function resetPostVisibility() {
      const posts = document.querySelectorAll(".post-item");
      posts.forEach((post) => {
        post.style.display = "grid";
        post.style.outline = "none";
      });

      const filterTags = document.querySelectorAll(".filter-tags .tag");
      if (!filterTags.length) {
        return;
      }

      filterTags.forEach((tag) => tag.classList.remove("active"));
      const allTag =
        document.querySelector('.filter-tags .tag[data-tag="all"]') ||
        document.querySelector(".filter-tags .tag:first-child");
      if (allTag) {
        allTag.classList.add("active");
      }
    }

    function clearSearchResults() {
      searchResults.innerHTML = "";
      searchResults.classList.remove("has-results");
    }

    function toggleSearch(forceOpen) {
      const nextState = typeof forceOpen === "boolean" ? forceOpen : !isSearchOpen;
      isSearchOpen = nextState;

      if (nextState) {
        searchForm.classList.add("active");
        window.setTimeout(() => {
          searchInput.focus();
        }, 100);
        return;
      }

      searchForm.classList.remove("active");
      searchInput.value = "";
      clearTimeout(debounceTimer);
      clearSearchResults();
      resetPostVisibility();
    }

    function normalizeSearchData(items) {
      return items
        .map((item) => {
          const url = item.url || item.permalink || "";
          return {
            title: item.title || "",
            url,
            pathname: url ? new URL(url, window.location.origin).pathname : "",
            excerpt: stripHtml(item.summary || item.excerpt || item.content || ""),
            tags: Array.isArray(item.tags) ? item.tags.filter(Boolean) : [],
            date: item.dateFormatted || item.date || "",
          };
        })
        .filter((item) => item.title && item.url);
    }

    async function ensureSearchData() {
      if (searchData.length) {
        return searchData;
      }

      if (loadPromise) {
        return loadPromise;
      }

      if (isSearchOpen) {
        searchResults.innerHTML = '<div class="search-no-results">正在加载搜索索引...</div>';
        searchResults.classList.add("has-results");
      }

      loadPromise = fetch("/index.json", { cache: "no-store" })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load index.json: ${response.status}`);
          }
          return response.json();
        })
        .then((items) => {
          searchData = normalizeSearchData(items);
          return searchData;
        })
        .finally(() => {
          loadPromise = null;
        });

      return loadPromise;
    }

    function renderSearchResults(results, query) {
      if (!results.length) {
        searchResults.innerHTML = `<div class="search-no-results">没有找到与“${escapeHtml(
          query
        )}”相关的文章，请换个关键词试试。</div>`;
        searchResults.classList.add("has-results");
        return;
      }

      searchResults.innerHTML = results
        .slice(0, 10)
        .map((post) => {
          const tags = post.tags.length ? escapeHtml(post.tags.join(", ")) : "未设置标签";
          return `
            <a class="search-result-item" href="${post.url}">
              <div class="search-result-title">${escapeHtml(post.title)}</div>
              <div class="search-result-excerpt">${escapeHtml(
                truncateText(post.excerpt, 120)
              )}</div>
              <div class="search-result-meta">
                <span>${escapeHtml(post.date)}</span>
                <span>${tags}</span>
              </div>
            </a>
          `;
        })
        .join("");
      searchResults.classList.add("has-results");
    }

    function highlightSearchResults(results) {
      const posts = document.querySelectorAll(".post-item");
      if (!posts.length) {
        return;
      }

      const matchedPaths = new Set(results.map((result) => result.pathname));
      let matchesInDom = 0;

      posts.forEach((post) => {
        const titleLink = post.querySelector(".post-title-vaporwave a");
        const pathname = titleLink ? new URL(titleLink.href).pathname : "";
        if (pathname && matchedPaths.has(pathname)) {
          matchesInDom += 1;
        }
      });

      posts.forEach((post) => {
        const titleLink = post.querySelector(".post-title-vaporwave a");
        const pathname = titleLink ? new URL(titleLink.href).pathname : "";

        if (!matchesInDom) {
          post.style.display = "grid";
          post.style.outline = "none";
          return;
        }

        if (pathname && matchedPaths.has(pathname)) {
          post.style.display = "grid";
          post.style.outline = "2px solid var(--accent-primary)";
        } else {
          post.style.display = "none";
          post.style.outline = "none";
        }
      });
    }

    function performSearch(query) {
      const keyword = query.trim();
      if (!keyword) {
        clearSearchResults();
        resetPostVisibility();
        return;
      }

      const needle = keyword.toLowerCase();
      const results = searchData.filter((post) => {
        return (
          post.title.toLowerCase().includes(needle) ||
          post.excerpt.toLowerCase().includes(needle) ||
          post.tags.some((tag) => tag.toLowerCase().includes(needle))
        );
      });

      renderSearchResults(results, keyword);
      highlightSearchResults(results);
    }

    async function runSearch(query) {
      try {
        await ensureSearchData();
        performSearch(query);
      } catch (error) {
        console.error("Search index load failed:", error);
        searchResults.innerHTML =
          '<div class="search-no-results">搜索索引加载失败，请稍后刷新重试。</div>';
        searchResults.classList.add("has-results");
        resetPostVisibility();
      }
    }

    searchToggle.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const opening = !isSearchOpen;
      toggleSearch(opening);
      if (!opening) {
        return;
      }

      await ensureSearchData().catch((error) => {
        console.error("Search index preload failed:", error);
      });
    });

    searchClose.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleSearch(false);
    });

    searchSubmit.addEventListener("click", (event) => {
      event.preventDefault();
      runSearch(searchInput.value);
    });

    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);

      if (!searchInput.value.trim()) {
        clearSearchResults();
        resetPostVisibility();
        return;
      }

      debounceTimer = window.setTimeout(() => {
        runSearch(searchInput.value);
      }, 200);
    });

    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        runSearch(searchInput.value);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        toggleSearch(false);
      }
    });

    document.addEventListener("click", (event) => {
      if (!isSearchOpen) {
        return;
      }

      if (!searchForm.contains(event.target) && !searchToggle.contains(event.target)) {
        toggleSearch(false);
      }
    });
  }

  let scheduled = false;
  function scheduleLocalization() {
    if (scheduled) {
      return;
    }
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      localizeDom();
    });
  }

  setupJsonBackedSearch();
  setupGiscusThemeSync();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleLocalization, {
      once: true,
    });
  } else {
    scheduleLocalization();
  }

  const observer = new MutationObserver(() => {
    scheduleLocalization();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
