const mainNavContainer = document.getElementById("nav-items");
const extrasNavContainer = document.getElementById("nav-items-extras");
const nestNavContainer = document.getElementById("nav-items-nest");
const settingsBtn = document.querySelector(".settings-btn");
const extrasBtn = document.querySelector(".extras-btn");
const frame = document.getElementById("frame");

// creds to gn-math/bread
// the GOAT :fire:
const htmlURL = "https://cdn.jsdelivr.net/gh/gn-math/html@main";
const coverURL = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";

let activeNestParent = null;
let lastSelectedNestUrl = null;
const allPanels = [mainNavContainer, extrasNavContainer, nestNavContainer];

let allZonesCache = [];
let allGamesSorted = [];

function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

allPanels.forEach(panel => {
  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'nav-scroll-container';
  const itemList = document.createElement('div');
  itemList.className = 'nav-item-list';
  while (panel.firstChild) { itemList.appendChild(panel.firstChild); }
  scrollContainer.appendChild(itemList);
  panel.appendChild(scrollContainer);
});

function handleBottomMask(scrollContainer) {
  const el = scrollContainer;
  const isScrollable = el.scrollHeight > el.clientHeight;
  const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 5;
  el.classList.toggle('mask-bottom', isScrollable && !isAtBottom);
}
document.querySelectorAll('.nav-scroll-container').forEach(sc => {
  sc.addEventListener('scroll', () => handleBottomMask(sc));
  new ResizeObserver(() => handleBottomMask(sc)).observe(sc);
  new MutationObserver(() => handleBottomMask(sc)).observe(sc.parentElement, { attributes: true, attributeFilter: ['class']});
});

const MAX_RECENTLY_PLAYED = 45;

function getFromStorage(key) { try { const i = localStorage.getItem(key); return i ? JSON.parse(i) : []; } catch (e) { console.error(`Failed to parse ${key}`, e); return []; } }
function saveToStorage(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error(`Failed to save ${key}`, e); } }
function toggleFavorite(gameName) { let f = getFromStorage('favoriteGames'); if (f.includes(gameName)) { f = f.filter(n => n !== gameName); } else { f.push(gameName); } saveToStorage('favoriteGames', f); }
function addRecentlyPlayed(game) { let r = getFromStorage('recentlyPlayed'); r = r.filter(i => i.name !== game.name); r.unshift(game); if (r.length > MAX_RECENTLY_PLAYED) { r = r.slice(0, MAX_RECENTLY_PLAYED); } saveToStorage('recentlyPlayed', r); }

