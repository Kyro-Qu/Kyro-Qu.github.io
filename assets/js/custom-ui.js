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

  function normalizeTagName(tag) {
    return String(tag || "").trim().toLocaleLowerCase();
  }

  function createPostCard(post) {
    const article = document.createElement("article");
    article.className = `post-item${post.featured ? " featured" : ""}`;

    const readingTime = Number(post.readingTime) || 1;
    const cupsToShow = Math.min(readingTime, 5);
    const tags = Array.isArray(post.tags) ? post.tags.filter(Boolean) : [];
    const tagsHtml = tags
      .map((tag) => `<span class="post-tag-vaporwave">${escapeHtml(tag)}</span>`)
      .join("");

    article.innerHTML = `
      <div class="post-content">
        <div class="post-header-inline">
          <h2 class="post-title-vaporwave">
            <a href="${post.url}">${escapeHtml(post.title || "")}</a>
          </h2>
        </div>

        <div class="post-date-with-badges">
          <span class="post-date">${escapeHtml(post.dateFormatted || post.date || "")}</span>
          ${post.featured ? '<span class="featured-badge">精选</span>' : ""}
          ${post.mood ? `<span class="post-mood">${escapeHtml(post.mood)}</span>` : ""}
        </div>

        ${
          post.subtitle
            ? `<p class="post-list-subtitle">${escapeHtml(post.subtitle)}</p>`
            : ""
        }

        <p class="post-excerpt-vaporwave">
          ${escapeHtml(post.excerpt || stripHtml(post.summary || "") || "")}
        </p>

        ${tagsHtml ? `<div class="post-tags-vaporwave">${tagsHtml}</div>` : ""}

        <a href="${post.url}" class="continue-reading-vaporwave">继续阅读</a>
      </div>

      <div class="post-meta-sidebar">
        <div class="reading-time-vaporwave">
          <span class="coffee-cups">${"☕".repeat(cupsToShow)}</span>
          <span>${readingTime} min</span>
        </div>
      </div>
    `;

    return article;
  }

  function setupHomepageTagFilter() {
    const postsContainer = document.getElementById("posts-container");
    const filterTags = document.querySelectorAll(".filter-tags .tag");

    if (!postsContainer || !filterTags.length) {
      return;
    }

    if (postsContainer.dataset.jsonFilterReady === "true") {
      return;
    }

    postsContainer.dataset.jsonFilterReady = "true";

    let postsData = null;
    let loadPromise = null;

    async function loadPostsData() {
      if (postsData) {
        return postsData;
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
          postsData = Array.isArray(items) ? items : [];
          return postsData;
        })
        .finally(() => {
          loadPromise = null;
        });

      return loadPromise;
    }

    function setLoadMoreVisible(visible) {
      const loadMoreSection = document.querySelector(".load-more-section");
      if (loadMoreSection) {
        loadMoreSection.style.display = visible ? "" : "none";
      }
    }

    function renderPosts(posts) {
      postsContainer.innerHTML = "";
      posts.forEach((post) => {
        postsContainer.appendChild(createPostCard(post));
      });
      localizeDom();
    }

    filterTags.forEach((tag) => {
      tag.addEventListener(
        "click",
        async (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();

          filterTags.forEach((item) => item.classList.remove("active"));
          tag.classList.add("active");

          const tagName = tag.dataset.tag || tag.textContent;
          const posts = await loadPostsData();

          if (tagName === "all") {
            renderPosts(posts.slice(0, 3));
            setLoadMoreVisible(posts.length > 3);

            const loadMoreBtn = document.getElementById("load-more-btn");
            if (loadMoreBtn) {
              loadMoreBtn.dataset.loaded = Math.min(3, posts.length);
              loadMoreBtn.style.display = posts.length > 3 ? "flex" : "none";
            }
            return;
          }

          const normalizedTag = normalizeTagName(tagName);
          const filteredPosts = posts.filter((post) =>
            (Array.isArray(post.tags) ? post.tags : []).some(
              (postTag) => normalizeTagName(postTag) === normalizedTag
            )
          );

          renderPosts(filteredPosts);
          setLoadMoreVisible(false);
        },
        true
      );
    });
  }

  function localizeReadingTime(root) {
    root.querySelectorAll(".reading-time-vaporwave span:last-child").forEach((node) => {
      const match = node.textContent.match(/(\d+)\s*min(?:ute)?(?:s)?/i);
      if (match) {
        node.textContent = `${match[1]} min`;
      }
    });
  }

  function ensureCoffeeReadingTime(root) {
    root.querySelectorAll(".reading-time-vaporwave").forEach((node) => {
      const textNode = node.querySelector("span:last-child");
      if (!textNode) {
        return;
      }

      const match = textNode.textContent.match(/(\d+)/);
      if (!match) {
        return;
      }

      const readingTime = parseInt(match[1], 10);
      const cupsToShow = Math.min(readingTime, 5);
      let cupsNode = node.querySelector(".coffee-cups");

      if (!cupsNode) {
        cupsNode = document.createElement("span");
        cupsNode.className = "coffee-cups";
        node.insertBefore(cupsNode, textNode);
      }

      cupsNode.textContent = "☕".repeat(cupsToShow);
      textNode.textContent = `${readingTime} min`;
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

  function localizeRelatedContent(root) {
    root.querySelectorAll(".related-posts h3").forEach((node) => {
      if (/^Related Content$/i.test(node.textContent.trim())) {
        node.textContent = "相关文章";
      }
    });
  }

  function restorePostItemMotion(root) {
    const posts = root.querySelectorAll(".post-item");
    posts.forEach((post) => {
      if (post.dataset.motionCleanupScheduled === "true") {
        return;
      }

      const style = post.getAttribute("style") || "";
      if (!/opacity\s*:|transform\s*:/i.test(style)) {
        return;
      }

      post.dataset.motionCleanupScheduled = "true";
      window.setTimeout(() => {
        post.style.removeProperty("opacity");
        post.style.removeProperty("transform");
        post.style.removeProperty("transition");
        delete post.dataset.motionCleanupScheduled;
      }, 650);
    });
  }

  function localizeDom() {
    const root = document;
    localizeReadingTime(root);
    ensureCoffeeReadingTime(root);
    localizeLoadMore(root);
    localizeSearchResults(root);
    localizePostCards(root);
    localizeRelatedContent(root);
    restorePostItemMotion(root);
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

  function setupSmartHeader() {
    const headers = Array.from(
      document.querySelectorAll(".site-header, .post-overlay-header")
    );
    if (!headers.length) {
      return;
    }

    const overlayContent = document.querySelector(".post-overlay-content");
    const scrollContainer =
      overlayContent && overlayContent.scrollHeight > overlayContent.clientHeight
        ? overlayContent
        : window;
    const media = window.matchMedia("(max-width: 768px)");
    let lastScrollY = scrollContainer === window ? window.scrollY : overlayContent.scrollTop;
    let ticking = false;
    let revealTimer = null;

    function getScrollY() {
      return scrollContainer === window ? window.scrollY : overlayContent.scrollTop;
    }

    function forEachHeader(callback) {
      headers.forEach((header) => {
        if (header) {
          callback(header);
        }
      });
    }

    function resetHeaderState() {
      forEachHeader((header) => {
        header.classList.remove("is-hidden", "is-compact", "is-revealed");
      });
    }

    function markRevealed() {
      forEachHeader((header) => {
        header.classList.remove("is-revealed");
        void header.offsetWidth;
        header.classList.add("is-revealed");
      });

      window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(() => {
        forEachHeader((header) => {
          header.classList.remove("is-revealed");
        });
      }, 520);
    }

    function updateHeader() {
      ticking = false;

      if (media.matches || document.documentElement.classList.contains("mobile-menu-open")) {
        resetHeaderState();
        lastScrollY = getScrollY();
        return;
      }

      const currentScrollY = Math.max(getScrollY(), 0);
      const delta = currentScrollY - lastScrollY;
      const goingDown = delta > 0;
      const goingUp = delta < 0;
      const passedThreshold = currentScrollY > 96;

      forEachHeader((header) => {
        header.classList.toggle("is-compact", currentScrollY > 18);
      });

      if (passedThreshold && goingDown && delta > 6) {
        forEachHeader((header) => {
          header.classList.add("is-hidden");
        });
      } else if (goingUp && Math.abs(delta) > 4) {
        const hadHiddenHeader = headers.some((header) => header.classList.contains("is-hidden"));
        forEachHeader((header) => {
          header.classList.remove("is-hidden");
        });
        if (hadHiddenHeader) {
          markRevealed();
        }
      } else if (currentScrollY <= 12) {
        resetHeaderState();
      }

      lastScrollY = currentScrollY;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateHeader);
      }
    }

    scrollContainer.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateHeader();
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

    const headings = Array.from(document.querySelectorAll(".post-body h2, .post-body h3, .post-body h4"));
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
      let activeLink = null;

      pairs.forEach(({ link }, index) => {
        const isActive = index === activeIndex;
        link.classList.toggle("active", isActive);
        if (isActive) {
          activeLink = link;
        }
      });

      if (activeLink) {
        activeLink.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: "smooth",
        });
      }
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
  setupSmartHeader();
  setupTocScrollSync();
  setupHomepageTagFilter();
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
    setupHomepageTagFilter();
    scheduleLocalization();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
