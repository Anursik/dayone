import { SETTINGS_STORAGE_KEY } from "@/lib/settings/settings-store";

/**
 * Скрипт выполняется в <head> до отрисовки, чтобы не было «вспышки» светлой темы.
 * Порядок: ручной выбор пользователя → тема Telegram (из URL / sessionStorage) → тема системы.
 */
export const themeInitScript = `(function(){
  var root = document.documentElement;
  function lum(hex){
    if(!hex||typeof hex!=='string')return null;
    var c=hex.replace('#','');
    if(c.length!==6)return null;
    var r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);
    return (0.299*r+0.587*g+0.114*b)<128?'dark':'light';
  }
  function telegramScheme(){
    try{
      var h=location.hash||'';
      var i=h.indexOf('tgWebAppThemeParams=');
      if(i>-1){
        var raw=decodeURIComponent(h.slice(i+20).split('&')[0]);
        var s=lum(JSON.parse(raw).bg_color);
        if(s)return s;
      }
      var stored=sessionStorage.getItem('__telegram__themeParams');
      if(stored){return lum(JSON.parse(stored).bg_color);}
    }catch(e){}
    return null;
  }
  try{
    var mode='system';
    var saved=localStorage.getItem(${JSON.stringify(SETTINGS_STORAGE_KEY)});
    if(saved){var p=JSON.parse(saved);if(p&&(p.theme==='light'||p.theme==='dark'))mode=p.theme;}
    var theme=mode;
    if(mode==='system'){
      theme=telegramScheme()||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
    }
    root.setAttribute('data-theme',theme);
  }catch(e){
    root.setAttribute('data-theme','light');
  }
})();`;