async function precacheZones() {
  try {
    const response = await fetch('/_a/zones.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const zones = await response.json();
    allZonesCache = zones;
    console.log(`Successfully pre-cached ${allZonesCache.length} zones.`);
  } catch (error) {
    console.error("Failed to pre-cache zones:", error);
    allZonesCache = null;
  }
}


const VIRTUAL_ITEM_HEIGHT = 40;
const VIRTUAL_BUFFER = 5;      

function setupVirtualScroll(gameListContainer, sortedGames) {
    const scrollContainer = nestNavContainer.querySelector('.nav-scroll-container');
    gameListContainer.innerHTML = ''; 

    const sizer = document.createElement('div');
    sizer.className = 'virtual-scroll-sizer';
    sizer.style.height = `${sortedGames.length * VIRTUAL_ITEM_HEIGHT}px`;

    const visibleItemsContainer = document.createElement('div');
    visibleItemsContainer.className = 'virtual-scroll-list';

    sizer.appendChild(visibleItemsContainer);
    gameListContainer.appendChild(sizer);

    let lastRenderedStart = -1;

    function renderVisibleItems() {
        const scrollTop = scrollContainer.scrollTop;
        const viewportHeight = scrollContainer.clientHeight;

        const startIndex = Math.max(0, Math.floor(scrollTop / VIRTUAL_ITEM_HEIGHT) - VIRTUAL_BUFFER);
        const endIndex = Math.min(sortedGames.length, Math.ceil((scrollTop + viewportHeight) / VIRTUAL_ITEM_HEIGHT) + VIRTUAL_BUFFER);

        if (startIndex === lastRenderedStart) return;
        lastRenderedStart = startIndex;

        const fragment = document.createDocumentFragment();

        for (let i = startIndex; i < endIndex; i++) {
            const zone = sortedGames[i];
            const navLink = createGameItemElement(zone);
            fragment.appendChild(navLink);
        }

        visibleItemsContainer.innerHTML = '';
        visibleItemsContainer.appendChild(fragment);
        visibleItemsContainer.style.transform = `translateY(${startIndex * VIRTUAL_ITEM_HEIGHT}px)`;
    }
    
    scrollContainer.onscroll = debounce(renderVisibleItems, 10);
    renderVisibleItems();
}

function createGameItemElement(zone) {
    const navLink = document.createElement('a');
    const favorites = getFromStorage('favoriteGames');
    const isFavorited = favorites.includes(zone.name);

    navLink.className = 'nav-item';
    if (isFavorited) navLink.classList.add('nav-item-favorited');
    navLink.href = '#';

    if (zone.blank === true) {
        navLink.style.opacity = '0.6';
        navLink.style.cursor = 'default';
    }
    
    navLink.innerHTML = `
      <div class="icon-container">
        <i class="fa-regular fa-gamepad game-icon-default"></i>
        <i class="game-icon-star ${isFavorited ? 'fa-solid' : 'fa-regular'} fa-star"></i>
      </div>
      <span class="nav-text">${zone.name}</span>
    `;
    
    const iconContainer = navLink.querySelector('.icon-container');
    iconContainer.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(zone.name);
        updateAndRenderGames(document.querySelector('.game-search-input').value);
    };
    
    navLink.onclick = (e) => {
      e.preventDefault();
      if (zone.blank === true) return;
      addRecentlyPlayed(zone);

      if (zone.redirect === true) {
        window.open(zone.url.startsWith('http') ? zone.url : zone.url.replace("{HTML_URL}", htmlURL), '_blank');
        return;
      }
      let targetFrameUrl = zone.direct
        ? `/page/gameframe.html?url=${encodeURIComponent(zone.url)}&name=${encodeURIComponent(zone.name)}&direct=true`
        : `/page/gameframe.html?url=${encodeURIComponent(zone.url.replace("{HTML_URL}", htmlURL))}&name=${encodeURIComponent(zone.name)}`;

      frame.src = targetFrameUrl;
      lastSelectedNestUrl = targetFrameUrl;
      updateActiveStates(navLink);
    };
    
    return navLink;
}

function updateAndRenderGames(query = '') {
    const gameListContainer = document.querySelector('.game-list-dynamic-container');
    const noResultsMessage = document.querySelector('.no-results-message');
    if (!gameListContainer) return;

    const lowerCaseQuery = query.toLowerCase();

    const favorites = getFromStorage('favoriteGames');
    const recentlyPlayed = getFromStorage('recentlyPlayed');
    const recentNames = recentlyPlayed.map(g => g.name);

    let sourceGames = lowerCaseQuery 
        ? allZonesCache.filter(zone => zone.name.toLowerCase().includes(lowerCaseQuery)) 
        : [...allZonesCache];

    const displayRecent = localStorage.getItem('displayRecentGames') !== 'false';

    const favoritedGames = sourceGames.filter(zone => favorites.includes(zone.name));
    
    if (displayRecent) {
        const recentGames = sourceGames.filter(zone => recentNames.includes(zone.name) && !favorites.includes(zone.name));
        const regularGames = sourceGames
            .filter(zone => !favorites.includes(zone.name) && !recentNames.includes(zone.name))
            .sort((a, b) => a.name.localeCompare(b.name));
        allGamesSorted = [...favoritedGames, ...recentGames, ...regularGames];
    } else {
        const otherGames = sourceGames
            .filter(zone => !favorites.includes(zone.name))
            .sort((a, b) => a.name.localeCompare(b.name));
        allGamesSorted = [...favoritedGames, ...otherGames];
    }
    
    noResultsMessage.style.display = (allGamesSorted.length === 0 && lowerCaseQuery) ? 'flex' : 'none';
    
    setupVirtualScroll(gameListContainer, allGamesSorted);
}

