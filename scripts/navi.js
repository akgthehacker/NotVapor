/**
 * These are the actual navigation items
 */

const navItems = [
  { title: "Home", icon: "fa-home", url: "page/home.html", type: "item" },
  { type: "divider" },
  { title: "Dashboard <span class='badge'>New</span>", icon: "fa-table-columns", type: "item", url: "/page/dash.html" },
  { title: "Games", icon: "fa-gamepad", type: "item", nest: "games" },
  { title: "Entertainment", icon: "fa-clapperboard", type: "item", nest: "extraitems" },
  { type: "divider" },
  { title: "VM <span class='badge'>Offline</span>", icon: "fa-desktop", url: "page/vm-priv.html", type: "item" },
  { title: "Chat", icon: "fa-comments-alt", url: "https://vtx.chat.cdn.cloudflare.net/embed/vapor", type: "item" },
  { title: "Browser", icon: "fa-search", url: "/scram.html", type: "item" },
  { type: "divider" },
  { title: "AI Chat <span class='badge'>UPDATED!</span>", icon: "fa-robot", url: "page/app/ai.html", type: "item" },
  { title: "YouTube", icon: "fa-brands fa-youtube", url: "page/app/yt.html", type: "item" },
  { title: "Music <span class='badge'>Update soon!</span>", icon: "fa-music", url: "page/music.html", type: "item" },
];

const extraNavItems = [
    { title: "Discord", icon: "fa-brands fa-discord", url: "https://discord.gg/BHwm9rrK55", type: "item" },
    { title: "Partners", icon: "fa-handshake", url: "page/partners.html", type: "item", selectable: true },
    { title: "Privacy", icon: "fa-lock", url: "usage.html", type: "item", selectable: true },
];

// === these are nested nav data
var navData = {


  //tools: [
    //{ title: "Password Gen", icon: "fa-key", url: "/page/tool/pass.html", type: "item" },
    //{ title: "Lorem Ipsum Gen", icon: "fa-paragraph", url: "/page/tool/lorem.html", type: "item" },
    //{ title: "Base64 Encoder", icon: "fa-retweet", url: "/page/tool/base64.html", type: "item" },
    //{ title: "URL Encoder", icon: "fa-link", url: "/page/tool/urlencdec.html", type: "item" },
    //{ title: "Stopwatch", icon: "fa-stopwatch", url: "/page/tool/stopwatch.html", type: "item" },
    //{ title: "Public IP", icon: "fa-network-wired", url: "/page/tool/ip.html", type: "item" },
    //{ title: "QR Code", icon: "fa-qrcode", url: "/page/tool/qrcode.html", type: "item" },
  //]

  extraitems: [
    { title: "Movies", icon: "fa-clapperboard", url: "/page/mov.html", type: "item" },
    { title: "TV Shows", icon: "fa-tv", url: "/page/tv.html", type: "item" },
  ]
  

};