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
      if (query) {
        node.textContent = `没有找到与“${query}”相关的文章，请换个关键词试试。`;
        return;
      }

      const results = document.getElementById("searchResults");
      if (results && results.contains(node)) {
        results.innerHTML = "";
        results.classList.remove("has-results");
      }
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

  function localizeAmbientControls(root) {
    const labelMap = {
      "Click to start ambient sounds": "选择背景音效",
      "Coffee Shop not available": "咖啡馆音效暂不可用",
      "Rain not available": "雨声音效暂不可用",
      "Fireplace not available": "壁炉音效暂不可用",
    };

    root.querySelectorAll(".ambient-label").forEach((node) => {
      const text = node.textContent.trim();
      if (labelMap[text]) {
        node.textContent = labelMap[text];
        return;
      }

      node.textContent = text
        .replace(/^Playing:\s*Coffee Shop$/i, "正在播放：咖啡馆")
        .replace(/^Playing:\s*Rain$/i, "正在播放：雨声")
        .replace(/^Playing:\s*Fireplace$/i, "正在播放：壁炉")
        .replace(/^Paused:\s*Coffee Shop$/i, "已暂停：咖啡馆")
        .replace(/^Paused:\s*Rain$/i, "已暂停：雨声")
        .replace(/^Paused:\s*Fireplace$/i, "已暂停：壁炉");
    });

    const controls = [
      [".mute-toggle", "切换背景音效"],
      ['.ambient-icon[data-sound="coffee"]', "咖啡馆音效"],
      ['.ambient-icon[data-sound="rain"]', "雨声音效"],
      ['.ambient-icon[data-sound="fireplace"]', "壁炉音效"],
      [".volume-slider", "背景音量"],
    ];

    controls.forEach(([selector, label]) => {
      root.querySelectorAll(selector).forEach((node) => {
        node.setAttribute("title", label);
        node.setAttribute("aria-label", label);
      });
    });
  }

  function localizeRelatedContent(root) {
    root.querySelectorAll(".related-posts h3").forEach((node) => {
      if (/^Related Content$/i.test(node.textContent.trim())) {
        node.textContent = "相关文章";
      }
    });
  }

  function localizeDom() {
    const root = document;
    localizeReadingTime(root);
    localizeLoadMore(root);
    localizeSearchResults(root);
    localizePostCards(root);
    localizeAmbientControls(root);
    localizeRelatedContent(root);
  }

  function getGiscusTheme() {
    const commentsSection = document.querySelector(".comments-section");
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const lightTheme = commentsSection?.dataset.giscusThemeLight;
    const darkTheme = commentsSection?.dataset.giscusThemeDark;
    return currentTheme === "dark" ? darkTheme || "transparent_dark" : lightTheme || "light";
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

  function setupMobileMenu() {
    const toggle = document.querySelector(".mobile-menu-toggle");
    const navLinks = document.getElementById("siteNavLinks");

    if (!toggle || !navLinks) {
      return;
    }

    function setOpen(isOpen) {
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "关闭导航菜单" : "打开导航菜单");
      toggle.title = isOpen ? "关闭导航菜单" : "打开导航菜单";
      navLinks.classList.toggle("is-open", isOpen);
      document.documentElement.classList.toggle("mobile-menu-open", isOpen);
    }

    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("click", (event) => {
      if (
        toggle.getAttribute("aria-expanded") === "true" &&
        !navLinks.contains(event.target) &&
        !toggle.contains(event.target)
      ) {
        setOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    });

    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 769px)").matches) {
        setOpen(false);
      }
    });
  }

  function setupTocScrollSync() {
    const tocContent = document.getElementById("toc-content");
    if (!tocContent || tocContent.dataset.scrollSyncReady === "true") {
      return;
    }

    const links = Array.from(tocContent.querySelectorAll('a[href^="#"]'));
    if (!links.length) {
      return;
    }

    const headings = Array.from(document.querySelectorAll(".post-body h2, .post-body h3"));
    const pairs = links
      .map((link, index) => {
        let id = link.hash.slice(1);
        try {
          id = decodeURIComponent(id);
        } catch (_error) {
          // Keep the raw hash when it is not URI encoded.
        }

        const heading = document.getElementById(id) || headings[index];
        return heading ? { link, heading } : null;
      })
      .filter(Boolean);

    if (!pairs.length) {
      return;
    }

    tocContent.dataset.scrollSyncReady = "true";

    const overlayContent = document.querySelector(".post-overlay-content");
    const usesOverlayScroll =
      overlayContent && overlayContent.scrollHeight > overlayContent.clientHeight;
    const scrollTarget = usesOverlayScroll ? overlayContent : window;

    function getOffset() {
      if (usesOverlayScroll) {
        return (document.querySelector(".post-overlay-header")?.offsetHeight || 0) + 36;
      }

      return (document.querySelector(".site-header")?.offsetHeight || 0) + 36;
    }

    function isAtBottom() {
      if (usesOverlayScroll) {
        return (
          overlayContent.scrollTop + overlayContent.clientHeight >=
          overlayContent.scrollHeight - 4
        );
      }

      const page = document.documentElement;
      return window.scrollY + window.innerHeight >= page.scrollHeight - 4;
    }

    function setActive(activeIndex) {
      pairs.forEach(({ link }, index) => {
        link.classList.toggle("active", index === activeIndex);
      });
    }

    function updateActiveToc() {
      const containerTop = usesOverlayScroll
        ? overlayContent.getBoundingClientRect().top
        : 0;
      const threshold = getOffset();
      let activeIndex = 0;

      pairs.forEach(({ heading }, index) => {
        const top = heading.getBoundingClientRect().top - containerTop;
        if (top <= threshold) {
          activeIndex = index;
        }
      });

      if (isAtBottom()) {
        activeIndex = pairs.length - 1;
      }

      setActive(activeIndex);
    }

    function scrollToHeading(heading) {
      const offset = getOffset() - 8;

      if (usesOverlayScroll) {
        const containerTop = overlayContent.getBoundingClientRect().top;
        const top =
          heading.getBoundingClientRect().top -
          containerTop +
          overlayContent.scrollTop -
          offset;
        overlayContent.scrollTo({ top, behavior: "smooth" });
        return;
      }

      const top = heading.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }

    tocContent.addEventListener(
      "click",
      (event) => {
        const link = event.target.closest('a[href^="#"]');
        if (!link || !tocContent.contains(link)) {
          return;
        }

        const pair = pairs.find((item) => item.link === link);
        if (!pair) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        scrollToHeading(pair.heading);
        setActive(pairs.indexOf(pair));
      },
      true
    );

    scrollTarget.addEventListener("scroll", updateActiveToc, { passive: true });
    window.addEventListener("resize", updateActiveToc);
    window.requestAnimationFrame(updateActiveToc);
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

  setupMobileMenu();
  setupTocScrollSync();
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
    setupTocScrollSync();
    scheduleLocalization();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