function showGamesPanel() {
  const itemList = nestNavContainer.querySelector('.nav-item-list');
  itemList.innerHTML = '';
  nestNavContainer.querySelector('.nav-scroll-container').onscroll = null;

  const backLink = document.createElement("a");
  backLink.className = "nav-item";
  backLink.innerHTML = `<div class="icon-container"><i class="fa-regular fa-chevron-left"></i></div><span class="nav-text">Back</span>`;
  backLink.href = "#";
  backLink.onclick = (e) => { e.preventDefault(); mainNavContainer.classList.remove('nest-active'); nestNavContainer.classList.remove('active'); updateActiveStates(activeNestParent); };

  const searchContainer = document.createElement('div');
  searchContainer.className = 'game-search-container';
  searchContainer.innerHTML = `<i class="fa-regular fa-search game-search-icon"></i><input type="text" placeholder="Filter games..." class="game-search-input">`;
  const searchInput = searchContainer.querySelector('input');

  const noResultsMessage = document.createElement('a');
  noResultsMessage.className = 'nav-item no-results-message';
  noResultsMessage.innerHTML = `<span class="nav-text" style="opacity:1;">No matching games found.</span>`;
  noResultsMessage.style.display = 'none';
  
  const divider1 = document.createElement('div');
  divider1.className = 'nav-divider';
  
  const gameListContainer = document.createElement('div');
  gameListContainer.className = 'game-list-dynamic-container';

  itemList.append(backLink, searchContainer, divider1, gameListContainer, noResultsMessage);

  if (allZonesCache === null) {
    gameListContainer.innerHTML = '<a class="nav-item"><span class="nav-text" style="opacity:1; color: #ff8a8a;">Error loading games.</span></a>';
    return;
  }
  
  updateAndRenderGames();
  searchInput.addEventListener('input', debounce(() => updateAndRenderGames(searchInput.value), 500));
}


function showNestPanel(nestKey, parentElement) {
  activeNestParent = parentElement;
  mainNavContainer.classList.add('nest-active');
  nestNavContainer.classList.add('active');
  extrasNavContainer.classList.remove('active');
  extrasBtn.classList.remove('active');

  if (nestKey === 'games') {
    showGamesPanel();
  } else {
    nestNavContainer.querySelector('.nav-scroll-container').onscroll = null;
    const items = navData[nestKey];
    if (!items) { console.error(`Nest data for '${nestKey}' not found.`); return; }
    const itemList = nestNavContainer.querySelector('.nav-item-list');
    itemList.innerHTML = '';
    const backLink = document.createElement("a");
    backLink.className = "nav-item";
    backLink.innerHTML = `<div class="icon-container"><i class="fa-regular fa-chevron-left"></i></div><span class="nav-text">Back</span>`;
    backLink.href = "#";
    backLink.onclick = (e) => { e.preventDefault(); mainNavContainer.classList.remove('nest-active'); nestNavContainer.classList.remove('active'); updateActiveStates(activeNestParent); };
    itemList.appendChild(backLink);
    itemList.appendChild(document.createElement("div")).className = "nav-divider";
    populateNav(itemList, items, false);
  }
}

function updateActiveStates(activeElement) {
  document.querySelectorAll(".nav-item, .quick-action-btn").forEach(el => el.classList.remove("active"));
  if (activeElement) {
    activeElement.classList.add("active");
    if (extrasNavContainer.contains(activeElement)) extrasBtn.classList.add("active");
  }
  if (activeNestParent) activeNestParent.classList.add("active");
}

