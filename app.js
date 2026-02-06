const DEFAULT_MANIFEST = window.PROMPT_HUB_MANIFEST || {
  prompts: [],
  files: [],
};

const state = {
  data: null,
  activeType: null,
  activeId: null,
  query: "",
  activeContent: "",
};

const promptList = document.getElementById("promptList");
const fileList = document.getElementById("fileList");
const detail = document.getElementById("detail");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const searchInput = document.getElementById("searchInput");
const toggleSidebar = document.getElementById("toggleSidebar");
const sidebar = document.getElementById("sidebar");
const topbarTitle = document.getElementById("topbarTitle");
const topbarMeta = document.getElementById("topbarMeta");

async function loadManifest() {
  try {
    const res = await fetch("manifest.json", { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Ignore fetch errors for file:// or offline usage.
  }
  return JSON.parse(JSON.stringify(DEFAULT_MANIFEST));
}

function getFiltered(items, query) {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter((item) => {
    const hay = [item.title, item.desc, item.path, ...(item.tags || [])]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function renderList(container, items, type) {
  container.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("li");
    empty.className = "list-item";
    empty.textContent = "暂无内容";
    container.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "list-item";
    if (state.activeType === type && state.activeId === item.id) {
      li.classList.add("active");
    }
    li.dataset.id = item.id;
    li.dataset.type = type;

    const title = document.createElement("div");
    title.className = "list-title";
    title.textContent = item.title;

    const desc = document.createElement("div");
    desc.className = "list-desc";
    desc.textContent = item.desc;

    li.appendChild(title);
    li.appendChild(desc);
    container.appendChild(li);
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatInline(text) {
  let output = escapeHtml(text);
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return output;
}

function renderMarkdown(text) {
  const lines = text.split(/\r?\n/);
  let html = "";
  let inCode = false;
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      html += "</ul>";
      listOpen = false;
    }
  };

  lines.forEach((line) => {
    if (line.trim().startsWith("```")) {
      if (!inCode) {
        closeList();
        inCode = true;
        html += '<pre class="code-block"><code>';
      } else {
        inCode = false;
        html += "</code></pre>";
      }
      return;
    }

    if (inCode) {
      html += `${escapeHtml(line)}\n`;
      return;
    }

    if (line.startsWith("# ")) {
      closeList();
      html += `<h2>${formatInline(line.replace(/^#\s+/, ""))}</h2>`;
      return;
    }
    if (line.startsWith("## ")) {
      closeList();
      html += `<h3>${formatInline(line.replace(/^##\s+/, ""))}</h3>`;
      return;
    }
    if (line.startsWith("### ")) {
      closeList();
      html += `<h4>${formatInline(line.replace(/^###\s+/, ""))}</h4>`;
      return;
    }
    if (line.startsWith("- ")) {
      if (!listOpen) {
        html += "<ul>";
        listOpen = true;
      }
      html += `<li>${formatInline(line.replace(/^-\s+/, ""))}</li>`;
      return;
    }

    if (!line.trim()) {
      closeList();
      return;
    }

    closeList();
    html += `<p>${formatInline(line)}</p>`;
  });

  closeList();
  if (inCode) {
    html += "</code></pre>";
  }
  return html;
}

async function getContentForItem(item) {
  if (!item) return "";
  if (item.content !== null && item.content !== undefined) {
    return item.content;
  }
  if (item.type === "prompt" || item.isText) {
    try {
      const res = await fetch(item.path, { cache: "no-store" });
      if (res.ok) {
        return await res.text();
      }
    } catch (err) {
      return "";
    }
  }
  return "";
}

function setDownloadState(item) {
  if (!item) {
    downloadBtn.classList.add("is-disabled");
    downloadBtn.setAttribute("aria-disabled", "true");
    downloadBtn.href = "#";
    return;
  }
  downloadBtn.classList.remove("is-disabled");
  downloadBtn.removeAttribute("aria-disabled");
  downloadBtn.href = item.path;
  downloadBtn.setAttribute("download", item.title || "download");
}

function setCopyState(enabled) {
  copyBtn.disabled = !enabled;
  if (!enabled) {
    copyBtn.onclick = null;
  }
}

function renderTopbar(item, metaTags, tagLabels) {
  if (!item) {
    topbarTitle.textContent = "选择条目";
    topbarMeta.innerHTML = "";
    return;
  }
  topbarTitle.textContent = item.title;
  const metaBadges = metaTags
    .map((m) => `<span class="tag">${escapeHtml(m)}</span>`)
    .join("");
  const tagBadges = tagLabels
    .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
    .join("");
  topbarMeta.innerHTML = `${metaBadges}${tagBadges}`;
}

function renderDetail(item, content) {
  if (!item) {
    detail.innerHTML = `
      <div class="empty">
        <div class="empty-title">找不到对应内容</div>
        <div class="empty-subtitle">请从左侧重新选择。</div>
      </div>
    `;
    setCopyState(false);
    setDownloadState(null);
    renderTopbar(null, [], []);
    return;
  }

  const tags = (item.tags || [])
    .map((tag) => tag)
    .filter(Boolean);

  const meta = [];
  meta.push(item.type === "prompt" ? "Prompt" : "File");
  if (item.ext) meta.push(item.ext.toUpperCase().replace(".", ""));
  if (item.size) meta.push(formatBytes(item.size));

  renderTopbar(item, meta, tags);

  let body = "";
  let copyText = "";
  if (item.type === "prompt") {
    copyText = content;
    body = `<div class="markdown">${renderMarkdown(content)}</div>`;
  } else if (item.isText && content) {
    copyText = content;
    if (item.ext === ".md") {
      body = `<div class="markdown">${renderMarkdown(content)}</div>`;
    } else {
      body = `<pre class="code-block">${escapeHtml(content)}</pre>`;
    }
  } else {
    body = `
      <div class="empty">
        <div class="empty-title">此文件不支持预览</div>
        <div class="empty-subtitle">请使用右上角的下载功能。</div>
      </div>
    `;
  }

  detail.innerHTML = `
    ${body}
  `;

  setCopyState(Boolean(copyText));
  setDownloadState(item);
  if (copyText) {
    copyBtn.onclick = () => copyToClipboard(copyText);
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
    copyBtn.textContent = "已复制";
    setTimeout(() => (copyBtn.textContent = "复制内容"), 1500);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
  copyBtn.textContent = "已复制";
  setTimeout(() => (copyBtn.textContent = "复制内容"), 1500);
}

function updateLists() {
  const prompts = getFiltered(state.data.prompts, state.query);
  const files = getFiltered(state.data.files, state.query);
  renderList(promptList, prompts, "prompts");
  renderList(fileList, files, "files");
}

async function selectItem(type, id) {
  state.activeType = type;
  state.activeId = id;

  const items = state.data[type];
  const selected = items.find((entry) => entry.id === id);
  const content = await getContentForItem(selected);
  state.activeContent = content;
  renderDetail(selected, content);
  updateLists();

  if (sidebar.classList.contains("open")) {
    sidebar.classList.remove("open");
  }
}

function handleSelection(event) {
  const item = event.target.closest(".list-item");
  if (!item || !item.dataset.id) return;
  selectItem(item.dataset.type, item.dataset.id);
}

function setupEvents() {
  promptList.addEventListener("click", handleSelection);
  fileList.addEventListener("click", handleSelection);

  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    updateLists();
  });

  toggleSidebar.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}

async function init() {
  state.data = await loadManifest();
  updateLists();
  setupEvents();

  if (state.data.prompts.length) {
    selectItem("prompts", state.data.prompts[0].id);
  } else if (state.data.files.length) {
    selectItem("files", state.data.files[0].id);
  }
}

init();
