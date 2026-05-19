(function () {
  "use strict";

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