function createNavItem(item, container, isInitialLoad) {
  if (item.type === "divider") {
    container.appendChild(document.createElement("div")).className = "nav-divider";
    return;
  }

  const navLink = document.createElement("a");
  navLink.className = "nav-item";

  const title = item.title;
  let iconHtml;

  if (item.icon) {
    let iconClasses = item.icon;
    if (!/fa-(solid|regular|brands)/.test(iconClasses)) {
        iconClasses = `fa-regular ${iconClasses}`;
    }
    iconHtml = `<i class="${iconClasses}"></i>`;
  } else {
    iconHtml = `<i class="fa-regular fa-question-circle"></i>`;
  }

  const nestChevron = item.nest ? `<i class="fa-regular fa-chevron-right nav-chevron"></i>` : '';
  navLink.innerHTML = `<div class="icon-container">${iconHtml}</div><span class="nav-text">${title}${nestChevron}</span>`;
  navLink.href = "#";

  if (isInitialLoad && item.title === "Home") {
    navLink.classList.add("active");
    frame.src = item.url;
  }
  
  if (container.parentElement.parentElement === nestNavContainer && item.url === lastSelectedNestUrl) {
    navLink.classList.add('active');
  }

  navLink.onclick = (e) => {
    e.preventDefault();
    if (item.nest) {
      showNestPanel(item.nest, navLink);
    } else if (item.url) {
      frame.src = item.url;
      if (nestNavContainer.contains(container)) {
        lastSelectedNestUrl = item.url;
      } else {
        lastSelectedNestUrl = null; activeNestParent = null;
        mainNavContainer.classList.remove('nest-active', 'extras-active');
        nestNavContainer.classList.remove('active');
        extrasNavContainer.classList.remove('active');
        extrasBtn.classList.remove('active');
      }
    }
    updateActiveStates(navLink);
  };
  container.appendChild(navLink);
}

extrasBtn.onclick = () => {
  const isActive = extrasNavContainer.classList.contains('active');
  mainNavContainer.classList.toggle('extras-active', !isActive);
  extrasNavContainer.classList.toggle('active', !isActive);
  extrasBtn.classList.toggle('active', !isActive);
  mainNavContainer.classList.remove('nest-active');
  nestNavContainer.classList.remove('active');
  settingsBtn.classList.remove('active');
};
settingsBtn.onclick = () => {
  frame.src = "page/options.html";
  mainNavContainer.classList.remove('nest-active', 'extras-active');
  nestNavContainer.classList.remove('active');
  extrasNavContainer.classList.remove('active');
  extrasBtn.classList.remove('active');
  updateActiveStates(settingsBtn);
};

document.addEventListener('keydown', async (e) => {
    if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        const gamesNavItem = [...document.querySelectorAll('.nav-item .nav-text')].find(el => el.textContent.trim() === 'Games')?.parentElement;
        if (gamesNavItem) { gamesNavItem.classList.add('flash-feedback'); setTimeout(() => gamesNavItem.classList.remove('flash-feedback'), 400); }
        await precacheZones();
        if (nestNavContainer.classList.contains('active') && activeNestParent === gamesNavItem) showGamesPanel();
    }
});

function populateNav(container, items, isInitial) {
  if (isInitial) container.innerHTML = "";
  items.forEach((item) => createNavItem(item, container, isInitial));
}

populateNav(mainNavContainer.querySelector('.nav-item-list'), navItems, true);
populateNav(extrasNavContainer.querySelector('.nav-item-list'), extraNavItems, true);
precacheZones();

window.addEventListener('load', () => {
  document.querySelectorAll('.nav-scroll-container').forEach(sc => setTimeout(() => handleBottomMask(sc), 150));
});